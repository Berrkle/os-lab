#!/usr/bin/env bash
# Change ios-lab CPU, RAM or disk settings in .env.
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"
ENV_FILE="$LAB_DIR/.env"

CPUS=""
RAM=""
DISK=""
APPLY=0
DRY=0

usage() {
  cat <<'USAGE'
usage: scripts/resize.sh [--cpus N] [--ram SIZE] [--disk SIZE] [--apply] [--dry-run]
  --ram 4G          guest RAM
  --disk 192G       grow-only disk size; extend APFS in macOS afterwards
  --apply           stop and recreate the container after writing .env
USAGE
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --cpus) CPUS="${2:-}"; shift 2 ;;
    --ram) RAM="${2:-}"; shift 2 ;;
    --disk) DISK="${2:-}"; shift 2 ;;
    --apply) APPLY=1; shift ;;
    --dry-run) DRY=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown option: $1" >&2; usage >&2; exit 1 ;;
  esac
done

if [ -z "$CPUS" ] && [ -z "$RAM" ] && [ -z "$DISK" ]; then
  usage >&2
  exit 1
fi

[ -f "$ENV_FILE" ] || cp "$LAB_DIR/.env.example" "$ENV_FILE"

get_key() {
  sed -n "s/^$1=//p" "$ENV_FILE" | tail -1
}

set_key() {
  local key="$1" value="$2" tmp
  tmp="$(mktemp)"
  awk -v k="$key" -v v="$value" '
    BEGIN { done = 0 }
    $0 ~ "^" k "=" { print k "=" v; done = 1; next }
    { print }
    END { if (!done) print k "=" v }
  ' "$ENV_FILE" > "$tmp"
  mv "$tmp" "$ENV_FILE"
}

if [ -n "$CPUS" ]; then
  case "$CPUS" in ''|*[!0-9]*) echo "error: --cpus must be an integer" >&2; exit 1 ;; esac
  [ "$CPUS" -ge 1 ] && [ "$CPUS" -le 64 ] || { echo "error: --cpus must be 1-64" >&2; exit 1; }
fi

if [ -n "$RAM" ]; then
  case "$RAM" in *[Gg]) ;; *) echo "error: --ram must look like 8G" >&2; exit 1 ;; esac
  RAM="${RAM%[Gg]}G"
  case "${RAM%G}" in ''|*[!0-9]*) echo "error: --ram must look like 8G" >&2; exit 1 ;; esac
fi

if [ -n "$DISK" ]; then
  case "$DISK" in *[Gg]) ;; *) echo "error: --disk must look like 192G" >&2; exit 1 ;; esac
  DISK="${DISK%[Gg]}G"
  case "${DISK%G}" in ''|*[!0-9]*) echo "error: --disk must look like 192G" >&2; exit 1 ;; esac
  current="$(get_key DISK_SIZE)"
  if [ -n "$current" ]; then
    case "$current" in *[Gg]) ;; *) current="" ;; esac
  fi
  if [ -n "$current" ] && [ "${DISK%G}" -lt "${current%[Gg]}" ]; then
    echo "error: refusing to shrink disk from ${current} to ${DISK}" >&2
    exit 1
  fi
fi

if [ "$DRY" = "1" ]; then
  printf 'dry run: would update %s\n' "$ENV_FILE"
  [ -n "$CPUS" ] && printf '  CPU_CORES=%s\n' "$CPUS"
  [ -n "$RAM" ] && printf '  RAM_SIZE=%s\n' "$RAM"
  [ -n "$DISK" ] && printf '  DISK_SIZE=%s (grow-only; extend APFS in macOS)\n' "$DISK"
  exit 0
fi

[ -n "$CPUS" ] && set_key CPU_CORES "$CPUS"
[ -n "$RAM" ] && set_key RAM_SIZE "$RAM"
[ -n "$DISK" ] && set_key DISK_SIZE "$DISK"

printf 'updated %s\n' "$ENV_FILE"
[ -n "$CPUS" ] && printf '  CPU_CORES=%s\n' "$CPUS"
[ -n "$RAM" ] && printf '  RAM_SIZE=%s\n' "$RAM"
[ -n "$DISK" ] && printf '  DISK_SIZE=%s (grow-only; extend APFS in macOS)\n' "$DISK"

if [ "$APPLY" != "1" ]; then
  echo "run 'make restart' to apply, or use --apply"
  exit 0
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  runtime=docker
elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
  runtime=podman
else
  echo "error: no usable Docker/Podman runtime for --apply" >&2
  exit 1
fi

files=(-f docker-compose.yml)
if grep -q '^GPU=Y' .env; then
  files+=(-f docker-compose.gpu.yml)
fi

"$runtime" compose "${files[@]}" down
"$runtime" compose "${files[@]}" up -d macos
echo "container recreated"
