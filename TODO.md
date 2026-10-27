# 📋 apk-lab Project Roadmap & Task Tracking

> **Project Goal:** Zero-admin, cross-platform Android mobile security testing and reverse engineering lab supporting static analysis (WF1), dynamic analysis (WF2), Frida hooking, traffic interception, automated reporting, and lightweight userland virtualization.

---

## 🎯 Component Status & Gap Analysis

### 1. Host Orchestration & Virtualization (`lab.ps1`, `orchestrator.py`)
- [x] Preflight checks (Python, Java, ADB, VBox, Ports, Disk)
- [x] Host bootstrap (`.\lab.ps1 setup` for .venv, Frida, mitmproxy, JADX)
- [x] VirtualBox VM lifecycle (`vbox-create`, `vbox-start`, `vbox-stop`, `vbox-status`)
- [x] Automated Linux ISO downloader (`vbox-download-iso` for Alpine & Ubuntu)
- [x] Unattended guest OS installation (`vbox-autoinstall` for hands-free disk partitioning & Docker setup)
- [x] **Path resolution fix:** Auto-resolve relative paths (`-Apk`, `-Hook`, `-FlowFile`, `-Iso`) before changing directory to `lab\`
- [x] **MobSF CLI integration:** Added `mobsf-start`, `mobsf-scan`, `mobsf-status` to `lab.ps1` and standalone client `mobsf_client.py` for direct REST API triggering
- [x] **In-guest Android container launch:** Added `vbox-deploy-android` to boot VM, invoke container launch, and probe ADB on port 5555

### 2. Static Security Analysis (WF1)
- [x] AndroidManifest.xml parser & vulnerability rule-set
- [x] OWASP Mobile Top 10 rule engine (OWASP M1-M10)
- [x] Deep secret & credential scanner (AWS, Google API, Firebase, JWT, Private Keys)
- [x] Automated HTML5 dashboard, Markdown summary, and CI/CD JSON generation
- [x] **Real APK decompiler verification:** Built a pure Python DEX bytecode synthesizer (`build_dex.py`) and verified end-to-end JADX decompilation into Java source files
- [x] **Manifest intent-filter deep analyzer:** Detects unvalidated custom URL schemes (`DEEPLINK-CUSTOM-SCHEME`) and unprotected exported components (`INTENT-UNPROTECTED-EXPORT`)

### 3. Dynamic Security Analysis & Instrumentation (WF2)
- [x] ADB bridge and device lifecycle management
- [x] Network traffic interception pipeline (mitmproxy & flows parser)
- [x] Live logcat security filter (token leak & URL detection)
- [x] Device telemetry monitor (PSS memory, heap, open sockets, battery)
- [x] Application sandbox storage auditor (SharedPreferences XML, SQLite)
- [x] Component IPC fuzzer (exported Activities, Content Providers, Services)
- [x] Core Frida hooks:
  - [x] `root-detection-bypass.js`
  - [x] `ssl-pinning-bypass.js`
  - [x] `crypto-tracer.js`
  - [x] `webview-intent-tracer.js`
- [x] **Modern Frida hooks:**
  - [x] `flutter-ssl-bypass.js` (BoringSSL hook for Flutter apps)
  - [x] `biometrics-bypass.js` (BiometricPrompt / FingerprintManager auth bypass)
  - [x] `anti-frida-bypass.js` (ptrace, maps, and thread monitoring bypass)

### 4. Zero-Admin Binary Modification
- [x] Permissive networkSecurityConfig injector
- [x] Frida Gadget auto-injection for non-root testing (`apk_patcher.py`)
- [x] **Zipalign and debug signing:** Patched APKs are automatically zipaligned (4-byte alignment) and signed with self-signed Android v1 JAR signature scheme (`META-INF/MANIFEST.MF`, `CERT.SF`, `CERT.RSA`) for one-command installation

### 5. Interactive Web Console (`web_ui.py`)
- [x] Single-file zero-dependency web interface on `:5050`
- [x] Real-time command terminal stream
- [x] Artifacts explorer & report viewer
- [x] **Web UI health endpoint:** Added `/api/health` and `/healthz` for headless monitoring
- [x] **Direct APK drag-and-drop upload:** HTTP multipart upload endpoint (`/api/upload`) and interactive dropzone for scanning directly from the browser

### 6. Automated Testing & Verification
- [x] Unit & integration test suite (`lab/tests/` directory with `pytest`):
  - [x] `test_preflight.py` (Environment checks without crashing)
  - [x] `test_app_analyzer.py` (Manifest parsing, deep links, exported components, OWASP Top 10 rules, scoring)
  - [x] `test_secret_scanner.py` (Pattern matching & secret extraction)
  - [x] `test_app_reporter.py` (HTML, MD, and JSON generation)
  - [x] `test_apk_patcher.py` (Network security config injection, zipalign, and signature verification)
  - [x] `test_agentic_engine.py` (Attack hypothesis synthesis & Frida script generation)
  - [x] `test_mitm_flow_parser.py` (Traffic flow extraction & fallback parsing)
  - [x] `test_web_ui.py` (Dashboard, health, logs, reports, and APK upload endpoints)
  - [x] `test_mobsf_client.py` (MobSF REST API multipart upload, scan, report retrieval)
  - [x] `test_jadx_decompiler.py` (JADX decompilation on real synthesized DEX fixture)
- [x] Verify test suite execution in `.venv` (19/19 tests passing)
- [x] Update GitHub Actions workflow (`.github/workflows/mobile-sec-scan.yml`) to run pytest on push/PR

---

## 🧪 Verification Log
```text
============================= test session starts =============================
platform win32 -- Python 3.14.7, pytest-9.1.1, pluggy-1.7.0 -- C:\Users\keyvan.arasteh\Documents\apk-lab\lab\.venv\Scripts\python.exe
cachedir: .pytest_cache
rootdir: C:\Users\keyvan.arasteh\Documents\apk-lab
collecting ... collected 19 items

