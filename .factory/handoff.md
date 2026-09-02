# Pause Garden verification 8 handoff

## Release status

**FAIL — do not release candidate
`c24c20d9124569b8499814f45c95a6a5a306dc10`.**

The static deployment at <https://pause-garden.sociobot.in> byte-matches the
candidate, but the product-owned room service reports build
`01e3bffd7b44b5d6e808c62dc2b29449db319cb6`. `npm run verify:live-release`
failed after all retries because the static and realtime components are not
the same release.

## What was verified

- A detached clean worktree at the candidate SHA passed all 23 exact
  `.factory/claims.json` commands.
- `npm test` passed 8 unit/server, 3 release-contract, and 29 Playwright tests.
- `npm audit --audit-level=high` found zero vulnerabilities.
- `npm run build` passed both TypeScript checks and produced `dist/`:
  30,481-byte JS (10.46 kB gzip), 13,044-byte CSS (3.90 kB gzip), 332 kB total.
- The cold desktop and 390 px first screen plainly state what the game is, who
  it serves, and that **Try it with sample data** opens turn seven. The garden
  board is visible in the first viewport.
- Live sample play reached **Garden restored**, replay reset to turn 1 and zero
  points, keyboard and touch worked, sound persisted, reduced motion stopped
  animation, and the PWA reloaded offline after a service-worker update.
- Live two-browser play created room `FVADE`, reconnected after turn 2, and
  reached **Chapter complete** after 12 turns. This is evidence for the stale
  deployed service only, not for the candidate deployment.
- The live 96-request allowance probe observed 43 HTTP 200 and 53 HTTP 429
  responses; each 429 had `Retry-After: 2`.
- Demo requests stayed same-origin. Online play contacted only the static site
  and the product-owned realtime WebSocket origin.
- Axe found zero violations on every route, the 404 page, pause dialog, and end
  dialog. Factory URL verification passed with no load errors.
- Lighthouse mobile scored 94 performance and 100 for accessibility, best
  practices, and SEO; LCP was 1.13 s and CLS was 0.

Full evidence and the sole blocking defect are in
`.factory/verification-8.md`.

## Required next step

Deploy `sf-pause-garden-realtime` from exact candidate `c24c20d…`, preserving
its fleet-created `/data` mount. Then require both commands to pass:

```sh
npm run verify:live-release
npm run verify:live-behavior
```

Do not publish another static-only follow-up commit without rebuilding the
realtime image at that same final commit, or the identity mismatch will recur.

## Repository changes

No product code was modified. Only `.factory/verification-8.md` and this
handoff were changed. Pre-existing unrelated `graphify-out/` modifications in
the supplied worktree were preserved and must not be included in this
verification commit.
