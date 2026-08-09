/**
 * The activity-code groupings BLS uses in its published tables.
 *
 * BLS's published categories are *not* raw tier-1 codes. Two conventions restructure them, and both
 * are visible in the arithmetic of Table A-1 (each major line equals the sum of its own sub-lines):
 *
 * 1. **Travel is redistributed.** Tier 1 = `18` (Traveling) does not appear as a category of its
 *    own; each `18xx` tier-2 is folded into the category it is travel *for*, and shows up as that
 *    category's "Travel related to …" sub-line.
 * 2. **A few codes move house.** Household mail/e-mail (`020903`, `020904`) are reported under
 *    "Telephone calls, mail, and e-mail", not under Household activities; tier 1 = `10` splits, with
 *    government services going to "Purchasing goods and services" and civic obligations to
 *    "Organizational, civic, and religious activities".
 *
 * Every placement below is confirmed by `npm run data:verify`, which reproduces Table A-1 to the
 * published two decimals for 2019, 2023 and 2024. Nothing here is inferred from a category name.
 *
 * Source tables: https://www.bls.gov/tus/tables/a1-{2019,2023,2024}.pdf
 */

/** The twelve major categories of BLS Table A-1, in published order. They partition all 1440 minutes. */
export const MAJORS = [
  'personal_care',
  'eating_drinking',
  'household',
  'purchasing',
  'care_household',
  'care_nonhousehold',
  'work',
  'education',
  'org_civic_religious',
  'leisure_sports',
  'phone_mail_email',
  'other_nec',
] as const;
export type Major = (typeof MAJORS)[number];

export const MAJOR_LABEL: Record<Major, string> = {
  personal_care: 'Personal care activities',
  eating_drinking: 'Eating and drinking',
  household: 'Household activities',
  purchasing: 'Purchasing goods and services',
  care_household: 'Caring for and helping household members',
  care_nonhousehold: 'Caring for and helping nonhousehold members',
  work: 'Working and work-related activities',
  education: 'Educational activities',
  org_civic_religious: 'Organizational, civic, and religious activities',
  leisure_sports: 'Leisure and sports',
  phone_mail_email: 'Telephone calls, mail, and e-mail',
  other_nec: 'Other activities, not elsewhere classified',
};

/** tier 1 → major, before the exceptions below. Tier 1 = 10 and 18 are handled at tier 2. */
const BY_TIER1: Record<string, Major> = {
  '01': 'personal_care',
  '02': 'household',
  '03': 'care_household',
  '04': 'care_nonhousehold',
  '05': 'work',
  '06': 'education',
  '07': 'purchasing',
  '08': 'purchasing',
  '09': 'purchasing',
  '11': 'eating_drinking',
  '12': 'leisure_sports',
  '13': 'leisure_sports',
  '14': 'org_civic_religious',
  '15': 'org_civic_religious',
  '16': 'phone_mail_email',
  '50': 'other_nec',
};

/** tier 2 → major. Covers the travel redistribution and the split of tier 1 = 10. */
const BY_TIER2: Record<string, Major> = {
  // Government services and civic obligations, split as Table A-1 splits it.
  '1001': 'purchasing',
  '1002': 'org_civic_religious',
  '1003': 'purchasing',
  '1099': 'purchasing',
  // Travel, folded into the category it serves.
  '1801': 'personal_care',
  '1802': 'household',
  '1803': 'care_household',
  '1804': 'care_nonhousehold',
  '1805': 'work',
  '1806': 'education',
  '1807': 'purchasing',
  '1808': 'purchasing',
  '1809': 'purchasing',
  '1810': 'purchasing',
  '1811': 'eating_drinking',
  '1812': 'leisure_sports',
  '1813': 'leisure_sports',
  '1814': 'org_civic_religious',
  '1815': 'org_civic_religious',
  '1816': 'phone_mail_email',
  // Security procedures while travelling, and travel with no stated purpose: nowhere to fold them.
  '1818': 'other_nec',
  '1899': 'other_nec',
};

/** 6-digit code → major, for the handful of codes that do not follow their tier. */
const BY_CODE: Record<string, Major> = {
  '020903': 'phone_mail_email', // Household and personal mail and messages (except e-mail)
  '020904': 'phone_mail_email', // Household and personal e-mail and messages
  // Tier 1 = 10 splits at tier *3*, not tier 2: waiting for, and travel to, a **civic obligation**
  // follows 1002 into "Organizational, civic, and religious activities", while the same two things
  // for a **government service** follow 1001 into "Purchasing goods and services". Nothing weaker
  // than this split reproduces Table A-1 — every tier-2-level placement was tried and none does.
  '100305': 'org_civic_religious', // waiting associated with civic obligations
  '181002': 'org_civic_religious', // travel related to civic obligations
};

export function majorOf(code: string): Major {
  const exact = BY_CODE[code];
  if (exact) return exact;
  const t2 = BY_TIER2[code.slice(0, 4)];
  if (t2) return t2;
  const t1 = BY_TIER1[code.slice(0, 2)];
  if (t1) return t1;
  throw new Error(`no published category for activity code ${code}`);
}

/**
 * Named sub-lines of Table A-1 used as gate targets. Each is a predicate over the 6-digit code, so
 * a definition can be a tier or an explicit code list, exactly as BLS defines it.
 */
export interface Leaf {
  readonly key: string;
  /** The label as it is printed in Table A-1. */
  readonly label: string;
  readonly match: (code: string) => boolean;
}

const tier1 = (t: string) => (code: string) => code.slice(0, 2) === t;
const tier2 = (...ts: string[]) => (code: string) => ts.includes(code.slice(0, 4));
const codes = (...cs: string[]) => (code: string) => cs.includes(code);

export const LEAVES: readonly Leaf[] = [
  // "Sleeping" carries footnote 1: "Includes naps and spells of sleeplessness" — i.e. all of 0101.
  { key: 'sleeping', label: 'Sleeping', match: tier2('0101') },
  { key: 'grooming', label: 'Grooming', match: tier2('0102') },
  // The printed "Eating and drinking" sub-line is 1101 alone; 1102 (waiting) rolls up only into the
  // major category, which is why the major matches while tier 1 = 11 does not.
  { key: 'eating_drinking_leaf', label: 'Eating and drinking (excl. travel)', match: tier2('1101') },
  { key: 'travel_household', label: 'Travel related to household activities', match: tier2('1802') },
  { key: 'working', label: 'Working', match: tier2('0501') },
  { key: 'travel_work', label: 'Travel related to work', match: tier2('1805') },
  { key: 'socializing_relaxing_leisure', label: 'Socializing, relaxing, and leisure', match: tier1('12') },
  { key: 'socializing_communicating', label: 'Socializing and communicating', match: tier2('1201', '1202') },
  { key: 'relaxing_leisure', label: 'Relaxing and leisure', match: tier2('1203') },
  { key: 'watching_tv', label: 'Watching TV', match: codes('120303', '120304') },
  { key: 'sports_exercise_recreation', label: 'Sports, exercise, and recreation', match: tier1('13') },
];
