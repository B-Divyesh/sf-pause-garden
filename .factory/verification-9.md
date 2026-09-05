# Verify a pause-friendly online garden game — PASS

**Verdict: PASS**

**Findings:** 0

**Untested claims:** 0

**Implementation candidate:** `18f0902ee3dfa3292f867287f43aca482d2117e7`

**Documentation/Graphify baseline:** `aca80d9c9d42ebf2a2ca9ff5421ba97b8b22384f`

**Live URL:** <https://pause-garden.sociobot.in>

**Verified:** 2026-09-05 UTC

## First screen

Fresh 1440 × 950 desktop and 390 × 844 phone contexts were opened without
scrolling.

- Job: **“Restore a garden, even when friends pause.”**
- Audience: **“For friends with interrupted evenings who still want each turn
  to matter.”**
- First action: **“Try it with sample data.”** The next sentence says the
  garden opens on turn seven with no setup.
- The populated 4 × 4 garden preview is visible on both first screens. The
  first screen is the game, not a menu wall.

Screenshots:

- `/work/.evidence/pause-garden-desktop-first-screen.png`
- `/work/.evidence/pause-garden-phone-first-screen.png`

## Candidate and live release

The implementation was checked from a detached clean worktree at `18f0902`.
The supplied repository is at later commit `aca80d9`; `git diff
18f0902..aca80d9` changes only four `graphify-out` analysis/cache files. It
does not change product code, tests, public documentation, or assets.

Production currently records `aca80d9` in the static manifest and `18f0902`
in realtime `/health`. This is the work order's explicit later-Graphify
exception:

- Live JS is exactly the candidate: `main-OU0I22Qc.js`, 30,481 bytes,
  SHA-256 `62d9ef917f13e74c92d297fe599aad3cc4cda6770c6de26ceb3cf4429e1300c2`.
- Live CSS is exactly the candidate: `main-Ce1lVhFR.css`, 13,044 bytes,
  SHA-256 `47ad7025095ca47acb4af86cc8a13b40936b01ae1529b643f82723dbf0d6af3c`.
- Live `index.html` and `sw.js` have the same byte lengths as the candidate.
  Replacing only the embedded full and short `aca80d9` identifiers with
  `18f0902` makes both files byte-identical to the candidate.
- Realtime `/health` returns HTTP 200 with `ok: true`, `storage: "sqlite"`,
  and build `18f0902ee3dfa3292f867287f43aca482d2117e7`.

`npm run verify:live-release` therefore exits nonzero when its exact expected
SHA is `18f0902`, because the static wrapper records later Graphify commit
`aca80d9`. The runtime comparison above proves there is no later product
image. Under the stated comparison contract, this is not a finding.

## Clean checkout and claim commands

The clean candidate worktree used Node 22.23.2 and npm 10.9.8.
`npm ci --include=dev` installed the 66 locked packages. `npm audit
--audit-level=high` found zero vulnerabilities.

- `npm test`: 8 game/server tests, 5 release-contract tests, 29 desktop/mobile
  Playwright tests, and production-build isolation passed.
- `npm run build`: client and server type checks passed and `dist/` was
  produced.
- `node scripts/verify-static-candidate.mjs`: passed.
- Output: JS 30,481 bytes; CSS 13,044 bytes; complete `dist/` 290,553 bytes.

Every command in `.factory/claims.json` was run separately from the clean
candidate. All 23 passed. Full outputs are in
`/work/.evidence/pause-garden-verify9-claims/`.

