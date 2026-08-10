/**
 * Site payload builder — turns data/extract/*.csv into the three payloads the
 * variations ship:
 *
 *   public/data/grid.bin    per-minute weighted occupancy, 2019 + 2024
 *                           (12 majors + asleep + work-at-home, u16 share × 65535)
 *   public/data/days.bin    systematic PPS sample (TUFINLWGT) of 2024 diary days,
 *                           episode chains + subgroup flags — the fray's threads
 *   src/gen/stats.json      every number the sites print, recomputed here with
 *                           verify.mjs's spec (weighted, at-the-hour, 12 majors)
 *
 * Verification is built in: any number the brief pins that drifts more than its
 * tolerance fails the run. Estimators mirror spike/claim/verify.mjs — do not
 * re-derive them elsewhere.
 *
 *   node scripts/site/build-payloads.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const MAJORS = [
  'personal_care', 'eating_drinking', 'household', 'care_household', 'care_nonhousehold',
  'work', 'education', 'purchasing', 'org_civic_religious', 'leisure_sports',
  'phone_mail_email', 'other_nec',
];
const MI = Object.fromEntries(MAJORS.map((m, i) => [m, i]));
const FREE = ['leisure_sports', 'org_civic_religious', 'phone_mail_email', 'other_nec'].map((m) => MI[m]);
const OBLIGATED = ['work', 'household', 'care_household', 'care_nonhousehold', 'purchasing', 'education'].map((m) => MI[m]);

// ---------------------------------------------------------------- csv (verify.mjs's reader)

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

// ---------------------------------------------------------------- load one year

function load(year) {
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
      day: +r[rc.TUDIARYDAY],          // 1=Sun … 7=Sat
      holiday: +r[rc.TRHOLIDAY],
      hhChild: +r[rc.TRHHCHILD],       // 1 = child <18 in household
      youngest: +r[rc.TRYHHCHILD],     // age of youngest, -1 none
      age: +r[rc.TEAGE],
      sex: +r[rc.TESEX],               // 1 man, 2 woman
      ftpt: +r[rc.TRDPFTPT],           // 1 FT, 2 PT
      spouse: +r[rc.TRSPPRES],
      work: +r[rc.WORK_MIN],
      commute: +r[rc.COMMUTE_MIN],
      workHome: +r[rc.WORK_AT_HOME_MIN],
      // per-major minutes, filled from episodes
      maj: new Float64Array(12),
      tv: 0, social: 0, exercise: 0, sleep: 0,
      episodes: [],
    };
    byId.set(rec.id, rec);
    rows.push(rec);
  }
  const n = rows.length;

  const grid = Array.from({ length: 12 }, () => new Float64Array(1440));
  const asleep = new Float64Array(1440);
  const workHomeGrid = new Float64Array(1440);
  let totalW = 0;
  for (const r of rows) totalW += r.w;

  for (const e of E.rows) {
    const rec = byId.get(e[ec.TUCASEID]);
    const start = +e[ec.START_MIN_FROM_4AM];
    const dur = +e[ec.DUR_MIN];
    const end = start + dur;
    const code = e[ec.TRCODE];
    const where = +e[ec.TEWHERE];
    const mi = MI[e[ec.MAJOR]];
    const sleeping = code.startsWith('0101');
    const tv = code.startsWith('120303') || code.startsWith('120304');
    // published "socializing and communicating" leaf = 1201 + 1202 (report F1)
    const social = code.startsWith('1201') || code.startsWith('1202');
    const exercise = code.startsWith('1301');
    const atHome = where === 1;
    const g = grid[mi];
    for (let m = start; m < end; m++) {
      g[m] += rec.w;
      if (sleeping) asleep[m] += rec.w;
      if (mi === MI.work && atHome) workHomeGrid[m] += rec.w;
    }
    rec.maj[mi] += dur;
    if (tv) rec.tv += dur;
    if (social) rec.social += dur;
    if (exercise) rec.exercise += dur;
    if (sleeping) rec.sleep += dur;
    rec.episodes.push({ start, dur, mi, home: atHome ? 1 : 0 });
  }

  // 1440 invariant re-asserted
  for (const r of rows) {
    let s = 0;
    for (let k = 0; k < 12; k++) s += r.maj[k];
    if (s !== 1440) throw new Error(`${year} ${r.id}: day sums to ${s}`);
  }

  return { year, rows, n, grid, asleep, workHomeGrid, totalW };
}

// ---------------------------------------------------------------- estimators

const fromClock = (h24, mm = 0) => (((h24 * 60 + mm) - 240) + 1440) % 1440;

/** weighted modal share across 12 majors at minute m, over a subset (default all) */
function modalAt(d, m, filter = null) {
  let tw = 0;
  const acc = new Float64Array(12);
  if (!filter) {
    for (let k = 0; k < 12; k++) acc[k] = d.grid[k][m];
    tw = d.totalW;
  } else {
    for (const r of d.rows) {
      if (!filter(r)) continue;
      tw += r.w;
    }
    for (const r of d.rows) {
      if (!filter(r)) continue;
      const mi = majorAtMinute(r, m);
      acc[mi] += r.w;
    }
  }
  let best = 0, bi = 0;
  for (let k = 0; k < 12; k++) if (acc[k] > best) { best = acc[k]; bi = k; }
  return { share: best / tw, major: MAJORS[bi] };
}

