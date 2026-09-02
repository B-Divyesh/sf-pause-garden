# Pause Garden repair 3 handoff

## Release status

Released on 2026-09-02 UTC. This repair resolves every
finding in `.factory/verification-4.md` while preserving the deterministic
12-turn garden game, demo sandbox, online rooms, and local-first settings.

## What changed

- Reproduced the release-identity failure before changing code. A production
  build followed by a local-room build changed `dist/index.html` from
  `76137a…b197` to `bf7093…95af` and replaced the production JavaScript asset.
  The cause was Playwright's web server writing its localhost bundle into
  `dist/` after the production build.
- Browser tests now build into ignored `test-dist/`. The production artifact
  stays in `dist/`, and `scripts/verify-build-isolation.mjs` proves the two
  bundles use their respective room origins. `npm test` ends with this check.
- Room errors now take an explicit `setup` or `join` target. The exact malformed
  join (`ABC`, `Noor`) writes only to `#join-error`, which is referenced by the
  join fields, and the button remains available to retry.
- The wordmark, purchase-terms link, and privacy/support email links have
  44px-or-larger target areas at 390px. Regression coverage measures each
  target at the mobile viewport.
- The demo skip link now lives inside the header landmark. An Axe regression
  check requires no `region` violation on `/demo`.
- The landing page and README now state the researched intended session: a
  12-turn chapter designed for about 15 minutes. The statement is in
  `.factory/claims.json` and has a dedicated browser test.

## Local verification

Run from a clean dependency install on 2026-09-02 UTC:

```sh
npm ci
npm test
npm audit --audit-level=high
npm run build:production
node scripts/verify-static-candidate.mjs
```

Results:

- `npm ci`: 66 packages installed from the lockfile.
- `npm test`: 8 Vitest unit/server tests and 27 Playwright desktop/mobile
  tests passed. The suite covers the deterministic chapter, restart, sleeping
  handoff, two-browser rooms and reconnect, keyboard and 390px touch play,
  privacy request boundaries, offline reload, route semantics, metadata,
  reduced motion, all 21 declared claims, the four repaired verifier findings,
  and production-artifact isolation.
- `npm audit --audit-level=high`: zero vulnerabilities.
- `npm run build:production`: passed. The final production assets are
  `main-BkvH-8yi.js` (30.37 KB raw, 10.42 KB gzip) and
  `main-Ce1lVhFR.css` (13.04 KB raw, 3.90 KB gzip). The 760px hero is
  29,708 bytes.
- `node scripts/verify-static-candidate.mjs`: passed, confirming production
  room origin, no localhost fallback, hashes, valid direct routes, and the
  designed HTTP 404 policy.
- `/opt/fleet/lib/verify-url.sh http://127.0.0.1:4173/ <evidence-dir>`:
  passed in 537 ms with no console errors, one h1, one main landmark,
  `lang=en`, title, and image alt text. The existing Playwright Axe integration
  passed all serious/critical checks on every route and the added `/demo`
  region check passed. The standalone Axe CLI could not start its bundled
  ChromeDriver because it only supports Chrome 152 while the supplied
  Playwright Chromium is 145; the repository's pinned Playwright/Axe test is
  the authoritative accessibility run for this worker image.

## Deployment

- Static resource: `sf-pause-garden`.
- Room service: `sf-pause-garden-realtime`.
- Build the exact static artifact with `npm run build:production`; deploy only
  that `dist/` with `/opt/fleet/lib/deploy-static.sh pause-garden /work/repo/dist`.
- Deploy the room service from this checked-out commit with
  `WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh pause-garden-realtime /work/repo Dockerfile 8080`.
  The fleet script stamps the image with Git `HEAD`, keeps the SQLite volume at
  `/data`, and pins the stateful service to one replica.

## Live verification

- The deployed `/` SHA-256 is
  `fadac8095ccd3ae1b29b5b7ac02a7aa0fd20f6ab72e1c6c54d778f99ffb51654`,
  exactly matching local `dist/index.html`. Its production JavaScript asset
  `main-BkvH-8yi.js` has matching SHA-256
  `a0cc7bfb15c49cc8daf4aa89605f66fa775e9fcf3aae9eea1737e756f4fbc485`.
- The room health endpoint reports the checked-out release candidate and
  `"storage":"sqlite"`. The container deployment retained `/data` on the
  product-scoped durable share and one replica.
- `/`, `/demo`, `/play`, `/privacy`, and `/terms` return HTTP 200. A missing
  route returns the designed 404 with HTTP 404. Static responses include HSTS,
  restrictive CSP with `frame-ancestors 'none'`, `nosniff`, referrer policy,
  permissions policy, and expected cache policy. The room health response is
  `no-store` with its restrictive response headers.
- The live URL verifier completed in 669 ms with no console errors, a title,
  `lang=en`, one h1, one main landmark, and complete image alt text. Axe on all
  valid and 404 routes at desktop and 390px found no serious, critical, or
  `region` findings. The live demo service worker updated and reloaded offline.

## Known gaps

None. Host Edition remains honestly unavailable because the product-scoped
checkout endpoint is not enabled; no payment link is exposed.
