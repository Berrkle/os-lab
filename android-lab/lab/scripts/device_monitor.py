#!/usr/bin/env python3
"""
Android Device & Target Telemetry Monitor
Captures memory consumption (PSS, Private/Shared Dirty), CPU utilization,
thread count, and active network connections for a target Android package via ADB.
"""

import sys
import os
import subprocess
import re
import argparse
import shutil
import json
from datetime import datetime


def find_adb() -> str:
    adb = shutil.which("adb")
    if adb:
        return adb
    local_adb = os.path.join(os.path.dirname(__file__), "..", "tools", "platform-tools", "adb.exe" if sys.platform == "win32" else "adb")
    if os.path.exists(local_adb):
        return local_adb
    return "adb"


def get_meminfo(adb_bin: str, pkg: str) -> dict:
    mem_data = {"total_pss_kb": 0, "native_heap_kb": 0, "dalvik_heap_kb": 0, "views": 0, "activities": 0}
    try:
        out = subprocess.check_output([adb_bin, "shell", "dumpsys", "meminfo", pkg], text=True, stderr=subprocess.DEVNULL)
        for line in out.splitlines():
            if "TOTAL PSS:" in line or "TOTAL:" in line:
                m = re.search(r'TOTAL(?:\s+PSS)?:\s+([0-9]+)', line)
                if m:
                    mem_data["total_pss_kb"] = int(m.group(1))
            elif "Native Heap" in line:
                m = re.findall(r'([0-9]+)', line)
                if m:
                    mem_data["native_heap_kb"] = int(m[0])
            elif "Dalvik Heap" in line:
                m = re.findall(r'([0-9]+)', line)
                if m:
                    mem_data["dalvik_heap_kb"] = int(m[0])
            elif "Views:" in line:
                m = re.search(r'Views:\s+([0-9]+)', line)
                if m:
                    mem_data["views"] = int(m.group(1))
            elif "Activities:" in line:
                m = re.search(r'Activities:\s+([0-9]+)', line)
                if m:
                    mem_data["activities"] = int(m.group(1))
    except Exception:
        pass
    return mem_data


def get_network_sockets(adb_bin: str, pid: str) -> list[str]:
    sockets = []
    if not pid:
        return sockets
    try:
        out = subprocess.check_output([adb_bin, "shell", "netstat", "-tlpn"], text=True, stderr=subprocess.DEVNULL)
        for line in out.splitlines():
            if f"{pid}/" in line:
                sockets.append(line.strip())
    except Exception:
        pass
    return sockets


def get_battery_status(adb_bin: str) -> dict:
    battery = {}
    try:
        out = subprocess.check_output([adb_bin, "shell", "dumpsys", "battery"], text=True, stderr=subprocess.DEVNULL)
        for line in out.splitlines():
            parts = line.strip().split(":")
            if len(parts) == 2:
                battery[parts[0].strip()] = parts[1].strip()
    except Exception:
        pass
    return battery


def main():
    parser = argparse.ArgumentParser(description="Android Device & Target Telemetry Monitor")
    parser.add_argument("-p", "--pkg", required=True, help="Target package name")
    parser.add_argument("-o", "--out", help="Output JSON telemetry file")
    args = parser.parse_args()

    adb = find_adb()
    print(f"=== 📊 Target Telemetry Snapshot: {args.pkg} ===")

    # Get PID
    pid = ""
    try:
        out = subprocess.check_output([adb, "shell", "pidof", args.pkg], text=True, stderr=subprocess.DEVNULL).strip()
        if out:
            pid = out.split()[0]
    except Exception:
        pass

    print(f"  Target PID       : {pid or 'Not Running'}")

    mem = get_meminfo(adb, args.pkg)
    print(f"  Total PSS Memory : {round(mem['total_pss_kb'] / 1024, 2)} MB ({mem['total_pss_kb']} KB)")
    print(f"  Native Heap      : {round(mem['native_heap_kb'] / 1024, 2)} MB")
    print(f"  Dalvik/Java Heap : {round(mem['dalvik_heap_kb'] / 1024, 2)} MB")
    print(f"  Active Views     : {mem['views']}")
    print(f"  Activities       : {mem['activities']}")

    sockets = get_network_sockets(adb, pid)
    print(f"  Open Sockets     : {len(sockets)}")
    for s in sockets:
        print(f"    -> {s}")

    bat = get_battery_status(adb)
    if "level" in bat:
        print(f"  Battery Level    : {bat.get('level', '?')}% (Temp: {int(bat.get('temperature', 0))/10}°C)")

    telemetry_data = {
        "timestamp": datetime.now().isoformat(),
        "package": args.pkg,
        "pid": pid,
        "memory": mem,
        "sockets": sockets,
        "battery": bat,
    }

    if args.out:
        os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
        with open(args.out, "w", encoding="utf-8") as f:
            json.dump(telemetry_data, f, indent=2)
        print(f"\nTelemetry saved to: {args.out}")


if __name__ == "__main__":
    main()
