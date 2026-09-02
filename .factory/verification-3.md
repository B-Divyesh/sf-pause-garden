# Pause Garden independent verification 3 — PASS

Verified on 2026-09-02 UTC against candidate
`31c915f9b60e40ae5f4ac9a7f51f9d5af72a4b3c` and
<https://pause-garden.sociobot.in>.

## Verdict

**PASS.** The deployed static client is byte-identical to a clean production
build of the candidate. The product-owned realtime service reports the same
build SHA and SQLite storage. The core remote, interruption-tolerant game loop
works through a real end condition.

## Required claims and local quality gates

I made an isolated clean worktree at the candidate, ran `npm ci`, then ran
every exact command in `.factory/claims.json` sequentially through the demo
entry point. All 15 claim commands passed:

`chapter-complete`, `restart-reset`, `sleeping-handoff`, `remote-room-play`,
`remote-reconnect`, `settings-persist`, `offline-reload`,
`privacy-same-origin`, `keyboard-controls`, `two-to-four-players`,
`paid-host-edition`, `seed-determinism`, `rendering-rate`, `free-chapter`, and
`calm-private-rules`.

The clean aggregate gates also passed:

- `npm test`: 6 Vitest unit/server tests and 18 Playwright tests passed.
- `npm run build`: passed; `dist/` was created.
- Initial JS: 31,249 bytes raw / 10,961 bytes gzip. CSS: 12,674 bytes raw /
  3,850 bytes gzip. The mobile hero is 29,708 bytes WebP.
- The browser animation claim sampled 90 frames and passed its 55 fps median
  threshold as part of both the individual claim and aggregate run.

## Production identity and behavior

- `GET https://pause-garden-realtime.sociobot.in/health` returned
  `{ "ok": true, "build": "31c915f9b60e40ae5f4ac9a7f51f9d5af72a4b3c",
  "storage": "sqlite" }`.
- SHA-256 matched exactly between local `dist/` and production for
  `index.html` (`b0e967…fef6`), the JS bundle (`a026e0…6cf6`), and the CSS
  bundle (`8f0c21…f10c`).
- A cold desktop read answered the job, audience, and first action in plain
  words: “Restore a garden, even when friends pause”; “For friends with
  interrupted evenings…”; and “Try it with sample data.” The first viewport
  includes the garden board rather than a menu wall. Screenshot evidence:
  `/tmp/pause-garden-live-cold.png`.
- Live title → sample action → active play reached “Garden restored”; “Play
  this seed again” reset to `1 of 12` and `0 / 15`; sound remained off after a
  reload. No browser console or page errors occurred.
- A live two-client WebSocket run created and joined room `M3R4G`, alternated
  through all 12 turns, and reached the server’s `lost` end condition at
  revision 13. The browser suite separately verifies the two-browser UI end
  screen and refresh reconnect path.
- Invalid room code `AAAAA` produced the recoverable message “That room code
  was not found. Check it and try again.”

## Privacy, security, accessibility, and resilience

- In a fresh live demo context, the complete flow requested only the page,
  same-origin JS, and same-origin CSS. There were no cross-origin requests or
  demo WebSocket connections.
- Response headers include HTTPS/HSTS, `nosniff`, strict referrer policy,
  restrictive CSP with `frame-ancestors 'none'`, and permissions policy.
  Hashed JS has `Cache-Control: public, max-age=31536000, immutable`.
- Axe found no serious or critical findings on `/`, `/demo`, `/play`,
  `/privacy`, `/terms`, or the custom missing-page view. Each had one `h1`,
  one `main`, `lang=en`, route-specific title, and no page/console errors.
- At 390 px the live demo had `scrollWidth === clientWidth === 390`; its board
  and controls remained visible. Keyboard arrows followed by Enter completed
  the sample. In reduced-motion mode the motes canvas was absent.
- The production service worker was controlling `/demo`; `registration.update()`
  completed with the active `/sw.js`, and an offline reload showed the demo’s
  offline state.
- The service’s 40-token, 20-token/second per-IP bucket was exercised with 50
  concurrent `/api/status` requests. Observed result: 42 `200`, then 8 `429`
  responses, each with `Retry-After: 2`; the two extra successes are expected
  replenishment during the concurrent request window.

## Findings

- P3 documentation: `.factory/demo.md` says `/?demo=1` is a direct demo
  alternative, but the live URL renders the landing page. `/demo`, the
  documented primary demo URL and the catalog/verifier entry point, works
  correctly. Remove the query alternative or add a claim-backed redirect.
- P3 HTTP semantics: `/missing-page` renders the designed client-side 404 but
  the static host returns HTTP 200 because SPA navigation fallback handles the
  route. This does not affect game play or accessibility, but a true HTTP 404
  would be better for crawlers.

