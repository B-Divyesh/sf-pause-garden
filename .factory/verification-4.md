# Pause Garden independent verification 4 — FAIL

Verified on 2026-09-02 UTC against candidate
`4ea7e9338691a1d3c751ce21d715e4c4bba1467f` and
<https://pause-garden.sociobot.in>.

## Verdict

**FAIL.** The game works end to end and every declared claim test passes, but
the live static application is not the candidate's exact production build.
The live room service also reports an earlier build SHA. Candidate/deployment
identity is a hard acceptance requirement.

## Release-blocking finding

### P1 — production does not match the candidate production artifact

`npm run build:production` at the candidate emitted:

- `dist/index.html`: SHA-256
  `76137a1211884fc6d4c0fa287ffa854ecd023c59cfa00da044814fc996f9b197`
- `/assets/main-_K6EejvF.js`: SHA-256
  `e571d77d82e91d810c0050e823b8f60af9ce767a10cce2ffc411d1e22e271a53`

Production served:

- `/`: SHA-256
  `d8e40fe302e85f97d005ea24f4f1d977236effcb78eb14d117c9c33e9370ce31`
- `/assets/main-Dzctu8Lw.js`: SHA-256
  `8efed99f2f723868b52559ad58eff75fb1e41901c1267b61ed8a8b13634b1ffd`

A separate `npm run build` without `VITE_ROOM_API` reproduced both live hashes
exactly. Its bundle contains the localhost fallback
`http://127.0.0.1:8787`; the required production build hardcodes only
`https://pause-garden-realtime.sociobot.in`. The live hostname still selects
the correct room server at runtime, so this is an identity/release-process
failure rather than a reproduced gameplay outage.

The CSS does match (`405c7f…616b78` locally and live). The favicon, touch icon,
robots file, sitemap, service worker, and three art files also match. The
HTML/JavaScript and generated 404 differ because the wrong JavaScript build is
deployed.

`GET https://pause-garden-realtime.sociobot.in/health` returned:

```json
{"ok":true,"build":"fc1ae82cc74409ffc8d1211ef298329b5068bb2e","storage":"sqlite"}
```

That build identity is not candidate `4ea7e93…`.

## First-read test

**Pass.** A cold desktop and 390 × 844 mobile visit answered all three required
questions in the first screen:

- What: “Restore a garden, even when friends pause.”
- For whom: “For friends with interrupted evenings who still want each turn
  to matter.”
- First action: “Try it with sample data,” with “A garden opens on turn seven.
  No setup is needed.” beside it.

The first viewport shows the 4 × 4 garden board, not a menu wall. The action
opens `/demo` in one click. Cold-page requests were only the document,
same-origin JavaScript, CSS, and the responsive hero image; there were no
console or page errors.

## Claims and clean local gates

The first pre-install claim invocation could not start because the clean clone
had no dependencies (`vitest: not found`). After `npm ci`, I reran the manifest
from the beginning. Every one of the 20 exact commands in
`.factory/claims.json` passed:

`chapter-complete`, `restart-reset`, `sleeping-handoff`, `remote-room-play`,
`remote-reconnect`, `settings-persist`, `offline-reload`,
`privacy-same-origin`, `keyboard-controls`, `two-to-four-players`,
`seed-determinism`, `weather-sequence`, `rendering-rate`, `free-chapter`,
`calm-private-rules`, `demo-isolation`, `room-service-boundary`,
`room-storage-sqlite`, `room-expiry`, and `checkout-unavailable`.

Aggregate gates:

- `npm ci`: passed; 66 packages installed from the lockfile.
- `npm audit --audit-level=high`: zero vulnerabilities.
- `npm test`: passed; 8 Vitest unit/server tests and 22 Playwright tests.
- `npm run build:production`: passed; `dist/` created.
- `node scripts/verify-static-candidate.mjs`: passed.
- Production output: JavaScript 30.28 KB raw / 10.37 KB gzip; CSS 12.92 KB
  raw / 3.90 KB gzip; mobile hero 29,708 bytes.
- No standalone lint script exists. TypeScript checks run in the build for
  both client and server.

## Independent end-to-end play

The deterministic live sample ran from the landing page through active play
to the real win summary:

- Start state: room MOSS, turn 7/12, score 11/14, visitor care 2/3, Jules
  sleeping.
- An unavailable bed was exposed as `aria-disabled=true`; a forced invalid
  activation left the turn unchanged and announced the recovery message.
- Keyboard focus moved across the board with Arrow Right; Enter on bed 3 used
  Tend and opened “Garden restored.” Final state was turn 7, 15 points, care
  3/3, `status: won`.
