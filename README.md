# 🛡️ apk-lab — Agentic Mobile Security Lab

Research, documentation, and a **compact runnable lab** for Android application
security testing and reverse engineering built on `budtmo/docker-android`,
MobSF, mitmproxy, Frida, and containerized RE toolkits.

> ⚠️ Authorization only. Everything here is for testing apps you own or have
> explicit permission to assess, in isolated lab containers.

## Repo map

| Path | What it is |
|---|---|
| [`lab/`](lab/) | **The compact lab** — compose stack + both workflow DAGs + Frida hooks. Start here to run things. |
| [`lab/README.md`](lab/README.md) | Lab runbook: setup, workflows, make targets, agent brief |
| [`docker-android-cheat-sheet.md`](docker-android-cheat-sheet.md) | Master verified command reference (per-OS setup, run/lifecycle, pentest tools, troubleshooting) |
| [`knowledge/draft.md`](knowledge/draft.md) | Docker-Android technical overview: capabilities, use cases, constraints |
| [`knowledge/setup.md`](knowledge/setup.md) | Per-platform deployment guides (Kali, WSL2, VirtualBox, macOS) |
| [`knowledge/segmentation.md`](knowledge/segmentation.md) | Master blueprint: 4 segments, 6 UI phases, agent classifications, UX principles |
| [`knowledge/usecases.md`](knowledge/usecases.md) | Pentest & reverse-engineering usage patterns |
| [`knowledge/references.md`](knowledge/references.md) | Curated external references (tool images, guides, attack-sim projects) |
| [`format/Agent Build Brief.md`](format/Agent%20Build%20Brief.md) | Handover template for commissioning agents/subagents/skills |
| [`guidelines/`](guidelines/) | UI/UX design reference images for the planned frontend |

## Quick start (the lab)

Requires a Linux host with `/dev/kvm` — native, WSL2 (Win11), or Ubuntu VM.
macOS has no native path (see the [platform decision matrix](docker-android-cheat-sheet.md#-platform-decision-matrix)).

```bash
cd lab
cp .env.example .env
make preflight      # OS / KVM / docker / ports / disk
make boot           # start stack, wait for emulator — noVNC at http://localhost:6080
make wf1 APK=app.apk                    # static:  MobSF scan + JADX
make wf2 APK=app.apk PKG=com.example    # dynamic: emulator + mitmproxy + frida
make report                             # collect artifacts
```

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

The knowledge docs define the full product blueprint (landing, providers,
workflows, console, analytics — `knowledge/segmentation.md`); `lab/` is the
backend core those future agents and UI drive via `make` targets and scripts.

## Status

- [x] Knowledge base & verified cheat sheet
- [x] Agent handover format
- [x] Compact lab (compose stack, WF1/WF2, hooks, runbook)
- [ ] Agentic orchestrator (Orchestrator / Analyst / Exploit per segmentation.md)
- [ ] Frontend shell (`/`, `/providers`, `/workflows`, `/console-report`, `/analytics`, `/sitemap`)
