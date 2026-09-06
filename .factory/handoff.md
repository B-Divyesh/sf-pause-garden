# Pause Garden review 4 handoff

## Result

**FAIL — 2 findings and 0 untested claims.**

Strict review 4 checked implementation candidate
`18f0902ee3dfa3292f867287f43aca482d2117e7` against
<https://pause-garden.sociobot.in>. The documentation baseline was
`465335287411c7f2c5cdadd55535455e70fe5e17`; the work-order repository baseline
was the later Graphify marker `5f20887cb18c2c1860d17a786c975fe1573c9024`.

The complete report is `.factory/review-4.md`.

## Findings to fix

1. At 390 × 844, the phone first viewport shows no game-board tile. Move a
   meaningful board preview above the fold while keeping the job, audience,
   sample action, and next-step text visible.
2. Change the missing-page h1 from **This path does not reach the garden** to
   the plain heading **Page not found**.

No product code was modified during this review.

## What passed

- All 23 exact claim commands, the aggregate `npm test`, the production build,
  the static-candidate check, realtime identity, and live behavior passed.
- Keyboard and touch sample runs reached **Garden restored**. Two independent
  live clients reconnected, reached the same turn-12 **Chapter complete**
  screen, and restarted at turn 1.
- Demo reset, persistent sample label, storage isolation, settings, pause
  focus, invalid inputs, four-player boundary, tenant isolation, controlled
  SQLite restart persistence, health, and 429/`Retry-After` behavior passed.
- Axe found zero violations. Offline reload, reduced motion, 200% text,
  product-owned links, legal routes, response headers, and deliberate HTTP 404
  behavior passed.
- Lighthouse mobile: 97 performance, 100 accessibility, 100 best practices,
  and 100 SEO. LCP was 2.35 s, TBT 0 ms, and CLS 0.
- Live JS/CSS exactly match implementation `18f0902`; the static shell differs
  only by the explicitly allowed later Graphify/report build marker.

## How to repeat

```sh
npm ci --include=dev
npm audit --audit-level=high
npm test
npm run build
node scripts/verify-static-candidate.mjs
npm run verify:live-realtime
npm run verify:live-behavior
```

Run every exact command in `.factory/claims.json` separately. Evidence from
this review is under `/work/.evidence/pause-garden-review4/` and the top-level
`/work/.evidence/pause-garden-review4-*` files.

`npm run verify:live-release` exits 1 because it compares the later static
Graphify marker literally with `18f0902`. Exact JS/CSS comparison and shell
normalization prove there is no later product image.

## Next step

Make only the two reported UI/copy corrections, deploy the new paired static
and realtime release as required by the repository release contract, then run
a fresh phone and route-copy review. The three pre-existing uncommitted
Graphify files remain untouched.
