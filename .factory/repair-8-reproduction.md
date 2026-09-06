# Repair 8 reproduction and result

Verified on 2026-09-06 UTC from work-order base
`e7fe4f0f00de07b3504d4716d224a4ca2e9dbdcb`.

## Reproduced findings

The committed strict-review evidence placed the phone preview at 805.4 px and
its board at 877.5 px in a 390 × 844 viewport. No bed was visible before
scrolling. The phone breakpoint supplied 56 px of hero top padding and 90 px
of empty space before the preview.

The designed HTTP 404 route returned the correct status and title, but its h1
was “This path does not reach the garden.” The heading did not name the page
state in plain words.

## Corrections

- Reduced only the phone hero top and preview spacing. The first complete bed
  now spans y=763.52–834.34 in the 844 px first viewport.
- Changed the missing-page h1 to “Page not found.” The metadata description is
  also literal rather than metaphorical.
- Extended the browser suite to require the job, audience, sample action area,
  three facts, and one complete board tile inside a fresh 390 × 844 viewport.
  The route test now checks the rendered missing-page h1 as well as status and
  title.

The checks assert rendered geometry and browser-visible output. They do not
search source text for the implementation.

## Verified result

Implementation candidate:
`e648ac2fcfedae0b2eedd27eb4c59f110c9ebabf`.

- All 23 declared claim commands passed separately from a detached clean
  checkout.
- `npm test` passed 8 game/server tests, 5 release-contract tests, and 29
  browser tests. Production build isolation passed.
- `npm run build` and the static-candidate verifier passed. Output was 290,563
  bytes with 30,457 bytes of JavaScript and 13,087 bytes of CSS.
- The factory URL check passed. Axe reported zero violations across the five
  valid routes and the missing-page route.
- Fresh live phone and desktop contexts showed the game before scrolling.
  Both sample runs reached “Garden restored.”
- The live 404 returned HTTP 404 with title “Page not found — Pause Garden” and
  h1 “Page not found.”
- Static and realtime release identity checks passed at the candidate SHA.
  The live two-client run reconnected, completed 12 turns, and reached the end
  screen. Its response-policy probe received 53 HTTP 429 responses, all with
  `Retry-After: 2`.
- Lighthouse mobile scored 100 for performance, accessibility, best practices,
  and SEO. LCP was 1.1 s, TBT 40 ms, and CLS 0.

Detailed evidence is under `/work/.evidence/pause-garden-repair8/`.
