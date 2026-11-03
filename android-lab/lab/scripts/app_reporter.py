#!/usr/bin/env python3
"""
Master Mobile Security Report Generator (android-lab)
Generates comprehensive, standalone HTML5, Markdown, and JSON audit reports
from static analysis, dynamic telemetry, and secret scanning findings.
"""

import sys
import os
import json
import argparse
from datetime import datetime

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mobile Security Audit Report - {{TARGET_NAME}}</title>
<style>
  :root {
    --bg-primary: #0b0f19;
    --bg-secondary: #131b2e;
    --bg-card: #1e293b;
    --border: #334155;
    --text-primary: #f8fafc;
    --text-secondary: #94a3b8;
    --critical: #ef4444;
    --high: #f97316;
    --medium: #eab308;
    --low: #3b82f6;
    --info: #06b6d4;
    --success: #10b981;
    --accent: #8b5cf6;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background-color: var(--bg-primary);
    color: var(--text-primary);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    padding: 30px 20px;
  }
  .container { max-width: 1200px; margin: 0 auto; }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 25px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 15px;
  }
  .title-area h1 { font-size: 26px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 10px; }
  .title-area p { color: var(--text-secondary); font-size: 14px; margin-top: 4px; }
  .badge-tag { padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
  
  .grid-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
  }
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }
  .card-score {
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .score-number {
    font-size: 54px;
    font-weight: 800;
    line-height: 1;
    margin: 10px 0;
  }
  .score-grade {
    display: inline-block;
    padding: 4px 14px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .stat-item {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px;
  }
  .stat-item .label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; font-weight: 600; }
  .stat-item .val { font-size: 20px; font-weight: 700; margin-top: 4px; }

  .sev-critical { color: var(--critical); border-color: rgba(239, 68, 68, 0.4); }
  .sev-high { color: var(--high); border-color: rgba(249, 115, 22, 0.4); }
  .sev-medium { color: var(--medium); border-color: rgba(234, 179, 8, 0.4); }
  .sev-low { color: var(--low); border-color: rgba(59, 130, 246, 0.4); }
  
  .badge-critical { background: rgba(239, 68, 68, 0.2); color: var(--critical); border: 1px solid var(--critical); }
  .badge-high { background: rgba(249, 115, 22, 0.2); color: var(--high); border: 1px solid var(--high); }
  .badge-medium { background: rgba(234, 179, 8, 0.2); color: var(--medium); border: 1px solid var(--medium); }
  .badge-low { background: rgba(59, 130, 246, 0.2); color: var(--low); border: 1px solid var(--low); }
  
  .section-title { font-size: 18px; font-weight: 700; margin: 30px 0 15px 0; display: flex; align-items: center; gap: 8px; }
  
  .vuln-item {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 15px;
    padding: 18px;
    transition: transform 0.2s, border-color 0.2s;
  }
  .vuln-item:hover { border-color: #64748b; }
  .vuln-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 15px; flex-wrap: wrap; margin-bottom: 10px; }
  .vuln-title { font-size: 16px; font-weight: 700; color: #fff; }
  .vuln-desc { font-size: 14px; color: #cbd5e1; margin-bottom: 12px; }
  .vuln-remed {
    background: rgba(15, 23, 42, 0.8);
    border-left: 3px solid var(--accent);
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    font-size: 13px;
    color: #cbd5e1;
  }
  .vuln-meta { display: flex; gap: 10px; font-size: 12px; color: var(--text-secondary); margin-top: 8px; }

  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
  th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid var(--border); }
  th { background: rgba(15, 23, 42, 0.7); color: var(--text-secondary); font-weight: 600; }
  tr:hover td { background: rgba(255, 255, 255, 0.02); }
  code { background: #0f172a; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #38bdf8; }

  footer {
    text-align: center;
    font-size: 12px;
    color: var(--text-secondary);
    margin-top: 50px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }
</style>
</head>
<body>
<div class="container">
  <header>
    <div class="title-area">
      <h1>🛡️ Mobile Security Audit Report</h1>
      <p>Target: <strong>{{TARGET_NAME}}</strong> &bull; Generated: {{TIMESTAMP}}</p>
    </div>
    <div>
      <span class="badge-tag" style="background:#8b5cf620; color:#a78bfa; border:1px solid #8b5cf6;">android-lab verified</span>
    </div>
  </header>

  <div class="grid-overview">
    <div class="card card-score">
      <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">Security Score</div>
      <div class="score-number" style="color: {{SCORE_COLOR}};">{{SCORE}}</div>
      <div class="score-grade" style="background: {{SCORE_COLOR}}20; color: {{SCORE_COLOR}}; border: 1px solid {{SCORE_COLOR}};">Grade: {{GRADE}}</div>
      <div style="font-size: 12px; color: var(--text-secondary);">Calculated from {{TOTAL_VULNS}} findings</div>
    </div>

    <div class="card">
      <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 12px;">Findings Breakdown</div>
      <div class="stat-grid">
        <div class="stat-item sev-critical">
          <div class="label">Critical</div>
          <div class="val">{{CRITICAL_COUNT}}</div>
        </div>
        <div class="stat-item sev-high">
          <div class="label">High</div>
          <div class="val">{{HIGH_COUNT}}</div>
        </div>
        <div class="stat-item sev-medium">
          <div class="label">Medium</div>
          <div class="val">{{MEDIUM_COUNT}}</div>
        </div>
        <div class="stat-item sev-low">
          <div class="label">Low / Info</div>
          <div class="val">{{LOW_COUNT}}</div>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 12px;">Application Profile</div>
      <div style="font-size: 13px; display: flex; flex-direction: column; gap: 8px;">
        <div>Package: <code>{{PACKAGE_NAME}}</code></div>
        <div>APK Size: <strong>{{FILE_SIZE_MB}} MB</strong></div>
        <div>Permissions: <strong>{{TOTAL_PERMISSIONS}} declared</strong></div>
        <div>Components: <strong>{{TOTAL_ACTIVITIES}} Activities, {{TOTAL_SERVICES}} Services</strong></div>
        <div>Network Config: <strong>{{NET_CONFIG}}</strong></div>
      </div>
    </div>
  </div>

  <div class="section-title">🚨 Vulnerability & Risk Findings ({{TOTAL_VULNS}})</div>
  {{VULNERABILITIES_HTML}}

  <div class="section-title">🔑 Hardcoded Secrets & Credentials ({{SECRETS_COUNT}})</div>
  <div class="card" style="padding: 0; overflow-x: auto;">
    {{SECRETS_TABLE}}
  </div>

  <div class="section-title">📜 Declared Permissions ({{TOTAL_PERMISSIONS}})</div>
  <div class="card" style="padding: 15px;">
    {{PERMISSIONS_LIST}}
  </div>

  <footer>
    Generated by android-lab Agentic Mobile Security Lab &bull; OWASP Mobile Security Standard v2.0
  </footer>
</div>
</body>
</html>
"""


def generate_reports(analysis_data: dict, out_dir: str):
    os.makedirs(out_dir, exist_ok=True)
    m = analysis_data.get("metrics", {})
    pkg = analysis_data.get("package_info", {})
    surface = analysis_data.get("attack_surface", {})
    vulns = analysis_data.get("vulnerabilities", [])
    secrets = analysis_data.get("secrets", [])

    score = m.get("security_score", 100)
    grade = m.get("grade", "A")
    score_color = "#10b981" if score >= 80 else ("#f97316" if score >= 60 else "#ef4444")

    # 1. Build Vulnerabilities HTML
    vulns_html = []
    if not vulns:
        vulns_html.append('<div class="card" style="text-align:center; color: var(--success); font-weight:600; padding:30px;">✅ No security vulnerabilities detected in target application!</div>')
    else:
        for v in vulns:
            sev = v.get("severity", "MEDIUM")
            badge_class = f"badge-{sev.lower()}"
            remed = v.get("remediation", "Follow OWASP Mobile Security verification standards.")
            detected_in = f'<span>File: <code>{v.get("detected_in")}</code></span>' if v.get("detected_in") else ''
            owasp_tag = f'<span>OWASP: <strong>{v.get("owasp", "M8")}</strong></span>' if v.get("owasp") else ''

            vulns_html.append(f"""
            <div class="vuln-item">
              <div class="vuln-header">
                <div class="vuln-title">{v.get('title', 'Security Finding')}</div>
                <span class="badge-tag {badge_class}">{sev}</span>
              </div>
              <div class="vuln-desc">{v.get('desc', '')}</div>
              <div class="vuln-remed"><strong>Remediation:</strong> {remed}</div>
              <div class="vuln-meta">{owasp_tag} {detected_in}</div>
            </div>
            """)

    # 2. Build Secrets Table
    if not secrets:
        secrets_table = '<div style="padding:20px; color:var(--text-secondary); text-align:center;">No hardcoded secrets or credentials detected.</div>'
    else:
        rows = []
        for s in secrets[:100]:
            rows.append(f"""
            <tr>
              <td><strong>{s.get('rule')}</strong></td>
              <td><span class="badge-tag badge-{s.get('severity', 'low').lower()}">{s.get('severity')}</span></td>
              <td><code>{s.get('file')}:{s.get('line')}</code></td>
              <td><code>{s.get('preview')}</code></td>
            </tr>
            """)
        secrets_table = f"""
        <table>
          <thead>
            <tr><th>Rule</th><th>Severity</th><th>Location</th><th>Value Preview</th></tr>
          </thead>
          <tbody>
            {''.join(rows)}
          </tbody>
        </table>
        """

    # 3. Permissions List
    perms = pkg.get("permissions", [])
    if perms:
        perm_spans = [f'<code style="margin: 3px; display: inline-block;">{p}</code>' for p in perms]
        perm_list_html = " ".join(perm_spans)
    else:
        perm_list_html = "No permissions found in manifest."

    # 4. Render HTML Report
    html_content = HTML_TEMPLATE
    replacements = {
        "{{TARGET_NAME}}": analysis_data.get("target_file", "Application"),
        "{{TIMESTAMP}}": analysis_data.get("analysis_timestamp", datetime.now().isoformat()),
        "{{SCORE}}": str(score),
        "{{SCORE_COLOR}}": score_color,
        "{{GRADE}}": grade,
        "{{TOTAL_VULNS}}": str(m.get("total_vulnerabilities", len(vulns))),
        "{{CRITICAL_COUNT}}": str(m.get("critical_count", 0)),
        "{{HIGH_COUNT}}": str(m.get("high_count", 0)),
        "{{MEDIUM_COUNT}}": str(m.get("medium_count", 0)),
        "{{LOW_COUNT}}": str(m.get("low_count", 0) + m.get("info_count", 0)),
        "{{PACKAGE_NAME}}": pkg.get("package_name", "unknown"),
        "{{FILE_SIZE_MB}}": str(analysis_data.get("file_size_mb", 0)),
        "{{TOTAL_PERMISSIONS}}": str(surface.get("total_permissions", len(perms))),
        "{{TOTAL_ACTIVITIES}}": str(surface.get("total_activities", 0)),
        "{{TOTAL_SERVICES}}": str(surface.get("total_services", 0)),
        "{{NET_CONFIG}}": "Configured" if surface.get("network_security_config") else "Default (None)",
        "{{VULNERABILITIES_HTML}}": "\n".join(vulns_html),
        "{{SECRETS_COUNT}}": str(len(secrets)),
        "{{SECRETS_TABLE}}": secrets_table,
        "{{PERMISSIONS_LIST}}": perm_list_html,
    }

    for k, v in replacements.items():
        html_content = html_content.replace(k, v)

    html_file = os.path.join(out_dir, "security-report.html")
    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)

    # 5. Render Markdown Report
    md_file = os.path.join(out_dir, "security-report.md")
    with open(md_file, "w", encoding="utf-8") as f:
        f.write(f"# 🛡️ Mobile Security Audit Report: {analysis_data.get('target_file')}\n\n")
        f.write(f"- **Package Name:** `{pkg.get('package_name')}`\n")
        f.write(f"- **Security Score:** **{score}/100** (Grade: **{grade}**)\n")
        f.write(f"- **Total Findings:** **{m.get('total_vulnerabilities', len(vulns))}**\n")
        f.write(f"- **Audit Date:** {analysis_data.get('analysis_timestamp')}\n\n")

        f.write("## 📊 Severity Metrics\n\n")
        f.write(f"| Severity | Count |\n|---|---|\n")
        f.write(f"| 🚨 Critical | **{m.get('critical_count', 0)}** |\n")
        f.write(f"| ⚠️ High | **{m.get('high_count', 0)}** |\n")
        f.write(f"| ⚡ Medium | **{m.get('medium_count', 0)}** |\n")
        f.write(f"| ℹ️ Low / Info | **{m.get('low_count', 0)}** |\n\n")

        if vulns:
            f.write("## 🚨 Security Findings\n\n")
            for v in vulns:
                f.write(f"### [{v.get('severity')}] {v.get('title')}\n")
                f.write(f"- **OWASP Category:** `{v.get('owasp', 'M8')}`\n")
                f.write(f"- **Description:** {v.get('desc')}\n")
                f.write(f"- **Remediation:** {v.get('remediation')}\n\n")

        if secrets:
            f.write(f"## 🔑 Detected Secrets ({len(secrets)})\n\n")
            f.write("| Rule | Severity | Location | Preview |\n|---|---|---|---|\n")
            for s in secrets[:50]:
                f.write(f"| {s.get('rule')} | {s.get('severity')} | `{s.get('file')}:{s.get('line')}` | `{s.get('preview')}` |\n")

    # 6. Save Unified JSON
    json_file = os.path.join(out_dir, "security-report.json")
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(analysis_data, f, indent=2)

    return {
        "html": html_file,
        "md": md_file,
        "json": json_file
    }


def main():
    parser = argparse.ArgumentParser(description="Master Mobile Security Report Generator")
    parser.add_argument("input", help="Path to APK file OR pre-existing app-analysis.json")
    parser.add_argument("-o", "--out", help="Output directory for generated reports")
    args = parser.parse_args()

    out_dir = args.out or os.path.join("artifacts", "security-report")

    if args.input.endswith(".json") and os.path.isfile(args.input):
        print(f"[*] Loading analysis data from JSON: {args.input}")
        with open(args.input, "r", encoding="utf-8") as f:
            data = json.load(f)
    elif args.input.endswith(".apk") and os.path.isfile(args.input):
        print(f"[*] Running full app analysis on APK: {args.input}")
        from app_analyzer import analyze_app
        data = analyze_app(args.input, out_dir)
    else:
        print(f"Error: Input must be a valid .apk or app-analysis.json file: {args.input}")
        sys.exit(1)

    print("=== 📄 Generating Multi-Format Security Reports ===")
    reports = generate_reports(data, out_dir)

    print("\nReports Generated Successfully:")
    print(f"  🌐 Interactive HTML : {reports['html']}")
    print(f"  📝 Markdown Summary : {reports['md']}")
    print(f"  💾 CI/CD JSON Data  : {reports['json']}")


if __name__ == "__main__":
    main()
