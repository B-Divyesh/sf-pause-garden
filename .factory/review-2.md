# Pause Garden — restore a shared garden review 2

**Verdict: PASS — zero findings and zero untested claims.**

**Reviewed:** 2026-09-05 UTC

**Live URL:** <https://pause-garden.sociobot.in>

**Implementation candidate:** `18f0902ee3dfa3292f867287f43aca482d2117e7`

**Documentation baseline:** `9fd92008df8d0b5249d0004ea85425cc658fd2d1`

No product code was changed. The supplied checkout's three pre-existing
uncommitted Graphify files were preserved and excluded from this review.

## First screen

I opened fresh 1440 × 950 desktop and 390 × 844 phone contexts without
scrolling.

- Job: **Restore a garden, even when friends pause.**
- Audience: **For friends with interrupted evenings who still want each turn
  to matter.**
- First action: **Try it with sample data.** The adjacent text says a garden
  opens on turn seven with no setup.
- The first screen lists keyboard and touch controls, a private room without an
  account, and one free chapter.
- The populated sample preview begins in both viewports. It identifies room
  MOSS, turn 7 of 12, and a sleeping player. The first screen is not a menu
  wall.

Evidence:

- `/work/.evidence/pause-garden-review2-desktop-first.png`
- `/work/.evidence/pause-garden-review2-phone-first.png`

## Candidate and live release

The clean candidate was checked in a detached worktree at `18f0902`. Commits
after it do not alter the product runtime:

- `aca80d9` and `9fd9200` change only Graphify analysis files.
- `6c0ad90` changes only `.factory/verification-9.md` and the handoff.

Production carries the later Graphify marker `aca80d9` in its static manifest
and the implementation marker `18f0902` in realtime `/health`. This is the
work order's explicit later-report/Graphify exception, not a product mismatch:

- Live JavaScript is `/assets/main-OU0I22Qc.js`, 30,481 bytes, SHA-256
  `62d9ef917f13e74c92d297fe599aad3cc4cda6770c6de26ceb3cf4429e1300c2`.
- Live CSS is `/assets/main-Ce1lVhFR.css`, 13,044 bytes, SHA-256
  `47ad7025095ca47acb4af86cc8a13b40936b01ae1529b643f82723dbf0d6af3c`.
- Both hashed assets exactly match the clean candidate.
- Live `index.html` and `sw.js` have the same lengths as the candidate.
  Replacing only the embedded full and short `aca80d9` identifiers with
  `18f0902` makes both files byte-identical to the candidate.
- Realtime `/health` returns HTTP 200 with `ok: true`, `storage: "sqlite"`,
  and build `18f0902ee3dfa3292f867287f43aca482d2117e7`.

The exact-SHA wrapper `npm run verify:live-release` therefore reports the two
expected static-marker differences. Direct runtime comparison proves that no
later product image is present.

## Clean checkout and claims

The clean worktree used Node 22.23.2 and npm 10.9.8.
`npm ci --include=dev` installed all 66 locked packages. The high-severity npm
audit found zero vulnerabilities.

Every command in `.factory/claims.json` was run separately. All 23 passed.
Every declared claim ID appears in exactly one test, and no undeclared claim
tag exists.

| Claim | Result | Observable result |
| --- | --- | --- |
| `chapter-complete` | PASS | The sample action opened the win summary. |
| `restart-reset` | PASS | Replay returned to turn 1 and zero points. |
| `sleeping-handoff` | PASS | The group placed the sleeping player's queued token. |
| `remote-room-play` | PASS | Two browsers alternated 12 turns and shared the end screen. |
| `remote-reconnect` | PASS | The second browser refreshed after turn 2 and restored turn 3. |
| `settings-persist` | PASS | Sound remained off after reload. |
| `offline-reload` | PASS | A visited demo reloaded offline with its offline notice. |
| `privacy-same-origin` | PASS | Demo completion used only the static origin. |
| `keyboard-controls` | PASS | Keyboard and 390 px touch runs completed the sample. |
| `two-to-four-players` | PASS | Four-player setup stopped at four and showed a 12-turn room. |
| `session-length` | PASS | The first screen states 12 turns and 15 minutes. |
| `seed-determinism` | PASS | Equal seeds produced equal beds and first weather. |
| `weather-sequence` | PASS | Weather changed deterministically after actions. |
| `rendering-rate` | PASS | Median pacing met the 55 FPS threshold. |
| `free-chapter` | PASS | A room opened without an account or license. |
| `calm-private-rules` | PASS | Turn count was present; account and chat controls were absent. |
| `demo-isolation` | PASS | Demo storage stayed separate and both real-data sentinels survived. |
| `room-service-boundary` | PASS | Online play used only the static and configured room origins. |
| `room-storage-sqlite` | PASS | State survived a server process restart over one SQLite file. |
| `room-expiry` | PASS | A room older than 30 inactive days was removed. |
| `checkout-unavailable` | PASS | The control is disabled and no checkout link exists. |
| `build-identity` | PASS | Built metadata and footer use one source commit. |
| `production-default-build` | PASS | Production and isolated test builds use their intended room origins. |

