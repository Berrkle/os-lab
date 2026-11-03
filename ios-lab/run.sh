#!/usr/bin/env bash
# Start ios-lab and wait for the web viewer.
#
#   ./run.sh             start and wait for http://127.0.0.1:<WEB_PORT>/
#   ./run.sh --no-wait   start without waiting
#
# Equivalent to: make boot
set -euo pipefail
cd "$(dirname "$0")"

WAIT=1
for arg in "$@"; do
  case "$arg" in
    --no-wait) WAIT=0 ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

[ -f .env ] || cp .env.example .env
if [ "$WAIT" = "1" ]; then
  make boot
else
  make up
fi
make status
