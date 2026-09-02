#!/usr/bin/env bash
set -euo pipefail

REPO=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$REPO"

CANDIDATE=$(git rev-parse HEAD)
UPSTREAM=$(git rev-parse '@{upstream}')
if [ "$CANDIDATE" != "$UPSTREAM" ]; then
  echo "Release refused: HEAD $CANDIDATE is not pushed upstream ($UPSTREAM)." >&2
  exit 1
fi

DIRTY=$(git status --porcelain=v1 --untracked-files=all | grep -vE '^.. graphify-out/' || true)
if [ -n "$DIRTY" ]; then
  echo "Release refused: product files differ from commit $CANDIDATE:" >&2
  echo "$DIRTY" >&2
  exit 1
fi

echo "Building static and realtime candidate $CANDIDATE"
BUILD_SHA="$CANDIDATE" npm run build
BUILD_SHA="$CANDIDATE" node scripts/verify-static-candidate.mjs

echo "Deploying sf-pause-garden-realtime from $CANDIDATE with /data preserved"
IMAGE="sociobotregistry.azurecr.io/sf-pause-garden-realtime:${CANDIDATE:0:12}"
MOUNT=$(az containerapp show --name sf-pause-garden-realtime --resource-group sociobot \
  --query "properties.template.containers[0].volumeMounts[?mountPath=='/data'].mountPath | [0]" --output tsv)
if [ "$MOUNT" != "/data" ]; then
  echo "Release refused: sf-pause-garden-realtime does not have its existing /data mount." >&2
  exit 1
fi
az acr build --registry sociobotregistry --image "sf-pause-garden-realtime:${CANDIDATE:0:12}" \
  --file Dockerfile --build-arg "BUILD_SHA=$CANDIDATE" "$REPO"
az containerapp update --name sf-pause-garden-realtime --resource-group sociobot \
  --image "$IMAGE" --min-replicas 1 --max-replicas 1 --output none
MOUNT=$(az containerapp show --name sf-pause-garden-realtime --resource-group sociobot \
  --query "properties.template.containers[0].volumeMounts[?mountPath=='/data'].mountPath | [0]" --output tsv)
if [ "$MOUNT" != "/data" ]; then
  echo "Release failed: the existing /data mount was not preserved." >&2
  exit 1
fi

echo "Deploying sf-pause-garden static files from $CANDIDATE"
/opt/fleet/lib/deploy-static.sh pause-garden "$REPO/dist"

echo "Requiring both live services to match $CANDIDATE"
node scripts/verify-release-identity.mjs "$CANDIDATE" "$REPO/dist"

echo "Requiring live remote play, reconnect, end screen, and response policy"
node scripts/verify-live-behavior.mjs
