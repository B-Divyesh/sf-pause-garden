# Verification 6 — FAIL

**Candidate:** `023c8f0d27c79ac1114d9c5364ca5bd6a55a0cf8`  
**Live URL:** <https://pause-garden.sociobot.in>  
**Verified:** 2026-09-02 UTC

## Decision

**FAIL.** The clean repository candidate is healthy, but the production static artifact and room server are not the candidate. A required live two-browser, 12-turn run also failed to reach an end screen. This is a release blocker.

## First read

A cold desktop load says: “Restore a garden, even when friends pause.” It identifies friends with interrupted evenings, and the first action is **Try it with sample data**, followed by “A garden opens on turn seven. No setup is needed.” The first viewport includes a visible 4×4 garden board preview. The first-read, plain-words, and one-click sample-demo gates pass.

## Clean candidate verification

Clean clone: `/tmp/pause-garden-verify-GZo60k`, checked out at the exact candidate SHA. `npm ci` installed 66 packages with zero reported vulnerabilities.

All **23** entries in `.factory/claims.json` were run individually using their exact declared commands from that clone. Every command exited 0. This covers chapter completion, restart, sleeping-player handoff, remote room and reconnect, sound persistence, offline reload, privacy request boundary, keyboard/touch, 2–4 players, session copy, deterministic seed/weather, frame pacing, free chapter, privacy rules, demo isolation, room boundary, SQLite durability/expiry, checkout state, and build identity.

`npm test` also passed: 8 Vitest tests, 2 release-contract tests, 28 Playwright desktop/mobile tests, and production-artifact isolation. Exact production build passed:

```
npm run build:production
# JavaScript: 30.48 kB raw / 10.46 kB gzip
# CSS:        13.04 kB raw / 3.90 kB gzip
# dist total: 332 kB (including art)
```

The clean candidate's expected production asset is `/assets/main-OU0I22Qc.js`, SHA-256 `62d9ef917f13e74c92d297fe599aad3cc4cda6770c6de26ceb3cf4429e1300c2`.

## Live checks

| Area | Result | Evidence |
| --- | --- | --- |
| Cold first read and sample | PASS | One-click `/demo` starts turn 7; Tend on bed 3 reaches **Garden restored**. |
| Demo privacy | PASS | Playwright recorded only `https://pause-garden.sociobot.in` during demo completion. |
| Offline reload | PASS | After service-worker control, live `/demo` reloaded offline and displayed “Offline — demo turns still save here.” |
| Desktop/mobile and keyboard | PASS | No console/page errors; no 390px horizontal overflow; touch and keyboard complete the demo. |
| Accessibility | PASS | Live Axe run found zero serious/critical issues on `/demo`; one h1/main observed. |
| Motion/frame pacing | PASS | Live 90-frame sample median: 59.88 fps. |
| Headers/caching | PASS | HSTS, CSP (including `frame-ancestors 'none'`), `nosniff`, Referrer-Policy and Permissions-Policy are present. Hashed JS is `max-age=31536000, immutable`; unknown route is HTTP 404. |
| Candidate equals deployment | **FAIL** | See P0. |
| Real online scripted run | **FAIL** | See P1. |
| Rate allowance | **FAIL** | See P1. |

## Blocking defects

### P0 — deployed static and realtime components do not match candidate

`npm run verify:live-release` failed from the clean clone. The live manifest claims the candidate SHA, but it actually contains:

```
live HTML SHA-256:  afdc3a408511c6d5fd27c51634666f43a3adf891d0168cba9c16c99764175f51
candidate HTML SHA: 203f962b3d0a162addd6a39d4781ec7fdccd32cd6a467e2cb00a505305bc0663
live JS:             /assets/main-Ci_fJca5.js
candidate JS:        /assets/main-OU0I22Qc.js (live returns HTTP 404)
room /health build:  148c70595c48b4095ad96338e3a7d03fb47339cf
expected build:      023c8f0d27c79ac1114d9c5364ca5bd6a55a0cf8
```

The service worker checksum and CSS happened to match; that does not make the release coherent. Deploy static `dist/` and the realtime image from the same clean candidate commit, then require `npm run verify:live-release` to exit 0.

### P1 — deployed remote chapter does not end at the documented 12 turns

Two fresh live contexts created and joined room `8GY2R` as Mara and Jules, alternated a valid action 12 times, and refreshed/reconnected Jules after turn two. Both browsers displayed **12 of 12**, still showed active action controls, and had neither **Chapter complete** nor an end summary. The required browser-game run is title → active play → real end screen; the deployed game failed that run. This behavior applies to the stale live room service, but blocks this candidate until the matching pair is deployed and rechecked.

### P1 — observed live API rate allowance was not enforced

The server source documents a 40-token per-client bucket, 20 tokens/second refill, and `429` with `Retry-After: 2`. From one verifier client, 48 rapid requests plus 96 concurrent `/api/status` requests all returned HTTP 200; no `429` or `Retry-After` was observed. This fails the required deployed endpoint allowance check. Recheck after deploying the candidate and prove a single client receives 429 with `Retry-After` after the documented allowance.

## Notes

- No product code was modified.
- Existing unrelated `graphify-out/` changes in the supplied working tree were preserved and not staged.
- Local test logs and live screenshots were captured under `/tmp/pause-garden-verify-results/` during this disposable verification run.
