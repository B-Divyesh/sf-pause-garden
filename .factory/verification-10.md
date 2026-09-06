# Verify a pause-friendly online garden game — PASS

**Verdict: PASS**

**Findings:** 0

**Untested claims:** 0

**Implementation candidate:** `e648ac2fcfedae0b2eedd27eb4c59f110c9ebabf`

**Documentation handoff:** `39799318fd0daec3989a5b7d802c76ed388e4c2c`

**Later Graphify baseline:** `38c51496ebc5fb2e6287ac9b09858fd4c19bbf79`

**Live URL:** <https://pause-garden.sociobot.in>

**Verified:** 2026-09-06 UTC

## First screen

Fresh 1440 × 950 desktop and 390 × 844 phone browsers opened the live home
page without scrolling.

- Job: **Restore a garden, even when friends pause.**
- Audience: **For friends with interrupted evenings who still want each turn
  to matter.**
- First action: **Try it with sample data.** Its adjacent instruction says
  that a garden opens on turn seven with no setup.
- The phone preview's first complete board tile measured y=763.52–834.34,
  wholly within the 844 px viewport. Desktop showed the board at y=353.13.

The first screen therefore shows the game, rather than a menu wall. Fresh
screenshots are in `/work/.evidence/pause-garden-verify10-desktop-first.png`
and `/work/.evidence/pause-garden-verify10-phone-first.png`.

## Candidate and live release

Two isolated clean clones checked out the implementation SHA. `npm ci
--include=dev` installed 66 locked packages and `npm audit --audit-level=high`
reported zero vulnerabilities. `npm run build` passed, produced `dist/`, and
produced 30,457-byte JavaScript, 13,087-byte CSS, and a 290,563-byte complete
output. `node scripts/verify-static-candidate.mjs` passed.

The live room health endpoint returned HTTP 200 with `ok: true`,
`storage: "sqlite"`, and implementation build
`e648ac2fcfedae0b2eedd27eb4c59f110c9ebabf`.

`npm run verify:live-release` intentionally exited nonzero when it compared
the exact static build marker with the implementation SHA. The live static
shell records later Graphify-only commit `38c51496`; its diff from the
implementation contains only factory documentation and Graphify analysis
files, not product code, tests, public assets, or product documentation.
This is the allowed later-report/Graphify case in the work order, not a mixed
product release:

- Live JS `main-OZUXqX55.js` is 30,457 bytes and SHA-256
  `48c22135994a3620e8608ab409d482a008491da73fff7bfce8c8f3441bdaa9c1`,
  exactly equal to the candidate.
- Live CSS `main-1-3FDcl7.css` is 13,087 bytes and SHA-256
  `f3fde2fd5a5f1a689f7b6149635449b1c96aab5617cd8c11512c94ae35ab1bcf`,
  exactly equal to the candidate.
- Candidate and live `index.html` are both 1,772 bytes; candidate and live
  `sw.js` are both 1,611 bytes. Replacing only the embedded full and short
  build identifiers makes each pair byte-identical.
- The live and candidate asset manifests are identical. Only
  `sourceCommit` differs.

## Claims and clean checks

Every exact command declared by `.factory/claims.json` ran independently from
the clean clone. All 23 logs end in `EXIT 0` under
`/work/.evidence/pause-garden-verify10-claims/`. Each claim has exactly one
matching `@claim:` test tag. The aggregate `npm test` also passed: 8 game and
server tests, 5 release-contract tests, 29 browser tests, and build-isolation
checks.

| Claim | Result |
| --- | --- |
| `chapter-complete` | PASS |
| `restart-reset` | PASS |
| `sleeping-handoff` | PASS |
| `remote-room-play` | PASS |
| `remote-reconnect` | PASS |
| `settings-persist` | PASS |
| `offline-reload` | PASS |
| `privacy-same-origin` | PASS |
| `keyboard-controls` | PASS |
| `two-to-four-players` | PASS |
| `session-length` | PASS |
| `seed-determinism` | PASS |
| `weather-sequence` | PASS |
| `rendering-rate` | PASS |
| `free-chapter` | PASS |
| `calm-private-rules` | PASS |
| `demo-isolation` | PASS |
| `room-service-boundary` | PASS |
| `room-storage-sqlite` | PASS |
| `room-expiry` | PASS |
| `checkout-unavailable` | PASS |
| `build-identity` | PASS |
| `production-default-build` | PASS |

