#!/usr/bin/env bash
# Boot the configured iOS Simulator and open Simulator.app.
set -euo pipefail

. "$(dirname "$0")/lib.sh"
require_macos
require_xcode

DEVICE="$(pick_device "$SIM_DEVICE")"
[ -n "$DEVICE" ] || die "no installed simulator device found; open Xcode > Settings > Components"

say "booting $DEVICE"
if xcrun simctl list devices | grep -F "$DEVICE (" | grep -q Booted; then
  say "$DEVICE is already booted"
else
  xcrun simctl boot "$DEVICE" 2>/dev/null || true
fi

open -a Simulator
say "waiting for boot (timeout ${BOOT_TIMEOUT}s)"
if ! xcrun simctl bootstatus "$DEVICE" -b >/tmp/ios-lab-bootstatus.log 2>&1; then
  tail -20 /tmp/ios-lab-bootstatus.log >&2 || true
  die "simulator did not finish booting"
fi
printf '%s\n' "$DEVICE" > "$MAC_DIR/.sim-device"
say "$DEVICE is ready"
echo "    open Simulator.app to interact"
echo "    Appium: make mac-appium"
