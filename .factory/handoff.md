# Pause Garden repair 8 handoff

## Result

The two strict-review findings are fixed and the repaired release is live.

- Implementation SHA: `e648ac2fcfedae0b2eedd27eb4c59f110c9ebabf`
- Verification/documentation SHA: `c3475bc4f2c4edfca9eb5dd5b25203c3abcae047`
- Live site: <https://pause-garden.sociobot.in>
- Live room service: <https://pause-garden-realtime.sociobot.in>

The later documentation commit does not change the deployed product. The three
pre-existing uncommitted Graphify files remain untouched and excluded.

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
