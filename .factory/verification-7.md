# Verification 7 — FAIL

**Candidate:** `422c2e71d1de5aee2472aa2b37bc42b12339c73b`  
**Live URL:** <https://pause-garden.sociobot.in>  
**Verified:** 2026-09-02 UTC

## Decision

**FAIL — do not release this candidate.** The static site is exactly the
candidate, but the deployed Pause Garden room service identifies itself as
`b064daa1f1d2816ef472ef9f555928369f63ae14`, not the candidate. An online
co-op game is one release across static and realtime components; this mixed
deployment cannot be accepted.

## First read

A cold desktop load says “Restore a garden, even when friends pause.” It says
it is for “friends with interrupted evenings,” and the first action is **Try
it with sample data** with the immediate result “A garden opens on turn seven.
No setup is needed.” The visible first viewport already includes the garden
board (not a menu wall). This passes the plain-words and one-click sample
requirements.

## Clean candidate checks

`npm ci` installed 66 packages with zero vulnerabilities. Every exact command
in all **23** `.factory/claims.json` entries was run serially from the demo
entry point; all passed. This includes chapter completion/restart, sleeping
handoff, remote room/reconnect, offline reload, privacy boundary,
keyboard/touch, 2–4 players, deterministic weather, SQLite persistence and
expiry, 55-FPS pacing, demo isolation, build identity, and production-build
isolation.

`npm test` passed: 8 unit/server tests, 2 release-contract tests, and 29
desktop/mobile Playwright tests. The available type checks run in the build
(`tsc --noEmit` and `tsc -p server/tsconfig.json`) passed. There is no separate
lint script. The exact production command passed:

```text
npm run build
main-OU0I22Qc.js  30.48 kB raw / 10.46 kB gzip
main-Ce1lVhFR.css 13.04 kB raw / 3.90 kB gzip
dist total        332 kB
```

## Live checks

| Area | Result | Evidence |
| --- | --- | --- |
| Candidate static files | PASS | Live HTML, manifest, service worker, JS and CSS checksums match the locally built candidate. JS is `30,481` bytes, SHA-256 `62d9ef917f13e74c92d297fe599aad3cc4cda6770c6de26ceb3cf4429e1300c2`. |
| Real co-op run | PASS | `npm run verify:live-behavior` created room `6ETMV`, joined two independent contexts, reconnected one after turn 2, alternated 12 actions, and both reached **Chapter complete**. |
| Loss/restart/game conditions | PASS | The deterministic core and the declared restart claim passed. The game ends as **Garden restored** when both goals are met, or **Chapter complete** with an action-order retry when the 12-turn goal is missed; the end dialog supplies **Play this seed again**. |
| Rate allowance | PASS | 96 same-client `/api/status` probes observed 44 `200`, 52 `429`; every limited response had `Retry-After: 2`. |
| Demo privacy/offline | PASS | Demo completion requested only `https://pause-garden.sociobot.in`; after SW control it reloaded offline and showed the offline state. |
| Keyboard/mobile/motion | PASS | Arrow navigation moved bed focus (`data-bed 0` to `1`), with a visible `rgb(143,199,217)` 3px outline; keyboard and 390px touch completed the sample without horizontal overflow; reduced-motion context exposed no running animations. |
| Accessibility | PASS | Live Axe scan found no serious/critical findings on `/`, `/demo`, `/play`, `/privacy`, `/terms`; each had one `<h1>` and `<main>`. The expected console 404 was the only error observed on `/missing-page`; normal routes had none. |
| Headers/caching | PASS | HSTS, `nosniff`, strict-origin referrer policy, CSP with response-header `frame-ancestors 'none'`, and permissions policy present. Hashed JS uses `max-age=31536000, immutable`; `sw.js` is `no-cache`; unknown route returns HTTP 404. |

## Blocking defect

### P0 — realtime service deployment does not match the candidate

Fresh `npm run verify:live-release` failed after its retries. Static identity
matched exactly, but `/health` returned:

```json
{"ok":true,"build":"b064daa1f1d2816ef472ef9f555928369f63ae14","storage":"sqlite"}
```

The expected build is
`422c2e71d1de5aee2472aa2b37bc42b12339c73b`. Deploy the realtime image from the
same pushed candidate as the static `dist/`, preserving its fleet-created
`/data` mount, then rerun `npm run verify:live-release` and
`npm run verify:live-behavior`. Do not treat the currently working stale
service as evidence for this candidate.

## Notes

- No product code was modified.
- Existing unrelated `graphify-out/` worktree changes were preserved and not
  staged.
