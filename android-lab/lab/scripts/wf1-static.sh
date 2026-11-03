#!/usr/bin/env bash
# WF1 (Static analysis) — segmentation.md DAG: MobSF scan → JADX decompile → report.
# Usage: wf1-static.sh <path/to/app.apk>
set -euo pipefail
cd "$(dirname "$0")/.."

[[ -f .env ]] && { set -a; . ./.env; set +a; }
KEY="${MOBSF_API_KEY:-compact-lab-key}"

APK="${1:?usage: wf1-static.sh <path/to/app.apk>}"
[[ -f "$APK" ]] || { echo "APK not found: $APK"; exit 1; }
APK="$(cd "$(dirname "$APK")" && pwd)/$(basename "$APK")"

NAME="$(basename "$APK")"
STEM="${NAME%.apk}"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="artifacts/${STEM}-static-${STAMP}"
mkdir -p "$OUT"
cp "$APK" "$OUT/"

echo "== WF1 static: $NAME =="
docker compose up -d mobsf tools

echo "[0/3] waiting for MobSF API (:8000)"
SECS=0
until curl -sf -o /dev/null http://localhost:8000/; do
  if [[ "$SECS" -ge 180 ]]; then echo "MobSF not reachable after 180s"; docker compose logs --tail 30 mobsf; exit 1; fi
  sleep 5; SECS=$((SECS + 5))
done

echo "[1/3] MobSF upload"
UPLOAD="$(curl -s -F "file=@${OUT}/${NAME}" -H "Authorization: ${KEY}" http://localhost:8000/api/v1/upload)"
HASH="$(printf '%s' "$UPLOAD" | sed -n 's/.*"hash":"\([^"]*\)".*/\1/p')"
[[ -n "$HASH" ]] || { echo "upload failed:"; echo "$UPLOAD"; exit 1; }
printf '%s\n' "$HASH" > "$OUT/hash.txt"
echo "  md5=$HASH"

echo "[2/3] MobSF scan (this can take a few minutes)"
curl -s -H "Authorization: ${KEY}" -d "hash=${HASH}" \
  http://localhost:8000/api/v1/scan -o "$OUT/mobsf-report.json"
curl -s -H "Authorization: ${KEY}" -d "hash=${HASH}" \
  http://localhost:8000/api/v1/download_pdf -o "$OUT/mobsf-report.pdf"
HIGH="$(grep -o '"HIGH"' "$OUT/mobsf-report.json" 2>/dev/null | wc -l | tr -d ' ')"
WARN="$(grep -o '"WARNING"' "$OUT/mobsf-report.json" 2>/dev/null | wc -l | tr -d ' ')"
echo "  findings: ${HIGH} high, ${WARN} warning tags"

echo "[3/3] JADX decompile (tools container)"
# tools mounts ./artifacts at /work; the APK was copied to $OUT above
docker compose exec -T tools jadx -d "/work/${OUT#artifacts/}/jadx_out" "/work/${OUT#artifacts/}/${NAME}" \
  > "$OUT/jadx.log" 2>&1 || echo "  jadx exited non-zero — see $OUT/jadx.log"

echo "== WF1 complete =="
echo "  report JSON : $OUT/mobsf-report.json"
echo "  report PDF  : $OUT/mobsf-report.pdf"
echo "  sources     : $OUT/jadx_out"
echo "  MobSF UI    : http://localhost:8000"
