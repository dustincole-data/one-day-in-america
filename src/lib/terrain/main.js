// The Terrain — the American day as a solid 3D mountain range.
// 12 activity ridges (+ the at-home work shelf), x = 4 a.m.→4 a.m., height =
// share of the population at each minute. 2019 lives in a morph target; the
// "moved indoors" act scrubs the years with scroll.

import * as THREE from 'three';
import { MAJORS, LABELS, SHORT, DARK, hourLabel } from '../atus/meta.js';

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BG = 0x10122b;

// back → front, by 2024 peak height
const RIDGE_ORDER = ['personal_care', 'leisure_sports', 'work', 'household', 'eating_drinking',
  'purchasing', 'care_household', 'education', 'org_civic_religious', 'phone_mail_email',
  'other_nec', 'care_nonhousehold'];

const W = 24;            // world width (1 unit per hour)
const HSCALE = 8.6;      // world height at 100%
const DEPTH = 0.92;      // ridge thickness
const N = 288;           // x samples (5-minute)
// depth position per ridge: the five big shapes get room, the minor ridges sit tight
const RIDGE_Z = [];
{
  let z = 0;
  for (let i = 0; i < 12; i++) { RIDGE_Z.push(z); z += i < 4 ? 1.45 : 0.95; }
}
const FRONT_Z = RIDGE_Z[11] + 1.0;

