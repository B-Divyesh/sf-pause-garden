# Repair 7 reproduction

Verified on 2026-09-02 UTC before any repair code change.

The live static artifact identified itself as the verifier candidate while the
product-owned room service reported the stale parent build:

```sh
curl -fsS -H 'Cache-Control: no-cache' \
  'https://pause-garden.sociobot.in/build-manifest.json?repair-repro=1'
curl -fsS -H 'Cache-Control: no-cache' \
  https://pause-garden-realtime.sociobot.in/health
```

```json
{"sourceCommit":"c24c20d9124569b8499814f45c95a6a5a306dc10"}
{"ok":true,"build":"01e3bffd7b44b5d6e808c62dc2b29449db319cb6","storage":"sqlite"}
```

This is the release-blocking mixed deployment from Verification 8. The
regression suite now keeps these exact identifiers in a deterministic static
and health fixture, and separately asserts that the production deployment
script verifies the updated realtime candidate before it can publish static
files.
