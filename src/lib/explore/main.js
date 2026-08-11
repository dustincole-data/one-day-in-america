// The explorer. Reads public/data/explore.bin — a full cross-tabulation of the
// pooled 2023+2024 diary days into 48 cells — and lets a reader build any slice
// the five dimensions can express.
//
// Every cell carries its own summed BLS person-day weight, so a slice is the
// weighted union of its cells and lands on exactly the estimate the pre-baked
// numbers use. The builder proves that: it re-derives eleven published figures
// through this same decode path and fails on drift.

import { MAJORS, LABELS, SHORT, BAND_ORDER, hourLabel } from '../atus/meta.js';
import stats from '../../gen/stats.json';

const CH_ASLEEP = 12, CH_TV = 13;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DIMS = stats.explore.dims;
const MIN_DAYS = stats.explore.minDays;

const fmt = (min) => {
  const r = Math.round(min), h = Math.floor(r / 60), m = r % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};
const fmtDelta = (min) => {
  const r = Math.round(min);
  if (r === 0) return 'same';
  return `${r > 0 ? '+' : '−'}${fmt(Math.abs(r))}`;
};

async function load(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const head = new Uint32Array(buf, 0, 4);
  const [cells, bins, ch, binMinutes] = head;
  const w = new Float64Array(buf, 16, cells);
  const n = new Uint32Array(buf, 16 + cells * 8, cells);
  const share = new Uint16Array(buf, 16 + cells * 8 + cells * 4, cells * bins * ch);
  return { cells, bins, ch, binMinutes, w, n, share };
}

// cell = ((((sex * 2 + worked) * 2 + weekend) * 2 + kids) * 3 + age
const decodeCell = (c) => [(c / 24) | 0, ((c / 12) | 0) % 2, ((c / 6) | 0) % 2, ((c / 3) | 0) % 2, c % 3];