/**
 * The frozen headline spec: modal share of a clock-HOUR WINDOW (60 aligned minutes),
 * 12 majors, weighted — verify.mjs's modalAtResolution(w=60). "3 a.m." names an hour,
 * so the hour is the honest resolution (claim report, "the numbers the copy's words
 * actually name").
 */
function modalHour(d, clockHour, filter = null) {
  const s = fromClock(clockHour);
  const acc = new Float64Array(12);
  let tw = 0;
  if (!filter) {
    tw = d.totalW;
    for (let k = 0; k < 12; k++)
      for (let m = s; m < s + 60; m++) acc[k] += d.grid[k][m];
  } else {
    for (const r of d.rows) {
      if (!filter(r)) continue;
      tw += r.w;
      for (const e of r.episodes) {
        const a = Math.max(e.start, s), b = Math.min(e.start + e.dur, s + 60);
        if (b > a) acc[e.mi] += r.w * (b - a);
      }
    }
  }
  let best = 0, bi = 0;
  for (let k = 0; k < 12; k++) if (acc[k] > best) { best = acc[k]; bi = k; }
  return { share: best / (tw * 60), major: MAJORS[bi] };
}

/** weighted asleep share of a clock-hour window */
function asleepHour(d, clockHour) {
  const st = fromClock(clockHour);
  let v = 0;
  for (let m = st; m < st + 60; m++) v += d.asleep[m];
  return v / (d.totalW * 60);
}

function majorAtMinute(r, m) {
  for (const e of r.episodes) if (m >= e.start && m < e.start + e.dur) return e.mi;
  throw new Error('uncovered minute');
}

/** weighted mean of fn(r) over a subset */
function wMean(rows, fn, filter = null) {
  let sw = 0, sx = 0;
  for (const r of rows) {
    if (filter && !filter(r)) continue;
    sw += r.w; sx += r.w * fn(r);
  }
  return sx / sw;
}
/** weighted share of a predicate over a subset */
function wShare(rows, pred, filter = null) {
  let sw = 0, sx = 0;
  for (const r of rows) {
    if (filter && !filter(r)) continue;
    sw += r.w; if (pred(r)) sx += r.w;
  }
  return sx / sw;
}
const sumFree = (r) => FREE.reduce((a, k) => a + r.maj[k], 0);
const sumObl = (r) => OBLIGATED.reduce((a, k) => a + r.maj[k], 0);
const isWeekend = (r) => r.day === 1 || r.day === 7;

// ---------------------------------------------------------------- run

console.log('loading years…');
const D = { 2019: load(2019), 2023: load(2023), 2024: load(2024) };
const d24 = D[2024], d19 = D[2019];
const pooled = [...D[2023].rows, ...D[2024].rows];
console.log(`2019 n=${d19.n} · 2023 n=${D[2023].n} · 2024 n=${d24.n}`);

