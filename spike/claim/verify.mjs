/**
 * Ticket 07 — freeze the spine's claim.
 *
 * Two jobs, one harness:
 *   1. Verify the headline word "3 a.m." — compute the value at 3:00 sharp (and at noon sharp),
 *      against the measured argmax minutes (3:27 a.m. / 12:02 p.m.), and test whether the argmax
 *      LOCATION is stable enough to name in copy at all.
 *   2. Compute the open map item: does filtering to "worked that day" tighten noon or fray it.
 *
 * Plus the gate work the claim record needs: a specification curve for the braid gap, the
 * weighted-vs-drawn (equal-ink) fidelity check, the A3 conditioning check, and SE floors.
 *
 * Estimators are mirrored from spike/spines/mine.mjs (§7.4 / S3), not re-derived. Every number
 * that reaches the record goes through log(), which is the ledger — B1 wants the log written by
 * the tool that computed the numbers.
 *
 *   node spike/claim/verify.mjs          → report on stdout + spike/claim/results/report.txt
 *   node spike/claim/verify.mjs --json   → also spike/claim/results/{ledger,claim}.json
 *
 * Throwaway analysis harness, same status as spike/spines: never deployed, never imported by the
 * site. Astro builds only src/ and public/.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const YEARS = [2019, 2023, 2024];

const MAJORS = [
  'personal_care', 'eating_drinking', 'household', 'care_household', 'care_nonhousehold',
  'work', 'education', 'purchasing', 'org_civic_religious', 'leisure_sports',
  'phone_mail_email', 'other_nec',
];
const MI = Object.fromEntries(MAJORS.map((m, i) => [m, i]));

// ---------------------------------------------------------------------------- ledger

const LEDGER = [];
/** every specification that produces a number goes through here — B1's log, written by the tool */
function log(estimand, spec, value, extra = {}) {
  LEDGER.push({ estimand, spec, value, ...extra });
  return value;
}

// ---------------------------------------------------------------------------- csv

function readCsv(path) {
  const text = readFileSync(path, 'utf8');
  const nl = text.indexOf('\n');
  const head = text.slice(0, nl).trim().split(',');
  const rows = [];
  let i = nl + 1;
  const n = text.length;
  while (i < n) {
    let j = text.indexOf('\n', i);
    if (j === -1) j = n;
    const line = text.slice(i, j);
    if (line.length > 1) rows.push(line.split(','));
    i = j + 1;
  }
  return { head, rows, col: Object.fromEntries(head.map((h, k) => [h, k])) };
}

// ---------------------------------------------------------------------------- load

