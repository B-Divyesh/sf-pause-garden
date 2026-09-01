# Verification 2 — FAIL

**Candidate:** \`31c915f9b60e40ae5f4ac9a7f51f9d5af72a4b3c\`
**Live URL:** <https://pause-garden.sociobot.in>
**Room service:** <https://pause-garden-realtime.sociobot.in>
**Verified:** 2026-09-01 UTC
**Decision:** **FAIL — release blocked by a static-frontend deployment mismatch.**

## First read

Cold-loading the live home page plainly says it is a 12-turn game for 2–4
players, for friends with interrupted evenings, and directs the visitor to
**Try it with sample data**. It explains that the sample opens a garden on turn
seven with no setup. The first viewport visibly contains the garden board, not
a menu wall. This passes the plain-words and one-click demo gate.

## Candidate checks

The exact candidate was checked out in an isolated worktree at
\`/tmp/pause-garden-verify\`; \`npm ci\` completed successfully.

| Check | Result | Evidence |
| --- | --- | --- |
| Required claims file | PASS | \`.factory/claims.json\` exists and declares 15 claims. |
| Every exact declared claim command | PASS | All 15 commands were run separately from the clean install. The final Playwright \`test-results/.last-run.json\` records \`status: passed\` with no failed tests. |
| Full unit/integration/browser suite | PASS | \`npm test\`: 6 Vitest tests and 18 Chromium tests passed. |
| Type check and production build | PASS | \`npm run build\` completed and emitted \`dist/\`. Candidate JS was 31.25 KB raw and CSS 12.67 KB raw; the production-origin build was 10.93 KB gzip JS and 3.85 KB gzip CSS. |
| Candidate backend identity | PASS | Live \`/health\` returned \`{"ok":true,"build":"31c915f9b60e40ae5f4ac9a7f51f9d5af72a4b3c","storage":"sqlite"}\`. |
| Candidate static frontend identity | **FAIL** | See P1 below. |

The separately executed claim coverage included chapter completion, reset,
sleeping-player handoff, two-browser remote play and reconnect, sound
persistence, offline reload, same-origin demo privacy, keyboard controls,
two-to-four player setup, Host Edition state, seeded determinism, 55 FPS frame
pacing, free chapter creation, and the no-timer/account/chat rules.

## Independent live QA

| Area | Result | Evidence |
| --- | --- | --- |
| Demo/game loop | PASS | From live \`/demo\`, tending Bed 3 reached **Garden restored**; replay returned to turn 1 with zero points. A fresh keyboard-only run focused Bed 1, used ArrowRight twice, pressed Enter, and reached the same end state. |
| Real remote game | PASS | Two isolated browser contexts created and joined room \`5ABN4\`, alternated all 12 valid actions, refreshed the second context on turn 3 and reconnected, reached the real end state (**Chapter complete**), then host restart returned to turn 1. |
| Invalid input and recovery | PASS | Joining \`AAAAA\` with a name displayed “That room code was not found. Check it and try again.” |
| Demo privacy | PASS | Request logging through demo completion recorded only \`https://pause-garden.sociobot.in\` requests; no cross-origin player-data request occurred. |
| Offline/PWA | PASS | In a fresh context, the visited live demo registered its service worker; after \`context.setOffline(true)\` and reload, the board and “Offline — demo turns still save here” remained available. |
| Rate limit | PASS | Source documents a 40-request burst and 20 tokens/second. A single live client made 50 \`/api/status\` calls: 43 returned 200 and request 44 was the first of 7 responses with 429, \`Retry-After: 2\`, and \`{"error":"rate_limited"}\`. The small difference from 40 is refill during the burst. |
| Desktop/mobile/keyboard/motion | PASS | At 390 × 844, \`scrollWidth === clientWidth === 390\`; controls were visible; focus was a solid 3 px outline. Reduced-motion media matched and the CSS reduces animation/transition duration. |
| Accessibility | PASS | Axe 4.10, injected at document init to respect the site CSP, found zero serious/critical findings on \`/\`, \`/demo\`, \`/play\`, \`/privacy\`, \`/terms\`, and the 404 route. Each had exactly one h1 and one main landmark. |
| URL verifier and errors | PASS | \`/opt/fleet/lib/verify-url.sh https://pause-garden.sociobot.in /tmp/pause-garden-verify-url.bsq4Lh\` passed: HTTP 200, load 590 ms, title/lang/main present, no missing image alt or unnamed button, and no console/page errors. |
| Headers and caching | PASS for the live deployment | HSTS, nosniff, Referrer-Policy, CSP with a response-header \`frame-ancestors 'none'\`, and Permissions-Policy are present. The live hashed JS and CSS return \`Cache-Control: public, max-age=31536000, immutable\`. |

## Defects

### P1 — live static frontend is not candidate 31c915f

The requested release candidate cannot be accepted unless the live deployment
matches it. It does not:

- A clean candidate build without an injected room origin emitted
  \`dist/assets/main-CsZKoNbI.js\` (31,249 bytes,
  SHA-256 \`a026e0b9f970fbf25f2396a32d84dc21808b6fbeea5b814901911178ac136cf6\`).
- Building the same candidate with the known production room origin emitted
  \`main-CNwY5fXg.js\` (31,160 bytes,
  SHA-256 \`35cbd0ba4e244c9efa6066fd04eb842cc99b111278227ab127f2fba1ad3201c6\`).
- Live HTML instead references \`/assets/main-ZjqvD3iJ.js\` (31,493 bytes,
  SHA-256 \`44016548a9d66fff14bc6017cfbe6bdc4e70184459f4b456c629fd77ba7b6868\`).
- Candidate \`public/staticwebapp.config.json\` uses an SPA navigation fallback;
  the live site instead returns the later styled 404 with HTTP 404 for an
  unknown path. This independently confirms a different static deployment.

The room service does identify candidate 31c915f, and its observed behavior is
good. The static site, however, is another build/revision. Deploy the static
\`dist/\` generated from exactly 31c915f (with the intended production
environment values), then repeat the asset-hash and route checks.

## Reproduction

\`\`\`sh
git worktree add --detach /tmp/pause-garden-verify 31c915f9b60e40ae5f4ac9a7f51f9d5af72a4b3c
cd /tmp/pause-garden-verify
npm ci
npm test
npm run build
curl -sS https://pause-garden.sociobot.in/ | rg 'main-.*\\.js'
\`\`\`

The candidate is otherwise functional, but this P1 prevents an unambiguous
release acceptance.
