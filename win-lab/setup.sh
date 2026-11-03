#!/usr/bin/env bash
# Convenience wrapper: install KVM/Docker and prepare the lab.
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
exec sudo --preserve-env=OPEN_FIREWALL -- bash scripts/setup-ubuntu.sh "$@"