const checks = [];
function expect(label, got, want, tol) {
  const ok = Math.abs(got - want) <= tol;
  checks.push({ label, got, want, tol, ok });
  console.log(`${ok ? '  ok ' : 'FAIL '} ${label}: got ${got.toFixed(3)} want ${want} ±${tol}`);
  return got;
}

// ---- headline (frozen spec: 2024 · majors12 · 60-minute clock-hour windows)
const M3 = fromClock(3), MNOON = fromClock(12);
const at3 = modalHour(d24, 3), atNoon = modalHour(d24, 12);
expect('modal 3am hour 2024', at3.share * 100, 96.5, 0.15);
expect('modal noon hour 2024', atNoon.share * 100, 25.8, 0.15);
expect('headline gap pp', (at3.share - atNoon.share) * 100, 70.8, 0.2);
const hourly = [];
const hourlyWorkers = []; // worked 6h+ on a weekday — the tightening series
const worked6wd = (r) => r.work >= 360 && !isWeekend(r);
for (let h = 0; h < 24; h++) {
  const clockH = (h + 4) % 24; // start at 4 a.m.
  const r = modalHour(d24, clockH);
  hourly.push({ hour: clockH, share: +(r.share * 100).toFixed(1), major: r.major });
  const w = modalHour(d24, clockH, worked6wd);
  hourlyWorkers.push({ hour: clockH, share: +(w.share * 100).toFixed(1), major: w.major });
}
const asleepAt3 = asleepHour(d24, 3);
expect('asleep 3am hour 2024', asleepAt3 * 100, 96.0, 0.15);
const asleepNoon = asleepHour(d24, 12);
expect('asleep noon hour 2024', asleepNoon * 100, 4.0, 0.3);

// plateau: minutes with modal share ≥95%
let plateau = 0;
const modalByMin = new Float64Array(1440);
for (let m = 0; m < 1440; m++) {
  let best = 0;
  for (let k = 0; k < 12; k++) if (d24.grid[k][m] > best) best = d24.grid[k][m];
  modalByMin[m] = best / d24.totalW;
  if (modalByMin[m] >= 0.95) plateau++;
}
expect('≥95% plateau minutes', plateau, 120, 15);

// waking window 8am–10pm: minutes where modal < 1/3 and < 0.4
const w0 = fromClock(8), w1 = fromClock(22);
let under33 = 0, under40 = 0, total = 0;
for (let m = w0; m < w1; m++) { total++; if (modalByMin[m] < 1 / 3) under33++; if (modalByMin[m] < 0.4) under40++; }
expect('waking minutes under 1/3', under33, 522, 12);
expect('waking minutes under 40%', under40, 630, 12);

// worker tightening (recomputed at the hour)
const worked = (r) => r.work > 0;
const worked6 = (r) => r.work >= 360;
const wNoon = modalAt(d24, MNOON, worked);
const w6Noon = modalAt(d24, MNOON, worked6);
const w62pm = modalAt(d24, fromClock(14), worked6wd); // 86.4 is the weekday slice (claim report C3/C4)
expect('worked @noon modal', wNoon.share * 100, 57.4, 0.15);
expect('worked6h @noon modal', w6Noon.share * 100, 65.4, 0.15);
expect('worked6h weekday @2pm modal', w62pm.share * 100, 86.4, 0.15);

// ---- ledger (§5.2): weighted mean minutes per major per year
const ledger = {};
for (const y of [2019, 2023, 2024]) {
  ledger[y] = MAJORS.map((_, k) => +wMean(D[y].rows, (r) => r.maj[k]).toFixed(1));
}
expect('ledger sleep-major 2024', ledger[2024][MI.personal_care], 587.8, 0.15);
expect('ledger work 2019', ledger[2019][MI.work], 216.8, 0.15);
expect('ledger household 2024', ledger[2024][MI.household], 120.8, 0.15);
expect('ledger leisure 2024', ledger[2024][MI.leisure_sports], 303.9, 0.15);

