// The Ledger — 1,440 minute-tiles on a canvas, re-budgeting as acts change.
// Each tile is one minute of the average day. Category blocks are contiguous
// runs; when the allocation changes, surplus tiles fly to deficit categories.

import { MAJORS, LABELS, LIGHT } from '../atus/meta.js';
import stats from '../../gen/stats.json';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

// fixed block order (2024 everyone, by size) — constant across groups so
// comparisons read as boundary shifts
const ORDER = ['personal_care', 'leisure_sports', 'work', 'household', 'eating_drinking',
  'purchasing', 'care_household', 'education', 'org_civic_religious', 'other_nec',
  'care_nonhousehold', 'phone_mail_email'];
const OIDX = ORDER.map((m) => MAJORS.indexOf(m));

const fmt = (min) => {
  const r = Math.round(min), h = Math.floor(r / 60), m = r % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

/** largest-remainder rounding: floats (sum 1440) → ints (sum exactly 1440) */
function allocate(values) {
  const floors = values.map(Math.floor);
  let left = 1440 - floors.reduce((a, b) => a + b, 0);
  const order = values.map((v, i) => [v - floors[i], i]).sort((a, b) => b[0] - a[0]);
  for (let k = 0; k < left; k++) floors[order[k % order.length][1]] += 1;
  return floors;
}

/** minutes per major (ORDER order) + tv minutes for a dataset key */
function datasetFor(key) {
  if (key === 'y2019' || key === 'y2024') {
    const y = key === 'y2019' ? 'y2019' : 'y2024';
    const by = Object.fromEntries(stats.ledger.byMajor.map((r) => [r.major, r[y]]));
    return { majors: ORDER.map((m) => by[m]), tv: key === 'y2024' ? stats.tv.mean : NaN };
  }
  const g = stats.freeTime[key];
  return { majors: OIDX.map((i) => g.majors[i]), tv: g.tv };
}

export function boot(root) {
  const canvas = root.querySelector('.waffle');
  const tip = root.querySelector('.tip');
  const ctx = canvas.getContext('2d');

  // ---- geometry
  let COLS = 48, ROWS = 30, tile = 10, gapPx = 2, padX = 0, padY = 0, dpr = 1;
  function layout() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    const portrait = r.width < r.height * 0.9;
    COLS = portrait ? 36 : 48;
    ROWS = 1440 / COLS; // 40 or 30
    const cell = Math.min(canvas.width / COLS, canvas.height / ROWS);
    tile = Math.floor(cell * 0.86);
    gapPx = cell - tile;
    padX = (canvas.width - COLS * cell + gapPx) / 2;
    padY = (canvas.height - ROWS * cell + gapPx) / 2;
  }
  const cellSz = () => tile + gapPx;
  const xyOf = (slot) => [padX + (slot % COLS) * cellSz(), padY + Math.floor(slot / COLS) * cellSz()];

  // ---- particles
  const parts = Array.from({ length: 1440 }, (_, i) => ({
    cat: 0, x: 0, y: 0, fx: 0, fy: 0, tx: 0, ty: 0, d0: 0, d1: 0, col: '', tcol: '',
  }));
  let counts = new Array(12).fill(120);
  let current = null;
  let tvCount = 0;
  let animStart = 0, animDur = 0, animating = false;

  function apply(key, first = false) {
    if (key === current) return;
    current = key;
    const ds = datasetFor(key);
    const next = allocate(ds.majors);
    tvCount = Number.isFinite(ds.tv) ? Math.round(ds.tv) : 0;

    // stable reassignment: each category keeps its first min(old,new) particles
    const byCat = Array.from({ length: 12 }, () => []);
    parts.forEach((p, i) => byCat[p.cat].push(i));
    const surplus = [];
    for (let c = 0; c < 12; c++) {
      if (byCat[c].length > next[c]) surplus.push(...byCat[c].splice(next[c]));
    }
    let s = 0;
    for (let c = 0; c < 12; c++) {
      while (byCat[c].length < next[c]) {
        const i = surplus[s++];
        parts[i].cat = c;
        byCat[c].push(i);
      }
    }
    // slots: block offsets in ORDER
    const offsets = [];
    let acc = 0;
    for (let c = 0; c < 12; c++) { offsets.push(acc); acc += next[c]; }
    const maxDist = Math.hypot(canvas.width, canvas.height);
    for (let c = 0; c < 12; c++) {
      byCat[c].sort((a, b) => a - b);
      byCat[c].forEach((i, rank) => {
        const p = parts[i];
        const [nx, ny] = xyOf(offsets[c] + rank);
        p.fx = first ? nx : p.x; p.fy = first ? ny : p.y;
        p.tx = nx; p.ty = ny;
        p.col = p.col || LIGHT[ORDER[c]];
        p.tcol = LIGHT[ORDER[c]];
        const dist = Math.hypot(p.tx - p.fx, p.ty - p.fy);
        p.d0 = first ? (p.ty / canvas.height) * 260 : Math.min(280, dist / maxDist * 900);
        p.d1 = p.d0 + (first ? 700 : 620);
      });
    }
    counts = next;
    animStart = performance.now();
    animDur = REDUCED || first ? 0 : 1000;
    animating = true;
    if (tvEmph) computeTvSet();
    updateGroupStats(key);
    draw(performance.now());
  }

  // ---- group stat readout (visible in the who-has-time act)
  function updateGroupStats(key) {
    const gs = root.querySelector('.gstats');
    if (!gs) return;
    const g = stats.freeTime[key];
    if (!g) { gs.dataset.empty = '1'; return; }
    gs.dataset.empty = '';
    gs.querySelector('[data-free]').textContent = fmt(g.free);
    gs.querySelector('[data-obl]').textContent = fmt(g.obligated);
    gs.querySelector('[data-u3]').textContent = `${Math.round(g.under3h)}%`;
  }

  // ---- tv emphasis
  let tvEmph = false;
  let tvSet = new Set();
  function computeTvSet() {
    tvSet.clear();
    if (!tvCount) return;
    const li = ORDER.indexOf('leisure_sports');
    const members = [];
    parts.forEach((p, i) => { if (p.cat === li) members.push(i); });
    members.sort((a, b) => (parts[a].tx - parts[b].tx) + (parts[a].ty - parts[b].ty) * 1e4);
    members.slice(0, tvCount).forEach((i) => tvSet.add(i));
  }
  function setTv(on) {
    if (tvEmph === on) return;
    tvEmph = on;
    if (on) computeTvSet();
    animStart = performance.now();
    animDur = REDUCED ? 0 : 450;
    animating = true;
    draw(performance.now());
  }

  // ---- labels: blocks big enough to hold a full-row label get name + duration,
  // drawn with a paper halo so they sit legibly on the tiles
  function drawLabels() {
    const offsets = [];
    let acc = 0;
    for (let c = 0; c < 12; c++) { offsets.push(acc); acc += counts[c]; }
    ctx.textBaseline = 'middle';
    const fs = Math.max(10, Math.min(13.5, tile * 1.2)) * dpr;
    ctx.font = `600 ${fs}px 'Literata Variable', serif`;
    for (let c = 0; c < 12; c++) {
      if (counts[c] < 55) continue;
      // first slot that starts a full row inside this block
      let slot = offsets[c];
      if (slot % COLS !== 0) slot = Math.ceil(slot / COLS) * COLS;
      if (slot + COLS > offsets[c] + counts[c]) continue; // no full row — hover covers it
      const [x, y] = xyOf(slot);
      const text = `${LABELS[ORDER[c]]} · ${fmt(counts[c])}`;
      const w = ctx.measureText(text).width;
      const pad = 4 * dpr;
      const maxW = COLS * cellSz() - gapPx - (x - padX) - pad * 2;
      if (w > maxW) continue;
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3.5 * dpr;
      ctx.strokeStyle = 'rgba(246,246,244,0.88)';
      ctx.strokeText(text, x + pad, y + (cellSz() - gapPx) / 2);
      ctx.fillStyle = 'rgba(20,20,26,0.92)';
      ctx.fillText(text, x + pad, y + (cellSz() - gapPx) / 2);
    }
  }

  const easeOut = (u) => 1 - Math.pow(1 - u, 4);
  function draw(now) {
    const t = now - animStart;
    let done = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const r = tile > 7 ? 2.5 * dpr : 1.5 * dpr;
    for (let i = 0; i < 1440; i++) {
      const p = parts[i];
      const u = animDur === 0 ? 1 : Math.max(0, Math.min(1, (t - p.d0) / (p.d1 - p.d0)));
      if (u < 1) done = false;
      const e = easeOut(u);
      p.x = p.fx + (p.tx - p.fx) * e;
      p.y = p.fy + (p.ty - p.fy) * e;
      if (u >= 1) p.col = p.tcol;
      const inFlight = u > 0 && u < 1;
      ctx.fillStyle = u >= 0.5 ? p.tcol : p.col;
      let alpha = 1;
      if (tvEmph) alpha = tvSet.has(i) ? 1 : (p.cat === ORDER.indexOf('leisure_sports') ? 0.38 : 0.13);
      ctx.globalAlpha = alpha;
      const s = inFlight ? tile * (1 + 0.35 * Math.sin(Math.PI * u)) : tile;
      const off = (tile - s) / 2;
      ctx.beginPath();
      ctx.roundRect(p.x + off, p.y + off, s, s, r);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!tvEmph && tile * 1.15 >= 9) drawLabels();
    if (tvEmph && tvCount) {
      // outline the tv cluster label
      const first = [...tvSet][0];
      if (first !== undefined) {
        const p = parts[first];
        const fs = Math.max(11, Math.min(14, tile * 1.2)) * dpr;
        ctx.font = `600 ${fs}px 'Literata Variable', serif`;
        const text = `television · ${fmt(tvCount)}`;
        const ty = Math.max(14 * dpr, p.ty - 9 * dpr);
        ctx.lineJoin = 'round';
        ctx.lineWidth = 3.5 * dpr;
        ctx.strokeStyle = 'rgba(246,246,244,0.9)';
        ctx.strokeText(text, p.tx, ty);
        ctx.fillStyle = 'rgba(20,20,26,0.92)';
        ctx.fillText(text, p.tx, ty);
      }
    }
    if (!done) requestAnimationFrame(draw);
    animating = !done;
  }

  // ---- hover tooltip
  canvas.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch') return;
    const rct = canvas.getBoundingClientRect();
    const mx = (ev.clientX - rct.left) * dpr, my = (ev.clientY - rct.top) * dpr;
    const col = Math.floor((mx - padX) / cellSz()), row = Math.floor((my - padY) / cellSz());
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) { tip.hidden = true; return; }
    const slot = row * COLS + col;
    let acc = 0, cat = -1;
    for (let c = 0; c < 12; c++) { if (slot < acc + counts[c]) { cat = c; break; } acc += counts[c]; }
    if (cat < 0) { tip.hidden = true; return; }
    const share = (counts[cat] / 1440 * 100).toFixed(1);
    tip.innerHTML = `<b>${LABELS[ORDER[cat]]}</b> — ${fmt(counts[cat])} of the average day (${share}%)`;
    tip.hidden = false;
    const px = ev.clientX - rct.left, py = ev.clientY - rct.top;
    tip.style.left = `${Math.min(px + 14, rct.width - tip.offsetWidth - 4)}px`;
    tip.style.top = `${py - 34}px`;
  });
  canvas.addEventListener('pointerleave', () => { tip.hidden = true; });
  canvas.addEventListener('pointercancel', () => { tip.hidden = true; });

  // ---- acts
  const acts = [...root.querySelectorAll('[data-act]')];
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target;
      setTv(el.dataset.tv !== undefined);
      if (el.dataset.group) apply(el.dataset.group);
      root.querySelectorAll('.gbtn').forEach((b) =>
        b.classList.toggle('on', b.dataset.group === current));
    }
  }, { rootMargin: '-42% 0px -42% 0px' });
  acts.forEach((a) => io.observe(a));

  // group picker buttons
  root.querySelectorAll('.gbtn').forEach((b) =>
    b.addEventListener('click', () => {
      apply(b.dataset.group);
      root.querySelectorAll('.gbtn').forEach((o) => o.classList.toggle('on', o === b));
    }));

  // ---- boot
  const ro = new ResizeObserver(() => {
    const prev = current;
    layout();
    current = null;
    if (prev) apply(prev, true); else apply('y2024', true);
  });
  document.fonts.ready.then(() => {
    layout();
    ro.observe(canvas);
    apply('y2024', true);
  });
}
