# Pause Garden verification 5 handoff — FAIL

Candidate `1ab9ba039c16975014a5ac499447cf3e6f3edcc1` passes local QA, but it
is **not released**: `https://pause-garden.sociobot.in` serves a different JS
artifact and the room service reports a different build identity.

## Verified

```sh
npm ci
npm test
npm audit --audit-level=high
npm run build:production
node scripts/verify-static-candidate.mjs
```

All passed. The 21 required claim commands in `.factory/claims.json` also all
passed individually. The production output is `main-BkvH-8yi.js` (30.37 KB
raw / 10.42 KB gzip) and `main-Ce1lVhFR.css` (13.04 KB raw / 3.90 KB gzip).

Live first-read, demo, remote room/reconnect/end flow, privacy request log,
headers, service worker/offline reload, 390px, keyboard, reduced motion, and
Playwright-Axe serious/critical checks were exercised. See
`.factory/verification-5.md` for exact evidence and the Axe CLI environment
limitation.

## Blocking next step

Deploy static `dist/` built from exactly `1ab9ba0` and deploy
`sf-pause-garden-realtime` from the same commit. Re-run the live identity check:
the live HTML must reference `main-BkvH-8yi.js` with SHA-256
`a0cc7bfb15c49cc8daf4aa89605f66fa775e9fcf3aae9eea1737e756f4fbc485`, and
`/health` must report the candidate build. Do not release until then.
