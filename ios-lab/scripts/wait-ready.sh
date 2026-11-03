#!/usr/bin/env bash
# Wait for the ios-lab web viewer.
#
#   wait-ready.sh              wait for the web viewer
#   wait-ready.sh --timeout S  override WEB_WAIT_TIMEOUT
#
# The web viewer is available before and during the manual macOS installation,
# so this only proves that QEMU and the viewer are up.
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"

ENV_FILE="${LAB_ENV_FILE:-.env}"
if [ "${LAB_ENV_LOADED:-0}" != "1" ] && [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
fi

TIMEOUT="${WEB_WAIT_TIMEOUT:-300}"
while [ $# -gt 0 ]; do
  case "$1" in
    --timeout) TIMEOUT="${2:?--timeout needs a value}"; shift ;;
    --web) ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

WEB_PORT="${WEB_PORT:-8006}"
URL="http://127.0.0.1:${WEB_PORT}/"
if [ -t 1 ]; then GREEN=$'\033[32m'; RED=$'\033[31m'; RESET=$'\033[0m'; else GREEN=""; RED=""; RESET=""; fi
info() { printf '%s[ios-lab]%s %s\n' "$GREEN" "$RESET" "$*"; }
die()  { printf '%s[ios-lab]%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }

DEADLINE=$((SECONDS + TIMEOUT))
info "waiting for $URL (timeout ${TIMEOUT}s)"
while :; do
  if curl -fsS -o /dev/null --max-time 3 "$URL"; then
    info "web viewer is responding: $URL"
    info "macOS installation and Xcode setup are manual; open the viewer to continue"
    exit 0
  fi
  [ "$SECONDS" -ge "$DEADLINE" ] && die "web viewer did not respond within ${TIMEOUT}s; run: make logs"
  sleep 2
done
