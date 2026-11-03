#!/usr/bin/env bash
# Manage native macOS device presets.
#
#   profile.sh list
#   profile.sh use <iphone|ipad|legacy>
set -euo pipefail

MAC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG="$MAC_DIR/config.env"

usage() {
  sed -n '2,6p' "$0"
  exit 1
}

case "${1:-list}" in
  list)
    printf '%-10s %s\n' "PROFILE" "DEVICE"
    for f in "$MAC_DIR"/profiles/*.env; do
      [ -e "$f" ] || continue
      name="$(basename "$f" .env)"
      device="$(awk -F= '/^SIM_DEVICE=/{print $2; exit}' "$f")"
      device="${device%\"}"; device="${device#\"}"
      printf '%-10s %s\n' "$name" "$device"
    done
    ;;
  use)
    [ $# -ge 2 ] || usage
    name="$2"
    [ -f "$MAC_DIR/profiles/$name.env" ] || { echo "unknown profile: $name" >&2; exit 1; }
    cp "$MAC_DIR/profiles/$name.env" "$CONFIG"
    echo "applied macOS profile '$name' to $CONFIG"
    ;;
  *)
    usage
    ;;
esac
