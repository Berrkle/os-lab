#!/usr/bin/env bash
# List or apply ios-lab resource profiles.
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE_DIR="$LAB_DIR/profiles"
ENV_FILE="$LAB_DIR/.env"
MARKER="$LAB_DIR/.lab-profile"

usage() {
  cat <<'USAGE'
usage: scripts/profile.sh list
       scripts/profile.sh use <name>
       scripts/profile.sh clear
USAGE
}

ensure_env() {
  if [ ! -f "$ENV_FILE" ]; then
    cp "$LAB_DIR/.env.example" "$ENV_FILE"
    echo "created .env from .env.example"
  fi
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

list_profiles() {
  printf '%-14s %s\n' "PROFILE" "DESCRIPTION"
  local file name desc
  for file in "$PROFILE_DIR"/*.env; do
    [ -e "$file" ] || continue
    name="$(basename "$file" .env)"
    desc="$(sed -n '1s/^# Profile: //p' "$file")"
    printf '%-14s %s\n' "$name" "$desc"
  done
  printf 'Last applied: %s\n' "$(cat "$MARKER" 2>/dev/null || echo custom)"
}

use_profile() {
  local name="${1:-}" file line key
  [ -n "$name" ] || { usage; exit 1; }
  file="$PROFILE_DIR/$name.env"
  if [ ! -f "$file" ]; then
    echo "error: unknown profile: $name" >&2
    list_profiles >&2
    exit 1
  fi
  ensure_env
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ''|'#'*) continue ;;
      *=*) ;;
      *) continue ;;
    esac
    key="${line%%=*}"
    set_key "$key" "${line#*=}"
  done < "$file"
  printf '%s\n' "$name" > "$MARKER"
  echo "applied $name profile to .env"
}

case "${1:-}" in
  list) list_profiles ;;
  use) shift; use_profile "${1:-}" ;;
  clear) rm -f "$MARKER"; echo "cleared profile marker" ;;
  -h|--help|"") usage ;;
  *) usage >&2; exit 1 ;;
esac
