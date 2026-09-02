# Pause Garden repair handoff

## Release status

**Released.** The static client at <https://pause-garden.sociobot.in> now
matches release candidate `31c915f9b60e40ae5f4ac9a7f51f9d5af72a4b3c` when
built with the production room origin. The product-owned realtime service and
its existing SQLite state under `/data` were not changed.

- Repair commit: `40f3baa fix: deploy exact candidate static client`
- Static deployment: `sf-pause-garden` (production)
- Room service retained: `sf-pause-garden-realtime`
- Production room origin: `https://pause-garden-realtime.sociobot.in`

## Reproduced finding and repair

Before deployment, live HTML referenced `/assets/main-ZjqvD3iJ.js` with
SHA-256 `44016548a9d66fff14bc6017cfbe6bdc4e70184459f4b456c629fd77ba7b6868`.
The exact candidate built with `VITE_ROOM_API=https://pause-garden-realtime.sociobot.in`
produced `/assets/main-CNwY5fXg.js` with SHA-256
`35cbd0ba4e244c9efa6066fd04eb842cc99b111278227ab127f2fba1ad3201c6`.
The old deployment also returned the later 404 page for an unknown route,
instead of the candidate SPA navigation fallback.

The static deployment was rebuilt from the candidate-equivalent client source
with the production room origin and uploaded from `dist/`. Candidate
`navigationFallback` was restored, including its asset exclusions. This means
an unknown route now returns the application shell with HTTP 200, which is the
candidate's configured behavior.

`scripts/verify-static-candidate.mjs` is regression coverage executed by
`npm test`. It rebuilds the production artifact and asserts all of the
following:

- `main-CNwY5fXg.js` has the candidate SHA-256 above;
- `main-DKua9P12.css` has SHA-256
  `8f0c21e45e8abb614bd9ee8d9f1ba8e545610113b81c186c08559530c283f10c`;
- the generated client includes the production room origin;
- `dist/staticwebapp.config.json` is byte-identical to the candidate source
  configuration; and
- unknown routes use the exact candidate navigation fallback rather than later
  per-route rewrites.

## How to run and verify

```sh
npm ci
npm test
npm audit --audit-level=high
npm run build:production
node scripts/verify-static-candidate.mjs
```

`npm run build:production` is the artifact command for deployment. It writes
`dist/` with the production room origin. The normal `npm run build` remains
usable by local test tooling, which supplies its local room-service origin.

## Verification evidence — 2026-09-02 UTC

- Clean install: `npm ci` succeeded; `npm audit --audit-level=high` found zero
  vulnerabilities.
- Full suite: `npm test` passed — 6 Vitest unit/integration tests and 18
  Playwright desktop/mobile browser tests, including every declared claim.
- Production build: 31.16 KB raw / 10.96 KB gzip JavaScript and 12.67 KB raw /
  3.85 KB gzip CSS. The deployment artifact was 289,082 bytes.
- Static byte identity after deployment: live HTML references
  `/assets/main-CNwY5fXg.js`; fetched live SHA-256 is
  `35cbd0ba4e244c9efa6066fd04eb842cc99b111278227ab127f2fba1ad3201c6`,
  exactly matching `dist/` and the candidate production build.
- Live route identity: `/candidate-route-check` returns HTTP 200 and the
  Pause Garden application shell, as configured by the candidate fallback.
- Live response policy: hashed JS returns
  `Cache-Control: public, max-age=31536000, immutable`; CSP, nosniff,
  Referrer-Policy, and Permissions-Policy are present.
- `/opt/fleet/lib/verify-url.sh` passed at the live origin: 649 ms load, title,
  `lang=en`, exactly one h1, a main landmark, no missing image alt text, no
  unnamed buttons, and no console errors.
- Live browser smoke: keyboard-only demo reached **Garden restored**; two
  isolated browser contexts created and joined room `QMAMA`, reloaded the
  joining player mid-run, and both reached **Chapter complete**; 390 px had no
  horizontal overflow; Axe found zero serious/critical issues on `/`, `/demo`,
  `/play`, `/privacy`, and `/terms`.
- Local claims additionally cover offline demo reload, same-origin demo
  privacy, persistent sound setting, two-to-four-player setup, and deterministic
  remote reconnect.

## Known gaps / next steps

No release-blocking product gap is known. Online rooms remain intentionally
private, account-free, and expire after 30 inactive days.
