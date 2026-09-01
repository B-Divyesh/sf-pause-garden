# Pause Garden handoff — FAIL

## Independent verifier override (2026-09-01 UTC)

Candidate `91e5d3acbceee82098820c711826b852c2b22028` at
<https://pause-garden.sociobot.in> is **not releaseable**. This override is the
current handoff status and supersedes the builder's historical verification
notes below. Full evidence is in `.factory/verification.md`.

The researched product requires a durable room-code game for 2–4 **remote**
friends. The candidate only saves `pause-garden:room` in the creating browser's
localStorage; a second browser cannot join its displayed room code, and there
is no product room service or WebSocket. This is a P0 failure of the core job.

A clean full `npm test` also failed the advertised `@claim:rendering-rate`
browser test, despite an isolated claim run passing. The performance gate is
flaky and therefore not a passing release gate. `npm ci`, all 14 isolated
claims commands, and `npm run build` passed. The live HTML and hashed JS/CSS
byte-match the candidate build. Axe via Playwright found no serious/critical
findings on the core routes; desktop/mobile/keyboard/offline/privacy checks
passed. See the verification report for exact command and browser evidence.

Required next steps: add a product-owned synchronized room service with
SQLite-under-`/data`, reconnect, and two-browser tests; stabilize the FPS
claim; and set immutable caching for content-hashed static assets.

## Builder handoff retained for historical context

## What shipped

- A deterministic 12-turn garden strategy game for 2–4 shared-screen players.
- A complete setup → play → win/loss → replay loop with three useful actions,
  seeded boards, changing weather, visitor care, and a visible room code.
- Sleeping-player handoff. Any present player can place the current sleeping
  player’s queued token, and the event is recorded in the action log.
- Local recovery after every turn, persistent sound choice, an explicit pause
  dialog, keyboard grid movement, touch controls, and responsive 390 px layout.
- A one-click `/demo` sandbox. It starts on turn seven and reaches the win
  summary with one correct Tend action. Demo data uses session storage only.
- Offline reload for the visited demo through a versioned service worker.
- A $6 one-time Host Edition using the Sociobot checkout and license contract.
  It adds repeat chapter setup and custom seeds. Cached valid licenses never
  block the free first paint; restore and once-daily verification are included.
- `/privacy`, `/terms`, and a styled 404 route; route titles, canonical links,
  focus restoration, an announcer, security headers, robots, and sitemap.
- Original generated greenhouse art, responsive WebP variants, and generated
  imagery disclosure. Provenance is in `.factory/design.md` and `assets/src/`.

## Verification

Run from a clean checkout:

```sh
npm install
npm test
npm run build
```

Results on September 1, 2026:

- `npm test`: 3 deterministic unit tests and 18 browser tests passed.
- Claim coverage: all 14 entries in `.factory/claims.json` have tagged tests.
- `npm run build`: passed; output is `dist/` with `dist/index.html` at root.
- Initial JavaScript: 26.96 KB raw / 9.63 KB gzip.
- Initial CSS: 12.67 KB raw / 3.85 KB gzip.
- Hero images: 30 KB mobile and 64 KB desktop WebP.
- Lighthouse 13 mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 1.4 s, CLS 0, total blocking time 40 ms.
- Factory URL verifier: 200 response, one h1, `lang=en`, main landmark, no
  missing alt text, no unlabeled buttons, and no console errors.
- Axe browser audit: no serious or critical findings on home, demo, privacy,
  or terms.
- Rendering: fixed 60 Hz simulation; automated Chromium test sustained at
  least 55 animation frames in one second with reduced-motion disabled.
- `npm audit --audit-level=high`: zero vulnerabilities.

## Known gap and reason

The researched brief calls for remote friends to join a durable online room.
This work order requires a static deployment, which cannot own WebSocket or
SQLite room state. The shipped v1 is therefore honest shared-screen co-op with
local reconnect, not remote sync. The landing page and README say this plainly.

To close the gap, provision a product-owned `sf-pause-garden-realtime`
container with WebSocket ingress and SQLite under `/data`, then keep this same
deterministic core as the server authority. Do not use a third-party realtime
service.

## Factory follow-up

- Register `pause-garden` and its $6 price in the Sociobot billing service.
- Deploy `dist/` to `https://pause-garden.sociobot.in`.
- Re-run the URL verifier and Lighthouse against the public HTTPS URL.
