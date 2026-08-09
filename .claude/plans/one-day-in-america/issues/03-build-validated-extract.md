# 03 · Build the weighted extract, and prove it is right

Type: task
Status: open
Blocked by: 02

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
