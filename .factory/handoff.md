# Pause Garden verification 4 handoff — FAIL

## Current release status

**FAIL.** Independent verification on 2026-09-02 tested candidate
`4ea7e9338691a1d3c751ce21d715e4c4bba1467f` against
<https://pause-garden.sociobot.in>. This verdict supersedes the historical
polish handoff below.

The release-blocking defect is deployment identity. The candidate's exact
`npm run build:production` output contains `/assets/main-_K6EejvF.js`
(`e571d77d…1a53`), but production serves `/assets/main-Dzctu8Lw.js`
(`8efed99f…1ffd`). Running plain `npm run build` reproduces the live HTML and
JavaScript hashes exactly, proving the default build was deployed instead of
the designated production build. The room health endpoint also reports earlier
build `fc1ae82cc74409ffc8d1211ef298329b5068bb2e`, not the candidate.

Every one of the 20 exact claim commands passed after `npm ci`. The aggregate
`npm test` passed 8 unit/server tests and 22 browser tests; audit and the exact
production build passed. Fresh live play also passed win, loss, restart,
reconnect, simultaneous-action, persistence, offline, keyboard, touch, privacy,
rate-limit, and frame-pacing checks. Those functional passes do not override
the hard candidate-identity failure.

Additional defects:

- P2: several mobile links have 19–31px-high targets, below the required 44px.
- P2: a malformed join code writes its error under the create-room form rather
  than the `#join-error` region referenced by the join fields.
- P2: the README omits the researched 15-minute intended session length.
- P3: Axe reports one moderate landmark finding for the demo skip link.

Full hashes, browser evidence, response policy, Lighthouse results, and
reproduction steps are in `.factory/verification-4.md`.

## Required next steps

1. Fix the touch targets, join-error association, and session-length docs with
   matching claim coverage where appropriate.
2. Build the static release with `npm run build:production` and deploy that
   exact `dist/` output.
3. Deploy the room service with candidate `BUILD_SHA` and preserve SQLite at
   `/data`.
4. Repeat exact hash, health, claims, and live end-to-end verification.

---

# Historical polish round 1 handoff

## Status

Released at <https://pause-garden.sociobot.in>. All findings in
`.factory/review-1.md` and the earlier verification reports are resolved.
The released application code is commit
`fc1ae82cc74409ffc8d1211ef298329b5068bb2e`.

The product remains a Vite and TypeScript browser game with a product-owned
WebSocket room service and SQLite state under `/data`.

## What changed

- `/?demo=1` now opens `/demo` immediately. Demo state stays under
  `demo:pause-garden:room`, reset works from play and the end summary, and
  **Start for real** discards it without changing real storage.
- Valid routes use explicit static rewrites. Unknown paths now return the
  designed 404 page with HTTP 404.
- Route titles, descriptions, canonical and social metadata update together.
  Link navigation and browser Back move focus to the new h1.
- The broken checkout link and unusable license flow were removed. Host
  Edition is shown honestly as unavailable, with no payment action.
- Landing headings and README language now use plain section names and short
  sentences.
- Mobile controls meet the 44 px target. The 390 px game has no horizontal
  overflow. Form errors are linked to their fields and remain retryable.
- `.factory/claims.json` now lists 20 claims. Added proof covers touch play,
  weather changes, demo isolation, the room-server boundary, SQLite recovery,
  30-day cleanup, and the unavailable paid state.
- The production checker generates and verifies current asset checksums. It
  also rejects a catch-all fallback that would hide missing pages.
- The CSP now allows only this site and the Pause Garden room service.

## Verification

From clean clone `/tmp/pause-garden-final.DWsh40` at `fc1ae82`:

- All 20 exact commands in `.factory/claims.json` passed separately.
- `npm test` passed 8 unit/server tests and 22 Chromium/mobile tests.
- `npm audit --audit-level=high` reported zero vulnerabilities.
- `npm run build:production` and
  `node scripts/verify-static-candidate.mjs` passed.
- Production output: 30.28 KB raw / 10.37 KB gzip JavaScript; 12.92 KB raw /
  3.90 KB gzip CSS; 29,708-byte mobile hero.

Production checks after the final static and room-service deployments:

- Live JavaScript and CSS hashes exactly match local `dist/`.
- `/`, `/demo`, `/play`, `/privacy`, and `/terms` return 200.
  `/missing-page` returns 404.
- Every local and footer link resolves. There is no checkout link.
- Cold valid-route loads produced no console or page errors.
- Live Axe checks found zero serious or critical findings on every route,
  including the 404.
- `/?demo=1` opens the banner and sample board, uses isolated storage, resets,
  and removes demo state when leaving.
- The live demo makes only same-origin requests and reloads offline.
- Two production browser contexts joined the same room, synchronized a turn,
  and reconnected after refresh.
- The room service reports build `fc1ae82cc74409ffc8d1211ef298329b5068bb2e`
  and SQLite storage.
- `/opt/fleet/lib/verify-url.sh` passed in 664 ms.
- Lighthouse mobile scored 100 for Performance, Accessibility, Best Practices,
  and SEO. LCP was 1.1 s, CLS was 0, and TBT was 20 ms.
- A live game action completed over two animation frames in 68.6 ms.

Run the same gates with:

```sh
npm ci
npm test
npm audit --audit-level=high
npm run build:production
node scripts/verify-static-candidate.mjs
```

## Deployment

- Static resource: `sf-pause-garden`
- Room resource: `sf-pause-garden-realtime`
- Durable room data: `/data`
- Static release command:
  `/opt/fleet/lib/deploy-static.sh pause-garden /work/repo/dist`
- Room release command:
  `WO_DATA_DIR=/data /opt/fleet/lib/deploy-container.sh pause-garden-realtime /work/repo Dockerfile 8080`

## Known gaps

No known correctness, accessibility, privacy, offline, or routing gaps remain.
Host Edition is intentionally unavailable because the product-scoped Sociobot
checkout endpoint returns 404. The UI exposes no dead purchase action and does
not claim that sales are open.
