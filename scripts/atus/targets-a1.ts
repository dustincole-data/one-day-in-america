/**
 * BLS Table A-1 as published — the gate this pipeline has to clear.
 *
 * "Time spent in detailed primary activities and percent of the civilian population engaging in each
 * activity, averages per day by sex, <year> annual averages":
 *   https://www.bls.gov/tus/tables/a1-2019.pdf
 *   https://www.bls.gov/tus/tables/a1-2023.pdf
 *   https://www.bls.gov/tus/tables/a1-2024.pdf
 * (There is no 2020 table — BLS states annual 2020 estimates are not possible. S6.)
 *
 * Each row is transcribed exactly as printed:
 *   label | avg hours per day (total men women) | percent engaged | avg hours per participant
 * `-` is BLS's own "estimate is approximately zero" / "not applicable" and is skipped, not guessed.
 *
 * Two labels appear twice in the printed table — "Eating and drinking" is both a major category and
 * its own non-travel sub-line. The sub-line is renamed here to keep the keys unique.
 */

import type { Year } from './manifest.ts';

export type SexKey = 'total' | 'men' | 'women';

export interface A1Row {
  readonly label: string;
  readonly hours: Record<SexKey, number | null>;
  readonly percent: Record<SexKey, number | null>;
  readonly participantHours: Record<SexKey, number | null>;
}

function parse(block: string): readonly A1Row[] {
  return block
    .trim()
    .split('\n')
    .map((line) => {
      const [label, h, p, ph] = line.split('|').map((s) => s.trim());
      const triple = (s: string): Record<SexKey, number | null> => {
        const [total, men, women] = s.split(/\s+/).map((v) => (v === '-' ? null : Number(v)));
        return { total, men, women };
      };
      return { label, hours: triple(h), percent: triple(p), participantHours: triple(ph) };
    });
}

const T2019 = `
Total, all activities                           | 24.00 24.00 24.00 | 100.0 100.0 100.0 | - - -
Personal care activities                        |  9.62  9.41  9.83 | 100.0 100.0 100.0 | 9.62 9.41 9.83
Sleeping                                        |  8.84  8.76  8.91 | 100.0 100.0  99.9 | 8.84 8.76 8.92
Grooming                                        |  0.68  0.56  0.79 |  80.7  77.9  83.3 | 0.85 0.72 0.95
Eating and drinking                             |  1.18  1.19  1.17 |  95.8  96.2  95.5 | 1.23 1.24 1.23
Eating and drinking (excl. travel)              |  1.06  1.07  1.05 |  95.8  96.1  95.4 | 1.11 1.11 1.10
Household activities                            |  1.78  1.39  2.16 |  78.3  71.4  84.9 | 2.28 1.94 2.54
Travel related to household activities          |  0.05  0.04  0.06 |   8.7   7.8   9.6 | 0.55 0.52 0.58
Purchasing goods and services                   |  0.75  0.61  0.87 |  43.5  38.0  48.6 | 1.71 1.60 1.80
Caring for and helping household members        |  0.49  0.32  0.65 |  23.7  19.9  27.3 | 2.06 1.60 2.37
Caring for and helping nonhousehold members     |  0.19  0.16  0.21 |  10.5   8.7  12.3 | 1.78 1.83 1.74
Working and work-related activities             |  3.61  4.36  2.91 |  44.6  50.8  38.7 | 8.11 8.58 7.53
Working                                         |  3.26  3.92  2.64 |  43.0  49.3  37.0 | 7.60 7.96 7.15
Travel related to work                          |  0.28  0.35  0.21 |  35.5  41.1  30.4 | 0.78 0.86 0.69
Educational activities                          |  0.46  0.43  0.49 |   8.0   7.2   8.8 | 5.73 5.95 5.56
Organizational, civic, and religious activities |  0.30  0.25  0.35 |  13.4  10.4  16.3 | 2.24 2.38 2.15
Leisure and sports                              |  5.19  5.53  4.86 |  95.2  95.6  94.9 | 5.45 5.79 5.12
Socializing, relaxing, and leisure              |  4.64  4.89  4.40 |  94.1  94.5  93.8 | 4.93 5.17 4.69
Socializing and communicating                   |  0.64  0.62  0.66 |  34.8  32.5  37.0 | 1.83 1.90 1.78
Relaxing and leisure                            |  3.92  4.20  3.66 |  90.3  90.7  89.8 | 4.34 4.63 4.07
Watching TV                                     |  2.81  3.00  2.64 |  77.9  78.7  77.2 | 3.61 3.81 3.42
Sports, exercise, and recreation                |  0.34  0.42  0.25 |  20.1  21.4  18.8 | 1.67 1.98 1.33
Telephone calls, mail, and e-mail               |  0.16  0.12  0.19 |  20.7  16.1  25.0 | 0.76 0.77 0.75
Other activities, not elsewhere classified      |  0.28  0.23  0.31 |  20.4  17.3  23.3 | 1.35 1.35 1.34
`;

