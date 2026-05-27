#!/usr/bin/env bash
# Build all three agent images for linux/amd64.
# Usage: REGISTRY=docker.io/yourhandle TAG=0.1.0 ./scripts/build-agents.sh
set -euo pipefail

REGISTRY="${REGISTRY:?set REGISTRY (e.g. docker.io/yourhandle or ghcr.io/yourhandle)}"
TAG="${TAG:-0.1.0}"

cd "$(dirname "$0")/.."

for AGENT in researcher reasoner critic; do
  IMAGE="${REGISTRY}/verified-handoff-${AGENT}:${TAG}"
  echo "==> building ${IMAGE}"
  docker build \
    --platform linux/amd64 \
    --build-arg "AGENT=${AGENT}" \
    -t "${IMAGE}" \
    .
done

echo
echo "Built:"
for AGENT in researcher reasoner critic; do
  echo "  ${REGISTRY}/verified-handoff-${AGENT}:${TAG}"
done
echo
echo "Next: ./scripts/push-agents.sh  (then ./scripts/deploy-agents.sh)"
