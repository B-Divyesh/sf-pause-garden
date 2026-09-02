# Pause Garden

Restore a garden with 2–4 friends, even when someone steps away.

Pause Garden is a 12-turn online browser game for 2–4 remote friends. Each
chapter is designed for an interrupted 15-minute session. Players join a
private room by code and take one turn at a time. Weather changes after each
action. A present player can place a sleeping player’s queued token.

Each chapter has 12 turns. The goal is to earn enough bloom points and care for
three beds before the last turn.

## Try the sample game

Open `/?demo=1`, `/demo`, or <https://pause-garden.sociobot.in/demo>. The sample
starts on turn seven with one player sleeping. Tend bed three to complete both
goals.

Demo state uses the `demo:pause-garden:room` session storage key. It never
reads or changes a real room. **Reset demo** restores the sample. **Start for
real** discards the sample state.

## Play

1. Open **Play**, enter two to four names, and create the online room.
2. Share the five-character code and each friend’s chosen name.
3. Each friend joins from their own browser.
4. Choose Plant, Water, or Tend, then select a valid bed.
5. Reach both goals within 12 turns.

The game supports touch and keyboard play. The Pause Garden room server syncs
turns and keeps room state in SQLite. A private browser token lets a player
return after refreshing. The visited demo reloads offline.

## Host Edition availability

The demo and one online chapter are free. Host Edition is not for sale while
checkout is unavailable. The page contains no payment link.

## Develop

Requirements: Node.js 22 or later and npm.

```sh
npm install
npm run dev:rooms
# In another terminal:
npm run dev
```

Build the production static files with:

```sh
npm run build:production
```

This creates `dist/` and uses the production Pause Garden room-server address.
`npm run build` accepts a local room-server address from the test runner.

## Verify

```sh
npm test
npm run build:production
node scripts/verify-static-candidate.mjs
```

The suite checks game rules, remote play, reconnect, accessibility, and
privacy. It also recreates a stale static/stale room deployment and requires
the release identity check to reject it. See `.factory/claims.json` for every
product claim check.

The animation check samples 90 frames. Its median pacing must reach 55 frames
per second in the test browser.

## Privacy

Online room names and garden state go only to the Pause Garden room server.
The server removes rooms after 30 inactive days. Demo play sends no player data
away from the static site. See `/privacy` and `/terms`.

## Deploy

Run `npm run build:production` and `node scripts/verify-static-candidate.mjs`.
Deploy that `dist/` directory to `sf-pause-garden`.

The checker validates expected built-file checksums and the production room
address. It also stamps the source commit into the build manifest, HTML, footer,
and service-worker cache.

Release both components from the same clean, pushed commit:

```sh
npm run deploy:production
```

This deploys only `sf-pause-garden` and `sf-pause-garden-realtime`, preserves
the fleet-created `/data` share, and then compares the live HTML and asset
hashes with `dist/`. It also requires `/health` to report the same commit.
`npm run verify:live-release` repeats that check without deploying.

## License

MIT. See [LICENSE](LICENSE).