The landing page, game, README, privacy page, terms, footer, and demo guide
were cross-checked against this manifest. No unlisted, false, incomplete, or
untested public claim was found.

## Sample game and recovery

The one-click sample opened `/demo` with room MOSS, seed MOSS-27, three named
players, a sleeping Jules, weather, goals, history, and all 16 beds. The
persistent label was **Demo — sample data, nothing is saved** before and after
the win. Selecting Tend and bed three reached **Garden restored** with 15
bloom points and the visitor request met. The populated and win evidence is
in `/work/.evidence/pause-garden-verify10-demo-populated.png` and
`/work/.evidence/pause-garden-verify10-demo-win.png`.

**Reset demo** closed the end dialog and restored turn 7, Wind, 11/14 bloom
points, and 2/3 visitor care. **Start for real** removed
`demo:pause-garden:room`. A seeded real-storage sentinel remained unchanged
through sample play, reset, and exit. The sample did not touch real data.

The automated claim run independently covered keyboard and touch completion,
sound-setting persistence, offline reload after the initial visit, the
sleeping-player handoff, two-to-four-player setup, and deterministic weather.
Invalid three-character codes, missing five-character rooms, blank names, and
the four-player boundary have recovery/boundary tests. The pause dialog has
focus management and Escape recovery. No gameplay path was left untested.

## Multiplayer and storage

The independent live behavior check created room `WY9CH` in one browser and
joined it in a second. The clients alternated 12 actions; the second refreshed
after turn two and returned synchronized. Both reached **Chapter complete**.
The record is
`/tmp/pause-garden-verify10-clean/release-evidence/live-behavior.json`.

The same check sent 96 live allowance requests: 44 returned 200 and 52
returned 429. Every 429 returned `Retry-After: 2`. The SQLite persistence and
room-expiry claims pass from a clean temporary database; production was not
restarted during verification. This avoids interrupting real players while
still proving restart persistence. Separate room state and reconnect behavior
are covered by the two-browser claim tests and the live run.

## Accessibility, privacy, routes, and performance

- The factory `verify-url.sh` passed: HTTP 200, 817 ms load, no console
  errors, title, `lang=en`, one h1, main landmark, alt text, and named
  buttons.
- Fresh Playwright Axe scans found zero violations on `/`, `/demo`, `/play`,
  `/privacy`, `/terms`, the deliberate missing route, and the phone end
  dialog. Every valid page has one h1 and one main landmark.
- Product-owned links on all routes returned HTTP 200. `/not-a-route` returns
  deliberate HTTP 404 with title **Page not found — Pause Garden**, h1
  **Page not found**, and working recovery links. Its sole browser console
  message is the expected failed 404 resource request, not a defect.
- The offline claim passed in its own browser context. The demo uses only the
  static origin; online play uses only the static origin and product-owned room
  service. No analytics, third-party scripts, or CDN fonts were observed.
- Reduced-motion, visible focus, keyboard, touch, 44 px controls, and 200%
  text behavior are covered by the passing browser suite. The rendering claim
  passed its 55 FPS median threshold.
- Live headers include a restrictive response-header CSP with
  `frame-ancestors 'none'`, HSTS, `nosniff`, referrer policy, and permissions
  policy. Hashed assets are immutable for one year; `sw.js` is `no-cache`.
- Fresh mobile Lighthouse scored 100 performance, 100 accessibility, 100 best
  practices, and 100 SEO. FCP and LCP were 0.3 s, TBT 0 ms, and CLS 0. The
  JSON is `/work/.evidence/pause-garden-verify10-lighthouse.json`.

## Earlier findings

All earlier findings remain resolved. This includes the original absent remote
room and reconnect, the frame-rate suite failure, cache headers, visual-system
mismatch, stale or mixed deployment findings, demo-query entry, true 404,
unavailable checkout honesty, previously untested claims, plain-language
headings and README copy, short mobile targets, join-error association,
missing 15-minute copy, demo landmark structure, turn-12 completion, and the
missing 429/`Retry-After` behavior.

Strict review 4's two remaining findings are specifically resolved: the fresh
phone first viewport now contains a complete board tile, and the 404 h1 is
**Page not found**.

## Findings

None.

## Final decision

**PASS — zero findings and zero untested claims.** No product code was changed
by this verification. The pre-existing uncommitted Graphify output in the
supplied checkout was preserved and excluded from the report commit.
