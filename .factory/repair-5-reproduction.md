# Repair 5 reproduction

Reproduced on 2026-09-02 UTC from report commit
`6ca112c58626c38254ae76ed72415d740dc3b32b`.

## Release identity mismatch

A clean `npm ci` and `npm run build:production` produced
`/assets/main-OU0I22Qc.js` with SHA-256
`62d9ef917f13e74c92d297fe599aad3cc4cda6770c6de26ceb3cf4429e1300c2`.
The live page referenced `/assets/main-Ci_fJca5.js` with SHA-256
`268ce1dc8f0a08d3ecd58267c8148423a7eccd3e1a8ba51da0371d4ce389eb8c`.
The candidate asset returned HTTP 404 live. The static manifest named
candidate `023c8f0d27c79ac1114d9c5364ca5bd6a55a0cf8`, while room `/health`
reported `148c70595c48b4095ad96338e3a7d03fb47339cf`.

The live JavaScript retained both the localhost and production room origins.
That proves it came from the generic development-capable `npm run build`.
The clean candidate checker used `npm run build:production`, which folded the
bundle to the production origin. The two commands could therefore produce
different deployable bytes.

`RELEASE_VERIFY_ATTEMPTS=1 npm run verify:live-release` rejected the live pair
with the HTML, asset, service-worker, manifest, and room build differences.

## End screen and response policy

The verifier's reported live run remained active after turn 12 and its probe
observed no `429`. A fresh reproduction against the same stale deployment did
not repeat those two transient results: room `XTK8B` reconnected after turn
two and both browsers reached **Chapter complete** after 12 turns. A 96-request
probe returned 42 `200` responses and 54 `429` responses; every limited
response included `Retry-After: 2`.

These behaviors remain release blockers until the matching candidate is live.
The repair therefore makes the two-browser run and response-policy probe
mandatory final deployment gates instead of relying on a local result.