- “Play this seed again” reset to turn 1, 0/15, `status: playing`.
- Sound off and restarted chapter state survived reload.
- Pause opened a modal; Resume closed it and returned focus to Pause game.
- A separate 390px touch context completed the same win.
- Median pacing across 90 live animation frames was 59.88 fps. The measured
  live click interaction duration was 80 ms.

A production two-browser run created room `Q7F9U`, joined by code, refreshed
the second browser at turn 3, alternated all 12 actions, and showed the same
loss summary in both browsers: 0/14 points, 12 turns, 2 players. Host replay
reset both clients to turn 1 and zero points. A separate simultaneous-action
run on room `HSRKE` committed exactly one revision: turn 1 with one non-empty
bed.

The game therefore demonstrates a goal, weather/action challenge, win and
loss conditions, interruption handoff, reconnect, restart, persistent state,
keyboard input, touch input, demo mode, online mode, and its frame-rate claim.

## Privacy, security, resilience, and backend

- The complete live demo flow contacted only
  `https://pause-garden.sociobot.in`; it opened no room WebSocket.
- `/?demo=1` became `/demo`, used only
  `sessionStorage["demo:pause-garden:room"]`, preserved a real-data sentinel,
  and removed demo state on **Start for real**.
- Static responses include HSTS, `nosniff`, strict referrer policy,
  permissions policy, and a restrictive CSP with `frame-ancestors 'none'`.
- HTML and `sw.js` use a 30-second revalidating cache. Hashed assets use
  `public, max-age=31536000, immutable`.
- The service worker was active and controlling `/demo`; `update()` completed.
  An offline reload retained the board and showed the offline state.
- `/`, `/demo`, `/play`, `/privacy`, and `/terms` returned 200.
  `/missing-page` returned the designed 404 with HTTP 404.
- The room service reports SQLite. Local tests reopened the same SQLite file,
  retained room state/reconnect data, and removed rooms after 30 inactive
  days.
- A 60-request live `/api/status` burst from one client returned 43 × 200 and
  17 × 429. Every 429 included `Retry-After: 2`. The implementation allowance
  is a 40-token burst refilled at 20 tokens/second; replenishment explains the
  three additional successes during the concurrent burst.
- No account or sign-in exists, so the Entra tenant requirement does not
  apply.
- The Sociobot checkout endpoint still returns 404
  (`{"error":"enabled factory product","status":404}`). The product honestly
  disables Host Edition and exposes no payment link.

## Accessibility and responsive checks

- `/opt/fleet/lib/verify-url.sh` passed: load 646 ms, title, `lang=en`, one h1,
  main landmark, alt text, button names, and no console errors.
- Live Axe 4.10 found zero serious or critical issues on `/`, `/demo`, `/play`,
  `/privacy`, `/terms`, and the 404 at desktop and 390px mobile.
- Keyboard focus order begins with the skip link. Focus uses a visible 3px
  rain-blue outline. The primary sample link opens with Enter.
- At 390px the document and board fit without horizontal overflow. Reduced
  motion removes the motes canvas; normal motion retains it.
- Lighthouse mobile: Performance 95, Accessibility 100, Best Practices 100,
  SEO 100; FCP 1.0 s, LCP 1.2 s, CLS 0, TBT 270 ms.

## Additional defects

### P2 — several mobile link targets are below 44px

At 390px, the home wordmark is 121 × 31 px on every route. “Read the purchase
terms” is 202 × 19 px, and the privacy/support email links are about 162–164 ×
19 px. This violates the attached 44px touch-target contract. Game controls
themselves meet the minimum.

### P2 — malformed join errors are attached to the wrong form

Submitting room code `ABC` with player name `Noor` displays “Enter the
five-character room code and your chosen player name.” in `#setup-error`, under
the create-room form. The join inputs reference `join-help join-error` through
`aria-describedby`, while `#join-error` remains empty. A valid-length missing
code then displays the correct retry message in `#join-error` and re-enables
the submit button, so recovery works but the malformed-input association does
not.

### P2 — the brief's intended 15-minute session is undocumented

The landing page and README specify 12 turns but do not state the researched
brief's intended 15-minute chapter length. The game-lane contract requires the
README to state intended session length. No duration claim/test exists.

### P3 — one moderate Axe landmark finding remains on `/demo`

Axe reports `region` for the skip link because it sits outside a landmark.
There are no serious or critical Axe findings.

## Required release action

Deploy the output of `npm run build:production` from candidate `4ea7e93…`,
deploy the room service with `BUILD_SHA=4ea7e93…`, then repeat hash, health,
claims, touch-target, invalid-form, and live end-to-end checks. Do not mark the
candidate released while production serves the default build.
