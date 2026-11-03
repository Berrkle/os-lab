#!/usr/bin/env bash
# Show ios-lab state, endpoints and resource use.
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"

ONCE=0
INTERVAL=5
while [ "$#" -gt 0 ]; do
  case "$1" in
    --once) ONCE=1; shift ;;
    -i|--interval) INTERVAL="${2:-5}"; shift 2 ;;
    -h|--help) echo "usage: scripts/monitor.sh [--once] [-i seconds]"; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 1 ;;
  esac
done

getenv() {
  local key="$1" fallback="$2"
  if [ -f .env ]; then
    local value
    value="$(sed -n "s/^${key}=//p" .env | tail -1)"
    [ -n "$value" ] && { printf '%s\n' "$value"; return; }
  fi
  printf '%s\n' "$fallback"
}

port_open() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn 2>/dev/null | awk -v p=":${port}$" '$4 ~ p { found = 1 } END { exit !found }'
  elif command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1
  else
    return 1
  fi
}

detect_runtime() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    echo docker
  elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
    echo podman
  fi
}

print_once() {
  local runtime web_port vnc_port state gpu
  runtime="$(detect_runtime || true)"
  web_port="$(getenv WEB_PORT 8006)"
  vnc_port="$(getenv VNC_PORT 5900)"
  gpu="$(getenv GPU N)"

  printf '%s\n' "$(date '+%Y-%m-%d %H:%M:%S')"
  printf 'lab       ios\n'
  printf 'runtime   %s\n' "${runtime:-none}"
  printf 'gpu       %s\n' "$gpu"
  printf 'config    %s\n' "$(cat .lab-profile 2>/dev/null || echo custom)"
  printf '%s\n' '------------------------------------------------------------'

  state="missing"
  if [ -n "$runtime" ]; then
    state="$("$runtime" inspect -f '{{.State.Status}}' ios-lab 2>/dev/null || echo missing)"
  fi
  printf 'container %s\n' "$state"
  printf 'web       http://127.0.0.1:%s  ' "$web_port"
  if curl -fsSI --max-time 3 "http://127.0.0.1:${web_port}/" >/dev/null 2>&1; then
    printf 'UP\n'
  else
    printf 'DOWN\n'
  fi
  printf 'vnc       tcp 127.0.0.1:%s  ' "$vnc_port"
  if port_open "$vnc_port"; then printf 'OPEN\n'; else printf 'CLOSED\n'; fi

  printf '%s\n' '------------------------------------------------------------'
  printf 'storage   %s\n' "$(du -sh storage 2>/dev/null | awk '{print $1}')"
  printf 'shared    %s\n' "$(du -sh shared 2>/dev/null | awk '{print $1}')"
  printf 'disk free %s\n' "$(df -h . | awk 'NR==2 {print $4}')"

  if [ -n "$runtime" ] && [ "$state" = "running" ]; then
    printf 'resources '
    "$runtime" stats --no-stream --format 'cpu {{.CPUPerc}}  mem {{.MemUsage}}' ios-lab 2>/dev/null || printf 'unavailable\n'
  fi
}

if [ "$ONCE" = "1" ]; then
  print_once
  exit 0
fi

while true; do
  clear 2>/dev/null || true
  print_once
  printf '\nrefresh %ss; Ctrl-C to exit\n' "$INTERVAL"
  sleep "$INTERVAL"
done
