# Fable brief — One Day in America

**Build three premium, interactive websites that explain what one American day actually looks like.**
Real BLS time-use microdata, already extracted and gate-verified. You design everything. Nobody is
waiting on approvals — run to the end.

---

## 0 · The ask (Dustin, verbatim)

> demonstrate your extreme capabilities in web design, taste, and artistic flavor. The only primary
> rule is that these sites have to display the the most interesting pieces of information to
> thoroughly explain the data that we have and all of the interesting pieces about it. It must be
> understandable to anybody that reads it and clean. We don't want to overwhelm or jam designs or
> words in. We want to be super concise with everything so that the graphics do most of the talking.
> I want each website to be different variations, and involve a large mixture of advanced visual
> techniques in each, include high-quality 3D tactics; otherworldy, beautiful animations; exceptional
> color palettes; novel/interesting font styles; and whatever you deem fit as a way to showcase your
> best, most creative skills and how you use them to improve a existing site. You can accomplish this
> in many ways, using many workflows; for instance, download images on Pinterest to look for
> inspiration (dustincole.ent@gmail.com), for images use Chat GPT Image 2 (which you have keys for),
> and use those as key assets. Dont worry about cost or approvals. You also have the higgsfield mcp
> but make sure we have creduts for any interactions/video you want before trying to use. You can
> also borrow from advanced motion design style websites; and you have, again, total creative freedom
> to design in a way that you believe best illustrates your capabilities. (If these capabilities dont
> work and you are trying to use them let me now immediatly)
>
> Once you have 3 variations up, I'd like you to put them on vercel and then serve me the link.
> Before you "ok" each site, make sure you do at least three iteration passes. An iteration pass is
> where, after completing the site, you go through it with a fine-toothed comb, looking for design
> problems, opportunities to improve/complexify the design, and more.
>
> So go nuts and show the world what you are capable of! 3 websites hosted and three iteration passes
> is your /goal - completely completely autonomously, and do not ask me for anything until all are
> done and confident

**Also from him, on this project specifically:** give Fable the data and the findings and let him
present it in the best possible way. Freedom to create the most premium thing he can — really cool,
perfectly explains the data, keeps people interested, interactive. Beautiful and eye-popping and
easily understandable.

## 1 · Done means

- **Three variations**, each a genuinely different design — not one design in three palettes.
- **Three iteration passes each**, after the site is otherwise finished, hunting design problems and
  chances to complexify.
- **All three live on Vercel**, links handed over together.
- **Beautiful and fully functional on phone and desktop.** Mobile is a hard gate, not a port.
- **Autonomous.** Do not ask anything until all three are done. The one exception is his own:
  if a capability below does not work while you are trying to use it, say so immediately.

## 2 · Tools and credentials

| Capability | How |
|---|---|
| **gpt-image-1** | `node C:\Users\dusti\.openai\generate-image.js "prompt" --out f.png [--size 1024x1024\|1024x1536\|1536x1024] [--quality high]`. Key at `C:\Users\dusti\.openai\api_key`. Pass `--image in.png [--fidelity high]` to switch to the edits endpoint. No 4:3 size exists — crop after. Spend is authorized. |
| **GPT Image 2 / video / audio** | Higgsfield MCP. **Check `balance` or `show_plans_and_credits` before any job.** |
| **Pinterest, Google, any reference site** | Chrome DevTools MCP drives a live Chrome. Pinterest login `dustincole.ent@gmail.com`. |
| **Headless capture that must not fail** | The shared MCP Chrome profile is contended across sessions and errors out mid-run. For anything scripted, drive your own: `puppeteer-core` at `file:///C:/Users/dusti/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js`, `executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'`, your own `userDataDir`, and set `protocolTimeout: 180000` — a heavy WebGL page will kill the CDP connection at the default. |
| **Image processing** | `sharp` 0.35 is in `node_modules` (`dist/index.mjs` for ESM, `dist/index.cjs` for CJS — there is no `lib/index.js`). |

