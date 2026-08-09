# ATUS — provenance record

Ticket 02 · `rigor-source` pass · interrogated 2026-08-08 · claude (opus)

Corpus interrogated = **the publisher's prose** (User's Guide, data dictionaries, lexicon-change
document, inter-vintage changes document, pooling guidance, shutdown/pandemic notices, copyright
page). No profiling, no cleaning, no story decisions. Where a document does not answer a question,
it says so under **Unanswerable**.

The Atelier Rigor engine (`rigor` CLI, `C:\Users\dusti\Projects\Atelier`) was **not** used — this
project is not scaffolded as an Atelier project and the map does not ask for one. The skill's
`rigor decide` step is served instead by **Decisions that bind later stages** at the bottom of this
file: same content, same citation discipline, on disk in the project the map governs.

---

## Source

| | |
|---|---|
| Publisher | U.S. Bureau of Labor Statistics (BLS), sponsor; U.S. Census Bureau, collector |
| Landing page | https://www.bls.gov/tus/data.htm → per-year pages `…/tus/data/datafiles-<year>.htm` |
| Retrieved | 2026-08-08, `curl` with browser headers (bls.gov returns 403 to default agents) |
| Revision policy | **Yes, BLS re-releases files.** Documented case: the 2020 Case History file, "originally released on July 22, 2021, was re-released on November 30, 2021 with corrected data for the variable TUINCENT" (2020 data-files page). No correction notice appears on the 2019/2023/2024/2025 pages, but the 2019 page's Last-Modified is 2021-11-30 — after its 2020 release, reason unstated. **Pin the hash; do not assume a later re-fetch is the same bytes.** |
| Encoding | Verified by strict decode, not guessed: all twelve `.dat` files decode as **7-bit ASCII** (therefore also valid UTF-8 and Latin-1). No BOM. Line endings CRLF, except the final line of `atussum_2023/2024/2025.dat`, which ends `\n` only. |
| Other copy on disk | **None.** `find` over `C:\Users\dusti\Projects` and `C:\Users\dusti\brain` returns no ATUS file (all `*atus*` hits are the substring in "status"/"apparatus"). No `audit_copy` to reconcile. |

### Documents read

| Document | URL |
|---|---|
| ATUS User's Guide (June 2026) | https://www.bls.gov/tus/atususersguide.pdf |
| 2025 Interview Data Dictionary | https://www.bls.gov/tus/dictionaries/atusintcodebk25.pdf |
| 2024 Interview Data Dictionary | https://www.bls.gov/tus/dictionaries/atusintcodebk24.pdf |
| 2019 Interview Data Dictionary | https://www.bls.gov/tus/dictionaries/atusintcodebk19.pdf |
| Changes Between 2003–2025 Data Files | https://www.bls.gov/tus/other-documentation/changes.pdf |
| Differences between the 2003–2025 lexicons | https://www.bls.gov/tus/lexicons/lexiconchanges.pdf |
| Combining multiple years of ATUS data | https://www.bls.gov/tus/other-documentation/pooling.htm |
| Federal Government Shutdown: 2025 ATUS | https://www.bls.gov/tus/notices/2026/october2025shutdown.htm |
| Linking and Copyright Information | https://www.bls.gov/bls/linksite.htm |
| CPS — How the Government Measures Unemployment | https://www.bls.gov/cps/cps_htgm.htm |

**Two documentation links are dead.** The 2020 data-files page links `…/tus/notices/covid19.htm`
and `…/tus/notices/covid19tech.htm`; both now redirect to the ATUS home page. Their content
survives as **User's Guide §9.2.1 / §9.2.2**, which is what this record cites instead.

### Files acquired (bytes and SHA-256 as received, before any decode)

| File | URL (prefix `https://www.bls.gov/tus/datafiles/`) | Bytes | SHA-256 |
|---|---|---:|---|
| atusresp-2019.zip | `atusresp-2019.zip` | 743,357 | `821d2cf92596cc632bce8269425d0277f8a1010b357660da7c03b5c5341c4724` |
| atusact-2019.zip | `atusact-2019.zip` | 3,237,508 | `2d0d90b3ade5e1a1b5ab69ea37135fb0faabb5cfb6c8dc53a1795dfc21fc3682` |
| atussum-2019.zip | `atussum-2019.zip` | 635,134 | `4c5fd39c706a180e82b4a7fa28c8c3739c4bfd6704fd4759f507bd1de6a01627` |
| atusresp-2023.zip | `atusresp-2023.zip` | 655,043 | `5b24084ffd4c618c14e096429f99f0efa87e1393d7902c6007f96dd8725ba90c` |
| atusact-2023.zip | `atusact-2023.zip` | 2,655,513 | `c7f497f8ac91254b9ddf771f8de475dded5bc7ea39806a019e8cdee920989b33` |
| atussum-2023.zip | `atussum-2023.zip` | 551,957 | `681efef6c96c5d6758c19412c915b70556fdfd07a0fa7abc2f37d8e420ebca1e` |
| atusresp-2024.zip | `atusresp-2024.zip` | 517,204 | `0e9a9b0061ab0aafa763c23d3a64f7487ae17d0a4594e6445c0f79b8ce74e085` |
| atusact-2024.zip | `atusact-2024.zip` | 2,241,574 | `b9d4a06482f6ac3a248fee87740537df13b9129ceb799f0d098fb27886153d2a` |
| atussum-2024.zip | `atussum-2024.zip` | 463,411 | `25e070308c103946b7e1f7368526ca494373e35034f75cbdfa8c21c82cafd4e2` |
| atusresp-2025.zip | `atusresp-2025.zip` | 429,058 | `77566d2864f1b96412a46ceeee9ea53709bc191b092f3573af04c17b2d409873` |
| atusact-2025.zip | `atusact-2025.zip` | 1,882,541 | `664314e9f0c7373534f10bb1450a1dfc2b50d04c7932ecfea090ff4a1c65bca3` |
| atussum-2025.zip | `atussum-2025.zip` | 383,733 | `a45c4edf1b7e0cd5ecf622bc5a57e4fe6fe27281add92b26c29605cfac193359` |

