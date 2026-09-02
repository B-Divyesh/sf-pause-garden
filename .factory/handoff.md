# Pause Garden repair 5 handoff

## Release status

The release-blocking findings in `.factory/verification-6.md` are repaired.
The deploy now produces one production-exact static artifact from the standard
`npm run build` entry point, releases the static and realtime components from
one pushed commit, verifies their bytes and build identities, then requires a
live two-browser chapter and response-policy probe to pass.

## Reproduction and root cause

At report commit `6ca112c58626c38254ae76ed72415d740dc3b32b`, the live
static manifest named `023c8f0…`, the live room server named `148c705…`, and
the clean candidate expected a JavaScript asset that returned HTTP 404. Exact
hashes and commands are recorded in `.factory/repair-5-reproduction.md`.

The live JavaScript retained the localhost fallback, proving that the generic
`npm run build` had produced it. The candidate verifier instead used
`npm run build:production`, which folded the room origin to production and
created different bytes. A generic fleet build could therefore disagree with
the artifact checked by the repository's release command.

The reported turn-12 and allowance failures did not recur against the stale
deployment, but they had no mandatory live release gate. A new smoke verifier
now makes both behaviors part of every production deploy.

## Repairs and regression coverage

- `npm run build` is now the production build and pins the production room
  origin. `npm run build:production` is an exact alias.
- Browser tests use `npm run build:test`, write only to `test-dist/`, and pin
  the localhost room origin. The production-artifact isolation regression
  checks both bundles after the full browser suite.
- The static candidate test runs the default build, so the generic deployment
  entry point cannot silently produce different bytes again.
- `scripts/verify-live-behavior.mjs` creates and joins a real room in two
  independent browser contexts, reconnects the friend after turn two,
  alternates 12 valid turns, and requires both end summaries.
- The same live verifier sends 96 concurrent status requests and requires both
  allowed responses and `429` responses with `Retry-After: 2`.
- `npm run deploy:production` now runs static/realtime identity verification
  followed by the live behavior verifier. Any mismatch, incomplete chapter,
  browser console error, or missing response-policy header stops the release.
- Existing unit coverage still asserts the deterministic 12-turn core and the
  server's local `429`/`Retry-After` policy. Existing Playwright coverage still
  asserts remote play and reconnect from isolated contexts.

## Verification evidence

Run on 2026-09-02 UTC:

```sh
npm ci
npm test
npm audit --audit-level=high
npm run build
npm run build:production
node scripts/verify-static-candidate.mjs
```

- Clean install: 66 packages, zero reported vulnerabilities.
- Full suite: 8 unit/server tests, 2 release-contract tests, and 28
  desktop/mobile Playwright checks passed. TypeScript checks passed for the
  client and room server. Production/test artifact isolation passed.
- Every one of the 22 exact commands in `.factory/claims.json` passed when run
  independently.
- Production output: 30.48 kB JavaScript raw / 10.46 kB gzip; 13.04 kB CSS
  raw / 3.90 kB gzip; 332 kB total including original product art.
- `/opt/fleet/lib/verify-url.sh` passed in 542 ms with no console errors, a
  title, `lang=en`, one h1, one main landmark, and no missing alt text.
- The Playwright Axe route test found zero serious or critical issues on `/`,
  `/demo`, `/play`, `/privacy`, and `/terms`.
- Lighthouse mobile: Performance 100, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.2 s, LCP 1.4 s, CLS 0, TBT 50 ms.
- Keyboard, 390 px touch, focus management, 44 px targets, reduced motion,
  offline reload/update, demo isolation, privacy request boundaries, and the
  stable 55-FPS median claim passed.
- Package/consumer checks do not apply to this browser-game artifact.

The pre-release live smoke also completed room `XTK8B` in both browsers after
one reconnect. Its 96-request policy probe observed 42 `200` and 54 `429`
responses, with `Retry-After: 2` on every limited response.

## Deployment

The only release command is:

```sh
npm run deploy:production
```

It refuses an unpushed product commit, builds the default production artifact,
updates only `sf-pause-garden-realtime` while preserving its existing `/data`
mount, uploads `dist/` to `sf-pause-garden`, and runs both final live gates.
Machine-readable results are written to the ignored
`release-evidence/live-release.json` and `release-evidence/live-behavior.json`.

### Live deployment evidence

The repaired product was deployed from pushed commit
`cb41a53b5a5150ac6076e0572852a9bc3b4188f4` at 2026-09-02 04:26 UTC.

- Live identity returned `ok: true`. HTML SHA-256 was
  `6dbcb7531c24592a68c0627839d36748ef4162cc04fb4533fb6092617ad74bea`.
- Live JavaScript was `/assets/main-OU0I22Qc.js`, 30,481 bytes, SHA-256
  `62d9ef917f13e74c92d297fe599aad3cc4cda6770c6de26ceb3cf4429e1300c2`.
- Live CSS was `/assets/main-Ce1lVhFR.css`, 13,044 bytes, SHA-256
  `47ad7025095ca47acb4af86cc8a13b40936b01ae1529b643f82723dbf0d6af3c`.
- The room health response reported the same full commit and `storage: sqlite`.
- Live room `4WJK8` joined in two independent contexts, reconnected after
  turn two, completed 12 turns, and showed **Chapter complete** to both.
- The post-deploy 96-request probe returned 42 `200` and 54 `429` responses.
  Every `429` included `Retry-After: 2`.

This handoff-only follow-up is deployed through the same guarded command, so
the final public build identity is the repository `HEAD` that contains this
evidence.

## Known gaps

None. Host Edition remains honestly unavailable because checkout is not
enabled; the complete free chapter and isolated sample remain available.
