#!/usr/bin/env bash
# Install a systemd unit that starts win-lab at boot.
# Usage: sudo bash scripts/install-service.sh
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  exec sudo -- bash "$0" "$@"
fi

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UNIT=/etc/systemd/system/win-lab.service

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  RUNTIME="$(command -v docker)"
  COMPOSE_ARGS="compose"
  REQUIRE="docker.service"
elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
  RUNTIME="$(command -v podman)"
  COMPOSE_ARGS="compose"
  REQUIRE="podman.service"
else
  echo "error: no usable Docker/Podman runtime" >&2
  exit 1
fi

cat > "$UNIT" <<EOF
[Unit]
Description=win-lab (dockur/windows) Windows VM
Requires=${REQUIRE}
After=${REQUIRE} network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${LAB_DIR}
ExecStart=${RUNTIME} ${COMPOSE_ARGS} up -d windows
ExecStop=${RUNTIME} ${COMPOSE_ARGS} down
TimeoutStartSec=0
TimeoutStopSec=180

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now win-lab.service
echo "installed $UNIT"
systemctl --no-pager --lines=0 status win-lab.service || true
