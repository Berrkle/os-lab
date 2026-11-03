#!/usr/bin/env python3
"""
MobSF CLI Client & REST API Automator
Enables zero-admin programmatic uploading, scanning, and report retrieval
from Mobile Security Framework (MobSF) instances (local, containerized, or remote).
"""

import sys
import os
import argparse
import json
import urllib.request
import urllib.parse
import mimetypes
import uuid
import shutil
import subprocess

DEFAULT_HOST = os.environ.get("MOBSF_URL", "http://127.0.0.1:8000").rstrip("/")
DEFAULT_KEY = os.environ.get("MOBSF_API_KEY", "")


def get_default_api_key(host: str) -> str:
    """Attempts to auto-discover local MobSF API key if not set."""
    if DEFAULT_KEY:
        return DEFAULT_KEY
    # Check ~/.MobSF/secret
    user_home = os.path.expanduser("~")
    secret_path = os.path.join(user_home, ".MobSF", "secret")
    if os.path.isfile(secret_path):
        try:
            with open(secret_path, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception:
            pass
    return "compact-lab-key"


def check_status(host: str = DEFAULT_HOST) -> bool:
    """Checks if MobSF server is reachable."""
    try:
        req = urllib.request.Request(host + "/", headers={"User-Agent": "apk-lab-client"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            return resp.status in (200, 302)
    except Exception:
        return False


def encode_multipart_formdata(fields: dict, files: dict):
    """Zero-dependency multipart/form-data generator for Python urllib."""
    boundary = f"----MobSFBoundary{uuid.uuid4().hex}"
    body = bytearray()

    for k, v in fields.items():
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode("utf-8"))
        body.extend(str(v).encode("utf-8") + b"\r\n")

    for field_name, (filename, data) in files.items():
        mime = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode("utf-8"))
        body.extend(f"Content-Type: {mime}\r\n\r\n".encode("utf-8"))
        body.extend(data + b"\r\n")

    body.extend(f"--{boundary}--\r\n".encode("utf-8"))
    content_type = f"multipart/form-data; boundary={boundary}"
    return content_type, bytes(body)


def upload_apk(apk_path: str, host: str = DEFAULT_HOST, api_key: str = None) -> dict:
    """Uploads an APK to MobSF."""
    if not os.path.isfile(apk_path):
        raise FileNotFoundError(f"APK file not found: {apk_path}")

    api_key = api_key or get_default_api_key(host)
    filename = os.path.basename(apk_path)
    with open(apk_path, "rb") as f:
        file_bytes = f.read()

    content_type, body = encode_multipart_formdata({}, {"file": (filename, file_bytes)})
    url = f"{host}/api/v1/upload"
    headers = {
        "Authorization": api_key,
        "Content-Type": content_type,
        "User-Agent": "apk-lab-client"
    }

    req = urllib.request.Request(url, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def trigger_scan(scan_hash: str, scan_type: str = "apk", host: str = DEFAULT_HOST, api_key: str = None) -> dict:
    """Triggers static analysis scan on uploaded APK."""
    api_key = api_key or get_default_api_key(host)
    url = f"{host}/api/v1/scan"
    data = urllib.parse.urlencode({"hash": scan_hash, "scan_type": scan_type, "re_scan": 0}).encode("utf-8")
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "apk-lab-client"
    }

    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read().decode("utf-8"))


def download_json_report(scan_hash: str, host: str = DEFAULT_HOST, api_key: str = None, out_file: str = None) -> dict:
    """Downloads full JSON security report from MobSF."""
    api_key = api_key or get_default_api_key(host)
    url = f"{host}/api/v1/report_json"
    data = urllib.parse.urlencode({"hash": scan_hash}).encode("utf-8")
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "apk-lab-client"
    }

    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as resp:
        report = json.loads(resp.read().decode("utf-8"))

    if out_file:
        os.makedirs(os.path.dirname(os.path.abspath(out_file)), exist_ok=True)
        with open(out_file, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

    return report


def start_mobsf_container() -> bool:
    """Attempts to launch MobSF container via docker or podman."""
    engine = shutil.which("docker") or shutil.which("podman")
    if not engine:
        print("[!] Neither docker nor podman found in PATH.")
        return False
    print(f"[*] Starting MobSF container with {engine} on port 8000...")
    cmd = [engine, "run", "-d", "--name", "mobsf", "-p", "8000:8000", "opensecurity/mobsf:latest"]
    try:
        subprocess.run(cmd, check=True)
        print("[+] MobSF container launch triggered. Accessible at http://127.0.0.1:8000")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[!] Failed to launch MobSF container: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description="MobSF REST API Client & Automation")
    subparsers = parser.add_subparsers(dest="command")

    # Status
    status_parser = subparsers.add_parser("status", help="Check MobSF server availability")
    status_parser.add_argument("--url", default=DEFAULT_HOST, help="MobSF URL")

    # Start
    subparsers.add_parser("start", help="Start MobSF container using local Docker or Podman")

    # Scan
    scan_parser = subparsers.add_parser("scan", help="Upload APK, scan, and download JSON report")
    scan_parser.add_argument("apk", help="Path to APK file")
    scan_parser.add_argument("--url", default=DEFAULT_HOST, help="MobSF URL")
    scan_parser.add_argument("--key", default="", help="MobSF API key (auto-detected if blank)")
    scan_parser.add_argument("-o", "--out", default=None, help="Output JSON report file path")

    args = parser.parse_args()

    if args.command == "status":
        alive = check_status(args.url)
        if alive:
            print(f"[+] MobSF is ONLINE and responding at {args.url}")
            sys.exit(0)
        else:
            print(f"[-] MobSF is OFFLINE or unreachable at {args.url}")
            sys.exit(1)

    elif args.command == "start":
        ok = start_mobsf_container()
        sys.exit(0 if ok else 1)

    elif args.command == "scan":
        host = args.url.rstrip("/")
        if not check_status(host):
            print(f"[!] MobSF server is not reachable at {host}.")
            sys.exit(1)

        print(f"[*] Uploading {args.apk} to MobSF ({host})...")
        upload_resp = upload_apk(args.apk, host=host, api_key=args.key or None)
        scan_hash = upload_resp.get("hash")
        print(f"[+] Upload success. File hash: {scan_hash}")

        print(f"[*] Triggering static analysis scan...")
        trigger_scan(scan_hash, host=host, api_key=args.key or None)
        print(f"[+] Scan completed.")

        out_path = args.out or os.path.join(
            os.path.dirname(__file__), "..", "reports", f"mobsf_{os.path.basename(args.apk)}.json"
        )
        print(f"[*] Downloading security assessment JSON report to {out_path}...")
        report = download_json_report(scan_hash, host=host, api_key=args.key or None, out_file=out_path)
        print(f"[+] MobSF report saved successfully ({os.path.getsize(out_path)} bytes).")
        sys.exit(0)

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
