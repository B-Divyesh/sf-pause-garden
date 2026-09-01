# Pause Garden repair handoff — PASS

## Release

- Product: <https://pause-garden.sociobot.in>
- Room service: <https://pause-garden-realtime.sociobot.in>
- Repair base: verifier report commit `4b4d484877f87774c516b7058914d85e748f590f`
- Deployed room-service source: `31c915f9b60e40ae5f4ac9a7f51f9d5af72a4b3c`
- Deployment class: static Vite client plus product-owned WebSocket companion
- Scoped resources: `sf-pause-garden`, `sf-pause-garden-realtime`, and
  `sf-pause-garden-realtime-data`

## What changed

- Replaced the misleading local room with a server-authoritative online room.
  A host names 2–4 players, shares a five-character code, and each friend joins
  from a separate browser with their chosen name.
- Added ordered WebSocket revisions, server-side turn validation, synchronized
  actions, away-player handoff, restart, and opaque reconnect tokens.
- Added a product-owned Node room service with a 4 KB message limit, origin
  allowlist, validation, security headers, and a 20 request/second token bucket
  with a 40-request burst.
- Room state persists as SQLite at `/data/pause-garden-v3.sqlite`. Because Azure
  Files does not support SQLite file locks, the single replica uses a private
  local working database and synchronously replaces the durable SQLite snapshot
  before acknowledging or broadcasting each write. Startup restores that
  snapshot before accepting rooms.
- Kept `/demo` isolated in `demo:pause-garden:room` session storage. It opens no
  WebSocket and still reloads offline.
- Replaced the flaky one-second frame count with median frame pacing across 90
  animation frames. The claim passed five consecutive runs.
- Added one-year immutable caching for Vite’s content-hashed `/assets/*` files.
- Corrected the written difficulty contract to match the shipped deterministic
  rules: target `12 + player count`, Rain advances watering, Warm light advances
  planting, and Wind adds a tend point.
- Updated landing, setup, privacy, terms, README, demo, claims, copy audit, and
  design documentation for remote rooms.

## Regression coverage

- `server/room.test.ts` uses two WebSocket clients to create, join, play, and
  reconnect; reopens SQLite to prove recovery; verifies durable snapshot
  restore; and proves `429` with `Retry-After: 2`.
- `tests/e2e/claims.spec.ts` uses two independent browser contexts to create and
  join one room, alternate 12 deterministic turns, refresh/reconnect on turn
  three, and assert the same end screen in both browsers.
- The failed join path restores the submit control and tells the player how to
  retry.
- `.factory/claims.json` has 15 claims and every `@claim:<id>` appears in exactly
  one test.

## Verification evidence — 2026-09-01 UTC

Clean local run:

```sh
npm ci
npm audit --audit-level=high
npm run build
npm test
npx playwright test --grep @claim:rendering-rate --repeat-each=5
```

- Install/audit: 67 packages, zero vulnerabilities.
- Unit/integration: 6 passed.
- Browser: 18 passed across desktop Chromium and the 390 × 844 mobile project.
- FPS regression: 5/5 repeated passes; live median measured 59.88 fps.
- Build: JS 31.49 KB raw / 11.05 KB gzip; CSS 12.67 KB raw / 3.85 KB gzip.
- Hero: 29.7 KB mobile and 64.8 KB desktop; total deployed artifact 289 KB.
- Local and live URL verifier: HTTP 200, one h1, `lang=en`, main landmark,
  complete image alt text, labelled buttons, and zero console errors.
- Live Axe on `/`, `/demo`, `/play`, `/privacy`, and `/terms`: zero serious or
  critical findings.
- Live 390 px: `scrollWidth === clientWidth === 390`.
- Live reduced motion: no atmospheric canvas created.
- Live service worker: demo reloaded offline in a fresh browser context.
- Live two-browser run: room `EF89J`, 12 alternating turns, mid-run refresh,
  both end screens reached, zero console errors.
- Live response policy: 60 parallel status requests returned 41 × 200 and
  19 × 429; a limited response included `Retry-After: 2`.
- Live identity: backend `/health` reports build
  `31c915f9b60e40ae5f4ac9a7f51f9d5af72a4b3c`; deployed JS SHA-256
  `44016548a9d66fff14bc6017cfbe6bdc4e70184459f4b456c629fd77ba7b6868`
  exactly matches `dist/assets/main-ZjqvD3iJ.js`.
- Live immutable caching: that JS returns
  `Cache-Control: public, max-age=31536000, immutable`.
- Live Lighthouse mobile: Performance 100, Accessibility 100, Best Practices
  100, SEO 100; LCP 1.057 s, CLS 0, total blocking time 41 ms.

## Known gaps and next steps

No release-blocking gap is known. The room service intentionally has no account,
chat, or public room discovery. Inactive online rooms expire after 30 days.
