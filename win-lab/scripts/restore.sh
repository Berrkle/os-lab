#!/usr/bin/env bash
# Restore a backup produced by backup.sh.
#
#   restore.sh backups/win-lab-20260101-120000.tar.gz [--yes]
#
# The current storage/ is moved aside (not deleted) before extraction.
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"

ARCHIVE="${1:-}"
CONFIRM="${2:-}"
if [ -z "$ARCHIVE" ] || [ "$ARCHIVE" = "-h" ] || [ "$ARCHIVE" = "--help" ]; then
  sed -n '2,6p' "$0"
  exit 0
fi
[ -f "$ARCHIVE" ] || { echo "error: archive not found: $ARCHIVE" >&2; exit 1; }

if [ "$CONFIRM" != "--yes" ]; then
  printf 'Replace current win-lab data with %s? [y/N] ' "$ARCHIVE"
  read -r answer
  case "$answer" in y|Y|yes|YES) ;; *) echo "aborted"; exit 1 ;; esac
fi

detect_compose() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then echo "docker compose"; return; fi
  if command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then echo "podman compose"; return; fi
  echo ""
}
COMPOSE="$(detect_compose)"
if [ -n "$COMPOSE" ]; then
  $COMPOSE stop windows 2>/dev/null || true
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
if [ -d storage ]; then
  echo "==> moving current storage/ to storage.bak-$STAMP"
  mv storage "storage.bak-$STAMP"
fi

echo "==> extracting $ARCHIVE"
tar -xzf "$ARCHIVE" -C .

echo "==> restore complete"
echo "    previous data (if any): storage.bak-$STAMP"
echo "    start with: make up"
