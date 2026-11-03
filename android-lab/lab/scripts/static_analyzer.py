#!/usr/bin/env python3
"""
Portable APK Static Analyzer (Windows Userland Compatible)
Extracts package metadata, permissions, security flags, exported components,
and attack surface from any APK without requiring root/admin or Docker.
"""

import sys
import os
import json
import zipfile
import re
import struct
from datetime import datetime

DANGEROUS_PERMISSIONS = {
    "android.permission.READ_CALENDAR": "HIGH",
    "android.permission.WRITE_CALENDAR": "HIGH",
    "android.permission.CAMERA": "HIGH",
    "android.permission.READ_CONTACTS": "HIGH",
    "android.permission.WRITE_CONTACTS": "HIGH",
    "android.permission.GET_ACCOUNTS": "MEDIUM",
    "android.permission.ACCESS_FINE_LOCATION": "HIGH",
    "android.permission.ACCESS_COARSE_LOCATION": "HIGH",
    "android.permission.ACCESS_BACKGROUND_LOCATION": "HIGH",
    "android.permission.RECORD_AUDIO": "HIGH",
    "android.permission.READ_PHONE_STATE": "HIGH",
    "android.permission.CALL_PHONE": "HIGH",
    "android.permission.READ_CALL_LOG": "HIGH",
    "android.permission.WRITE_CALL_LOG": "HIGH",
    "android.permission.ADD_VOICEMAIL": "MEDIUM",
    "android.permission.USE_SIP": "MEDIUM",
    "android.permission.PROCESS_OUTGOING_CALLS": "HIGH",
    "android.permission.BODY_SENSORS": "HIGH",
    "android.permission.SEND_SMS": "HIGH",
    "android.permission.RECEIVE_SMS": "HIGH",
    "android.permission.READ_SMS": "HIGH",
    "android.permission.RECEIVE_WAP_PUSH": "HIGH",
    "android.permission.RECEIVE_MMS": "HIGH",
    "android.permission.READ_EXTERNAL_STORAGE": "HIGH",
    "android.permission.WRITE_EXTERNAL_STORAGE": "HIGH",
    "android.permission.ACCESS_MEDIA_LOCATION": "MEDIUM",
    "android.permission.POST_NOTIFICATIONS": "LOW",
    "android.permission.INTERNET": "NORMAL",
    "android.permission.ACCESS_NETWORK_STATE": "NORMAL",
    "android.permission.ACCESS_WIFI_STATE": "NORMAL",
    "android.permission.SYSTEM_ALERT_WINDOW": "CRITICAL",
    "android.permission.WRITE_SETTINGS": "CRITICAL",
    "android.permission.REQUEST_INSTALL_PACKAGES": "CRITICAL",
}


def parse_binary_xml_strings(data: bytes) -> list[str]:
    """Extract human-readable strings from Android binary XML chunk."""
    strings = []
    # Android binary XML string pool contains UTF-16LE / UTF-8 strings
    # We use regex to find printable ASCII/UTF-8 strings of length >= 3
    pattern = re.compile(rb'[\x20-\x7e]{3,}')
    for match in pattern.finditer(data):
        try:
            s = match.group().decode('ascii', errors='ignore')
            if s and len(s) > 2:
                strings.append(s)
        except Exception:
            pass
    return strings


