#!/usr/bin/env python3
"""
Cross-Platform Lab Orchestrator (Windows / Linux)
Provides programmatic orchestration and CLI for Mobile Security Lab goals without root/admin.
"""

import sys
import os
import argparse
import subprocess
import shutil
import socket
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(SCRIPT_DIR, "artifacts")
SCRIPTS_DIR = os.path.join(SCRIPT_DIR, "scripts")
VENV_DIR = os.path.join(SCRIPT_DIR, ".venv")
VBOX_MANAGE = r"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe" if sys.platform == "win32" else "VBoxManage"


def run_preflight() -> bool:
    print("=== 🔍 Mobile Security Lab Pre-Flight Checks ===")
    passes = True

    # 1. OS & Architecture
    print(f"  [OK]   Platform: {sys.platform} | Arch: {os.uname().machine if hasattr(os, 'uname') else os.environ.get('PROCESSOR_ARCHITECTURE')}")

    # 2. VirtualBox
    if shutil.which("VBoxManage") or (sys.platform == "win32" and os.path.exists(VBOX_MANAGE)):
        vbox_bin = "VBoxManage" if shutil.which("VBoxManage") else VBOX_MANAGE
        try:
            ver = subprocess.check_output([vbox_bin, "--version"], text=True, stderr=subprocess.DEVNULL).strip()
            print(f"  [OK]   VirtualBox found: {ver}")
        except Exception:
            print("  [WARN] VirtualBox executable present but unable to query version.")
    else:
        print("  [INFO] VirtualBox not detected.")

    # 3. Podman / Docker
    podman = shutil.which("podman")
    docker = shutil.which("docker")
    if podman:
        print(f"  [OK]   Podman found: {podman}")
    elif docker:
        print(f"  [OK]   Docker found: {docker}")
    else:
        print("  [INFO] Neither Podman nor Docker detected in PATH (Native Userland model active).")

    # 4. Java
    java = shutil.which("java")
    if java:
        print(f"  [OK]   Java runtime found: {java}")
    else:
        print("  [WARN] Java not detected in PATH.")

    # 5. ADB
    adb = shutil.which("adb") or (os.path.exists(os.path.join(SCRIPT_DIR, "tools", "platform-tools", "adb.exe")))
    if adb:
        print(f"  [OK]   ADB available.")
    else:
        print("  [WARN] ADB not in PATH. Download platform-tools via setup.")

    # 6. Ports check
    for port in [6080, 5554, 5555, 8000, 8080, 8081]:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.3)
        res = s.connect_ex(("127.0.0.1", port))
        s.close()
        if res == 0:
            print(f"  [WARN] Port {port} is already in use.")
        else:
            print(f"  [OK]   Port {port} is free.")

    return passes


def run_wf1(apk_path: str):
    if not os.path.isfile(apk_path):
        print(f"Error: APK not found: {apk_path}")
        sys.exit(1)

    apk_abs = os.path.abspath(apk_path)
    stem = os.path.splitext(os.path.basename(apk_path))[0]
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    out_dir = os.path.join(ARTIFACTS_DIR, f"{stem}-static-{stamp}")
    os.makedirs(out_dir, exist_ok=True)
    shutil.copy2(apk_abs, out_dir)

    print(f"\n=== 🛡️ WF1 Static Analysis: {os.path.basename(apk_path)} ===")
    print(f"Destination: {out_dir}")

    # Run Python manifest & security analyzer
    analyzer = os.path.join(SCRIPTS_DIR, "static_analyzer.py")
    subprocess.run([sys.executable, analyzer, apk_abs, out_dir], check=True)

    # Run JADX if available
    jadx = shutil.which("jadx") or (os.path.join(SCRIPT_DIR, "tools", "jadx", "bin", "jadx.bat" if sys.platform == "win32" else "jadx"))
    if jadx and (shutil.which(jadx) or os.path.exists(jadx)):
        jadx_out = os.path.join(out_dir, "jadx_out")
        print(f"Decompiling with JADX to {jadx_out}...")
        try:
            subprocess.run([jadx, "-d", jadx_out, apk_abs], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print("JADX decompilation complete.")
        except Exception as e:
            print(f"JADX decompilation error: {e}")

    print(f"\n=== WF1 Static Analysis Complete ===")
    print(f"  Report MD   : {os.path.join(out_dir, 'static-report.md')}")
    print(f"  Report JSON : {os.path.join(out_dir, 'static-manifest-analysis.json')}")


def main():
    parser = argparse.ArgumentParser(description="Agentic Mobile Security Lab Orchestrator")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("preflight", help="Run preflight checks")
    
    wf1_parser = subparsers.add_parser("wf1", help="Run Static Analysis (WF1)")
    wf1_parser.add_argument("--apk", required=True, help="Path to APK file")

    subparsers.add_parser("clean", help="Clean artifacts directory")

    args = parser.parse_args()

    if args.command == "preflight":
        run_preflight()
    elif args.command == "wf1":
        run_wf1(args.apk)
    elif args.command == "clean":
        if os.path.exists(ARTIFACTS_DIR):
            for item in os.listdir(ARTIFACTS_DIR):
                if item != ".gitkeep":
                    p = os.path.join(ARTIFACTS_DIR, item)
                    if os.path.isdir(p):
                        shutil.rmtree(p)
                    else:
                        os.remove(p)
            print("Artifacts cleared.")
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