The complete aggregate gate also passed: 8 game/server tests, 5 release
contract tests, 29 desktop/mobile browser tests, production-build isolation,
`npm run build`, and `node scripts/verify-static-candidate.mjs`. The production
build produced 30,481 bytes of JavaScript and 13,044 bytes of CSS.

I cross-checked the live landing page, game, legal pages, footer, README, and
copy audit against the manifest. No missing, false, incomplete, or unlisted
public claim remains.

## Sample game and recovery

The one-click sample opened room MOSS with seed MOSS-27, three named players,
16 populated beds, turn 7, current weather, chapter goals, recent actions, and
Jules sleeping. The banner **Demo — sample data, nothing is saved** remained
visible through play and the end screen.

Keyboard arrows moved focus from bed 1 to bed 3. The focused bed had a visible
3 px rain-blue outline. Enter tended bed 3 and opened **Garden restored** with
15 bloom points and the visitor request met. The same action by touch at
390 px reached the same win screen without horizontal overflow.

**Play this seed again** returned to turn 1 with zero points. **Reset demo**
restored the turn-7 sample. **Start for real** removed
`demo:pause-garden:room`; sentinels in `pause-garden:room` and
`pause-garden:room-session` remained unchanged. The complete sample made three
same-origin requests and opened no WebSocket.

Additional recovery checks passed:

- Pause moved focus to **Resume game**. Escape closed the dialog and returned
  focus to **Pause game**.
- Sound remained off after reload.
- Code `ABC` produced the five-character correction in the join form.
- Missing room `AAAAA` produced a clear check-and-retry message.
- Player setup stopped at four and disabled **Add player**.
- At 200% text size, the heading, board, and all three tools remained present
  with no horizontal overflow.

End-screen evidence:

- `/work/.evidence/pause-garden-review2-demo-win.png`
- `/work/.evidence/pause-garden-review2-phone-win.png`

## Multiplayer and backend

Two independent live browser contexts created room `737BW`, joined by code and
name, alternated all 12 turns, and refreshed the second browser after turn 2.
Both clients reached **Chapter complete** with the same 0 of 14 loss summary.
The end screen offered **Play this seed again** and **Start a new room**.

Two separate live rooms, `XVE2M` and `8RSVN`, proved isolation. Advancing the
first to turn 2 left the second at turn 1. The clean server claim test stopped
and reopened the store over the same temporary SQLite file and retained room
state. Production was not restarted; the persistence claim is exercised by
the isolated restart test without affecting live players.

The live behavior check sent 96 requests to the product's status endpoint.
It observed 42 HTTP 200 responses and 54 HTTP 429 responses. Every limited
response included `Retry-After: 2`.

Evidence:

- `/work/.evidence/pause-garden-review2-remote-end-host.png`
- `/work/.evidence/pause-garden-review2-remote-end-friend.png`
- `/work/.evidence/pause-garden-review2-multiplayer.json`

## Accessibility, privacy, routes, and performance

- Playwright Axe 4.10.2 found zero violations on `/`, `/demo`, `/play`,
  `/privacy`, `/terms`, the designed 404, the pause dialog, and desktop and
  phone end dialogs.
