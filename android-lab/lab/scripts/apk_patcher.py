#!/usr/bin/env python3
"""
Zero-Admin APK Patcher & Security Instrumentation Injector (android-lab)
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


def sign_apk(apk_path: str) -> None:
    """Signs an APK file using Android v1 (JAR) signature scheme with a self-signed RSA debug cert."""
    from cryptography import x509
    from cryptography.x509.oid import NameOID
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives.serialization import pkcs7
    import hashlib
    import base64
    import datetime

    # 1. Read all files from APK (except existing META-INF signatures)
    entries = {}
    with zipfile.ZipFile(apk_path, 'r') as zin:
        for name in zin.namelist():
            if name.startswith("META-INF/") and (name.endswith(".SF") or name.endswith(".RSA") or name.endswith(".MF")):
                continue
            entries[name] = zin.read(name)

    # 2. Build MANIFEST.MF
    manifest_lines = ["Manifest-Version: 1.0", "Created-By: android-lab-signer", ""]
    entry_digests = {}
    for name in sorted(entries.keys()):
        digest = base64.b64encode(hashlib.sha256(entries[name]).digest()).decode('ascii')
        entry_digests[name] = digest
        manifest_lines.append(f"Name: {name}")
        manifest_lines.append(f"SHA-256-Digest: {digest}")
        manifest_lines.append("")
    manifest_bytes = "\r\n".join(manifest_lines).encode("utf-8")

    # 3. Build CERT.SF
    manifest_digest = base64.b64encode(hashlib.sha256(manifest_bytes).digest()).decode('ascii')
    sf_lines = [
        "Signature-Version: 1.0",
        "Created-By: android-lab-signer",
        f"SHA-256-Digest-Manifest: {manifest_digest}",
        ""
    ]
    for name in sorted(entry_digests.keys()):
        sec_header = f"Name: {name}\r\nSHA-256-Digest: {entry_digests[name]}\r\n\r\n".encode("utf-8")
        sec_digest = base64.b64encode(hashlib.sha256(sec_header).digest()).decode('ascii')
        sf_lines.append(f"Name: {name}")
        sf_lines.append(f"SHA-256-Digest: {sec_digest}")
        sf_lines.append("")
    sf_bytes = "\r\n".join(sf_lines).encode("utf-8")

    # 4. Generate RSA private key & self-signed X.509 cert
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, "android-lab-debug"),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, "android-lab")
    ])
    cert = x509.CertificateBuilder().subject_name(
        subject
    ).issuer_name(
        issuer
    ).public_key(
        key.public_key()
    ).serial_number(
        x509.random_serial_number()
    ).not_valid_before(
        datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1)
    ).not_valid_after(
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3650)
    ).sign(key, hashes.SHA256())

    # 5. Build PKCS#7 signature of CERT.SF
    sig_builder = pkcs7.PKCS7SignatureBuilder().set_data(sf_bytes).add_signer(
        cert, key, hashes.SHA256()
    )
    cert_rsa_bytes = sig_builder.sign(
        serialization.Encoding.DER,
        options=[pkcs7.PKCS7Options.DetachedSignature]
    )

    # 6. Append signatures to APK
    with zipfile.ZipFile(apk_path, 'a') as zout:
        zout.writestr("META-INF/MANIFEST.MF", manifest_bytes)
        zout.writestr("META-INF/CERT.SF", sf_bytes)
        zout.writestr("META-INF/CERT.RSA", cert_rsa_bytes)


def zipalign_apk(apk_path: str, alignment: int = 4) -> None:
    """
    Performs 4-byte zip alignment on an APK so uncompressed assets and .so libs
    can be mmap-ed directly by Android OS without extra memory copy.
    """
    temp_aligned = apk_path + ".aligned"
    with zipfile.ZipFile(apk_path, "r") as zin, zipfile.ZipFile(temp_aligned, "w") as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            zinfo = zipfile.ZipInfo(item.filename, date_time=item.date_time)
            zinfo.compress_type = item.compress_type
            zinfo.comment = item.comment
            zinfo.extra = item.extra

            cur_offset = zout.fp.tell()
            header_len = 30 + len(zinfo.filename.encode("utf-8")) + len(zinfo.extra)
            data_offset = cur_offset + header_len
            remainder = data_offset % alignment
            if remainder != 0:
                padding_len = alignment - remainder
                zinfo.extra += b"\x00" * padding_len

            zout.writestr(zinfo, data)

    shutil.move(temp_aligned, apk_path)


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

        # 2. Copy entries (skipping old signatures)
        for item in infolist:
            if item.filename.startswith("META-INF/") and (item.filename.endswith(".RSA") or item.filename.endswith(".SF") or item.filename.endswith(".MF")):
                continue
            
            data = zin.read(item.filename)
            zout.writestr(item, data)

        # 3. Optional Frida Gadget Injection
        if inject_gadget:
            gadget_target_path = f"lib/{arch}/libfrida-gadget.so"
            print(f"  [+] Injecting Frida Gadget library into: {gadget_target_path}...")
            gadget_local = os.path.join(os.path.dirname(__file__), "..", "frida", f"frida-gadget-{arch}.so")
            if os.path.exists(gadget_local):
                with open(gadget_local, "rb") as gf:
                    zout.writestr(gadget_target_path, gf.read())
                print(f"  [+] Real Frida Gadget successfully packaged.")
            else:
                zout.writestr(gadget_target_path, b"\x7fELF" + b"\x00" * 128)
                print(f"  [INFO] Placed stub gadget (Download real release to lab/frida/frida-gadget-{arch}.so)")

    # 4. Zipalign APK (4-byte alignment)
    print("  [+] Performing 4-byte zip alignment...")
    zipalign_apk(out_apk, alignment=4)

    # 5. Sign APK with Android v1 signature scheme
    print("  [+] Signing patched APK with Android v1 debug keystore (self-signed)...")
    sign_apk(out_apk)
    print("  [+] Successfully signed (META-INF/CERT.RSA generated).")

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
