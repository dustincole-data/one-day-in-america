/**
 * Build the validated respondent-day × activity-episode extract (ticket 03).
 *
 * Contract, from `research/02-atus-source/findings.md`:
 *   S1  spine = Activity file joined to Respondent file on TUCASEID; never the Activity Summary
 *       file for minutes (its `t######` column set is year-specific)
 *   S2  the diary day runs 4:00 a.m. → 4:00 a.m.; durations are TUACTDUR24, never TUACTDUR
 *   S3  every estimate is weighted by TUFINLWGT
 *   S4  2019 / 2023 / 2024 are directly comparable on TUFINLWGT; D = 365 / 365 / 366
 *   S5  the activity lexicon needs no crosswalk across these years
 *   S10 −1 / −2 / −3 are sentinels (−1 also means out of universe), and 50xxxx is real uncodeable
 *       time that must not be dropped
 *
 * Everything BLS only *asserts* is checked here before a single number is computed. A failed
 * invariant aborts: an extract that is silently wrong is worse than no extract.
 *
 *   npm run data:build
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { EXTRACT_DIR, minutesSince4am, readDat } from './atus/dat.ts';
import { majorOf } from './atus/categories.ts';
import { DAYS_IN_YEAR, YEARS, type Year } from './atus/manifest.ts';

const failures: string[] = [];

function check(ok: boolean, label: string, detail = ''): void {
  if (ok) {
    console.log(`    PASS  ${label}`);
  } else {
    console.log(`    FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
  }
}

/** Columns carried from the Respondent file (S1) — all ATUS-side, none redefined across 2019↔2024. */
const RESP_FIELDS = [
  'TUFINLWGT',
  'TUYEAR',
  'TUMONTH',
  'TUDIARYDATE',
  'TUDIARYDAY',
  'TRHOLIDAY',
  'TELFS',
  'TRDPFTPT',
  'TEHRUSLT',
  'TRCHILDNUM',
  'TRHHCHILD',
  'TRYHHCHILD',
  'TRSPPRES',
  'TESPEMPNOT',
  'TEMJOT',
  'TESCHENR',
] as const;

/**
 * Columns taken from the Activity Summary file. Age, sex, race, ethnicity, education and metro
 * status are on no other file this project downloads (the Respondent file carries no `TEAGE`,
 * `TESEX` or `G`-prefixed variable at all). Only these fixed-name demographics are read — never the
 * `t######` minute columns, which is the trap S1 rules out.
 */
const SUM_FIELDS = ['TEAGE', 'TESEX', 'PEEDUCA', 'PTDTRACE', 'PEHSPNON', 'GTMETSTA'] as const;

interface Episode {
  caseid: string;
  n: number;
  /** Minutes since the 4:00 a.m. diary-day origin, 0–1439. */
  start4: number;
  /** TUACTDUR24 — truncated at 4:00 a.m. so the day sums to exactly 1440. */
  dur: number;
  code: string;
  /** TEWHERE. −1 is out of universe (sleeping, grooming, …), not a location. */
  where: number;
  /** TUCUMDUR24 as published, kept so the running total can be checked against it. */
  cum: number;
}

