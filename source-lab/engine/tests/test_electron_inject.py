"""Offline tests for PENT-10 - source_lab.electron.inject_map.

Every fixture is synthesized in pytest's tmp_path. No real application is used,
nothing is executed and nothing is contacted. The asar fixtures are built with
the real Chromium pickle layout (the same helper shape as
``test_sourcemap_asar``), so no external tooling touches disk.
"""

from __future__ import annotations

import json
import struct

import pytest

import os

from source_lab.electron.inject_map import (
    analyze_app,
    format_report,
    has_failing,
    should_fail,
    main,
    _clean,
)


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #

def build_asar(files: dict) -> bytes:
    """Serialize {member path: bytes} into packed asar bytes."""
    def node_for(path):
        node = header["files"]
        parts = path.split("/")
        for part in parts[:-1]:
            node = node.setdefault(part, {}).setdefault("files", {})
        return node, parts[-1]

    header: dict = {"files": {}}
    offset = 0
    for path in sorted(files):
        node, leaf = node_for(path)
        node[leaf] = {"size": len(files[path]), "offset": str(offset)}
        offset += len(files[path])
    body = b"".join(files[p] for p in sorted(files))
    blob = json.dumps(header, separators=(",", ":")).encode("utf-8")
    padded = blob + b"\x00" * ((4 - len(blob) % 4) % 4)
    header_payload = struct.pack("<I", len(blob)) + padded
    header_pickle = struct.pack("<I", len(header_payload)) + header_payload
    size_pickle = struct.pack("<II", 4, len(header_pickle))
    return bytes(size_pickle) + bytes(header_pickle) + body


def write_tree(root, files: dict):
    for rel, content in files.items():
        p = root / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        if isinstance(content, bytes):
            p.write_bytes(content)
        else:
            p.write_text(content, encoding="utf-8")
    return root


def vuln_files() -> dict:
    return {
        "package.json": json.dumps({"main": "main.js", "preload": "preload.js"}).encode(),
        "main.js": (
            b"const { app, BrowserWindow, ipcMain, shell } = require('electron');\n"
            b"const { exec } = require('child_process');\n"
            b"function createWindow() {\n"
            b"  const win = new BrowserWindow({\n"
            b"    webPreferences: {\n"
            b"      nodeIntegration: true,\n"
            b"      contextIsolation: false,\n"
            b"      sandbox: false,\n"
            b"      webSecurity: false,\n"
            b"      preload: 'preload.js'\n"
            b"    }\n"
            b"  });\n"
            b"  win.loadURL('http://malware.example.com/app');\n"
            b"}\n"
            b"ipcMain.handle('run', (e, name) => { exec('ping ' + name); });\n"
            b"app.whenReady().then(createWindow);\n"
        ),
        "preload.js": (
            b"const { contextBridge, ipcRenderer } = require('electron');\n"
            b"contextBridge.exposeInMainWorld('api', { ipc: ipcRenderer });\n"
            b"window.node = require('fs');\n"
        ),
        "renderer.js": b"document.title = eval(location.hash.slice(1));\n",
        "index.html": (
            b"<html><body><script src=\"./renderer.js\"></script></body></html>\n"
        ),
    }


def hardened_files() -> dict:
    return {
        "package.json": json.dumps({"main": "main.js"}).encode(),
        "main.js": (
            b"const { app, BrowserWindow } = require('electron');\n"
            b"function createWindow() {\n"
            b"  const win = new BrowserWindow({\n"
            b"    webPreferences: {\n"
            b"      nodeIntegration: false,\n"
            b"      contextIsolation: true,\n"
            b"      sandbox: true,\n"
            b"      preload: 'preload.js'\n"
            b"    }\n"
            b"  });\n"
            b"  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));\n"
            b"  win.loadFile('index.html');\n"
            b"}\n"
            b"app.whenReady().then(createWindow);\n"
        ),
        "preload.js": (
            b"const { contextBridge, ipcRenderer } = require('electron');\n"
            b"contextBridge.exposeInMainWorld('api', {\n"
            b"  ping: () => ipcRenderer.invoke('ping')\n"
            b"});\n"
        ),
        "index.html": (
            b"<html><head>\n"
            b"<meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'self'\">\n"
            b"</head><body></body></html>\n"
        ),
    }


# --------------------------------------------------------------------------- #
# Tests
# --------------------------------------------------------------------------- #