// ---- work moved indoors (§5.3)
function workPeak(d) {
  let bm = 0, bv = 0;
  for (let m = 0; m < 1440; m++) if (d.grid[MI.work][m] > bv) { bv = d.grid[MI.work][m]; bm = m; }
  return { minute: bm, share: bv / d.totalW, homeShareOfWorkers: d.workHomeGrid[bm] / bv };
}
const pk19 = workPeak(d19), pk24 = workPeak(d24);
expect('peak work share 2019', pk19.share * 100, 32.5, 0.3);
expect('peak work share 2024', pk24.share * 100, 32.2, 0.3);
expect('at-home share of peak workers 2019', pk19.homeShareOfWorkers * 100, 9.7, 0.5);
expect('at-home share of peak workers 2024', pk24.homeShareOfWorkers * 100, 22.4, 0.5);

const homeMinShare = (d) => wMean(d.rows, (r) => r.workHome) / wMean(d.rows, (r) => r.work);
expect('work minutes at home 2019', homeMinShare(d19) * 100, 11.6, 0.3);
expect('work minutes at home 2024', homeMinShare(d24) * 100, 22.6, 0.3);

const commShare19 = wShare(d19.rows, (r) => r.commute > 0);
const commShare24 = wShare(d24.rows, (r) => r.commute > 0);
expect('commuted share 2019', commShare19 * 100, 35.5, 0.3);
expect('commuted share 2024', commShare24 * 100, 30.0, 0.3);
const pop19 = d19.totalW / 365, pop24 = d24.totalW / 366; // 2024 is a leap year
expect('population 2019 (M)', pop19 / 1e6, 263.4, 1.5);
expect('population 2024 (M)', pop24 / 1e6, 272.9, 1.5);
expect('commuters/day 2019 (M)', commShare19 * pop19 / 1e6, 93.6, 0.8);
expect('commuters/day 2024 (M)', commShare24 * pop24 / 1e6, 81.8, 0.8);
const commLen19 = wMean(d19.rows, (r) => r.commute, (r) => r.commute > 0);
const commLen24 = wMean(d24.rows, (r) => r.commute, (r) => r.commute > 0);
expect('commute length 2019', commLen19, 47.1, 0.3);
expect('commute length 2024', commLen24, 49.3, 0.3);

// ---- who has time (§5.4, pooled 2023+2024)
const GROUPS = {
  everyone: null,
  worked: (r) => r.work > 0,
  workedKids: (r) => r.work > 0 && r.hhChild === 1,
  workedKidsU6: (r) => r.work > 0 && r.youngest >= 0 && r.youngest < 6,
  age65: (r) => r.age >= 65,
  noWorkNoKids: (r) => r.work === 0 && r.hhChild !== 1,
  men: (r) => r.sex === 1,
  women: (r) => r.sex === 2,
  weekday: (r) => !isWeekend(r),
  weekend: isWeekend,
};
const freeTable = {};
for (const [name, f] of Object.entries(GROUPS)) {
  const free = wMean(pooled, sumFree, f);
  const obl = wMean(pooled, sumObl, f);
  const under3 = wShare(pooled, (r) => sumFree(r) < 180, f);
  const majors = MAJORS.map((_, k) => +wMean(pooled, (r) => r.maj[k], f).toFixed(1));
  const sleep = wMean(pooled, (r) => r.sleep, f);
  const tv = wMean(pooled, (r) => r.tv, f);
  let nDays = 0; for (const r of pooled) if (!f || f(r)) nDays++;
  freeTable[name] = { free: +free.toFixed(1), obligated: +obl.toFixed(1), under3h: +(under3 * 100).toFixed(1), majors, sleep: +sleep.toFixed(1), tv: +tv.toFixed(1), nDays };
}
expect('free everyone', freeTable.everyone.free, 346, 1.5);
expect('free workedKidsU6', freeTable.workedKidsU6.free, 159, 2.5);
expect('free 65+', freeTable.age65.free, 476, 2.0);
expect('under3h workedKidsU6', freeTable.workedKidsU6.under3h, 61.0, 1.5);
expect('obligated worked', freeTable.worked.obligated, 622, 2.0);

