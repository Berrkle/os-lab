#!/usr/bin/env bash
# Start linux-lab and wait for the web viewer.
#
#   ./run.sh           start and wait for http://127.0.0.1:<WEB_PORT>/
#   ./run.sh --ssh     also wait for SSH on <SSH_PORT> (first boot/provision)
#
# Equivalent to: make boot [&& make wait-ready]
set -euo pipefail
cd "$(dirname "$0")"

WAIT_SSH=0
for arg in "$@"; do
  case "$arg" in
    --ssh) WAIT_SSH=1 ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

[ -f .env ] || cp .env.example .env
make boot
if [ "$WAIT_SSH" -eq 1 ]; then
  bash scripts/wait-ready.sh --ssh
fi
make status
