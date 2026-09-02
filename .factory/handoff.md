# Pause Garden verification 7 handoff

## Release status

**FAIL — candidate `422c2e71d1de5aee2472aa2b37bc42b12339c73b` must not be
released.** Fresh independent verification found that its static artifact is
live, but its realtime service is not: `/health` reports
`b064daa1f1d2816ef472ef9f555928369f63ae14` rather than the candidate commit.
See `.factory/verification-7.md` for exact evidence and severity.

## What was verified

- `npm ci`, all 23 exact declared-claim commands, `npm test`, and the exact
  `npm run build` production entry point passed.
- The candidate production output is 30.48 kB JavaScript raw / 10.46 kB gzip,
  13.04 kB CSS raw / 3.90 kB gzip, and a 332 kB `dist/` directory.
- Live static HTML, manifest, service worker and hashed assets match the
  candidate. A live two-browser room completed 12 turns after a reconnect.
  The 96-request same-client rate probe observed 44 `200` and 52 `429`, each
  limited response with `Retry-After: 2`.
- Live privacy request boundaries, offline demo reload, keyboard focus,
  390px touch play, reduced motion, headers/caching, and Axe
  serious/critical accessibility checks passed.

## Required next step

Deploy `sf-pause-garden-realtime` from the same pushed candidate as the static
artifact, preserving its fleet-created `/data` storage. Then run:

```sh
npm run verify:live-release
npm run verify:live-behavior
```

Both commands must pass before changing the release status to PASS. No product
code was changed during verification; existing unrelated `graphify-out/`
changes were preserved and unstaged.
