#!/usr/bin/env bash
# Shut down all iOS Simulators and quit Simulator.app.
set -euo pipefail

. "$(dirname "$0")/lib.sh"
require_macos

say "shutting down simulators"
xcrun simctl shutdown all 2>/dev/null || true
osascript -e 'tell application "Simulator" to quit' >/dev/null 2>&1 || true
rm -f "$MAC_DIR/.sim-device"
say "stopped"
