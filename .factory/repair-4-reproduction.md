# Repair 4 release-identity reproduction

Reproduced on 2026-09-02 UTC before changing product code.

The verifier candidate was `1ab9ba039c16975014a5ac499447cf3e6f3edcc1`.
The live HTML referenced `/assets/main-BBPkgcOE.js`; its SHA-256 was
`cbd8a189570048330e20b8fa7c2e391b90c8d549d49f2907119d23279119a70d`.
The candidate expected `/assets/main-BkvH-8yi.js` with SHA-256
`a0cc7bfb15c49cc8daf4aa89605f66fa775e9fcf3aae9eea1737e756f4fbc485`.

The live room health response was:

```json
{"ok":true,"build":"f1c883faac0d9b3a93df79b7e51cee6bd84ed30f","storage":"sqlite"}
```

The static bundle and room service therefore both failed the candidate
identity check. `scripts/release-identity.test.mjs` keeps this exact stale
asset/stale health shape as a regression fixture.
