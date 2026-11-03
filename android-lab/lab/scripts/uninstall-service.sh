#!/usr/bin/env bash
# Remove the android-lab systemd unit.
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  exec sudo -- bash "$0" "$@"
fi

UNIT=/etc/systemd/system/android-lab.service
if [ -f "$UNIT" ]; then
  systemctl disable --now android-lab.service || true
  rm -f "$UNIT"
  systemctl daemon-reload
  echo "removed $UNIT"
else
  echo "unit not installed: $UNIT"
fi
