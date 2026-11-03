#!/usr/bin/env bash
# Remove the ios-lab systemd unit installed by install-service.sh.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  exec sudo -- bash "$0" "$@"
fi

UNIT=/etc/systemd/system/ios-lab.service
if [ -f "$UNIT" ]; then
  systemctl disable --now ios-lab.service || true
  rm -f "$UNIT"
  systemctl daemon-reload
  echo "removed $UNIT"
else
  echo "unit not installed: $UNIT"
fi
