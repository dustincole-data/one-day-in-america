# 03 · Build the weighted extract, and prove it is right

Type: task
Status: **resolved 2026-08-09** · claude (opus)
Blocked by: 02

## Resolution

Build + proof: [research/03-extract/findings.md](../../../../research/03-extract/findings.md) ·
every gate cell: [gate-table.md](../../../../research/03-extract/gate-table.md)

**Gate passed: 637 of 639 published BLS Table A-1 cells reproduce exactly** (2019 212/213 · 2023
213/213 · 2024 212/213), for total / men / women, on average hours per day, percent engaged and
hours per participant. The two misses are the women slice of one leaf, 0.09 pp and 22 seconds, both
below the precision BLS prints; they are documented and pinned so a real regression still goes red.

- **Hashes hold.** All nine ZIPs re-fetched and byte-identical to the ticket-02 record. bls.gov's
  403 turns on `Accept-Encoding`, not on User-Agent.
- **Everything BLS asserts is now verified in the bytes.** `TUCASEID` unique on both files; every
  respondent-day sums to exactly 1440 minutes of `TUACTDUR24`; episodes chain contiguously from the
  4 a.m. origin; and per-respondent minutes per activity code match BLS's own pre-summed Activity
  Summary file on all ~8.5 M cells.
- **The published category map is not in any BLS document** and had to be recovered from Table A-1's
  own arithmetic: travel is redistributed into the category it serves, household mail/e-mail move to
  the telephone category, and tier 1 `10` splits at **tier 3** (waiting for and travel to a *civic
  obligation* go to Organizational/civic/religious; the same for a *government service* stays with
  Purchasing). 243 tier-2-level placements were enumerated and none reproduces the table.
- **The weight bias is now measured, not just cited:** half the raw sample is a weekend day; weighted
  it is 2/7. Σ`TUFINLWGT`/*D* gives 263.4 M / 271.3 M / 272.9 M people.
- **Extract:** `data/extract/{episodes,respondents}-<year>.csv`, gitignored, rebuilt by `npm run
  data`. 475,635 episodes, 25,652 respondent-days. Seven decisions **E1–E7** bind tickets 04–07.
- Both harnesses were **proven able to fail** (duration column swapped, a travel code mis-filed) and
  reverted.

## Question

Can we produce a correctly-weighted respondent-day × activity table for 2019 and 2023–24, and prove
it matches BLS?

- Download the required ATUS files for **2019, 2023, 2024** (2021–22 optional, fetch if cheap).
  URLs + byte sizes + SHA-256s are pinned in the ticket-02 record — re-verify the hashes on fetch;
  BLS re-releases files without a per-file revision log. Note bls.gov 403s default user agents.
- Join per the ticket-02 record. Apply the correct final weights.
- **First act, before anything else:** verify the two things BLS only *asserts* — `TUCASEID` is
  unique on the Respondent/Summary files, and each respondent-day's `TUACTDUR24` sums to 1440.
- Decisions S1–S5 and S10 in the ticket-02 record are the build contract (Activity file not Summary
  file · `TUACTDUR24` not `TUACTDUR` · 4 a.m. day origin · `TUFINLWGT` always · `-1/-2/-3` are
  sentinels and `-1` doubles as out-of-universe · `50xxxx` is real uncodeable time, do not drop it).
- Produce the working table: one row per respondent-day per activity episode, with start minute,
  duration, activity code, and the demographic fields the exploration layer will plausibly need
  (age, sex, presence of children, employment status, telework, commute).

**The gate:** reproduce at least two published BLS ATUS headline numbers (e.g. average hours of
sleep per day, average work hours on workdays) to within rounding, for a year BLS published them
for. If they don't match, the pipeline is wrong — fix it before anything else proceeds.
A pipeline that "looks reasonable" is not passed.

Record: row counts, the reproduced numbers vs BLS published values, and where the extract lives.
