#!/usr/bin/env bash
# Wait for win-lab readiness.
#
#   wait-ready.sh              wait for the container and the web viewer
#   wait-ready.sh --install    wait for storage/windows.boot (install finished)
#   wait-ready.sh --all        both
#
# Options: --timeout SECONDS
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"

ENV_FILE="${LAB_ENV_FILE:-.env}"
if [ "${LAB_ENV_LOADED:-0}" != "1" ] && [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ENV_FILE"
  set +a
fi

MODE="web"
TIMEOUT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --install) MODE="install" ;;
    --all) MODE="all" ;;
    --web) MODE="web" ;;
    --timeout) TIMEOUT="${2:?--timeout needs a value}"; shift ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

WEB_PORT="${WEB_PORT:-8006}"
WEB_URL="http://127.0.0.1:${WEB_PORT}/"
MARKER="$LAB_DIR/storage/windows.boot"

if [ -t 1 ]; then RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'; else RED=""; GREEN=""; YELLOW=""; RESET=""; fi
info() { printf '%s[win-lab]%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%s[win-lab]%s %s\n' "$YELLOW" "$RESET" "$*"; }
die()  { printf '%s[win-lab]%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }

detect_runtime() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then echo docker; return; fi
  if command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then echo podman; return; fi
  echo ""
}

RUNTIME="$(detect_runtime)"
[ -n "$RUNTIME" ] || die "no usable Docker/Podman runtime (run: sudo make setup)"

container_state() {
  "$RUNTIME" inspect win-lab --format '{{.State.Status}}' 2>/dev/null || echo "absent"
}

container_logs_tail() {
  "$RUNTIME" logs --tail=5 win-lab 2>&1 | sed 's/^/    /' || true
}

wait_container() {
  local deadline=$((SECONDS + ${1:-60}))
  local state
  while :; do
    state="$(container_state)"
    [ "$state" = "running" ] && { info "container win-lab is running"; return 0; }
    [ "$state" = "exited" ] || [ "$state" = "dead" ] && die "container win-lab is $state; run: make logs"
    [ "$SECONDS" -ge "$deadline" ] && die "container did not start within ${1:-60}s (last state: $state)"
    sleep 2
  done
}

wait_web() {
  local timeout="${1:-${WEB_WAIT_TIMEOUT:-180}}"
  local deadline=$((SECONDS + timeout))
  local next_note=$((SECONDS + 15))
  info "waiting for the web viewer at $WEB_URL (timeout ${timeout}s)"
  while :; do
    if curl -fsS -o /dev/null --max-time 3 "$WEB_URL"; then
      info "web viewer is responding: $WEB_URL"
      return 0
    fi
    if [ "$SECONDS" -ge "$next_note" ]; then
      warn "still waiting... (state: $(container_state))"
      next_note=$((SECONDS + 30))
    fi
    [ "$SECONDS" -ge "$deadline" ] && die "web viewer not ready after ${timeout}s; run: make logs"
    sleep 3
  done
}

wait_install() {
  local timeout="${1:-${INSTALL_WAIT_TIMEOUT:-7200}}"
  local deadline=$((SECONDS + timeout))
  local next_note=$((SECONDS + 30))
  local state

  if [ -f "$MARKER" ]; then
    info "installation marker already present: storage/windows.boot"
    return 0
  fi

  info "waiting for Windows installation to finish (marker: storage/windows.boot)"
  info "first boot downloads media and installs Windows; this can take 20-60+ minutes"

  while :; do
    if [ -f "$MARKER" ]; then
      info "installation finished: storage/windows.boot"
      return 0
    fi

    state="$(container_state)"
    if [ "$state" = "exited" ] || [ "$state" = "dead" ] || [ "$state" = "absent" ]; then
      die "container is $state before installation finished; run: make logs"
    fi

    if [ "$SECONDS" -ge "$next_note" ]; then
      warn "still installing... (state: $state, storage: $(du -sh storage 2>/dev/null | cut -f1 || echo '?'))"
      container_logs_tail
      next_note=$((SECONDS + 120))
    fi

    [ "$SECONDS" -ge "$deadline" ] && die "installation did not finish within ${timeout}s; run: make logs"
    sleep 10
  done
}

case "$MODE" in
  web)
    wait_container "${TIMEOUT:-60}"
    wait_web "${TIMEOUT:-${WEB_WAIT_TIMEOUT:-180}}"
    ;;
  install)
    wait_container 30
    wait_install "${TIMEOUT:-${INSTALL_WAIT_TIMEOUT:-7200}}"
    ;;
  all)
    wait_container 60
    wait_web "${WEB_WAIT_TIMEOUT:-180}"
    wait_install "${INSTALL_WAIT_TIMEOUT:-7200}"
    ;;
esac

info "done"
