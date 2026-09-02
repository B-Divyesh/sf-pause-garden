# Pause Garden polish round 1

Date: 2026-09-02 UTC. Candidate base: `23fd6060b0e7326ee027505e256a551cd15402c5`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| `F-1-1` dead checkout | Removed the broken checkout and unusable license path. Host Edition now has a disabled unavailable state, clear copy, and no payment link. | `@claim:checkout-unavailable`; local landing screenshot `.factory/evidence/polish-1/home-desktop.png`; terms route test. |
| `F-1-2` deployed artifact mismatch | Replaced hard-coded old hashes with a build manifest and checksum verifier for the current production build. Deployment and live hash evidence are recorded below after release. | `npm run build:production`; `node scripts/verify-static-candidate.mjs`. |
| `F-1-3` `/?demo=1` opened landing | The query entry now replaces the URL with `/demo` before first render. It seeds only `demo:pause-garden:room`, shows the banner, and discards demo state on exit. | `@claim:demo-isolation`; `.factory/evidence/polish-1/demo-mobile.png`. |
| `F-1-4` unknown paths returned 200 | Removed the catch-all navigation fallback. Four valid app routes rewrite explicitly; all other paths use the styled `404.html` with HTTP 404. | `routes set unique titles, metadata, focus, and HTTP status`; `.factory/evidence/polish-1/not-found.png`; static-candidate verifier. |
| `F-1-5` unlisted and incomplete claims | Expanded the manifest to 20 claims. Added touch input, weather sequence, room boundary, SQLite durability, 30-day expiry, demo isolation, and unavailable-checkout coverage. Removed the unsupported license assertions. | Every `@claim:*` tag appears in exactly one test; `npm test` passes 8 unit/integration and 22 browser tests. |
| `F-1-6` slogan headings | Replaced the four flagged headings with section names: “Turn handoff and chapter goals,” “Limits and privacy,” “Host Edition availability,” and “Purchase status.” | `src/main.ts`; `.factory/copy-audit.md`; landing screenshots. |
| `F-1-7` README jargon and long sentence | Rewrote the private-token, build-checksum, direct-link, and room-server text in plain words. Split the 29-word suite sentence. | `README.md`; banned-word scan and 22-word copy audit. |
| `verification.md P0` remote rooms/reconnect | Preserved the product-owned WebSocket room service, independent browser join, synchronized turns, refresh reconnect, and SQLite recovery. | `@claim:remote-room-play`, `@claim:remote-reconnect`, `@claim:room-storage-sqlite`. |
| `verification.md P1` flaky FPS gate | Preserved the stable 90-frame median-pacing measurement and required 55 FPS in aggregate runs. | `@claim:rendering-rate`; full `npm test`. |
| `verification.md P2` immutable caching | Preserved year-long immutable caching for hashed `/assets/*`. | `public/staticwebapp.config.json`; live asset-header check below. |
| `verification.md P2` design/game mismatch | Kept the corrected difficulty contract: targets are 14, 15, and 16; Wind adds one tend point. | `src/game.ts`; `.factory/design.md`; unit suite. |
| `verification-2.md P1` candidate mismatch | The verifier now records hashes from the exact current build. The uploaded `dist/` is compared with the live hashed JS and CSS. | Static manifest and live checksum evidence below. |
| `verification-3.md P3` demo query | Fixed and covered as part of `F-1-3`. | `@claim:demo-isolation`. |
| `verification-3.md P3` 404 semantics | Fixed and covered as part of `F-1-4`. | HTTP-status browser test and live `curl` evidence below. |

## Local visual checks

- 390 × 844 landing: `.factory/evidence/polish-1/home-mobile.png`
- 390 × 844 query-entry demo: `.factory/evidence/polish-1/demo-mobile.png`
- 1440 × 950 landing: `.factory/evidence/polish-1/home-desktop.png`
- Styled 404: `.factory/evidence/polish-1/not-found.png`

All four screenshots have no horizontal overflow. The mobile demo keeps the
banner, status, 4 × 4 board, actions, goals, players, and history readable.

## Live deployment evidence

This section is completed after the production upload and cold verification.