function buildYear(year: Year): void {
  console.log(`\n${year}`);

  const act = readDat(`atusact_${year}`);
  const resp = readDat(`atusresp_${year}`);
  const sum = readDat(`atussum_${year}`);

  // ---- Respondent / Summary keys ------------------------------------------------------------
  const rId = resp.index('TUCASEID');
  const sId = sum.index('TUCASEID');
  const respIds = new Set(resp.rows.map((r) => r[rId]));
  const sumIds = new Set(sum.rows.map((r) => r[sId]));
  check(respIds.size === resp.rows.length, 'TUCASEID unique on the Respondent file', `${resp.rows.length} rows, ${respIds.size} distinct`);
  check(sumIds.size === sum.rows.length, 'TUCASEID unique on the Activity Summary file', `${sum.rows.length} rows, ${sumIds.size} distinct`);
  check(respIds.size === sumIds.size && [...respIds].every((id) => sumIds.has(id)), 'Respondent and Summary cover the same respondents');

  // ---- Episodes ------------------------------------------------------------------------------
  const aId = act.index('TUCASEID');
  const aN = act.index('TUACTIVITY_N');
  const aStart = act.index('TUSTARTTIM');
  const aStop = act.index('TUSTOPTIME');
  const aDur = act.index('TUACTDUR24');
  const aCum = act.index('TUCUMDUR24');
  const aCode = act.index('TRCODE');
  const aWhere = act.index('TEWHERE');
  const aRawDur = act.index('TUACTDUR');

  const episodes: Episode[] = act.rows.map((r) => ({
    caseid: r[aId],
    n: Number(r[aN]),
    start4: minutesSince4am(r[aStart]),
    dur: Number(r[aDur]),
    code: r[aCode],
    where: Number(r[aWhere]),
    cum: Number(r[aCum]),
  }));

  let badDur = 0;
  let badCode = 0;
  let badStop = 0;
  for (let i = 0; i < episodes.length; i++) {
    const e = episodes[i];
    if (!Number.isInteger(e.dur) || e.dur < 1 || e.dur > 1440) badDur++;
    if (!/^\d{6}$/.test(e.code)) badCode++;
    // TUSTOPTIME is the untruncated stop; only a day's last episode, truncated at 4 a.m. by
    // TUACTDUR24, is allowed to disagree with start + duration.
    const stop4 = minutesSince4am(act.rows[i][aStop]);
    if ((e.start4 + e.dur) % 1440 !== stop4 && e.dur === Number(act.rows[i][aRawDur])) badStop++;
  }
  check(badDur === 0, 'TUACTDUR24 is an integer in 1…1440', `${badDur} rows out of range`);
  check(badCode === 0, 'TRCODE is a 6-digit code', `${badCode} rows malformed`);
  check(badStop === 0, 'start + TUACTDUR24 = TUSTOPTIME on every untruncated episode', `${badStop} rows`);

  // Group by respondent-day, in file order (the file is already ordered by case then sequence).
  const byCase = new Map<string, Episode[]>();
  for (const e of episodes) {
    const list = byCase.get(e.caseid);
    if (list) list.push(e);
    else byCase.set(e.caseid, [e]);
  }

  let notSequential = 0;
  let not1440 = 0;
  let chainBroken = 0;
  let cumWrong = 0;
  for (const [, list] of byCase) {
    let running = 0;
    for (let k = 0; k < list.length; k++) {
      const e = list[k];
      if (e.n !== k + 1) notSequential++;
      if (e.start4 !== running) chainBroken++;
      running += e.dur;
      if (e.cum !== running) cumWrong++;
    }
    if (running !== 1440) not1440++;
  }
  check(notSequential === 0, 'TUACTIVITY_N runs 1…n with no gaps within a diary day', `${notSequential} episodes`);
  check(not1440 === 0, 'every respondent-day sums to exactly 1440 minutes of TUACTDUR24', `${not1440} days`);
  check(chainBroken === 0, 'episode start times chain contiguously from the 4:00 a.m. origin', `${chainBroken} episodes`);
  check(cumWrong === 0, 'running duration equals TUCUMDUR24 at every episode', `${cumWrong} episodes`);
  check(
    byCase.size === respIds.size && [...byCase.keys()].every((id) => respIds.has(id)),
    'Activity and Respondent files cover the same respondents',
    `${byCase.size} activity cases vs ${respIds.size} respondents`,
  );

  // ---- Cross-check against the Activity Summary file ------------------------------------------
  // Independent proof that the code+duration read is right: BLS's own pre-summed minutes per
  // 6-digit code must equal what the Activity file yields, for every column the year publishes.
  const tCols = sum.columns.map((c, i) => [c, i] as const).filter(([c]) => /^t\d{6}$/.test(c));
  const perCase = new Map<string, Map<string, number>>();
  for (const [caseid, list] of byCase) {
    const m = new Map<string, number>();
    for (const e of list) m.set(e.code, (m.get(e.code) ?? 0) + e.dur);
    perCase.set(caseid, m);
  }
  let sumMismatch = 0;
  for (const r of sum.rows) {
    const mine = perCase.get(r[sId]);
    if (!mine) continue;
    let seen = 0;
    for (const [col, i] of tCols) {
      const published = Number(r[i]);
      const ours = mine.get(col.slice(1)) ?? 0;
      if (published !== ours) sumMismatch++;
      seen += published;
    }
    if (seen !== 1440) sumMismatch++;
  }
  check(
    sumMismatch === 0,
    `per-respondent minutes per activity code match the Activity Summary file (${tCols.length} codes × ${sum.rows.length} respondents)`,
    `${sumMismatch} cells differ`,
  );

  // Every code must land in a published category, or the 1440-minute day silently leaks.
  const unmapped = new Set<string>();
  for (const e of episodes) {
    try {
      majorOf(e.code);
    } catch {
      unmapped.add(e.code);
    }
  }
  check(unmapped.size === 0, 'every activity code maps to a published BLS category', [...unmapped].join(', '));

  // ---- Weights --------------------------------------------------------------------------------
  const wIdx = resp.index('TUFINLWGT');
  const dayIdx = resp.index('TUDIARYDAY');
  let sumW = 0;
  let sumWeekend = 0;
  for (const r of resp.rows) {
    const w = Number(r[wIdx]);
    sumW += w;
    const d = Number(r[dayIdx]); // 1 = Sunday … 7 = Saturday
    if (d === 1 || d === 7) sumWeekend += w;
  }
  const D = DAYS_IN_YEAR[year];
  const population = sumW / D;
  const weekendShare = sumWeekend / sumW;
  console.log(`    Σ TUFINLWGT = ${Math.round(sumW).toLocaleString()} person-days`);
  console.log(`    ÷ D=${D} → ${(population / 1e6).toFixed(1)}M people (civilian noninstitutional, 15+, households)`);
  console.log(`    weighted weekend share ${(weekendShare * 100).toFixed(2)}% (2/7 = 28.57%); unweighted ${((resp.rows.filter((r) => [1, 7].includes(Number(r[dayIdx]))).length / resp.rows.length) * 100).toFixed(2)}%`);
  check(Math.abs(weekendShare - 2 / 7) < 0.005, 'weighted weekend days land at 2/7 of the day-of-week distribution');

  // ---- Sentinels and uncodeable time (S10) ----------------------------------------------------
  const whereCounts = new Map<number, number>();
  let uncodeableMinutes = 0;
  let totalMinutes = 0;
  for (const e of episodes) {
    whereCounts.set(e.where, (whereCounts.get(e.where) ?? 0) + 1);
    totalMinutes += e.dur;
    if (e.code.startsWith('50')) uncodeableMinutes += e.dur;
  }
  const sentinels = [-1, -2, -3].map((s) => `${s}: ${(whereCounts.get(s) ?? 0).toLocaleString()}`).join('  ');
  console.log(`    TEWHERE sentinels — ${sentinels}  (of ${episodes.length.toLocaleString()} episodes)`);
  console.log(`    50xxxx uncodeable time = ${((uncodeableMinutes / totalMinutes) * 100).toFixed(2)}% of all minutes — kept, not dropped`);

  // ---- Write the extract -----------------------------------------------------------------------
  const respIdx = Object.fromEntries(RESP_FIELDS.map((f) => [f, resp.index(f)])) as Record<string, number>;
  const sumIdx = Object.fromEntries(SUM_FIELDS.map((f) => [f, sum.index(f)])) as Record<string, number>;
  const sumByCase = new Map(sum.rows.map((r) => [r[sId], r]));

  // Derived per respondent-day, because telework and commuting exist only in the episode stream:
  // work = tier 1 05, commute = tier 2 1805, work at home = work episodes with TEWHERE = 1.
  const derived = new Map<string, { work: number; commute: number; workHome: number }>();
  for (const [caseid, list] of byCase) {
    let work = 0;
    let commute = 0;
    let workHome = 0;
    for (const e of list) {
      if (e.code.startsWith('05')) {
        work += e.dur;
        if (e.where === 1) workHome += e.dur;
      }
      if (e.code.startsWith('1805')) commute += e.dur;
    }
    derived.set(caseid, { work, commute, workHome });
  }

  const respHeader = ['TUCASEID', ...RESP_FIELDS, ...SUM_FIELDS, 'WORK_MIN', 'COMMUTE_MIN', 'WORK_AT_HOME_MIN'];
  const respOut = [respHeader.join(',')];
  for (const r of resp.rows) {
    const id = r[rId];
    const s = sumByCase.get(id)!;
    const d = derived.get(id)!;
    respOut.push(
      [
        id,
        ...RESP_FIELDS.map((f) => r[respIdx[f]]),
        ...SUM_FIELDS.map((f) => s[sumIdx[f]]),
        d.work,
        d.commute,
        d.workHome,
      ].join(','),
    );
  }

  const epOut = ['TUCASEID,N,START_MIN_FROM_4AM,DUR_MIN,TRCODE,TEWHERE,MAJOR'];
  for (const e of episodes) {
    epOut.push(`${e.caseid},${e.n},${e.start4},${e.dur},${e.code},${e.where},${majorOf(e.code)}`);
  }

  mkdirSync(EXTRACT_DIR, { recursive: true });
  writeFileSync(join(EXTRACT_DIR, `respondents-${year}.csv`), respOut.join('\n'), 'utf8');
  writeFileSync(join(EXTRACT_DIR, `episodes-${year}.csv`), epOut.join('\n'), 'utf8');
  console.log(`    wrote respondents-${year}.csv (${resp.rows.length.toLocaleString()} rows) and episodes-${year}.csv (${episodes.length.toLocaleString()} rows)`);
}

for (const year of YEARS) buildYear(year);

if (failures.length > 0) {
  console.error(`\n${failures.length} invariant(s) failed:\n  ${failures.join('\n  ')}`);
  process.exit(1);
}
console.log('\nAll invariants passed. Extract written to data/extract/.');
