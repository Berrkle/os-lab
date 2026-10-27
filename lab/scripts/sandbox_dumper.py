#!/usr/bin/env python3
"""
Android Sandbox Dumper & Storage Inspector
Extracts and audits target application sandbox data (/data/data/<pkg>):
- SharedPreferences XML files (analyzes plaintext tokens, keys, passwords)
- SQLite databases (.db)
- Cache and internal files
"""

import sys
import os
import subprocess
import shutil
import xml.etree.ElementTree as ET
import json
import argparse
from datetime import datetime


def find_adb() -> str:
    adb = shutil.which("adb")
    if adb:
        return adb
    local_adb = os.path.join(os.path.dirname(__file__), "..", "tools", "platform-tools", "adb.exe" if sys.platform == "win32" else "adb")
    if os.path.exists(local_adb):
        return local_adb
    return "adb"


def dump_sandbox(adb_bin: str, pkg: str, dest_dir: str) -> dict:
    os.makedirs(dest_dir, exist_ok=True)
    report = {
        "package": pkg,
        "timestamp": datetime.now().isoformat(),
        "shared_prefs": {},
        "databases": [],
        "files_dumped": [],
        "warnings": [],
    }

    print(f"[*] Attempting sandbox extraction for package: {pkg}")

    # Method 1: Root / su tar
    # Method 2: run-as (debuggable apps)
    tar_file = os.path.join(dest_dir, "sandbox.tar")
    extracted = False

    # Try run-as first
    try:
        proc = subprocess.run([adb_bin, "exec-out", f"run-as {pkg} tar -cf - ."], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if proc.returncode == 0 and len(proc.stdout) > 512:
            with open(tar_file, "wb") as f:
                f.write(proc.stdout)
            extracted = True
            print("  [+] Successfully extracted sandbox using 'run-as'")
    except Exception:
        pass

    # If run-as failed, try su (rooted emulator)
    if not extracted:
        try:
            proc = subprocess.run([adb_bin, "exec-out", f"su 0 tar -cf - -C /data/data/{pkg} ."], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if proc.returncode == 0 and len(proc.stdout) > 512:
                with open(tar_file, "wb") as f:
                    f.write(proc.stdout)
                extracted = True
                print("  [+] Successfully extracted sandbox using root 'su'")
        except Exception:
            pass

    if extracted and os.path.exists(tar_file):
        try:
            shutil.unpack_archive(tar_file, dest_dir)
            os.remove(tar_file)
            print("  [+] Archive unpacked successfully.")
        except Exception as e:
            print(f"  [!] Archive extraction note: {e}")

    # Inspect SharedPreferences
    prefs_dir = os.path.join(dest_dir, "shared_prefs")
    if os.path.exists(prefs_dir):
        for pref_file in os.listdir(prefs_dir):
            if pref_file.endswith(".xml"):
                pref_path = os.path.join(prefs_dir, pref_file)
                try:
                    tree = ET.parse(pref_path)
                    root = tree.getroot()
                    prefs_map = {}
                    for child in root:
                        name = child.attrib.get("name", "unknown")
                        val = child.attrib.get("value", child.text or "")
                        prefs_map[name] = val
                        # Audit for sensitive keys
                        if any(k in name.lower() for k in ["token", "auth", "secret", "pass", "key", "session", "jwt"]):
                            report["warnings"].append(f"Sensitive key in SharedPreferences ({pref_file}): '{name}' = '{val}'")
                    report["shared_prefs"][pref_file] = prefs_map
                except Exception as e:
                    print(f"  [!] Error parsing XML {pref_file}: {e}")

    # Inspect Databases
    db_dir = os.path.join(dest_dir, "databases")
    if os.path.exists(db_dir):
        for db in os.listdir(db_dir):
            if db.endswith(".db"):
                report["databases"].append(db)

    # Save summary report
    report_path = os.path.join(dest_dir, "sandbox-audit.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

    return report


def main():
    parser = argparse.ArgumentParser(description="Android App Sandbox Storage Auditor")
    parser.add_argument("-p", "--pkg", required=True, help="Target package name")
    parser.add_argument("-o", "--out", help="Output directory to save extracted sandbox")
    args = parser.parse_args()

    adb = find_adb()
    out = args.out or os.path.join("artifacts", f"sandbox-{args.pkg}")

    print("=== 🗄️ Android Sandbox Dumper & Storage Auditor ===")
    rep = dump_sandbox(adb, args.pkg, out)

    print(f"\nAudit complete. Artifacts saved to: {out}")
    print(f"  SharedPreferences files : {len(rep['shared_prefs'])}")
    print(f"  SQLite databases        : {len(rep['databases'])}")
    print(f"  Security warnings       : {len(rep['warnings'])}")
    for w in rep["warnings"]:
        print(f"    ⚠️  {w}")


if __name__ == "__main__":
    main()
