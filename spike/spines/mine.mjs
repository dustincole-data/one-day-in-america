/**
 * Ticket 05 — mine the validated extract for candidate spines.
 *
 * Reads `data/extract/{episodes,respondents}-<year>.csv` (ticket 03, gate-proven) and computes the
 * weighted numbers behind each candidate. Every estimate uses `TUFINLWGT` and the §7.4 estimators
 * (S3) — mirrored from `scripts/atus/estimate.ts`, not re-derived.
 *
 *   node spike/spines/mine.mjs          → human-readable report on stdout
 *   node spike/spines/mine.mjs --json   → also writes spike/spines/results/spines.json
 *
 * Throwaway analysis harness, same status as spike/render-budget: never deployed, never imported by
 * the site. Astro builds only src/ and public/.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const YEARS = [2019, 2023, 2024];
const DAYS = { 2019: 365, 2023: 365, 2024: 366 };

const MAJORS = [
  'personal_care', 'eating_drinking', 'household', 'care_household', 'care_nonhousehold',
  'work', 'education', 'purchasing', 'org_civic_religious', 'leisure_sports',
  'phone_mail_email', 'other_nec',
];
const MI = Object.fromEntries(MAJORS.map((m, i) => [m, i]));

// Ås (1978) four-way, mapped onto the gate-proven published majors. Travel is already redistributed
// into each major (ticket 03), so no travel term is added here.
const NECESSARY = ['personal_care', 'eating_drinking'];
const OBLIGATED = ['work', 'household', 'care_household', 'care_nonhousehold', 'purchasing', 'education'];
const FREE = ['leisure_sports', 'org_civic_religious', 'phone_mail_email', 'other_nec'];

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

// ---------------------------------------------------------------------------- estimators (§7.4)

/** average minutes per day = Σ(w·T)/Σw · participation = Σ(w·I)/Σw · among participants = Σ(w·I·T)/Σ(w·I) */
function est(rows, get, days) {
  let sw = 0, swt = 0, swi = 0, swit = 0, nEng = 0;
  for (const r of rows) {
    const w = r.w, t = get(r);
    sw += w; swt += w * t;
    if (t > 0) { swi += w; swit += w * t; nEng++; }
  }
  const mean = swt / sw;
  // Linearized SE for a weighted mean under SRS-with-weights. NOT the BLS replicate-weight SE
  // (§7.5 / S12) — it captures the weighting design effect but not stratification or replication.
  let vnum = 0;
  for (const r of rows) { const d = get(r) - mean; vnum += r.w * r.w * d * d; }
  return {
    n: rows.length,
    minutes: mean,
    hours: mean / 60,
    se: Math.sqrt(vnum) / sw,
    pct: (swi / sw) * 100,
    amongParticipants: swi > 0 ? swit / swi : null,
    participants: swi / days,
    nEngaged: nEng,
    kish: (sw * sw) / rows.reduce((a, r) => a + r.w * r.w, 0),
  };
}

/** weighted share of rows where pred() is true, plus its SE floor */
function share(rows, pred) {
  let sw = 0, swi = 0;
  for (const r of rows) { sw += r.w; if (pred(r)) swi += r.w; }
  const p = swi / sw;
  let vnum = 0;
  for (const r of rows) { const d = (pred(r) ? 1 : 0) - p; vnum += r.w * r.w * d * d; }
  return { pct: p * 100, se: (Math.sqrt(vnum) / sw) * 100, n: rows.length };
}

const diffSE = (a, b) => Math.sqrt(a.se * a.se + b.se * b.se);

// ---------------------------------------------------------------------------- load

function load(year) {
  const R = readCsv(join(ROOT, 'data', 'extract', `respondents-${year}.csv`));
  const E = readCsv(join(ROOT, 'data', 'extract', `episodes-${year}.csv`));
  const rc = R.col, ec = E.col;

  const byId = new Map();
  const rows = [];
  for (const r of R.rows) {
    const rec = {
      id: r[rc.TUCASEID],
      w: +r[rc.TUFINLWGT],
      day: +r[rc.TUDIARYDAY],
      holiday: +r[rc.TRHOLIDAY],
      telfs: +r[rc.TELFS],
      ftpt: +r[rc.TRDPFTPT],
      usualHrs: +r[rc.TEHRUSLT],
      nKids: +r[rc.TRCHILDNUM],
      hhChild: +r[rc.TRHHCHILD],
      youngest: +r[rc.TRYHHCHILD],
      spouse: +r[rc.TRSPPRES],
      spEmp: +r[rc.TESPEMPNOT],
      mjot: +r[rc.TEMJOT],
      school: +r[rc.TESCHENR],
      age: +r[rc.TEAGE],
      sex: +r[rc.TESEX],
      educ: +r[rc.PEEDUCA],
      race: +r[rc.PTDTRACE],
      hisp: +r[rc.PEHSPNON],
      metro: +r[rc.GTMETSTA],
      work: +r[rc.WORK_MIN],
      commute: +r[rc.COMMUTE_MIN],
      wah: +r[rc.WORK_AT_HOME_MIN],
      maj: new Float64Array(12),
      sleep: 0, tv: 0, socialize: 0, socialLeaf: 0, exercise: 0, reading: 0, games: 0, eatOut: 0,
    };
    byId.set(rec.id, rec);
    rows.push(rec);
  }

  // per-minute weighted occupancy, 1440 minutes from the 4 a.m. origin × 12 majors
  const grid = Array.from({ length: 12 }, () => new Float64Array(1440));
  const asleep = new Float64Array(1440);
  const working = new Float64Array(1440);
  const workingHome = new Float64Array(1440);
  let totalW = 0;
  for (const r of rows) totalW += r.w;

  for (const e of E.rows) {
    const rec = byId.get(e[ec.TUCASEID]);
    const start = +e[ec.START_MIN_FROM_4AM];
    const dur = +e[ec.DUR_MIN];
    const code = e[ec.TRCODE];
    const mi = MI[e[ec.MAJOR]];
    const where = +e[ec.TEWHERE];
    rec.maj[mi] += dur;
    if (code.startsWith('0101')) rec.sleep += dur;
    if (code === '120303' || code === '120304') rec.tv += dur;
    if (code === '120101' || code === '120199') rec.socialize += dur;
    // the published "Socializing and communicating" leaf, gate-proven in ticket 03 = 1201 + 1202
    if (code.startsWith('1201') || code.startsWith('1202')) rec.socialLeaf += dur;
    if (code.startsWith('1301')) rec.exercise += dur;
    if (code.startsWith('1203') && (code === '120312' || code === '120313')) rec.reading += dur;
    if (code === '120307' || code === '120308') rec.games += dur;
    if (code === '110101' || code === '110201') rec.eatOut += dur;

    const g = grid[mi];
    const end = start + dur;
    for (let m = start; m < end; m++) g[m] += rec.w;
    if (code.startsWith('0101')) for (let m = start; m < end; m++) asleep[m] += rec.w;
    if (mi === MI.work) {
      for (let m = start; m < end; m++) working[m] += rec.w;
      if (where === 1) for (let m = start; m < end; m++) workingHome[m] += rec.w;
    }
  }
  return { year, rows, grid, asleep, working, workingHome, totalW, days: DAYS[year] };
}

