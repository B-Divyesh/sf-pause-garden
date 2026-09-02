# Pause Garden repair 4 handoff

## Release status

Release-ready repair for the sole blocker in `.factory/verification-5.md`:
the public static site and realtime room service did not match candidate
`1ab9ba039c16975014a5ac499447cf3e6f3edcc1`.

The repaired release uses one clean, pushed Git `HEAD` as the source identity
for both `sf-pause-garden` and `sf-pause-garden-realtime`. The final deploy
command builds, deploys, and checks both identities as one guarded operation.
The existing `/data` SQLite share is preserved.

## Reproduction and root cause

Before changes, live HTML referenced `main-BBPkgcOE.js` with SHA-256
`cbd8a189570048330e20b8fa7c2e391b90c8d549d49f2907119d23279119a70d`.
The verifier candidate expected `main-BkvH-8yi.js` with SHA-256
`a0cc7bfb15c49cc8daf4aa89605f66fa775e9fcf3aae9eea1737e756f4fbc485`.
The live room service separately reported build `f1c883faac0d9b3a93df79b7e51cee6bd84ed30f`.
See `.factory/repair-4-reproduction.md`.

The former workflow offered two independent deploy commands and had no final
cross-service assertion. A later repository candidate could therefore be
accepted locally while production still represented an earlier commit.

## Repair

- Production builds now write the full source commit, HTML checksum,
  service-worker checksum, and hashed asset checksums to
  `dist/build-manifest.json`.
- HTML includes the full build identity and the footer shows its short form.
- Each commit gets its own service-worker cache name, so an old cache cannot
  keep serving a previous release shell after an update.
- `scripts/verify-release-identity.mjs` compares the live HTML, referenced
  asset names and bytes, service worker, manifest, and realtime `/health`
  response with the local candidate. It retries CDN propagation and writes
  exact evidence to `release-evidence/live-release.json`.
- `npm run deploy:production` refuses a dirty or unpushed product tree, builds
  from `HEAD`, updates only the product-prefixed realtime image and app while
  asserting the existing `/data` mount, deploys the static `dist/`, and
  requires the live identity check to pass.
- The regression fixture recreates the exact stale `main-BBPkgcOE.js` and
  `f1c883f…` health response, then proves that a fully matching pair passes.

## Local verification

Run on 2026-09-02 UTC:

```sh
npm ci
npm test
npm audit --audit-level=high
npm run build:production
node scripts/verify-static-candidate.mjs
```

- Clean install: 66 packages; zero vulnerabilities.
- Tests: 8 game/server tests, 2 release-identity tests, and 28 Playwright
  desktop/mobile tests pass. TypeScript checks run for client and server.
- All 22 exact commands in `.factory/claims.json` pass individually. The room
  boundary command was rerun after stopping a manual preview that occupied its
  test port; it passes with the intended isolated test server.
- Production assets before final commit stamping: JavaScript 30.48 KB raw /
  10.46 KB gzip; CSS 13.04 KB raw / 3.90 KB gzip; mobile hero 29.71 KB.
- `/opt/fleet/lib/verify-url.sh` passes in 537 ms with no console errors, a
  title, `lang=en`, one h1, one main landmark, and complete alt text.
- Playwright Axe reports zero serious or critical findings on `/`, `/demo`,
  `/play`, `/privacy`, and `/terms`. Keyboard, reduced-motion, 390px touch,
  dialog focus, route focus, and 44px target checks pass.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.1 s, LCP 1.4 s, CLS 0, TBT 30 ms.
- Offline reload/update, demo request isolation, two-browser play/reconnect,
  SQLite restart/expiry, throttling with `Retry-After`, and production/test
  build isolation pass.
- Package/consumer checks do not apply to this browser-game artifact.

## Deployment and exact live evidence

The release command is:

```sh
npm run deploy:production
```

It uses the full output of `git rev-parse HEAD` for the static manifest and
the realtime image `BUILD_SHA`. It touches only `sf-pause-garden*` resources,
keeps the fleet-created share mounted at `/data`, and ends by running:

```sh
npm run verify:live-release
```

That check passes only when the live HTML checksum and asset references equal
the local `dist/`, every live asset checksum matches, the service worker is
commit-scoped, and `/health` reports the same full commit with SQLite ready.
The machine-readable result is `release-evidence/live-release.json`.

## Known gaps

None. Host Edition remains honestly unavailable because product checkout is
not enabled; the free chapter and demo remain unchanged.