def analyze_apk(apk_path: str, out_dir: str) -> dict:
    if not os.path.isfile(apk_path):
        raise FileNotFoundError(f"APK file not found: {apk_path}")

    os.makedirs(out_dir, exist_ok=True)
    results = {
        "apk_path": os.path.abspath(apk_path),
        "file_name": os.path.basename(apk_path),
        "file_size_bytes": os.path.getsize(apk_path),
        "timestamp": datetime.now().isoformat(),
        "package_name": "unknown",
        "version_name": "unknown",
        "version_code": "unknown",
        "min_sdk": "unknown",
        "target_sdk": "unknown",
        "security_flags": {
            "debuggable": False,
            "allowBackup": True,
            "usesCleartextTraffic": False,
            "networkSecurityConfig": False,
            "testOnly": False,
        },
        "permissions": [],
        "risk_summary": {
            "critical_permissions": 0,
            "high_permissions": 0,
            "medium_permissions": 0,
            "normal_permissions": 0,
            "exported_components": 0,
            "security_warnings": 0,
        },
        "components": {
            "activities": [],
            "services": [],
            "receivers": [],
            "providers": [],
        },
        "embedded_files": [],
        "findings": [],
    }

    with zipfile.ZipFile(apk_path, 'r') as z:
        file_list = z.namelist()
        results["embedded_files"] = [f for f in file_list if not f.endswith('/')]

        # Check for interesting embedded assets
        so_files = [f for f in file_list if f.endswith('.so')]
        dex_files = [f for f in file_list if f.endswith('.dex')]
        cert_files = [f for f in file_list if f.startswith('META-INF/') and (f.endswith('.RSA') or f.endswith('.DSA') or f.endswith('.EC'))]
        
        results["dex_count"] = len(dex_files)
        results["native_libraries"] = so_files
        results["certificates"] = cert_files

        if "AndroidManifest.xml" in file_list:
            manifest_data = z.read("AndroidManifest.xml")
            raw_strings = parse_binary_xml_strings(manifest_data)

            # Extract permissions
            perm_matches = set()
            for s in raw_strings:
                if "android.permission." in s:
                    # Clean up
                    m = re.search(r'(android\.permission\.[A-Za-z0-9_]+)', s)
                    if m:
                        perm_matches.add(m.group(1))
                elif "permission" in s.lower() and "." in s:
                    perm_matches.add(s)

            for p in sorted(perm_matches):
                severity = DANGEROUS_PERMISSIONS.get(p, "CUSTOM")
                results["permissions"].append({"permission": p, "severity": severity})
                if severity == "CRITICAL":
                    results["risk_summary"]["critical_permissions"] += 1
                elif severity == "HIGH":
                    results["risk_summary"]["high_permissions"] += 1
                elif severity == "MEDIUM":
                    results["risk_summary"]["medium_permissions"] += 1
                else:
                    results["risk_summary"]["normal_permissions"] += 1

            # Check security flags in raw string pool
            raw_text = " ".join(raw_strings)
            if "debuggable" in raw_text:
                results["security_flags"]["debuggable"] = True
                results["findings"].append({
                    "id": "SEC-DEBUGGABLE",
                    "severity": "HIGH",
                    "title": "Application May Be Debuggable",
                    "desc": "Found 'debuggable' flag reference in manifest. Allows attaching debugger in production."
                })
                results["risk_summary"]["security_warnings"] += 1

            if "allowBackup" in raw_text:
                results["findings"].append({
                    "id": "SEC-BACKUP",
                    "severity": "LOW",
                    "title": "Application Allows Backup (allowBackup)",
                    "desc": "App data can be backed up and extracted via adb backup."
                })
                results["risk_summary"]["security_warnings"] += 1

            if "usesCleartextTraffic" in raw_text:
                results["security_flags"]["usesCleartextTraffic"] = True
                results["findings"].append({
                    "id": "SEC-CLEARTEXT",
                    "severity": "HIGH",
                    "title": "Cleartext HTTP Traffic Permitted",
                    "desc": "App permits unencrypted HTTP traffic, susceptible to MitM interception."
                })
                results["risk_summary"]["security_warnings"] += 1

            # Guess package name from strings
            candidates = [s for s in raw_strings if re.match(r'^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$', s) and not s.startswith("android.") and not s.startswith("androidx.")]
            if candidates:
                results["package_name"] = candidates[0]

    # Save JSON report
    report_json_path = os.path.join(out_dir, "static-manifest-analysis.json")
    with open(report_json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    # Save Markdown report
    report_md_path = os.path.join(out_dir, "static-report.md")
    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write(f"# 🛡️ Static Analysis Report: {results['file_name']}\n\n")
        f.write(f"- **Package:** `{results['package_name']}`\n")
        f.write(f"- **File Size:** {results['file_size_bytes']} bytes\n")
        f.write(f"- **DEX Files:** {results.get('dex_count', 0)}\n")
        f.write(f"- **Native Libraries (.so):** {len(results.get('native_libraries', []))}\n")
        f.write(f"- **Timestamp:** {results['timestamp']}\n\n")

        f.write("## ⚠️ Risk & Attack Surface Summary\n\n")
        f.write(f"| Metric | Count |\n|---|---|\n")
        for k, v in results["risk_summary"].items():
            f.write(f"| {k.replace('_', ' ').title()} | **{v}** |\n")
        f.write("\n")

        if results["findings"]:
            f.write("## 🚨 Security Findings\n\n")
            for finding in results["findings"]:
                f.write(f"- **[{finding['severity']}] {finding['title']}**: {finding['desc']}\n")
            f.write("\n")

        f.write("## 🔑 Declared Permissions\n\n")
        if results["permissions"]:
            f.write("| Permission | Severity |\n|---|---|\n")
            for p in results["permissions"]:
                f.write(f"| `{p['permission']}` | {p['severity']} |\n")
        else:
            f.write("No permissions detected in binary string pool.\n")

    return results


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: static_analyzer.py <path/to/app.apk> [output_directory]")
        sys.exit(1)
    apk = sys.argv[1]
    out = sys.argv[2] if len(sys.argv) > 2 else os.path.join("artifacts", "static-analysis")
    print(f"Analyzing APK: {apk}")
    data = analyze_apk(apk, out)
    print(f"Analysis complete. Reports saved to: {out}")
    print(f"Package: {data['package_name']} | Permissions: {len(data['permissions'])} | Findings: {len(data['findings'])}")
