#!/usr/bin/env bash
# Start android-lab.
#
#   ./run.sh            start the mode in .env (dynamic by default) and wait
#   ./run.sh --dynamic  force the emulator stack
#   ./run.sh --static   start only MobSF, mitmproxy and tools (no KVM needed)
#
# Equivalent to: make boot  or  make static-up
set -euo pipefail
cd "$(dirname "$0")"

MODE=""
for arg in "$@"; do
  case "$arg" in
    --static) MODE="static" ;;
    --dynamic) MODE="dynamic" ;;
    -h|--help) sed -n '2,7p' "$0"; exit 0 ;;
    *) echo "unknown option: $arg" >&2; exit 2 ;;
  esac
done

[ -f .env ] || cp .env.example .env
if [ -z "$MODE" ]; then
  set -a
  . ./.env
  set +a
  MODE="${LAB_MODE:-dynamic}"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found; run: sudo ./setup.sh" >&2
  exit 1
fi

if [ "$MODE" = "static" ]; then
  docker compose -f docker-compose.win.yml up -d mobsf mitmproxy tools
  cat <<'EOF'

Static stack started (no KVM required):
  MobSF      http://127.0.0.1:8000/
  mitmweb    http://127.0.0.1:8081/
  mitmproxy  127.0.0.1:8080
  tools      docker compose -f docker-compose.win.yml exec tools bash

Next: make wf1 APK=path/to/app.apk
EOF
  exit 0
fi

make boot
cat <<'EOF'

Lab started:
  noVNC      http://127.0.0.1:6080/
  ADB        127.0.0.1:5555
  MobSF      http://127.0.0.1:8000/
  mitmweb    http://127.0.0.1:8081/

Next: make wf1 APK=path/to/app.apk
      make wf2 APK=path/to/app.apk PKG=com.example
EOF