Each ZIP contains one `.dat` (CSV despite the extension, with a header row), a SAS/SPSS/Stata
reader, and an `_info.txt` stating the publisher's own variable and observation counts.

Files acquired to the session scratchpad only, for hashing and counting. **Not committed** — ticket
03 re-fetches from these URLs and verifies against these hashes.

---

## The five files, and which ones this project needs

Seven interview-side files exist per year (Respondent, Roster, Activity, Who, Eldercare Roster,
Activity Summary, ATUS-CPS) plus three operational ones (Case History, Call History, Replicate
Weights). What the project needs:

| File | Needed? | Why |
|---|---|---|
| **Activity** (`atusact`) | **Yes — the spine** | The only file with minute-level structure: `TUSTARTTIM`, `TUSTOPTIME`, `TUACTDUR24`, `TRCODE`, `TEWHERE`. 30 columns, **identical set 2019 ↔ 2024**. |
| **Respondent** (`atusresp`) | **Yes** | Carries the weight (`TUFINLWGT`), the diary date and day-of-week (`TUDIARYDATE`, `TUDIARYDAY`), the holiday flag (`TRHOLIDAY`), and every demographic the exploration layer might filter on. One row per respondent. |
| **Activity Summary** (`atussum`) | Optional, **with a trap** | Pre-summed minutes per 6-digit code, one row per respondent, plus a few CPS demographics. Convenient, but its column set is year-specific — see the trap below. It cannot answer "when in the day", only "how much in the day". |
| Roster, Who, Eldercare Roster, ATUS-CPS | Not for the spine | Who-was-present (`atuswho`) becomes relevant only if the spine turns on companionship. ATUS-CPS is the only route to richer geography or household detail. |
| Case/Call History, Replicate Weights | No | Replicate weights are needed only to compute standard errors — see the note under **Denominators**. |

### Join keys