// ---- TV (§5.6, pooled 2023+2024)
const tvMean = wMean(pooled, (r) => r.tv);
const tvWatched = wShare(pooled, (r) => r.tv > 0);
const tvAmong = wMean(pooled, (r) => r.tv, (r) => r.tv > 0);
const freeMean = wMean(pooled, sumFree);
const socialMean = wMean(pooled, (r) => r.social);
const socialAny = wShare(pooled, (r) => r.social > 0);
expect('TV mean (min)', tvMean, 158, 1.5);
expect('TV watched share', tvWatched * 100, 73.2, 0.5);
expect('TV among watchers', tvAmong, 216, 2);
expect('TV share of free time', tvMean / freeMean * 100, 45.7, 0.5);
expect('social mean', socialMean, 35, 1.0);
expect('social engaged', socialAny * 100, 29.6, 0.3);
const zeroDays = {
  social: wShare(pooled, (r) => r.social === 0),
  exercise: wShare(pooled, (r) => r.exercise === 0),
  careHH: wShare(pooled, (r) => r.maj[MI.care_household] === 0),
  work: wShare(pooled, (r) => r.work === 0),
  free: wShare(pooled, (r) => sumFree(r) === 0),
};
expect('zero social days', zeroDays.social * 100, 70.4, 0.5);
expect('zero exercise days', zeroDays.exercise * 100, 78.7, 0.5);
expect('zero free-time days', zeroDays.free * 100, 4.0, 0.4);

// ---- the 48 minutes (§5.5, pooled)
const menLeis = wMean(pooled, (r) => r.maj[MI.leisure_sports], (r) => r.sex === 1);
const womenLeis = wMean(pooled, (r) => r.maj[MI.leisure_sports], (r) => r.sex === 2);
expect('men leisure', menLeis, 331.3, 0.5);
expect('women leisure', womenLeis, 282.8, 0.5);
const menTv = wMean(pooled, (r) => r.tv, (r) => r.sex === 1);
const womenTv = wMean(pooled, (r) => r.tv, (r) => r.sex === 2);
expect('TV share of gap', menTv - womenTv, 24.8, 0.8);
// paid + unpaid work on the published majors (work + household + both care majors) —
// our verifiable stand-in for the brief's "total work barely differs" null result
const totalWork = (r) => r.maj[MI.work] + r.maj[MI.household] + r.maj[MI.care_household] + r.maj[MI.care_nonhousehold];
const menTotal = wMean(pooled, totalWork, (r) => r.sex === 1);
const womenTotal = wMean(pooled, totalWork, (r) => r.sex === 2);
expect('total work men', menTotal, 369.0, 0.5);
expect('total work women', womenTotal, 367.1, 0.5);

// ---- weekday / weekend (§5.7, 2024? try pooled first)
const wkSleep = wMean(pooled, (r) => r.sleep, (r) => !isWeekend(r));
const weSleep = wMean(pooled, (r) => r.sleep, isWeekend);
const wkFree = wMean(pooled, sumFree, (r) => !isWeekend(r));
const weFree = wMean(pooled, sumFree, isWeekend);
const wkObl = wMean(pooled, sumObl, (r) => !isWeekend(r));
const weObl = wMean(pooled, sumObl, isWeekend);
expect('weekday sleep', wkSleep, 530, 3);
expect('weekend sleep', weSleep, 577, 3);
expect('weekday free', wkFree, 312, 3);
expect('weekend free', weFree, 428, 3);

// ---------------------------------------------------------------- grid.bin

const CHANNELS = 14; // 12 majors + asleep + workAtHome
function gridBytes(d) {
  const out = new Uint16Array(CHANNELS * 1440);
  for (let k = 0; k < 12; k++)
    for (let m = 0; m < 1440; m++)
      out[k * 1440 + m] = Math.round(d.grid[k][m] / d.totalW * 65535);
  for (let m = 0; m < 1440; m++) {
    out[12 * 1440 + m] = Math.round(d.asleep[m] / d.totalW * 65535);
    out[13 * 1440 + m] = Math.round(d.workHomeGrid[m] / d.totalW * 65535);
  }
  return out;
}
const g19 = gridBytes(d19), g24 = gridBytes(d24);
const gridBuf = new Uint8Array(g19.byteLength + g24.byteLength);
gridBuf.set(new Uint8Array(g19.buffer), 0);
gridBuf.set(new Uint8Array(g24.buffer), g19.byteLength);
mkdirSync(join(ROOT, 'public', 'data'), { recursive: true });
writeFileSync(join(ROOT, 'public', 'data', 'grid.bin'), gridBuf);
console.log(`grid.bin ${(gridBuf.length / 1024).toFixed(1)} KB (2019 then 2024, ${CHANNELS}×1440 u16 each)`);

