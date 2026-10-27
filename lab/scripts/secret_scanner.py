#!/usr/bin/env python3
"""
Deep Static Secret & Credential Scanner for Android APKs
Scans APK archives and decompiled sources for hardcoded API keys, JWTs, cloud credentials,
private keys, and sensitive endpoints.
"""

import sys
import os
import re
import json
import zipfile
import argparse
from datetime import datetime

SECRET_PATTERNS = [
    ("Google API Key", re.compile(r'AIzaSy[A-Za-z0-9_-]{33}'), "HIGH"),
    ("Firebase URL", re.compile(r'https://[a-z0-9_-]+\.firebaseio\.com'), "MEDIUM"),
    ("AWS Access Key ID", re.compile(r'(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}'), "CRITICAL"),
    ("AWS Secret Key Pattern", re.compile(r'(?i)aws_secret_access_key\s*=\s*["\']?([a-zA-Z0-9/+=]{40})["\']?'), "CRITICAL"),
    ("JSON Web Token (JWT)", re.compile(r'eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'), "HIGH"),
    ("RSA/EC/PGP Private Key", re.compile(r'-----BEGIN (?:RSA |EC |PGP |OPENSSH )?PRIVATE KEY-----'), "CRITICAL"),
    ("GitHub Personal Access Token", re.compile(r'ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}'), "CRITICAL"),
    ("Slack API Token / Webhook", re.compile(r'xox[baprs]-[0-9]{12}-[0-9]{12}-[a-zA-Z0-9]{24}|https://hooks\.slack\.com/services/T[0-9A-Z]+/B[0-9A-Z]+/[0-9a-zA-Z]+'), "HIGH"),
    ("Generic Bearer Auth", re.compile(r'(?i)authorization\s*:\s*bearer\s+[a-zA-Z0-9_\-\.]{20,}'), "HIGH"),
    ("Basic Auth in URL", re.compile(r'https?://[a-zA-Z0-9_\-]+:[a-zA-Z0-9_\-]+@[a-zA-Z0-9\.\-]+'), "CRITICAL"),
    ("Hardcoded IP Address", re.compile(r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'), "INFO"),
    ("Insecure HTTP Endpoint", re.compile(r'http://[a-zA-Z0-9\.\-]+(?::[0-9]+)?/[a-zA-Z0-9\.\-_/?=&%]*'), "MEDIUM"),
]

IGNORED_EXTENSIONS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.mp3', '.ogg', '.wav', '.ttf', '.otf', '.woff'}


def mask_secret(secret: str) -> str:
    if len(secret) <= 8:
        return "****"
    return secret[:4] + "..." + secret[-4:]


def scan_content(content: str, source_name: str) -> list[dict]:
    findings = []
    lines = content.splitlines()
    for line_idx, line in enumerate(lines, 1):
        for name, pattern, severity in SECRET_PATTERNS:
            for match in pattern.finditer(line):
                matched_val = match.group(0)
                # Filter obvious false positives for IP addresses (e.g. 0.0.0.0, 127.0.0.1, versions)
                if name == "Hardcoded IP Address":
                    if matched_val in ("0.0.0.0", "127.0.0.1", "255.255.255.255") or matched_val.startswith("1.0.0."):
                        continue
                findings.append({
                    "rule": name,
                    "severity": severity,
                    "file": source_name,
                    "line": line_idx,
                    "preview": mask_secret(matched_val) if severity in ("CRITICAL", "HIGH") else matched_val,
                    "raw_match": matched_val if severity == "INFO" else mask_secret(matched_val)
                })
    return findings


def scan_target(target_path: str) -> dict:
    results = {
        "target": os.path.abspath(target_path),
        "timestamp": datetime.now().isoformat(),
        "total_findings": 0,
        "critical_count": 0,
        "high_count": 0,
        "medium_count": 0,
        "info_count": 0,
        "findings": []
    }

    all_findings = []

    if os.path.isfile(target_path) and target_path.lower().endswith(".apk"):
        print(f"[*] Scanning APK archive directly: {target_path}")
        with zipfile.ZipFile(target_path, 'r') as z:
            for filename in z.namelist():
                _, ext = os.path.splitext(filename.lower())
                if ext in IGNORED_EXTENSIONS or filename.endswith('/'):
                    continue
                try:
                    data = z.read(filename)
                    # Attempt decode
                    text = data.decode('utf-8', errors='ignore')
                    found = scan_content(text, filename)
                    all_findings.extend(found)
                except Exception:
                    pass

    elif os.path.isdir(target_path):
        print(f"[*] Scanning directory recursively: {target_path}")
        for root, _, files in os.walk(target_path):
            for file in files:
                _, ext = os.path.splitext(file.lower())
                if ext in IGNORED_EXTENSIONS:
                    continue
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, target_path)
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        text = f.read()
                    found = scan_content(text, rel_path)
                    all_findings.extend(found)
                except Exception:
                    pass

    results["findings"] = all_findings
    results["total_findings"] = len(all_findings)
    for f in all_findings:
        sev = f["severity"]
        if sev == "CRITICAL":
            results["critical_count"] += 1
        elif sev == "HIGH":
            results["high_count"] += 1
        elif sev == "MEDIUM":
            results["medium_count"] += 1
        else:
            results["info_count"] += 1

    return results


def main():
    parser = argparse.ArgumentParser(description="Deep Static Secret & Credential Scanner for APKs")
    parser.add_argument("target", help="Path to APK file or decompiled source directory")
    parser.add_argument("-o", "--out", help="Directory to save JSON and Markdown reports")
    args = parser.parse_args()

    if not os.path.exists(args.target):
        print(f"Error: Target path does not exist: {args.target}")
        sys.exit(1)

    print("=== 🔍 Scanning for Secrets, Tokens & Endpoints ===")
    results = scan_target(args.target)

    print(f"\nScan Complete: Found {results['total_findings']} potential secrets/endpoints.")
    print(f"  Critical : {results['critical_count']}")
    print(f"  High     : {results['high_count']}")
    print(f"  Medium   : {results['medium_count']}")
    print(f"  Info     : {results['info_count']}")

    out_dir = args.out or os.path.join("artifacts", "secret-scan")
    os.makedirs(out_dir, exist_ok=True)

    json_path = os.path.join(out_dir, "secrets-report.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    md_path = os.path.join(out_dir, "secrets-report.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write(f"# 🔑 Secret & Credential Scan Report\n\n")
        f.write(f"- **Target:** `{results['target']}`\n")
        f.write(f"- **Timestamp:** {results['timestamp']}\n")
        f.write(f"- **Total Matches:** **{results['total_findings']}**\n\n")
        f.write(f"| Severity | Count |\n|---|---|\n")
        f.write(f"| 🚨 Critical | **{results['critical_count']}** |\n")
        f.write(f"| ⚠️ High | **{results['high_count']}** |\n")
        f.write(f"| ⚡ Medium | **{results['medium_count']}** |\n")
        f.write(f"| ℹ️ Info | **{results['info_count']}** |\n\n")

        if results["findings"]:
            f.write("## 📝 Findings Breakdown\n\n")
            f.write("| Rule | Severity | Location | Preview |\n|---|---|---|---|\n")
            for item in results["findings"][:150]:  # limit top 150
                f.write(f"| {item['rule']} | {item['severity']} | `{item['file']}:{item['line']}` | `{item['preview']}` |\n")

    print(f"\nReports saved to:")
    print(f"  JSON : {json_path}")
    print(f"  MD   : {md_path}")


if __name__ == "__main__":
    main()
