// THROWAWAY (ticket 04). CSV extract -> packed binary the browser harness loads.
// Also reports what the shipped payload would actually weigh, raw / gzip / brotli.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const OUT = path.join(HERE, 'data');
const YEARS = [2019, 2023, 2024];

// E1: MAJOR is the published BLS category. 12 of them -> 4 bits is enough.
const MAJORS = [
  'personal_care', 'household', 'care_household', 'care_nonhousehold',
  'work', 'education', 'purchasing', 'org_civic_religious',
  'eating_drinking', 'leisure_sports', 'phone_mail_email', 'other_nec',
];
const MAJOR_IDX = new Map(MAJORS.map((m, i) => [m, i]));

fs.mkdirSync(OUT, { recursive: true });

const gz = (b) => zlib.gzipSync(b, { level: 9 }).length;
const br = (b) => zlib.brotliCompressSync(b, {
  params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: b.length },
}).length;
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

const rows = [];

for (const year of YEARS) {
  const csv = fs.readFileSync(path.join(REPO, 'data/extract', `episodes-${year}.csv`), 'utf8');
  const lines = csv.split('\n');

  // Pass 1: day order + per-day episode counts, in file order (TUCASEID ascending).
  const dayIds = [];
  const counts = [];
  const durs = [];
  const majors = [];
  const wheres = [];
  let last = null;
  let sumCheck = 0;

  for (let i = 1; i < lines.length; i++) {
    const l = lines[i];
    if (!l) continue;
    const c = l.split(',');
    const id = c[0];
    const dur = +c[3];
    const where = +c[5];
    const mj = MAJOR_IDX.get(c[6]);
    if (mj === undefined) throw new Error(`unknown MAJOR ${c[6]}`);
    if (id !== last) {
      if (last !== null && sumCheck !== 1440) throw new Error(`day ${last} sums to ${sumCheck}`);
      dayIds.push(id);
      counts.push(0);
      last = id;
      sumCheck = 0;
    }
    counts[counts.length - 1]++;
    sumCheck += dur;
    durs.push(dur);
    majors.push(mj);
    // -1 is out of universe, not a location (S10). Store +1 so it fits unsigned.
    wheres.push(where < 0 ? 0 : Math.min(255, where));
  }
  if (sumCheck !== 1440) throw new Error(`last day sums to ${sumCheck}`);

  const D = dayIds.length;
  const E = durs.length;
  if (Math.max(...counts) > 255) throw new Error('episodes/day overflows uint8');

  // Weights, in the same day order.
  const rcsv = fs.readFileSync(path.join(REPO, 'data/extract', `respondents-${year}.csv`), 'utf8').split('\n');
  const wMap = new Map();
  for (let i = 1; i < rcsv.length; i++) {
    if (!rcsv[i]) continue;
    const c = rcsv[i].split(',');
    wMap.set(c[0], +c[1]);
  }
  const weights = new Float32Array(D);
  for (let i = 0; i < D; i++) {
    const w = wMap.get(dayIds[i]);
    if (w === undefined) throw new Error(`no weight for ${dayIds[i]}`);
    weights[i] = w;
  }

  // --- the shipped layout: counts (u8) + dur (u16) + major (u8) -------------
  // START is free: every day chains from 0 and sums to exactly 1440 (ticket 03),
  // so the start minute is the running total. Storing it would be 2 bytes/episode
  // of nothing.
  const off0 = 16;                       // header
  const offCounts = off0;
  const offDur = align2(offCounts + D);
  const offMajor = offDur + E * 2;
  const total = offMajor + E;
  const buf = Buffer.alloc(total);
  buf.write('ODIA', 0, 'ascii');
  buf.writeUInt16LE(1, 4);
  buf.writeUInt16LE(year, 6);
  buf.writeUInt32LE(D, 8);
  buf.writeUInt32LE(E, 12);
  for (let i = 0; i < D; i++) buf.writeUInt8(counts[i], offCounts + i);
  for (let i = 0; i < E; i++) buf.writeUInt16LE(durs[i], offDur + i * 2);
  for (let i = 0; i < E; i++) buf.writeUInt8(majors[i], offMajor + i);
  fs.writeFileSync(path.join(OUT, `threads-${year}.bin`), buf);

  // Weights ride separately so the payload accounting stays legible.
  const wbuf = Buffer.from(weights.buffer, weights.byteOffset, weights.byteLength);
  fs.writeFileSync(path.join(OUT, `weights-${year}.bin`), wbuf);

  // --- variants, measured not guessed ---------------------------------------
  // (a) major packed to 4 bits (two episodes per byte)
  const nib = Buffer.alloc(Math.ceil(E / 2));
  for (let i = 0; i < E; i++) {
    if (i % 2 === 0) nib[i >> 1] = majors[i];
    else nib[i >> 1] |= majors[i] << 4;
  }
  const packed4 = Buffer.concat([buf.subarray(0, offMajor), nib]);
  // (b) + TEWHERE (an episode-level column the location view would need)
  const wh = Buffer.from(Uint8Array.from(wheres));
  const withWhere = Buffer.concat([buf, wh]);
  // (c) the naive denormalised CSV, for the record
  const csvBytes = Buffer.byteLength(csv);

  rows.push({
    year, D, E,
    raw: buf.length, gz: gz(buf), br: br(buf),
    p4raw: packed4.length, p4br: br(packed4),
    wRaw: wbuf.length, wBr: br(wbuf),
    whBr: br(withWhere),
    csv: csvBytes, csvBr: br(csv),
  });

  console.log(`${year}: ${D} days, ${E} episodes -> ${kb(buf.length)} raw / ${kb(gz(buf))} gzip / ${kb(br(buf))} brotli`);
}

function align2(n) { return n + (n % 2); }

const t = rows.reduce((a, r) => {
  for (const k of Object.keys(r)) if (k !== 'year') a[k] = (a[k] || 0) + r[k];
  return a;
}, {});

const report = {
  generated: 'ticket-04 spike',
  majors: MAJORS,
  perYear: rows,
  allYears: t,
};
fs.writeFileSync(path.join(OUT, 'payload-report.json'), JSON.stringify(report, null, 2));

console.log('');
console.log('ALL THREE YEARS');
console.log(`  days ${t.D}  episodes ${t.E}`);
console.log(`  threads.bin      ${kb(t.raw)} raw   ${kb(t.gz)} gzip   ${kb(t.br)} brotli`);
console.log(`  + 4-bit major    ${kb(t.p4raw)} raw   ${kb(t.p4br)} brotli`);
console.log(`  + TEWHERE        ${kb(t.whBr)} brotli`);
console.log(`  weights.bin      ${kb(t.wRaw)} raw   ${kb(t.wBr)} brotli`);
console.log(`  (source CSV      ${kb(t.csv)} raw   ${kb(t.csvBr)} brotli)`);
console.log(`  bytes/episode    ${(t.raw / t.E).toFixed(2)} raw   ${(t.br / t.E).toFixed(2)} brotli`);