// ---------------------------------------------------------------- days.bin (PPS, 2024)

const K = 2600;
const cum = new Float64Array(d24.n);
let acc = 0;
for (let i = 0; i < d24.n; i++) { acc += d24.rows[i].w; cum[i] = acc; }
const step = acc / K;
let s = 20240807 >>> 0;
const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
let u = rnd() * step, ptr = 0;
const sampled = [];
for (let t = 0; t < K; t++) {
  while (ptr < d24.n - 1 && cum[ptr] < u) ptr++;
  sampled.push(d24.rows[ptr]);
  u += step;
}

// PPS fidelity check: equal-ink modal share from the sample vs the weighted truth (sharp minutes)
{
  const noonSharp = modalAt(d24, MNOON), threeSharp = modalAt(d24, M3);
  const counts = new Float64Array(12);
  for (const r of sampled) counts[majorAtMinute(r, MNOON)]++;
  let best = 0;
  for (let k = 0; k < 12; k++) best = Math.max(best, counts[k]);
  expect('PPS sample modal @noon', best / K * 100, noonSharp.share * 100, 1.6);
  const c3 = new Float64Array(12);
  for (const r of sampled) c3[majorAtMinute(r, M3)]++;
  let b3 = 0;
  for (let k = 0; k < 12; k++) b3 = Math.max(b3, c3[k]);
  expect('PPS sample modal @3am', b3 / K * 100, threeSharp.share * 100, 0.9);
}

const AGE_BANDS = [15, 25, 35, 45, 55, 65, 75]; // band i = age >= AGE_BANDS[i]
const ageBand = (a) => { let b = 0; for (let i = 0; i < AGE_BANDS.length; i++) if (a >= AGE_BANDS[i]) b = i; return b; };

const parts = [];
const head = new Uint8Array(4);
new DataView(head.buffer).setUint32(0, sampled.length, true);
parts.push(head);
for (const r of sampled) {
  const flags =
    (isWeekend(r) ? 1 : 0) |
    (r.work > 0 ? 2 : 0) |
    (r.work >= 360 ? 4 : 0) |
    (r.sex === 2 ? 8 : 0) |
    (r.age >= 65 ? 16 : 0) |
    (r.hhChild === 1 ? 32 : 0) |
    (r.age >= 25 && r.age <= 54 ? 64 : 0) |
    (r.holiday === 1 ? 128 : 0);
  const eps = r.episodes;
  if (eps.length > 255) throw new Error('day with >255 episodes');
  const buf = new Uint8Array(3 + eps.length * 6);
  buf[0] = flags; buf[1] = ageBand(r.age); buf[2] = eps.length;
  const dv = new DataView(buf.buffer);
  eps.forEach((e, i) => {
    dv.setUint16(3 + i * 6, e.start, true);
    dv.setUint16(3 + i * 6 + 2, e.dur, true);
    buf[3 + i * 6 + 4] = e.mi;
    buf[3 + i * 6 + 5] = e.home;
  });
  parts.push(buf);
}
const daysBuf = new Uint8Array(parts.reduce((a, p) => a + p.length, 0));
{
  let o = 0;
  for (const p of parts) { daysBuf.set(p, o); o += p.length; }
}
writeFileSync(join(ROOT, 'public', 'data', 'days.bin'), daysBuf);
console.log(`days.bin ${(daysBuf.length / 1024).toFixed(1)} KB (${sampled.length} PPS days)`);

// ---------------------------------------------------------------- stats.json

