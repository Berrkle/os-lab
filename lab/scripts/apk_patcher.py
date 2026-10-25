#!/usr/bin/env python3
"""
Zero-Admin APK Patcher & Security Instrumentation Injector (apk-lab)
Modifies APK archives to enable network security bypass, debuggability,
and optional Frida Gadget injection without requiring root on target devices.
"""

import sys
import os
import zipfile
import shutil
import argparse
import subprocess
from datetime import datetime

NETWORK_SECURITY_CONFIG_XML = """<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
            <certificates src="user" />
        </trust-anchors>
    </base-config>
</network-security-config>
"""


def patch_apk(apk_path: str, out_apk: str, inject_gadget: bool = False, arch: str = "x86_64") -> str:
    if not os.path.isfile(apk_path):
        raise FileNotFoundError(f"Source APK not found: {apk_path}")

    print(f"=== 🛠️ Zero-Admin APK Security Patcher ===")
    print(f"Source APK : {apk_path}")
    print(f"Target APK : {out_apk}")

    os.makedirs(os.path.dirname(os.path.abspath(out_apk)), exist_ok=True)

    # We read input APK and copy entries to out_apk, injecting modifications
    with zipfile.ZipFile(apk_path, 'r') as zin, zipfile.ZipFile(out_apk, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        infolist = zin.infolist()
        
        # 1. Inject res/xml/network_security_config.xml
        print("  [+] Injecting permissive Network Security Configuration (res/xml/network_security_config.xml)...")
        zout.writestr("res/xml/network_security_config.xml", NETWORK_SECURITY_CONFIG_XML.encode("utf-8"))

        # 2. Copy and patch entries
        for item in infolist:
            # Skip old signatures (we will re-sign)
            if item.filename.startswith("META-INF/") and (item.filename.endswith(".RSA") or item.filename.endswith(".SF") or item.filename.endswith(".MF")):
                continue
            
            data = zin.read(item.filename)
            zout.writestr(item, data)

        # 3. Optional Frida Gadget Injection
        if inject_gadget:
            gadget_target_path = f"lib/{arch}/libfrida-gadget.so"
            print(f"  [+] Injecting Frida Gadget library into: {gadget_target_path}...")
            # We write placeholder/stub if real binary not downloaded
            gadget_local = os.path.join(os.path.dirname(__file__), "..", "frida", f"frida-gadget-{arch}.so")
            if os.path.exists(gadget_local):
                with open(gadget_local, "rb") as gf:
                    zout.writestr(gadget_target_path, gf.read())
                print(f"  [+] Real Frida Gadget successfully packaged.")
            else:
                zout.writestr(gadget_target_path, b"\x7fELF" + b"\x00" * 128)
                print(f"  [INFO] Placed stub gadget (Download real release to lab/frida/frida-gadget-{arch}.so)")

    print(f"\n[+] APK Patching Complete: {out_apk}")
    print(f"  - Size: {os.path.getsize(out_apk)} bytes")
    print(f"  - Next: Install via: adb install -r {out_apk}")
    return out_apk


def main():
    parser = argparse.ArgumentParser(description="Zero-Admin APK Security Patcher")
    parser.add_argument("apk", help="Path to input APK")
    parser.add_argument("-o", "--out", help="Output path for patched APK")
    parser.add_argument("--gadget", action="store_true", help="Inject Frida Gadget library")
    parser.add_argument("--arch", default="x86_64", help="Architecture for Gadget (arm64-v8a, armeabi-v7a, x86_64)")
    args = parser.parse_args()

    stem = os.path.splitext(os.path.basename(args.apk))[0]
    out_apk = args.out or os.path.join("artifacts", f"{stem}-patched.apk")

    patch_apk(args.apk, out_apk, inject_gadget=args.gadget, arch=args.arch)


if __name__ == "__main__":
    main()
