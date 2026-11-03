#!/usr/bin/env bash
# Wait for firewall-lab guest readiness.
#   wait-ready.sh --web   wait for the web viewer   (default)
#   wait-ready.sh --ssh   wait for SSH
#   wait-ready.sh --all   both
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"
[ -f .env ] && { set -a; . ./.env; set +a; }

MODE="web"
case "${1:-}" in --ssh) MODE=ssh ;; --all) MODE=all ;; --web|"") MODE=web ;; *) echo "unknown: $1" >&2; exit 2 ;; esac

WEB_PORT="${WEB_PORT:-8007}"; SSH_PORT="${SSH_PORT:-2223}"
WEB_URL="http://127.0.0.1:${WEB_PORT}/"
if [ -t 1 ]; then GREEN=$'\033[32m'; YELLOW=$'\033[33m'; RED=$'\033[31m'; RESET=$'\033[0m'; else GREEN=""; YELLOW=""; RED=""; RESET=""; fi
info() { printf '%s[firewall-lab]%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%s[firewall-lab]%s %s\n' "$YELLOW" "$RESET" "$*"; }
die()  { printf '%s[firewall-lab]%s %s\n' "$RED" "$RESET" "$*" >&2; exit 1; }

RUNTIME=""
command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 && RUNTIME=docker
[ -z "$RUNTIME" ] && command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1 && RUNTIME=podman
[ -n "$RUNTIME" ] || die "no usable Docker/Podman"

state() { "$RUNTIME" inspect firewall-lab --format '{{.State.Status}}' 2>/dev/null || echo absent; }

wait_web() {
  local deadline=$((SECONDS + ${WEB_WAIT_TIMEOUT:-180})) next=$((SECONDS+15))
  info "waiting for the web viewer at $WEB_URL"
  while :; do
    curl -fsS -o /dev/null --max-time 3 "$WEB_URL" && { info "web viewer up: $WEB_URL"; return 0; }
    [ "$SECONDS" -ge "$next" ] && { warn "still waiting (state: $(state))"; next=$((SECONDS+30)); }
    [ "$SECONDS" -ge "$deadline" ] && die "web viewer not ready; run: make logs"
    sleep 3
  done
}
wait_ssh() {
  local deadline=$((SECONDS + ${SSH_WAIT_TIMEOUT:-600})) next=$((SECONDS+30))
  info "waiting for SSH on :$SSH_PORT (first boot provisions the guest; be patient)"
  while :; do
    (exec 3<>"/dev/tcp/127.0.0.1/${SSH_PORT}") 2>/dev/null && { info "SSH up on :$SSH_PORT"; return 0; }
    [ "$SECONDS" -ge "$next" ] && { warn "still waiting for SSH (state: $(state))"; next=$((SECONDS+60)); }
    [ "$SECONDS" -ge "$deadline" ] && die "SSH not ready; run: make logs"
    sleep 5
  done
}

[ "$(state)" = running ] || warn "container not running yet (state: $(state)); run: make up"
case "$MODE" in web) wait_web ;; ssh) wait_ssh ;; all) wait_web; wait_ssh ;; esac
info "ready"
