# Pause Garden — adversarial first-read review 1

**Reviewed:** 2026-09-02 UTC  
**Live URL:** <https://pause-garden.sociobot.in>  
**Verdict: FAIL**

The primary `/demo` is clear and usable, but the release has a dead paid
action, a deployed artifact that differs from the required production build,
two previously reported routing defects, and unlisted claims.

## Cold read

I opened fresh Chromium contexts at 390 × 844 and 1440 × 950 without scrolling.
At both sizes I understood: this is a 12-turn garden game for two to four
friends; it is for friends with interrupted evenings; click **Try it with
sample data** first. The adjacent explanation, **“A garden opens on turn
seven. No setup is needed.”**, names the result. The visible board preview says
**“Room MOSS · Turn 7 of 12”** and **“Jules is sleeping.”**

This gate passes. The h1 is **“Restore a garden, even when friends pause”**;
the eyebrow **“A 12-turn game for 2–4 players”** supplies the necessary game
context in the same viewport.

## Findings

### F-1-1 — BLOCKING — Buy Host Edition is a dead link

**Location/quote:** landing price card and `/play`: **“Buy Host Edition”** targets
`https://api.sociobot.in/api/v1/products/pause-garden/checkout`. A fresh
`curl -L` got **HTTP 404**. The paid-license claim only asserts this href.

**Why:** a visitor is asked to pay and reaches a missing resource.

**Fix:** provision that product-scoped checkout route or replace the action
with an honest unavailable state. Add a claim that follows the link and
observes checkout (or its documented sign-in/checkout response).

### F-1-2 — BLOCKING — live static artifact differs from production build

**Location:** live `/` references `/assets/main-CsZKoNbI.js`, SHA-256
`a026e0b9f970fbf25f2396a32d84dc21808b6fbeea5b814901911178ac136cf6`.
A fresh clone at `23fd6060b0e7326ee027505e256a551cd15402c5` built with
`npm run build:production` produces and its verifier requires
`/assets/main-CNwY5fXg.js`, SHA-256
`35cbd0ba4e244c9efa6066fd04eb842cc99b111278227ab127f2fba1ad3201c6`.

**Why:** production is not serving the repository’s declared release artifact.
This repeats the static-deployment P1 in `.factory/verification-2.md`; the
later claimed `CNwY5fXg` artifact is not live.

**Fix:** deploy exactly that production `dist/`, then compare the live asset
name and hash to the build in a deployment smoke check.

### F-1-3 — BLOCKING — documented `?demo=1` opens the landing page

**Location/quote:** `.factory/demo.md` says **“Direct query alternative:
`/?demo=1`”**. Fresh live navigation showed h1 **“Restore a garden, even when
friends pause”**, no demo banner, and no `demo:pause-garden:room` key. `/demo`
correctly showed **“Restore this garden together”** and the banner.

**Why:** a documented direct demo entry does not enter the sandbox. Source has
the same half-fix: `isDemo()` recognizes the query while `route()` renders `/`.
This repeats the P3 in `.factory/verification-3.md`.

**Fix:** redirect `/?demo=1` to `/demo`, or remove that alternative everywhere.
Add a browser test that asserts its banner, sample board, and demo storage.

### F-1-4 — BLOCKING — unknown URL renders a 404 view with HTTP 200

**Location:** `https://pause-garden.sociobot.in/no-such-route` returned **200**.
It client-rendered title **“Page not found — Pause Garden”** and h1 **“This
path does not reach the garden”**.

**Why:** crawlers and clients receive a successful response for a missing page.
SPA `navigationFallback` takes precedence over `responseOverrides[404]`. This
repeats the P3 in `.factory/verification-3.md`; source has the same behavior.

**Fix:** make unknown URLs return the designed 404 document with HTTP 404,
while valid deep links still work. Add HTTP tests for each case.

### F-1-5 — BLOCKING — visitor claims lack matching manifest tests

**Locations/quotes:**

- Landing: **“Keyboard and touch controls”**; `keyboard-controls` tests only
  keyboard.
- Landing: **“No third-party multiplayer service.”** No manifest entry tests
  that service boundary.