| Claim | Result | Observable proof |
| --- | --- | --- |
| `chapter-complete` | PASS | Sample action opened the win summary. |
| `restart-reset` | PASS | Replay returned to turn 1 and zero points. |
| `sleeping-handoff` | PASS | The group placed Mara's queued token. |
| `remote-room-play` | PASS | Two browsers alternated 12 turns and shared the end screen. |
| `remote-reconnect` | PASS | The second browser refreshed after turn 2 and restored turn 3. |
| `settings-persist` | PASS | Sound remained off after reload. |
| `offline-reload` | PASS | A visited demo reloaded offline with its offline notice. |
| `privacy-same-origin` | PASS | Demo completion used only the static origin. |
| `keyboard-controls` | PASS | Keyboard and 390 px touch runs completed the sample. |
| `two-to-four-players` | PASS | Four-player setup created four player rows and a 12-turn room. |
| `session-length` | PASS | The first screen states 12 turns and 15 minutes. |
| `seed-determinism` | PASS | Equal seeds produced equal beds and first weather. |
| `weather-sequence` | PASS | Weather changed deterministically after actions. |
| `rendering-rate` | PASS | Median pacing met the 55 FPS threshold. |
| `free-chapter` | PASS | A room opened without an account or license. |
| `calm-private-rules` | PASS | Turn count was present; account and chat controls were absent. |
| `demo-isolation` | PASS | Demo storage was separate and a real-data sentinel was preserved. |
| `room-service-boundary` | PASS | Online play used only the static and configured room origins. |
| `room-storage-sqlite` | PASS | State and reconnect data survived a server restart over one SQLite file. |
| `room-expiry` | PASS | A room older than 30 inactive days was removed. |
| `checkout-unavailable` | PASS | The unavailable control is disabled and no checkout link exists. |
| `build-identity` | PASS | Built metadata and footer use one source commit. |
| `production-default-build` | PASS | Default production and isolated test bundles use their intended room origins. |

The live landing page, legal copy, game copy, footer, and README were checked
against the manifest. No missing, false, incomplete, or unlisted public claim
was found.

## Game and demo behavior

The live sample opened room MOSS, seed MOSS-27, on turn 7 with Mara, sleeping
Jules, Noor, 16 populated beds, goals, weather, and history. The persistent
banner said **“Demo — sample data, nothing is saved”** before and after play.

Tending bed 3 reached **Garden restored**, with 15 bloom points and the visitor
request met. **Reset demo** restored turn 7. **Start for real** removed
`demo:pause-garden:room`. A preloaded `pause-garden:room` sentinel was unchanged
after play, reset, and exit. A fresh demo run made three same-origin requests
and opened no WebSocket.

Separate live checks also proved:

- Arrow keys moved focus to bed 3; Enter reached the win screen. The focus
  outline was a visible 3 px rain-blue line.
- Touch reached the same win screen at 390 px with no horizontal overflow.
- Marking Mara sleeping let the group place her queued token and recorded that
  action in the log.
- Sound remained off after reload.
- Pause moved focus to **Resume game**; Escape closed the dialog and returned
  focus to **Pause game**.
- Malformed code `ABC`, absent room `AAAAA`, and blank player names gave the
  correct recovery messages. The player count stopped at four.

Win evidence: `/work/.evidence/pause-garden-demo-win.png` and
`/work/.evidence/pause-garden-phone-win.png`.

## Multiplayer and backend

Two independent live contexts created and joined room `KCAXP`. They alternated
12 valid actions. The second browser refreshed and reconnected after turn 2.
Both reached **Chapter complete** with the same `0 / 14` loss summary. **Play
this seed again** returned the room to turn 1. End-screen captures:

- `/work/.evidence/pause-garden-remote-end-host.png`
- `/work/.evidence/pause-garden-remote-end-friend.png`

Two other live contexts created rooms `2LMDP` and `LW3S8`. Advancing the first
to turn 2 left the second at turn 1, proving room isolation. The clean server
test reopened the same SQLite file and retained room state. Production was not
restarted because verification did not authorize an availability-impacting
operation.

The supplied live behavior command independently created room `VGHBQ`,
reconnected after turn 2, reached **Chapter complete** at turn 12, and probed
96 requests: 42 returned 200 and 54 returned 429. Every limited response had
`Retry-After: 2`.

## Accessibility, routes, privacy, and performance

- Playwright Axe 4.10.2 found zero violations on `/`, `/demo`, `/play`,
  `/privacy`, `/terms`, the 404 page, pause dialog, end dialog, and mobile end
  dialog.
- Every valid route returned 200 with its own title, `lang="en"`, one h1, and
  one main landmark. The legal pages were readable. All product-owned links
  returned 200; both email links were valid `mailto:` targets. The external
  Param Factory link was not fetched because this work order forbids access to
  other product services.
