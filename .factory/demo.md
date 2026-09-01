# Demo sandbox

- URL: `https://pause-garden.sociobot.in/demo` or local `/demo`
- Direct query alternative: `/?demo=1`
- Sample: room MOSS, seed MOSS-27, three named players, two blooms, two growing
  beds, one seeded bed, and Jules marked sleeping
- Fast complete path: choose Tend and act on bed three
- Reset: use **Reset demo** in the persistent banner
- Leave: use **Start for real**; demo state is not copied
- Namespace: session storage key `demo:pause-garden:room`

The demo does not read or write `pause-garden:room` or
`pause-garden:room-session`. It never opens a WebSocket or reaches the online
room service. Closing the browser session discards its state. The sample
assets are part of the offline shell.