- README: **“Weather changes each action.”** No claim observes that sequence.
- README: **“The product-owned room service synchronizes turns and stores room
  state in SQLite.”** The remote-room claim covers sync, not this SQLite claim.
- README: **“Rooms expire after 30 inactive days.”** No claim covers expiry.
- README: **“Purchases use the Sociobot hosted checkout. The app stores the
  license locally.”** The paid claim seeds a fake verdict and checks only href.
- README: **“License verification sends only the saved license token to
  `api.sociobot.in`.”** No request-log claim covers it.

**Why:** these are visitor-relevant assertions with no corresponding
`.factory/claims.json` entry and sandbox-observable proof.

**Fix:** remove each unproven assertion or add one claim and isolated test per
assertion. Use touch input; record remote/license requests; inject a clock for
expiry; and use a safe checkout/license fixture rather than checking a string.

### F-1-6 — MINOR — headings are slogans rather than section names

**Locations/quotes:** **“Take turns without waiting on anyone”**, **“No pressure
to stay online”**, **“Start as many chapters as you want”**, and **“Already
bought it?”**.

**Why:** read out of context, they do not name their section; “No pressure” is
mood copy rather than a boundary.

**Fix:** use **“Turn handoff and chapter goals”**, **“Limits and privacy”**,
**“Host Edition price and limits”**, and **“Restore a Host Edition license.”**

### F-1-7 — MINOR — README has jargon and an overlong sentence

**Locations/quotes:** **“An opaque token reconnects a player after refresh”**,
**“exact candidate static hashes”**, **“SPA fallback configuration”**, and
**“WebSocket ingress and one replica”** are unexplained. The suite-coverage
sentence is 29 words, above the 22-word cap.

**Fix:** say **“A private browser token lets a player return after refreshing”**,
**“expected built-file checksums”**, **“the setting that lets valid app links
open directly”**, and **“run one room server that accepts live game
connections.”** Split coverage into: **“The suite checks game rules, remote
play, reconnect, accessibility, and privacy. See the claim list for every
check.”**

## Demo, privacy, claims, and structure evidence

`/demo` passes the primary one-click demo gate. It opened a realistic MOSS room
on turn 7 with three named players, goals, blooms, and a sleeping player. The
banner read **“Demo — sample data, nothing is saved”** with **Reset demo** and
**Start for real**. Reset returned it to `7 of 12` and `11 / 14`; only
`demo:pause-garden:room` was in session storage and no real `pause-garden:*`
key existed. A fresh Playwright request log contained only
`https://pause-garden.sociobot.in`.

I used a clean clone, ran `npm ci`, then every exact command in
`.factory/claims.json`. All 15 passed: `chapter-complete`, `restart-reset`,
`sleeping-handoff`, `remote-room-play`, `remote-reconnect`, `settings-persist`,
`offline-reload`, `privacy-same-origin`, `keyboard-controls`,
`two-to-four-players`, `paid-host-edition`, `seed-determinism`,
`rendering-rate`, `free-chapter`, and `calm-private-rules`. `npm test` passed
(6 Vitest unit/server tests and 18 Playwright desktop/mobile tests), as did
`npm run build:production`. These do not clear the live, documentation, or
coverage failures above.

Home, `/demo`, `/play`, `/privacy`, and `/terms` returned 200. The Param
Factory link returned 200; checkout is F-1-1. The site has titles, description,
canonical, OG/Twitter image, favicon, `lang=en`, one h1, main, skip link,
footer, robots, sitemap, response-header CSP, no cold-load console error,
route focus, and an aria-live route announcer. The editorial greenhouse visual
system is distinct, not a generic SaaS template. No AI feature is implied by
this game brief.

Earlier findings were rechecked:

| Earlier finding | Current result |
| --- | --- |
| `verification.md` P0 remote room/reconnect | Fixed: two-browser claim passes. |
| `verification.md` P1 frame-rate suite failure | Fixed: full suite and claim pass. |
| `verification.md` P2 immutable assets/design mismatch | Fixed: immutable live assets; game/design agree. |
| `verification-2.md` P1 static candidate mismatch | Regressed: F-1-2. |
| `verification-3.md` P3 `?demo=1` | Unfixed: F-1-3. |
| `verification-3.md` P3 missing route HTTP 200 | Unfixed: F-1-4. |