- The designed missing page returned HTTP 404, the title **“Page not found —
  Pause Garden”**, and a working return-home link. Its one browser resource
  error is the expected deliberate 404, not a defect.
- The active service worker updated with no waiting worker. A fresh demo then
  reloaded offline and kept the board and offline status.
- Reduced-motion mode created no mote canvas and reported no running
  animations. At 200% text size the heading, board, and tools remained present
  without horizontal overflow.
- Previously short mobile links now measure 44 px high. All tested touch
  targets meet the minimum.
- Factory `verify-url.sh`: HTTP 200, 673 ms load, no errors, correct title,
  language, h1, main, alt text, and button names.
- Live 90-frame median: 59.88 FPS.
- Lighthouse mobile: performance 100, accessibility 100, best practices 100,
  SEO 100; FCP 0.90 s, LCP 1.05 s, TBT 46.5 ms, CLS 0; 46,254 bytes
  transferred.
- Headers include HSTS, `nosniff`, strict-origin referrer policy, restrictive
  CSP with response-header `frame-ancestors 'none'`, and permissions policy.
  Hashed JS uses one-year immutable caching; `sw.js` uses `no-cache`.

Full browser measurements are in
`/work/.evidence/pause-garden-verify9-live.json`; Lighthouse JSON is in
`/work/.evidence/pause-garden-lighthouse.json`.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Initial P0: no remote room or reconnect | Fixed. Two independent live clients join, reconnect, synchronize, and finish. |
| Initial P1: frame-rate claim failed in the full suite | Fixed. Aggregate, claim-only, and live 59.88 FPS checks pass. |
| Initial P2: hashed assets lacked immutable caching | Fixed. Live JS/CSS return one-year immutable caching. |
| Initial P2: implementation did not match the visual thesis | Fixed. The generated greenhouse, palette, type, layout, and motion match `.factory/design.md`. |
| Verification 2 P1 and Review F-1-2: static artifact mismatch | Fixed for product runtime. Candidate JS/CSS match exactly; the later static SHA is Graphify-only as documented above. |
| Verification 3 P3 and Review F-1-3: `/?demo=1` did not open the demo | Fixed. It becomes `/demo`, shows the banner, and uses demo-only storage. |
| Verification 3 P3 and Review F-1-4: unknown routes returned 200 | Fixed. The designed page returns HTTP 404. |
| Review F-1-1: dead Host Edition checkout | Fixed. Sale controls are disabled and no checkout link exists. |
| Review F-1-5: seven public claims lacked tests | Fixed. Touch, room boundary, weather, SQLite, expiry, demo isolation, and unavailable checkout claims have observable tests; obsolete license claims were removed. |
| Review F-1-6 minor: slogan headings | Fixed. Current headings name their sections in plain words. |
| Review F-1-7 minor: README jargon and overlong sentence | Fixed. Current README uses the audited terms and short sentences. |
| Verification 4 P2: mobile links below 44 px | Fixed. All six previously named targets measure 44 px high. |
| Verification 4 P2: malformed join error attached to the wrong form | Fixed. The message appears in `#join-error`, referenced by the join inputs. |
| Verification 4 P2: 15-minute session was undocumented | Fixed. Landing and README state 15 minutes; the claim passes. |
| Verification 4 P3: demo skip link caused an Axe region issue | Fixed. Full Axe scans report zero violations. |
| Verifications 5–8: stale or mixed deployed components | Fixed at implementation release `18f0902`; the regression and deployment-order contracts pass. The current later static marker is only the allowed Graphify baseline. |
| Verification 6 P1: remote chapter did not end at turn 12 | Fixed. Two independent current live runs reached **Chapter complete** at turn 12. |
| Verification 6 P1: live response allowance returned no 429 | Fixed. Current probe returned 54 limited responses with `Retry-After: 2`. |

## Findings

None.

## Final decision

**PASS — zero findings and zero untested claims.** No product code was changed.
The pre-existing uncommitted `graphify-out` files in the supplied checkout were
preserved and excluded from this verification commit.