export async function boot(root) {
  const wrap = root.querySelector('.stage3d');
  const canvas = root.querySelector('canvas');
  const readout = root.querySelector('.readout');
  const labelLayer = root.querySelector('.labels');

  // ---- data
  const buf = await (await fetch('/data/grid.bin')).arrayBuffer();
  const u16 = new Uint16Array(buf);
  const YEAR_OFF = { 2019: 0, 2024: 14 * 1440 };
  const share = (year, ch, m) => u16[YEAR_OFF[year] + ch * 1440 + m] / 65535;
  const hourShare = (year, ch, clockHour) => {
    const s = (((clockHour * 60) - 240) + 1440) % 1440;
    let acc = 0;
    for (let m = s; m < s + 60; m++) acc += share(year, ch, m);
    return acc / 60;
  };

  // ---- renderer
  const phone = Math.min(innerWidth, innerHeight) < 720;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(BG, 1);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(BG, 0.0205);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 220);

  const sun = new THREE.DirectionalLight(0xffd9b0, 2.6);
  sun.position.set(-14, 16, 26);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x7d86ff, 0.9);
  fill.position.set(20, 8, -12);
  scene.add(fill);
  scene.add(new THREE.AmbientLight(0x585e8a, 1.1));

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(340, 260),
    new THREE.MeshStandardMaterial({ color: 0x141633, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(W / 2, -0.02, 4);
  scene.add(ground);

  // ---- ridge geometry: solid extruded polyline with a 2019 morph target
  function ridgeGeometry(ch) {
    const step = 1440 / N;
    const hs = (year, i) => {
      const m = Math.min(1439, Math.round(i * step));
      return Math.max(share(year, ch, m) * HSCALE, 0.045);
    };
    const pos24 = [], pos19 = [];
    const zF = DEPTH / 2, zB = -DEPTH / 2;
    // vertex layout per sample: topF, topB, botF, botB
    for (let i = 0; i <= N; i++) {
      const x = (i / N) * W;
      const h24 = hs(2024, i), h19 = hs(2019, i);
      pos24.push(x, h24, zF, x, h24, zB, x, 0, zF, x, 0, zB);
      pos19.push(x, h19, zF, x, h19, zB, x, 0, zF, x, 0, zB);
    }
    const idx = [];
    for (let i = 0; i < N; i++) {
      const a = i * 4, b = (i + 1) * 4;
      idx.push(a, b, a + 1, b, b + 1, a + 1);           // top
      idx.push(a + 2, b + 2, a, b + 2, b, a);           // front face
      idx.push(a + 1, b + 1, a + 3, b + 1, b + 3, a + 3); // back face
    }
    idx.push(2, 0, 1, 2, 1, 3);                          // left cap
    const l = N * 4;
    idx.push(l, l + 2, l + 3, l, l + 3, l + 1);          // right cap
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos24, 3));
    g.morphAttributes.position = [new THREE.Float32BufferAttribute(pos19, 3)];
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  const meshes = [];
  RIDGE_ORDER.forEach((name, i) => {
    const ch = MAJORS.indexOf(name);
    // the seven minor ridges are dusk-muted foothills; the five big shapes carry color
    const bright = i < 5 ? 0.92 : 0.5;
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(DARK[name]).multiplyScalar(bright),
      roughness: i < 5 ? 0.86 : 0.98, metalness: 0.04, flatShading: true,
      transparent: true, opacity: 1,
    });
    const mesh = new THREE.Mesh(ridgeGeometry(ch), mat);
    mesh.position.z = RIDGE_Z[i];
    mesh.userData = { name, ch, base: mat.color.clone() };
    scene.add(mesh);
    meshes.push(mesh);
  });
  // the at-home work shelf, nested just in front of the work ridge
  {
    const wahMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#9fe8ff').multiplyScalar(0.9),
      roughness: 0.7, metalness: 0.05, flatShading: true,
      transparent: true, opacity: 1,
    });
    const mesh = new THREE.Mesh(ridgeGeometry(13), wahMat);
    const workIdx = RIDGE_ORDER.indexOf('work');
    mesh.position.z = RIDGE_Z[workIdx] + DEPTH / 2 + 0.1;
    mesh.scale.z = 0.42;
    mesh.userData = { name: 'work_at_home', ch: 13, base: wahMat.color.clone() };
    scene.add(mesh);
    meshes.push(mesh);
  }

  let yearMix = 1; // 0 = 2019, 1 = 2024
  let yearTarget = 1;
  function applyYear(v) {
    for (const m of meshes) m.morphTargetInfluences[0] = 1 - v;
  }
  applyYear(1);

  // ---- labels (DOM, projected)
  const labelDefs = [];
  RIDGE_ORDER.forEach((name, i) => {
    if (!['personal_care', 'leisure_sports', 'work', 'household', 'eating_drinking'].includes(name)) return;
    labelDefs.push({ name: SHORT[name], ridge: name, pos: new THREE.Vector3(-0.55, 0.5, RIDGE_Z[i]), cls: 'ridge' });
  });
  labelDefs.push({ name: 'working from home', ridge: 'work_at_home', pos: new THREE.Vector3(W - 1.6, 1.15, RIDGE_Z[RIDGE_ORDER.indexOf('work')] + 0.8), cls: 'ridge wah' });
  for (let h = 0; h < 25; h += 4) {
    const clock = (h + 4) % 24;
    labelDefs.push({ name: h === 24 ? '4 a.m.' : hourLabel(clock), pos: new THREE.Vector3(h, 0.02, FRONT_Z), cls: 'axis' });
  }
  const labelEls = labelDefs.map((d) => {
    const el = document.createElement('span');
    el.className = d.cls;
    el.textContent = d.name;
    labelLayer.appendChild(el);
    return el;
  });
  const proj = new THREE.Vector3();
  function placeLabels() {
    const wpx = wrap.clientWidth, hpx = wrap.clientHeight;
    labelDefs.forEach((d, i) => {
      proj.copy(d.pos).project(camera);
      const el = labelEls[i];
      if (proj.z > 1 || proj.x < -0.96 || proj.x > 0.97) { el.style.opacity = '0'; return; }
      el.style.opacity = d.ridge && focusSet && !focusSet.has(d.ridge) ? '0.18' : '';
      el.style.transform = `translate(-50%,-50%) translate(${(proj.x * 0.5 + 0.5) * wpx}px, ${(-proj.y * 0.5 + 0.5) * hpx}px)`;
    });
  }

  // ---- camera acts
  const zWork = RIDGE_Z[RIDGE_ORDER.indexOf('work')];
  const zLeis = RIDGE_Z[RIDGE_ORDER.indexOf('leisure_sports')];
  const VIEWS = {
    hero: { pos: [12, 16.5, 24], look: [12, -0.1, 2.4] },
    night: { pos: [29, 10, 13], look: [20.5, 2.2, 0.6], year: 1, focus: ['personal_care'] },
    work: { pos: [12.5, 9.5, 16.5], look: [11.5, 0.6, zWork], year: 1, focus: ['work', 'work_at_home'] },
    indoors: { pos: [15.5, 8, 13.5], look: [11.5, 0.4, zWork + 0.3], focus: ['work', 'work_at_home'] },
    evening: { pos: [24.5, 8.6, 15.8], look: [17.4, 1.2, zLeis], year: 1, focus: ['leisure_sports', 'personal_care'] },
    explore: { pos: [12, 18, 24.5], look: [12, -0.3, 2.4] },
  };
  let focusSet = null;
  function setFocus(list) {
    focusSet = list ? new Set(list) : null;
    for (const m of meshes) {
      m.userData.opTarget = !focusSet || focusSet.has(m.userData.name) ? 1 : 0.15;
    }
  }
  setFocus(null);
  let curPos = new THREE.Vector3(...VIEWS.hero.pos);
  let curLook = new THREE.Vector3(...VIEWS.hero.look);
  let tgtPos = curPos.clone(), tgtLook = curLook.clone();
  let scrubEl = null;

  // drag orbit offsets
  let azi = 0, ele = 0, aziT = 0, eleT = 0;
  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    aziT = THREE.MathUtils.clamp(aziT - (e.clientX - lastX) * 0.004, -0.65, 0.65);
    eleT = THREE.MathUtils.clamp(eleT + (e.clientY - lastY) * 0.003, -0.22, 0.3);
    lastX = e.clientX; lastY = e.clientY;
  });

  // ---- hover readout
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = null;
  function hover(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(meshes, false);
    if (hovered) { hovered.material.emissive.setScalar(0); hovered = null; }
    if (!hits.length) { readout.classList.remove('show'); return; }
    const hit = hits[0];
    hovered = hit.object;
    hovered.material.emissive = hovered.userData.base.clone().multiplyScalar(0.25);
    const minute = THREE.MathUtils.clamp(Math.round(hit.point.x / W * 1439), 0, 1439);
    const clockHour = Math.floor(((minute + 240) % 1440) / 60);
    const year = yearMix < 0.5 ? 2019 : 2024;
    const v = hourShare(year, hovered.userData.ch, clockHour) * 100;
    const nm = hovered.userData.ch === 13 ? 'working from home' : SHORT[hovered.userData.name];
    readout.innerHTML = `<b>${hourLabel(clockHour)}</b> · ${nm} · <b>${v.toFixed(1)}%</b> of the country · ${year}`;
    readout.classList.add('show');
  }
  canvas.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' && !dragging) hover(e); });
  canvas.addEventListener('pointerleave', () => { if (hovered) { hovered.material.emissive.setScalar(0); hovered = null; } readout.classList.remove('show'); });

  // ---- acts
  const acts = [...root.querySelectorAll('.step')];
  const chips = root.querySelector('.yearchips');
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target;
      const view = VIEWS[el.dataset.view] ?? VIEWS.hero;
      tgtPos.set(...view.pos);
      tgtLook.set(...view.look);
      setFocus(view.focus ?? null);
      scrubEl = el.dataset.scrub !== undefined ? el : null;
      if (!scrubEl && view.year !== undefined) yearTarget = view.year;
      const explore = el.dataset.explore !== undefined;
      chips.classList.toggle('show', explore);
      chips.inert = !explore;
    }
  }, { rootMargin: '-45% 0px -45% 0px' });
  acts.forEach((a) => io.observe(a));

  root.querySelectorAll('.ychip').forEach((c) =>
    c.addEventListener('click', () => {
      yearTarget = +c.dataset.year === 2019 ? 0 : 1;
      root.querySelectorAll('.ychip').forEach((o) => o.classList.toggle('on', o === c));
    }));

  function scrubProgress() {
    if (!scrubEl) return null;
    const r = scrubEl.getBoundingClientRect();
    const vh = innerHeight;
    // 0 at act entering (top at 85% vh) → 1 by the time its bottom nears center
    const u = 1 - THREE.MathUtils.clamp((r.top + r.height * 0.55) / (vh * 0.85), 0, 1);
    return THREE.MathUtils.clamp(u * 1.35, 0, 1);
  }

  // ---- sizing + loop
  const ro = new ResizeObserver(() => {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // portrait needs a wider vertical field or the range crops to a band
    camera.fov = camera.aspect < 0.75 ? 62 : camera.aspect < 1.05 ? 50 : 38;
    camera.updateProjectionMatrix();
  });
  ro.observe(wrap);

  const off = new THREE.Vector3();
  let tPrev = 0;
  function frame(ts) {
    const dt = Math.min(0.05, (ts - tPrev) / 1000 || 0.016);
    tPrev = ts;
    // year scrub / tween
    const sp = scrubProgress();
    if (sp !== null) yearTarget = sp;
    yearMix += (yearTarget - yearMix) * (REDUCED ? 1 : Math.min(1, dt * 4.5));
    applyYear(yearMix);
    // ridge focus fade
    for (const m of meshes) {
      const t = m.userData.opTarget ?? 1;
      if (Math.abs(m.material.opacity - t) > 0.005)
        m.material.opacity += (t - m.material.opacity) * Math.min(1, dt * 5);
    }
    // camera
    const drift = REDUCED ? 0 : Math.sin(ts * 0.00012) * 0.05;
    azi += (aziT + drift - azi) * Math.min(1, dt * 5);
    ele += (eleT - ele) * Math.min(1, dt * 5);
    curPos.lerp(tgtPos, Math.min(1, dt * 2.2));
    curLook.lerp(tgtLook, Math.min(1, dt * 2.2));
    off.copy(curPos).sub(curLook);
    const sph = new THREE.Spherical().setFromVector3(off);
    sph.theta += azi;
    sph.phi = THREE.MathUtils.clamp(sph.phi - ele, 0.6, 1.5);
    off.setFromSpherical(sph);
    camera.position.copy(curLook).add(off);
    camera.lookAt(curLook);
    renderer.render(scene, camera);
    placeLabels();
    requestAnimationFrame(frame);
  }
  root.querySelector('.loading')?.remove();
  requestAnimationFrame(frame);
}
