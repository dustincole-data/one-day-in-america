// The Fray — orchestrator. Loads the PPS day sample, weaves it, renders it,
// and wires scroll narrative, filters, hover readout, and thread selection.

import { loadDays, FLAG, AGE_BANDS } from './data.js';
import { makeWeaver, texY } from './weave.js';
import { createRenderer } from './gl.js';
import { MAJORS, SHORT, hexToRgb, hourLabel } from '../atus/meta.js';
import { GROUND } from '../atus/ground.js';
import stats from '../../gen/stats.json';

const PAD = { l: 0.045, r: 0.045, t: 0.10, b: 0.14 };
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

const FILTERS = {
  everyone: () => true,
  worked: (f) => (f & FLAG.worked) !== 0,
  weekend: (f) => (f & FLAG.weekend) !== 0,
  kids: (f) => (f & FLAG.kids) !== 0,
  age65: (f) => (f & FLAG.age65) !== 0,
  workers6wd: (f) => (f & FLAG.worked6h) !== 0 && (f & FLAG.weekend) === 0,
};

export async function boot(root) {
  const PAL = GROUND.palette;
  const BG = hexToRgb(GROUND.bg);
  const canvas = root.querySelector('canvas');
  const stage = root.querySelector('.stage');
  const readout = root.querySelector('.readout');
  const hairline = root.querySelector('.hairline');
  const dayCard = root.querySelector('.daycard');
  const loading = root.querySelector('.loading');

  let days = await loadDays('/data/days.bin');
  // Subsample to roughly one thread per fabric pixel (the traceability ceiling —
  // render-budget §7). Systematic stride over the PPS ordering stays PPS.
  const phone = Math.min(innerWidth, innerHeight) < 720;
  const fabricCss = stage.clientHeight * (1 - PAD.t - PAD.b);
  const stride = Math.max(1, Math.ceil(days.length / fabricCss));
  if (stride > 1) days = days.filter((_, i) => i % stride === 0);
  const K = days.length;
  // The count is only true once the stride is known, so the page ships without
  // it and the renderer fills it in. Both readings stand on their own: the
  // sentence is complete before this runs.
  const drawn = K.toLocaleString();
  const drawnSlot = document.querySelector('[data-drawn]');
  if (drawnSlot) drawnSlot.textContent = `, ${drawn} in all`;
  canvas.setAttribute('aria-label',
    `${drawn} real diary days drawn as horizontal threads across one day, grouped by activity`);
  const weaver = makeWeaver(days);

  const renderer = createRenderer(canvas, K, MAJORS.map((m) => hexToRgb(PAL[m])), BG);
  if (!renderer) { loading.textContent = 'This piece needs WebGL2.'; return; }

  // ---- weave cache (bytes + GPU texture), LRU of 4, everyone pinned
  const cache = new Map();
  function getWeave(key) {
    if (cache.has(key)) { const v = cache.get(key); cache.delete(key); cache.set(key, v); return v; }
    const active = new Uint8Array(K);
    const test = FILTERS[key];
    for (let i = 0; i < K; i++) active[i] = test(days[i].flags) ? 1 : 0;
    const fallback = cache.get(current.key)?.bytes ?? null;
    const bytes = weaver.weave(active, fallback);
    const tex = renderer.makeTex(bytes);
    const v = { bytes, tex, active };
    cache.set(key, v);
    if (cache.size > 4) {
      for (const [k, old] of cache) {
        if (k !== 'everyone' && k !== key) { renderer.gl.deleteTexture(old.tex); cache.delete(k); break; }
      }
    }
    return v;
  }

  // ---- state
  const current = { key: 'everyone' };
  const state = {
    tex0: null, tex1: null, t: 1, tEased: 1,
    dim: [0, 1, 1], dimTarget: [0, 1, 1],
    // the hero holds its own copy over the drawing, so open at the hero's dim
    // rather than flashing full strength before the observer first fires
    gAlpha: 0.42, gAlphaTarget: 0.42,
    reveal: REDUCED ? 1 : 0,
    selected: -1,
    samples: phone ? 241 : 361,
    alpha: GROUND.threadAlpha,
    onlyMajor: -1,
    dirty: true,
  };
  const first = getWeave('everyone');
  state.tex0 = first.tex; state.tex1 = first.tex;

  function setFilter(key) {
    if (key === current.key) return;
    const w = getWeave(key);
    state.tex0 = cache.get(current.key)?.tex ?? state.tex1;
    state.tex1 = w.tex;
    state.t = REDUCED ? 1 : 0;
    current.key = key;
    clearSelection();
    state.dirty = true;
    root.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.filter === key));
  }

  function setDim(win) {
    state.dimTarget = win ? [win[0] / 1439, win[1] / 1439, 0.20] : [0, 1, 1];
    state.dirty = true;
  }

  // ---- sizing
  //
  // Assigning canvas.width/height reallocates the drawing buffer and blanks it.
  // iOS animates its URL bar through a scroll, which walks 100dvh up and down by
  // 60–90 px, so a literal resync reallocates on almost every scroll frame and
  // each fresh buffer can reach the compositor before anything is drawn into it
  // — the canvas flashing near-black while the reader scrolls. A width change or
  // an orientation change is a real resize and refits exactly; height alone only
  // ever grows, and the canvas is CSS-stretched across the few percent it is
  // short by, which is invisible on an abstract fabric.
  let thick = 1, storeW = 0, storeH = 0;
  const ro = new ResizeObserver((entries) => {
    const r = entries[0].contentRect;
    if (!r.width || !r.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr);
    if (w !== storeW) { storeW = w; storeH = h; }
    else if (h > storeH) storeH = h;
    else return;
    canvas.width = storeW;
    canvas.height = storeH;
    const fabricPx = storeH * (1 - PAD.t - PAD.b);
    // On a phone a thread lands near a single device pixel, and with antialias
    // off it rasterises into a broken dotted line — the fabric reads as grain
    // rather than as threads. One extra CSS pixel closes the gaps. Only the
    // stroke widens; every thread's y is untouched, so a band's thickness still
    // reads as how many people are in it.
    thick = Math.max(fabricPx / weaver.H * 0.92, 0.9) + (phone ? dpr : 0);
    // synchronous, not next-frame: the new buffer is empty until it is drawn
    drawNow();
  });
  ro.observe(canvas);

  // ---- render loop
  const lerp = (a, b, k) => a + (b - a) * k;
  let revealStart = 0;
  function drawNow() {
    renderer.draw({
      tex0: state.tex0, tex1: state.tex1,
      t: state.t >= 1 ? 1 : state.tEased,
      samples: state.samples, thickPx: thick,
      pad: [PAD.l, PAD.r, PAD.t, PAD.b],
      dim: state.dim, reveal: state.reveal,
      globalDim: 0.22, alpha: state.alpha * state.gAlpha,
      selected: state.selected, drawCount: K, onlyMajor: state.onlyMajor,
    });
    state.dirty = false;
  }
  function frame(ts) {
    if (!revealStart) revealStart = ts;
    let moving = false;
    if (state.reveal < 1) {
      const u = Math.min(1, (ts - revealStart) / 2000);
      state.reveal = 1 - Math.pow(1 - u, 4);
      if (state.reveal > 0.999) state.reveal = 1; else moving = true;
    }
    if (state.t < 1) {
      state.t = REDUCED ? 1 : Math.min(1, state.t + 0.035);
      state.tEased = 1 - Math.pow(1 - state.t, 3);
      if (state.t < 1) moving = true;
    }
    for (let i = 0; i < 3; i++) {
      const d = state.dimTarget[i] - state.dim[i];
      if (Math.abs(d) > 0.001) { state.dim[i] = lerp(state.dim[i], state.dimTarget[i], 0.12); moving = true; }
      else state.dim[i] = state.dimTarget[i];
    }
    if (Math.abs(state.gAlphaTarget - state.gAlpha) > 0.002) {
      state.gAlpha = lerp(state.gAlpha, state.gAlphaTarget, 0.1);
      moving = true;
    } else state.gAlpha = state.gAlphaTarget;
    if (state.dirty || moving) drawNow();
    requestAnimationFrame(frame);
  }
  loading.remove();
  requestAnimationFrame(frame);

  // ---- axis ticks (DOM, aligned with GL padding)
  const axis = root.querySelector('.axis');
  const ticks = [[0, '4 a.m.'], [240, '8 a.m.'], [480, 'noon'], [720, '4 p.m.'], [960, '8 p.m.'], [1200, 'midnight'], [1380, '3 a.m.']];
  axis.innerHTML = ticks.map(([m, l]) =>
    `<span style="left:${(PAD.l + (m / 1439) * (1 - PAD.l - PAD.r)) * 100}%">${l}</span>`).join('');

  // ---- hover readout + picking
  const activeBytes = () => cache.get(current.key).bytes;
  const activeMask = () => cache.get(current.key).active;

  function pointerToData(ev) {
    const r = canvas.getBoundingClientRect();
    const xN = (ev.clientX - r.left) / r.width;
    const yN = (ev.clientY - r.top) / r.height;
    const xFrac = (xN - PAD.l) / (1 - PAD.l - PAD.r);
    if (xFrac < 0 || xFrac > 1) return null;
    const minute = Math.round(xFrac * 1439);
    const y01 = (yN - PAD.t) / (1 - PAD.t - PAD.b);
    return { minute, y01, xN };
  }

  function pickThread(minute, y01) {
    const bytes = activeBytes(), mask = activeMask();
    let best = -1, bd = 0.02;
    for (let i = 0; i < K; i++) {
      if (!mask[i]) continue;
      const d = Math.abs(texY(bytes, K, i, minute) - y01);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  const series = () => (current.key === 'workers6wd' ? stats.headline.hourlyWorkers : stats.headline.hourly);
  function showReadout(minute, xN) {
    const clockHour = Math.floor(((minute + 240) % 1440) / 60);
    const row = series().find((h) => h.hour === clockHour);
    if (!row) return;
    readout.innerHTML = `<b>${hourLabel(row.hour)}</b> · most common: ${SHORT[row.major]} · <b>${row.share}%</b>`;
    readout.style.left = `${Math.min(Math.max(xN * 100, 12), 88)}%`;
    readout.classList.add('show');
    hairline.style.left = `${xN * 100}%`;
    hairline.classList.add('show');
  }
  function hideReadout() {
    readout.classList.remove('show');
    hairline.classList.remove('show');
  }

  let hoverRaf = 0;
  canvas.addEventListener('pointermove', (ev) => {
    if (ev.pointerType === 'touch') return;
    cancelAnimationFrame(hoverRaf);
    hoverRaf = requestAnimationFrame(() => {
      const p = pointerToData(ev);
      if (!p) { hideReadout(); return; }
      showReadout(p.minute, p.xN);
    });
  });
  canvas.addEventListener('pointerleave', hideReadout);
  canvas.addEventListener('pointercancel', hideReadout);

  // tap/click: select a thread (pointerup with small movement — iOS first-tap trap)
  let downAt = null;
  canvas.addEventListener('pointerdown', (ev) => { downAt = [ev.clientX, ev.clientY]; });
  canvas.addEventListener('pointerup', (ev) => {
    if (!downAt || Math.hypot(ev.clientX - downAt[0], ev.clientY - downAt[1]) > 8) return;
    const p = pointerToData(ev);
    if (!p || p.y01 < -0.05 || p.y01 > 1.05) { clearSelection(); return; }
    const hit = pickThread(p.minute, p.y01);
    if (hit >= 0) openDay(hit); else clearSelection();
  });
  addEventListener('keydown', (ev) => { if (ev.key === 'Escape') clearSelection(); });

  function fmtDur(min) {
    const h = Math.floor(min / 60), m = min % 60;
    return h ? (m ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
  }
  // consecutive episodes of the same major read as one span
  function mergeEps(eps) {
    const merged = [];
    for (const e of eps) {
      const last = merged[merged.length - 1];
      if (last && last.mi === e.mi) last.dur += e.dur;
      else merged.push({ start: e.start, dur: e.dur, mi: e.mi });
    }
    return merged;
  }
  function dayTags(d) {
    const f = d.flags;
    return [
      f & FLAG.holiday ? 'holiday' : f & FLAG.weekend ? 'weekend' : 'weekday',
      f & FLAG.worked ? 'worked' : 'didn’t work',
      f & FLAG.female ? 'woman' : 'man',
      AGE_BANDS[d.ageBand],
      f & FLAG.kids ? 'kids at home' : null,
    ].filter(Boolean);
  }
  const ribbon = (merged, h) =>
    `<svg viewBox="0 0 1440 ${h}" preserveAspectRatio="none" aria-hidden="true">${merged
      .map((e) => `<rect x="${e.start}" width="${e.dur}" y="0" height="${h}" fill="${PAL[MAJORS[e.mi]]}"/>`)
      .join('')}</svg>`;

  // highlight is the GL half of selection; the day card is the DOM half. The
  // trace act wants the first without the second.
  function setHighlight(i) {
    if (state.selected === i) return;
    state.selected = i;
    state.dirty = true;
  }
  function openDay(i) {
    setHighlight(i);
    const d = days[i];
    const merged = mergeEps(d.eps);
    const top = [...merged].sort((a, b) => b.dur - a.dur).slice(0, 3);
    dayCard.innerHTML = `
      <button class="close" aria-label="Close">×</button>
      <div class="tags">${dayTags(d).map((t) => `<span>${t}</span>`).join('')}</div>
      ${ribbon(merged, 26)}
      <div class="spans">${top.map((e) => `<span><i style="background:${PAL[MAJORS[e.mi]]}"></i>${SHORT[MAJORS[e.mi]]} ${fmtDur(e.dur)}</span>`).join('')}</div>
      <div class="note">one of ${K.toLocaleString()} drawn days</div>`;
    dayCard.querySelector('.close').addEventListener('click', clearSelection);
    dayCard.classList.add('show');
    dayCard.inert = false;
  }
  function clearSelection() {
    setHighlight(-1);
    dayCard.classList.remove('show');
    dayCard.inert = true;
  }

  // ---- filter chips
  root.querySelectorAll('.chip').forEach((c) =>
    c.addEventListener('click', () => setFilter(c.dataset.filter)));

  // ---- the key: hover (or tap) a category to isolate its threads
  const keyBtns = [...root.querySelectorAll('.keyrail [data-major], .keypanel [data-major]')];
  keyBtns.forEach((el) => {
    const mi = MAJORS.indexOf(el.dataset.major);
    const mark = () => keyBtns.forEach((o) => o.classList.toggle('iso', o.dataset.major === el.dataset.major));
    const on = () => { state.onlyMajor = mi; state.dirty = true; mark(); };
    const off = () => { state.onlyMajor = -1; state.dirty = true; keyBtns.forEach((o) => o.classList.remove('iso')); };
    el.addEventListener('pointerenter', (ev) => { if (ev.pointerType !== 'touch') on(); });
    el.addEventListener('pointerleave', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('click', () => (state.onlyMajor === mi ? off() : on()));
  });

  const moreBtn = root.querySelector('.keyrail-more');
  const keyPanel = root.querySelector('.keypanel');
  moreBtn.addEventListener('click', () => {
    const open = moreBtn.getAttribute('aria-expanded') !== 'true';
    moreBtn.setAttribute('aria-expanded', String(open));
    keyPanel.hidden = !open;
    moreBtn.textContent = open ? 'close' : 'all 12';
  });

  // ---- scroll narrative
  const steps = [...root.querySelectorAll('.step')];
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target;
      const dim = el.dataset.dim ? el.dataset.dim.split(',').map(Number) : null;
      setDim(dim);
      state.gAlphaTarget = el.dataset.galpha ? +el.dataset.galpha : 1;
      if (el.dataset.filter) setFilter(el.dataset.filter);
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => io.observe(s));

  // ---- the trace act: scrolling walks the highlight down a parade of single
  // days, so "every line is one person" is demonstrated before it is claimed.
  // PPS order is effectively random with respect to traits, so an even stride
  // over it is a fair parade.
  const traceStep = root.querySelector('[data-trace]');
  const traceDay = root.querySelector('.trace-day');
  const TRACE_N = Math.min(44, K);
  const TRACE = Array.from({ length: TRACE_N }, (_, j) => Math.floor((j + 0.5) * K / TRACE_N));
  let traceIdx = -1;

  // The act runs only while the sticky card is wholly on screen: it engages
  // once the card has reached its pinned position and ends before the step's
  // bottom edge starts pushing it back off. Outside that window there is
  // nothing to read the highlight against, so the highlight is released.
  const ACT_IN = 0.18, ACT_OUT = 0.82;
  function updateTrace() {
    const r = traceStep.getBoundingClientRect();
    const raw = (innerHeight - r.top) / (r.height + innerHeight);
    if (raw < ACT_IN || raw > ACT_OUT) {
      if (traceIdx >= 0) { traceIdx = -1; setHighlight(-1); traceDay.classList.remove('show'); }
      return;
    }
    const p = Math.min(1, Math.max(0, (raw - ACT_IN) / (ACT_OUT - ACT_IN)));
    const i = Math.min(TRACE_N - 1, Math.floor(p * TRACE_N));
    if (i === traceIdx) return;
    traceIdx = i;
    const d = days[TRACE[i]];
    setHighlight(TRACE[i]);
    traceDay.innerHTML = `${ribbon(mergeEps(d.eps), 14)}
      <p class="trace-tags">${dayTags(d).join(' · ')}</p>`;
    traceDay.classList.add('show');
  }

  // The day card is position:fixed, so once the weave scrolls away it would hang
  // over the sections below. Retire it with the stage.
  let stageVisible = true;
  const stageIo = new IntersectionObserver(([entry]) => {
    stageVisible = entry.isIntersecting;
    if (!entry.isIntersecting) clearSelection();
  }, { threshold: 0 });
  stageIo.observe(stage);

  let scrollRaf = 0;
  addEventListener('scroll', () => {
    cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      // Redraw on every scroll frame the stage is on screen. The resize
      // hysteresis above is the fix for the flashing; this is the belt to its
      // braces — if the compositor drops the canvas layer mid-scroll it is
      // repainted within a frame rather than staying blank until something
      // else happens to move.
      if (stageVisible) state.dirty = true;
      updateTrace();
    });
  }, { passive: true });
  updateTrace();
}
