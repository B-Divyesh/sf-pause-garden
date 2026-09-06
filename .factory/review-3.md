# Pause Garden — restore a shared garden review 3

**Verdict: PASS — zero findings and zero untested claims.**

**Reviewed:** 2026-09-06 UTC  
**Live URL:** <https://pause-garden.sociobot.in>  
**Implementation candidate:** `18f0902ee3dfa3292f867287f43aca482d2117e7`  
**Documentation SHA:** `aacaa334b053b581b373e31ca66e7d01a5b66ccf`

No product code was changed. The pre-existing uncommitted Graphify files were
preserved and excluded.

## First screen

Fresh 1440 × 950 desktop and 390 × 844 phone browsers opened at scroll
position zero. Both immediately showed the garden preview; neither showed a
menu wall.

- Job: **Restore a garden, even when friends pause.**
- Audience: **For friends with interrupted evenings who still want each turn to
  matter.**
- First action: **Try it with sample data.** It says a garden opens on turn
  seven with no setup.
- The visible preview identifies room MOSS, turn 7 of 12, and Jules sleeping.

Evidence: `/work/.evidence/pause-garden-review3-desktop-first.png` and
`/work/.evidence/pause-garden-review3-phone-first.png`.

## Candidate and live release

The candidate was rebuilt in a detached clean worktree at `18f0902`. The live
room service `/health` returned `ok: true`, `storage: "sqlite"`, and the same
implementation SHA. The live static manifest carries
`aca80d9c9d42ebf2a2ca9ff5421ba97b8b22384f`, a later Graphify-only marker.
This is the documented report/Graphify exception, not a runtime change:

- `/assets/main-OU0I22Qc.js` was 30,481 bytes and matched the candidate
  SHA-256 `62d9ef917f13e74c92d297fe599aad3cc4cda6770c6de26ceb3cf4429e1300c2`.
- `/assets/main-Ce1lVhFR.css` was 13,044 bytes and matched the candidate
  SHA-256 `47ad7025095ca47acb4af86cc8a13b40936b01ae1529b643f82723dbf0d6af3c`.

Evidence: `/work/.evidence/pause-garden-review3-release-identity.json`.

## Game, demo, and recovery

`/?demo=1` redirected to `/demo`, loaded the MOSS sample, and showed the
persistent **Demo — sample data, nothing is saved** banner. The populated
sample had seed MOSS-27, three named players, 16 beds, turn 7, score 11/14,
two cared beds, weather, history, and Jules sleeping. Its only stored room
state was `demo:pause-garden:room`; no real-room key was present.

Keyboard play completed the sample by focusing bed 3 and pressing Enter. Touch
play at 390 px completed the same run. Both showed **Garden restored** and the
summary of 15 bloom points and the visitor request. **Reset demo** restored
turn 7, score 11/14, and the banner. Sound remained off after reload. The
pause dialog initially focused Resume, and Escape returned focus to Pause.

The request log for the complete demo flow contained only
`https://pause-garden.sociobot.in`. The demo did not open a room WebSocket.

Evidence:

- `/work/.evidence/pause-garden-review3-live-browser.json`
- `/work/.evidence/pause-garden-review3-desktop-win.png`
- `/work/.evidence/pause-garden-review3-phone-win.png`

## Multiplayer, isolation, and response policy

The live behavior run created room `G6F5B` in one browser, joined it in an
independent browser, alternated all 12 turns, refreshed the second client
after turn 2, and observed **Chapter complete** in both clients. The same run
made 96 product-room status requests: 44 returned 200 and 52 returned 429.
Every 429 included `Retry-After: 2`.

The clean SQLite tests reopened one temporary database after a restart and
retained room state. Their isolation test used a temporary test database only;
no shared database or other product was contacted.

Evidence: `/tmp/pause-garden-review3/release-evidence/live-behavior.json`.

## Claims and clean checkout

