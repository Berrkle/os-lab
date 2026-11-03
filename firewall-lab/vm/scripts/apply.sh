#!/usr/bin/env bash
# Copy a rendered rule set into the firewall-lab guest and run it.
#   apply.sh <slug> [target=ufw] [ext=sh]
# Needs sshpass (brew install hudochenkov/sshpass/sshpass / apt install sshpass),
# or run the printed commands by hand. UFW and nft targets only (table is for humans).
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"
[ -f .env ] && { set -a; . ./.env; set +a; }

SLUG="${1:?usage: apply.sh <slug> [target] [ext]}"
TARGET="${2:-ufw}"
EXT="${3:-sh}"
SSH_PORT="${SSH_PORT:-2223}"
FW_USER="${FW_USER:-ubuntu}"
FW_PASSWORD="${FW_PASSWORD:-ubuntu}"
FILE="shared/${SLUG}.${TARGET}.${EXT}"

[ -f "$FILE" ] || { echo "no $FILE — run: make render SLUG=$SLUG TARGET=$TARGET"; exit 1; }
case "$TARGET" in
  ufw) REMOTE_RUN="sudo bash /shared/$(basename "$FILE")" ;;
  nft) REMOTE_RUN="sudo nft -f /shared/$(basename "$FILE") && sudo nft list ruleset" ;;
  *) echo "apply supports ufw|nft (got '$TARGET'); 'table' is a human reference"; exit 1 ;;
esac

echo ">> $FILE is already at /shared inside the guest (bind mount)."
if command -v sshpass >/dev/null 2>&1; then
  echo ">> applying over SSH on :$SSH_PORT ..."
  sshpass -p "$FW_PASSWORD" ssh -p "$SSH_PORT" -o StrictHostKeyChecking=accept-new \
    "$FW_USER@127.0.0.1" "$REMOTE_RUN"
else
  cat <<EOF
sshpass not found. SSH in yourself and run it:

  ssh -p $SSH_PORT $FW_USER@127.0.0.1
  $REMOTE_RUN
EOF
fi