const stats = {
  meta: {
    universe: 'civilian, noninstitutional, age 15+, in households, 50 states + DC',
    sourceLine: '7,669 real diary days · American Time Use Survey 2024 · each on its own local clock, 4 a.m. to 4 a.m.',
    n2024: d24.n, n2023: D[2023].n, n2019: d19.n, nPooled: pooled.length,
    majors: MAJORS,
  },
  headline: {
    at3am: +(at3.share * 100).toFixed(1),
    atNoon: +(atNoon.share * 100).toFixed(1),
    gapPp: +((at3.share - atNoon.share) * 100).toFixed(1),
    asleepAt3am: +(asleepAt3 * 100).toFixed(1),
    asleepAtNoon: +(asleepNoon * 100).toFixed(1),
    plateauMinutes: plateau,
    hourly,
    hourlyWorkers,
    wakingUnder33: under33, wakingUnder40: under40, wakingTotal: total,
    workerNoon: +(wNoon.share * 100).toFixed(1),
    worker6hNoon: +(w6Noon.share * 100).toFixed(1),
    worker6h2pm: +(w62pm.share * 100).toFixed(1),
  },
  ledger: { years: [2019, 2023, 2024], byMajor: MAJORS.map((m, k) => ({ major: m, y2019: ledger[2019][k], y2023: ledger[2023][k], y2024: ledger[2024][k], delta: +(ledger[2024][k] - ledger[2019][k]).toFixed(1) })) },
  indoors: {
    peakShare2019: +(pk19.share * 100).toFixed(1), peakShare2024: +(pk24.share * 100).toFixed(1),
    peakHomeShare2019: +(pk19.homeShareOfWorkers * 100).toFixed(1), peakHomeShare2024: +(pk24.homeShareOfWorkers * 100).toFixed(1),
    homeMinuteShare2019: +(homeMinShare(d19) * 100).toFixed(1), homeMinuteShare2024: +(homeMinShare(d24) * 100).toFixed(1),
    commuteShare2019: +(commShare19 * 100).toFixed(1), commuteShare2024: +(commShare24 * 100).toFixed(1),
    commutersM2019: +(commShare19 * pop19 / 1e6).toFixed(1), commutersM2024: +(commShare24 * pop24 / 1e6).toFixed(1),
    popM2019: +(pop19 / 1e6).toFixed(1), popM2024: +(pop24 / 1e6).toFixed(1),
    commuteLen2019: +commLen19.toFixed(1), commuteLen2024: +commLen24.toFixed(1),
  },
  freeTime: freeTable,
  tv: {
    mean: +tvMean.toFixed(1), watchedShare: +(tvWatched * 100).toFixed(1), amongWatchers: +tvAmong.toFixed(1),
    shareOfFree: +(tvMean / freeMean * 100).toFixed(1),
    socialMean: +socialMean.toFixed(1), socialShare: +(socialAny * 100).toFixed(1),
    zeroDays: Object.fromEntries(Object.entries(zeroDays).map(([k, v]) => [k, +(v * 100).toFixed(1)])),
  },
  gap: {
    menLeisure: +menLeis.toFixed(1), womenLeisure: +womenLeis.toFixed(1),
    gapMin: +(menLeis - womenLeis).toFixed(1), tvPortion: +(menTv - womenTv).toFixed(1),
    menTv: +menTv.toFixed(1), womenTv: +womenTv.toFixed(1),
    menTotal: +menTotal.toFixed(1), womenTotal: +womenTotal.toFixed(1),
  },
  week: {
    weekday: { sleep: +wkSleep.toFixed(1), free: +wkFree.toFixed(1), obligated: +wkObl.toFixed(1) },
    weekend: { sleep: +weSleep.toFixed(1), free: +weFree.toFixed(1), obligated: +weObl.toFixed(1) },
  },
};
mkdirSync(join(ROOT, 'src', 'gen'), { recursive: true });
writeFileSync(join(ROOT, 'src', 'gen', 'stats.json'), JSON.stringify(stats, null, 1));
console.log('src/gen/stats.json written');

const bad = checks.filter((c) => !c.ok);
if (bad.length) {
  console.error(`\n${bad.length} CHECK(S) FAILED — payloads written but numbers drifted; do not ship without resolving.`);
  process.exit(1);
}
console.log(`\nall ${checks.length} checks passed`);