def test_vulnerable_asar_flags_injection_points(tmp_path):
    archive = tmp_path / "app.asar"
    archive.write_bytes(build_asar(vuln_files()))
    rep = analyze_app(archive)

    assert rep["target"]["is_electron"] is True
    assert rep["target"]["asar"] == ["app.asar"]
    assert "main.js" in rep["entrypoints"]["main"]
    assert "preload.js" in rep["entrypoints"]["preload"]
    assert "index.html" in rep["entrypoints"]["renderer_html"]

    ids = {f["id"] for f in rep["findings"]}
    for need in (
        "electron.webpref.nodeIntegration",
        "electron.webpref.contextIsolation",
        "electron.webpref.webSecurity",
        "electron.webpref.sandbox",
        "electron.nav.remote-loadurl",
        "electron.ipc.command-injection",
        "electron.preload.expose",
        "electron.preload.window-require",
        "electron.code.dynamic-eval",
        "electron.csp.missing",
    ):
        assert need in ids, f"missing finding: {need}"

    sev = {f["id"]: f["severity"] for f in rep["findings"]}
    assert sev["electron.webpref.nodeIntegration"] == "high"
    assert sev["electron.webpref.webSecurity"] == "high"
    assert sev["electron.webpref.sandbox"] == "medium"
    assert sev["electron.ipc.command-injection"] == "high"
    assert sev["electron.preload.expose"] == "high"
    assert rep["counts"]["high"] >= 4
    assert has_failing(rep) is True

    # every finding has a concrete location and a fix
    for f in rep["findings"]:
        assert f["file"] and f["line"] >= 1
        assert f["remediation"]


def test_hardened_app_has_no_failing_findings(tmp_path):
    root = write_tree(tmp_path / "secure-app", hardened_files())
    rep = analyze_app(root)
    assert rep["target"]["is_electron"] is True
    assert rep["counts"]["high"] == 0
    assert rep["counts"]["medium"] == 0
    assert has_failing(rep) is False
    # a correctly scoped bridge is reported only as info, never dropped silently
    ids = {f["id"] for f in rep["findings"]}
    assert "electron.webpref.nodeIntegration" not in ids
    assert "electron.csp.missing" not in ids


def test_directory_target_with_unpacked_asar(tmp_path):
    # app dir that contains resources/app.asar plus a loose renderer file
    root = tmp_path / "app"
    (root / "resources").mkdir(parents=True)
    (root / "resources" / "app.asar").write_bytes(build_asar(vuln_files()))
    write_tree(root, {"extra/renderer2.js": b"new Function(atob(x))();\n"})
    rep = analyze_app(root)
    ids = {f["id"] for f in rep["findings"]}
    assert "electron.webpref.nodeIntegration" in ids   # from inside the asar
    assert "electron.code.dynamic-eval" in ids         # from the loose file
    assert rep["target"]["asar"] == ["resources/app.asar"]


def test_formats_and_cli(tmp_path):
    archive = tmp_path / "app.asar"
    archive.write_bytes(build_asar(vuln_files()))
    rep = analyze_app(archive)

    text = format_report(rep, "text")
    assert "nodeIntegration enabled" in text
    md = format_report(rep, "md")
    assert "| Sev |" in md
    parsed = json.loads(format_report(rep, "json"))
    assert parsed["tool"] == "electron_inject"

    out = tmp_path / "out.json"
    rc = main([str(archive), "--format", "json", "-o", str(out)])
    assert rc == 1  # high/medium present -> non-zero
    data = json.loads(out.read_text())
    assert data["counts"]["high"] >= 4

    # missing input is a usage error, never a finding
    assert main([str(tmp_path / "nope.asar")]) == 2


def test_determinism_and_control_char_escaping(tmp_path):
    archive = tmp_path / "app.asar"
    archive.write_bytes(build_asar(vuln_files()))
    first = analyze_app(archive)["findings"]
    second = analyze_app(archive)["findings"]
    assert first == second  # stable ordering and content

    assert "\x07" not in _clean("a\x07b")
    assert "\\u0007" in _clean("a\x07b")
    assert _clean("‮evil") == "\\u202eevil"


# --------------------------------------------------------------------------- #
# Regression tests for PENT-10 review fixes (v1.0.1)
# --------------------------------------------------------------------------- #