Do not worry about cost or approvals for any of the above.

## 3 · The project

- **Repo:** `C:\Users\dusti\Projects\One_Day_In_America`, remote `dustincole-data/one-day-in-america` (SSH).
- **Stack today:** Astro 7 static → Vercel, no adapter. Restructure freely; the only requirement is that
  a push still produces a working static deploy.
- **Vercel project `one-day-in-america` is git-linked to `main`, so `git push` auto-deploys.**
  Do not run `npx vercel --prod` here.
- **Three variations, simplest path:** one project, three routes (`/a`, `/b`, `/c` or named), plus an
  index that links them. One push ships all three and gives three shareable URLs. Three separate
  Vercel projects also works if a variation needs its own build.
- **Subdomain `oneday.dustincoledata.com` is attached but waiting on one manual Namecheap CNAME from
  Dustin** (`oneday` → `3e4803086c51b69e.vercel-dns-017.com.`). Until he adds it, share the
  `*.vercel.app` URLs.
- Push, commit and deploy are **pre-authorized** — never ask.

## 4 · The data

**Already built and sitting on disk.** `data/extract/{episodes,respondents}-{2019,2023,2024}.csv`,
475,635 episodes and 25,652 respondent-days. Gitignored but present; `npm run data` re-fetches,
rebuilds and re-verifies (it fails the build on any mismatch).

```
episodes-<year>.csv    TUCASEID, N, START_MIN_FROM_4AM, DUR_MIN, TRCODE, TEWHERE, MAJOR
respondents-<year>.csv TUCASEID, TUFINLWGT, TUYEAR, TUMONTH, TUDIARYDATE, TUDIARYDAY, TRHOLIDAY,
                       TELFS, TRDPFTPT, TEHRUSLT, TRCHILDNUM, TRHHCHILD, TRYHHCHILD, TRSPPRES,
                       TESPEMPNOT, TEMJOT, TESCHENR, TEAGE, TESEX, PEEDUCA, PTDTRACE, PEHSPNON,
                       GTMETSTA, WORK_MIN, COMMUTE_MIN, WORK_AT_HOME_MIN
```

- Join on `TUCASEID`. Weight **every** population number by `TUFINLWGT` (person-day weights).
- The time axis is **minutes since 4:00 a.m., 0–1439**. Every respondent-day chains from 0 to exactly
  1440 with no seam. That invariant is verified, so start minutes are derivable and need not ship.
- `MAJOR` is one of the **12 gate-proven published activity majors**. That mapping is in no BLS
  document — it was recovered from Table A-1's arithmetic (travel redistributed into each major;
  tier-1 `10` splits at tier 3) and lives in `scripts/atus/categories.ts`. **Do not re-derive it.**
- Telework and commuting are baked: `WORK_AT_HOME_MIN`, `COMMUTE_MIN`.
- **Proof it is right:** 637 of 639 published BLS Table A-1 cells reproduce exactly across
  2019/2023/2024 × total/men/women × three statistics. The two misses are 0.09 pp and 22 seconds in
  one leaf's women slice, documented and pinned.
- **Universe:** civilian, noninstitutional, **age 15+**, living in households, 50 states + DC. Not
  "all Americans". Diary day runs **4 a.m. → 4 a.m.**
- **2020 is excluded** — diary days 2020-03-18 → 05-09 do not exist and BLS states annual 2020
  estimates are impossible. Say so if you mention years at all.
- Full three-year episode payload compresses to **507 KB brotli**.
- ATUS is public domain. The BLS emblem is trademarked — do not use it.

Existing working code you can read or reuse: `spike/claim/verify.mjs` (the reference implementation
of the headline number), `spike/spines/mine.mjs` (the harness that produced most of §5).

## 5 · The findings — everything interesting in this data

