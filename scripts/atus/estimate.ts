/**
 * The four ATUS estimators, lifted from User's Guide §7.4 rather than paraphrased.
 *
 *   average hours per day             = Σ(w·T) / Σw
 *   participation rate                = Σ(w·I) / Σw
 *   number of participants            = Σ(w·I) / D
 *   average hours among participants  = Σ(w·I·T) / Σ(w·I)
 *
 * where `w` = `TUFINLWGT`, `T` = the respondent-day's minutes in the activity, `I` = 1 if `T` > 0,
 * and `D` = days in the period. Every estimate is weighted (S3): unweighted ATUS is not noisy, it is
 * biased by design — weekend days are sampled at 2.5× the weekday rate.
 */

export interface Estimate {
  /** Σ(w·T)/Σw, in hours. */
  readonly hoursPerDay: number;
  /** Σ(w·I)/Σw, as a percent. */
  readonly percentEngaged: number;
  /** Σ(w·I·T)/Σ(w·I), in hours. `null` when nobody in the sample engaged. */
  readonly hoursPerParticipant: number | null;
  /** Σ(w·I)/D, in people. */
  readonly participants: number;
  /** Unweighted count of respondent-days with T > 0 — the sample behind the estimate. */
  readonly sampleEngaged: number;
}

/**
 * @param minutes  minutes in the activity, one entry per respondent-day
 * @param weights  `TUFINLWGT`, aligned with `minutes`
 * @param days     `D`, days in the period (365, or 366 in a leap year)
 */
export function estimate(minutes: ArrayLike<number>, weights: ArrayLike<number>, days: number): Estimate {
  let sumW = 0;
  let sumWT = 0;
  let sumWI = 0;
  let sumWIT = 0;
  let sampleEngaged = 0;
  for (let i = 0; i < minutes.length; i++) {
    const w = weights[i];
    const t = minutes[i];
    sumW += w;
    sumWT += w * t;
    if (t > 0) {
      sumWI += w;
      sumWIT += w * t;
      sampleEngaged++;
    }
  }
  return {
    hoursPerDay: sumWT / sumW / 60,
    percentEngaged: (sumWI / sumW) * 100,
    hoursPerParticipant: sumWI > 0 ? sumWIT / sumWI / 60 : null,
    participants: sumWI / days,
    sampleEngaged,
  };
}