lab/tests/test_agentic_engine.py::test_agentic_engine_generates_hypotheses_and_playbook PASSED [  5%]
lab/tests/test_apk_patcher.py::test_apk_patcher_network_security_config PASSED [ 10%]
lab/tests/test_apk_patcher.py::test_zipalign_apk PASSED                  [ 15%]
lab/tests/test_app_analyzer.py::test_app_analyzer_finds_vulnerabilities PASSED [ 21%]
lab/tests/test_app_reporter.py::test_app_reporter_generates_all_formats PASSED [ 26%]
lab/tests/test_jadx_decompiler.py::test_jadx_decompiler_on_real_dex PASSED [ 31%]
lab/tests/test_mitm_flow_parser.py::test_mitm_flow_parser_fallback PASSED [ 36%]
lab/tests/test_mobsf_client.py::test_encode_multipart_formdata PASSED    [ 42%]
lab/tests/test_mobsf_client.py::test_check_status_offline PASSED         [ 47%]
lab/tests/test_mobsf_client.py::test_upload_apk_mocked PASSED            [ 52%]
lab/tests/test_mobsf_client.py::test_trigger_scan_mocked PASSED          [ 57%]
lab/tests/test_mobsf_client.py::test_download_json_report_mocked PASSED  [ 63%]
lab/tests/test_preflight.py::test_orchestrator_preflight_runs_without_crashing PASSED [ 68%]
lab/tests/test_secret_scanner.py::test_secret_patterns_detection PASSED  [ 73%]
lab/tests/test_secret_scanner.py::test_secret_scanner_on_apk PASSED      [ 78%]
lab/tests/test_web_ui.py::test_web_ui_health_endpoint PASSED             [ 84%]
lab/tests/test_web_ui.py::test_web_ui_dashboard_page PASSED              [ 89%]
lab/tests/test_web_ui.py::test_web_ui_logs_and_reports_endpoints PASSED  [ 94%]
lab/tests/test_web_ui.py::test_web_ui_upload_endpoint PASSED             [100%]

============================= 19 passed in 7.45s ==============================
```
