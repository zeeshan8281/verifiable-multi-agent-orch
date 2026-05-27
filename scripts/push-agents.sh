#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:?set REGISTRY}"
TAG="${TAG:-0.1.0}"

for AGENT in researcher reasoner critic; do
  IMAGE="${REGISTRY}/verified-handoff-${AGENT}:${TAG}"
  echo "==> pushing ${IMAGE}"
  docker push "${IMAGE}"
done
