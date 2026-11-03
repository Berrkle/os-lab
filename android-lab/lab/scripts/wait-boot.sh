#!/usr/bin/env bash
# Wait until the docker-android emulator reports ready (cheat sheet §5).
# Reads the container's own device_status file; used by WF2 and `make boot`.
# Usage: wait-boot.sh [timeout_seconds=600]
set -euo pipefail
cd "$(dirname "$0")/.."

TIMEOUT="${1:-600}"
ELAPSED=0

echo -n "waiting for emulator"
until docker compose exec -T android cat device_status 2>/dev/null | grep -qi 'ready'; do
  if [[ "$ELAPSED" -ge "$TIMEOUT" ]]; then
    echo
    echo "TIMEOUT after ${TIMEOUT}s — last 30 log lines:"
    docker compose logs --tail 30 android || true
    exit 1
  fi
  printf '.'
  sleep 10
  ELAPSED=$((ELAPSED + 10))
done
echo " ready (${ELAPSED}s)"

docker compose exec -T android cat device_status || true
