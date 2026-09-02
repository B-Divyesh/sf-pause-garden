# Verification 5 — FAIL

**Candidate:** `1ab9ba039c16975014a5ac499447cf3e6f3edcc1`  
**Live URL:** <https://pause-garden.sociobot.in>  
**Verified:** 2026-09-02 UTC

## Release decision

**FAIL.** The repository candidate is healthy, but the deployed static site and
room service are not this candidate. Shipping or accepting a candidate requires
the public deployment to match its tested artifact.

## First-read test

Cold live page, desktop viewport: “Restore a garden, even when friends pause.”
It says this is for friends with interrupted evenings, and the clear first
action is **Try it with sample data**; its adjacent text says a garden opens on
turn seven with no setup. The first viewport visibly includes the 4×4 garden
game board, not a menu wall. It passes the plain-words and one-click-demo gate.

## Required claim tests

`.factory/claims.json` exists and has 21 entries. After `npm ci`, I ran every
exact command listed in it, individually, through the product test/demo entry
point. All passed: chapter completion, restart, sleeping-token handoff, remote
room/reconnect, persistence, offline reload, same-origin demo privacy,
keyboard/touch, 2–4 players, deterministic seed/weather, 55-FPS pacing,
session-length copy, demo isolation, free chapter, calm/private rules, room
boundary, SQLite/expiry, and unavailable checkout.

The initial pre-install invocation could not find `vitest`; this was the normal
state of the clean clone, not a test failure. The complete post-install run is
the recorded result.

## Evidence

| Area | Result | Evidence |
| --- | --- | --- |
| Clean install | PASS | `npm ci`: 66 packages, 0 vulnerabilities. |
| Full suite | PASS | `npm test`: 8 Vitest tests and 27 Playwright tests passed in 1.0 min; production-artifact isolation passed. |
| Security/dependency check | PASS | `npm audit --audit-level=high`: 0 vulnerabilities. |
| Exact production build | PASS | `npm run build:production` and `node scripts/verify-static-candidate.mjs` passed. JS 30.37 KB raw / 10.42 KB gzip; CSS 13.04 KB raw / 3.90 KB gzip. |
| Local functional run | PASS | Deterministic browser coverage completes demo and remote 12-turn runs, end screens, restart, sleeping handoff, reconnect, invalid joins, offline reload, and 390px touch/keyboard. |
| Required claims | PASS | All 21 exact commands from `.factory/claims.json` passed from the clean checkout after dependency install. |
| Live first-read/demo | PASS | Live cold viewport answers what/who/first click, shows the game board, and sample demo reaches **Garden restored**. Screenshot: `/tmp/pause-garden-live-cold.png`. |
| Live remote play | PASS for deployed artifact | Two live contexts created room `B5W5J`, joined as Jules, refreshed/reconnected, alternated 12 turns, and both saw **Chapter complete**. This does not cure the identity mismatch. |
| Privacy and headers | PASS | Demo request log contained only `https://pause-garden.sociobot.in`; no demo room connection. Static headers include HSTS, CSP with `frame-ancestors 'none'`, `nosniff`, Referrer-Policy, and Permissions-Policy. |
| API allowance | PASS | A 280-request concurrent `/api/status` probe observed 46 × 200 then 234 × **429**, each with `Retry-After: 2`; observed burst allowance is 46 in this probe. |
| PWA/offline | PASS | Local claim passed. Live demo registered a service worker; update completed and offline reload retained demo/offline status. |
| Accessibility | PASS with CLI note | Playwright Chromium + Axe found no serious/critical findings on valid and 404 routes at desktop and 390px. One `main` and one `h1` on every route; no valid-route console/page errors. `npx @axe-core/cli` could not run because the worker image has no system Chrome binary. |
| Reduced motion/mobile | PASS | Local 390px and 44px target tests pass. Live reduced-motion demo had no `#motes`; live mobile had no horizontal overflow. |
| Candidate equals live | **FAIL** | See P0. |

## Blocking defect

### P0 — live deployment is not candidate `1ab9ba0`

Candidate production build:

```
dist/index.html                    fadac8095ccd3ae1b29b5b7ac02a7aa0fd20f6ab72e1c6c54d778f99ffb51654
dist/assets/main-BkvH-8yi.js       a0cc7bfb15c49cc8daf4aa89605f66fa775e9fcf3aae9eea1737e756f4fbc485
```

Live HTML instead references `assets/main-BBPkgcOE.js` (SHA-256
`cbd8a189570048330e20b8fa7c2e391b90c8d549d49f2907119d23279119a70d`).
`main-BkvH-8yi.js` returns HTTP 404 live. The room health endpoint reports
build `f1c883faac0d9b3a93df79b7e51cee6bd84ed30f`, not `1ab9ba0`.

**Required correction:** deploy `dist/` made by `npm run build:production`
from exactly `1ab9ba039c16975014a5ac499447cf3e6f3edcc1`, and deploy the room
service from the same commit. Recheck live asset hashes and `/health` identity
before release.

## Notes

- No product code was modified during verification.
- Pre-existing unrelated changes under `graphify-out/` were preserved and not staged.
- Live functional observations apply to its older deployed artifact only; they
  cannot substitute for a candidate-matching deployment.
