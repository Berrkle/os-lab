#!/usr/bin/env python3
"""
Mitmproxy Flow Parser & Security Traffic Auditor
Parses binary mitmproxy dump files (flows.mitm) without running the GUI,
extracting unique endpoints, authentication headers, cleartext HTTP leaks, and API patterns.
"""

import sys
import os
import argparse
import json
from datetime import datetime


def parse_flows(flow_file: str, out_dir: str):
    if not os.path.exists(flow_file):
        print(f"Flow file does not exist: {flow_file}")
        sys.exit(1)

    os.makedirs(out_dir, exist_ok=True)
    print(f"[*] Reading mitmproxy flows from: {flow_file}")

    # mitmproxy provides a Python library `mitmproxy.io.FlowReader`
    try:
        from mitmproxy import io
        from mitmproxy.exceptions import FlowReadException
    except ImportError:
        print("[!] mitmproxy library not installed in current Python environment.")
        print("    Run: pip install mitmproxy")
        # Provide fallback manual binary string parsing
        parse_flows_fallback(flow_file, out_dir)
        return

    summary = {
        "flow_file": os.path.abspath(flow_file),
        "timestamp": datetime.now().isoformat(),
        "total_flows": 0,
        "unique_hosts": set(),
        "cleartext_http_flows": [],
        "auth_headers_observed": [],
        "endpoints": [],
    }

    try:
        with open(flow_file, "rb") as f:
            reader = io.FlowReader(f)
            for flow in reader.stream():
                if hasattr(flow, "request") and flow.request:
                    summary["total_flows"] += 1
                    host = flow.request.pretty_host
                    summary["unique_hosts"].add(host)
                    method = flow.request.method
                    scheme = flow.request.scheme
                    url = flow.request.url

                    if scheme == "http":
                        summary["cleartext_http_flows"].append({
                            "method": method,
                            "url": url,
                            "host": host
                        })

                    # Check headers
                    auth = flow.request.headers.get("authorization", "")
                    if auth:
                        summary["auth_headers_observed"].append({
                            "host": host,
                            "auth_type": auth.split()[0] if auth else "Unknown"
                        })

                    summary["endpoints"].append({
                        "method": method,
                        "scheme": scheme,
                        "host": host,
                        "path": flow.request.path,
                        "status_code": flow.response.status_code if flow.response else None
                    })
    except Exception as e:
        print(f"[!] Warning during flow reading: {e}")

    summary["unique_hosts"] = list(summary["unique_hosts"])

    # Output JSON & MD
    json_path = os.path.join(out_dir, "traffic-summary.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    md_path = os.path.join(out_dir, "traffic-summary.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# 🌐 Captured Traffic & Network Audit Report\n\n")
        f.write(f"- **Total HTTP/HTTPS Flows:** {summary['total_flows']}\n")
        f.write(f"- **Unique Domains:** {len(summary['unique_hosts'])}\n")
        f.write(f"- **Insecure Cleartext Flows:** {len(summary['cleartext_http_flows'])}\n\n")

        if summary["cleartext_http_flows"]:
            f.write("## ⚠️ Cleartext HTTP Warnings\n\n")
            for item in summary["cleartext_http_flows"][:50]:
                f.write(f"- `{item['method']}` {item['url']}\n")
            f.write("\n")

        f.write("## 🌍 Contacted Hosts\n\n")
        for h in summary["unique_hosts"]:
            f.write(f"- `{h}`\n")

    print(f"\nAudit complete. Reports saved to: {out_dir}")
    print(f"  Total Flows: {summary['total_flows']} | Insecure HTTP: {len(summary['cleartext_http_flows'])}")


def parse_flows_fallback(flow_file: str, out_dir: str):
    """Fallback parser when mitmproxy python library is not loaded in current runtime."""
    print("[*] Running binary pattern analysis on flow file...")
    import re
    with open(flow_file, "rb") as f:
        data = f.read()

    # Search for URLs
    urls = set(re.findall(rb'https?://[a-zA-Z0-9\.\-_]+(?::[0-9]+)?/[a-zA-Z0-9\.\-_/?=&%]*', data))
    http_urls = [u.decode('ascii', errors='ignore') for u in urls if u.startswith(b'http://')]
    https_urls = [u.decode('ascii', errors='ignore') for u in urls if u.startswith(b'https://')]

    os.makedirs(out_dir, exist_ok=True)
    md_path = os.path.join(out_dir, "traffic-summary.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# 🌐 Captured Traffic (Binary Stream Extraction)\n\n")
        f.write(f"- **Total URLs Extracted:** {len(urls)}\n")
        f.write(f"- **Insecure Cleartext URLs:** {len(http_urls)}\n\n")
        if http_urls:
            f.write("## ⚠️ Cleartext HTTP URLs\n\n")
            for u in http_urls[:50]:
                f.write(f"- `{u}`\n")
            f.write("\n")
        f.write("## 🔒 HTTPS Endpoints\n\n")
        for u in https_urls[:50]:
            f.write(f"- `{u}`\n")

    json_path = os.path.join(out_dir, "traffic-audit-fallback.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({
            "flow_file": flow_file,
            "total_endpoints_found": len(urls),
            "cleartext_http_count": len(http_urls),
            "extracted_endpoints": sorted(list(http_urls + https_urls))
        }, f, indent=2)

    print(f"Fallback report saved to: {md_path}")


def main():
    parser = argparse.ArgumentParser(description="Mitmproxy Network Flow Traffic Auditor")
    parser.add_argument("flow_file", nargs="?", default=os.path.join("artifacts", "flows.mitm"), help="Path to flows.mitm")
    parser.add_argument("-o", "--out", default=os.path.join("artifacts", "traffic-audit"), help="Output directory")
    args = parser.parse_args()

    parse_flows(args.flow_file, args.out)


if __name__ == "__main__":
    main()