These are all real, weighted, and already survived an adversarial review. This is the material to
choose from. **You decide which of it makes the sites and in what form.**

### 5.1 The headline: the day is one country at 3 a.m. and a hundred by noon

The share of the population doing the single most common activity, hour by hour:

> **96.5 % → 25.8 %, a 70.8 pp gap.** 2024, n = 7,669, `TUFINLWGT`, 12 majors, **at the hour**.

- Headline copy, frozen: **"Everyone's 3 a.m. looks the same. Nobody's noon does."**
- The real object is a **120-minute plateau at ≥95 %, 2:00–3:59 a.m.** Asleep specifically is 96.0 %.
- Across the day (2024, by hour): 3 a.m. 96.4 % · 6 a.m. 75.1 % · 8 a.m. 32.4 % · **noon 24.4 %** ·
  4 p.m. 30.8 % · 8 p.m. 51.8 % · 11 p.m. 75.5 %. *(These come from a slightly different
  specification than the frozen pair — recompute anything you print with `spike/claim/verify.mjs`'s
  spec: 12 majors, at the hour.)*
- **It is not just "people sleep at night."** In the 840 waking minutes 8 a.m.–10 p.m., the most
  common activity in America holds **under a third of the country for 522 of them (62.1 %)** and
  under 40 % for 630 (75.0 %). The waking day never gets tighter than 55.2 %.
- **Stable across samples:** 2019 96.2 %/24.5 %, 2023 96.4 %/24.7 %, 2024 96.6 %/24.3 %.
- **Filter to people who worked that day and noon tightens hard:** 57.4 % at noon, 65.4 % for 6 h+
  workers, peaking **86.4 % at 2 p.m.** And every worker slice's loosest minute moves to
  **6:00–6:22 p.m.**, not noon — 2.2× a rotation null, so that is coordination, not the filter.
- **Noon is stratified, not scattered.** 25.8 % is a modal *maximum*; a low maximum is equally
  consistent with a few large blocks, and the blocks are what the data shows. See constraint C11.

### 5.2 The 1,440-minute ledger — where an American day goes

Population averages, minutes per day, with the ± floor on the 2024−2019 delta:

| major | 2019 | 2023 | 2024 | Δ 24−19 | ± floor |
|---|---:|---:|---:|---:|---:|
| personal care (incl. sleep) | 577.4 | 590.2 | 587.8 | **+10.4** | 3.0 |
| leisure and sports | 311.1 | 309.1 | 303.9 | −7.2 | 4.6 |
| work | 216.8 | 213.8 | 205.5 | −11.3 | 5.9 |
| household | 107.1 | 114.9 | 120.8 | **+13.8** | 2.7 |
| eating and drinking | 70.9 | 71.9 | 74.2 | +3.3 | 1.2 |
| purchasing | 44.7 | 39.4 | 40.5 | −4.2 | 1.5 |
| care of household members | 29.2 | 30.2 | 30.6 | +1.4 | 1.6 |
| education | 27.5 | 23.5 | 25.2 | −2.3 | 3.2 |
| org., civic, religious | 18.0 | 14.5 | 18.3 | +0.2 | 1.3 |
| other, n.e.c. | 16.5 | 12.4 | 12.5 | −4.0 | 1.0 |
| care of nonhousehold members | 11.2 | 10.3 | 10.0 | −1.2 | 0.9 |
| phone, mail, e-mail | 9.4 | 9.8 | 10.7 | +1.3 | 0.7 |

The day is fixed at 1,440 minutes so the deltas sum to exactly zero. **Household and personal care
gained; the honest reading of leisure is "did not gain", not "fell"** — its move is inside its floor.

### 5.3 The workday did not move. It moved indoors.

The most surprising thing in the data, and the only finding that asserts a *change*.

| | peak working minute | share of 15+ at that minute | of those, **at home** |
|---|---|---:|---:|
| 2019 | 10:45 a.m. | 32.5 % | 9.7 % |
| 2024 | 10:55 a.m. | 32.2 % | **22.4 %** |

