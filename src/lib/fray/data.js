// Decode public/data/days.bin — the 2,600-day systematic PPS sample.
// Layout (little-endian): u32 count, then per day:
//   u8 flags, u8 ageBand, u8 epCount, epCount × (u16 start, u16 dur, u8 major, u8 home)

export const FLAG = {
  weekend: 1, worked: 2, worked6h: 4, female: 8, age65: 16, kids: 32, age2554: 64, holiday: 128,
};

export const AGE_BANDS = ['15–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75+'];

export async function loadDays(url) {
  const buf = await (await fetch(url)).arrayBuffer();
  const dv = new DataView(buf);
  const count = dv.getUint32(0, true);
  const days = new Array(count);
  let o = 4;
  for (let i = 0; i < count; i++) {
    const flags = dv.getUint8(o);
    const ageBand = dv.getUint8(o + 1);
    const epCount = dv.getUint8(o + 2);
    o += 3;
    const eps = new Array(epCount);
    for (let e = 0; e < epCount; e++) {
      eps[e] = {
        start: dv.getUint16(o, true),
        dur: dv.getUint16(o + 2, true),
        mi: dv.getUint8(o + 4),
        home: dv.getUint8(o + 5),
      };
      o += 6;
    }
    // minute→major lookup, and the wake rank (first minute not personal_care;
    // personal_care is major 0 in payload order)
    const mm = new Uint8Array(1440);
    for (const ep of eps) mm.fill(ep.mi, ep.start, ep.start + ep.dur);
    let wake = 1440;
    for (let m = 0; m < 1440; m++) if (mm[m] !== 0) { wake = m; break; }
    days[i] = { flags, ageBand, eps, mm, wake };
  }
  return days;
}
