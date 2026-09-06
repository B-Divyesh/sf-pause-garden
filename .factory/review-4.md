# Restore a shared garden — review 4

**Verdict: FAIL — 2 findings and 0 untested claims.**

**Reviewed:** 2026-09-06 UTC

**Live URL:** <https://pause-garden.sociobot.in>

**Implementation candidate:** `18f0902ee3dfa3292f867287f43aca482d2117e7`

**Documentation baseline:** `465335287411c7f2c5cdadd55535455e70fe5e17`

**Work-order repository baseline:** `5f20887cb18c2c1860d17a786c975fe1573c9024`

No product code was changed. The three pre-existing uncommitted Graphify files
were preserved and excluded from this review.

## Findings

### F-4-1 — P2 — the phone first screen does not show the game board

At 390 × 844 and scroll position zero, the job, audience, and sample action
are visible. The preview container begins at y=805.4, but the board begins at
y=877.5. No board tile is visible in the first viewport. Only 38.6 px of the
preview container and 20.6 px of its room label are visible.

This fails the browser-game requirement to show the game itself on the first
screen. The page is not a menu wall, but a room label without any bed or game
control is not a playable-game preview.

Required correction: move a meaningful part of the board into the 390 × 844
first viewport while retaining the job, audience, sample action, and its next
step. Then recapture the fresh phone first screen.

Evidence:

- `/work/.evidence/pause-garden-review4-phone-first-screen.png`
- `/work/.evidence/pause-garden-review4/phone-first-metrics.txt`

### F-4-2 — P3 — the 404 h1 is metaphorical

The missing-page title correctly says **Page not found — Pause Garden**, but
its h1 says **This path does not reach the garden**. That is a garden metaphor,
not the plain name of the page. It fails the plain-words rule that headings
must name the section or state without metaphor or brand lore.

Required correction: use **Page not found** as the h1. The existing recovery
sentence and return links can remain.

## First screen

Fresh 1440 × 950 desktop and 390 × 844 phone contexts opened without scrolling.

- Job: **Restore a garden, even when friends pause.**
- Audience: **For friends with interrupted evenings who still want each turn
  to matter.**
- First action: **Try it with sample data.** The adjacent text says a garden
  opens on turn seven with no setup.
- Desktop shows the populated room MOSS board in the first viewport.
- Phone shows the three required facts but not a board tile. See F-4-1.

Evidence:

- `/work/.evidence/pause-garden-review4-desktop-first-screen.png`
- `/work/.evidence/pause-garden-review4-phone-first-screen.png`

## Candidate and live release

The implementation was rebuilt from detached clean checkout `18f0902`. The
live realtime `/health` response reports `ok: true`, `storage: "sqlite"`, and
that implementation SHA.

The live static shell records
`aca80d9c9d42ebf2a2ca9ff5421ba97b8b22384f`, while the current repository is
later because of reports and Graphify output. Product runtime still matches
the implementation candidate:

- Live `main-OU0I22Qc.js` is 30,481 bytes and exactly matches candidate SHA-256
  `62d9ef917f13e74c92d297fe599aad3cc4cda6770c6de26ceb3cf4429e1300c2`.
- Live `main-Ce1lVhFR.css` is 13,044 bytes and exactly matches candidate
  SHA-256 `47ad7025095ca47acb4af86cc8a13b40936b01ae1529b643f82723dbf0d6af3c`.
- Live `index.html` and `sw.js` have the same byte lengths as the candidate.
  Replacing only their full and short `aca80d9` markers with `18f0902` makes
  both files byte-identical.

`npm run verify:live-release` correctly exits 1 because it compares the
embedded markers literally. The exact runtime comparison above proves this is
the work order's allowed later Graphify/report marker, not a product-image
mismatch. `npm run verify:live-realtime` and `npm run verify:live-behavior`
both pass.

## Claims and clean checkout

The clean candidate used Node 22.23.2, npm 10.9.8, Playwright 1.58.2, and
Vitest 3.2.7. `npm ci --include=dev` installed 66 locked packages and `npm
audit --audit-level=high` found zero vulnerabilities.

Every exact command in `.factory/claims.json` was run separately. All 23
passed, and each retained claim has exactly one matching test tag:

| Claims | Result |
| --- | --- |
| `chapter-complete`, `restart-reset`, `sleeping-handoff` | PASS |
| `remote-room-play`, `remote-reconnect`, `settings-persist` | PASS |
| `offline-reload`, `privacy-same-origin`, `keyboard-controls` | PASS |
| `two-to-four-players`, `session-length`, `seed-determinism` | PASS |
| `weather-sequence`, `rendering-rate`, `free-chapter` | PASS |
| `calm-private-rules`, `demo-isolation`, `room-service-boundary` | PASS |
| `room-storage-sqlite`, `room-expiry`, `checkout-unavailable` | PASS |
| `build-identity`, `production-default-build` | PASS |

The aggregate `npm test` passed 8 game/server tests, 5 release-contract tests,
29 browser tests, and production-artifact isolation. `npm run build` and
`node scripts/verify-static-candidate.mjs` passed. Output `dist/` is 290,553
bytes: initial JavaScript is 30,481 bytes and CSS is 13,044 bytes.

The live landing, setup, game, footer, legal pages, metadata, README, demo
guide, and claim manifest were cross-checked. No missing, false, incomplete,
or untested public claim was found. The two findings are contract and copy
defects, not untested claims.

## Sample, controls, and end screens

The one-click sample opened room MOSS, seed MOSS-27, on turn 7 with three named
players, 16 populated beds, goals, weather, history, and Jules sleeping. The
**Demo — sample data, nothing is saved** label remained visible during play and
on the end screen.

- Marking Mara sleeping let the group place her queued token and wrote that
  action to the history.
- **Reset demo** restored the known turn-7 sample before and after completion.
- A real-data sentinel survived demo play, reset, and **Start for real**. Demo
  session storage was discarded on exit.
- Arrow keys moved focus to bed 3 and Enter reached **Garden restored** with 15
  bloom points and the visitor request complete.
- Touch at 390 px reached the same win screen without horizontal overflow.
- Sound stayed off after reload. Pause focused **Resume game**; Escape closed
  the dialog and returned focus to **Pause game**.
- The focused bed had a visible 3 px rain-blue outline.

The deterministic desktop, phone, remote-host, and remote-friend runs were
recorded. End-screen evidence:

- `/work/.evidence/pause-garden-review4-desktop-win.png`
- `/work/.evidence/pause-garden-review4-phone-win.png`
- `/work/.evidence/pause-garden-review4-remote-end-host.png`
- `/work/.evidence/pause-garden-review4-remote-end-friend.png`
- `/work/.evidence/pause-garden-review4-desktop-run.webm`
- `/work/.evidence/pause-garden-review4-phone-run.webm`
- `/work/.evidence/pause-garden-review4-remote-host-run.webm`
- `/work/.evidence/pause-garden-review4-remote-friend-run.webm`

## Multiplayer and backend

Two independent live clients created and joined one five-character room. They
alternated all 12 turns. The second client refreshed after turn 2 and returned
at turn 3. Both reached the same **Chapter complete** loss summary with 0/14
points. **Play this seed again** synchronized both clients at turn 1 and 0/14.

Two other fresh clients created distinct rooms. Advancing the first to turn 2
left the second at turn 1, proving live tenant isolation. The controlled
SQLite restart claim reopened one temporary database and retained its room;
production was not restarted because a review must not interrupt the live
service.

The supplied live behavior probe completed another two-client 12-turn run and
made 96 allowed room-service requests: 43 returned 200 and 53 returned 429.
Every limited response included `Retry-After: 2`.

Malformed code `ABC`, missing room `AAAAA`, whitespace-only names, and the
four-player maximum produced the documented recovery or boundary state.

## Accessibility, privacy, routes, and performance

- Factory `verify-url.sh` passed at HTTP 200 in 567 ms with the correct title,
  `lang=en`, one h1, one main, alt text, labelled buttons, and no errors.
- Axe 4.10.2 found zero violations on `/`, `/demo`, `/play`, `/privacy`,
  `/terms`, the designed 404, the pause dialog, and the end dialog.
