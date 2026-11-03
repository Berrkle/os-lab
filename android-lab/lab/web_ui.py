#!/usr/bin/env python3
"""
Interactive Mobile Security Lab Web Console & Terminal (apk-lab)
Implements the 6 UI phases from knowledge/segmentation.md:
Phase 1: Lab Entry & Health Overview
Phase 2: Code & Target Providers (APK upload / ADB Bridge)
Phase 3: Workflows (WF1 Static, WF2 Dynamic, Fuzzing, Secrets, Patching)
Phase 4: Real-Time Execution Console & Telemetry Stream
Phase 5: Segmented Analytics & Interactive Reports Viewer
Phase 6: Component Sitemap & Attack Surface Explorer
"""

import sys
import os
import json
import subprocess
import shutil
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACTS_DIR = os.path.join(SCRIPT_DIR, "artifacts")
SCRIPTS_DIR = os.path.join(SCRIPT_DIR, "scripts")

CONSOLE_LOGS = []
COMMAND_RUNNING = False


def execute_background_command(cmd_args: list[str], title: str):
    global COMMAND_RUNNING, CONSOLE_LOGS
    COMMAND_RUNNING = True
    CONSOLE_LOGS.append(f"\n[+] === Executing: {title} ===")
    try:
        proc = subprocess.Popen(
            cmd_args,
            cwd=SCRIPT_DIR,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            encoding="utf-8",
            errors="replace"
        )
        for line in proc.stdout:
            CONSOLE_LOGS.append(line.rstrip())
            if len(CONSOLE_LOGS) > 1000:
                CONSOLE_LOGS.pop(0)
        proc.wait()
        CONSOLE_LOGS.append(f"[+] Task finished with exit code {proc.returncode}\n")
    except Exception as e:
        CONSOLE_LOGS.append(f"[!] Error: {str(e)}\n")
    finally:
        COMMAND_RUNNING = False


