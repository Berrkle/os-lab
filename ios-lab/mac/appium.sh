#!/usr/bin/env bash
# Start, stop or inspect the Appium XCUITest server.
#
#   appium.sh start|stop|status
set -euo pipefail

. "$(dirname "$0")/lib.sh"
require_macos

ACTION="${1:-status}"
PID_FILE="$MAC_DIR/.appium.pid"
mkdir -p "$LAB_DIR/artifacts"
case "$APPIUM_LOG" in
  /*) LOG="$APPIUM_LOG" ;;
  *) LOG="$LAB_DIR/$APPIUM_LOG" ;;
esac
mkdir -p "$(dirname "$LOG")"

running() {
  [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

case "$ACTION" in
  start)
    require_xcode
    command -v appium >/dev/null 2>&1 || die "appium not found; run: make mac-setup INSTALL=1"
    if running; then
      say "Appium already running (pid $(cat "$PID_FILE")) on ${APPIUM_HOST}:${APPIUM_PORT}"
      exit 0
    fi
    say "starting Appium on ${APPIUM_HOST}:${APPIUM_PORT}"
    nohup appium --address "$APPIUM_HOST" --port "$APPIUM_PORT" >"$LOG" 2>&1 &
    echo $! > "$PID_FILE"
    for ((i = 0; i < 30; i++)); do
      if curl -fsS --max-time 2 "http://${APPIUM_HOST}:${APPIUM_PORT}/status" >/dev/null 2>&1; then
        say "Appium ready (pid $(cat "$PID_FILE"), log $LOG)"
        exit 0
      fi
      sleep 1
    done
    tail -20 "$LOG" >&2 || true
    die "Appium did not become ready; see $LOG"
    ;;
  stop)
    if running; then
      PID="$(cat "$PID_FILE")"
      kill "$PID" 2>/dev/null || true
      for ((i = 0; i < 15; i++)); do
        kill -0 "$PID" 2>/dev/null || break
        sleep 1
      done
      kill -9 "$PID" 2>/dev/null || true
      rm -f "$PID_FILE"
      say "Appium stopped"
    else
      rm -f "$PID_FILE"
      say "Appium is not running"
    fi
    ;;
  status)
    if running; then
      say "Appium running (pid $(cat "$PID_FILE")) on ${APPIUM_HOST}:${APPIUM_PORT}"
      curl -fsS --max-time 2 "http://${APPIUM_HOST}:${APPIUM_PORT}/status" || true
      echo
    else
      say "Appium is not running"
    fi
    ;;
  *)
    die "usage: $0 start|stop|status"
    ;;
esac
