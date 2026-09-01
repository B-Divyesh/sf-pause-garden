# Pause Garden

Restore a garden with 2–4 friends, even when someone steps away.

Pause Garden is a 12-turn online browser game for 2–4 remote friends. Players
join a private room by code and take one turn at a time. Weather changes each
action. If a player leaves, the group can place that player’s queued token.

## Try the sample game

Open `/demo` or <https://pause-garden.sociobot.in/demo>. The sample starts on
turn seven with one player sleeping. Tend bed three to complete both goals.

Demo state uses the `demo:pause-garden:room` session storage key. It never
reads or writes a real room. Use **Reset demo** to restore the sample.

## Play

1. Open **Play**, enter two to four names, and create the online room.
2. Share the five-character code and each friend’s chosen name.
3. Each friend joins from their own browser.
4. Choose Plant, Water, or Tend, then select a valid bed.
5. Reach both goals within 12 turns.

The game supports pointer, touch, and keyboard-only play. The product-owned
room service synchronizes turns and stores room state in SQLite. An opaque
token reconnects a player after refresh. The visited demo reloads offline and
never sends sample state to the room service.

## Host Edition

The demo and one full chapter are free. Host Edition costs $6 once. It adds
unlimited new chapters and custom seeds. Purchases use the Sociobot hosted
checkout. The app stores the license locally.

## Develop

Requirements: Node.js 22 or later and npm.

```sh
npm install
npm run dev:rooms
# In another terminal:
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

The suite covers deterministic game rules, two-browser join/play/end sync,
SQLite recovery, browser reconnect, replay, sleeping handoff, sound persistence,
keyboard control, 390 px layout, offline demo reload, privacy requests, rate
limits, license state, and accessibility. The animation test measures at least
55 fps from median frame pacing over 90 frames.

## Privacy

Online room names and garden state go only to the product-owned Pause Garden
room service. Rooms expire after 30 inactive days. Demo play sends no player
data away from the static site. License verification sends only the saved
license token to `api.sociobot.in`. See `/privacy` and `/terms`.

## Deploy

Deploy `dist/` to the existing static site. Deploy the Docker image as
`sf-pause-garden-realtime` with WebSocket ingress and one replica. Mount the
fleet-created data share at `/data`. The static configuration supplies SPA
fallback, immutable hashed assets, CSP, and security headers.

## License

MIT. See [LICENSE](LICENSE).