HTML_DASHBOARD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>apk-lab — Agentic Mobile Security Console</title>
<style>
  :root {
    --bg-base: #090d16;
    --bg-surface: #111827;
    --bg-card: #1f293d;
    --border: #2e3b52;
    --text-main: #f1f5f9;
    --text-muted: #94a3b8;
    --accent: #6366f1;
    --accent-glow: rgba(99, 102, 241, 0.25);
    --cyan: #06b6d4;
    --emerald: #10b981;
    --rose: #f43f5e;
    --amber: #f59e0b;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg-base);
    color: var(--text-main);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    display: flex;
    height: 100vh;
    overflow: hidden;
  }
  /* Sidebar */
  aside {
    width: 260px;
    background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 24px 16px;
    flex-shrink: 0;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 18px;
    font-weight: 800;
    color: #fff;
    margin-bottom: 30px;
    letter-spacing: -0.5px;
  }
  .brand-logo {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: linear-gradient(135deg, var(--accent), var(--cyan));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 15px var(--accent-glow);
  }
  .nav-group-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--text-muted);
    letter-spacing: 1px;
    margin: 16px 8px 8px;
  }
  .nav-btn {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-muted);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: all 0.2s;
  }
  .nav-btn:hover { background: rgba(255, 255, 255, 0.05); color: #fff; }
  .nav-btn.active { background: var(--accent-glow); color: #818cf8; border: 1px solid var(--accent); }
  
  /* Main Content Area */
  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    background: radial-gradient(circle at 80% 10%, rgba(99, 102, 241, 0.08), transparent 40%);
  }
  header {
    height: 70px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    background: rgba(17, 24, 39, 0.7);
    backdrop-filter: blur(12px);
    position: sticky;
    top: 0;
    z-index: 10;
  }
  .page-title { font-size: 20px; font-weight: 700; }
  .badge-status {
    padding: 5px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dot { width: 8px; height: 8px; border-radius: 50%; }

  .content-body { padding: 32px; flex: 1; }
  .tab-pane { display: none; }
  .tab-pane.active { display: block; }

  /* Dashboard Cards */
  .grid-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    margin-bottom: 28px;
  }
  .card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  }
  .card h3 { font-size: 15px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; margin-bottom: 12px; }
  .card-value { font-size: 28px; font-weight: 800; color: #fff; margin-bottom: 6px; }

  /* Buttons & Actions */
  .btn {
    padding: 10px 18px;
    border-radius: 8px;
    border: none;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #4f46e5; box-shadow: 0 0 15px var(--accent-glow); }
  .btn-secondary { background: rgba(255,255,255,0.08); color: #fff; border: 1px solid var(--border); }
  .btn-secondary:hover { background: rgba(255,255,255,0.14); }
  .btn-danger { background: rgba(244, 63, 94, 0.2); color: var(--rose); border: 1px solid var(--rose); }

  /* Terminal Console */
  .terminal-box {
    background: #050811;
    border: 1px solid var(--border);
    border-radius: 10px;
    height: 480px;
    padding: 16px;
    font-family: "SF Mono", Consolas, Monaco, monospace;
    font-size: 13px;
    line-height: 1.5;
    color: #38bdf8;
    overflow-y: auto;
    white-space: pre-wrap;
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.5);
  }
  
  input[type="text"] {
    width: 100%;
    padding: 10px 14px;
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.8);
    border: 1px solid var(--border);
    color: #fff;
    font-size: 14px;
    margin-bottom: 12px;
  }
</style>
</head>
<body>

<aside>
  <div class="brand">
    <div class="brand-logo">🛡️</div>
    <span>apk-lab</span>
  </div>

  <div class="nav-group-title">Navigation</div>
  <button id="nav-overview" class="nav-btn active" onclick="switchTab('overview')">📊 Overview</button>
  <button id="nav-providers" class="nav-btn" onclick="switchTab('providers')">📱 Target Providers</button>
  <button id="nav-workflows" class="nav-btn" onclick="switchTab('workflows')">⚡ Workflows</button>
  <button id="nav-console" class="nav-btn" onclick="switchTab('console')">💻 Live Console</button>
  <button id="nav-reports" class="nav-btn" onclick="switchTab('reports')">📑 Security Reports</button>
  <button id="nav-sitemap" class="nav-btn" onclick="switchTab('sitemap')">🗺️ Attack Surface</button>
</aside>

<main>
  <header>
    <div class="page-title" id="page-title-text">Dashboard Overview</div>
    <div id="status-badge" class="badge-status" style="background: rgba(16, 185, 129, 0.15); color: var(--emerald); border: 1px solid var(--emerald);">
      <div class="dot" style="background: var(--emerald);"></div>
      <span>Lab Engine Ready</span>
    </div>
  </header>

  <div class="content-body">
    <!-- Tab 1: Overview -->
    <div id="tab-overview" class="tab-pane active">
      <div class="grid-cards">
        <div class="card">
          <h3>Lab Runtime Mode</h3>
          <div class="card-value" style="color: #818cf8;">Zero-Admin</div>
          <p style="font-size:13px; color:var(--text-muted);">Running under user privileges on Windows 11</p>
        </div>
        <div class="card">
          <h3>Hypervisor Layer</h3>
          <div class="card-value" style="color: var(--cyan);">VirtualBox 7.2</div>
          <p style="font-size:13px; color:var(--text-muted);">Headless VM & Native Userland</p>
        </div>
        <div class="card">
          <h3>Active Toolchains</h3>
          <div class="card-value" style="color: var(--emerald);">8 Modules</div>
          <p style="font-size:13px; color:var(--text-muted);">Frida &bull; mitmproxy &bull; JADX &bull; Fuzzer &bull; Analyzer</p>
        </div>
      </div>

      <!-- Direct APK Upload Dropzone -->
      <div class="card" id="drop-zone" style="margin-bottom: 20px; border: 2px dashed var(--accent); background: rgba(99, 102, 241, 0.05); text-align: center; padding: 24px 20px; cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('apk-file-picker').click()">
        <input type="file" id="apk-file-picker" accept=".apk" style="display: none;" onchange="handleFileSelect(this.files)">
        <div style="font-size: 32px; margin-bottom: 8px;">📦</div>
        <h3 style="margin-bottom: 6px;">Drop APK File Here or Click to Upload</h3>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px;">Stage native APK package for zero-admin automated scanning</p>
        <div id="upload-status" style="font-size: 13px; font-weight: 600; color: var(--cyan); display: none;"></div>
      </div>

      <div class="card">
        <h3>Quick Pipeline Launch</h3>
        <p style="color:var(--text-muted); margin-bottom: 16px;">Trigger instant security workflows on target APK:</p>
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button id="btn-quick-preflight" class="btn btn-secondary" onclick="runCommand('preflight')">🔍 Pre-Flight Check</button>
          <button id="btn-quick-sample" class="btn btn-primary" onclick="runCommand('create-sample')">📦 Generate Sample APK</button>
          <button id="btn-quick-wf1" class="btn btn-primary" onclick="runCommand('wf1')">🛡️ Run WF1 Static Audit</button>
          <button id="btn-quick-secrets" class="btn btn-secondary" onclick="runCommand('scan-secrets')">🔑 Scan Secrets</button>
        </div>
      </div>
    </div>

    <!-- Tab 2: Providers -->
    <div id="tab-providers" class="tab-pane">
      <div class="card" style="margin-bottom: 20px;">
        <h3>Connected Target Devices (ADB)</h3>
        <div id="adb-devices-box" style="font-family:monospace; font-size:13px; color:var(--cyan); margin: 12px 0;">Probing ADB bridge...</div>
        <button id="btn-refresh-adb" class="btn btn-secondary" onclick="refreshDevices()">🔄 Refresh Devices</button>
      </div>
      <div class="card">
        <h3>APK File Path</h3>
        <input type="text" id="target-apk-input" value="scripts/vulnerable-test.apk" placeholder="Path to APK (e.g. apks/app.apk)">
        <p style="font-size: 12px; color: var(--text-muted);">Set default APK file path used by Workflows.</p>
      </div>
    </div>

    <!-- Tab 3: Workflows -->
    <div id="tab-workflows" class="tab-pane">
      <div class="grid-cards">
        <div class="card">
          <h3>WF1: Static Pipeline</h3>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px;">Decompiles sources, audits manifest, evaluates OWASP vulnerabilities, and renders HTML report.</p>
          <button id="btn-wf1" class="btn btn-primary" onclick="runCommand('wf1')">Execute WF1</button>
        </div>
        <div class="card">
          <h3>Component IPC Fuzzer</h3>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px;">Probes exported Activities and Content Providers with boundary payloads and SQLi probes.</p>
          <button id="btn-fuzz" class="btn btn-secondary" onclick="runCommand('fuzz')">Launch Fuzzer</button>
        </div>
        <div class="card">
          <h3>APK Security Patcher</h3>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px;">Injects permissive networkSecurityConfig and Frida Gadget for non-root testing.</p>
          <button id="btn-patch" class="btn btn-secondary" onclick="runCommand('patch')">Patch Target APK</button>
        </div>
        <div class="card">
          <h3>Agentic Security Engine</h3>
          <p style="font-size:13px; color:var(--text-muted); margin-bottom:15px;">Synthesizes prioritized attack hypotheses and generates tailored Frida hooks.</p>
          <button id="btn-agentic" class="btn btn-primary" onclick="runCommand('agentic')">Generate Playbook</button>
        </div>
      </div>
    </div>

    <!-- Tab 4: Live Console -->
    <div id="tab-console" class="tab-pane">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 12px;">
        <h3>Real-Time Execution Console & Alerts</h3>
        <button id="btn-clear-console" class="btn btn-secondary" onclick="clearConsole()">Clear Console</button>
      </div>
      <div id="terminal-screen" class="terminal-box">Waiting for commands...</div>
    </div>

    <!-- Tab 5: Reports -->
    <div id="tab-reports" class="tab-pane">
      <div class="card">
        <h3>Generated Security Reports</h3>
        <p style="color:var(--text-muted); margin-bottom: 14px;">View latest generated HTML5 Security Audit dashboards:</p>
        <div id="reports-list">Scanning artifacts/ for reports...</div>
      </div>
    </div>

    <!-- Tab 6: Attack Surface -->
    <div id="tab-sitemap" class="tab-pane">
      <div class="card">
        <h3>Attack Surface & Sitemap</h3>
        <p style="color:var(--text-muted); margin-bottom: 12px;">Interactive decomposition of application endpoints and components.</p>
        <button id="btn-analyze-surface" class="btn btn-primary" onclick="runCommand('analyze')">Extract Attack Surface</button>
      </div>
    </div>
  </div>
</main>

<script>
  function switchTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById('tab-' + tabId).classList.add('active');
    document.getElementById('nav-' + tabId).classList.add('active');
    
    const titles = {
      'overview': 'Dashboard Overview',
      'providers': 'Target & Device Providers',
      'workflows': 'Automated Security Workflows',
      'console': 'Live Real-Time Console',
      'reports': 'Security Audit Reports',
      'sitemap': 'Attack Surface & Component Sitemap'
    };
    document.getElementById('page-title-text').innerText = titles[tabId] || 'Console';
    
    if (tabId === 'reports') loadReports();
    if (tabId === 'providers') refreshDevices();
  }

  function runCommand(action) {
    switchTab('console');
    const apk = document.getElementById('target-apk-input').value || 'scripts/vulnerable-test.apk';
    fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: action, apk: apk })
    });
  }

  function clearConsole() {
    document.getElementById('terminal-screen').innerText = '';
  }

  function pollConsole() {
    fetch('/api/logs')
      .then(res => res.json())
      .then(data => {
        const term = document.getElementById('terminal-screen');
        term.innerText = data.logs.join('\\n');
        term.scrollTop = term.scrollHeight;
      })
      .catch(() => {});
  }
  setInterval(pollConsole, 1000);

  function refreshDevices() {
    fetch('/api/devices')
      .then(res => res.json())
      .then(data => {
        document.getElementById('adb-devices-box').innerText = data.devices || 'No devices connected.';
      });
  }

  function loadReports() {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        const container = document.getElementById('reports-list');
        if (!data.reports || data.reports.length === 0) {
          container.innerHTML = '<p style="color:var(--text-muted);">No reports generated yet. Run WF1 first.</p>';
          return;
        }
        let html = '<ul style="list-style:none; display:flex; flex-direction:column; gap:8px;">';
        data.reports.forEach(r => {
          html += `<li><a href="${r.url}" target="_blank" style="color:#818cf8; text-decoration:none; font-weight:600;">🌐 Open: ${r.name}</a></li>`;
        });
        html += '</ul>';
        container.innerHTML = html;
      });
  }

  // Drag and Drop APK Upload Handlers
  window.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
      dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--cyan)';
        dropZone.style.background = 'rgba(6, 182, 212, 0.12)';
      });
      dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent)';
        dropZone.style.background = 'rgba(99, 102, 241, 0.05)';
      });
      dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent)';
        dropZone.style.background = 'rgba(99, 102, 241, 0.05)';
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          handleFileSelect(e.dataTransfer.files);
        }
      });
    }
  });

  function handleFileSelect(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const statusEl = document.getElementById('upload-status');
    statusEl.style.display = 'block';
    statusEl.innerText = `⏳ Uploading ${file.name} (${Math.round(file.size / 1024)} KB)...`;

    const formData = new FormData();
    formData.append('apk', file);
    fetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'success') {
        statusEl.innerHTML = `✅ Staged <strong>${data.filename}</strong> (${Math.round(data.size / 1024)} KB) into <code>${data.path}</code>`;
        const apkInput = document.getElementById('target-apk-input');
        if (apkInput) apkInput.value = data.path;
      } else {
        statusEl.innerText = `❌ Upload failed: ${data.error || 'Unknown error'}`;
      }
    })
    .catch(err => {
      statusEl.innerText = `❌ Upload error: ${err}`;
    });
  }
