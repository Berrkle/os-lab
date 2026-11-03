#!/usr/bin/env bash
# Install a systemd unit that starts ios-lab at boot.
# Usage: sudo bash scripts/install-service.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  exec sudo -- bash "$0" "$@"
fi

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT=/etc/systemd/system/ios-lab.service

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  RUNTIME="$(command -v docker)"
  REQUIRE="docker.service"
elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
  RUNTIME="$(command -v podman)"
  REQUIRE="podman.service"
else
  echo "error: no usable Docker/Podman runtime" >&2
  exit 1
fi

LABCTL="$LAB_DIR/../labctl"
if [ -x "$LABCTL" ]; then
  START_CMD="${LABCTL} ios start"
  STOP_CMD="${LABCTL} ios stop"
else
  START_CMD="${RUNTIME} compose up -d macos"
  STOP_CMD="${RUNTIME} compose down"
fi

cat > "$UNIT" <<EOF
[Unit]
Description=ios-lab macOS VM
Requires=${REQUIRE}
After=${REQUIRE} network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${LAB_DIR}
ExecStart=${START_CMD}
ExecStop=${STOP_CMD}
TimeoutStartSec=0
TimeoutStopSec=180

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now ios-lab.service
echo "installed $UNIT"
systemctl --no-pager --lines=0 status ios-lab.service || true
