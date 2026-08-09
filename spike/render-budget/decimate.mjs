// THROWAWAY (ticket 04). If the mark can only draw k threads out of 25,652,
// which k? This measures whether the PICTURE changes — not whether the code runs.
//
// Truth  = all 25,652 respondent-days, weighted by TUFINLWGT (S3).
// Render = k drawn threads, each contributing exactly one unit of ink.
// Deviation is measured on the 1440 x 12 minute-by-category share grid, which is
// what the eye actually reads off a time-of-day mark.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const YEARS = [2019, 2023, 2024];
const MAJORS = ['personal_care', 'household', 'care_household', 'care_nonhousehold', 'work', 'education',
  'purchasing', 'org_civic_religious', 'eating_drinking', 'leisure_sports', 'phone_mail_email', 'other_nec'];
const MI = new Map(MAJORS.map((m, i) => [m, i]));
const SLEEP = 'personal_care';   // proxy row for a headline sanity check

// ---- load: day -> weight + episode list ------------------------------------
const days = [];
for (const y of YEARS) {
  const wMap = new Map();
  const rl = fs.readFileSync(path.join(REPO, 'data/extract', `respondents-${y}.csv`), 'utf8').split('\n');
  for (let i = 1; i < rl.length; i++) { if (!rl[i]) continue; const c = rl[i].split(','); wMap.set(c[0], +c[1]); }
  const el = fs.readFileSync(path.join(REPO, 'data/extract', `episodes-${y}.csv`), 'utf8').split('\n');
  let cur = null;
  for (let i = 1; i < el.length; i++) {
    if (!el[i]) continue;
    const c = el[i].split(',');
    if (!cur || cur.id !== c[0]) { cur = { id: c[0], w: wMap.get(c[0]), ep: [] }; days.push(cur); }
    cur.ep.push([+c[2], +c[3], MI.get(c[6])]);   // start, dur, major
  }
}
const D = days.length;

// ---- weight spread: how wrong is "one thread = one thread"? -----------------
const ws = days.map((d) => d.w).sort((a, b) => a - b);
const wSum = ws.reduce((a, b) => a + b, 0);
const wMean = wSum / D;
const wSd = Math.sqrt(ws.reduce((a, b) => a + (b - wMean) ** 2, 0) / D);
const pct = (p) => ws[Math.min(D - 1, Math.floor(p * D))];
console.log('TUFINLWGT across all 25,652 respondent-days');
console.log(`  min ${(ws[0] / 1e6).toFixed(2)}M  p05 ${(pct(0.05) / 1e6).toFixed(2)}M  median ${(pct(0.5) / 1e6).toFixed(2)}M  p95 ${(pct(0.95) / 1e6).toFixed(2)}M  max ${(ws[D - 1] / 1e6).toFixed(2)}M`);
console.log(`  max/min ${(ws[D - 1] / ws[0]).toFixed(1)}x   CV ${(wSd / wMean * 100).toFixed(1)}%   p95/p05 ${(pct(0.95) / pct(0.05)).toFixed(2)}x`);

// ---- the minute x category share grid --------------------------------------
function grid(sample) {
  const g = new Float64Array(1440 * 12);
  const tot = new Float64Array(1440);
  for (const [d, w] of sample) {
    for (const [s, dur, m] of d.ep) {
      const end = s + dur;
      const base = m * 1440;
      for (let t = s; t < end; t++) { g[base + t] += w; tot[t] += w; }
    }
  }
  for (let t = 0; t < 1440; t++) { const v = tot[t]; if (v) for (let m = 0; m < 12; m++) g[m * 1440 + t] /= v; }
  return g;
}
function dev(a, b) {
  let mx = 0, sum = 0;
  for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d > mx) mx = d; sum += d; }
  return { maxPP: mx * 100, meanPP: sum / a.length * 100 };
}
function dayMinutes(sample, major) {
  let num = 0, den = 0;
  const mi = MI.get(major);
  for (const [d, w] of sample) { den += w; for (const [, dur, m] of d.ep) if (m === mi) num += w * dur; }
  return num / den;
}

const truth = days.map((d) => [d, d.w]);
const gTruth = grid(truth);
const sleepTruth = dayMinutes(truth, SLEEP);
console.log(`\ntruth: ${D} days, weighted. ${SLEEP} = ${sleepTruth.toFixed(1)} min/day\n`);

// ---- sampling strategies (all render with EQUAL ink) ------------------------
let seed = 20260809;
const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const strategies = {
  head: (k) => days.slice(0, k).map((d) => [d, 1]),
  strided: (k) => { const s = D / k, o = []; for (let i = 0; i < k; i++) o.push([days[Math.floor(i * s)], 1]); return o; },
  srs: (k) => { const idx = [...days.keys()]; for (let i = D - 1; i > 0; i--) { const j = (rnd() * (i + 1)) | 0; [idx[i], idx[j]] = [idx[j], idx[i]]; } return idx.slice(0, k).map((i) => [days[i], 1]); },
  // systematic probability-proportional-to-size on the cumulative weight line:
  // every drawn thread then stands for the same slice of the population.
  pps: (k) => {
    const order = [...days];
    const step = wSum / k;
    const start = rnd() * step;
    const out = [];
    let acc = 0, target = start, i = 0;
    while (out.length < k && i < order.length) {
      acc += order[i].w;
      while (out.length < k && target <= acc) { out.push([order[i], 1]); target += step; }
      i++;
    }
    return out;
  },
};

const KS = [500, 1000, 2532, 5000, 10000, 25652];
console.log('deviation of the drawn picture from the weighted truth (1440x12 share grid)');
console.log('k'.padEnd(7) + ['head', 'strided', 'srs', 'pps'].map((s) => (s + ' max/mean pp').padStart(24)).join(''));
const table = [];
for (const k of KS) {
  const row = { k };
  let line = String(k).padEnd(7);
  for (const s of ['head', 'strided', 'srs', 'pps']) {
    const smp = strategies[s](Math.min(k, D));
    const d = dev(grid(smp), gTruth);
    const sl = dayMinutes(smp, SLEEP);
    row[s] = { maxPP: +d.maxPP.toFixed(2), meanPP: +d.meanPP.toFixed(3), sleepMin: +sl.toFixed(1), sleepErr: +(sl - sleepTruth).toFixed(1) };
    line += `${d.maxPP.toFixed(2)} / ${d.meanPP.toFixed(3)}`.padStart(24);
  }
  console.log(line);
  table.push(row);
}

console.log(`\n${SLEEP} min/day as drawn (truth ${sleepTruth.toFixed(1)}):`);
console.log('k'.padEnd(7) + ['head', 'strided', 'srs', 'pps'].map((s) => s.padStart(16)).join(''));
for (const r of table) {
  console.log(String(r.k).padEnd(7) + ['head', 'strided', 'srs', 'pps']
    .map((s) => `${r[s].sleepMin} (${r[s].sleepErr > 0 ? '+' : ''}${r[s].sleepErr})`.padStart(16)).join(''));
}

fs.mkdirSync(path.join(HERE, 'results'), { recursive: true });
fs.writeFileSync(path.join(HERE, 'results/decimation.json'), JSON.stringify({
  days: D,
  weight: { min: ws[0], max: ws[D - 1], median: pct(0.5), cvPct: wSd / wMean * 100, maxOverMin: ws[D - 1] / ws[0] },
  truth: { [SLEEP]: sleepTruth },
  table,
}, null, 2));
