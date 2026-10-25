#!/usr/bin/env python3
"""
Real-Time Logcat Security Monitor
Streams adb logcat output with color-coded severity, package filtering,
and heuristic security alerts (token leaks, plaintext URLs, SQL queries, exceptions).
"""

import sys
import os
import subprocess
import re
import argparse
import shutil
from datetime import datetime

# ANSI Color codes for Windows & Linux terminals
RESET = "\033[0m"
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BOLD = "\033[1m"

# Patterns for sensitive data detection in logs
SECURITY_PATTERNS = [
    (re.compile(r'(?i)(bearer\s+[a-zA-Z0-9_\-\.]{20,})'), "Bearer Token Leak", "CRITICAL"),
    (re.compile(r'(?i)(password|passwd|pwd)\s*[:=]\s*["\']?([^"\'\s&]+)'), "Plaintext Password In Logs", "HIGH"),
    (re.compile(r'(?i)(api[_\-]?key|secret|token)\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{16,})'), "API Key / Token Leak", "HIGH"),
    (re.compile(r'http://[a-zA-Z0-9\.\-_]+(:[0-9]+)?(/[^\s]*)?'), "Insecure HTTP URL In Logs", "MEDIUM"),
    (re.compile(r'(?i)(select\s+.+\s+from\s+|insert\s+into\s+|update\s+.+\s+set\s+|delete\s+from\s+)'), "SQL Query Trace", "MEDIUM"),
    (re.compile(r'(?i)(rootbeer|supersu|magisk|frida|xposed|substrate)'), "Anti-Root / Integrity Detection", "INFO"),
    (re.compile(r'(?i)(fatal exception|crash|nullpointerexception)'), "Application Crash / Exception", "HIGH"),
]


def find_adb() -> str:
    adb = shutil.which("adb")
    if adb:
        return adb
    local_adb = os.path.join(os.path.dirname(__file__), "..", "tools", "platform-tools", "adb.exe" if sys.platform == "win32" else "adb")
    if os.path.exists(local_adb):
        return local_adb
    return "adb"


def get_package_pid(adb_bin: str, pkg: str) -> str:
    try:
        out = subprocess.check_output([adb_bin, "shell", "pidof", pkg], text=True, stderr=subprocess.DEVNULL).strip()
        if out:
            return out.split()[0]
    except Exception:
        pass
    return ""


def main():
    parser = argparse.ArgumentParser(description="Live Android Logcat Security Monitor")
    parser.add_argument("-p", "--pkg", help="Target package name to monitor")
    parser.add_argument("-f", "--filter", help="Custom regex filter pattern")
    parser.add_argument("-o", "--out", help="Output file to record alerts and logs")
    args = parser.parse_args()

    adb = find_adb()
    print(f"{CYAN}{BOLD}=== 📱 Live Android Logcat Security Monitor ==={RESET}")
    print(f"ADB Binary: {adb}")
    if args.pkg:
        print(f"Target Package: {BOLD}{args.pkg}{RESET}")

    target_pid = ""
    if args.pkg:
        target_pid = get_package_pid(adb, args.pkg)
        if target_pid:
            print(f"Detected PID for {args.pkg}: {GREEN}{target_pid}{RESET}")
        else:
            print(f"{YELLOW}Warning: Process '{args.pkg}' not running yet. Monitoring all logs matching package tag...{RESET}")

    log_file = None
    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        log_file = open(args.out, "w", encoding="utf-8")
        print(f"Logging alerts to: {args.out}")

    # Clear previous log buffer
    subprocess.run([adb, "logcat", "-c"], stderr=subprocess.DEVNULL)
    print(f"{GREEN}Log buffer cleared. Streaming live events (Ctrl+C to stop)...{RESET}\n")

    cmd = [adb, "logcat", "-v", "time"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1, encoding="utf-8", errors="replace")

    try:
        for line in proc.stdout:
            line_str = line.strip()
            if not line_str:
                continue

            # Filtering logic
            if target_pid and target_pid not in line_str and (args.pkg and args.pkg not in line_str):
                continue
            if args.filter and not re.search(args.filter, line_str, re.IGNORECASE):
                continue

            # Check security patterns
            alert_found = False
            for pat, alert_title, severity in SECURITY_PATTERNS:
                m = pat.search(line_str)
                if m:
                    alert_found = True
                    sev_color = RED if severity in ("CRITICAL", "HIGH") else (YELLOW if severity == "MEDIUM" else CYAN)
                    alert_msg = f"{sev_color}{BOLD}[🚨 {severity}] {alert_title}:{RESET} {m.group(0)}"
                    print(alert_msg)
                    if log_file:
                        log_file.write(f"[{datetime.now().isoformat()}] [{severity}] {alert_title}: {line_str}\n")
                        log_file.flush()

            # Format line
            if " E " in line_str or " E/" in line_str:
                print(f"{RED}{line_str}{RESET}")
            elif " W " in line_str or " W/" in line_str:
                print(f"{YELLOW}{line_str}{RESET}")
            elif alert_found:
                print(f"{MAGENTA}{line_str}{RESET}")
            else:
                print(line_str)

    except KeyboardInterrupt:
        print(f"\n{CYAN}Monitor stopped by user.{RESET}")
    finally:
        proc.terminate()
        if log_file:
            log_file.close()


if __name__ == "__main__":
    main()
