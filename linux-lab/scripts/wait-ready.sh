#!/usr/bin/env bash
# Wait for linux-lab readiness.
#
#   wait-ready.sh              wait for the container and the web viewer
#   wait-ready.sh --ssh        wait for SSH on SSH_PORT to accept connections
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
    --ssh) MODE="ssh" ;;
    --all) MODE="all" ;;
    --web) MODE="web" ;;
    --timeout) TIMEOUT="${2:?--timeout needs a value}"; shift ;;
    -h|--help) sed -n '2,8p' "$0"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done

WEB_PORT="${WEB_PORT:-8006}"
SSH_PORT="${SSH_PORT:-2222}"
WEB_URL="http://127.0.0.1:${WEB_PORT}/"

if [ -t 1 ]; then RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RESET=$'\033[0m'; else RED=""; GREEN=""; YELLOW=""; RESET=""; fi
info() { printf '%s[linux-lab]%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%s[linux-lab]%s %s\n' "$YELLOW" "$RESET" "$*"; }
die()  { printf '%s[linux-lab]%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }

detect_runtime() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then echo docker; return; fi
  if command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then echo podman; return; fi
  echo ""
}

RUNTIME="$(detect_runtime)"
[ -n "$RUNTIME" ] || die "no usable Docker/Podman runtime (run: sudo make setup)"

container_state() {
  "$RUNTIME" inspect linux-lab --format '{{.State.Status}}' 2>/dev/null || echo "absent"
}

wait_container() {
  local deadline=$((SECONDS + ${1:-60}))
  local state
  while :; do
    state="$(container_state)"
    [ "$state" = "running" ] && { info "container linux-lab is running"; return 0; }
    { [ "$state" = "exited" ] || [ "$state" = "dead" ]; } && die "container linux-lab is $state; run: make logs"
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

wait_ssh() {
  local timeout="${1:-${SSH_WAIT_TIMEOUT:-600}}"
  local deadline=$((SECONDS + timeout))
  local next_note=$((SECONDS + 30))
  info "waiting for SSH on 127.0.0.1:${SSH_PORT} (timeout ${timeout}s)"
  info "first boot may download and provision the guest; this can take several minutes"
  while :; do
    if (exec 3<>"/dev/tcp/127.0.0.1/${SSH_PORT}") 2>/dev/null; then
      info "SSH is accepting connections on :${SSH_PORT}"
      touch storage/linux.ready 2>/dev/null || true
      return 0
    fi
    if [ "$SECONDS" -ge "$next_note" ]; then
      warn "still waiting for SSH... (state: $(container_state), storage: $(du -sh storage 2>/dev/null | cut -f1 || echo '?'))"
      next_note=$((SECONDS + 60))
    fi
    [ "$SECONDS" -ge "$deadline" ] && die "SSH not ready after ${timeout}s; run: make logs"
    sleep 5
  done
}

case "$MODE" in
  web)
    wait_container "${TIMEOUT:-60}"
    wait_web "${TIMEOUT:-${WEB_WAIT_TIMEOUT:-180}}"
    ;;
  ssh)
    wait_container 30
    wait_ssh "${TIMEOUT:-${SSH_WAIT_TIMEOUT:-600}}"
    ;;
  all)
    wait_container 60
    wait_web "${WEB_WAIT_TIMEOUT:-180}"
    wait_ssh "${SSH_WAIT_TIMEOUT:-600}"
    ;;
esac

info "done"
