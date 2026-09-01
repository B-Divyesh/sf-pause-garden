# Verification — FAIL

**Candidate:** `91e5d3acbceee82098820c711826b852c2b22028`  
**Live URL:** <https://pause-garden.sociobot.in>  
**Verified:** 2026-09-01 (UTC)

## Release decision

**FAIL.** The candidate is a polished shared-screen local game, but it does
not implement the researched product: a durable room-code game for 2–4
**remote** friends. A room code is displayed, but state is stored only in the
creating browser and no second browser can join it. This is a core job failure,
not a deployment-only problem.

## First-read result

On a cold live desktop visit I saw: “Restore a garden, even when friends
pause”; the page says it is for friends with interrupted evenings; and the
first action is “Try it with sample data”, with the result explained (“A garden
opens on turn seven. No setup is needed.”). The first viewport includes a
garden-board preview rather than a menu wall. The page passes the plain-words
and one-click-demo gate.

## Required claims

`.factory/claims.json` exists with 14 entries. I ran every exact listed
command from a clean `npm ci` install, using its `/demo` browser entry point
where applicable. All individual claim commands passed, including the separate
`@claim:seed-determinism` Vitest command. This includes chapter completion,
restart reset, sleeping handoff, recovery, settings persistence, offline
reload, privacy request logging, keyboard use, 2–4 local player setup, license
state, rendering-rate, free play, and calm/private rules.

The full test suite is nevertheless a release blocker: a fresh `npm test`
failed one browser test, `@claim:rendering-rate animation reaches 55 frames per
second`. The test result recorded one failed test; its threshold is 55 frames
in one second. An isolated rendering claim run had passed earlier, so the
metric/test is flaky rather than demonstrated reliably. A claimed performance
floor must pass reliably in the complete suite.

## Evidence

| Area | Result | Evidence |
| --- | --- | --- |
| Clean install and build | PASS | `npm ci` completed with 0 vulnerabilities; `npm run build` passed and emitted `dist/`. Main JS is 26.96 KB raw / 9.63 KB gzip; CSS is 12.67 KB raw / 3.85 KB gzip. |
| Full unit/browser suite | FAIL | `npm test`: 3 unit tests passed; one of 18 browser tests failed, the 55-FPS claim. |
| Live equals candidate | PASS | Live and locally built `main-CBJiwU7P.js` SHA-256: `9bfdce8864652e9d28af0a14c3eb50351d170a174cc3f77ccd6b652584929afc`; CSS SHA-256: `8f0c21e45e8abb614bd9ee8d9f1ba8e545610113b81c186c08559530c283f10c`. |
| Title → play → real end | PASS | Cold landing → sample demo → ArrowRight twice → Enter reached the real “Garden restored” dialog. A separate scripted 4-player run placed Plant tokens for 12 turns and reached “Chapter complete” loss, scoring 0/16. Replay/reset is covered by the passing claim. |
| Normal/boundary/recovery | PASS locally | Four-player setup worked; blank/whitespace player input announced “Add at least two player names to create a room”; native pause dialog focused Resume and Esc closed it; local recovery/settings claims passed. |
| Remote room-code play | **FAIL** | Live `/play` created `Room 8VO0`; it stored only `pause-garden:room` and `pause-garden:chapters-complete` in localStorage. A second fresh browser at `/play` showed Create room, with no join control or shared state. Source confirms `saveGame()` uses `localStorage` and contains no room server/WebSocket. |
| Desktop, 390 px, keyboard, reduced motion | PASS | At 390 px `scrollWidth === clientWidth === 390`; arrow navigation moved focus between beds; keyboard reached demo end; reduced-motion context created zero `#motes` canvases. |
| Accessibility | PASS with tooling note | Playwright Axe on live `/`, `/demo`, `/play`, `/privacy`, and `/terms` found zero serious/critical issues. The repository has no `verify-url.sh`; `npx @axe-core/cli` could not start because this container has no system Chrome, so I used the installed Playwright Chromium with CSP bypass solely to inject Axe. |
| Console/errors/privacy | PASS for demo | Cold live landing and demo had no console/page errors. During demo completion, requests were only the page and same-origin JS/CSS (no player-data request left the origin). Headers include CSP, HSTS, `nosniff`, Referrer-Policy, and Permissions-Policy. |
| PWA/offline | PASS | A fresh live context registered active `/sw.js`; `registration.update()` completed without a waiting worker; after offline reload, the demo and “Offline — turns still save here” remained available. |
| License endpoint allowance | PASS | Product billing verify endpoint accepted 30 invalid-token requests from this client; request 31 returned `429` with `Retry-After: 2`. |

## Defects

### P0 — researched job cannot be done: no remote room or reconnect

The brief requires a 2–4-player **remote** room-code game with durable server
storage and reconnect handling. This candidate is explicitly static
shared-screen-only. Its visible room code cannot be used to join from another
device, state cannot survive a browser/device boundary, and away-token handoff
only works for people sharing one browser. The existing handoff acknowledges
this as a “known gap”; that does not make the candidate acceptable.

Required correction: provide a product-owned room service (for example,
`sf-pause-garden-realtime`) with a short-code create/join flow, WebSocket or
equivalent sync, SQLite state under `/data`, reconnect, and tests that use two
independent browser contexts.

### P1 — full quality gate is unreliable/failing on advertised frame rate

The required full `npm test` run failed the `>=55` frames-in-one-second claim.
The isolated claim passed, which makes the check flaky; it is not evidence that
the advertised floor holds. Stabilize measurement and rendering, then require
the complete suite to pass repeatedly before release.

### P2 — hashed static assets are not cached immutably

Live `main-CBJiwU7P.js` and `main-DKua9P12.css` both return
`Cache-Control: public, must-revalidate, max-age=30`. The site-structure and
performance contract call for long-lived immutable caching for hashed assets.

### P2 — design contract does not match implementation

`.factory/design.md` says a two-player target starts at 18, adds two per extra
player, and that wind clears care. `src/game.ts` instead sets target to
`12 + playerCount` (14 for two players) and has no wind-care removal. Update
the game or the documented difficulty curve so future verification has a true
contract.

## How to reproduce

```sh
npm ci
npm test                 # currently fails the rendering-rate browser test
npm run build
```

Then open `/play` in two separate browser profiles. Create a room in the first
profile and open `/play` in the second: it cannot enter the first room.