- The skip link receives a 3 px visible focus ring and skips header controls;
  the next Tab reaches the sample action. Main content has a usable
  accessibility tree. No keyboard trap was found.
- All 35 visible phone controls at the end state measured at least 44 px. At
  200% text, the heading, board, and tools remained present with no horizontal
  overflow.
- Reduced-motion mode created no mote canvas and reported no running
  animations. Nothing flashes.
- The service worker updated with no waiting worker. A fresh visited demo then
  reloaded offline with its board and offline notice.
- Demo play requested only `https://pause-garden.sociobot.in` and opened no
  WebSocket. Online play used only that origin and the product-owned realtime
  WebSocket. No analytics, CDN script, or third-party font was observed.
- Valid routes returned 200 with unique titles, descriptions, canonicals, one
  h1, and one main. The legal pages state storage, removal, contacts, and sale
  availability. All product-owned links returned 200; mail links are valid.
  The external Param Factory link was not fetched because the work order
  forbids connecting to another product.
- The missing path correctly returned HTTP 404. Its one browser resource
  error is the expected deliberate 404, not a defect. Its h1 has the separate
  wording defect F-4-2.
- Hashed assets use one-year immutable caching. `sw.js` uses `no-cache`.
  Security headers include HSTS, `nosniff`, a restrictive CSP with
  response-header `frame-ancestors 'none'`, referrer policy, and permissions
  policy.
- Live 90-frame median pacing was 59.88 FPS.
- Lighthouse mobile scored 97 performance, 100 accessibility, 100 best
  practices, and 100 SEO. FCP was 1.67 s, LCP 2.35 s, TBT 0 ms, CLS 0, and
  transfer was 46,263 bytes.

Detailed evidence is under `/work/.evidence/pause-garden-review4/` and
`/work/.evidence/pause-garden-review4-live.json`.

## Earlier finding disposition

| Earlier finding | Current disposition |
| --- | --- |
| Initial P0: no remote room or reconnect | Fixed. Two independent live clients join, reconnect, synchronize, and finish. |
| Initial P1: full-suite frame-rate failure | Fixed. Claim-only, aggregate, and live 59.88 FPS checks pass. |
| Initial P2: hashed assets lacked immutable caching | Fixed. Live JS and CSS use one-year immutable caching. |
| Initial P2: visual thesis differed from implementation | Fixed. The generated greenhouse, palette, type, layout, and motion match `.factory/design.md`. |
| Verification 2 and review 1: static artifact mismatch | Fixed for product runtime. JS/CSS match exactly; only the allowed later Graphify marker differs in the shell. |
| Verification 3 and review 1: `/?demo=1` failed | Fixed. The query enters `/demo` with demo-only storage. |
| Verification 3 and review 1: unknown routes returned 200 | Fixed. The designed page returns HTTP 404. Its new plain-words finding is F-4-2. |
| Review 1: dead Host Edition checkout | Fixed. Sale controls are disabled and there is no checkout link. |
| Review 1: seven public claims lacked tests | Fixed. All retained claims have observable tests; obsolete license claims are absent. |
| Review 1: slogan headings and README wording | Fixed on the previously cited pages. The newly reviewed 404 h1 still fails the same plain-words rule; see F-4-2. |
| Verification 4: mobile links below 44 px | Fixed. Current visible phone controls meet 44 px. |
| Verification 4: join error attached to the wrong form | Fixed. The error is in `#join-error` and referenced by the join fields. |
| Verification 4: 15-minute session undocumented | Fixed. Landing and README state it; the claim passes. |
| Verification 4: demo skip-link Axe issue | Fixed. Current Axe audits have zero violations. |
| Verifications 5–8: stale or mixed deployed components | Fixed at implementation `18f0902`; runtime assets and realtime health match it. The later static marker is report/Graphify-only. |
| Verification 6: remote chapter did not end at turn 12 | Fixed. Both live clients reached the turn-12 end screen. |
| Verification 6: live allowance returned no 429 | Fixed. The fresh probe returned 53 limited responses with `Retry-After: 2`. |

## Final decision

**FAIL — 2 findings and 0 untested claims.**

The complete game and every declared claim work, but PASS requires zero
findings. F-4-1 and F-4-2 must be corrected and reviewed again.
