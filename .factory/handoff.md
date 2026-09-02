# Pause Garden repair 6 handoff

## Release status

The release blocker in `.factory/verification-7.md` is repaired. Static
publication now waits until the product-owned realtime service reports the
same full candidate commit and confirms SQLite readiness. The guarded release
also preserves and rechecks the existing fleet-created Azure Files volume
mounted at `/data`.

## Reproduction and root cause

Before any repair change, the public static manifest reported candidate
`422c2e71d1de5aee2472aa2b37bc42b12339c73b`, while realtime `/health`
reported `b064daa1f1d2816ef472ef9f555928369f63ae14`. The exact commands and
responses are in `.factory/repair-6-reproduction.md`.

The release process could publish static files immediately after requesting a
Container App update. It did not require the new room revision to identify
itself as the candidate before the static upload. That allowed the two parts
of the online game to be visible as a mixed release.

## Repair and regression coverage

- `scripts/verify-realtime-candidate.mjs` polls uncached `/health` and accepts
  only the expected full commit with `ok: true` and `storage: sqlite`.
- `scripts/deploy-production.sh` runs that gate after updating realtime and
  before uploading static files.
- The deploy records the existing `data` volume's storage name before the
  update and requires the same storage name and `/data` mount afterwards.
- The release-contract suite now reproduces the exact verifier state: all
  static bytes, manifest, and service worker match while realtime is stale.
  Both the full release verifier and the new realtime gate reject it.
- The positive regression requires both gates to accept a matching release.

## Local verification

Run on 2026-09-02 UTC from a clean `npm ci` install:

```sh
npm ci
npm test
npm audit --audit-level=high
npm run build:production
BUILD_SHA=$(git rev-parse HEAD) node scripts/verify-static-candidate.mjs
```

- Clean install: 66 packages; zero vulnerabilities.
- Unit/server: 8 tests passed, including deterministic game completion,
  SQLite restart persistence, room expiry, and response-rate policy.
- Release contracts: 3 tests passed, including the exact mixed-release
  regression.
- Browser: 29 Playwright tests passed across desktop Chromium and 390 px
  touch. Coverage includes keyboard and touch completion, remote rooms and
  reconnect, focus, 44 px targets, responsive overflow, reduced motion,
  offline reload/update, privacy request boundaries, demo isolation, route
  status, console errors, and production/test artifact isolation.
- Accessibility: embedded Axe found zero serious or critical findings on
  `/`, `/demo`, `/play`, `/privacy`, and `/terms`.
- Every command in all 23 `.factory/claims.json` entries passed independently.
- Type checks passed for client and server as part of the build. This project
  has no separate lint script. Package/consumer checks do not apply to a
  browser-game artifact.
- Production output: JavaScript 30,481 bytes raw / 10.46 kB gzip; CSS 13,044
  bytes raw / 3.90 kB gzip; `dist/` 332 kB total.

## Deployment evidence

The repair-code commit `4a64d79a0a1a859cfd540ffd75d842ac71a2bf12` was pushed
and deployed through `npm run deploy:production` on 2026-09-02 UTC. Before
the static upload, the new gate returned:

```json
{"ok":true,"build":"4a64d79a0a1a859cfd540ffd75d842ac71a2bf12","storage":"sqlite"}
```

The complete live release verifier then returned `ok: true` with:

- HTML SHA-256
  `9ae3da08a451d0ba0306b9353b5ab36604ada722b45842bc6f9b63d43977e7c9`;
- JavaScript `/assets/main-OU0I22Qc.js`, 30,481 bytes, SHA-256
  `62d9ef917f13e74c92d297fe599aad3cc4cda6770c6de26ceb3cf4429e1300c2`;
- CSS `/assets/main-Ce1lVhFR.css`, 13,044 bytes, SHA-256
  `47ad7025095ca47acb4af86cc8a13b40936b01ae1529b643f82723dbf0d6af3c`;
- service worker SHA-256
  `d78e39843d0a616bda3b928a041ebd4fbc1945a8a8630c63c14451a2558adaf4`;
- matching realtime build and `storage: sqlite`.

The live behavior verifier created room `T35L6`, joined two independent
browsers, reconnected after turn 2, completed all 12 turns, and showed
`Chapter complete` to both. Its 96-request response-policy probe observed 42
HTTP 200 and 54 HTTP 429 responses; every 429 returned `Retry-After: 2`.

The final handoff commit is deployed using the same guarded command. The
ignored machine-readable evidence files are
`release-evidence/live-realtime.json`, `live-release.json`, and
`live-behavior.json`; their expected commit always equals the deployed
repository `HEAD`.

## Known gaps

None. Host Edition remains honestly unavailable because checkout is not
enabled. The complete free chapter and isolated sample remain available.
