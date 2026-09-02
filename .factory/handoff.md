# Pause Garden verification 6 handoff

## Release status: FAIL

Candidate `023c8f0d27c79ac1114d9c5364ca5bd6a55a0cf8` passes all local quality gates, including every one of the 23 declared claim tests. It must **not** be accepted yet: the live static artifact and room service are mismatched, and a live two-browser 12-turn chapter did not reach its required end screen.

See `.factory/verification-6.md` for complete evidence and defect severity.

## How verified

From a clean clone at the candidate SHA:

```sh
npm ci
npm test
npm run build:production
npm run verify:live-release
```

- All 23 exact commands from `.factory/claims.json` passed individually.
- `npm test` passed (unit, release contract, 28 Playwright checks, and build isolation); the production build passed with 10.46 kB gzip JavaScript.
- `npm run verify:live-release` failed: live HTML/asset manifest differs from candidate and realtime `/health` reports `148c705…`, not `023c8f0…`.
- Live sample-demo, offline, privacy request, mobile, keyboard, 59.88-FPS, Axe serious/critical, headers, and cache checks passed.

## Required next step

Deploy both `sf-pause-garden` static `dist/` and `sf-pause-garden-realtime` from exactly `023c8f0d27c79ac1114d9c5364ca5bd6a55a0cf8`. Then rerun `npm run verify:live-release`, the live two-browser 12-turn end-screen script, and the endpoint 429/`Retry-After` probe. Do not mark the release ready until all three pass.

No product code was changed by this verifier.
