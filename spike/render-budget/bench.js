// THROWAWAY (ticket 04). Measures what a device can draw. No design intent.
// Every number this file reports is measured in the page; nothing is modelled.

const TAU = Math.PI * 2;
const Q = new URLSearchParams(location.search);
const P = {
  tech: Q.get('tech') || 'webgl',          // c2d_rect | c2d_batched | c2d_baked | webgl | cpuburn
  year: Q.get('year') || '2024',           // 2019 | 2023 | 2024 | all
  n: +(Q.get('n') || 4000),                // threads
  ns: Q.get('ns'),                         // sweep ladder, e.g. 500,1000,2000
  layout: Q.get('layout') || 'rows',       // rows | ribbon
  blend: Q.get('blend') || 'alpha',        // alpha | multiply
  alpha: +(Q.get('alpha') || 1),
  bandH: +(Q.get('bandH') || 6),           // device px, ribbon layout
  frames: +(Q.get('frames') || 90),
  warmup: +(Q.get('warmup') || 20),
  rep: +(Q.get('rep') || 1),               // draw the scene R times per frame (GPU stress)
  msaa: Q.get('msaa') !== '0',
  probe: Q.get('probe') || '',             // blend | ''
  dprCap: +(Q.get('dprCap') || 0),         // 0 = use real DPR
};

const hud = document.getElementById('hud');
const cv = document.getElementById('cv');
const say = (s) => { hud.textContent = s; };

const PAL = [
  [0.85, 0.35, 0.30], [0.30, 0.45, 0.75], [0.35, 0.70, 0.55], [0.85, 0.65, 0.25],
  [0.55, 0.35, 0.70], [0.25, 0.65, 0.75], [0.90, 0.55, 0.45], [0.45, 0.55, 0.35],
  [0.75, 0.45, 0.60], [0.35, 0.35, 0.40], [0.65, 0.75, 0.35], [0.60, 0.60, 0.60],
];
const PAL_CSS = PAL.map(([r, g, b]) => `rgb(${(r * 255) | 0},${(g * 255) | 0},${(b * 255) | 0})`);

// ---------------------------------------------------------------- sizing
const DPR = P.dprCap ? Math.min(devicePixelRatio, P.dprCap) : devicePixelRatio;
let W = 0, H = 0;
function size() {
  const r = cv.getBoundingClientRect();
  W = Math.round(r.width * DPR);
  H = Math.round(r.height * DPR);
  cv.width = W; cv.height = H;
}

// ---------------------------------------------------------------- data
async function loadYear(y) {
  const buf = await (await fetch(`./data/threads-${y}.bin`)).arrayBuffer();
  const dv = new DataView(buf);
  if (String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3)) !== 'ODIA') throw new Error('bad magic');
  const D = dv.getUint32(8, true), E = dv.getUint32(12, true);
  const offCounts = 16;
  const offDur = (offCounts + D) + ((offCounts + D) % 2);
  const offMajor = offDur + E * 2;
  return {
    D, E, bytes: buf.byteLength,
    counts: new Uint8Array(buf, offCounts, D),
    dur: new Uint16Array(buf, offDur, E),
    major: new Uint8Array(buf, offMajor, E),
  };
}

// Strided pick, not head-N: the file is TUCASEID order, which is date order.
function buildInstances(years, n) {
  const days = [];   // [{year, epStart, epCount}]
  for (const y of years) for (let d = 0, p = 0; d < y.D; d++) { days.push([y, p, y.counts[d]]); p += y.counts[d]; }
  const D = days.length;
  const take = Math.min(n, D);
  const stride = D / take;
  let E = 0;
  const picked = [];
  for (let i = 0; i < take; i++) { const d = days[Math.floor(i * stride)]; picked.push(d); E += d[2]; }
  const inst = new Uint16Array(E * 4);
  let k = 0;
  for (let r = 0; r < picked.length; r++) {
    const [y, p, c] = picked[r];
    let start = 0;
    for (let j = 0; j < c; j++) {
      const dur = y.dur[p + j];
      inst[k++] = start; inst[k++] = dur; inst[k++] = r; inst[k++] = y.major[p + j];
      start += dur;
    }
  }
  return { inst, E, N: take, totalDays: D };
}