// ---------------------------------------------------------------------------- helpers

const min = (r, name) => r.maj[MI[name]];
const sum = (r, names) => names.reduce((a, n) => a + min(r, n), 0);
const employed = (r) => r.telfs === 1 || r.telfs === 2;
const workedToday = (r) => r.work > 0;
const parent = (r) => r.hhChild === 1;
const fmt = (x, d = 1) => (x === null || Number.isNaN(x) ? 'n/a' : x.toFixed(d));
const hm = (m) => `${Math.floor(m / 60)}h ${Math.round(m % 60)}m`;
const clock = (m) => {
  const t = (m + 240) % 1440, h24 = Math.floor(t / 60), mm = t % 60;
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(mm).padStart(2, '0')} ${h24 < 12 ? 'a.m.' : 'p.m.'}`;
};

const out = [];
const say = (s = '') => { out.push(s); console.log(s); };
const H = (s) => { say(''); say('='.repeat(78)); say(s); say('='.repeat(78)); };

// ---------------------------------------------------------------------------- run

const D = Object.fromEntries(YEARS.map((y) => [y, load(y)]));
const pooled = { rows: [...D[2023].rows, ...D[2024].rows], days: 731 };
const results = { generated: 'ticket 05', years: {}, candidates: {} };

// --- sanity: reproduce the ticket-03 handoff numbers before trusting anything downstream ---------
H('SANITY — reproduce ticket 03\'s published handoff numbers');
say('year  n(days)  worked%  of workers: any WAH%  commuted%  commute(participants)  sleep h/day');
for (const y of YEARS) {
  const d = D[y];
  const w = share(d.rows, workedToday);
  const workers = d.rows.filter(workedToday);
  const wah = share(workers, (r) => r.wah > 0);
  const com = share(d.rows, (r) => r.commute > 0);
  const comEst = est(d.rows, (r) => r.commute, d.days);
  const sl = est(d.rows, (r) => r.sleep, d.days);
  say(`${y}  ${d.rows.length}    ${fmt(w.pct)}     ${fmt(wah.pct)}          ${fmt(com.pct)}       ${fmt(comEst.amongParticipants)} min           ${fmt(sl.hours, 2)}`);
  results.years[y] = { n: d.rows.length, workedPct: w.pct, wahOfWorkersPct: wah.pct, commutedPct: com.pct, commuteAmongCommuters: comEst.amongParticipants, sleepHours: sl.hours };
}
say('(ticket 03 handoff: worked 44.5/43.8/42.5 · WAH 26.0/36.5/33.9 · commuted 35.5/30.7/30.0 · commute 47.1/47.1/49.2)');

// --- the 1440 ledger: population-average minutes per major, and the 2019→2024 delta -------------
H('CANDIDATE A — the vanished commute: where the minutes went (the 1440 ledger)');
say('Population average minutes per day, whole population (S9 universe). Deltas sum to zero: the day is fixed.');
say('');
say('major                 2019     2023     2024   Δ24-19   SEΔ(floor)');
const ledger = {};
for (const m of MAJORS) {
  const e = Object.fromEntries(YEARS.map((y) => [y, est(D[y].rows, (r) => min(r, m), D[y].days)]));
  const d = e[2024].minutes - e[2019].minutes;
  const se = diffSE(e[2024], e[2019]);
  ledger[m] = { y2019: e[2019].minutes, y2023: e[2023].minutes, y2024: e[2024].minutes, delta: d, seFloor: se };
  say(`${m.padEnd(20)} ${fmt(e[2019].minutes).padStart(7)} ${fmt(e[2023].minutes).padStart(8)} ${fmt(e[2024].minutes).padStart(8)} ${fmt(d, 1).padStart(8)} ${fmt(se, 1).padStart(9)}`);
}
say(`${'TOTAL'.padEnd(20)} ${fmt(MAJORS.reduce((a, m) => a + ledger[m].y2019, 0)).padStart(7)} ${fmt(MAJORS.reduce((a, m) => a + ledger[m].y2023, 0)).padStart(8)} ${fmt(MAJORS.reduce((a, m) => a + ledger[m].y2024, 0)).padStart(8)} ${fmt(MAJORS.reduce((a, m) => a + ledger[m].delta, 0), 2).padStart(8)}`);

say('');
say('Commute specifically (whole population, minutes/day incl. non-commuters):');
for (const y of YEARS) {
  const e = est(D[y].rows, (r) => r.commute, D[y].days);
  say(`  ${y}: ${fmt(e.minutes, 2)} min/day · ${fmt(e.pct, 1)}% commuted · ${fmt(e.amongParticipants, 1)} min among them · ${(e.participants / 1e6).toFixed(1)} M people/day`);
}
const c19 = est(D[2019].rows, (r) => r.commute, 365), c24 = est(D[2024].rows, (r) => r.commute, 366);
say(`  Δ 2019→2024: ${fmt(c24.minutes - c19.minutes, 2)} min/day per person (SE floor ${fmt(diffSE(c24, c19), 2)})`);
say(`  Δ commuters: ${((c24.participants - c19.participants) / 1e6).toFixed(1)} M fewer people commuting on an average day`);

say('');
say('The cleaner within-year contrast (no cross-year replicate weights needed) — 2024 workers only:');
const w24 = D[2024].rows.filter(workedToday);
const homeOnly = w24.filter((r) => r.wah >= r.work && r.commute === 0);
const commuters = w24.filter((r) => r.commute > 0);
say(`  worked entirely at home: n=${homeOnly.length} (${fmt(share(w24, (r) => r.wah >= r.work && r.commute === 0).pct)}% of workers)`);
say(`  commuted:                n=${commuters.length} (${fmt(share(w24, (r) => r.commute > 0).pct)}% of workers)`);
say('');
say('major                home-only  commuters     diff   SEΔ(floor)');
const homeVsCommute = {};
for (const m of [...MAJORS, 'sleep']) {
  const get = m === 'sleep' ? (r) => r.sleep : (r) => min(r, m);
  const a = est(homeOnly, get, 366), b = est(commuters, get, 366);
  const d = a.minutes - b.minutes;
  homeVsCommute[m] = { homeOnly: a.minutes, commuters: b.minutes, delta: d, seFloor: diffSE(a, b) };
  say(`${m.padEnd(20)} ${fmt(a.minutes).padStart(9)} ${fmt(b.minutes).padStart(10)} ${fmt(d).padStart(8)} ${fmt(diffSE(a, b), 1).padStart(9)}`);
}
results.candidates.A_commute = { ledger, commute: { y2019: c19, y2024: c24 }, homeVsCommute };

// --- second shift --------------------------------------------------------------------------------
H('CANDIDATE B — the second shift');
const unpaid = (r) => min(r, 'household') + min(r, 'care_household') + min(r, 'care_nonhousehold');
function secondShift(rows, label, days) {
  const men = rows.filter((r) => r.sex === 1), women = rows.filter((r) => r.sex === 2);
  const u = { m: est(men, unpaid, days), w: est(women, unpaid, days) };
  const p = { m: est(men, (r) => r.work, days), w: est(women, (r) => r.work, days) };
  const t = { m: est(men, (r) => r.work + unpaid(r), days), w: est(women, (r) => r.work + unpaid(r), days) };
  const l = { m: est(men, (r) => sum(r, FREE), days), w: est(women, (r) => sum(r, FREE), days) };
  say('');
  say(`${label}  (n = ${men.length} men, ${women.length} women)`);
  say(`  unpaid (hh + care)  men ${fmt(u.m.minutes)}  women ${fmt(u.w.minutes)}  gap ${fmt(u.w.minutes - u.m.minutes)} min  (SE floor ${fmt(diffSE(u.w, u.m), 1)})`);
  say(`  paid work           men ${fmt(p.m.minutes)}  women ${fmt(p.w.minutes)}  gap ${fmt(p.w.minutes - p.m.minutes)} min  (SE floor ${fmt(diffSE(p.w, p.m), 1)})`);
  say(`  paid + unpaid       men ${fmt(t.m.minutes)}  women ${fmt(t.w.minutes)}  gap ${fmt(t.w.minutes - t.m.minutes)} min  (SE floor ${fmt(diffSE(t.w, t.m), 1)})`);
  say(`  free time           men ${fmt(l.m.minutes)}  women ${fmt(l.w.minutes)}  gap ${fmt(l.w.minutes - l.m.minutes)} min  (SE floor ${fmt(diffSE(l.w, l.m), 1)})`);
  return {
    label, nMen: men.length, nWomen: women.length,
    unpaid: { men: u.m.minutes, women: u.w.minutes, gap: u.w.minutes - u.m.minutes, seFloor: diffSE(u.w, u.m) },
    paid: { men: p.m.minutes, women: p.w.minutes, gap: p.w.minutes - p.m.minutes, seFloor: diffSE(p.w, p.m) },
    total: { men: t.m.minutes, women: t.w.minutes, gap: t.w.minutes - t.m.minutes, seFloor: diffSE(t.w, t.m) },
    free: { men: l.m.minutes, women: l.w.minutes, gap: l.w.minutes - l.m.minutes, seFloor: diffSE(l.w, l.m) },
  };
}
const B = [];
B.push(secondShift(pooled.rows, 'everyone, 2023+2024', 731));
B.push(secondShift(pooled.rows.filter(workedToday), 'worked on the diary day, 2023+2024', 731));
B.push(secondShift(pooled.rows.filter((r) => workedToday(r) && parent(r)), 'worked on the diary day AND has own children <18, 2023+2024', 731));
B.push(secondShift(pooled.rows.filter((r) => workedToday(r) && parent(r) && r.ftpt === 1), 'worked, kids <18, usually FULL TIME, 2023+2024', 731));
B.push(secondShift(pooled.rows.filter((r) => workedToday(r) && parent(r) && r.ftpt === 1 && r.spouse === 1 && r.spEmp === 1), 'worked, kids <18, full time, spouse present AND employed', 731));
results.candidates.B_secondShift = B;

// --- rest inequality ------------------------------------------------------------------------------
H('CANDIDATE C — rest inequality');
const educGroup = (r) => (r.educ <= 38 ? 'no HS diploma' : r.educ === 39 ? 'HS grad' : r.educ <= 42 ? 'some college' : r.educ === 43 ? "bachelor's" : 'advanced');
say('Sleep (TRCODE 0101x), 2023+2024 pooled. ATUS sleep is diary sleep — time in bed asleep or trying');
say('to sleep — which is why it runs ~1.5 h above self-report surveys. That is a definition, not an error.');
say('');
const restGroups = [
  ['everyone', pooled.rows],
  ['men', pooled.rows.filter((r) => r.sex === 1)],
  ['women', pooled.rows.filter((r) => r.sex === 2)],
  ['employed full time', pooled.rows.filter((r) => employed(r) && r.ftpt === 1)],
  ['employed part time', pooled.rows.filter((r) => employed(r) && r.ftpt === 2)],
  ['unemployed', pooled.rows.filter((r) => r.telfs === 3 || r.telfs === 4)],
  ['not in labor force', pooled.rows.filter((r) => r.telfs === 5)],
  ['multiple jobs', pooled.rows.filter((r) => r.mjot === 1)],
  ['single job', pooled.rows.filter((r) => r.mjot === 2)],
  ['youngest child < 1', pooled.rows.filter((r) => r.youngest >= 0 && r.youngest < 1)],
  ['youngest child < 6', pooled.rows.filter((r) => r.youngest >= 0 && r.youngest < 6)],
  ['no children in hh', pooled.rows.filter((r) => r.hhChild === 2)],
  ...['no HS diploma', 'HS grad', 'some college', "bachelor's", 'advanced'].map((g) => [`educ: ${g}`, pooled.rows.filter((r) => educGroup(r) === g)]),
  ['age 15-24', pooled.rows.filter((r) => r.age < 25)],
  ['age 25-54', pooled.rows.filter((r) => r.age >= 25 && r.age < 55)],
  ['age 55-64', pooled.rows.filter((r) => r.age >= 55 && r.age < 65)],
  ['age 65+', pooled.rows.filter((r) => r.age >= 65)],
];
say('group                        n     sleep    <6h%    <7h%     free');
const C = [];
for (const [label, rows] of restGroups) {
  if (!rows.length) continue;
  const s = est(rows, (r) => r.sleep, 731);
  const u6 = share(rows, (r) => r.sleep < 360), u7 = share(rows, (r) => r.sleep < 420);
  const f = est(rows, (r) => sum(r, FREE), 731);
  say(`${label.padEnd(26)} ${String(rows.length).padStart(5)}  ${hm(s.minutes).padStart(7)}  ${fmt(u6.pct).padStart(5)}  ${fmt(u7.pct).padStart(6)}  ${hm(f.minutes).padStart(7)}`);
  C.push({ label, n: rows.length, sleepMin: s.minutes, seFloor: s.se, under6Pct: u6.pct, under7Pct: u7.pct, freeMin: f.minutes });
}
results.candidates.C_rest = C;

// --- time poverty ---------------------------------------------------------------------------------
H('CANDIDATE D — time poverty: the share of the day nobody chose');
say('necessary = personal_care + eating_drinking · obligated = work + household + care(hh+nonhh) + purchasing + education');
say('free = leisure_sports + org_civic_religious + phone_mail_email + other_nec');
say('Travel is already inside each major (ticket 03), so commute sits inside "obligated".');
say('');
say('year  necessary  obligated     free   free%   share with <3h free');
for (const y of YEARS) {
  const d = D[y];
  const n = est(d.rows, (r) => sum(r, NECESSARY), d.days);
  const o = est(d.rows, (r) => sum(r, OBLIGATED), d.days);
  const f = est(d.rows, (r) => sum(r, FREE), d.days);
  const p = share(d.rows, (r) => sum(r, FREE) < 180);
  say(`${y}   ${hm(n.minutes).padStart(8)}  ${hm(o.minutes).padStart(9)}  ${hm(f.minutes).padStart(7)}  ${fmt((f.minutes / 1440) * 100)}%   ${fmt(p.pct)}%`);
}
say('');
say('2023+2024 pooled, by group — free time and the share with under three hours of it:');
say('group                        n      free   <3h free%   obligated');
const povGroups = [
  ['everyone', pooled.rows],
  ['worked on the diary day', pooled.rows.filter(workedToday)],
  ['worked + kids <18', pooled.rows.filter((r) => workedToday(r) && parent(r))],
  ['worked + kids <6', pooled.rows.filter((r) => workedToday(r) && r.youngest >= 0 && r.youngest < 6)],
  ['worked + kids <6, women', pooled.rows.filter((r) => workedToday(r) && r.youngest >= 0 && r.youngest < 6 && r.sex === 2)],
  ['worked + kids <6, men', pooled.rows.filter((r) => workedToday(r) && r.youngest >= 0 && r.youngest < 6 && r.sex === 1)],
  ['single parent, worked', pooled.rows.filter((r) => workedToday(r) && parent(r) && r.spouse === 3)],
  ['retired-age 65+', pooled.rows.filter((r) => r.age >= 65)],
  ['did not work, no kids', pooled.rows.filter((r) => !workedToday(r) && r.hhChild === 2)],
];
const Dp = [];
for (const [label, rows] of povGroups) {
  if (!rows.length) continue;
  const f = est(rows, (r) => sum(r, FREE), 731);
  const o = est(rows, (r) => sum(r, OBLIGATED), 731);
  const p = share(rows, (r) => sum(r, FREE) < 180);
  say(`${label.padEnd(26)} ${String(rows.length).padStart(5)}  ${hm(f.minutes).padStart(7)}   ${fmt(p.pct).padStart(6)}%   ${hm(o.minutes).padStart(9)}`);
  Dp.push({ label, n: rows.length, freeMin: f.minutes, seFloor: f.se, under3hPct: p.pct, obligatedMin: o.minutes });
}
results.candidates.D_timePoverty = Dp;

// --- the braid ------------------------------------------------------------------------------------
H('CANDIDATE E — the braid: how much of America is doing the same thing, minute by minute');
say('For each minute of the diary day, the weighted share doing the single most common major.');
say('S8 binds: this is LOCAL time on each respondent\'s own diary day, never simultaneity.');
say('');
function braid(d) {
  const modal = new Float64Array(1440), modalIdx = new Int8Array(1440), ent = new Float64Array(1440);
  for (let m = 0; m < 1440; m++) {
    let best = -1, bi = -1, H2 = 0;
    for (let k = 0; k < 12; k++) {
      const p = d.grid[k][m] / d.totalW;
      if (p > best) { best = p; bi = k; }
      if (p > 0) H2 -= p * Math.log(p);
    }
    modal[m] = best; modalIdx[m] = bi; ent[m] = H2 / Math.log(12);
  }
  return { modal, modalIdx, ent };
}
const E24 = braid(D[2024]);
let tight = 0, loose = 0;
for (let m = 0; m < 1440; m++) { if (E24.modal[m] > E24.modal[tight]) tight = m; if (E24.modal[m] < E24.modal[loose]) loose = m; }
say(`2024 · most agreement:  ${clock(tight)} — ${fmt(E24.modal[tight] * 100)}% doing ${MAJORS[E24.modalIdx[tight]]}  (entropy ${fmt(E24.ent[tight], 3)})`);
say(`2024 · least agreement: ${clock(loose)} — ${fmt(E24.modal[loose] * 100)}% doing ${MAJORS[E24.modalIdx[loose]]}  (entropy ${fmt(E24.ent[loose], 3)})`);
say(`Ratio: the country is ${fmt(E24.modal[tight] / E24.modal[loose], 1)}× more unanimous at its tightest than its loosest.`);
say('');
say('Hourly (2024): modal activity, its share, and normalized entropy —');
say('hour        modal activity      share   entropy');
const braidHours = [];
for (let h = 0; h < 24; h++) {
  const m = ((h * 60) - 240 + 1440) % 1440; // clock hour → minutes-from-4am
  braidHours.push({ clock: clock(m), modal: MAJORS[E24.modalIdx[m]], pct: E24.modal[m] * 100, entropy: E24.ent[m] });
  say(`${clock(m).padStart(9)}   ${MAJORS[E24.modalIdx[m]].padEnd(18)} ${fmt(E24.modal[m] * 100).padStart(6)}%   ${fmt(E24.ent[m], 3)}`);
}
say('');
say('The same measure across years (peak agreement / trough agreement):');
for (const y of YEARS) {
  const b = braid(D[y]);
  let t = 0, l = 0;
  for (let m = 0; m < 1440; m++) { if (b.modal[m] > b.modal[t]) t = m; if (b.modal[m] < b.modal[l]) l = m; }
  say(`  ${y}: peak ${fmt(b.modal[t] * 100)}% at ${clock(t)} (${MAJORS[b.modalIdx[t]]}) · trough ${fmt(b.modal[l] * 100)}% at ${clock(l)} (${MAJORS[b.modalIdx[l]]})`);
}
say('');
say('Asleep / working / working-from-home curves, hourly, 2024 (share of the whole population):');
say('hour       asleep%   working%   of workers, at home%');
const curves = [];
for (let h = 0; h < 24; h++) {
  const m = ((h * 60) - 240 + 1440) % 1440;
  const a = (D[2024].asleep[m] / D[2024].totalW) * 100;
  const w = (D[2024].working[m] / D[2024].totalW) * 100;
  const wh = D[2024].working[m] > 0 ? (D[2024].workingHome[m] / D[2024].working[m]) * 100 : 0;
  curves.push({ clock: clock(m), asleepPct: a, workingPct: w, atHomeOfWorkingPct: wh });
  say(`${clock(m).padStart(9)}  ${fmt(a).padStart(7)}   ${fmt(w).padStart(7)}    ${fmt(wh).padStart(7)}`);
}
let peakWork = 0;
for (let m = 0; m < 1440; m++) if (D[2024].working[m] > D[2024].working[peakWork]) peakWork = m;
say('');
say(`Peak working minute 2024: ${clock(peakWork)} at ${fmt((D[2024].working[peakWork] / D[2024].totalW) * 100)}% of the 15+ population.`);
let peakSleep = 0;
for (let m = 0; m < 1440; m++) if (D[2024].asleep[m] > D[2024].asleep[peakSleep]) peakSleep = m;
say(`Peak asleep minute 2024:  ${clock(peakSleep)} at ${fmt((D[2024].asleep[peakSleep] / D[2024].totalW) * 100)}%.`);
// same two moments across years, for the "did the shape move" question
for (const y of YEARS) {
  let pw = 0, ps = 0;
  for (let m = 0; m < 1440; m++) { if (D[y].working[m] > D[y].working[pw]) pw = m; if (D[y].asleep[m] > D[y].asleep[ps]) ps = m; }
  say(`  ${y}: peak work ${clock(pw)} ${fmt((D[y].working[pw] / D[y].totalW) * 100)}% · peak sleep ${clock(ps)} ${fmt((D[y].asleep[ps] / D[y].totalW) * 100)}% · WFH share at peak work ${fmt((D[y].workingHome[pw] / D[y].working[pw]) * 100)}%`);
}
results.candidates.E_braid = {
  peak: { clock: clock(tight), pct: E24.modal[tight] * 100, major: MAJORS[E24.modalIdx[tight]] },
  trough: { clock: clock(loose), pct: E24.modal[loose] * 100, major: MAJORS[E24.modalIdx[loose]] },
  hours: braidHours, curves,
};

// --- extra: what the data itself surfaces ----------------------------------------------------------
H('CANDIDATE F — assorted things the data surfaces (screened for size)');
const p2 = pooled.rows;
say('2023+2024 pooled, whole population unless noted:');
const tv = est(p2, (r) => r.tv, 731), soc = est(p2, (r) => r.socialize, 731);
const ex = est(p2, (r) => r.exercise, 731), leis = est(p2, (r) => min(r, 'leisure_sports'), 731);
say(`  TV: ${hm(tv.minutes)}/day · ${fmt(tv.pct)}% watched · ${hm(tv.amongParticipants)} among watchers`);
say(`  TV as a share of ALL free time: ${fmt((tv.minutes / est(p2, (r) => sum(r, FREE), 731).minutes) * 100)}%`);
say(`  socializing face-to-face: ${hm(soc.minutes)}/day · ${fmt(soc.pct)}% did any`);
say(`  sports/exercise/recreation (1301x): ${hm(ex.minutes)}/day · ${fmt(ex.pct)}% did any`);
say(`  TV ÷ socializing = ${fmt(tv.minutes / soc.minutes, 1)}×`);
say('');
say('Days that contain zero of a thing (weighted share of person-days):');
for (const [label, pred] of [
  ['zero minutes of socializing (1201x)', (r) => r.socialize === 0],
  ['zero minutes of exercise (1301x)', (r) => r.exercise === 0],
  ['zero minutes of care for household members', (r) => min(r, 'care_household') === 0],
  ['zero minutes outside the home (all episodes TEWHERE home/unlocated)', null],
  ['zero minutes of paid work', (r) => r.work === 0],
  ['zero free time at all', (r) => sum(r, FREE) === 0],
]) {
  if (!pred) continue;
  say(`  ${label.padEnd(52)} ${fmt(share(p2, pred).pct)}%`);
}
say('');
say('Weekday vs weekend, 2023+2024 (the 2/7 weighting makes this honest):');
const wd = p2.filter((r) => r.day >= 2 && r.day <= 6), we = p2.filter((r) => r.day === 1 || r.day === 7);
for (const [label, rows] of [['weekday', wd], ['weekend', we]]) {
  const s = est(rows, (r) => r.sleep, 731), f = est(rows, (r) => sum(r, FREE), 731), o = est(rows, (r) => sum(r, OBLIGATED), 731);
  say(`  ${label.padEnd(8)} n=${String(rows.length).padStart(5)}  sleep ${hm(s.minutes)}  free ${hm(f.minutes)}  obligated ${hm(o.minutes)}`);
}
results.candidates.F_misc = {
  tvMin: tv.minutes, tvPct: tv.pct, socializeMin: soc.minutes, socializePct: soc.pct,
  tvShareOfFree: (tv.minutes / est(p2, (r) => sum(r, FREE), 731).minutes) * 100,
  zeroSocializePct: share(p2, (r) => r.socialize === 0).pct,
  zeroExercisePct: share(p2, (r) => r.exercise === 0).pct,
  zeroWorkPct: share(p2, (r) => r.work === 0).pct,
};

// --- renderability screen -------------------------------------------------------------------------
H('RENDERABILITY SCREEN — thread counts each candidate needs');
say('R5: any sub-25,652 draw must be systematic PPS on cumulative TUFINLWGT. Legibility ceiling is');
say('844 traceable threads on a phone (ticket 04). A candidate whose smallest comparison cell holds');
say('fewer sample days than that cannot be drawn one-thread-per-person at full contrast.');
say('');
const cells = [
  ['A · 2019 workers who commuted', D[2019].rows.filter((r) => workedToday(r) && r.commute > 0)],
  ['A · 2024 workers who commuted', D[2024].rows.filter((r) => workedToday(r) && r.commute > 0)],
  ['A · 2024 workers, home only', D[2024].rows.filter((r) => workedToday(r) && r.wah >= r.work && r.commute === 0)],
  ['B · working mothers of minors (pooled)', pooled.rows.filter((r) => workedToday(r) && parent(r) && r.sex === 2)],
  ['B · working fathers of minors (pooled)', pooled.rows.filter((r) => workedToday(r) && parent(r) && r.sex === 1)],
  ['B · same, full-time only, women', pooled.rows.filter((r) => workedToday(r) && parent(r) && r.ftpt === 1 && r.sex === 2)],
  ['C · multiple jobs (pooled)', pooled.rows.filter((r) => r.mjot === 1)],
  ['C · youngest child under 1 (pooled)', pooled.rows.filter((r) => r.youngest >= 0 && r.youngest < 1)],
  ['D · single parents who worked (pooled)', pooled.rows.filter((r) => workedToday(r) && parent(r) && r.spouse === 3)],
  ['E · everyone, one year', D[2024].rows],
  ['E · everyone, three years', [...D[2019].rows, ...D[2023].rows, ...D[2024].rows]],
];
say('cell                                        n days   weight CV   >844?');
for (const [label, rows] of cells) {
  let sw = 0, sw2 = 0;
  for (const r of rows) { sw += r.w; sw2 += r.w * r.w; }
  const mean = sw / rows.length;
  const varW = rows.reduce((a, r) => a + (r.w - mean) ** 2, 0) / rows.length;
  say(`${label.padEnd(42)} ${String(rows.length).padStart(6)}   ${fmt(Math.sqrt(varW) / mean, 2).padStart(9)}   ${rows.length >= 844 ? 'yes' : 'NO'}`);
}

// --- objections ------------------------------------------------------------------------------------
H('OBJECTIONS — the check each candidate has to survive');

say('A1. "Home-only workers just worked a shorter day." They did: 355 vs 529 min. Re-run with BOTH');
say('    sides restricted to a real working day (>= 6 h of paid work):');
const hoLong = w24.filter((r) => r.wah >= r.work && r.commute === 0 && r.work >= 360);
const coLong = commuters.filter((r) => r.work >= 360);
say(`    n: home-only ${hoLong.length} · commuters ${coLong.length}`);
say('    major                home-only  commuters     diff   SEΔ(floor)');
const A1 = {};
for (const m of ['work', 'household', 'care_household', 'leisure_sports', 'eating_drinking', 'purchasing', 'personal_care']) {
  const a = est(hoLong, (r) => min(r, m), 366), b = est(coLong, (r) => min(r, m), 366);
  A1[m] = { homeOnly: a.minutes, commuters: b.minutes, delta: a.minutes - b.minutes, seFloor: diffSE(a, b) };
  say(`    ${m.padEnd(20)} ${fmt(a.minutes).padStart(9)} ${fmt(b.minutes).padStart(10)} ${fmt(a.minutes - b.minutes).padStart(8)} ${fmt(diffSE(a, b), 1).padStart(9)}`);
}
const slA = est(hoLong, (r) => r.sleep, 366), slB = est(coLong, (r) => r.sleep, 366);
say(`    ${'sleep'.padEnd(20)} ${fmt(slA.minutes).padStart(9)} ${fmt(slB.minutes).padStart(10)} ${fmt(slA.minutes - slB.minutes).padStart(8)} ${fmt(diffSE(slA, slB), 1).padStart(9)}`);

say('');
say('A2. The at-home share of ALL paid-work minutes (population level, weighted):');
const A2 = {};
for (const y of YEARS) {
  const d = D[y];
  let sw = 0, swWork = 0, swHome = 0;
  for (const r of d.rows) { sw += r.w; swWork += r.w * r.work; swHome += r.w * r.wah; }
  A2[y] = (swHome / swWork) * 100;
  say(`    ${y}: ${fmt(A2[y])}% of every paid-work minute in America happened at home`);
}

say('');
say('A3. Is the commute drop just "fewer people worked"? Decompose 2019 → 2024:');
for (const y of [2019, 2024]) {
  const d = D[y];
  const workedPct = share(d.rows, workedToday).pct;
  const workers = d.rows.filter(workedToday);
  const comOfWorkers = share(workers, (r) => r.commute > 0).pct;
  const comMin = est(workers.filter((r) => r.commute > 0), (r) => r.commute, d.days).minutes;
  say(`    ${y}: worked ${fmt(workedPct)}% × commuted|worker ${fmt(comOfWorkers)}% × ${fmt(comMin)} min = ${fmt((workedPct / 100) * (comOfWorkers / 100) * comMin, 2)} min/person/day`);
}
say('    → the middle term is the one that moved; participation fell a little, minutes-per-commuter rose.');

say('');
say('B1. "The free-time gap is really an age or an employment gap." Condition it away and see:');
const B1 = [];
for (const [label, rows] of [
  ['everyone', pooled.rows],
  ['age 25-54 only', pooled.rows.filter((r) => r.age >= 25 && r.age < 55)],
  ['employed full time', pooled.rows.filter((r) => employed(r) && r.ftpt === 1)],
  ['full time, age 25-54', pooled.rows.filter((r) => employed(r) && r.ftpt === 1 && r.age >= 25 && r.age < 55)],
  ['full time, 25-54, NO kids', pooled.rows.filter((r) => employed(r) && r.ftpt === 1 && r.age >= 25 && r.age < 55 && r.hhChild === 2)],
  ['full time, 25-54, kids <18', pooled.rows.filter((r) => employed(r) && r.ftpt === 1 && r.age >= 25 && r.age < 55 && r.hhChild === 1)],
  ['not in labor force', pooled.rows.filter((r) => r.telfs === 5)],
  ['age 65+', pooled.rows.filter((r) => r.age >= 65)],
]) {
  const men = rows.filter((r) => r.sex === 1), women = rows.filter((r) => r.sex === 2);
  const a = est(men, (r) => sum(r, FREE), 731), b = est(women, (r) => sum(r, FREE), 731);
  const t = est(men, (r) => r.tv, 731), u = est(women, (r) => r.tv, 731);
  B1.push({ label, nMen: men.length, nWomen: women.length, menFree: a.minutes, womenFree: b.minutes, gap: a.minutes - b.minutes, seFloor: diffSE(a, b), tvGap: t.minutes - u.minutes });
  say(`    ${label.padEnd(24)} men ${fmt(a.minutes).padStart(6)}  women ${fmt(b.minutes).padStart(6)}  gap ${fmt(a.minutes - b.minutes).padStart(6)} ± ${fmt(diffSE(a, b), 1)}  (of which TV: ${fmt(t.minutes - u.minutes)})`);
}

say('');
say('E1. "The braid says nothing but \'people sleep at night\'." Test the waking half on its own:');
let wMin = null, wMax = null, below33 = 0, below40 = 0;
for (let m = 0; m < 1440; m++) {
  const t = (m + 240) % 1440; // clock minute
  if (t < 8 * 60 || t >= 22 * 60) continue; // 8 a.m. – 10 p.m.
  if (wMin === null || E24.modal[m] < E24.modal[wMin]) wMin = m;
  if (wMax === null || E24.modal[m] > E24.modal[wMax]) wMax = m;
  if (E24.modal[m] < 1 / 3) below33++;
  if (E24.modal[m] < 0.4) below40++;
}
say(`    Waking window 8 a.m.–10 p.m. (840 minutes):`);
say(`      loosest ${clock(wMin)} — ${fmt(E24.modal[wMin] * 100)}% doing ${MAJORS[E24.modalIdx[wMin]]}`);
say(`      tightest ${clock(wMax)} — ${fmt(E24.modal[wMax] * 100)}% doing ${MAJORS[E24.modalIdx[wMax]]}`);
say(`      minutes where the most common activity holds under a third of the country: ${below33} of 840 (${fmt((below33 / 840) * 100)}%)`);
say(`      minutes under 40%: ${below40} of 840 (${fmt((below40 / 840) * 100)}%)`);
say('    How many of the 12 majors it takes to cover half the country, by hour:');
const cover = [];
for (let h = 6; h < 24; h += 2) {
  const m = ((h * 60) - 240 + 1440) % 1440;
  const ps = MAJORS.map((_, k) => D[2024].grid[k][m] / D[2024].totalW).sort((a, b) => b - a);
  let acc = 0, k = 0;
  while (acc < 0.5 && k < 12) { acc += ps[k]; k++; }
  cover.push({ clock: clock(m), majorsToHalf: k });
  say(`      ${clock(m).padStart(9)}: ${k}`);
}

say('');
say('F1. Socializing on the gate-proven published leaf (1201 + 1202), not the sub-code:');
say('    (the loose version above used 120101/120199 only — this is the number BLS itself publishes)');
const socLeaf = est(pooled.rows, (r) => r.socialLeaf, 731);
const tvP = est(pooled.rows, (r) => r.tv, 731);
say(`    socializing and communicating: ${hm(socLeaf.minutes)}/day · ${fmt(socLeaf.pct)}% engaged · ${hm(socLeaf.amongParticipants)} among them`);
say(`    days with ZERO of it: ${fmt(100 - socLeaf.pct)}%`);
say(`    TV ÷ socializing (published leaf) = ${fmt(tvP.minutes / socLeaf.minutes, 1)}×`);
for (const y of YEARS) {
  const e = est(D[y].rows, (r) => r.socialLeaf, D[y].days);
  say(`      ${y}: ${fmt(e.hours, 2)} h/day · ${fmt(e.pct)}% engaged   (BLS A-1 prints 0.64 / — / 0.59 h for 2019 / 2024)`);
}
say('');
say('D1. "Free time" is a construct, not a published category. What is actually in it?');
const freeEst = est(pooled.rows, (r) => sum(r, FREE), 731);
for (const m of FREE) {
  const e = est(pooled.rows, (r) => min(r, m), 731);
  say(`    ${m.padEnd(20)} ${fmt(e.minutes).padStart(6)} min  (${fmt((e.minutes / freeEst.minutes) * 100)}% of free time)`);
}
say(`    TV alone is ${fmt((est(pooled.rows, (r) => r.tv, 731).minutes / freeEst.minutes) * 100)}% of it.`);

say('');
say('D2. Same gap on the PUBLISHED major "Leisure and sports" alone — no construct, gate-proven:');
const D2 = [];
for (const [label, rows] of [
  ['everyone', pooled.rows],
  ['full time, 25-54', pooled.rows.filter((r) => employed(r) && r.ftpt === 1 && r.age >= 25 && r.age < 55)],
  ['worked + kids <18', pooled.rows.filter((r) => workedToday(r) && parent(r))],
]) {
  const men = rows.filter((r) => r.sex === 1), women = rows.filter((r) => r.sex === 2);
  const a = est(men, (r) => min(r, 'leisure_sports'), 731), b = est(women, (r) => min(r, 'leisure_sports'), 731);
  D2.push({ label, men: a.minutes, women: b.minutes, gap: a.minutes - b.minutes, seFloor: diffSE(a, b) });
  say(`    ${label.padEnd(20)} men ${fmt(a.minutes).padStart(6)}  women ${fmt(b.minutes).padStart(6)}  gap ${fmt(a.minutes - b.minutes).padStart(6)} ± ${fmt(diffSE(a, b), 1)}`);
}

say('');
say('R1. Sample days behind each candidate\'s thread set (the 844 traceable-thread line):');
for (const [label, rows] of [
  ['2019 workers', D[2019].rows.filter(workedToday)],
  ['2024 workers', D[2024].rows.filter(workedToday)],
  ['2019 commuters', D[2019].rows.filter((r) => r.commute > 0)],
  ['2024 commuters', D[2024].rows.filter((r) => r.commute > 0)],
  ['2024 everyone', D[2024].rows],
  ['pooled 23+24 men', pooled.rows.filter((r) => r.sex === 1)],
  ['pooled 23+24 women', pooled.rows.filter((r) => r.sex === 2)],
  ['pooled worked + kids <6', pooled.rows.filter((r) => workedToday(r) && r.youngest >= 0 && r.youngest < 6)],
]) say(`    ${label.padEnd(26)} ${String(rows.length).padStart(6)}  ${rows.length >= 844 ? 'above 844' : 'BELOW 844'}`);

results.objections = { A1, A2, B1, D2, coverToHalf: cover, wakingBelowThirdMinutes: below33 };

// ---------------------------------------------------------------------------- write
mkdirSync(join(ROOT, 'spike', 'spines', 'results'), { recursive: true });
writeFileSync(join(ROOT, 'spike', 'spines', 'results', 'report.txt'), out.join('\n'));
if (process.argv.includes('--json')) {
  writeFileSync(join(ROOT, 'spike', 'spines', 'results', 'spines.json'), JSON.stringify(results, null, 2));
}
say('');
say('Wrote spike/spines/results/report.txt');
