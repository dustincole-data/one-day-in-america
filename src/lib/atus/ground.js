// The ground. Night won; Daylight and Ember are gone.
//
// Palette rules that are not taste:
//   · 12 distinguishable hues, always. The fine partition is load-bearing (C3);
//     a coarse 3–5 colour palette makes the headline false.
//   · Threads composite with ordinary alpha blending. `multiply` is out at any
//     opacity, and additive compounds to white (render budget §7).

import { DARK } from './meta.js';

export const GROUND = {
  palette: DARK,
  bg: '#0b0d16',
  ink: '#e9eaf2',
  muted: '#a0a3b8',
  hair: 'rgba(233, 234, 242, 0.14)',
  card: 'rgba(13, 16, 27, 0.86)',
  cardSolid: 'rgba(13, 16, 27, 0.96)',
  well: 'rgba(233, 234, 242, 0.045)',
  strong: '#ffffff',
  threadAlpha: 0.97,
};
