// Three grounds for one piece. Structure, copy and data are identical across all
// three — only the ground, the ink and the 12-major palette change.
//
// Palette rules that are not taste:
//   · 12 distinguishable hues, always. The fine partition is load-bearing (C3);
//     a coarse 3–5 colour palette makes the headline false.
//   · Threads composite with ordinary alpha blending on every ground. `multiply`
//     is out at any opacity, and additive compounds to white (render budget §7).
//   · On a light ground overlapping threads darken toward the ink, so `threadAlpha`
//     runs lower there than on a dark ground.

import { DARK, LIGHT } from './meta.js';

export const SKINS = {
  night: {
    key: 'night',
    name: 'Night',
    blurb: 'Luminous threads on deep navy.',
    palette: DARK,
    bg: '#0b0d16',
    ink: '#e9eaf2',
    muted: '#a0a3b8',
    hair: 'rgba(233, 234, 242, 0.14)',
    card: 'rgba(13, 16, 27, 0.86)',
    cardSolid: 'rgba(13, 16, 27, 0.96)',
    well: 'rgba(233, 234, 242, 0.045)',
    strong: '#ffffff',
    scheme: 'dark',
    threadAlpha: 0.97,
  },

  daylight: {
    key: 'daylight',
    name: 'Daylight',
    blurb: 'Full-chroma threads on white.',
    // LIGHT's hue identities, pushed to full chroma so twelve bands stay separable
    // against paper rather than receding into it.
    palette: {
      ...LIGHT,
      personal_care: '#7a5cd6',
      eating_drinking: '#e0263f',
      household: '#d4581a',
      care_household: '#2e9147',
      care_nonhousehold: '#00897b',
      work: '#1f5fd0',
      education: '#8e3fd4',
      purchasing: '#c72d9e',
      org_civic_religious: '#7d9411',
      leisure_sports: '#e08a00',
      phone_mail_email: '#0f96bd',
      other_nec: '#77808f',
    },
    bg: '#fbfaf7',
    ink: '#14161c',
    muted: '#5d6472',
    hair: 'rgba(20, 22, 28, 0.16)',
    card: 'rgba(251, 250, 247, 0.90)',
    cardSolid: 'rgba(251, 250, 247, 0.97)',
    well: 'rgba(20, 22, 28, 0.045)',
    strong: '#000000',
    scheme: 'light',
    threadAlpha: 0.62,
    // large solid fills of a full-chroma palette read much heavier on paper than
    // the same hues do as alpha-blended threads; this brings the two back together
    fillAlpha: 0.85,
  },

  ember: {
    key: 'ember',
    name: 'Ember',
    blurb: 'Warm spectrum on deep plum.',
    // Warm-biased, but still spread across the wheel. Work, household and leisure
    // are the three largest daytime bands; letting them all sit in one warm lane
    // would blur the fine partition the headline depends on, so they separate by
    // hue and lightness (gold · deep rust · pale apricot).
    palette: {
      personal_care: '#ffdccb',
      eating_drinking: '#ff4d78',
      household: '#d2481f',
      care_household: '#5fc97a',
      care_nonhousehold: '#2fd0bd',
      work: '#ffcf4d',
      education: '#c98cff',
      purchasing: '#ff6ac6',
      org_civic_religious: '#a8b840',
      leisure_sports: '#ff9e6b',
      phone_mail_email: '#5fd4ee',
      other_nec: '#9d8279',
    },
    bg: '#190a12',
    ink: '#f6e6de',
    muted: '#b39a94',
    hair: 'rgba(246, 230, 222, 0.16)',
    card: 'rgba(30, 12, 20, 0.88)',
    cardSolid: 'rgba(30, 12, 20, 0.96)',
    well: 'rgba(246, 230, 222, 0.05)',
    strong: '#fff6f0',
    scheme: 'dark',
    threadAlpha: 0.95,
  },
};

export const SKIN_ORDER = ['night', 'daylight', 'ember'];

// route ↔ skin. `/fray` stays the Night route: it is the URL already shared and
// the one the OG card was captured from.
export const SKIN_PATH = { night: '/fray', daylight: '/daylight', ember: '/ember' };
