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

- Static app: <https://pause-garden.sociobot.in>
- Room service: <https://pause-garden-realtime.sociobot.in>
- Live static files match local `dist/`: JavaScript SHA-256
  `e571d77d82e91d810c0050e823b8f60af9ce767a10cce2ffc411d1e22e271a53`;
  CSS SHA-256
  `405c7f391d2a8e035a8bd11b155e7eda1c2d99ed35671a1b4dc600c600616b78`.
- Cold HTTP results: `/`, `/demo`, `/play`, `/privacy`, and `/terms` returned
  200. `/missing-page` returned 404 with the designed page.
- `/?demo=1` became `/demo`, displayed turn 7 and the demo banner, preserved a
  real-storage sentinel, reset after the end summary, and removed demo state
  on **Start for real**.
- Live Axe checks found zero serious or critical issues on all five routes and
  the 404. Route navigation and browser Back both focused the new h1.
- A 390 × 844 cold context measured `scrollWidth = clientWidth = 390`.
- The live demo request log was same-origin only. A separate live offline
  reload kept the board and offline status available.
- Two live browser contexts joined room `8RXT5`, synchronized turn two, and
  restored the second player after reload.
- The room-service health response reported build
  `fc1ae82cc74409ffc8d1211ef298329b5068bb2e` and `storage: sqlite`.
- `/opt/fleet/lib/verify-url.sh` passed in 664 ms with no errors.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; LCP 1.1 s, CLS 0, TBT 20 ms. A live action updated over two frames
  in 68.6 ms.
