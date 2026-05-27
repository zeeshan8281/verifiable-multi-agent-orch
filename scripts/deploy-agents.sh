#!/usr/bin/env bash
# Deploy all three agents to EigenCompute.
# Requires: ecloud auth login completed, ANTHROPIC_API_KEY in env.
#
# Usage: REGISTRY=... TAG=... ANTHROPIC_API_KEY=... ./scripts/deploy-agents.sh
set -euo pipefail

REGISTRY="${REGISTRY:?set REGISTRY}"
TAG="${TAG:-0.1.0}"
INSTANCE_TYPE="${INSTANCE_TYPE:-g1-standard-4t}"
ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:?set ANTHROPIC_API_KEY}"

cd "$(dirname "$0")/.."

# Eigen's deploy needs no Dockerfile in the deploy dir (otherwise it prompts).
# We use a clean tmp dir per agent, just for the deploy invocation.
DEPLOY_TMP="$(mktemp -d)"
trap "rm -rf ${DEPLOY_TMP}" EXIT

for AGENT in researcher reasoner critic; do
  APP_NAME="vh-${AGENT}"
  IMAGE="${REGISTRY}/verified-handoff-${AGENT}:${TAG}"
  DIR="${DEPLOY_TMP}/${AGENT}"
  mkdir -p "${DIR}"
  cd "${DIR}"

  # Sealed secret for the LLM key.
  printf "ANTHROPIC_API_KEY=%s\n" "${ANTHROPIC_API_KEY}" > .env

  echo "==> deploying ${APP_NAME} (${IMAGE})"
  ecloud compute app deploy \
    --name "${APP_NAME}" \
    --image-ref "${IMAGE}" \
    --skip-profile \
    --env-file .env \
    --instance-type "${INSTANCE_TYPE}" \
    --log-visibility public \
    --resource-usage-monitoring enable \
    --force \
    --verbose

  cd - >/dev/null
done

echo
echo "Done. Get app IDs/URLs with:"
echo "  ecloud compute app list"
echo
echo "Then set in web/.env.local:"
echo "  RESEARCHER_URL=https://<researcher-url>"
echo "  REASONER_URL=https://<reasoner-url>"
echo "  CRITIC_URL=https://<critic-url>"
