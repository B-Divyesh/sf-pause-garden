# Pause Garden repair 8 handoff

## Strict review 5

Strict review 5 passed with zero findings and zero untested claims. It reviewed
implementation `e648ac2fcfedae0b2eedd27eb4c59f110c9ebabf` against the live
site and recorded documentation baseline `93af6cb`.

- Report: `.factory/review-5.md`
- Clean verification: `npm ci --include=dev`, `npm audit --audit-level=high`,
  all 23 declared claims by their exact commands, `npm test`, `npm run build`,
  and `node scripts/verify-static-candidate.mjs` passed.
- Live verification: fresh desktop and phone first screens showed the job,
  audience, sample action, and board; sample play won, reset, and discarded
  only demo state; two independent online clients reconnected and completed a
  12-turn chapter; health confirmed SQLite and the implementation SHA; a
  96-request allowance probe returned 54 HTTP 429 responses with
  `Retry-After: 2`.
- Accessibility and route checks: factory URL verification and fresh Axe scans
  passed on all main routes and the deliberate HTTP 404. The 404 h1 is now
  `Page not found`; phone’s first complete tile is y=763.52–834.34.
- Release identity: the live JS/CSS hashes exactly match the implementation.
  Its HTML/service worker markers name later Graphify-only commit `38c5149`;
  normalizing only the build marker makes them byte-identical to the candidate.

No product defect or untested claim remains. Existing uncommitted Graphify
files were preserved. Review evidence is under `/work/.evidence/pause-garden-review5/`.

## Result

The two strict-review findings are fixed and the repaired release is live.

- Implementation SHA: `e648ac2fcfedae0b2eedd27eb4c59f110c9ebabf`
- Verification/documentation SHA: `c3475bc4f2c4edfca9eb5dd5b25203c3abcae047`
- Live site: <https://pause-garden.sociobot.in>
- Live room service: <https://pause-garden-realtime.sociobot.in>

The later documentation commit does not change the deployed product. The three
pre-existing uncommitted Graphify files remain untouched and excluded.

## Independent verification 10

Verification 10 passed with zero findings and zero untested claims.

- Implementation reviewed: `e648ac2fcfedae0b2eedd27eb4c59f110c9ebabf`
- Documentation handoff: `39799318fd0daec3989a5b7d802c76ed388e4c2c`
- Later Graphify baseline: `38c51496ebc5fb2e6287ac9b09858fd4c19bbf79`
- Report: `.factory/verification-10.md`

An isolated clean checkout passed `npm ci --include=dev`, `npm audit
--audit-level=high`, every one of the 23 exact claim commands, `npm test`,
and `npm run build`. Fresh live desktop and phone checks showed the job,
audience, sample action, and a complete phone board tile before scrolling.
The sample completed, reset, and preserved a real-data sentinel while removing
only demo state. A two-client live run refreshed one player, reached the
turn-12 end screen in both browsers, and received 52 valid HTTP 429 responses
with `Retry-After: 2` in a 96-request allowance probe. Axe found zero
violations and mobile Lighthouse scored 100/100/100/100.

The live JS/CSS assets and realtime health match the implementation candidate.
The static HTML/service-worker marker records the later Graphify-only commit;
after replacing only that marker, each file is byte-identical to the candidate.
This is an allowed report/Graphify difference, not a product-image mismatch.

## What changed

- Tightened the phone hero spacing so the first complete sample bed is visible
  before scrolling. At 390 × 844 its measured bounds are y=763.52–834.34.
- Changed the missing-page h1 to **Page not found** and made its metadata
  description literal.
- Added outcome-based browser coverage for the full phone first-screen result
  and the rendered missing-page heading. The test measures browser geometry;
  it does not search implementation strings.
- Re-audited the page copy and recorded the responsive decision in the visual
  system.

## Clean verification

A detached clean checkout at the implementation SHA used Node 22.23.2, npm
10.9.8, and Playwright 1.58.2.

- `npm ci --include=dev`: passed; 66 locked packages installed.
- `npm audit --audit-level=high`: passed with zero vulnerabilities.
- Every exact command in `.factory/claims.json`: 23 of 23 passed separately.
- `npm test`: passed 8 game/server tests, 5 release-contract tests, 29 browser
  tests, and production-build isolation.
- `npm run build`: passed and produced `dist/`.
- `node scripts/verify-static-candidate.mjs`: passed.
- Production output: 290,563 bytes total; JavaScript 30,457 bytes and CSS
  13,087 bytes.
- Factory `verify-url.sh`: passed with no console errors.
- Axe CLI: zero violations on `/`, `/demo`, `/play`, `/privacy`, `/terms`, and
  the deliberate HTTP 404 page.

## Live verification

The durable paired release path preserved `/data`, minimum one replica, and
maximum one replica. Static assets and realtime `/health` both report the
implementation SHA; health reports SQLite storage.

- Fresh 1440 × 950 and 390 × 844 browsers showed the job, audience, sample
  action, next step, three facts, and game board before scrolling.
- The one-click MOSS sample contained 16 beds, three named players, weather,
  goals, history, and one sleeping player.
- Keyboard and touch runs reached **Garden restored** with 15 bloom points and
  the visitor request complete. The demo label stayed visible on the end
  screen.
- **Reset demo** restored turn 7 and 11/14. **Start for real** removed demo
  storage while a real-data sentinel remained unchanged.
- Two independent online clients reconnected after turn two, completed 12
  turns, and shared the **Chapter complete** end screen.
- The response-policy probe returned 53 HTTP 429 responses. Every one included
  `Retry-After: 2`.
- The 404 returned HTTP 404 with title **Page not found — Pause Garden**, one
  main landmark, and h1 **Page not found**.
- Offline reload retained all 16 sample beds and the offline notice. Reduced
  motion produced no mote canvas or running animations.
- Demo completion contacted only the Pause Garden static origin and opened no
  WebSocket. Median frame pacing was 59.88 FPS.
- Lighthouse mobile scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. FCP was 0.9 s, LCP 1.1 s, TBT 40 ms, CLS 0, and
  transfer was 45 KiB.

Evidence is under `/work/.evidence/pause-garden-repair8/` and the repair record
is `.factory/repair-8-reproduction.md`.

## Earlier finding disposition

All earlier findings remain fixed: remote room play and reconnect, stable frame
pacing, immutable asset caching, design/game agreement, deployment identity,
demo query entry, true HTTP 404 behavior, honest checkout state, complete claim
coverage, plain headings, README wording, 44 px targets, join-error association,
15-minute session copy, demo landmark structure, turn-12 completion, and
429/`Retry-After` behavior.

## Known dependency and next step

Host Edition remains unavailable because no live Sociobot billing offer is
registered. The site exposes no checkout or guessed price, and the free demo
and one online chapter still work. A billing operator must register an actual
one-time offer before a buy link or billing metadata can be published.

No product defect remains from strict review 4. The next step is an independent
strict review of the deployed implementation SHA above.