## Copy audit

`.factory/copy-audit.md` inventories all 44 unique landing strings and their
word counts; I rechecked it against source/live copy. Its longest is 16 words.
The extra navigation/label strings are **Skip to game** (3), **Pause Garden**
(2), **Demo** (1), **Play** (1), **Privacy** (1), **How it works** (3), **What
it does** (4), **What it does not do** (5), **Host edition** (2), **License**
(1), **Terms** (1), and **Built by Param Factory** (4). F-1-6 records the
heading flags.

README inventory (headings and prose; repeated command names counted once):

| Copy | Words |
| --- | ---: |
| Pause Garden | 2 |
| Restore a garden with 2–4 friends, even when someone steps away. | 10 |
| Pause Garden is a 12-turn online browser game for 2–4 remote friends. | 12 |
| Players join a private room by code and take one turn at a time. | 14 |
| Weather changes each action. | 4 |
| If a player leaves, the group can place that player’s queued token. | 12 |
| Try the sample game | 4 |
| Open `/demo` or <https://pause-garden.sociobot.in/demo>. | 4 |
| The sample starts on turn seven with one player sleeping. | 10 |
| Tend bed three to complete both goals. | 7 |
| Demo state uses the `demo:pause-garden:room` session storage key. | 7 |
| It never reads or writes a real room. | 8 |
| Use Reset demo to restore the sample. | 7 |
| Play | 1 |
| Open Play, enter two to four names, and create the online room. | 12 |
| Share the five-character code and each friend’s chosen name. | 9 |
| Each friend joins from their own browser. | 7 |
| Choose Plant, Water, or Tend, then select a valid bed. | 10 |
| Reach both goals within 12 turns. | 6 |
| The game supports pointer, touch, and keyboard-only play. | 8 |
| The product-owned room service synchronizes turns and stores room state in SQLite. | 11 |
| An opaque token reconnects a player after refresh. | 8 |
| The visited demo reloads offline and never sends sample state to the room service. | 13 |
| Host Edition | 2 |
| The demo and one full chapter are free. | 9 |
| Host Edition costs $6 once. | 5 |
| It adds unlimited new chapters and custom seeds. | 8 |
| Purchases use the Sociobot hosted checkout. | 6 |
| The app stores the license locally. | 7 |
| Develop | 1 |
| Requirements: Node.js 22 or later and npm. | 7 |
| The production build command is exactly: | 6 |
| It creates `dist/` with `index.html` at its root and embeds the production room-service origin. | 14 |
| `npm run build` is available for local tools that supply their own room-service origin. | 14 |
| Verify | 1 |
| The suite covers deterministic game rules, two-browser join/play/end sync, SQLite recovery, browser reconnect, replay, sleeping handoff, sound persistence, keyboard control, 390 px layout, offline demo reload, privacy requests, rate limits, license state, and accessibility. | 29 |
| The animation test measures at least 55 fps from median frame pacing over 90 frames. | 15 |
| Privacy | 1 |
| Online room names and garden state go only to the product-owned Pause Garden room service. | 15 |
| Rooms expire after 30 inactive days. | 6 |
| Demo play sends no player data away from the static site. | 11 |
| License verification sends only the saved license token to `api.sociobot.in`. | 10 |
| See `/privacy` and `/terms`. | 4 |
| Deploy | 1 |
| Run `npm run build:production` followed by `node scripts/verify-static-candidate.mjs`, then deploy that `dist/`. | 9 |
| The checker verifies exact candidate static hashes, production room origin, and SPA fallback configuration. | 13 |
| Deploy the Docker image as `sf-pause-garden-realtime` with WebSocket ingress and one replica. | 10 |
| Mount the fleet-created data share at `/data`. | 7 |
| The static configuration supplies SPA fallback, immutable hashed assets, CSP, and security headers. | 12 |
| License | 1 |
| MIT. See [LICENSE](LICENSE). | 3 |

## What would make this perfect

Deploy the exact production artifact, restore or honestly remove checkout, make
every documented demo URL work, return a true HTTP 404, and either test or
remove every visitor-relevant assertion. Then repair the few heading and README
plain-language defects. Only a repeat review with zero findings should pass.