- Every valid route returned HTTP 200 with `lang="en"`, one h1, one main
  landmark, and its own plain title. Privacy and terms were readable. Product
  routes, robots, sitemap, social image, favicon, and touch icon returned 200.
  Email links are valid `mailto:` targets. The cross-product Param Factory
  link was not fetched because this work order forbids connecting to another
  product.
- `/review-2-missing` returned the expected HTTP 404 with the designed title,
  one h1, one main landmark, and return actions. This deliberate 404 is not a
  defect.
- The service worker was active with no waiting update. After the first visit,
  the demo reloaded offline with its board and offline notice.
- Reduced-motion mode created no mote canvas and exposed no running animation.
- The factory URL verifier returned HTTP 200 in 567 ms with no console or page
  errors, one h1/main, title, language, alt text, and labelled buttons.
- Live 90-frame median pacing was 59.88 FPS.
- Lighthouse mobile scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. FCP was 0.9 s, LCP 1.1 s, TBT 20 ms, CLS 0, and
  transfer size 45 KiB.
- Live headers include HSTS, `nosniff`, strict-origin referrer policy, a
  restrictive CSP with response-header `frame-ancestors 'none'`, and
  permissions policy. Hashed assets use one-year immutable caching; `sw.js`
  uses `no-cache`.

The full browser evidence is
`/work/.evidence/pause-garden-review2-live.json`; Lighthouse evidence is
`/work/.evidence/pause-garden-review2-lighthouse.json`.

## Earlier finding disposition

| Earlier finding | Current proof and disposition |
| --- | --- |
| Initial P0: no remote room or reconnect | Fixed. Two independent live clients join, synchronize, refresh, reconnect, and finish. |
| Initial P1: full-suite frame-rate failure | Fixed. Standalone claim, aggregate suite, and live 59.88 FPS measurement pass. |
| Initial P2: hashed assets lacked immutable caching | Fixed. Live JS and CSS use one-year immutable caching. |
| Initial P2: implementation differed from the visual thesis | Fixed. The generated greenhouse, dark garden palette, editorial type, clipped panels, and reduced-motion treatment match `.factory/design.md`. |
| Verification 2 P1 and review F-1-2: deployed artifact mismatch | Fixed for runtime. Live JS/CSS match the candidate; only the allowed later Graphify marker differs in HTML and the service worker. |
| Verification 3 P3 and review F-1-3: `/?demo=1` opened the landing page | Fixed. It becomes `/demo`, seeds demo-only storage, and shows the banner. |
| Verification 3 P3 and review F-1-4: unknown URLs returned 200 | Fixed. The designed missing page returns HTTP 404. |
| Review F-1-1: dead Host Edition checkout | Fixed. Sale controls are disabled and no checkout link exists. |
| Review F-1-5: seven unlisted or incomplete claims | Fixed. Touch, weather, service boundary, SQLite, expiry, demo isolation, and sale availability all have passing observable tests; obsolete license claims are absent. |
| Review F-1-6 minor: slogan headings | Fixed. Current headings name the task or section in plain words. |
| Review F-1-7 minor: README jargon and long sentence | Fixed. Current README uses the audited terms and short sentences. |
| Verification 4 P1: production differed from candidate | Fixed under the same runtime/Graphify proof above. |
| Verification 4 P2: mobile links below 44 px | Fixed. The regression test passes at 390 px. |
| Verification 4 P2: malformed join error attached to the wrong form | Fixed. `#join-error` holds the message and the join inputs reference it. |
| Verification 4 P2: 15-minute session undocumented | Fixed. Landing and README state 15 minutes; the claim passes. |
| Verification 4 P3: demo skip-link Axe issue | Fixed. Current Axe scans report zero violations. |
| Verifications 5–8: stale or mixed deployed components | Fixed at implementation release `18f0902`; current static runtime and realtime behavior match it. The later static marker is Graphify-only. |
| Verification 6 P1: remote chapter did not end at turn 12 | Fixed. Both current live clients reached the turn-12 end screen. |
| Verification 6 P1: no live 429 response | Fixed. The current probe returned 54 limited responses, all with `Retry-After: 2`. |

## Findings

None.

## Final decision

**PASS — zero findings and zero untested claims.**
