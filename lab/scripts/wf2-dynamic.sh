#!/usr/bin/env bash
# WF2 (Dynamic analysis) — segmentation.md DAG:
#   boot Docker-Android → deploy APK → route through mitmproxy → (optional) Frida hooks.
# Usage: wf2-dynamic.sh <path/to/app.apk> [package.name]
set -euo pipefail
cd "$(dirname "$0")/.."

APK="${1:?usage: wf2-dynamic.sh <path/to/app.apk> [package.name]}"
PKG="${2:-}"
[[ -f "$APK" ]] || { echo "APK not found: $APK"; exit 1; }
APK="$(cd "$(dirname "$APK")" && pwd)/$(basename "$APK")"

NAME="$(basename "$APK")"
STEM="${NAME%.apk}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="artifacts/${STEM}-dynamic-${STAMP}"
mkdir -p "$OUT"
mkdir -p apks
cp "$APK" apks/

echo "== WF2 dynamic: $NAME =="
docker compose up -d android mitmproxy
bash scripts/wait-boot.sh 900

echo "[1/4] install APK"
docker compose exec -T android adb install -r "/apks/${NAME}" | tee "$OUT/install.log"

echo "[2/4] route emulator traffic through mitmproxy"
# The Android guest cannot resolve compose service names — use the container IP.
MITM_IP="$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' lab-mitmproxy)"
[[ -n "$MITM_IP" ]] || { echo "cannot resolve mitmproxy container IP"; exit 1; }
docker compose exec -T android adb shell settings put global http_proxy "${MITM_IP}:8080"
echo "  proxy → ${MITM_IP}:8080"
echo "  flows streaming to artifacts/flows.mitm — UI: http://localhost:8081"
echo "  emulator CA cert: open http://mitm.it in the emulator browser (via noVNC :6080)"

if [[ -n "$PKG" ]]; then
  echo "[3/4] launch $PKG"
  docker compose exec -T android adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 \
    > "$OUT/launch.log" 2>&1 || true
else
  echo "[3/4] skipped launch (no package name given; set it with: make wf2 APK=... PKG=com.example)"
fi

echo "[4/4] Frida server"
if [[ -f frida/frida-server ]]; then
  docker cp frida/frida-server lab-android:/data/local/tmp/frida-server
  docker compose exec -T android adb shell chmod 755 /data/local/tmp/frida-server
  docker compose exec -T -d android adb shell /data/local/tmp/frida-server
  echo "  frida-server running in emulator (rooted)"
  echo "  from the host:  adb connect 127.0.0.1:5555"
  echo "                  frida -U -f $PKG -l hooks/ssl-pinning-bypass.js"
  echo "  or:             make hook PKG=$PKG HOOK=hooks/ssl-pinning-bypass.js"
else
  echo "  frida/frida-server not found — skipped."
  echo "  to enable runtime hooking, download the matching release into lab/frida/frida-server:"
  echo "    https://github.com/frida/frida/releases → frida-server-<ver>-android-x86_64.xz"
fi

echo "== WF2 running =="
echo "  noVNC screen : http://localhost:6080"
echo "  mitmweb UI   : http://localhost:8081"
echo "  collect logs : make report"
echo "  unset proxy  : docker compose exec android adb shell settings put global http_proxy :0"
