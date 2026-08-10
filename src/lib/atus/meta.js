// The 12 gate-proven published activity majors (scripts/atus/categories.ts order —
// the payload builder writes major indexes in this order; do not reorder).
export const MAJORS = [
  'personal_care', 'eating_drinking', 'household', 'care_household', 'care_nonhousehold',
  'work', 'education', 'purchasing', 'org_civic_religious', 'leisure_sports',
  'phone_mail_email', 'other_nec',
];

export const LABELS = {
  personal_care: 'Sleep & personal care',
  eating_drinking: 'Eating & drinking',
  household: 'Household work',
  care_household: 'Caring for household members',
  care_nonhousehold: 'Caring for others',
  work: 'Work',
  education: 'Education',
  purchasing: 'Shopping & errands',
  org_civic_religious: 'Organizations, civic, religious',
  leisure_sports: 'Leisure & sports',
  phone_mail_email: 'Phone & mail',
  other_nec: 'Everything else',
};

export const SHORT = {
  personal_care: 'sleep & personal care',
  eating_drinking: 'eating',
  household: 'household work',
  care_household: 'caring for family',
  care_nonhousehold: 'caring for others',
  work: 'work',
  education: 'education',
  purchasing: 'shopping',
  org_civic_religious: 'civic & religious',
  leisure_sports: 'leisure',
  phone_mail_email: 'phone & mail',
  other_nec: 'other',
};

// Dark-ground palette (the fray). Sleep is moonlight; the day is full-spectrum.
export const DARK = {
  personal_care: '#cfc9f2',
  eating_drinking: '#ff5a70',
  household: '#e2703d',
  care_household: '#62c96f',
  care_nonhousehold: '#2fbfa8',
  work: '#4f8dff',
  education: '#9e77ff',
  purchasing: '#e564d9',
  org_civic_religious: '#b4cf4e',
  leisure_sports: '#ffb648',
  phone_mail_email: '#47c8e8',
  other_nec: '#7f8698',
};

// Light-ground palette (the ledger) — same hue identities, ink-heavier.
export const LIGHT = {
  personal_care: '#8f86d8',
  eating_drinking: '#e23a52',
  household: '#c85a28',
  care_household: '#3d9e4b',
  care_nonhousehold: '#158f7c',
  work: '#2f6fe4',
  education: '#7d55e0',
  purchasing: '#c344b6',
  org_civic_religious: '#8fa32e',
  leisure_sports: '#d99a1e',
  phone_mail_email: '#1ba3c4',
  other_nec: '#6b7280',
};

// Vertical band order for the weave (top → bottom). Sleep sits center so the
// night rope hangs mid-canvas; obligated time above, chosen time below.
export const BAND_ORDER = [
  'education', 'work', 'purchasing', 'household', 'care_household', 'care_nonhousehold',
  'eating_drinking', 'personal_care', 'org_civic_religious', 'leisure_sports',
  'phone_mail_email', 'other_nec',
];

export const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

// Day-of-week / clock helpers — minutes are minutes-from-4 a.m. (0…1439).
export const hourLabel = (h) => (h === 0 ? 'midnight' : h === 12 ? 'noon' : h < 12 ? `${h} a.m.` : `${h - 12} p.m.`);
export const minuteToHour = (m) => Math.floor(((m + 240) % 1440) / 60); // clock hour at minute-from-4am
