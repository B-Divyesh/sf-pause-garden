# Restore a shared garden — review 5

**Verdict: PASS — zero findings and zero untested claims.**

**Reviewed:** 2026-09-06 UTC
**Live URL:** <https://pause-garden.sociobot.in>
**Implementation candidate:** `e648ac2fcfedae0b2eedd27eb4c59f110c9ebabf`
**Documentation baseline:** `93af6cb`
**Work-order repository baseline:** `647392712149082939f9ac3e10faf581c304bfab`

No product code was changed. The four pre-existing uncommitted Graphify files
were preserved and excluded from this report commit.

## First screen

Fresh live browsers opened the home page without scrolling.

- Job: **Restore a garden, even when friends pause.**
- Audience: **For friends with interrupted evenings who still want each turn to
  matter.**
- First action: **Try it with sample data.** The adjacent instruction says that
  the garden opens on turn seven with no setup.
- At 1440 × 950, the first sample bed was y=353.13–490.30. At 390 × 844, the
  first complete board tile was y=763.52–834.34. Both are fully visible.

The first screen shows the game board rather than a menu wall. Fresh evidence:
`/work/.evidence/pause-garden-review5/desktop-first.png` and
`/work/.evidence/pause-garden-review5/phone-first.png`.

## Candidate, claims, and build

An isolated clean clone at the implementation candidate used Node 22/npm and
Playwright 1.58.2. `npm ci --include=dev` installed 66 locked packages; `npm
audit --audit-level=high` reported zero vulnerabilities. `npm run build` and
`node scripts/verify-static-candidate.mjs` passed. The production output is
30,457 bytes of JavaScript and 13,087 bytes of CSS.

`npm test` passed: 8 game/server tests, 5 release-contract tests, 29 browser
tests, and production-artifact isolation. Every exact command declared by the
23 claims was run from that clean clone; all passed. This includes the two
individually invoked filters sharing the remote room test.

| Claims | Result |
| --- | --- |
| chapter complete, restart reset, sleeping handoff | PASS |
| remote room play, remote reconnect, SQLite storage, room expiry | PASS |
| settings, keyboard/touch, two-to-four players, free chapter | PASS |
| offline reload, demo isolation, same-origin demo privacy, room boundary | PASS |
| 15-minute session, seed/weather determinism, 55 FPS pacing | PASS |
| calm rules, unavailable checkout, build identity, production build | PASS |

The landing, README, game, legal pages, footer, and demo guide were
cross-checked with `.factory/claims.json`. No public claim is missing from the
manifest, false, incomplete, or untested.

## Sample game, recovery, and game loop

The one-click sample redirected `/?demo=1` to `/demo` and opened room MOSS on
turn 7 with seed MOSS-27, three named players, 16 beds, weather, goals,
history, and sleeping Jules. Tend on bed 3 reached **Garden restored**. The
persistent **Demo — sample data, nothing is saved** label remained visible on
the end screen.

**Reset demo** restored turn 7. **Start for real** removed only
`demo:pause-garden:room`; a real-data sentinel remained unchanged. Sample
completion made requests only to the Pause Garden static origin. The populated
end screen is recorded in
`/work/.evidence/pause-garden-review5/demo-win.png` and details are in
`/work/.evidence/pause-garden-review5/live-ui-details.json`.

The aggregate browser suite covers keyboard and touch completion, sleeping
handoff, focus movement, sound persistence, pause/Escape recovery, invalid and
missing room codes, blank names, four-player setup, 200% text, reduced motion,
offline reload, win/loss end screens, and replay reset.

## Live multiplayer, storage, and release identity

`GET https://pause-garden-realtime.sociobot.in/health` returned HTTP 200 with
`ok: true`, `storage: "sqlite"`, and implementation build `e648ac2…`.

Two independent live browser contexts created room `NAKQS`, joined from a
second browser, alternated all 12 actions, refreshed and reconnected the
second player after turn 2, and both reached **Chapter complete**. A live
96-request allowance probe returned 42 × HTTP 200 and 54 × HTTP 429; every
429 included `Retry-After: 2`. This evidence is in the clean-clone
`release-evidence/live-behavior.json`.

The live static manifest has the later Graphify-only marker `38c5149…`, while
the room service has the implementation marker. This is not a mixed product
release: both live hashed assets exactly match the candidate (JS SHA-256
`48c221…aa9c1`, CSS SHA-256 `f3fde2…ab1bcf`); the live and candidate HTML and
service worker have equal lengths and become byte-identical after replacing
only the full and short source-build markers. No product runtime file differs.

## Accessibility, privacy, routes, and performance

- `/opt/fleet/lib/verify-url.sh` passed: HTTP 200, 577 ms load, no console
  errors, title, `lang=en`, one h1, one main, complete image alt text, and
  named buttons.
- Fresh Axe 4.10 scans, with CSP bypass only for test injection, found zero
  serious or critical violations on `/`, `/demo`, `/play`, `/privacy`,
  `/terms`, and a missing route.
- Valid routes returned HTTP 200 with route-specific titles. The missing route
  returned deliberate HTTP 404, title **Page not found — Pause Garden**, and
  h1 **Page not found**.
- Normal routes had no console errors. Headers include HSTS, response-header
  CSP with `frame-ancestors 'none'`, `nosniff`, strict referrer policy, and a
  permissions policy. Hashed assets are one-year immutable.
- The demo is local session storage and does not open a WebSocket. Online play
  uses only the product static origin and product-owned room service. There
  are no analytics, third-party scripts, or CDN fonts.

## Earlier finding disposition

| Earlier finding group | Current proof and disposition |
| --- | --- |
| Initial remote-room/reconnect P0 | Fixed: the fresh two-client live run reconnected after turn 2 and both reached the turn-12 end screen. |
| Initial full-suite frame-rate P1 | Fixed: aggregate suite and 55-FPS claim pass. |
| Initial immutable-cache and visual-system P2s | Fixed: current hashed asset headers are immutable; generated greenhouse, dark palette, editorial type, motion, and responsive board match `design.md`. |
| Verification 2 / review 1 release mismatch | Fixed: current runtime hashes match `e648ac2`; only an allowed later Graphify marker remains in static metadata. |
| Verification 3 / review 1 demo-query and HTTP-200 404 P3s | Fixed: query enters demo-only storage; missing path is designed HTTP 404. |
| Review 1 dead checkout and seven claim-coverage findings | Fixed: Host Edition is honestly disabled with no checkout URL; all retained claims have observable tests. |
| Review 1 minor slogan headings and README jargon/length | Fixed: current headings name the task/section, and the audited README language is plain and short. |
| Verification 4 mobile-target, join-error, session-copy, and demo-landmark findings | Fixed: 44 px regression, form association, 15-minute claim, and Axe tests pass. |
| Verifications 5–8 stale static/realtime release findings | Fixed: current health and live assets match the implementation under the documented Graphify-only marker exception. |
| Verification 6 no turn-12 end and no 429 findings | Fixed: current live run ended in both browsers and current probe received 54 valid 429 responses. |
| Review 4 phone-board and metaphorical-404 findings | Fixed: the full phone tile is in the first viewport and the h1 is **Page not found**. |

## Findings

None.

## Final decision

**PASS — zero findings and zero untested claims.**