export async function boot(root) {
  const D = await load('/data/explore.bin');
  const { cells, bins, ch, binMinutes } = D;
  const totalW = D.w.reduce((a, b) => a + b, 0);

  // sel[dim] = Set of allowed value indexes; empty means "any"
  const sel = DIMS.map(() => new Set());

  function aggregate(picker) {
    const acc = new Float64Array(bins * ch);
    let W = 0, N = 0;
    for (let c = 0; c < cells; c++) {
      if (!picker(decodeCell(c))) continue;
      const cw = D.w[c];
      W += cw; N += D.n[c];
      const base = c * bins * ch;
      for (let i = 0; i < bins * ch; i++) acc[i] += cw * D.share[base + i];
    }
    if (W <= 0) return { W: 0, N: 0, share: new Float64Array(bins * ch), minutes: new Float64Array(ch) };
    for (let i = 0; i < bins * ch; i++) acc[i] /= W * 65535;
    const minutes = new Float64Array(ch);
    for (let b = 0; b < bins; b++)
      for (let k = 0; k < ch; k++) minutes[k] += acc[b * ch + k] * binMinutes;
    return { W, N, share: acc, minutes };
  }

  const matchesSel = (cell) => sel.every((s, d) => s.size === 0 || s.has(cell[d]));
  const everyone = aggregate(() => true);

  let baseline = everyone;
  let baselineLabel = 'everyone';
  let baselineTitle = 'Everyone';
  let pinned = false;
  let currentAgg = everyone;

  // two slices are the same slice when they cover the same cells; comparing the
  // aggregate objects by identity never matches, since each update rebuilds one
  const sameSlice = (a, b) => a.N === b.N && Math.abs(a.W - b.W) < 1;

  // ---- selection → prose. "Everyone" when nothing is picked; otherwise the
  // picked values joined the way a person would say them.
  function sliceLabel() {
    const parts = [];
    for (let d = 0; d < DIMS.length; d++) {
      if (sel[d].size === 0 || sel[d].size === DIMS[d].values.length) continue;
      parts.push([...sel[d]].sort().map((v) => DIMS[d].values[v]).join(' or '));
    }
    return parts.length ? parts.join(' · ') : 'Everyone';
  }

  // ---- DOM
  const controls = root.querySelector('.ex-controls');
  const chartSvg = root.querySelector('.ex-panel .ex-shape svg');
  const panelB = root.querySelector('.ex-panel-b');
  const chartSvgB = panelB.querySelector('svg');
  const rowsEl = root.querySelector('.ex-rows');
  const metaEl = root.querySelector('.ex-meta');
  const metaElB = root.querySelector('.ex-meta-b');
  const calloutEl = root.querySelector('.ex-callout');
  const warnEl = root.querySelector('.ex-warn');
  const baseEl = root.querySelector('.ex-baseline');
  const pinBtn = root.querySelector('.ex-pin');
  const resetBtn = root.querySelector('.ex-reset');
  const readout = root.querySelector('.ex-readout');

  controls.innerHTML = DIMS.map((dim, d) => `
    <div class="ex-dim">
      <p class="ex-dimlabel">${dim.label}</p>
      <div class="ex-opts">${dim.values.map((v, i) =>
        `<button type="button" data-d="${d}" data-v="${i}" aria-pressed="false">${v}</button>`).join('')}</div>
    </div>`).join('');

  controls.addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-d]');
    if (!b) return;
    const d = +b.dataset.d, v = +b.dataset.v;
    // One value per dimension, the way a filter is expected to behave: a second
    // pick inside the same dimension switches to it rather than widening the
    // slice, and picking the value already on clears that dimension to "any".
    // Nothing is lost — every dimension but age has two values, where picking
    // both was already identical to picking neither.
    if (sel[d].has(v)) sel[d].clear();
    else { sel[d].clear(); sel[d].add(v); }
    syncButtons();
    update();
  });

  function syncButtons() {
    controls.querySelectorAll('button[data-d]').forEach((b) => {
      b.setAttribute('aria-pressed', String(sel[+b.dataset.d].has(+b.dataset.v)));
    });
  }

  pinBtn.addEventListener('click', () => {
    if (pinned) stopComparing();
    else {
      baseline = currentAgg;
      baselineLabel = sliceLabel().toLowerCase();
      baselineTitle = sliceLabel();
      pinned = true;
      // the pinned slice is frozen, so it is painted once here rather than on
      // every update
      shapeB.set(baseline.share);
    }
    update();
  });
  resetBtn.addEventListener('click', () => {
    sel.forEach((s) => s.clear());
    stopComparing();
    syncButtons();
    update();
  });
  function stopComparing() {
    baseline = everyone; baselineLabel = 'everyone'; baselineTitle = 'Everyone'; pinned = false;
  }

  // ---- stacked day shape, drawn as 12 SVG areas over 144 ten-minute bins.
  // Two of these exist when comparing — the live slice and the frozen pinned
  // one — so the shape is a factory rather than one set of module-level paths.
  const STACK = BAND_ORDER.map((m) => MAJORS.indexOf(m));
  const W = 1000, H = 260;

  // rules stay in the drawing; the labels live in the DOM underneath it, where
  // they are legible against the ground instead of against the stack
  const TICKS = [[0, '4 a.m.'], [4, '8 a.m.'], [8, 'noon'], [12, '4 p.m.'], [16, '8 p.m.'], [20, 'midnight']];

  function makeShape(svg) {
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.innerHTML = STACK.map((mi) =>
      `<path data-mi="${mi}" fill="var(--c-${MAJORS[mi]})" />`).join('') +
      `<g class="ex-ticks">${TICKS.map(([hr]) => {
        const x = (hr * 6 / bins) * W;
        return `<line x1="${x}" x2="${x}" y1="0" y2="${H}" class="ex-tick" />`;
      }).join('')}</g>`;
    const paths = new Map([...svg.querySelectorAll('path')].map((p) => [+p.dataset.mi, p]));

    let drawn = new Float64Array(bins * ch);
    let animRaf = 0;

    function paint(arr) {
      const tops = new Float64Array(bins);
      for (const mi of STACK) {
        let up = '', down = '';
        for (let b = 0; b < bins; b++) {
          const x = (b / (bins - 1)) * W;
          const y0 = tops[b] * H;
          const y1 = (tops[b] + arr[b * ch + mi]) * H;
          up += `${b ? 'L' : 'M'}${x.toFixed(1)} ${y1.toFixed(1)}`;
          down = `L${x.toFixed(1)} ${y0.toFixed(1)}` + down;
          tops[b] += arr[b * ch + mi];
        }
        paths.get(mi).setAttribute('d', `${up}${down}Z`);
      }
    }

    function set(next) {
      cancelAnimationFrame(animRaf);
      drawn = next.slice();
      paint(drawn);
    }

    function animateTo(target) {
      if (REDUCED) return set(target);
      const animFrom = drawn.slice();
      let animStart = 0;
      cancelAnimationFrame(animRaf);
      const step = (ts) => {
        if (!animStart) animStart = ts;
        const u = Math.min(1, (ts - animStart) / 280);
        const e = 1 - Math.pow(1 - u, 3);
        for (let i = 0; i < drawn.length; i++) drawn[i] = animFrom[i] + (target[i] - animFrom[i]) * e;
        paint(drawn);
        if (u < 1) animRaf = requestAnimationFrame(step);
      };
      animRaf = requestAnimationFrame(step);
    }

    return { set, animateTo, current: () => drawn };
  }

  const shapeA = makeShape(chartSvg);
  const shapeB = makeShape(chartSvgB);

  root.querySelector('.ex-axis').innerHTML = TICKS.map(([hr, label]) =>
    `<span style="left:${((hr * 6) / bins * 100).toFixed(2)}%">${label}</span>`).join('');

  // ---- hover / tap readout on the shape
  function shapeReadout(ev) {
    const r = chartSvg.getBoundingClientRect();
    const u = (ev.clientX - r.left) / r.width;
    if (u < 0 || u > 1) return hideReadout();
    const b = Math.min(bins - 1, Math.max(0, Math.round(u * (bins - 1))));
    const minute = b * binMinutes;
    const hour = Math.floor(((minute + 240) % 1440) / 60);
    const drawn = shapeA.current();
    let best = -1, bv = 0;
    for (let k = 0; k < 12; k++) if (drawn[b * ch + k] > bv) { bv = drawn[b * ch + k]; best = k; }
    if (best < 0) return hideReadout();
    readout.innerHTML = `<b>${hourLabel(hour)}</b> · most common: ${SHORT[MAJORS[best]]} · <b>${Math.round(bv * 100)}%</b>`;
    readout.style.left = `${Math.min(Math.max(u * 100, 14), 86)}%`;
    readout.classList.add('show');
  }
  const hideReadout = () => readout.classList.remove('show');
  chartSvg.addEventListener('pointermove', (ev) => { if (ev.pointerType !== 'touch') shapeReadout(ev); });
  chartSvg.addEventListener('pointerdown', shapeReadout);
  chartSvg.addEventListener('pointerleave', hideReadout);
  chartSvg.addEventListener('pointercancel', hideReadout);

  // ---- the budget rows: minutes a day, against the baseline
  const ROW_ORDER = [...MAJORS.keys()].sort((a, b) => everyone.minutes[b] - everyone.minutes[a]);
  const SUB = { [MAJORS.indexOf('personal_care')]: [CH_ASLEEP, 'of which asleep'], [MAJORS.indexOf('leisure_sports')]: [CH_TV, 'of which television'] };
  const maxMin = everyone.minutes[ROW_ORDER[0]];

  function renderRows(agg, base) {
    rowsEl.innerHTML = ROW_ORDER.map((mi) => {
      const v = agg.minutes[mi], d = v - base.minutes[mi];
      const sub = SUB[mi];
      const subRow = sub ? `<p class="ex-sub"><span>${sub[1]}</span><b>${fmt(agg.minutes[sub[0]])}</b></p>` : '';
      return `<div class="ex-row${Math.abs(d) >= 20 ? ' ex-row-move' : ''}">
        <p class="ex-name"><i style="background:var(--c-${MAJORS[mi]})"></i>${LABELS[MAJORS[mi]]}</p>
        <div class="ex-bar"><span style="width:${(v / maxMin * 100).toFixed(1)}%;background:var(--c-${MAJORS[mi]})"></span></div>
        <b class="ex-val">${fmt(v)}</b>
        <span class="ex-delta ${d > 0 ? 'up' : d < 0 ? 'down' : ''}">${fmtDelta(d)}</span>
        ${subRow}
      </div>`;
    }).join('');
  }

  // ---- the sentence: the two largest moves against the baseline
  function renderCallout(agg, base, thin) {
    if (thin || sameSlice(agg, base)) { calloutEl.textContent = ''; calloutEl.hidden = true; return; }
    const moves = [...MAJORS.keys()]
      .map((mi) => ({ mi, d: agg.minutes[mi] - base.minutes[mi] }))
      .filter((m) => Math.abs(m.d) >= 10)
      .sort((a, b) => Math.abs(b.d) - Math.abs(a.d))
      .slice(0, 2);
    if (!moves.length) {
      calloutEl.textContent = `This group's day is within ten minutes of ${baselineLabel} in every category.`;
      calloutEl.hidden = false;
      return;
    }
    const say = moves.map((m) =>
      `${fmt(Math.abs(m.d))} ${m.d > 0 ? 'more' : 'less'} ${SHORT[MAJORS[m.mi]]}`).join(' and ');
    calloutEl.textContent = `Against ${baselineLabel}: ${say} a day.`;
    calloutEl.hidden = false;
  }

  // ---- one panel's caption: which slice it is, how many diary days it rests on
  function renderMeta(el, agg, title, tag) {
    el.innerHTML = `${tag ? `<em class="ex-tag">${tag}</em>` : ''}<b>${title}</b><span>${
      agg.N.toLocaleString()} diary days · ${
      (agg.W / totalW * 100).toFixed(agg.W / totalW < 0.1 ? 1 : 0)}% of the population age 15 and over</span>`;
  }

  function update() {
    const agg = aggregate(matchesSel);
    currentAgg = agg;
    const thin = agg.N < MIN_DAYS;

    root.classList.toggle('ex-thin', thin);
    root.classList.toggle('ex-comparing', pinned);
    warnEl.hidden = !thin;
    if (thin) {
      warnEl.textContent = agg.N === 0
        ? 'No diary days match that combination.'
        : `Only ${agg.N.toLocaleString()} diary days match — too few to read as a group. Widen the slice.`;
    }

    renderMeta(metaEl, agg, sliceLabel(), pinned ? 'this slice' : '');
    panelB.hidden = !pinned;
    if (pinned) renderMeta(metaElB, baseline, baselineTitle, 'compared with');

    baseEl.textContent = `minutes a day · against ${baselineLabel}`;
    pinBtn.textContent = pinned ? 'stop comparing' : 'compare against this slice';
    pinBtn.disabled = thin && !pinned;

    if (!thin || agg.N > 0) shapeA.animateTo(agg.share);
    renderRows(agg, baseline);
    renderCallout(agg, baseline, thin);
  }

  shapeA.set(everyone.share);
  syncButtons();
  update();
  root.classList.add('ex-ready');
}
