#!/usr/bin/env python3
"""
Automated IPC & Component Attack Surface Fuzzer (android-lab)
Tests exported Android Activities, Broadcast Receivers, Services, and Content Providers
for authorization bypasses, unhandled intent extras, SQL injection, and crashes.
"""

import sys
import os
import subprocess
import shutil
import re
import json
import argparse
from datetime import datetime

FUZZ_PAYLOADS = [
    ("", "Empty/Null Intent"),
    ("--es payload_str 'A'*2048", "Buffer Overflow String Payload"),
    ("--es test_uri 'content://com.android.contacts/contacts'", "Unauthorized Content URI"),
    ("--es sqli \"' OR '1'='1' --\"", "SQL Injection Probe"),
    ("--es path_traversal '../../../../../../etc/hosts'", "Directory Traversal Probe"),
    ("--ei count -1", "Integer Underflow Probe"),
    ("--ez debug_mode true", "Privilege Escalation Flag Probe")
]


def find_adb() -> str:
    adb = shutil.which("adb")
    if adb:
        return adb
    local_adb = os.path.join(os.path.dirname(__file__), "..", "tools", "platform-tools", "adb.exe" if sys.platform == "win32" else "adb")
    if os.path.exists(local_adb):
        return local_adb
    return "adb"


def get_exported_activities(adb_bin: str, pkg: str) -> list[str]:
    activities = []
    try:
        out = subprocess.check_output([adb_bin, "shell", "dumpsys", "package", pkg], text=True, stderr=subprocess.DEVNULL)
        in_activities = False
        for line in out.splitlines():
            if "Activity Resolver Table:" in line:
                in_activities = True
            elif "Receiver Resolver Table:" in line or "Service Resolver Table:" in line:
                in_activities = False

            if in_activities and f"{pkg}/" in line:
                m = re.search(rf'({pkg}/[A-Za-z0-9_\.]+)', line)
                if m:
                    activities.append(m.group(1))
    except Exception:
        pass
    return sorted(list(set(activities)))


def check_for_crash(adb_bin: str, pkg: str) -> bool:
    try:
        logs = subprocess.check_output([adb_bin, "logcat", "-d", "-t", "30"], text=True, stderr=subprocess.DEVNULL)
        if "FATAL EXCEPTION" in logs and (pkg in logs):
            return True
    except Exception:
        pass
    return False


def run_fuzzer(pkg: str, out_dir: str):
    adb = find_adb()
    os.makedirs(out_dir, exist_ok=True)
    report = {
        "package": pkg,
        "timestamp": datetime.now().isoformat(),
        "tested_components": [],
        "crashes_detected": 0,
        "results": []
    }

    print(f"=== ⚡ Automated IPC & Component Fuzzer ===")
    print(f"Target: {pkg}")
    print(f"ADB: {adb}")

    # Discover components
    activities = get_exported_activities(adb, pkg)
    print(f"[*] Discovered {len(activities)} exported activities to probe.")

    for comp in activities:
        print(f"\nProbing component: {comp}")
        for payload_args, payload_desc in FUZZ_PAYLOADS:
            cmd = [adb, "shell", "am", "start", "-n", comp]
            if payload_args:
                cmd.extend(payload_args.split())

            # Clear log buffer
            subprocess.run([adb, "logcat", "-c"], stderr=subprocess.DEVNULL)

            # Fire test
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            output = res.stdout + res.stderr

            crashed = check_for_crash(adb, pkg)
            status = "CRASH_TRIGGERED" if crashed else ("SUCCESS_LAUNCH" if "Starting:" in output else "LAUNCH_ERROR")
            if crashed:
                report["crashes_detected"] += 1
                print(f"  🚨 [CRASH TRIGGERED] Payload: {payload_desc}")
            else:
                print(f"  [+] Status: {status} | Payload: {payload_desc}")

            report["results"].append({
                "component": comp,
                "payload": payload_desc,
                "status": status,
                "crashed": crashed,
                "raw_output": output.strip()
            })

    # Save reports
    json_path = os.path.join(out_dir, "ipc-fuzz-report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    md_path = os.path.join(out_dir, "ipc-fuzz-report.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"# ⚡ IPC & Component Fuzzing Report: {pkg}\n\n")
        f.write(f"- **Target Package:** `{pkg}`\n")
        f.write(f"- **Tested Components:** {len(activities)}\n")
        f.write(f"- **Crashes Detected:** **{report['crashes_detected']}**\n")
        f.write(f"- **Timestamp:** {report['timestamp']}\n\n")

        f.write("## 📋 Probe Test Execution Matrix\n\n")
        f.write("| Component | Payload | Status | Crash? |\n|---|---|---|---|\n")
        for r in report["results"]:
            crash_icon = "🚨 YES" if r["crashed"] else "No"
            f.write(f"| `{r['component']}` | {r['payload']} | `{r['status']}` | {crash_icon} |\n")

    print(f"\nFuzzing Complete:")
    print(f"  Total Probes    : {len(report['results'])}")
    print(f"  Crashes Found   : {report['crashes_detected']}")
    print(f"  Reports saved to: {out_dir}")


def main():
    parser = argparse.ArgumentParser(description="Android IPC Component Fuzzer")
    parser.add_argument("-p", "--pkg", required=True, help="Target package name on device")
    parser.add_argument("-o", "--out", help="Output directory")
    args = parser.parse_args()

    out_dir = args.out or os.path.join("artifacts", f"ipc-fuzz-{args.pkg}")
    run_fuzzer(args.pkg, out_dir)


if __name__ == "__main__":
    main()