// Shared layout maths — the c2d path and the shader must agree or the compare is a lie.
function layoutJS(start, dur, row, N, t, layoutRibbon, bandH) {
  const x0 = start / 1440 * W, w = dur / 1440 * W;
  const rowsH = H / N;
  const minuteMid = (start + dur * 0.5) / 1440;
  const phase = row * 0.37 + t * TAU;
  if (!layoutRibbon) return [x0, row * rowsH + Math.sin(minuteMid * TAU + phase) * rowsH * 0.5, w, rowsH];
  return [x0, H * 0.5 + Math.sin(minuteMid * TAU * 2 + phase) * (H * 0.35) - bandH * 0.5, w, bandH];
}

// ---------------------------------------------------------------- renderers
function makeC2D(data, variant) {
  const ctx = cv.getContext('2d', { alpha: false });
  const { inst, E, N } = data;
  const ribbon = P.layout === 'ribbon';
  let baked = null;

  function paint(c, t) {
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#f4f2ee';
    c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = P.blend === 'multiply' ? 'multiply' : 'source-over';
    c.globalAlpha = P.alpha;
    if (variant === 'batched') {
      for (let m = 0; m < 12; m++) {
        c.beginPath();
        let any = false;
        for (let i = 0; i < E; i++) {
          if (inst[i * 4 + 3] !== m) continue;
          const [x, y, w, h] = layoutJS(inst[i * 4], inst[i * 4 + 1], inst[i * 4 + 2], N, t, ribbon, P.bandH);
          c.rect(x, y, w, h); any = true;
        }
        if (any) { c.fillStyle = PAL_CSS[m]; c.fill(); }
      }
    } else {
      for (let i = 0; i < E; i++) {
        const [x, y, w, h] = layoutJS(inst[i * 4], inst[i * 4 + 1], inst[i * 4 + 2], N, t, ribbon, P.bandH);
        c.fillStyle = PAL_CSS[inst[i * 4 + 3]];
        c.fillRect(x, y, w, h);
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  if (variant === 'baked') {
    baked = document.createElement('canvas');
    baked.width = W; baked.height = H;
    paint(baked.getContext('2d', { alpha: false }), 0);
  }

  return {
    draw(t) {
      if (variant === 'baked') {
        // the "bake once, then move the image" path: one composite per frame
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#f4f2ee'; ctx.fillRect(0, 0, W, H);
        const s = 1 + 0.15 * Math.sin(t * TAU);
        ctx.setTransform(s, 0, 0, s, (1 - s) * W * 0.5, (1 - s) * H * 0.5);
        for (let r = 0; r < P.rep; r++) ctx.drawImage(baked, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        for (let r = 0; r < P.rep; r++) paint(ctx, t);
      }
    },
    read: () => ctx.getImageData(0, 0, W, H),
    gpuBytes: 0,
    label: `canvas2d/${variant}`,
  };
}

function makeGL(data) {
  const gl = cv.getContext('webgl2', {
    alpha: false, antialias: P.msaa, premultipliedAlpha: true, preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error('no webgl2');
  const { inst, E, N } = data;
  let lost = false;
  cv.addEventListener('webglcontextlost', () => { lost = true; });
  const sync1 = new Uint8Array(4);

  const vs = `#version 300 es
  in vec2 aCorner; in uvec4 aInst;
  uniform vec2 uRes; uniform float uN, uT, uRibbon, uBandH;
  flat out int vMajor;
  void main(){
    float start=float(aInst.x), dur=float(aInst.y), row=float(aInst.z);
    float x0=start/1440.0*uRes.x, w=dur/1440.0*uRes.x;
    float rowsH=uRes.y/uN;
    float minuteMid=(start+dur*0.5)/1440.0;
    float phase=row*0.37+uT*6.283185307;
    float yR=row*rowsH+sin(minuteMid*6.283185307+phase)*rowsH*0.5;
    float yB=uRes.y*0.5+sin(minuteMid*6.283185307*2.0+phase)*(uRes.y*0.35)-uBandH*0.5;
    float y=mix(yR,yB,uRibbon);
    float h=mix(rowsH,uBandH,uRibbon);
    vec2 p=vec2(x0+aCorner.x*w, y+aCorner.y*h);
    gl_Position=vec4(p.x/uRes.x*2.0-1.0, 1.0-p.y/uRes.y*2.0, 0.0, 1.0);
    vMajor=int(aInst.w);
  }`;
  const fs = `#version 300 es
  precision mediump float;
  flat in int vMajor;
  uniform vec3 uPal[12]; uniform float uAlpha;
  out vec4 o;
  void main(){ vec3 c=uPal[vMajor]; o=vec4(c*uAlpha, uAlpha); }`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(pr);
  if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
  gl.useProgram(pr);

  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  const aCorner = gl.getAttribLocation(pr, 'aCorner');
  gl.enableVertexAttribArray(aCorner); gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ib);
  gl.bufferData(gl.ARRAY_BUFFER, inst, gl.STATIC_DRAW);
  const aInst = gl.getAttribLocation(pr, 'aInst');
  gl.enableVertexAttribArray(aInst);
  gl.vertexAttribIPointer(aInst, 4, gl.UNSIGNED_SHORT, 8, 0);
  gl.vertexAttribDivisor(aInst, 1);

  const u = (k) => gl.getUniformLocation(pr, k);
  gl.uniform3fv(u('uPal[0]'), new Float32Array(PAL.flat()));
  gl.enable(gl.BLEND);
  if (P.blend === 'multiply') gl.blendFunc(gl.DST_COLOR, gl.ZERO);
  else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // premultiplied source-over

  return {
    draw(t) {
      gl.viewport(0, 0, W, H);
      gl.clearColor(0.957, 0.949, 0.933, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u('uRes'), W, H);
      gl.uniform1f(u('uN'), N);
      gl.uniform1f(u('uT'), t);
      gl.uniform1f(u('uRibbon'), P.layout === 'ribbon' ? 1 : 0);
      gl.uniform1f(u('uBandH'), P.bandH);
      gl.uniform1f(u('uAlpha'), P.alpha);
      for (let r = 0; r < P.rep; r++) gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, E);
      // gl.finish() does not block under ANGLE/D3D11 — a 1-pixel readback does.
      // Without it drawMs is CPU submit time only and reads ~1ms at any load.
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, sync1);
    },
    get lost() { return lost || gl.isContextLost(); },
    read() {
      const px = new Uint8Array(W * H * 4);
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      return { data: px, width: W, height: H };
    },
    gpuBytes: inst.byteLength,
    label: `webgl2/instanced${P.msaa ? '+msaa' : ''}`,
  };
}

// The canary: pure JS work of known size. If CPU throttling is really on,
// this number moves with the throttle rate. If it does not, the emulation no-oped.
function makeBurn() {
  return {
    draw() { let x = 0; for (let i = 0; i < 3e6; i++) x = (x + Math.sqrt(i % 97)) % 1e6; if (x === -1) console.log(x); },
    read: () => null, gpuBytes: 0, label: 'cpuburn/3e6',
  };
}

// ---------------------------------------------------------------- runner
function stats(a) {
  const s = [...a].sort((x, y) => x - y);
  const q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { med: +q(0.5).toFixed(2), p95: +q(0.95).toFixed(2), min: +s[0].toFixed(2), max: +s[s.length - 1].toFixed(2) };
}

function measure(r) {
  return new Promise((resolve) => {
    const dt = [], dr = [];
    let i = 0, prev = 0;
    function frame(ts) {
      const t0 = performance.now();
      r.draw((i % 120) / 120);
      const t1 = performance.now();
      if (i >= P.warmup) { dr.push(t1 - t0); if (prev) dt.push(ts - prev); }
      prev = ts; i++;
      if (i < P.warmup + P.frames) requestAnimationFrame(frame);
      else resolve({ draw: stats(dr), frame: stats(dt) });
    }
    requestAnimationFrame(frame);
  });
}

function makeRenderer(data) {
  if (P.tech === 'cpuburn') return makeBurn();
  if (P.tech === 'webgl') return makeGL(data);
  if (P.tech === 'c2d_rect') return makeC2D(data, 'rect');
  if (P.tech === 'c2d_batched') return makeC2D(data, 'batched');
  if (P.tech === 'c2d_baked') return makeC2D(data, 'baked');
  throw new Error('unknown tech ' + P.tech);
}

async function runOne(years, n) {
  const b0 = performance.now();
  const data = P.tech === 'cpuburn' ? { inst: new Uint16Array(0), E: 0, N: 0, totalDays: 0 } : buildInstances(years, n);
  const buildMs = performance.now() - b0;
  const c0 = performance.now();
  const r = makeRenderer(data);
  const firstDraw = (() => { const t = performance.now(); r.draw(0); return performance.now() - t; })();
  const setupMs = performance.now() - c0;
  const m = await measure(r);
  return {
    tech: r.label, n: data.N, episodes: data.E, rep: P.rep,
    layout: P.layout, blend: P.blend, alpha: P.alpha, msaa: P.msaa,
    buildMs: +buildMs.toFixed(1), setupMs: +setupMs.toFixed(1), firstDrawMs: +firstDraw.toFixed(1),
    drawMs: m.draw, frameMs: m.frame,
    fps: +(1000 / Math.max(m.frame.med, 0.001)).toFixed(1),
    contextLost: !!r.lost,
    canvasPx: W * H, canvasMB: +(W * H * 4 / 1048576).toFixed(2),
    gpuBufMB: +(r.gpuBytes / 1048576).toFixed(2),
    heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
  };
}

// Overlap probe: N identical translucent bands stacked on the light ground.
// Reads the real pixel back, so "multiply compounds to black" is a number here.
async function probeBlend(years) {
  const out = [];
  for (const mode of ['alpha', 'multiply']) {
    for (const a of [1, 0.5, 0.25, 0.1, 0.05]) {
      for (const overlaps of [1, 2, 4, 8, 16, 32, 64]) {
        const ctx = cv.getContext('2d', { alpha: false, willReadFrequently: true });
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;              // or the ground itself is translucent and the read is contaminated
        ctx.fillStyle = '#f4f2ee'; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = mode === 'multiply' ? 'multiply' : 'source-over';
        ctx.globalAlpha = a;
        ctx.fillStyle = PAL_CSS[1];
        for (let i = 0; i < overlaps; i++) ctx.fillRect(W * 0.2, H * 0.2, W * 0.6, H * 0.6);
        const px = ctx.getImageData((W * 0.5) | 0, (H * 0.5) | 0, 1, 1).data;
        out.push({ blend: mode, alpha: a, overlaps, rgb: [px[0], px[1], px[2]] });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- go
(async () => {
  size();
  const years = P.tech === 'cpuburn' ? [] : await Promise.all(
    (P.year === 'all' ? [2019, 2023, 2024] : [P.year]).map(loadYear));

  if (P.probe === 'blend') {
    const res = await probeBlend(years);
    window.__RESULT = { probe: 'blend', W, H, DPR, res };
    window.__DONE = true;
    say(JSON.stringify(res.slice(0, 8), null, 1));
    return;
  }

  const ladder = P.ns ? P.ns.split(',').map(Number) : [P.n];
  const runs = [];
  for (const n of ladder) {
    say(`running n=${n} ${P.tech} ${P.layout} ...`);
    const r = await runOne(years, n);
    runs.push(r);
    say(runs.map((x) => `n=${x.n} eps=${x.episodes} draw=${x.drawMs.med}ms p95=${x.drawMs.p95} frame=${x.frameMs.med}ms fps=${x.fps}`).join('\n'));
  }
  window.__RESULT = {
    ua: navigator.userAgent, dpr: DPR, css: [innerWidth, innerHeight], device: [W, H],
    cores: navigator.hardwareConcurrency, deviceMemoryGB: navigator.deviceMemory ?? null,
    totalDaysAvailable: years.reduce((a, y) => a + y.D, 0),
    totalEpisodesAvailable: years.reduce((a, y) => a + y.E, 0),
    runs,
  };
  window.__DONE = true;
})().catch((e) => { window.__ERROR = String(e && e.stack || e); window.__DONE = true; say('ERROR ' + e); });
