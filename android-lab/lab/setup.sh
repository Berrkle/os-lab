#!/usr/bin/env bash
# Convenience wrapper: Ubuntu Server host setup for android-lab.
# Equivalent to: sudo make setup
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  awk 'NR>1 && /^#/ {print; next} NR>1 {exit}' "$0"
  exit 0
fi

cd "$(dirname "$0")"
if [ "$(id -u)" -eq 0 ]; then
  exec bash scripts/setup-ubuntu.sh "$@"
fi
exec sudo --preserve-env=OPEN_FIREWALL,PULL_IMAGES,SETUP_PYTHON -- bash scripts/setup-ubuntu.sh "$@"