- Share of **every paid-work minute in America** done at home: **11.6 % (2019) → 22.6 % (2024)**.
- Commuting: 35.5 % → 30.0 % of people; **93.6 M → 81.8 M commuters a day** — from a population that
  *grew* 263.4 M → 272.9 M. **And the ones still commuting go longer: 47.1 → 49.3 minutes.**
- Decomposition — `worked × commuted-if-worked × minutes`: 44.5 % × 79.7 % × 47.1 (2019) against
  42.5 % × **70.4 %** × 49.3 (2024). Labour-force participation is not the story; conditional
  commuting is.
- **Do not tell this as group-vs-group.** Comparing home workers to commuters never deconfounds —
  "worked entirely at home" collects anyone who answered e-mail on a Saturday, and restricting both
  sides to a real 6 h+ working day still leaves 76.6 ± 6.7 minutes between them. It only works
  cross-year and population-wide.

### 5.4 Who actually has time

Free time, 2023+2024 pooled. (Construct: Ås four-way on the published majors — but **88.7 % of "free
time" is just the Leisure-and-sports major**, so prefer the published category and say so.)

| group | sample days | free time | share under 3 h | obligated |
|---|---:|---:|---:|---:|
| everyone | 16,217 | 5 h 46 m | 26.2 % | 7 h 12 m |
| worked on the diary day | 5,382 | 3 h 30 m | 44.5 % | 10 h 22 m |
| worked + children < 18 | 1,926 | 3 h 02 m | 54.0 % | 10 h 58 m |
| **worked + children < 6** | **761** | **2 h 39 m** | **61.0 %** | 11 h 25 m |
| worked + children < 6, women | 343 | 2 h 27 m | 63.3 % | 11 h 28 m |
| single parent who worked | 443 | 3 h 21 m | 48.5 % | 10 h 05 m |
| age 65+ | 5,668 | 7 h 56 m | 8.4 % | 4 h 46 m |
| did not work, no children | 8,325 | 8 h 06 m | 8.1 % | 4 h 11 m |

**A 5 h 27 m spread between the tightest and loosest group** — the largest gap in the extract.
Whole-population free time barely moves across years: 5 h 55 m → 5 h 46 m → 5 h 45 m.

### 5.5 The 48 minutes — and why it is not the story it looks like

Published "Leisure and sports" major, 2023+2024 pooled:

| | men | women | gap | ± floor |
|---|---:|---:|---:|---:|
| everyone | 331.3 | 282.8 | **48.5** | 4.8 |
| employed full time, 25–54 | 250.1 | 212.3 | 37.8 | 6.6 |
| worked that day + children < 18 | 178.8 | 136.0 | 42.8 | 7.4 |

It survives every condition tried. **Then the twist: 24.8 of those minutes are television** — about
half the gap, two-thirds of it on the wider construct, and 64.6 minutes of a 90.5-minute gap among
people not in the labour force. *"Women get less free time"* is substantially *"men watch more
television."*

**And the version that does not survive:** total work, paid + unpaid, is statistically
indistinguishable — **350.8 vs 356.0 minutes, a gap of 5.1 ± 5.7.** Women do 62.7 ± 3.5 more minutes
of unpaid work and 57.6 ± 5.5 fewer of paid work, and those nearly cancel. A "women work more in
total" claim only appears once narrowed to full-time working parents (+30.6 ± 10.0, n = 706).
**Ship the leisure gap, never a total-work gap.**

### 5.6 Television against everything else

The single most lopsided thing in the extract:

- **TV: 2 h 38 m a day.** 73.2 % of people watched; 3 h 36 m among watchers.
- **45.7 % of all free time in America is television.**
- Socialising and communicating: **0 h 35 m**, 29.6 % engaged. **TV is 4.5× it.**
- Days containing **zero** of a thing: socialising **70.4 %** · exercise 78.7 % · care for a household
  member 78.2 % · paid work 56.8 % · free time only 4.0 %.

### 5.7 Weekday against weekend

Honestly weighted 2/7, not the sample's 50/50: sleep 8 h 50 m → 9 h 37 m · free time 5 h 12 m →
7 h 08 m · obligated 8 h 02 m → 5 h 10 m.

### 5.8 Killed — do not rediscover it

**Rest inequality is not there.** Across 22 groups the entire spread of average sleep is 8 h 35 m to
9 h 51 m — 76 minutes — and the gradient runs *backwards*: no-HS-diploma 9 h 35 m against bachelor's
8 h 46 m, because the education gradient is employment in disguise. The one cell pointing the right
way (9.7 % of multiple-job holders under six hours, against 5.2 % overall) is 868 sample days and 4.5
points. Also: **ATUS sleep is diary sleep** — in bed asleep or trying to — which is why it reads
~1.5 h above self-report surveys. That is a definition, not an error.

### 5.9 Groups that are safe to draw as individuals (2024)

worked / didn't (2,489 / 5,180) · worked 6 h+ (1,757) · sex (3,563 / 4,106) · weekday / weekend
(3,837 / 3,832) · 65+ (2,678) · 25–54 (3,227) · children < 18 (2,107 / 5,562).
**School enrolment is out at n = 466.** Anything under ~844 sample days should be shown as an
aggregate, not as traceable individual records.

## 6 · Five things that cannot be broken

Everything else is yours. These are truth constraints, not taste.

1. **C3 — ship a fine activity partition.** 12 published majors, or 13 with sleep split out. A coarse
   3–5 colour "simplified" palette is **forbidden**: under a three-way necessary/obligated/free scale
   the loosest hour moves to 6 p.m. at 39.1 % and **the headline becomes false**. Trough stability is
   40/40 on fine partitions and 0/20 on the coarse one.
2. **C10 — one mandatory source line, one place, on every variation:**
   *"7,669 real diary days · American Time Use Survey 2024 · each on its own local clock, 4 a.m. to
   4 a.m."* It is the BLS attribution and it is the no-simultaneity defence. **No clock, no ticker,
   no "right now" framing anywhere** — this is each respondent's own local time, never a moment.
3. **C11 — "Nobody's" is safe over the picture and unsafe without it.** Any surface that quotes the
   claim without the graphic (OG card, project card, a writeup) says *"the most common single
   activity holds…"* instead. Never "no two days are alike".
4. **No error bars, ever, and no minute-level numbers.** There are no BLS replicate-weight standard
   errors here. The ± values above are linearized *floors* — usable as language, never drawn.
   "3:27 a.m." and "12:02 p.m." are forbidden: the argmax minute wanders 2:55 → 3:11 → 3:34 a.m.
   across three annual samples, and **85.3 % of reported episode starts land on a multiple of five
   minutes**. Use hours.
5. **If you decimate, use systematic PPS on `TUFINLWGT`.** The weights span 237×, so equal ink per
   respondent-day is wrong by **8.67 pp at every k, including all 25,652** — it renders 23.1 % working
   at 2:57 p.m. against a weighted 31.7 %. PPS is the only fix.

Register everywhere: **associational and descriptive.** No causal verbs. The finding was found by
mining, not predicted, and reads as description of what people reported.

## 7 · The render budget (measured, not guessed)

If a variation draws the microdata rather than aggregates, this is real:

- **All 475,635 episodes draw in one WebGL2 instanced call at 60 fps** on an emulated phone. Geometry
  is nearly free (~6.5 ms per *million* primitives). Canvas2D animates ~200 threads and is out.
- **The budget is screens of blended overdraw, not thread count** — 70 Mpx costs the same from 2,500
  threads or 10,000. Target ≤2.5 screens at 60 fps, ≤6 at 30. A real iPhone 16+ came in ~2× *faster*
  than that model on blended overdraw, so there is headroom on flagship phones; no mid-range Android
  has been tested.
- Two levers dwarf everything: **`antialias:false`** (up to 8.3×) and **capping the backing store at
  DPR 2** (2.05×).
- **`multiply` is out at every opacity** — black by 8 overlaps at α=1, by 64 at α=0.1. On a light
  ground use alpha; on a dark ground additive works but compounds to white, so watch density.
- **Frames near 1 s kill the WebGL context permanently.** Never ship a path that can stall that long.
- The real ceiling is pixels: about **844 traceable threads on a phone**. **Desktop is the harder
  target, not the phone.**
- 3D is allowed and may be earned — but depth without opaque occlusion is just more overdraw. A 3D
  form that occludes is affordable; one that layers translucently is not.

## 8 · What it must not look like

- **Do not remake FlowingData's *A Day in the Life of Americans* (2015)** — same dataset, the
  most-shared piece in this space, and its dot simulation makes you *wait* for the day to play.
- **Do not produce an activity-transition hairball.** Tangle without structure reads as noise.
- **Do not produce the 2009 NYT ATUS stacked area.** It aggregates every person into smooth bands,
  which destroys both the fray and the individual day. (It is also a dead Flash object today.)
- **No decorative particle glow with no data mapping.** That is the AI-artifact tell. If a strand is
  on screen it should be a real diary day or a real quantity.
- **No giant display hero headline** — that is a standing house law regardless of the type choice.
  Font styles themselves are wide open; the oversized-hero reflex is not.
- **Copy law:** flat declarative. No parallel triads, no feel-something clauses, nothing that reads as
  a sales pitch. Every word fights to exist — the graphics do the talking.

## 9 · Traps already paid for

- **Verify on `one-day-in-america.vercel.app`, never a per-deployment URL** — the
  `…-<hash>-dustincole-datas-projects.vercel.app` form serves the Vercel SSO login page **under an
  HTTP 200**, so a status check passes while showing nothing.
- **Vercel mints a unique per-domain CNAME target** per subdomain; the shared `cname.vercel-dns.com`
  is only a fallback. The record cannot be written before the domain is added to the project.
- **Astro dev + HMR keeps the load event open**, so `navigate_page`/`reload` reports a timeout even
  though the page loaded. Poll for a page-side ready signal instead of trusting it.
- **`fill()` on a number input appends rather than replaces** in Chrome DevTools MCP — clear with
  End+Backspace and verify `.value`.
- **On touch, the first tap on any mark whose `mouseenter` mutates the DOM is swallowed by WebKit.**
  No emulator reproduces it. Pair `pointermove` with `pointercancel`, not `pointerleave`.
- **A canvas must resync from its own box via `ResizeObserver`**, not the window `resize` event — the
  iOS URL-bar collapse squashes it otherwise.
- **Astro module scripts run once**; the ClientRouter swaps DOM without re-running them. Guard with
  `astro:page-load` and an `isConnected` check.

## 10 · Superseded — do not read

`.claude/plans/one-day-in-america/issues/08-reference-wall.md` and
`research/08-reference-wall/` are **dead**. Dustin rejected the reference-wall route on 2026-08-10:
*"I don't want a reference wall."* The map's earlier "one near-wordless mark, five-second gasp,
2024 only" destination and its thin-anchor route are superseded by §0 of this brief. Tickets 09 and
10 as originally written are void.

His live references instead: **The Shape of Help** (`C:\Users\dusti\Projects\shape-of-help`) for how
thoroughly a dataset can be explored on one page, **Cause of Death**
(`C:\Users\dusti\Projects\dustincole_data\.claude\plans\what-actually-kills-you\research\06-desktop\`,
open `ember.html`) for object quality, and **Nadieh Bremer / Visual Cinnamon** for colour. Look at
them once, then do something better.
