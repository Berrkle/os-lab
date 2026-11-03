#!/usr/bin/env bash
# Show the native macOS lab state.
set -euo pipefail

. "$(dirname "$0")/lib.sh"
require_macos

echo "ios-lab (native macOS)"
echo "config      $CONFIG"
echo "device      $SIM_DEVICE"
echo "runtime     $IOS_RUNTIME"
if command -v xcodebuild >/dev/null 2>&1 && xcodebuild -version >/dev/null 2>&1; then
  echo "xcode       $(xcodebuild -version | tr '\n' ' ')"
else
  echo "xcode       missing"
fi
echo "simulators"
if command -v xcrun >/dev/null 2>&1; then
  BOOTED="$(booted_devices)"
  if [ -n "$BOOTED" ]; then printf '%s\n' "$BOOTED" | sed 's/^/  /'; else echo "  none booted"; fi
else
  echo "  simctl unavailable"
fi
echo "appium"
if curl -fsS --max-time 2 "http://${APPIUM_HOST}:${APPIUM_PORT}/status" >/dev/null 2>&1; then
  echo "  http://${APPIUM_HOST}:${APPIUM_PORT} ready"
else
  echo "  not running"
fi
echo "resources"
echo "  disk free $(df -h "$LAB_DIR" | awk 'NR==2 {print $4}')"
echo "  memory    $(( $(sysctl -n hw.memsize) / 1024 / 1024 / 1024 )) GB"