A fresh detached checkout used Node 22.23.2 and npm 10.9.8. `npm ci
--include=dev` succeeded; `npm audit --audit-level=high` found zero
vulnerabilities. Every exact command declared in `.factory/claims.json` passed
separately, with one observable test tag for each claim:

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

The aggregate `npm test` passed 8 unit/server tests, 5 release-contract tests,
29 browser tests, and production-artifact isolation. `npm run build` produced
`dist/`; `node scripts/verify-static-candidate.mjs` passed. The detailed
per-command results are in
`/tmp/pause-garden-review3-evidence/claim-results.json`.

I cross-checked the live landing, game, legal pages, footer, README, and
metadata with the claim manifest. Every visitor-facing functional, privacy,
availability, and performance claim has a manifest entry and observable test.
The generated-scenery disclosure is supported by the recorded asset prompt and
provenance in `.factory/design.md`; it is provenance, not an untestable runtime
promise. No claim is missing, false, incomplete, or untested.

## Accessibility, routes, offline, and performance

- The factory URL check passed: HTTP 200, 576 ms load, title, `lang=en`, one
  h1, main, image alt text, and labelled buttons; no console errors.
- Axe 4.10.2 found zero violations on `/`, `/demo`, `/play`, `/privacy`,
  `/terms`, and the missing-page view. The deliberate missing URL returned HTTP
  404, title **Page not found — Pause Garden**, one main, and a working return
  home link. Its expected 404 resource console entry is not a defect.
- Fresh offline reload after service-worker control retained the sample board,
  turn 7, and **Offline — demo turns still save here**. The active registration
  had no waiting worker.
- Under reduced motion there was no mote canvas and no running animation.
  At 200% text zoom, the heading, board, and all three tools remained present
  without horizontal overflow. The phone run had no horizontal overflow; all
  visible tested controls were at least 44 px in both dimensions.
- Lighthouse mobile: performance 98, accessibility 100, best practices 100,
  SEO 100; FCP 1.4 s, LCP 2.1 s, TBT 0 ms, CLS 0, and 45 KiB transferred.

Evidence: `/work/.evidence/pause-garden-review3-verify-url/verify.json`,
`/work/.evidence/pause-garden-review3-offline.json`, and
`/work/.evidence/pause-garden-review3-lighthouse.json`.

All internal product links resolved successfully. The external Param Factory
link was not fetched because this work order prohibits connecting to another
product; it is correctly marked as opening a new tab.

## Earlier findings

| Earlier finding | Current disposition |
| --- | --- |
| Initial remote play/reconnect P0 | Fixed; two live independent clients reconnect and finish. |
| Initial frame-rate P1 | Fixed; claim passes and the fresh Lighthouse measurement is within budget. |
| Initial immutable-assets and visual-thesis P2s | Fixed; assets are immutable and the live greenhouse system matches the recorded design. |
| Verification 2 / review 1 static artifact mismatch | Fixed for runtime; live JS/CSS exactly match `18f0902`, with only the allowed Graphify marker later. |
| Verification 3 demo-query and HTTP-200 404 P3s | Fixed; query enters demo and an unknown path returns designed HTTP 404. |
| Review 1 dead checkout and unlisted coverage findings | Fixed; checkout is an honest unavailable state and all retained functional claims are tested. |
| Review 1 plain-language heading and README minor findings | Fixed; current headings name sections and the current README uses the audited terms. |
| Verification 4 compact targets, join error, session, and demo-region minors | Fixed; target sizes, join association, 15-minute claim, and Axe scans pass. |
| Verifications 5–8 stale/mixed release findings | Fixed at `18f0902`; current static assets and realtime health match as described above. |
| Verification 6 end-screen and allowance findings | Fixed; the live run reached turn 12 and returned 52 valid 429 responses with Retry-After. |

## Findings

None.

## Final decision

**PASS — zero findings and zero untested claims.**
