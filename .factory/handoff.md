# Pause Garden repair 7 handoff

## Release status

**Ready for paired release.** This repair reproduces and blocks the mixed
static/realtime release found in Verification 8. The production release command
builds, deploys, and proves both components from the same pushed `HEAD` while
keeping the existing room-service `/data` storage identity.

## What changed

- Reproduced the live P0 before changing code: static
  `c24c20d9124569b8499814f45c95a6a5a306dc10` was live while room health
  reported `01e3bffd7b44b5d6e808c62dc2b29449db319cb6`. The raw commands and
  values are recorded in `.factory/repair-7-reproduction.md`.
- Added a deterministic release-contract fixture using those exact two IDs. It
  requires `verifyReleaseIdentity` to reject a byte-matching static candidate
  when room health reports the stale service build.
- Added a deployment-order contract. It requires the production release script
  to build the realtime image with `BUILD_SHA`, preserve `/data` storage, wait
  for the candidate health response, and only then publish static files.
- Browser tests now refuse an existing web server. This prevents a local
  production preview from being silently reused in place of `test-dist` and
  its localhost room server; the production-artifact regression checks it.

## Verification

- Clean install: `npm ci` installed 66 packages; `npm audit --audit-level=high`
  reported zero vulnerabilities.
- `npm test` passed: 8 game/server unit tests, 5 release contracts, 29
  Playwright desktop/mobile tests, and production-artifact isolation.
- Every one of the 23 exact commands in `.factory/claims.json` passed in a
  fresh, isolated test-server run. This includes deterministic end screens and
  replay, two-browser remote play/reconnect, keyboard/touch, offline reload,
  privacy boundary, SQLite persistence/expiry, and build identity.
- `npm run build` passed both TypeScript checks. The artifact is 332 kB total;
  JavaScript is 30,481 bytes (10.46 kB gzip) and CSS is 13,044 bytes (3.90 kB
  gzip).
- Local `verify-url.sh` loaded the production artifact in 577 ms with no page
  or console errors; it found one title, `lang="en"`, one h1, a main landmark,
  no missing image alt text, and no unnamed buttons. The pinned Axe browser
  integration in the 29-test suite reported zero violations.

## Deployment and live proof

Run only from a clean, pushed commit:

```sh
npm run deploy:production
```

The command deploys `sf-pause-garden-realtime` first, checks that its existing
`/data` mount and storage name did not change, waits for `/health` to report
the current full `HEAD` SHA, and only then deploys `sf-pause-garden`. It then
requires `npm run verify:live-release` to report `ok: true` with both
`manifest.sourceCommit` and `health.build` equal to that same SHA. Finally it
runs `npm run verify:live-behavior`, which creates a two-browser room,
reconnects a player, completes the twelve-turn chapter to the end screen, and
checks the `429` response policy.

The deploy-time JSON evidence is written locally to the ignored
`release-evidence/` directory so it never becomes a stale candidate artifact.

## Known gaps and next steps

None. Do not deploy the static directory independently: use
`npm run deploy:production` so the realtime candidate gate remains in front of
static publication.
