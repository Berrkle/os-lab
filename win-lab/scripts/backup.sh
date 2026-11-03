#!/usr/bin/env bash
# Back up win-lab configuration and VM storage.
#
#   backup.sh           archive .env, docker-compose.yml and storage/
#   backup.sh --full    also include shared/ and oem/
#   backup.sh --live    do not stop the container (not crash-consistent)
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"

FULL=0
LIVE=0
for arg in "$@"; do
  case "$arg" in
    --full) FULL=1 ;;
    --live) LIVE=1 ;;
    -h|--help) sed -n '2,6p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

[ -d storage ] || { echo "error: no storage/ directory in $LAB_DIR" >&2; exit 1; }
mkdir -p backups

detect_compose() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then echo "docker compose"; return; fi
  if command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then echo "podman compose"; return; fi
  echo ""
}
COMPOSE="$(detect_compose)"

WAS_RUNNING=0
if [ -n "$COMPOSE" ] && $COMPOSE ps -q windows 2>/dev/null | grep -q .; then
  WAS_RUNNING=1
fi

if [ "$WAS_RUNNING" -eq 1 ] && [ "$LIVE" -eq 0 ]; then
  echo "==> stopping win-lab for a consistent backup"
  $COMPOSE stop windows
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="backups/win-lab-${STAMP}.tar.gz"
PATHS=(.env docker-compose.yml storage)
if [ "$FULL" -eq 1 ]; then
  PATHS+=(shared oem)
fi

echo "==> archiving ${PATHS[*]} -> $OUT"
TAR_PATHS=()
for p in "${PATHS[@]}"; do
  [ -e "$p" ] && TAR_PATHS+=("$p")
done
tar -czf "$OUT" "${TAR_PATHS[@]}"

if [ "$WAS_RUNNING" -eq 1 ] && [ "$LIVE" -eq 0 ]; then
  echo "==> restarting win-lab"
  $COMPOSE up -d windows
fi

echo "==> backup complete: $OUT ($(du -h "$OUT" | cut -f1))"
echo "    restore with: make restore FILE=$OUT"
