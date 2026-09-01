# Pause Garden

Restore a garden with 2–4 friends, even when someone steps away.

Pause Garden is a 12-turn, shared-screen browser game for interrupted
evenings. Players take one turn at a time. Weather changes each action. If a
player leaves, the group can place that player’s queued token and continue.

The current static release supports one shared browser. It does not yet sync a
room across remote devices. This limit is visible in the product and tracked in
the handoff.

## Try the sample game

Open `/demo` or <https://pause-garden.sociobot.in/demo>. The sample starts on
turn seven with one player sleeping. Tend bed three to complete both goals.

Demo state uses the `demo:pause-garden:room` session storage key. It never
reads or writes a real room. Use **Reset demo** to restore the sample.

## Play

1. Open **Play** and add two to four names.
2. Create the room and choose Plant, Water, or Tend.
3. Select a valid bed. Arrow keys move between beds.
4. Mark any player sleeping when they leave.
5. Reach the bloom and visitor goals within 12 turns.

The game supports pointer, touch, and keyboard-only play. It saves the room and
sound choice in local storage. The visited demo reloads offline through the
service worker.

## Host Edition

The demo and one full chapter are free. Host Edition costs $6 once. It adds
unlimited new chapters and custom seeds. Purchases use the Sociobot hosted
checkout. The app stores the license locally.

## Develop

Requirements: Node.js 20 or later and npm.

```sh
npm install
npm run dev
```

The production build command is exactly:

```sh
npm run build
```

It creates `dist/` with `index.html` at its root.

## Verify

```sh
npm test
npm run build
```

The suite covers deterministic game rules, title-to-end play, replay, sleeping
handoff, local recovery, sound persistence, keyboard control, 390 px layout,
offline reload, privacy requests, license state, and accessibility. The scene
animation reaches at least 55 frames per second in the Chromium test browser.

## Privacy

Player names and garden state remain in browser storage. Demo play sends no
player data away from the site. License verification sends only the saved
license token to `api.sociobot.in`. See `/privacy` and `/terms`.

## Deploy

Deploy the contents of `dist/` as a static site. The included Azure Static Web
Apps configuration provides SPA fallback, a custom 404, caching, CSP, and
security headers. Infrastructure and billing registration remain factory
tasks.

## License

MIT. See [LICENSE](LICENSE).
