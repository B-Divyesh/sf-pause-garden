# Verification 8 — FAIL

**Candidate:** `c24c20d9124569b8499814f45c95a6a5a306dc10`

**Live URL:** <https://pause-garden.sociobot.in>

**Room service:** <https://pause-garden-realtime.sociobot.in>

**Verified:** 2026-09-02 UTC

## Decision

**FAIL — do not release this candidate.** The deployed static site is exactly
the candidate, but the product-owned room service reports build
`01e3bffd7b44b5d6e808c62dc2b29449db319cb6`, not candidate `c24c20d…`.
The browser game and room service form one release. A mixed deployment does not
satisfy the required candidate identity, even though the stale service passes
the functional checks below.

## First read

A cold desktop and 390 px mobile load says “Restore a garden, even when friends
pause,” identifies “friends with interrupted evenings,” and gives **Try it with
sample data** as the first action. The adjacent sentence says a garden opens on
turn seven with no setup. The first viewport includes the 4 × 4 garden board,
not a menu wall. This passes the plain-words, one-click-demo, and first-screen
game gates.

## Clean candidate gates

A detached clean worktree at the exact candidate was created under `/tmp`, then
installed with `npm ci` (66 packages, zero vulnerabilities). Every exact
command in all **23** entries of `.factory/claims.json` was run individually;
**23 passed and 0 failed**. The retained disposable log is
`/tmp/pause-garden-verify8-claims.log`.

The unfiltered quality gates also passed from that clean worktree:

- `npm test`: 8 unit/server tests, 3 release-contract tests, and 29 Playwright
  desktop/mobile tests passed; production-artifact isolation passed.
- `npm audit --audit-level=high`: zero vulnerabilities.
- `npm run build`: client and server TypeScript checks passed and `dist/` was
  produced. There is no separate lint script.
- Output: JS 30,481 bytes raw / 10.46 kB gzip; CSS 13,044 bytes raw / 3.90 kB
  gzip; complete `dist/` 332 kB.

The claims cover the end screen, restart, sleeping-player handoff, two-browser
play and reconnect, sound persistence, offline reload, privacy boundary,
keyboard/touch play, 2–4 players, session length, deterministic seed/weather,
55 FPS pacing, free chapter, calm/private rules, demo isolation, room-service
boundary, SQLite persistence/expiry, unavailable checkout, and build identity.
No unlisted claim was identified in the landing page or README.

## Independent live evidence

| Area | Result | Evidence |
| --- | --- | --- |
| Static candidate identity | PASS | Live manifest source is `c24c20d…`; live and local HTML hash `d7897e9c…`, JS `main-OU0I22Qc.js` hash `62d9ef91…`, CSS hash `47ad7025…`, and service-worker hash `0855ab0c…` match. Footer shows `Build c24c20d`. |
| Realtime candidate identity | **FAIL** | `GET /health` returns `{"ok":true,"build":"01e3bffd7b44b5d6e808c62dc2b29449db319cb6","storage":"sqlite"}`. `npm run verify:live-release` exits nonzero after all retries. |
| Complete remote run | PASS on stale service | The live verifier created room `FVADE`, joined two independent browsers, refreshed/reconnected after turn 2, alternated 12 actions, and showed **Chapter complete** to both. |
| Goal, win, loss, restart | PASS | The live sample reached **Garden restored** with 15 bloom points and the visitor request met. Replay returned to turn 1 and `0 / 15`. The remote scripted run reached the 12-turn loss summary with a retry action. |
| Away mechanic and persistence | PASS | Declared sleeping-handoff and reconnect claims passed. Live sound was switched off and remained off after reload. SQLite state survived a local server restart in the candidate test. |
| Concurrent actions | PASS on stale service | Two live connections submitted the same revision concurrently in room `23NKM`; both converged on revision 2 and turn 1, so one turn—not two—was committed. |
| Input and recovery | PASS | Keyboard arrows moved focus to Bed 3 and Enter completed the sample; 390 px touch completed it. Malformed code `ABC`, missing room `AAAAA`, and blank player names produced specific recovery messages. Four-player creation worked and Add player disabled at four. Pause focused Resume; Escape closed it. |
| Settings and modes | PASS | Demo, online, keyboard, and touch modes worked. The sound setting persisted. The game requires no account or sign-in. |
| Frame rate and reduced motion | PASS | Live 90-frame median was 59.88 FPS. A reduced-motion context matched the media query, created no mote canvas, and had zero running animations. |
| PWA/offline | PASS | The active `/sw.js` updated with no waiting worker. A fresh visited demo reloaded offline and displayed “Offline — demo turns still save here.” |
| Privacy and requests | PASS | Demo play through completion made only static-origin requests. Online room creation contacted only the static origin and `wss://pause-garden-realtime.sociobot.in/rooms`; no analytics, CDN font, or unrelated endpoint appeared. |
| API allowance | PASS on stale service | One 96-request client probe received 43 × 200 and 53 × 429; every 429 had `Retry-After: 2`. The configured burst is 40 with refill, so the observed accepted count includes refill during the probe. |
| Accessibility | PASS | Playwright Axe 4.10.2 found zero violations on `/`, `/demo`, `/play`, `/privacy`, `/terms`, the 404 page, pause dialog, and end dialog. Each route had one h1/main, landmarks, lang/title, labelled controls, and alt text. Focus was a visible 3 px rain-blue outline. At 200% text size the 390 px demo retained its heading, board, tools, and no horizontal overflow. |
| URL verifier and errors | PASS | Factory `verify-url.sh` returned HTTP 200 in 627 ms with no errors, one h1/main, title/lang, no missing alt, and no unnamed button. Normal routes logged no console/page errors; only the expected browser resource error accompanied the deliberate HTTP 404 route. |
| Headers and caching | PASS | CSP is a response header and includes `frame-ancestors 'none'`; HSTS, `nosniff`, Referrer-Policy, and Permissions-Policy are present. Hashed JS/CSS use one-year immutable caching; `/sw.js` uses `no-cache`; unknown routes return 404. |
| Mobile performance | PASS | Lighthouse mobile: performance 94, accessibility 100, best practices 100, SEO 100; FCP 0.90 s, LCP 1.13 s, TBT 288.5 ms, CLS 0, 46,258 bytes transferred. Two measured touch interactions were 96 ms each. |

The supplied main worktree contained unrelated pre-existing `graphify-out/`
changes. They were preserved and excluded from this verification commit. The
clean-worktree runs above establish the candidate evidence independently.

## Blocking defect

### P0 — room service deployment is not candidate `c24c20d…`

The live static app identifies and byte-matches candidate
`c24c20d9124569b8499814f45c95a6a5a306dc10`, while the room service identifies
as its parent `01e3bffd7b44b5d6e808c62dc2b29449db319cb6`. This recreates the mixed
release class that the candidate's release gate is intended to prevent.

Deploy the realtime image from the exact pushed candidate while preserving the
fleet-created `/data` volume, then rerun:

```sh
npm run verify:live-release
npm run verify:live-behavior
```

Acceptance requires the first command to report `ok: true` with both builds at
`c24c20d…`. Functional success from the stale service does not waive the build
identity requirement.

## Product-code changes

None. This verification only adds the report and updates the handoff.
