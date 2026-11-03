#!/usr/bin/env bash
# Collect logs, device status, flow captures and MobSF output into artifacts/.
# Usage: report.sh
set -uo pipefail
cd "$(dirname "$0")/.."

STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="artifacts/report-${STAMP}"
mkdir -p "$OUT"

echo "== collecting lab report → $OUT =="

docker compose ps > "$OUT/services.txt" 2>/dev/null || true
docker compose exec -T android cat device_status > "$OUT/device_status.txt" 2>/dev/null || true
docker compose exec -T android adb logcat -d > "$OUT/logcat.txt" 2>/dev/null || true
docker compose logs --tail 200 android > "$OUT/docker-android.log" 2>/dev/null || true
docker compose logs --tail 200 mobsf  > "$OUT/docker-mobsf.log" 2>/dev/null || true
[[ -f artifacts/flows.mitm ]] && cp artifacts/flows.mitm "$OUT/"

echo "collected:"
ls -la "$OUT"
echo "done: $OUT"
