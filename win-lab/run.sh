#!/usr/bin/env bash
# Start win-lab and wait for the web viewer.
#
#   ./run.sh             start and wait for http://127.0.0.1:<WEB_PORT>/
#   ./run.sh --install   also wait for storage/windows.boot (first install)
#
# Equivalent to: make boot [&& make wait-install]
set -euo pipefail
cd "$(dirname "$0")"

WAIT_INSTALL=0
for arg in "$@"; do
  case "$arg" in
    --install) WAIT_INSTALL=1 ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

[ -f .env ] || cp .env.example .env
make boot
if [ "$WAIT_INSTALL" -eq 1 ]; then
  make wait-install
fi
make status