Publisher-stated (User's Guide §7.3):

- Respondent ↔ Activity: `TUCASEID`
- Activity ↔ Who: `TUCASEID` + `TUACTIVITY_N`
- Respondent ↔ Activity Summary: `TUCASEID`
- Roster / Eldercare Roster: `TUCASEID` + `TULINENO`
- ATUS-CPS: `TUCASEID` + `TULINENO`

`TULINENO` is always 1 on the Respondent file (one respondent per household).

### Row counts, per year, verified against the publisher's own stated counts

Counted as (physical lines − 1 header); every count matches the `_info.txt` figure BLS ships.

| Year | Activity rows | Respondent rows | Summary rows | Summary columns | Response rate |
|---|---:|---:|---:|---:|---:|
| 2019 | 182,980 | 9,435 | 9,435 | 410 | 42.0% |
| 2023 | 153,120 | 8,548 | 8,548 | 398 | 36.9% |
| 2024 | 139,535 | 7,669 | 7,669 | 396 | 32.4% |
| 2025 | 114,151 | 6,146 | 6,146 | 377 | 25.7% |

Respondent-file columns: 174 (2019), 175 (2023/2024/2025). Activity-file columns: 30, every year.
Response rates from User's Guide table 3.3 — and they are **falling hard**: 42.0% (2019) → 32.4%
(2024) → 25.7% (2025). Weights adjust for differential nonresponse across the demographics and
day-types BLS models (§7.1); they cannot adjust for nonresponse correlated with something BLS does
not model.

---

## Semantics — the columns the spine will actually use

| Column | File | Means | Units | Counts what | Measured when | Sentinels |
|---|---|---|---|---|---|---|
| `TUCASEID` | all | 14-digit case id | id | one respondent-day | — | none; no documented valid-value list |
| `TUACTIVITY_N` | Activity, Who | activity sequence number within the diary day | ordinal | one reported activity | diary day | — |
| `TUSTARTTIM` | Activity | activity start time | `HH:MM:SS` clock time | — | diary day, **4:00 a.m. origin** | — |
| `TUSTOPTIME` | Activity | activity stop time | `HH:MM:SS` clock time | — | diary day | — |
| `TUACTDUR24` | Activity | duration, **last activity truncated at 4:00 a.m.** | minutes, 1–1440 | one activity episode | diary day | — |
| `TUACTDUR` | Activity | duration, last activity **not** truncated | minutes, 1–9999 | one activity episode | diary day | — |
| `TUCUMDUR24` | Activity | cumulative duration, truncated | minutes, 1–1440 | — | diary day | — |
| `TRCODE` | Activity | 6-digit activity code (added 2007) | code | — | — | `50xxxx` = data codes (uncodeable / missing) |
| `TUTIER1/2/3CODE` | Activity | the same code split into its three tiers | code | — | — | as above |
| `TEWHERE` | Activity | edited "where were you during the activity?" | code | — | diary day | `-1` = **out of universe** (not collected for sleeping, grooming, etc.) |
| `TUFINLWGT` | Respondent, Summary | ATUS final weight | **person-days** | people × days | — | — |
| `TUDIARYDATE` | Respondent | date of the diary day | `YYYYMMDD` | — | the day **before** the interview | — |
| `TUDIARYDAY` | Respondent | day of week of the diary day | code 1–7 | — | — | — |
| `TUYEAR`, `TUMONTH` | Respondent | year / month of the **diary day** | — | — | — | — |
| `TRHOLIDAY` | Respondent | diary day was a holiday | flag | — | — | — |
| `TEAGE` | Respondent, Roster, Summary | edited age | years | one person | — | valid 0–85 **except 81–84** (topcoded/collapsed) |
| `t######` | Summary | total minutes on that 6-digit code | minutes | one respondent-day | diary day | column **absent** = zero minutes that year, not missing |

Naming convention (2025 dictionary, "ATUS Naming Conventions"): first char `T` = collected in the
ATUS interview; `P`/`G`/`H` = carried from the final CPS interview 2–5 months earlier. Second char:
`U` unedited · `E` edited (has an allocation flag `TX…`) · `R` recode · `X` allocation flag ·
`T` topcode flag. Lower-case `t######` on the Summary file follows none of this.

---

## Row semantics

- **One row on the Activity file is one activity episode within one respondent's diary day.** One
  respondent's day is a contiguous chain of episodes covering 4:00 a.m. → 4:00 a.m., which is why
  `TUCUMDUR24` tops out at exactly 1440.
- **One row on the Respondent and Activity Summary files is one respondent-day.** ATUS interviews
  each respondent **once**; there is no panel, no repeated measure, no same-person before/after.
- Are all rows the same kind of thing? On the Activity file, yes — no subtotal rows, no aggregate
  rows. The one non-event class is the `50xxxx` "data codes" family (uncodeable / can't remember /
  refused), which occupies real minutes in the day and must be an explicit visual category or an
  explicit exclusion, never silently dropped: dropping it makes the day not add to 1440.
- **Primary key.** Activity file: `TUCASEID` + `TUACTIVITY_N`. Respondent / Summary: `TUCASEID`
  alone. Uniqueness on the Respondent file is publisher-asserted ("There is one record for each ATUS
  respondent"; Summary `_info.txt`: "Each record corresponds to a unique respondent, as indicated by
  a unique value of the variable TUCASEID") — **asserted, not yet verified in the bytes**; ticket 03
  verifies.
- **Two files that are one measurement?** Yes, and it is a genuine double-count risk: the Activity
  Summary file is the Activity file pre-aggregated. Use one or the other per measure; never union
  them.

---

## The traps, ranked by what they would cost

### 1 · The Activity Summary column set is year-specific — silent, and it is a real diff

Only 6-digit codes with some nonzero reported time in that year get a column. Measured directly
from the four headers:

- 2019: 410 columns · 2023: 398 · 2024: 396 · 2025: 377
- **33** `t######` columns present in 2019 and absent in 2024 (`t010499`, `t050103`, `t120502`,
  `t130214`, `t149999`, …)
- **19** present in 2024 and absent in 2019 (`t040203`, `t080102`, `t130135`, `t509999`, …)
- Union across 2019/2023/2024 = **437**; intersection = **361**

A naive year-over-year concat leaves 76 columns NaN on one side or the other. Those NaNs mean
**zero minutes**, not missing data — filling them as missing biases every category total, and
dropping the non-intersecting columns discards real minutes and breaks the 1440 sum.

**Mitigation:** compute from the **Activity file** (`TRCODE` + `TUACTDUR24`), whose 30-column schema
is byte-identical across 2019–2025, and which the spine needs anyway for start/stop times. If the
Summary file is used for anything, reindex to the union of columns and fill absent with 0.

### 2 · The ATUS day runs 4:00 a.m. → 4:00 a.m., not midnight → midnight

User's Guide §4 ("starting at 4 a.m. the previous day and ending at 4 a.m. on the interview day")
and §10 ("between 4 a.m. on the diary day and 4 a.m. on the interview day"). The dictionary's own
worked example shows a day opening at `04:00:00` and closing at `04:00:00`.

For a piece whose whole form is a 24-hour axis this is the single most load-bearing fact in this
record. A minute-of-day axis rendered 00:00→24:00 is **not** what the file contains; the file's
native axis is 04:00→04:00, and the last episode is truncated at 4 a.m. by construction
(`TUACTDUR24`). Rendering midnight-origin is allowed — you rotate the axis — but the truncation
lives at 4 a.m. either way, so 4 a.m. is the one minute of the day where the data has a seam. Put
the seam where it does least damage; do not pretend it is not there.

### 3 · The clock is the respondent's local wall clock, and no document says otherwise

**Not answered by any document.** Neither the User's Guide nor any dictionary mentions time zones,
daylight saving, or harmonization. What the file contains is the time the respondent reported for
their own day. There is no zone column and no UTC anywhere in the schema.

Cost, stated precisely: the data support **"at 7 p.m. local time, X% of Americans were doing Y."**
They do **not** support **"at 7 p.m. Eastern, X million Americans were simultaneously doing Y."**
Nothing in the file lets you reconstruct simultaneity across zones. Any headline built on the second
reading is unsupported by the source, and it is exactly the phrasing a "one day in America" piece
drifts toward. This binds ticket 07.

Same silence covers DST: a diary day spanning a spring-forward or fall-back transition is 23 or 25
real hours, and `TUACTDUR24` caps at 1440 regardless. No document addresses it. Two days a year.

### 4 · Column redefinition under a stable name — present, real, and zero schema diff

Variable-name diff 2019 → 2024 is almost clean (Respondent gains exactly one column, `TRLVMODR`;
Activity gains none). The redefinitions hide underneath, all from `changes.pdf` §8:

| Column | Redefinition | Effect on a 2019 ↔ 2023/24/25 comparison |
|---|---|---|
| `TEIO1ICD`, `TRDTIND1` (industry) | 2012 → **2017** Census Industry Classification in Jan 2020; 2017 → **2022** in Jan 2025 | Industry is **not** comparable across the 2019/2020 boundary, nor across 2024/2025 |
| `TEIO1OCD`, `TRDTOCC1` (occupation) | 2010 → **2018** Census Occupation Classification in Jan 2020 | Occupation is **not** comparable across the 2019/2020 boundary |
| `TRERNWA` (weekly earnings) | Topcode rules changed June 2024; max valid raised 288,461 → 9,999,999 | Earnings distributions not comparable 2023 ↔ 2024 |
| `PEPARENT` (CPS side) | Removed Jan 2020, replaced by `PEPAR1`/`PEPAR2`/`PEPAR1TYP`/`PEPAR2TYP` | A CPS-side parent linkage breaks across the boundary |

None of these touch the diary spine. All of them touch plausible **exploration-layer filters**. If
the filter set stays on ATUS-side variables (`TRCHILDNUM`, `TRHHCHILD`, `TRYHHCHILD`, `TELFS`,
`TEAGE`, `TESEX`, `TRSPPRES`, `TEHRUSLT`, `TRDPFTPT`, `GTMETSTA`), nothing here bites. A "parents"
filter should use `TRCHILDNUM` / `TRHHCHILD` from the Respondent file, not the CPS parent variables.

---

## Weights

**Which weight.** `TUFINLWGT`, on the Respondent and Activity Summary files. It is the only weight
variable present on the single-year 2019/2023/2024/2025 Respondent files — verified against all four
Stata readers. `TU20FWGT` is on the 2020 files (and the 2019–2020 pandemic replicate-weights file);
`TU06FWGT` is on 2003–2005; `TUFNWGTP` is the multi-year-file weight. None of those are on the files
this project uses.

**What it weights to.** *Person-days.* User's Guide §7.1: "The ATUS final weights indicate the number
of person-days the respondent represents… in 2005 and later, summing the weights of all respondents
for a given quarter yields the number of person-days in that quarter (the total population times the
number of days in the quarter)."

**What happens without it.** Not noise — **known, signed, structural bias**, from three sources
(§7.1):

1. **Day-of-week is deliberately unbalanced by design.** ~25% of the sample is assigned to *each*
   weekend day and ~10% to *each* weekday. Weekend days are therefore oversampled 2.5×. Unweighted
   tabulations "overestimate time spent in activities more often done on weekends and underestimate
   time spent in activities more often done on weekdays." For a project about how a day is shaped,
   this is the bias that would wreck it: the unweighted day looks measurably more like Saturday than
   the real average day.
2. **Demographic strata are deliberately unbalanced.** Hispanic and non-Hispanic Black householders
   and households with children are oversampled; households without children undersampled.
3. **Response rates differ across groups and day types** — e.g. men respond less, so male weights
   run larger.

Weighted, weekdays land at ≈5/7 and weekend days at ≈2/7 of the data (§7.2).

**Pooling.** Publisher-stated table (pooling page and §7.2): 2003–2005 → `TU06FWGT`; **2006–2019 →
`TUFINLWGT`**; 2020 → `TU20FWGT`; **2021 and later → `TUFINLWGT`**. And explicitly: "There were no
changes in the method used to generate statistical weights (the variable TUFINLWGT) on the ATUS data
files from 2006 to 2019 and from 2021 to present."

Consequences for this project:

- **2019 vs 2023 vs 2024 vs 2025 side by side, each on `TUFINLWGT`: valid, same weighting method, no
  adjustment.** The map's separable-years design is the *easy* case and the documents support it
  directly.
- **Pooling 2023 + 2024 into one "after" frame: also valid on `TUFINLWGT`**, with one thing said out
  loud — because the weights are person-days, concatenating gives 2024 slightly more influence than
  2023 (366 days vs 365). That is arithmetically correct for "an average day across 2023–24"; it is
  simply not an equal-years average, and the copy should not imply it is.
- Any **participant-count** estimate (§7.4) divides by *D*, the number of days in the period: 365 for
  2019 and 2023, **366 for 2024** (leap), 731 for a pooled 2023+2024, and — see below — **not** 365
  for 2025.
- The BLS multi-year file (2003–2025, `TUFNWGTP`, harmonized codes) exists and is the right tool for
  full-span pooling. The map ruled full-span out of scope; nothing here reopens that.

**The four estimation formulas** are §7.4 and should be lifted verbatim into ticket 03, not
paraphrased: average hours/day = Σ(w·T)/Σw · participation rate = Σ(w·I)/Σw · number of participants
= Σ(w·I)/D · average hours among participants = Σ(w·I·T)/Σ(w·I).

---

## The universe, and what "America" excludes

**ATUS universe** (§3.1): all residents of U.S. households **aged 15 and over**, excluding
**active-duty military** and people **living in institutions** (nursing homes, prisons). Sample
frame is the CPS, so the ATUS universe is the CPS universe: the civilian noninstitutional population
in occupied households. CPS covers "each state and the District of Columbia" (`cps_htgm.htm`) —
50 states + DC.

**A respondent-day** = one randomly selected eligible person (15+, civilian) in a sampled household,
reporting on the day **before** their interview. One interview per person. Households enter the ATUS
frame two months after finishing their eighth and final CPS interview.

**Day-of-week is assigned, not chosen** (§3.5): 10% of the sample to each weekday, 25% to each
weekend day; the person is then called on that assigned day for up to 8 consecutive weeks until one
interview completes. This is *why* the weight is not optional (above).

So the honest denominator for "America" is: **the U.S. civilian noninstitutional population aged 15
and over living in households in the 50 states and DC.** Excluded: everyone under 15, active-duty
military, the institutionalized, and territories. A wordless piece is not obliged to print that
sentence — but the headline claim must not assert more than it.

---

## Disclosure regime

Respondent-level public-use microdata, not a tabular product, so the classic suppression apparatus
does not apply here:

- **No cell suppression, primary or secondary.** The `total − disclosed` reconstruction question is
  moot: there is nothing suppressed to reconstruct.
- **Topcoding: earnings only.** Exactly three topcode-flag variables exist on the interview files
  (`TTHR` hourly pay, `TTOT` overtime, `TTWK` weekly earnings) and the dictionary states they "all
  relate to earnings."
- **Age is collapsed at the top:** `TEAGE` valid 0–85 "except 81 through 84."
- **Confidentiality by variable omission:** "When there is an edited variable, the corresponding
  unedited variable is usually omitted from the files… to protect the confidentiality of ATUS
  respondents as required by law."
- **No noise injection documented anywhere.**
- **Imputation is disclosed per-variable** via allocation flags (`TX…`, values 30–41 documenting
  blank→allocated, don't-know→allocated, etc.). Any variable the piece leans on can be audited for
  how much of it was allocated rather than reported.

**Documented sentinels** (2025 dictionary, "Valid Values"), applying across most variables and *not*
repeated per variable:

| Value | Meaning |
|---|---|
| `-1` | Blank — also used for **out of universe** (e.g. `TEWHERE` and `TUWHO_CODE` on activities where "where"/"who" is not collected: sleeping, grooming) |
| `-2` | Don't know |
| `-3` | Refused |

`-1` doing double duty as both "blank" and "out of universe" is worth flagging: a location
histogram that treats `-1` as missing will silently drop sleep, which is the single largest block of
the day.

---

## Geography and identifiers

- **The only geography on the Respondent or Activity Summary file is `GTMETSTA`** — metropolitan /
  nonmetropolitan status. The Respondent file carries **no** `G`-prefixed variable at all (verified:
  zero matches across its 175 variables).
- No state, no county, no CBSA, no tract on the files the spine uses. Richer geography requires
  joining the **ATUS-CPS** file, which is a separate acquisition and a separate provenance question.
- **Vintage of the metro delineation is not stated** in the ATUS documents — see Unanswerable.
- **Excluded units:** territories (outside the CPS frame), institutional group quarters,
  active-duty military.
- No reference/crosswalk file is needed for the spine, because the spine carries no geography.

---

## Denominators

| Rate the story may want | Numerator universe | Denominator universe | Same? | Bias direction |
|---|---|---|---|---|
| % of Americans doing activity *j* at minute *m* | respondent-days with an episode of *j* covering *m*, weighted | all respondent-days, weighted (Σ`TUFINLWGT`) | **Yes** | none — both sides are the same person-day universe |
| average hours/day on *j* | Σ(w·minutes on *j*) | Σw | **Yes** | none |
| average hours/day among participants | Σ(w·I·T) | Σ(w·I) | **Yes** | none, but it answers a different question and reads far larger — never label it as the population average |
| number of people doing *j* on an average day | Σ(w·I) | *D* (days in period) | n/a | wrong *D* scales the headcount linearly — 366 for 2024, 731 for pooled 2023+24 |
| any of the above vs "Americans" in copy | 15+, civilian, noninstitutional, household, 50 states + DC | all U.S. residents | **No** | denominator in copy is larger than the measured universe; the true share of *everyone* is lower than the stated share |

**Standard errors.** ATUS is a sample, not a census, so a difference between two years is not a fact
until it survives its error bars. Variance requires the **replicate-weight files** (§7.5, replicate
variance method) — a separate download not acquired here. If the spine asserts a *change* between
2019 and 2023/24, ticket 07 needs those files; if it asserts only the *shape* of a single day, it
does not. Flagging now, not deciding.

---

## Vintage history

- **This vintage:** 2025 single-year files, released **2026-06-25**. Previous: 2024 (2025-06-26),
  2023 (2024-06-27), 2019 (2020-06). Annual cadence, ~June of year+1.
- **Activity-file schema: no change 2019 → 2024.** Identical 30 variables, verified by diffing the
  Stata readers.
- **Respondent-file schema: +1 column** (`TRLVMODR`, Leave-module flag) in 2024; nothing removed;
  174 → 175.
- **Activity lexicon: the codes have not changed since 2013.** `changes.pdf` §6 states, year by
  year, "All activity codes were identical to those from 2013-…" through 2025. The only
  2019→2025 crosswalk entry (`lexiconchanges.pdf` §2.6) is **2023→2024 and is a rename only**:
  `130122` Rollerblading → "Roller skating, inline skating, skateboarding", and `130220` Watching
  rollerblading → likewise. Both marked **(1) one-to-one**. Codes unchanged.
  §3.1 "Comparable ATUS activity codes" collapses everything from 2013 to 2025 into a single column.
- **Earliest comparable vintage for this project's span: 2013.** For the map's chosen frames
  (2019 · 2023 · 2024) the activity lexicon is fully comparable with no crosswalk and no recoding.
  This is the cleanest possible answer to the ticket's central comparability question.
- Caveat that is *not* about codes: examples in the lexicon changed. "Many examples were added in
  the 2020 Coding Lexicons" (pandemic-era activities), and coders use examples to assign codes. Code
  *definitions* are stable; coder *behavior* at the margins may have shifted slightly in 2020+.
  Also, virtual activities are coded the same as in-person ones (§9.2.1): telework = working, online
  class = class, telemedicine = medical visit. The single exception — **talking with friends in
  person is "socializing"; over the phone or video it is "telephone calls"** — is a real
  discontinuity for any social-contact story across the pandemic boundary.

---

## The 2020 question — settled

The map's assumption was **"BLS suspended ATUS collection Mar–mid-May 2020 and published 2020 as a
special partial-year file with its own weights, not comparable to other years."** Verdict:
**substantially correct, with two corrections.**

**Confirmed:**

- Census closed its call and processing centers **2020-03-19**; collection resumed at reduced
  capacity **2020-05-11** (§9.2.1).
- Because the diary is about "yesterday," the **diary days missing are 2020-03-18 → 2020-05-09**.
  There are no values of `TUDIARYDATE` in that range (§9.2.2).
- BLS: "**Are ATUS data representative of 2020? No.**" Ten months of data. "It is not possible to
  produce annual 2020 estimates." Published annual charts, tables and the BLS database were **not
  updated** with 2020. The 2020 news release compares **May 10–Dec 31** of 2019 and 2020 rather than
  annual figures.
- **Its own weight variable, `TU20FWGT`**, replacing `TUFINLWGT`. Q1 weights represent Jan 1–Mar 17
  only; Q2 weights represent May 10–Jun 30 only; Q3/Q4 normal. The 2020 data represent **313 days**,
  not 366 — 77 + 52 + 92 + 92.

**Correction 1 — "special file" is wrong.** There is no separately-named 2020 file. The normal
`atusresp-2020.zip` / `atusact-2020.zip` / … carry all data collected in 2020, before and after the
suspension. What is special is the **weight variable**, not the file.

**Correction 2 — 2020 is not simply unusable.** BLS's own position is that *annual* 2020 estimates
are impossible but **partial-year estimates are valid** on `TU20FWGT`. And BLS built `TU20FWGT` for
**2019 as well**, precisely to make a matched May 10–Dec 31 2019-vs-2020 comparison possible. So a
"March 2020" frame is off the table (those days do not exist), but a rigorous "summer–fall 2020 vs
the same window in 2019" frame is explicitly supported. The map excludes 2020; nothing here forces
that to change, but the exclusion note should say *why* accurately: **not "the data is broken" —
"the data covers 313 days on a different weight, and the two months everyone would ask about are
exactly the missing ones."**

Also on file: some 2020 CPS labor-force statuses were misclassified (employed-but-absent instead of
unemployed); BLS reports 2.1% of employed persons in the "not at work, other reasons" category vs
0.6% in the same 2019 window, and judges that "time use estimates were not significantly impacted."

---

## The 2025 question — new, and the map does not know about it yet

**ATUS 2025 microdata exists**, released **2026-06-25**, along with a 2003–2025 multi-year file. The
map, charted 2026-08-08, treats 2024 as the latest year. It is not.

But 2025 carries its own hole, and it is a large one
(https://www.bls.gov/tus/notices/2026/october2025shutdown.htm; `changes.pdf` §2; 2025 dictionary
front matter):

- BLS was shut down or at reduced staffing **2025-10-01 → 2025-11-12**. No call attempts, no
  interviews.
- Therefore **no ATUS data for diary days 2025-09-30 → 2025-11-11** — a **43-day hole**, mostly Q4.
  "There is no microdata for October 2025."
- The 8-week fielding window was **not** extended, so sample assigned to that period had fewer
  chances to respond; "survey response rates for the affected sample were low compared with typical
  ATUS response rates." The 2025 annual response rate is **25.7%**, down from 32.4%.
- **The weighting methodology was not changed to account for the shutdown.** Diaries from Nov 12 –
  Dec 30 are weighted to represent *all* days in Q4, including the missing ones.
- BLS: "It is possible that ATUS estimates for 2025 or for the fourth quarter of 2025 could have
  been affected… **It is not possible to quantify the effect of the 2025 shutdown on the ATUS
  estimates.**"

This is a strictly worse situation than 2020 in one specific way: in 2020 BLS built a weight that
tells the truth about which days it represents; **in 2025 it did not**, so the 2025 weights assert
coverage of days that were never collected, and the size of the resulting bias is unquantifiable by
the publisher's own statement.

**Recommendation to the map (Dustin's call, not mine):** keep **2023 + 2024** as the "after" frame.
2025 is available and tempting as the freshest year, and it should not carry the headline. It could
appear as a third, later frame with an honest note — but only if the spine's claim does not depend
on it.

Precedent worth knowing: the same thing happened, smaller, in 2013 — a shutdown removed diary days
Sep 30 – Oct 15, 2013 (`changes.pdf` §2). 2019 is clean.

---

## Licence

- **Basis (stated):** public domain. BLS: "everything that we publish, both in hard copy and
  electronically, is in the public domain, except for previously copyrighted photographs and
  illustrations. You are free to use our public domain material without specific permission."
- **Attribution:** requested, not mandated — "we do ask that you cite the Bureau of Labor Statistics
  as the source." Cite it. No prescribed wording.
- **Embedded third-party data:** none of the risky kind. The microdata embeds CPS-derived variables
  (BLS/Census, public domain) and Census industry/occupation classification codes (U.S. government,
  public domain). **No basemap, no imagery, no geocoder output, no vendor layer** — which is the
  usual way a permissive outer licence turns out not to cover the inside of a file. It does here.
- **Redistribution:** permitted. The raw files may be committed, mirrored, or shipped inside the
  published artifact.
- **Trademark, and this one is live for a portfolio site:** "The BLS emblem… is a federally
  registered trademark. Unauthorized use of the emblem is prohibited." **Do not put the BLS logo on
  the site.** Naming BLS as the source in text is fine and is what they ask for.
- **Access route:** direct HTTPS download of published files. No scraping, no ToS question. Note
  only that bls.gov returns **403** to default user agents, so the fetch script needs browser
  headers — that is a bot-management response to the header set, not an access restriction on the
  data.

---

## Unanswerable

Each of these has no answer in the publisher's prose. Recorded with what it costs, per the skill's
rule that a written-down unanswerable is fine and an unnoticed one is the failure mode.

1. **Time zone / clock harmonization.** No ATUS document mentions time zones or states what
   `TUSTARTTIM` is relative to.
   *Cost:* no claim of **simultaneity** is supportable. "At 7 p.m., N million Americans were doing X
   at the same moment" cannot be said. "At 7 p.m. local time, N% were doing X" can. Binds ticket 07.

2. **Daylight saving.** No document addresses diary days spanning a DST transition, which are 23 or
   25 real hours while `TUACTDUR24` caps at 1440.
   *Cost:* two diary days a year have an hour that is double-counted or absent. Negligible for an
   annual average; fatal only to a claim about those specific dates.

3. **Vintage of the `GTMETSTA` metropolitan delineation.** The ATUS documents name no OMB bulletin
   or effective date; it arrives via CPS.
   *Cost:* a metro/nonmetro **comparison across 2019 → 2024** may be comparing two different
   delineations. If the exploration layer offers a metro filter, this must be chased into the CPS
   documentation first. If it does not, it costs nothing.

4. **Whether the single-year files this project uses were ever silently revised after release.** BLS
   demonstrably re-releases files (the 2020 Case History correction), but publishes no per-file
   revision log; the 2019 page's Last-Modified (2021-11-30) is a year and a half after release with
   no stated reason.
   *Cost:* a future re-fetch may not match the hashes in this record, and nothing on the site would
   say so. Mitigated, not solved, by pinning the hashes above and re-verifying on every fetch.

5. **Uniqueness of `TUCASEID`** on the Respondent and Summary files, and the completeness of each
   diary day's 1440 minutes. Publisher-**asserted**, not verified in the bytes — verification is
   out of scope for a source pass.
   *Cost:* none if ticket 03 verifies both as its first act. Real if it does not.

6. **Nonresponse bias at a 25.7% (2025) / 32.4% (2024) response rate.** The weights correct for
   nonresponse across the demographics and day-types BLS models (§7.1) — age, sex, race, ethnicity,
   education, presence of children, weekday/weekend. No document quantifies residual bias from
   nonresponse correlated with anything *outside* that set — and time use itself is plausibly such a
   thing: busy people are harder to reach.
   *Cost:* an unquantifiable, unsigned bias on every estimate. It applies equally to BLS's own
   published figures, so it is not a reason to distrust this pipeline specifically — but the
   difference between 2019 (42.0%) and 2024 (32.4%) means the *before* and *after* frames are not
   equally well-measured, and a small year-over-year difference should not be pushed as a finding
   without error bars.

---

## Decisions that bind later stages

Each is a semantic fact learned from the publisher's prose that a later ticket must not re-decide.
Format mirrors `rigor decide`: decided · why (with citation) · rejected.

| # | Decided | Why (cited) | Rejected |
|---|---|---|---|
| S1 | The spine is built from the **Activity file** (`TUCASEID`, `TUACTIVITY_N`, `TUSTARTTIM`, `TUSTOPTIME`, `TUACTDUR24`, `TRCODE`, `TEWHERE`) joined to the **Respondent file** on `TUCASEID` for `TUFINLWGT`, `TUDIARYDAY`, `TUDIARYDATE`, `TRHOLIDAY` | User's Guide §7.3 linking table; Activity-file schema identical 2019↔2024 (verified) | Building from the Activity Summary file — its column set is year-specific (410/398/396/377) and it has no time-of-day at all |
| S2 | The diary day is **4:00 a.m. → 4:00 a.m.**; durations use **`TUACTDUR24`** (max 1440), never `TUACTDUR` (max 9999) | User's Guide §4, §10; 2025 dictionary worked example; dictionary duration definitions | A midnight-origin day as the *native* axis; `TUACTDUR`, which does not truncate and will not sum to 1440 |
| S3 | Every estimate is **weighted by `TUFINLWGT`**, using the §7.4 formulas verbatim | §7.1: unweighted tabulations are biased by design — weekend days are sampled at 2.5× the weekday rate | Any unweighted count, average, or share, including "just for the prototype" |
| S4 | **2019 · 2023 · 2024 stay on `TUFINLWGT` and are directly comparable.** Pooling 2023+2024 is valid on the same weight; participant counts divide by *D* = 365 / 365 / **366** (2024 is a leap year), 731 pooled | pooling page + §7.2: no weighting-method change 2006–2019 and 2021–present; §7.4 participant formula | `TU06FWGT`, `TU20FWGT`, `TUFNWGTP` — none are on these files |
| S5 | The activity lexicon is **fully comparable across 2019/2023/2024/2025 with no crosswalk**; the only 2019→2025 change is the 2023→2024 **rename** of `130122`/`130220`, one-to-one, codes unchanged | `changes.pdf` §6 ("All activity codes were identical to those from 2013-24"); `lexiconchanges.pdf` §2.6 and §3.1 | Any recoding, harmonization layer, or use of the multi-year 2003–2025 lexicon |
| S6 | **2020 is excluded**, and the honest reason is: diary days 2020-03-18 → 2020-05-09 do not exist, the year covers **313 days** on a different weight (`TU20FWGT`), and BLS states annual 2020 estimates are impossible | User's Guide §9.2.1, §9.2.2 | The map's wording "special partial-year file" — the files are normally named; it is the *weight* that differs. Also rejected: "2020 is unusable" — partial-year 2019-vs-2020 on `TU20FWGT` is explicitly supported |
| S7 | **2025 does not carry the headline.** It exists (released 2026-06-25) but has a 43-day hole (2025-09-30 → 2025-11-11), unchanged Q4 weights that assert coverage of days never collected, a 25.7% response rate, and a publisher statement that the effect **cannot be quantified** | shutdown notice; `changes.pdf` §2; §3.3 response-rate table | Swapping 2025 in as the freshest "after" year |
| S8 | **No claim of simultaneity.** Time-of-day statements are **local time**; the source cannot support "at the same moment across America" | No ATUS document states any time-zone convention (Unanswerable #1) | Any headline of the form "at 7 p.m., N million Americans were simultaneously…" |
| S9 | "Americans" in any copy means **civilian, noninstitutional, 15+, in households, 50 states + DC** | §3.1 universe; `cps_htgm.htm` coverage and exclusions | Copy that implies all U.S. residents, all ages, or includes territories/military/institutionalized |
| S10 | `-1` / `-2` / `-3` are **sentinels, not data**, and `-1` doubles as *out of universe* (`TEWHERE` on sleeping, grooming, …). The `50xxxx` code family is uncodeable time that occupies real minutes | 2025 dictionary "Valid Values"; §3 file descriptions | Treating `-1` as a location, or silently dropping `50xxxx` — dropping it breaks the 1440-minute day |
| S11 | Source is **public domain**; cite BLS as source; the raw files may be committed and shipped. **The BLS emblem may not be used** | `linksite.htm` | Reproducing the BLS logo anywhere on the site |
| S12 | If the spine asserts a **change** between 2019 and 2023/24, the **replicate-weight files** must be acquired and standard errors computed (§7.5). If it asserts only the shape of one day, they are not needed | §7.5 replicate variance method | Asserting a year-over-year difference is real without error bars |

---

## What this hands to the next tickets

- **Ticket 03 (build validated extract):** S1–S5 and S10 are the build contract. First act: verify
  `TUCASEID` uniqueness and that each respondent-day's `TUACTDUR24` sums to 1440 — both are
  publisher-asserted and unverified. Re-fetch from the URLs above and check the SHA-256s.
- **Ticket 04 (render feasibility):** the payload floor is now known — 139,535 activity rows for
  2024, 182,980 for 2019, 30 columns each.
- **Ticket 05/06 (spines):** S2 (the 4 a.m. seam) and S8 (no simultaneity) constrain what a
  time-of-day mark can assert before any of them are drawn.
- **Ticket 07 (freeze the claim):** S8 and S9 are the language constraints; S12 decides whether the
  claim needs error bars.
- **The map** needs three edits — 2025 exists, the 2020 note is two-thirds right, and the lexicon
  question is closed clean.