def test_weak_csp_with_quoted_tokens_is_detected(tmp_path):
    # The CSP value contains single quotes; a naive [^"']* capture stops early
    # and misses unsafe-inline. The fix reads the whole content attribute.
    files = {
        "package.json": json.dumps({"main": "main.js"}).encode(),
        "main.js": b"const { app } = require('electron');\n",
        "index.html": (
            b"<html><head>\n"
            b"<meta http-equiv=\"Content-Security-Policy\" "
            b"content=\"default-src 'self'; script-src 'self' 'unsafe-inline'\">\n"
            b"</head><body></body></html>\n"
        ),
    }
    root = write_tree(tmp_path / "csp-app", files)
    rep = analyze_app(root)
    weak = [f for f in rep["findings"] if f["id"] == "electron.csp.weak"]
    assert weak, "weak CSP (unsafe-inline inside quotes) should be detected"
    assert "unsafe-inline" in weak[0]["title"]
    # attribute order reversed (content before http-equiv) must also work
    files["index.html"] = (
        b"<html><head><meta content=\"default-src 'self'; script-src 'unsafe-eval'\" "
        b"http-equiv='Content-Security-Policy'></head><body></body></html>\n"
    )
    root2 = write_tree(tmp_path / "csp-app2", files)
    rep2 = analyze_app(root2)
    assert any(f["id"] == "electron.csp.weak" for f in rep2["findings"])


def test_cjs_preload_is_resolved_and_scanned(tmp_path):
    files = {
        "package.json": json.dumps({"main": "main.js", "preload": "preload.cjs"}).encode(),
        "main.js": (
            b"const { app, BrowserWindow } = require('electron');\n"
            b"const win = new BrowserWindow({ webPreferences: { preload: 'preload.cjs' } });\n"
        ),
        "preload.cjs": (
            b"const { contextBridge, ipcRenderer } = require('electron');\n"
            b"contextBridge.exposeInMainWorld('api', { ipc: ipcRenderer });\n"
        ),
    }
    root = write_tree(tmp_path / "cjs-app", files)
    rep = analyze_app(root)
    assert "preload.cjs" in rep["entrypoints"]["preload"]
    assert any(f["id"] == "electron.preload.expose" for f in rep["findings"])


def test_malformed_package_json_does_not_crash(tmp_path):
    for i, bad in enumerate([
        b"{ this is : not valid json",      # not JSON at all
        b'{"main": 123}',                    # main is not a string
        b'["not", "a", "dict"]',             # top-level not an object
        b'{"main": {"nested": true}}',       # main is an object
    ]):
        root = write_tree(tmp_path / f"bad-{i}", {
            "package.json": bad,
            "main.js": b"const { app } = require('electron');\n",
        })
        rep = analyze_app(root)  # must not raise
        assert isinstance(rep, dict)
        assert "counts" in rep


def test_extensionless_and_directory_main_resolve(tmp_path):
    # Node resolves "main": "app" -> app.js, and "main": "lib" -> lib/index.js
    r1 = write_tree(tmp_path / "ext-app", {
        "package.json": json.dumps({"main": "app"}).encode(),
        "app.js": b"const { app } = require('electron');\n",
    })
    assert "app.js" in analyze_app(r1)["entrypoints"]["main"]

    r2 = write_tree(tmp_path / "dir-app", {
        "package.json": json.dumps({"main": "lib"}).encode(),
        "lib/index.js": b"const { app } = require('electron');\n",
    })
    assert "lib/index.js" in analyze_app(r2)["entrypoints"]["main"]


def test_incomplete_scan_is_flagged_and_fails(tmp_path):
    # Three benign files; a max-files cap of 1 leaves the scan incomplete.
    files = {f"f{i}.js": b"const x = 1;\n" for i in range(3)}
    root = write_tree(tmp_path / "big-app", files)
    rep = analyze_app(root, max_files=1)
    assert rep["complete"] is False
    assert rep["counts"]["high"] == 0 and rep["counts"]["medium"] == 0
    assert should_fail(rep) is True            # incomplete => non-clean
    assert main([str(root), "--max-files", "1"]) == 1
    # a full scan of the same tree is complete and clean
    full = analyze_app(root)
    assert full["complete"] is True
    assert should_fail(full) is False


def test_symlink_outside_root_is_not_followed(tmp_path):
    outside = tmp_path / "outside"
    outside.mkdir()
    (outside / "secret.js").write_text("document.title = eval(location.hash);\n")
    app = tmp_path / "app"
    app.mkdir()
    (app / "package.json").write_text(json.dumps({"main": "main.js"}))
    (app / "main.js").write_text("const { app } = require('electron');\n")
    try:
        os.symlink(outside / "secret.js", app / "link.js")
    except (OSError, NotImplementedError):
        pytest.skip("symlinks not supported on this platform")
    rep = analyze_app(app)
    files_seen = {f["file"] for f in rep["findings"]}
    assert "link.js" not in files_seen          # the escaping symlink is skipped
    assert not any(f["id"] == "electron.code.dynamic-eval" for f in rep["findings"])
