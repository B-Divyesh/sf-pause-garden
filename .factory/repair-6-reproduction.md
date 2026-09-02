# Repair 6 reproduction

Verified on 2026-09-02 UTC before any repair change.

Expected candidate:
`422c2e71d1de5aee2472aa2b37bc42b12339c73b`.

```sh
curl -fsS https://pause-garden.sociobot.in/build-manifest.json
curl -fsS https://pause-garden-realtime.sociobot.in/health
```

The static manifest returned the expected candidate:

```json
{"sourceCommit":"422c2e71d1de5aee2472aa2b37bc42b12339c73b"}
```

The room service returned a different build:

```json
{"ok":true,"build":"b064daa1f1d2816ef472ef9f555928369f63ae14","storage":"sqlite"}
```

This reproduces the verifier's exact mixed release: the candidate static
artifact is public while the realtime service is stale. The release process
did not make room health for the same commit a prerequisite for publishing
the static files.

The repair adds an exact regression fixture and a deployment gate that waits
for `/health` to report the candidate before static publication. It also
records and rechecks the existing Azure Files storage identity, not only the
`/data` mount path.
