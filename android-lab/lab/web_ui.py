#!/usr/bin/env python3
"""
Interactive Mobile Security Lab Web Console & Terminal (android-lab)
Implements the 6 UI phases from knowledge/segmentation.md:
Phase 1: Lab Entry & Health Overview
Phase 2: Code & Target Providers (APK upload / ADB Bridge)
Phase 3: Workflows (WF1 Static, WF2 Dynamic, Fuzzing, Secrets, Patching)
Phase 4: Real-Time Execution Console & Telemetry Stream
Phase 5: Segmented Analytics & Interactive Reports Viewer
Phase 6: Component Sitemap & Attack Surface Explorer

The page itself lives in web/ (index.html, app.css, app.js) and follows the qLar
app-shell design: a grouped, collapsible sidebar, Spotlight search (Ctrl/Cmd+K),
a sticky top bar and the Android Lab accent. It needs no build step and no network.
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
CURRENT_PROC = None


def execute_background_command(cmd_args: list[str], title: str):
    global COMMAND_RUNNING, CONSOLE_LOGS, CURRENT_PROC
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
        CURRENT_PROC = proc
        for line in proc.stdout:
            CONSOLE_LOGS.append(line.rstrip())
            if len(CONSOLE_LOGS) > 1000:
                CONSOLE_LOGS.pop(0)
        proc.wait()
        CONSOLE_LOGS.append(f"[+] Task finished with exit code {proc.returncode}\n")
    except Exception as e:
        CONSOLE_LOGS.append(f"[!] Error: {str(e)}\n")
    finally:
        CURRENT_PROC = None
        COMMAND_RUNNING = False


WEB_DIR = os.path.join(SCRIPT_DIR, "web")
# The console's static files; only these are served, so nothing else under web/ leaks
STATIC_FILES = {
    "/static/app.css": ("app.css", "text/css; charset=utf-8"),
    "/static/app.js": ("app.js", "text/javascript; charset=utf-8"),
}


def read_web_file(name: str) -> bytes:
    with open(os.path.join(WEB_DIR, name), "rb") as f:
        return f.read()


class LabHttpHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        url_parts = urllib.parse.urlparse(self.path)
        path = url_parts.path

        if path == "/" or path == "/index.html":
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(read_web_file("index.html"))

        elif path in STATIC_FILES:
            name, content_type = STATIC_FILES[path]
            self.send_response(200)
            self.send_header("Content-Type", content_type)
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(read_web_file(name))

        elif path == "/api/health" or path == "/healthz":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok", "app": "android-lab", "version": "1.0.0"}).encode("utf-8"))

        elif path == "/api/logs":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"logs": CONSOLE_LOGS, "running": COMMAND_RUNNING}).encode("utf-8"))

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
            rel_file = urllib.parse.unquote(path[len("/artifacts/"):])
            root = os.path.realpath(ARTIFACTS_DIR)
            target_file = os.path.realpath(os.path.join(root, rel_file))
            # Serve only files inside artifacts/ (no ../ or symlink escapes)
            inside = os.path.commonpath([root, target_file]) == root
            if inside and os.path.isfile(target_file):
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

    def _json(self, status: int, payload: dict):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload).encode("utf-8"))

    def do_POST(self):
        if self.path == "/api/logs/clear":
            self.rfile.read(int(self.headers.get("Content-Length", 0)))
            CONSOLE_LOGS.clear()
            self._json(200, {"status": "cleared"})

        elif self.path == "/api/stop":
            self.rfile.read(int(self.headers.get("Content-Length", 0)))
            proc = CURRENT_PROC
            if proc is None or proc.poll() is not None:
                self._json(409, {"error": "No job is running"})
                return
            proc.terminate()
            CONSOLE_LOGS.append("[!] Stop requested from the web console")
            self._json(200, {"status": "stopping"})

        elif self.path == "/api/run":
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
            if filename in ("", ".", ".."):
                filename = "uploaded_app.apk"
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
    print(f"=== 🛡️ android-lab Interactive Web Console Running ===")
    print(f"URL: http://127.0.0.1:{port}")
    print("Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nWeb console stopped.")


if __name__ == "__main__":
    main()