const T2023 = `
Total, all activities                           | 24.00 24.00 24.00 | 100.0 100.0 100.0 | - - -
Personal care activities                        |  9.84  9.59 10.07 |  99.9 100.0  99.9 | 9.85 9.59 10.09
Sleeping                                        |  9.07  8.97  9.17 |  99.9  99.9  99.8 | 9.08 8.97 9.19
Grooming                                        |  0.68  0.55  0.79 |  77.6  74.3  80.7 | 0.87 0.75 0.98
Eating and drinking                             |  1.20  1.22  1.18 |  95.6  95.8  95.4 | 1.25 1.27 1.24
Eating and drinking (excl. travel)              |  1.10  1.12  1.09 |  95.6  95.8  95.4 | 1.15 1.17 1.14
Household activities                            |  1.92  1.49  2.32 |  78.6  70.7  86.2 | 2.44 2.11 2.69
Travel related to household activities          |  0.03  0.03  0.04 |   6.7   6.1   7.3 | 0.50 0.53 0.48
Purchasing goods and services                   |  0.66  0.55  0.76 |  39.7  36.4  42.8 | 1.66 1.50 1.79
Caring for and helping household members        |  0.50  0.38  0.62 |  22.0  18.2  25.6 | 2.29 2.09 2.42
Caring for and helping nonhousehold members     |  0.17  0.15  0.19 |   8.5   7.4   9.6 | 2.02 2.04 2.00
Working and work-related activities             |  3.56  4.17  2.98 |  43.9  49.2  38.8 | 8.13 8.48 7.69
Working                                         |  3.26  3.82  2.73 |  42.1  47.6  36.8 | 7.74 8.01 7.41
Travel related to work                          |  0.24  0.30  0.18 |  30.7  35.1  26.6 | 0.78 0.86 0.69
Educational activities                          |  0.39  0.36  0.42 |   7.0   6.5   7.4 | 5.62 5.50 5.73
Organizational, civic, and religious activities |  0.24  0.20  0.28 |  11.4   9.3  13.4 | 2.12 2.18 2.08
Leisure and sports                              |  5.15  5.56  4.76 |  94.1  95.5  92.7 | 5.48 5.83 5.13
Socializing, relaxing, and leisure              |  4.63  4.97  4.31 |  92.6  93.9  91.4 | 5.00 5.29 4.71
Socializing and communicating                   |  0.57  0.55  0.60 |  29.2  28.0  30.5 | 1.96 1.96 1.96
Relaxing and leisure                            |  4.00  4.36  3.65 |  88.7  90.3  87.1 | 4.51 4.84 4.19
Watching TV                                     |  2.67  2.87  2.47 |  73.7  74.8  72.7 | 3.62 3.83 3.41
Sports, exercise, and recreation                |  0.34  0.42  0.28 |  21.9  23.4  20.5 | 1.57 1.78 1.34
Telephone calls, mail, and e-mail               |  0.16  0.13  0.20 |  18.2  14.6  21.6 | 0.90 0.88 0.90
Other activities, not elsewhere classified      |  0.21  0.19  0.22 |  14.8  13.5  16.1 | 1.39 1.43 1.36
`;

const T2024 = `
Total, all activities                           | 24.00 24.00 24.00 | 100.0 100.0 100.0 | - - -
Personal care activities                        |  9.80  9.58 10.00 | 100.0  99.9 100.0 | 9.80 9.59 10.00
Sleeping                                        |  9.04  8.96  9.11 |  99.9  99.9 100.0 | 9.04 8.97 9.11
Grooming                                        |  0.69  0.56  0.82 |  78.8  74.2  83.2 | 0.88 0.75 0.99
Eating and drinking                             |  1.24  1.26  1.21 |  95.9  95.8  96.0 | 1.29 1.32 1.26
Eating and drinking (excl. travel)              |  1.13  1.15  1.11 |  95.9  95.8  96.0 | 1.18 1.20 1.16
Household activities                            |  2.01  1.67  2.34 |  80.4  73.9  86.6 | 2.50 2.26 2.71
Travel related to household activities          |  0.05  0.04  0.05 |   7.3   7.2   7.3 | 0.63 0.61 0.65
Purchasing goods and services                   |  0.67  0.59  0.75 |  39.9  38.6  41.2 | 1.69 1.54 1.83
Caring for and helping household members        |  0.51  0.38  0.63 |  21.7  18.6  24.6 | 2.35 2.05 2.57
Caring for and helping nonhousehold members     |  0.17  0.14  0.19 |   8.5   6.4  10.5 | 1.97 2.18 1.85
Working and work-related activities             |  3.43  3.92  2.95 |  42.6  47.1  38.2 | 8.04 8.32 7.73
Working                                         |  3.13  3.56  2.73 |  41.2  45.4  37.3 | 7.60 7.85 7.31
Travel related to work                          |  0.25  0.30  0.19 |  30.0  34.8  25.3 | 0.82 0.88 0.75
Educational activities                          |  0.42  0.41  0.43 |   8.3   8.0   8.5 | 5.10 5.13 5.06
Organizational, civic, and religious activities |  0.30  0.25  0.36 |  12.7  10.4  14.9 | 2.40 2.43 2.38
Leisure and sports                              |  5.07  5.48  4.67 |  94.1  94.2  93.9 | 5.39 5.82 4.97
Socializing, relaxing, and leisure              |  4.56  4.88  4.25 |  93.0  93.1  92.9 | 4.90 5.25 4.58
Socializing and communicating                   |  0.59  0.56  0.61 |  29.9  28.6  31.2 | 1.96 1.96 1.96
Relaxing and leisure                            |  3.92  4.27  3.58 |  88.7  89.6  87.7 | 4.42 4.77 4.08
Watching TV                                     |  2.60  2.82  2.39 |  72.8  74.2  71.4 | 3.57 3.80 3.34
Sports, exercise, and recreation                |  0.34  0.41  0.27 |  22.1  24.3  20.1 | 1.53 1.69 1.35
Telephone calls, mail, and e-mail               |  0.18  0.13  0.22 |  17.7  15.0  20.3 | 1.01 0.89 1.09
Other activities, not elsewhere classified      |  0.21  0.18  0.23 |  15.5  13.8  17.1 | 1.34 1.34 1.34
`;

export const A1: Record<Year, readonly A1Row[]> = {
  2019: parse(T2019),
  2023: parse(T2023),
  2024: parse(T2024),
};