</script>
</body>
</html>
"""


class LabHttpHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path

        if path == "/" or path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write(HTML_DASHBOARD.encode("utf-8"))

        elif path == "/api/health" or path == "/healthz":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "app": "apk-lab", "version": "1.0.0"}).encode("utf-8"))

        elif path == "/api/logs":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"logs": CONSOLE_LOGS}).encode("utf-8"))

        elif path == "/api/devices":
            try:
                adb_out = subprocess.check_output(["adb", "devices"], text=True, stderr=subprocess.DEVNULL)
            except Exception:
                adb_out = "ADB not found or no device connected."
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"devices": adb_out}).encode("utf-8"))

        elif path == "/api/reports":
            reports = []
            if os.path.exists(ARTIFACTS_DIR):
                for root, _, files in os.walk(ARTIFACTS_DIR):
                    for f in files:
                        if f.endswith(".html"):
                            rel_path = os.path.relpath(os.path.join(root, f), ARTIFACTS_DIR)
                            reports.append({
                                "name": rel_path,
                                "url": f"/artifacts/{rel_path.replace(os.sep, '/')}"
                            })
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"reports": reports}).encode("utf-8"))

        elif path.startswith("/artifacts/"):
            rel_file = path.replace("/artifacts/", "")
            target_file = os.path.join(ARTIFACTS_DIR, rel_file)
            if os.path.exists(target_file) and os.path.isfile(target_file):
                self.send_response(200)
                if target_file.endswith(".html"):
                    self.send_header("Content-Type", "text/html; charset=utf-8")
                else:
                    self.send_header("Content-Type", "application/octet-stream")
                self.end_headers()
                with open(target_file, "rb") as f:
                    self.wfile.write(f.read())
            else:
                self.send_response(404)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/api/run":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            data = json.loads(body.decode("utf-8"))
            action = data.get("action")
            apk = data.get("apk", os.path.join("scripts", "vulnerable-test.apk"))

            cmd = []
            title = action
            if action == "preflight":
                cmd = [sys.executable, os.path.join(SCRIPT_DIR, "orchestrator.py"), "preflight"]
                title = "Pre-flight Verification"
            elif action == "create-sample":
                cmd = [sys.executable, os.path.join(SCRIPTS_DIR, "create_sample_apk.py")]
                title = "Generate Test Sample APK"
            elif action == "wf1":
                cmd = [sys.executable, os.path.join(SCRIPT_DIR, "orchestrator.py"), "wf1", "--apk", apk]
                title = f"WF1 Static Pipeline on {apk}"
            elif action == "scan-secrets":
                cmd = [sys.executable, os.path.join(SCRIPTS_DIR, "secret_scanner.py"), apk]
                title = f"Secret Scanner on {apk}"
            elif action == "fuzz":
                cmd = [sys.executable, os.path.join(SCRIPTS_DIR, "ipc_fuzzer.py"), "-p", "com.testlab.vulnerable"]
                title = "IPC Component Fuzzer"
            elif action == "patch":
                cmd = [sys.executable, os.path.join(SCRIPTS_DIR, "apk_patcher.py"), apk]
                title = f"Patch APK {apk}"
            elif action == "agentic":
                cmd = [sys.executable, os.path.join(SCRIPTS_DIR, "agentic_engine.py"), apk]
                title = f"Agentic Playbook on {apk}"
            elif action == "analyze":
                cmd = [sys.executable, os.path.join(SCRIPTS_DIR, "app_analyzer.py"), apk]
                title = f"App Analyzer on {apk}"

            if cmd:
                t = threading.Thread(target=execute_background_command, args=(cmd, title))
                t.daemon = True
                t.start()

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "started", "title": title}).encode("utf-8"))

        elif self.path == "/api/upload":
            content_type = self.headers.get("Content-Type", "")
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)

            filename = "uploaded_app.apk"
            file_data = b""

            if "multipart/form-data" in content_type and "boundary=" in content_type:
                boundary = content_type.split("boundary=")[-1].strip()
                if boundary.startswith('"') and boundary.endswith('"'):
                    boundary = boundary[1:-1]
                parts = body.split(f"--{boundary}".encode("utf-8"))
                for part in parts:
                    if b'filename="' in part:
                        import re
                        m = re.search(rb'filename="([^"]+)"', part)
                        if m:
                            filename = os.path.basename(m.group(1).decode("utf-8", errors="ignore"))
                        header_and_body = part.split(b"\r\n\r\n", 1)
                        if len(header_and_body) > 1:
                            file_data = header_and_body[1].rstrip(b"\r\n--")
                        break
            else:
                filename = self.headers.get("X-Filename", "uploaded_app.apk")
                file_data = body

            if not file_data:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "No file uploaded or empty payload"}).encode("utf-8"))
                return

            apks_dir = os.path.join(SCRIPT_DIR, "apks")
            os.makedirs(apks_dir, exist_ok=True)
            save_path = os.path.join(apks_dir, filename)
            with open(save_path, "wb") as f:
                f.write(file_data)

            rel_path = os.path.relpath(save_path, SCRIPT_DIR).replace("\\", "/")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "filename": filename,
                "path": rel_path,
                "size": len(file_data)
            }).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5050
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, LabHttpHandler)
    print(f"=== 🛡️ apk-lab Interactive Web Console Running ===")
    print(f"URL: http://127.0.0.1:{port}")
    print("Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nWeb console stopped.")


if __name__ == "__main__":
    main()