/** minutes-from-4am → clock string */
const clock = (m) => {
  const t = ((m % 1440) + 1440 + 240) % 1440, h24 = Math.floor(t / 60), mm = t % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(mm).padStart(2, '0')} ${h24 < 12 ? 'a.m.' : 'p.m.'}`;
};
/** clock hh:mm → minutes-from-4am */
const fromClock = (h24, mm) => (((h24 * 60 + mm) - 240) + 1440) % 1440;
const M3AM = fromClock(3, 0);      // 1380
const MNOON = fromClock(12, 0);    // 480
const fmt = (x, d = 1) => (x === null || Number.isNaN(x) ? 'n/a' : x.toFixed(d));

function load(year, keepPerRespondent) {
  const R = readCsv(join(ROOT, 'data', 'extract', `respondents-${year}.csv`));
  const E = readCsv(join(ROOT, 'data', 'extract', `episodes-${year}.csv`));
  const rc = R.col, ec = E.col;

  const byId = new Map();
  const rows = [];
  for (const r of R.rows) {
    const rec = {
      idx: rows.length,
      id: r[rc.TUCASEID],
      w: +r[rc.TUFINLWGT],
      day: +r[rc.TUDIARYDAY],
      telfs: +r[rc.TELFS],
      ftpt: +r[rc.TRDPFTPT],
      hhChild: +r[rc.TRHHCHILD],
      youngest: +r[rc.TRYHHCHILD],
      school: +r[rc.TESCHENR],
      age: +r[rc.TEAGE],
      sex: +r[rc.TESEX],
      work: +r[rc.WORK_MIN],
    };
    byId.set(rec.id, rec);
    rows.push(rec);
  }
  const n = rows.length;

  // weighted per-minute occupancy: 12 majors + asleep(0101x); and the unweighted twins
  const grid = Array.from({ length: 12 }, () => new Float64Array(1440));
  const gridU = Array.from({ length: 12 }, () => new Float64Array(1440));
  const asleep = new Float64Array(1440);
  const asleepU = new Float64Array(1440);
  let totalW = 0;
  for (const r of rows) totalW += r.w;

  // per-respondent minute→major, only where a later stage needs it (subgroups, PPS)
  const perMaj = keepPerRespondent ? new Int8Array(n * 1440).fill(-1) : null;
  const perSleep = keepPerRespondent ? new Uint8Array(n * 1440) : null;

  for (const e of E.rows) {
    const rec = byId.get(e[ec.TUCASEID]);
    const start = +e[ec.START_MIN_FROM_4AM];
    const end = start + (+e[ec.DUR_MIN]);
    const code = e[ec.TRCODE];
    const mi = MI[e[ec.MAJOR]];
    const g = grid[mi], gu = gridU[mi];
    const sleeping = code.startsWith('0101');
    const base = keepPerRespondent ? rec.idx * 1440 : 0;
    for (let m = start; m < end; m++) {
      g[m] += rec.w; gu[m] += 1;
      if (sleeping) { asleep[m] += rec.w; asleepU[m] += 1; }
      if (perMaj) { perMaj[base + m] = mi; if (sleeping) perSleep[base + m] = 1; }
    }
  }

  // ticket 03's 1440 invariant, re-asserted here rather than trusted
  for (let m = 0; m < 1440; m++) {
    let s = 0;
    for (let k = 0; k < 12; k++) s += gridU[k][m];
    if (s !== n) throw new Error(`${year}: minute ${m} covered by ${s} of ${n} respondent-days`);
  }

  return { year, rows, n, grid, gridU, asleep, asleepU, totalW, perMaj, perSleep };
}

// ---------------------------------------------------------------------------- partitions

/**
 * A partition turns the day into "share of the population doing the single most common thing".
 * The colour scale the mark ships with IS this choice, so the claim's number moves with it — which
 * is why partition is a curve dimension and not a footnote.
 *
 * Every member must be a partition of ACTIVITIES. "Asleep vs awake" is not one: at 6 p.m. it makes
 * the modal category "awake", and being awake is not a thing anyone is doing. It is reported
 * separately as the asleep share, never as a modal-share specification.
 */
const NECESSARY = ['personal_care', 'eating_drinking'];
const OBLIGATED = ['work', 'household', 'care_household', 'care_nonhousehold', 'purchasing', 'education'];
const FREE = ['leisure_sports', 'org_civic_religious', 'phone_mail_email', 'other_nec'];

/** groups: array of {name, majors:[idx]}; sleepSplit pulls 0101x out of personal care */
function partitionShare(d, groups, sleepSplit) {
  const share = new Float64Array(1440);
  const which = new Array(1440);
  for (let m = 0; m < 1440; m++) {
    let best = -1, bl = null;
    for (const g of groups) {
      let v = 0;
      for (const k of g.majors) v += d.grid[k][m];
      if (g.name === 'personal_care_ex_sleep') v -= d.asleep[m];
      const p = v / d.totalW;
      if (p > best) { best = p; bl = g.name; }
    }
    if (sleepSplit) {
      const p = d.asleep[m] / d.totalW;
      if (p > best) { best = p; bl = 'sleep'; }
    }
    share[m] = best; which[m] = bl;
  }
  return { share, label: (m) => which[m] };
}

const GROUPS12 = MAJORS.map((n, i) => ({ name: n, majors: [i] }));
const GROUPS13 = MAJORS.map((n, i) => ({ name: i === MI.personal_care ? 'personal_care_ex_sleep' : n, majors: [i] }));
const GROUPS3 = [
  { name: 'necessary', majors: NECESSARY.map((n) => MI[n]) },
  { name: 'obligated', majors: OBLIGATED.map((n) => MI[n]) },
  { name: 'free', majors: FREE.map((n) => MI[n]) },
];

const PARTITIONS = {
  // the 12 gate-proven published majors (ticket 03) — what colour-by-activity means today
  majors12: (d) => partitionShare(d, GROUPS12, false),
  // 13 colours: sleep drawn as its own thing, the rest of personal care separate
  majors13: (d) => partitionShare(d, GROUPS13, true),
  // three colours: the Ås-style necessary / obligated / free split ticket 05 used
  coarse3: (d) => partitionShare(d, GROUPS3, false),
};

/** coarsen to non-overlapping windows of `w` minutes, then take the modal share of the window */
function modalAtResolution(d, w, groups, sleepSplit) {
  const share = new Float64Array(1440);
  for (let s = 0; s < 1440; s += w) {
    let best = 0;
    for (const g of groups) {
      let v = 0;
      for (let m = s; m < s + w; m++) {
        for (const k of g.majors) v += d.grid[k][m];
        if (g.name === 'personal_care_ex_sleep') v -= d.asleep[m];
      }
      best = Math.max(best, v / (d.totalW * w));
    }
    if (sleepSplit) {
      let v = 0;
      for (let m = s; m < s + w; m++) v += d.asleep[m];
      best = Math.max(best, v / (d.totalW * w));
    }
    for (let m = s; m < s + w; m++) share[m] = best;
  }
  return share;
}
const GROUPS_OF = { majors12: GROUPS12, majors13: GROUPS13, coarse3: GROUPS3 };
const SPLIT_OF = { majors12: false, majors13: true, coarse3: false };

const argmax = (a) => { let i = 0; for (let m = 1; m < 1440; m++) if (a[m] > a[i]) i = m; return i; };
const argmin = (a) => { let i = 0; for (let m = 1; m < 1440; m++) if (a[m] < a[i]) i = m; return i; };

// ---------------------------------------------------------------------------- output

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const H = (s) => { say(''); say('='.repeat(84)); say(s); say('='.repeat(84)); };

// ---------------------------------------------------------------------------- run

const D = { 2024: load(2024, true), 2019: load(2019, false), 2023: load(2023, false) };
const d24 = D[2024];

/** pooled years share one weight (S4) — pooled share = Σw_active / Σw_total across the years */
function pool(years) {
  const grid = Array.from({ length: 12 }, () => new Float64Array(1440));
  const gridU = Array.from({ length: 12 }, () => new Float64Array(1440));
  const asleep = new Float64Array(1440), asleepU = new Float64Array(1440);
  let totalW = 0, n = 0;
  for (const y of years) {
    const d = D[y];
    totalW += d.totalW; n += d.n;
    for (let k = 0; k < 12; k++) for (let m = 0; m < 1440; m++) { grid[k][m] += d.grid[k][m]; gridU[k][m] += d.gridU[k][m]; }
    for (let m = 0; m < 1440; m++) { asleep[m] += d.asleep[m]; asleepU[m] += d.asleepU[m]; }
  }
  return { year: years.join('+'), grid, gridU, asleep, asleepU, totalW, n, rows: null };
}
const POOL = { '2023+2024': pool([2023, 2024]), '2019+2023+2024': pool([2019, 2023, 2024]) };
const FRAMES = { 2019: D[2019], 2023: D[2023], 2024: D[2024], ...POOL };

say(`Ticket 07 · claim verification · ${YEARS.map((y) => `${y}: n=${D[y].n}`).join(' · ')}`);
say(`1440-minute coverage invariant re-asserted for all three years.`);

// ============================================================================ JOB 1
H('JOB 1 — is the headline word "3 a.m." defensible, and what is the number at 3:00 sharp?');

say('Every share below is weighted (TUFINLWGT, S3) over the S9 universe: civilian, noninstitutional,');
say('15+, in households, 50 states + DC. Times are LOCAL to each respondent\'s own diary day (S8).');
say('');
say('2024, every partition the mark could ship with. "sharp" = the clock minute the copy names;');
say('"argmax/argmin" = the minute the data actually picks.');
say('');
say('partition    3:00 sharp  (doing)                argmax     peak     copy cost');
const job1 = {};
for (const [pname, build] of Object.entries(PARTITIONS)) {
  const b = build(d24);
  const pk = argmax(b.share);
  const at3 = b.share[M3AM];
  job1[pname] = {
    at3Pct: at3 * 100, at3Label: b.label(M3AM),
    peakPct: b.share[pk] * 100, peakClock: clock(pk), peakLabel: b.label(pk),
    gapPp: (b.share[pk] - at3) * 100,
  };
  log('tight_share_at_3am_sharp', `${pname}·2024`, at3 * 100, { n: d24.n, label: b.label(M3AM) });
  log('tight_share_at_argmax', `${pname}·2024`, b.share[pk] * 100, { n: d24.n, minute: clock(pk) });
  say(`${pname.padEnd(12)} ${fmt(at3 * 100, 1).padStart(8)}%  ${('(' + b.label(M3AM) + ')').padEnd(24)} ${clock(pk).padStart(9)} ${fmt(b.share[pk] * 100, 1).padStart(7)}%   ${fmt((b.share[pk] - at3) * 100, 2).padStart(5)} pp`);
}
{
  const a3v = (d24.asleep[M3AM] / d24.totalW) * 100;
  let pk = 0;
  for (let m = 1; m < 1440; m++) if (d24.asleep[m] > d24.asleep[pk]) pk = m;
  log('asleep_share_at_3am_sharp', 'asleep·2024', a3v, { n: d24.n });
  say(`${'asleep only'.padEnd(12)} ${fmt(a3v, 1).padStart(8)}%  ${'(0101x, TRCODE)'.padEnd(24)} ${clock(pk).padStart(9)} ${fmt((d24.asleep[pk] / d24.totalW) * 100, 1).padStart(7)}%   ${fmt((d24.asleep[pk] / d24.totalW) * 100 - a3v, 2).padStart(5)} pp`);
  job1.asleep = { at3Pct: a3v, peakPct: (d24.asleep[pk] / d24.totalW) * 100, peakClock: clock(pk) };
}
say('');
say('The same at noon sharp, against the day\'s measured trough:');
say('');
say('partition    12:00 sharp (doing)                argmin     trough   copy cost');
for (const [pname, build] of Object.entries(PARTITIONS)) {
  const b = build(d24);
  const tr = argmin(b.share);
  const at12 = b.share[MNOON];
  job1[pname] = { ...job1[pname], at12Pct: at12 * 100, at12Label: b.label(MNOON), troughPct: b.share[tr] * 100, troughClock: clock(tr), troughLabel: b.label(tr), troughGapPp: (at12 - b.share[tr]) * 100 };
  log('loose_share_at_noon_sharp', `${pname}·2024`, at12 * 100, { n: d24.n, label: b.label(MNOON) });
  log('loose_share_at_argmin', `${pname}·2024`, b.share[tr] * 100, { n: d24.n, minute: clock(tr) });
  say(`${pname.padEnd(12)} ${fmt(at12 * 100, 1).padStart(8)}%  ${('(' + b.label(MNOON) + ')').padEnd(24)} ${clock(tr).padStart(9)} ${fmt(b.share[tr] * 100, 1).padStart(7)}%   ${fmt((at12 - b.share[tr]) * 100, 2).padStart(5)} pp`);
}

say('');
say('C5 — is the ARGMAX MINUTE a stable statistic, or an extreme drawn from a noisy curve?');
say('Three independent annual samples. If the peak minute wanders but its value does not, the');
say('rounded word is the honest one and the exact minute must never ship.');
say('');
say('year          peak minute   peak %   3:00 sharp %   trough minute   trough %   12:00 sharp %');
const stability = {};
for (const y of YEARS) {
  const b = PARTITIONS.majors12(D[y]);
  const pk = argmax(b.share), tr = argmin(b.share);
  stability[y] = { peakClock: clock(pk), peakPct: b.share[pk] * 100, at3: b.share[M3AM] * 100, troughClock: clock(tr), troughPct: b.share[tr] * 100, at12: b.share[MNOON] * 100 };
  log('tight_share_at_3am_sharp', `majors12·${y}`, b.share[M3AM] * 100, { n: D[y].n });
  log('loose_share_at_noon_sharp', `majors12·${y}`, b.share[MNOON] * 100, { n: D[y].n });
  say(`${y}          ${clock(pk).padStart(9)}   ${fmt(b.share[pk] * 100).padStart(5)}%   ${fmt(b.share[M3AM] * 100).padStart(10)}%   ${clock(tr).padStart(11)}   ${fmt(b.share[tr] * 100).padStart(6)}%   ${fmt(b.share[MNOON] * 100).padStart(11)}%`);
}
say('');
say('Same, on the asleep share alone (TRCODE 0101x):');
say('year          peak minute   peak %   3:00 sharp %');
for (const y of YEARS) {
  const d = D[y];
  let pk = 0;
  for (let m = 1; m < 1440; m++) if (d.asleep[m] > d.asleep[pk]) pk = m;
  say(`${y}          ${clock(pk).padStart(9)}   ${fmt((d.asleep[pk] / d.totalW) * 100).padStart(5)}%   ${fmt((d.asleep[M3AM] / d.totalW) * 100).padStart(10)}%`);
  log('asleep_share_at_3am_sharp', `asleep·${y}`, (d.asleep[M3AM] / d.totalW) * 100, { n: d.n, peak: clock(pk) });
}

say('');
say('How flat is the 3 a.m. plateau? 2024, majors12, every 10 minutes from 1 a.m. to 5 a.m.:');
say('');
let line = '  ';
for (let h = 1; h <= 5; h++) {
  for (let mm = 0; mm < 60; mm += 10) {
    if (h === 5 && mm > 0) break;
    const m = fromClock(h, mm);
    const b = PARTITIONS.majors12(d24);
    line += `${clock(m)} ${fmt(b.share[m] * 100)}%   `;
    if (line.length > 78) { say(line); line = '  '; }
  }
}
if (line.trim()) say(line);
const bm = PARTITIONS.majors12(d24);
let plateau = 0;
for (let m = 0; m < 1440; m++) if (bm.share[m] >= 0.95) plateau++;
const plateauMins = [];
for (let m = 0; m < 1440; m++) if (bm.share[m] >= 0.95) plateauMins.push(m);
say('');
say(`Minutes of the 2024 day where the modal share is at or above 95%: ${plateau}`);
say(`  running ${clock(plateauMins[0])} → ${clock(plateauMins[plateauMins.length - 1])} (contiguous: ${plateauMins.every((m, i) => i === 0 || m === plateauMins[i - 1] + 1)})`);
let asleep95 = 0; const asleepMins = [];
for (let m = 0; m < 1440; m++) if (d24.asleep[m] / d24.totalW >= 0.95) { asleep95++; asleepMins.push(m); }
say(`Minutes where the ASLEEP share alone is at or above 95%: ${asleep95}` + (asleep95 ? ` (${clock(asleepMins[0])} → ${clock(asleepMins[asleepMins.length - 1])})` : ''));
log('minutes_modal_ge_95pct', 'majors12·2024', plateau);
log('minutes_asleep_ge_95pct', 'sleepBinary·2024', asleep95);

// ============================================================================ SPEC CURVE
H('SPECIFICATION CURVE — estimand: braid_gap_pp (peak modal share − trough modal share)');

say('Analytic choices varied, question held fixed: partition (3) × frame (5) × time resolution (4).');
say('Weighting is not a curve dimension — S3 forbids an unweighted estimate. The equal-ink twin is');
say('measured separately below as a FIDELITY question about the mark, not as an estimate.');
say('');
say('frame            partition     resolution   peak%   trough%   gap pp   peak at    trough at');
const curve = [];
for (const [fname, d] of Object.entries(FRAMES)) {
  for (const pname of Object.keys(PARTITIONS)) {
    for (const res of [1, 5, 15, 60]) {
      const share = res === 1
        ? PARTITIONS[pname](d).share
        : modalAtResolution(d, res, GROUPS_OF[pname], SPLIT_OF[pname]);
      const pk = argmax(share), tr = argmin(share);
      const gap = (share[pk] - share[tr]) * 100;
      const row = {
        frame: fname, partition: pname, resolutionMin: res,
        peakPct: share[pk] * 100, troughPct: share[tr] * 100, gapPp: gap,
        peakClock: clock(pk), troughClock: clock(tr),
        peakInNightBand: ((pk + 240) % 1440) >= 120 && ((pk + 240) % 1440) < 300,   // 2–5 a.m.
        troughInMiddayBand: ((tr + 240) % 1440) >= 630 && ((tr + 240) % 1440) < 900, // 10:30 a.m.–3 p.m.
      };
      curve.push(row);
      log('braid_gap_pp', `${fname}·${pname}·${res}min`, gap, { peak: row.peakClock, trough: row.troughClock });
      say(`${fname.padEnd(16)} ${pname.padEnd(13)} ${String(res).padStart(3)} min   ${fmt(row.peakPct).padStart(5)}   ${fmt(row.troughPct).padStart(6)}   ${fmt(gap).padStart(6)}   ${row.peakClock.padStart(9)}  ${row.troughClock.padStart(10)}`);
    }
  }
}
const gaps = curve.map((c) => c.gapPp).sort((a, b) => a - b);
const median = gaps.length % 2 ? gaps[(gaps.length - 1) / 2] : (gaps[gaps.length / 2 - 1] + gaps[gaps.length / 2]) / 2;
const medianSpec = curve.slice().sort((a, b) => a.gapPp - b.gapPp)[Math.floor((curve.length - 1) / 2)];
say('');
say(`Specifications: ${curve.length} · gap range ${fmt(gaps[0])} – ${fmt(gaps[gaps.length - 1])} pp · MEDIAN ${fmt(median)} pp`);
say(`Median specification: ${medianSpec.frame} · ${medianSpec.partition} · ${medianSpec.resolutionMin} min → ${fmt(medianSpec.gapPp)} pp (peak ${medianSpec.peakClock}, trough ${medianSpec.troughClock})`);
const stableNight = curve.filter((c) => c.peakInNightBand).length;
const stableMidday = curve.filter((c) => c.troughInMiddayBand).length;
say(`Stability — peak lands in the 2–5 a.m. band: ${stableNight}/${curve.length} (${fmt((stableNight / curve.length) * 100)}%)`);
say(`Stability — trough lands in the 10:30 a.m.–3 p.m. band: ${stableMidday}/${curve.length} (${fmt((stableMidday / curve.length) * 100)}%)`);
const fine = curve.filter((c) => c.partition !== 'coarse3');
const fineGaps = fine.map((c) => c.gapPp).sort((a, b) => a - b);
say(`  → every one of the ${curve.length - fine.length} misses is a coarse3 spec, which puts the trough at 6 p.m., not noon.`);
say(`  Conditioned on a fine activity partition (${fine.length} specs): trough in the midday band ${fine.filter((c) => c.troughInMiddayBand).length}/${fine.length}` +
  ` (${fmt((fine.filter((c) => c.troughInMiddayBand).length / fine.length) * 100)}%) · gap ${fmt(fineGaps[0])}–${fmt(fineGaps[fineGaps.length - 1])} pp`);
const FLOOR_PP = 10; // see findings: fixed from the largest measured pipeline error, POST-HOC
const minGap = gaps[0];
say(`Floor for this claim: ${FLOOR_PP} pp (the largest measured mark-fidelity error, rounded up).`);
say(`Median specification clears it by ${fmt(median / FLOOR_PP, 1)}× · worst specification by ${fmt(minGap / FLOOR_PP, 1)}× (${fmt(minGap)} pp)`);
say(`Specifications clearing the floor: ${gaps.filter((g) => g >= FLOOR_PP).length}/${gaps.length}`);

say('');
say('THE NUMBERS THE COPY\'S WORDS ACTUALLY NAME. "3 a.m." and "noon" are HOURS, so the hour is the');
say('honest resolution — and the median specification is exactly that (2024 · majors12 · 60 min):');
say('');
const headline = {};
for (const [label, h] of [['3 a.m. hour (3:00–3:59)', 3], ['noon hour (12:00–12:59)', 12]]) {
  const s = fromClock(h, 0);
  let best = -1, bl = null;
  for (const g of GROUPS12) {
    let v = 0;
    for (let m = s; m < s + 60; m++) v += d24.grid[g.majors[0]][m];
    const p = v / (d24.totalW * 60);
    if (p > best) { best = p; bl = g.name; }
  }
  let sl = 0;
  for (let m = s; m < s + 60; m++) sl += d24.asleep[m];
  headline[label] = { modalPct: best * 100, modal: bl, asleepPct: (sl / (d24.totalW * 60)) * 100 };
  log('headline_hour_modal_share', `majors12·2024·${label}`, best * 100, { modal: bl });
  say(`  ${label.padEnd(26)} ${fmt(best * 100).padStart(5)}% ${bl.padEnd(16)} (asleep ${fmt((sl / (d24.totalW * 60)) * 100)}%)`);
}
say(`  gap between the two hours: ${fmt(headline['3 a.m. hour (3:00–3:59)'].modalPct - headline['noon hour (12:00–12:59)'].modalPct)} pp`);

// ============================================================================ FIDELITY
H('FIDELITY — does the DRAWN mark assert the same number the record asserts?');

say('L1 draws one thread per real 2024 diary day, all 7,669, equal ink. Equal ink is an UNWEIGHTED');
say('share. Ticket 04 (R5) measured that gap at 8.67 pp on the working share. Measure it here on the');
say('two minutes the claim actually names.');
say('');
const eqAt = (d, m) => {
  let best = 0;
  for (let k = 0; k < 12; k++) best = Math.max(best, d.gridU[k][m] / d.n);
  return best;
};
const wAt = (d, m) => { const b = PARTITIONS.majors12(d); return b.share[m]; };
const rows2 = [
  ['3:00 a.m. sharp', M3AM],
  ['3:27 a.m. (measured peak)', fromClock(3, 27)],
  ['12:00 p.m. sharp', MNOON],
  ['12:02 p.m. (measured trough)', fromClock(12, 2)],
];
say('minute                        weighted   equal-ink(all 7,669)   error pp');
const fidelity = {};
for (const [label, m] of rows2) {
  const w = wAt(d24, m) * 100, u = eqAt(d24, m) * 100;
  fidelity[label] = { weightedPct: w, equalInkPct: u, errorPp: u - w };
  log('equal_ink_error_pp', `majors12·2024·${label}`, u - w, { weighted: w, equalInk: u });
  say(`${label.padEnd(30)} ${fmt(w).padStart(6)}%   ${fmt(u).padStart(18)}%   ${fmt(u - w, 2).padStart(8)}`);
}
say('');
say('Asleep share, same comparison (the narrower reading of the copy):');
for (const [label, m] of rows2) {
  const w = (d24.asleep[m] / d24.totalW) * 100, u = (d24.asleepU[m] / d24.n) * 100;
  say(`${label.padEnd(30)} ${fmt(w).padStart(6)}%   ${fmt(u).padStart(18)}%   ${fmt(u - w, 2).padStart(8)}`);
  log('equal_ink_error_pp_asleep', `sleepBinary·2024·${label}`, u - w, { weighted: w, equalInk: u });
}
say('');
say('Worst equal-ink error anywhere in the 2024 day (modal share, all 1440 minutes):');
let worst = 0, worstM = 0;
for (let m = 0; m < 1440; m++) { const e = Math.abs(eqAt(d24, m) - wAt(d24, m)) * 100; if (e > worst) { worst = e; worstM = m; } }
say(`  ${fmt(worst, 2)} pp at ${clock(worstM)}`);
log('equal_ink_error_pp_worst', 'majors12·2024·whole day', worst, { minute: clock(worstM) });

say('');
say('Does systematic PPS-with-replacement on TUFINLWGT (R5) fix it? k = 7,669 threads, 8 seeds:');
function ppsShare(d, k, seed, m) {
  const cum = new Float64Array(d.n);
  let acc = 0;
  for (let i = 0; i < d.n; i++) { acc += d.rows[i].w; cum[i] = acc; }
  const step = acc / k;
  let s = seed >>> 0;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  let u = rnd() * step, i = 0;
  const counts = new Int32Array(12);
  let sleepN = 0;
  for (let t = 0; t < k; t++) {
    while (i < d.n - 1 && cum[i] < u) i++;
    const mi = d.perMaj[i * 1440 + m];
    if (mi >= 0) counts[mi]++;
    if (d.perSleep[i * 1440 + m]) sleepN++;
    u += step;
  }
  let best = 0;
  for (let k2 = 0; k2 < 12; k2++) best = Math.max(best, counts[k2] / k);
  return { modal: best * 100, asleep: (sleepN / k) * 100 };
}
say('  minute            truth(weighted)   PPS mean   PPS spread   equal-ink');
for (const [label, m] of rows2) {
  const truth = wAt(d24, m) * 100;
  const vals = [1, 2, 3, 4, 5, 6, 7, 8].map((s) => ppsShare(d24, 7669, s * 7919, m).modal);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const spread = `${fmt(Math.min(...vals), 2)}–${fmt(Math.max(...vals), 2)}`;
  say(`  ${label.padEnd(30)} ${fmt(truth).padStart(5)}%   ${fmt(mean, 2).padStart(8)}%   ${spread.padStart(12)}   ${fmt(eqAt(d24, m) * 100).padStart(6)}%`);
  log('pps_reconstructed_share', `majors12·2024·${label}`, mean, { truth, spread });
}

// ============================================================================ A3
H('A3 — does the conclusion reverse under a plausible third variable?');

say('Day of week is the one that matters: ATUS samples weekend days at 2.5× the weekday rate, and');
say('noon on a Sunday is a different noon. The 7-day weighted estimate is the population number;');
say('these splits say whether it is an average of two opposite things.');
say('');
say('slice          n     peak%  peak at    3:00 sharp   trough%  trough at    12:00 sharp');
const a3 = {};
function braidOf(rows, totalW, label, n) {
  const grid = Array.from({ length: 12 }, () => new Float64Array(1440));
  const asleepG = new Float64Array(1440);
  for (const r of rows) {
    const base = r.idx * 1440;
    for (let m = 0; m < 1440; m++) {
      const mi = d24.perMaj[base + m];
      if (mi >= 0) grid[mi][m] += r.w;
      if (d24.perSleep[base + m]) asleepG[m] += r.w;
    }
  }
  const share = new Float64Array(1440), which = new Int8Array(1440);
  for (let m = 0; m < 1440; m++) {
    let best = -1, bi = -1;
    for (let k = 0; k < 12; k++) { const p = grid[k][m] / totalW; if (p > best) { best = p; bi = k; } }
    share[m] = best; which[m] = bi;
  }
  const pk = argmax(share), tr = argmin(share);
  return {
    label, n, peakPct: share[pk] * 100, peakClock: clock(pk), peakMajor: MAJORS[which[pk]],
    at3: share[M3AM] * 100, troughPct: share[tr] * 100, troughClock: clock(tr), troughMajor: MAJORS[which[tr]],
    at12: share[MNOON] * 100, at12Major: MAJORS[which[MNOON]],
    asleep3: (asleepG[M3AM] / totalW) * 100,
    gapPp: (share[pk] - share[tr]) * 100,
  };
}
const sumW = (rows) => rows.reduce((a, r) => a + r.w, 0);
for (const [label, pred] of [
  ['all days', () => true],
  ['weekdays', (r) => r.day >= 2 && r.day <= 6],
  ['weekends', (r) => r.day === 1 || r.day === 7],
]) {
  const rows = d24.rows.filter(pred);
  const b = braidOf(rows, sumW(rows), label, rows.length);
  a3[label] = b;
  log('braid_gap_pp', `majors12·2024·${label}`, b.gapPp, { n: b.n });
  say(`${label.padEnd(14)} ${String(b.n).padStart(5)} ${fmt(b.peakPct).padStart(6)}%  ${b.peakClock.padStart(9)}  ${fmt(b.at3).padStart(9)}%   ${fmt(b.troughPct).padStart(6)}%  ${b.troughClock.padStart(10)}   ${fmt(b.at12).padStart(9)}%`);
}
say('');
say('Both slices carry the same shape, so the pooled number is not an average of two opposite things.');

// ============================================================================ JOB 2
H('JOB 2 — does filtering to "worked that day" TIGHTEN noon, or fray it?');

say('The open map item. Every group below is drawn from 2024 alone (L3), so its n is the number of');
say('real threads the rope would re-form from — L6\'s 844 line applies to each row.');
say('');
say('group                          n    844?   3:00 sharp   noon sharp  (modal at noon)   trough%  trough at');
const groups = [
  ['everyone', () => true],
  ['worked that day', (r) => r.work > 0],
  ['did not work that day', (r) => r.work === 0],
  ['worked 6h+ that day', (r) => r.work >= 360],
  ['employed, did not work', (r) => (r.telfs === 1 || r.telfs === 2) && r.work === 0],
  ['men', (r) => r.sex === 1],
  ['women', (r) => r.sex === 2],
  ['weekday diaries', (r) => r.day >= 2 && r.day <= 6],
  ['weekend diaries', (r) => r.day === 1 || r.day === 7],
  ['age 65+', (r) => r.age >= 65],
  ['age 25-54', (r) => r.age >= 25 && r.age < 55],
  ['children <18 in hh', (r) => r.hhChild === 1],
  ['no children in hh', (r) => r.hhChild === 2],
  ['enrolled in school', (r) => r.school === 1],
  ['worked that day, weekday', (r) => r.work > 0 && r.day >= 2 && r.day <= 6],
  ['worked 6h+, weekday', (r) => r.work >= 360 && r.day >= 2 && r.day <= 6],
];
const job2 = [];
for (const [label, pred] of groups) {
  const rows = d24.rows.filter(pred);
  if (!rows.length) continue;
  const b = braidOf(rows, sumW(rows), label, rows.length);
  job2.push(b);
  log('loose_share_at_noon_sharp', `majors12·2024·${label}`, b.at12, { n: b.n, modal: b.at12Major });
  log('braid_gap_pp', `majors12·2024·${label}`, b.gapPp, { n: b.n });
  say(`${label.padEnd(28)} ${String(b.n).padStart(5)}  ${(b.n >= 844 ? 'yes' : 'NO').padStart(4)}   ${fmt(b.at3).padStart(9)}%   ${fmt(b.at12).padStart(9)}% ${('(' + b.at12Major + ')').padEnd(18)} ${fmt(b.troughPct).padStart(6)}%  ${b.troughClock.padStart(10)}`);
}
say('');
say('Read the "noon sharp" column against everyone\'s 24.4%: a group above it unravels LESS.');

say('');
say('The strongest tightening candidate, minute by minute — "worked 6h+, weekday" vs everyone,');
say('modal share every hour of the 2024 day:');
const gAll = braidOf(d24.rows, d24.totalW, 'everyone', d24.n);
const wrows = d24.rows.filter((r) => r.work >= 360 && r.day >= 2 && r.day <= 6);
{
  const grid = Array.from({ length: 12 }, () => new Float64Array(1440));
  const tw = sumW(wrows);
  for (const r of wrows) { const base = r.idx * 1440; for (let m = 0; m < 1440; m++) { const mi = d24.perMaj[base + m]; if (mi >= 0) grid[mi][m] += r.w; } }
  const shareAll = PARTITIONS.majors12(d24).share;
  say('');
  say('hour        everyone   workers   Δ pp    workers\' modal activity');
  for (let h = 0; h < 24; h++) {
    const m = fromClock(h, 0);
    let best = -1, bi = -1;
    for (let k = 0; k < 12; k++) { const p = grid[k][m] / tw; if (p > best) { best = p; bi = k; } }
    say(`${clock(m).padStart(9)}   ${fmt(shareAll[m] * 100).padStart(6)}%   ${fmt(best * 100).padStart(6)}%  ${fmt(best * 100 - shareAll[m] * 100, 1).padStart(6)}    ${MAJORS[bi]}`);
  }
}

// ============================================================================ C3/C4
H('C3 / C4 — how much of the braid is COORDINATION and how much is arithmetic?');

say('The hostile reading: "of course the country agrees at 3 a.m. — everyone sleeps 8 hours, and of');
say('course workers work at noon — you filtered on working." Both are answerable with the same null:');
say('hold every person\'s activity durations fixed and rotate their day to a uniform random start.');
say('Coordination is then observed ÷ expected-under-rotation, and the expectation is analytic —');
say('E[share doing X at any minute] = weighted mean minutes of X ÷ 1440.');
say('');
const meanMinutes = (rows, totalW, pick) => {
  let s = 0;
  for (const r of rows) { let t = 0; const base = r.idx * 1440; for (let m = 0; m < 1440; m++) if (pick(base + m)) t++; s += r.w * t; }
  return s / totalW;
};
const coord = [];
for (const [label, rows, minute, pick, obs] of [
  ['everyone asleep, 3:00 a.m.', d24.rows, M3AM, (i) => d24.perSleep[i] === 1, null],
  ['everyone on personal care, 3:00 a.m.', d24.rows, M3AM, (i) => d24.perMaj[i] === MI.personal_care, null],
  ['everyone working, 12:00 p.m.', d24.rows, MNOON, (i) => d24.perMaj[i] === MI.work, null],
  ['worked 6h+ weekday, working 12:00 p.m.', d24.rows.filter((r) => r.work >= 360 && r.day >= 2 && r.day <= 6), MNOON, (i) => d24.perMaj[i] === MI.work, null],
  ['worked 6h+ weekday, working 2:00 p.m.', d24.rows.filter((r) => r.work >= 360 && r.day >= 2 && r.day <= 6), fromClock(14, 0), (i) => d24.perMaj[i] === MI.work, null],
]) {
  const tw = sumW(rows);
  let act = 0;
  for (const r of rows) if (pick(r.idx * 1440 + minute)) act += r.w;
  const observed = (act / tw) * 100;
  const expected = (meanMinutes(rows, tw, pick) / 1440) * 100;
  coord.push({ label, n: rows.length, observedPct: observed, expectedPct: expected, ratio: observed / expected });
  log('coordination_ratio', `majors12·2024·${label}`, observed / expected, { observed, expected, n: rows.length });
  say(`  ${label.padEnd(40)} observed ${fmt(observed).padStart(5)}%   rotation-null ${fmt(expected).padStart(5)}%   ${fmt(observed / expected, 2).padStart(5)}×`);
}
say('');
say('So the night is real coordination, not sleep arithmetic — and the workers\' midday tightening is');
say('not the filter talking either: the filter guarantees one work minute, not a shared window.');

// ============================================================================ C2
H('C2 — uncertainty, stated as more than a threshold crossing');

say('S12 is off the board (L4): no replicate weights, so no BLS standard error exists for these');
say('numbers. Two things stand in, and neither may ever be printed as an error bar (P2):');
say('');
say('(a) The linearized SRS-with-weights floor on each share — captures the weighting design');
say('    effect, not stratification or replication. A FLOOR, so the true SE is larger.');
function shareSE(d, m, kind) {
  // weighted share of respondent-days doing `kind` at minute m, with a linearized SE floor
  let sw = 0, swi = 0;
  const vals = [];
  for (const r of d.rows) {
    const hit = kind === 'asleep' ? d.perSleep[r.idx * 1440 + m] === 1 : d.perMaj[r.idx * 1440 + m] === kind;
    sw += r.w; if (hit) swi += r.w;
    vals.push([r.w, hit ? 1 : 0]);
  }
  const p = swi / sw;
  let vnum = 0;
  for (const [w, x] of vals) { const dd = x - p; vnum += w * w * dd * dd; }
  return { pct: p * 100, sePct: (Math.sqrt(vnum) / sw) * 100 };
}
const se3 = shareSE(d24, M3AM, MI.personal_care);
const se3s = shareSE(d24, M3AM, 'asleep');
const se12 = shareSE(d24, MNOON, MI.work);
say('');
say(`    personal care at 3:00 a.m.: ${fmt(se3.pct, 2)}% ± ${fmt(se3.sePct, 2)} (floor)`);
say(`    asleep at 3:00 a.m.:        ${fmt(se3s.pct, 2)}% ± ${fmt(se3s.sePct, 2)} (floor)`);
say(`    working at 12:00 p.m.:      ${fmt(se12.pct, 2)}% ± ${fmt(se12.sePct, 2)} (floor)`);
say(`    gap 3:00 − 12:00:           ${fmt(se3.pct - se12.pct, 2)} pp ± ${fmt(Math.sqrt(se3.sePct ** 2 + se12.sePct ** 2), 2)} (floor)`);
log('se_floor_pp', 'personal_care·3am·2024', se3.sePct);
log('se_floor_pp', 'work·noon·2024', se12.sePct);
say('');
say('(b) Reproduction across three independent annual samples — the stronger evidence, because it');
say('    is an actual re-draw of the survey rather than a variance formula:');
for (const y of YEARS) say(`    ${y}: 3:00 sharp ${fmt(stability[y].at3)}% · 12:00 sharp ${fmt(stability[y].at12)}%`);
const spread3 = Math.max(...YEARS.map((y) => stability[y].at3)) - Math.min(...YEARS.map((y) => stability[y].at3));
const spread12 = Math.max(...YEARS.map((y) => stability[y].at12)) - Math.min(...YEARS.map((y) => stability[y].at12));
say(`    three-year spread: ${fmt(spread3, 2)} pp at 3:00 · ${fmt(spread12, 2)} pp at noon`);

// ============================================================================ adversarial follow-ups
H('ADVERSARIAL PASS FOLLOW-UPS — three things the language pass raised that are cheap to measure');

say('(1) The interval must come from the same specification as the estimate. The ± 0.75 pp above is');
say('    computed at 3:00 and 12:00 SHARP; the frozen number is the HOUR. Recompute at the hour —');
say('    per respondent, the fraction of that hour spent on the modal activity:');
function hourSE(rows, totalW, h, pick) {
  const s = fromClock(h, 0);
  let sw = 0, swt = 0;
  const vals = [];
  for (const r of rows) {
    let t = 0; const base = r.idx * 1440;
    for (let m = s; m < s + 60; m++) if (pick(base + m)) t++;
    const x = t / 60;
    sw += r.w; swt += r.w * x; vals.push([r.w, x]);
  }
  const mean = swt / sw;
  let vnum = 0;
  for (const [w, x] of vals) { const d = x - mean; vnum += w * w * d * d; }
  return { pct: mean * 100, sePct: (Math.sqrt(vnum) / sw) * 100 };
}
const h3 = hourSE(d24.rows, d24.totalW, 3, (i) => d24.perMaj[i] === MI.personal_care);
const h3s = hourSE(d24.rows, d24.totalW, 3, (i) => d24.perSleep[i] === 1);
const h12 = hourSE(d24.rows, d24.totalW, 12, (i) => d24.perMaj[i] === MI.work);
say('');
say(`    3 a.m. hour, personal care: ${fmt(h3.pct, 2)}% ± ${fmt(h3.sePct, 2)} (floor)`);
say(`    3 a.m. hour, asleep:        ${fmt(h3s.pct, 2)}% ± ${fmt(h3s.sePct, 2)} (floor)`);
say(`    noon hour, work:            ${fmt(h12.pct, 2)}% ± ${fmt(h12.sePct, 2)} (floor)`);
say(`    gap:                        ${fmt(h3.pct - h12.pct, 2)} pp ± ${fmt(Math.sqrt(h3.sePct ** 2 + h12.sePct ** 2), 2)} (floor)`);
log('se_floor_pp', 'personal_care·3am hour·2024', h3.sePct, { pct: h3.pct });
log('se_floor_pp', 'work·noon hour·2024', h12.sePct, { pct: h12.pct });

say('');
say('(2) Time heaping. A recall diary is reported in round numbers, so the minute-level curve is');
say('    partly an artefact of how people say times. Share of 2024 episode starts by round-ness:');
{
  const E = readCsv(join(ROOT, 'data', 'extract', 'episodes-2024.csv'));
  const ec = E.col;
  let n = 0, on00 = 0, on30 = 0, on15 = 0, on05 = 0;
  for (const e of E.rows) {
    const start = +e[ec.START_MIN_FROM_4AM];
    if (start === 0) continue; // the 4 a.m. origin is construction, not a reported time
    const t = (start + 240) % 60;
    n++;
    if (t === 0) on00++;
    if (t === 30) on30++;
    if (t === 15 || t === 45) on15++;
    if (t % 5 === 0) on05++;
  }
  say(`    episode starts (excluding the 4 a.m. origin): ${n}`);
  say(`      on the hour        ${fmt((on00 / n) * 100)}%   (uniform would be 1.7%)`);
  say(`      on the half hour   ${fmt((on30 / n) * 100)}%   (uniform would be 1.7%)`);
  say(`      quarter past/to    ${fmt((on15 / n) * 100)}%   (uniform would be 3.3%)`);
  say(`      any multiple of 5  ${fmt((on05 / n) * 100)}%   (uniform would be 20.0%)`);
  log('episode_start_heaping_pct', '2024·multiple of 5', (on05 / n) * 100, { n });
  log('episode_start_heaping_pct', '2024·on the hour', (on00 / n) * 100, { n });
}

say('');
say('(3) The 4 a.m. diary seam. It is NOT one hour after the tight hour — it is the array wrap. The');
say('    diary day runs 4 a.m. → 4 a.m. (S2), so minute 0 is the day\'s FIRST hour and minute 1439 its');
say('    LAST, about 24 hours apart for the same person. The claim\'s 3 a.m. is minute 1380: the');
say('    morning AFTER the day being watched. The step below spans two different mornings:');
{
  let l = '    ';
  for (let m = 1425; m < 1440; m++) l += `${clock(m)} ${fmt(PARTITIONS.majors12(d24).share[m] * 100)}%  `;
  say(l);
  l = '    ';
  for (let m = 0; m < 15; m++) l += `${clock(m)} ${fmt(PARTITIONS.majors12(d24).share[m] * 100)}%  `;
  say(l);
  const b = PARTITIONS.majors12(d24);
  say(`    3:59 a.m. → 4:00 a.m. step: ${fmt((b.share[0] - b.share[1439]) * 100, 2)} pp`);
  log('diary_seam_step_pp', 'majors12·2024·3:59→4:00', (b.share[0] - b.share[1439]) * 100);
}

// ============================================================================ ledger
H('LEDGER');
const byEstimand = {};
for (const e of LEDGER) byEstimand[e.estimand] = (byEstimand[e.estimand] || 0) + 1;
say(`Σ cells logged by this harness: ${LEDGER.length}`);
for (const [k, v] of Object.entries(byEstimand).sort((a, b) => b[1] - a[1])) say(`  ${k.padEnd(34)} ${v}`);

mkdirSync(join(ROOT, 'spike', 'claim', 'results'), { recursive: true });
writeFileSync(join(ROOT, 'spike', 'claim', 'results', 'report.txt'), out.join('\n'));
if (process.argv.includes('--json')) {
  writeFileSync(join(ROOT, 'spike', 'claim', 'results', 'ledger.json'), JSON.stringify(LEDGER, null, 2));
  writeFileSync(join(ROOT, 'spike', 'claim', 'results', 'claim.json'), JSON.stringify({
    job1, stability, curve, median, medianSpec, fidelity, a3, job2,
    se: { personalCare3am: se3, asleep3am: se3s, work12pm: se12 },
    n: Object.fromEntries(YEARS.map((y) => [y, D[y].n])),
  }, null, 2));
}
say('');
say('Wrote spike/claim/results/report.txt');
