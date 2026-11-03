#!/usr/bin/env bash
# Remove the win-lab systemd unit installed by install-service.sh.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  exec sudo -- bash "$0" "$@"
fi

UNIT=/etc/systemd/system/win-lab.service
if [ -f "$UNIT" ]; then
  systemctl disable --now win-lab.service || true
  rm -f "$UNIT"
  systemctl daemon-reload
  echo "removed $UNIT"
else
  echo "unit not installed: $UNIT"
fi
