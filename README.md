# 🛡️ apk-lab — Agentic Mobile Security Lab

Research, documentation, and **compact runnable labs** for Android and iOS
application security testing and reverse engineering. The Android lab is built
on `budtmo/docker-android`, MobSF, mitmproxy, Frida, and containerized RE
toolkits; the iOS lab covers a macOS VM on Ubuntu Server and native macOS
Xcode/Simulator/Appium paths.

> ⚠️ Authorization only. Everything here is for testing apps you own or have
> explicit permission to assess, in isolated lab containers.

## Repo map

| Path | What it is |
|---|---|
| [`lab/`](lab/) | **The compact lab** — compose stack + both workflow DAGs + Frida hooks. Start here to run things. |
| [`lab/README.md`](lab/README.md) | Lab runbook (Linux / macOS): setup, workflows, make targets, agent brief |
| [`lab/README-WINDOWS.md`](lab/README-WINDOWS.md) | **Windows Non-Admin runbook**: PowerShell CLI (`lab.ps1`), VirtualBox, Podman, userland |
| [`knowledge/windows-nonadmin-lab.md`](knowledge/windows-nonadmin-lab.md) | **Windows Non-Admin architecture**: zero-elevation setup, VirtualBox, Podman, and native engine |
| [`docker-android-cheat-sheet.md`](docker-android-cheat-sheet.md) | Master verified command reference (per-OS setup, run/lifecycle, pentest tools, troubleshooting) |
| [`knowledge/draft.md`](knowledge/draft.md) | Docker-Android technical overview: capabilities, use cases, constraints |
| [`knowledge/setup.md`](knowledge/setup.md) | Per-platform deployment guides (Kali, WSL2, VirtualBox, macOS) |
| [`knowledge/segmentation.md`](knowledge/segmentation.md) | Master blueprint: 4 segments, 6 UI phases, agent classifications, UX principles |
| [`knowledge/usecases.md`](knowledge/usecases.md) | Pentest & reverse-engineering usage patterns |
| [`knowledge/references.md`](knowledge/references.md) | Curated external references (tool images, guides, attack-sim projects) |
| [`ios-lab/`](ios-lab/) | **iOS lab** — macOS VM on Ubuntu Server and native macOS Simulator/Appium scripts |
| [`ios-lab/README.md`](ios-lab/README.md) | iOS runbook: Ubuntu container path, macOS path, profiles and operations |
| [`ios-lab/knowledge/`](ios-lab/knowledge/) | iOS research: Docker options, setup, operations, networking, use cases |
| [`ios-lab/mac/`](ios-lab/mac/) | Native macOS scripts: Xcode checks, `simctl`, Appium and device presets |
| [`format/Agent Build Brief.md`](format/Agent%20Build%20Brief.md) | Handover template for commissioning agents/subagents/skills |
| [`guidelines/`](guidelines/) | UI/UX design reference images for the planned frontend |

## Quick start (the lab)

### Linux / WSL2 (with KVM)
```bash
cd lab
cp .env.example .env
make preflight      # OS / KVM / docker / ports / disk
make boot           # start stack, wait for emulator — noVNC at http://localhost:6080
make wf1 APK=app.apk                    # static:  MobSF scan + JADX
make wf2 APK=app.apk PKG=com.example    # dynamic: emulator + mitmproxy + frida
make report                             # collect artifacts
```

### Windows (Zero-Admin / PowerShell)
No Administrator privileges or `/dev/kvm` required. Supports VirtualBox, Podman, and pure userland:
```powershell
cd lab
.\lab.ps1 preflight                     # check environment & non-admin status
.\lab.ps1 setup                         # setup .venv, frida, mitmproxy, portable tools
.\lab.ps1 wf1 -Apk path\to\app.apk      # static: manifest analysis + JADX + MobSF
.\lab.ps1 wf2 -Apk path\to\app.apk -Pkg com.example  # dynamic: ADB + mitmproxy + frida
.\lab.ps1 report                        # collect telemetry & artifacts
```

### iOS (Ubuntu Server or macOS)
```bash
cd ios-lab
cp .env.example .env
sudo ./setup.sh                 # Ubuntu: KVM + Docker; macOS: skip and use mac-* targets
make preflight
make boot                       # web viewer at http://localhost:8006/
# macOS host instead:
make mac-doctor mac-setup mac-sim mac-appium
```
See [`ios-lab/README.md`](ios-lab/README.md) for the manual macOS installation,
Xcode/Simulator steps and the native macOS path.

## Architecture

```
┌────────────────── lab/ (compact core) ──────────────────┐
│ WF1 static   : MobSF scan → JADX decompile → report     │
│ WF2 dynamic  : boot emulator → install APK →            │
│                mitmproxy capture → Frida hooks          │
│ services     : android :6080/:5555 · mobsf :8000 ·      │
│                mitmproxy :8080/:8081 · tools (RE kit)   │
└─────────────────────────────────────────────────────────┘
```

The iOS lab adds a separate path: `dockurr/macos` in Docker/QEMU/KVM on Ubuntu
Server, or native Xcode + `xcrun simctl` + Appium on macOS. There is no official
iOS Simulator container; the Ubuntu path runs macOS and installs Xcode manually.

The knowledge docs define the full product blueprint (landing, providers,
workflows, console, analytics — `knowledge/segmentation.md`); `lab/` is the
backend core those future agents and UI drive via `make` targets and scripts.

## Status

- [x] Knowledge base & verified cheat sheet
- [x] Agent handover format
- [x] Compact lab (compose stack, WF1/WF2, hooks, runbook)
- [x] Windows Zero-Admin & VirtualBox/Podman lab suite
- [x] Agentic orchestrator (Orchestrator / Analyst / Exploit per segmentation.md)
- [x] Interactive web console (`/`, `/providers`, `/workflows`, `/console`, `/reports`, `/sitemap`)
- [x] Automated IPC & Component Fuzzer
- [x] Zero-Admin APK Patcher & Frida Gadget Injector
- [x] GitHub Actions CI/CD Security Audit Workflow
- [x] iOS research: top-four Docker options, Ubuntu container lab and native macOS lab
- [x] iOS profiles, preflight, backup, systemd, GPU override and Appium scripts
- [x] Apache License 2.0

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](LICENSE).

