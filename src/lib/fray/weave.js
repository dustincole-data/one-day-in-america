// The weave: at every minute, active days are stacked into bands by activity
// (BAND_ORDER), members kept in wake order, whole stack centered. Result is a
// (1440 × K) RGBA8 texture: R,G = y (u16, fabric-normalized), B = major, A = active.

import { MAJORS, BAND_ORDER } from '../atus/meta.js';

const ORDER = BAND_ORDER.map((name) => MAJORS.indexOf(name)); // band position → major index
const BAND_POS = new Uint8Array(12);
ORDER.forEach((mi, pos) => { BAND_POS[mi] = pos; });

export function makeWeaver(days) {
  const K = days.length;
  const GAP = Math.max(8, Math.round(K * 0.009));
  const H = K + 11 * GAP; // fabric capacity, constant across weaves
  const order = [...days.keys()].sort((a, b) => days[a].wake - days[b].wake || a - b);
  const yFloat = new Float32Array(K * 1440);
  const tmp = new Float32Array(1440);
  const counts = new Int32Array(12);
  const offsets = new Float64Array(12);

  /**
   * active: Uint8Array(K) mask. fallback: previous tex (Uint8Array) whose y is
   * kept for inactive days so they fade out in place. Returns RGBA8 bytes.
   */
  function weave(active, fallback = null) {
    const tex = new Uint8Array(1440 * K * 4);
    let nActive = 0;
    for (let i = 0; i < K; i++) if (active[i]) nActive++;

    for (let m = 0; m < 1440; m++) {
      counts.fill(0);
      for (const i of order) if (active[i]) counts[BAND_POS[days[i].mm[m]]]++;
      let nb = 0;
      for (let b = 0; b < 12; b++) if (counts[b] > 0) nb++;
      const total = nActive + (nb - 1) * GAP;
      let cursor = (H - total) / 2;
      for (let b = 0; b < 12; b++) {
        offsets[b] = cursor;
        if (counts[b] > 0) cursor += counts[b] + GAP;
      }
      for (const i of order) {
        if (!active[i]) continue;
        const b = BAND_POS[days[i].mm[m]];
        yFloat[i * 1440 + m] = offsets[b] + 0.5;
        offsets[b] += 1;
      }
    }

    // temporal smoothing: two box-blur passes along the minute axis
    const R = 10, W = 2 * R + 1;
    for (const i of order) {
      if (!active[i]) continue;
      const row = yFloat.subarray(i * 1440, i * 1440 + 1440);
      for (let pass = 0; pass < 2; pass++) {
        let acc = 0;
        for (let m = -R; m <= R; m++) acc += row[Math.min(1439, Math.max(0, m))];
        for (let m = 0; m < 1440; m++) {
          tmp[m] = acc / W;
          acc += row[Math.min(1439, m + R + 1)] - row[Math.max(0, m - R)];
        }
        row.set(tmp);
      }
    }

    for (let i = 0; i < K; i++) {
      const mm = days[i].mm;
      if (active[i]) {
        for (let m = 0; m < 1440; m++) {
          const q = Math.max(0, Math.min(65535, Math.round(yFloat[i * 1440 + m] / H * 65535)));
          const o = (m * K + i) * 4;
          tex[o] = q >> 8; tex[o + 1] = q & 255; tex[o + 2] = mm[m]; tex[o + 3] = 255;
        }
      } else {
        for (let m = 0; m < 1440; m++) {
          const o = (m * K + i) * 4;
          if (fallback) { tex[o] = fallback[o]; tex[o + 1] = fallback[o + 1]; }
          else { tex[o] = 128; tex[o + 1] = 0; }
          tex[o + 2] = mm[m]; tex[o + 3] = 0;
        }
      }
    }
    return tex;
  }

  return { weave, K, H, GAP };
}

/** decoded y (0…1) for picking: reads a tex at (minute, day) */
export const texY = (tex, K, i, m) => ((tex[(m * K + i) * 4] << 8) | tex[(m * K + i) * 4 + 1]) / 65535;
