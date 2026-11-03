# android-lab - Agentic Mobile Security Lab

Research, documentation, and a compact runnable lab for Android application
security testing and reverse engineering, built on `budtmo/docker-android`,
MobSF, mitmproxy, Frida, and containerized RE toolkits.

This is the Android counterpart to `../win-lab/`. The research and lab assets
were brought over from `apk-lab`; the Ubuntu Server host setup is new here.

> Authorization only. Everything here is for testing apps you own or have
> explicit permission to assess, in isolated lab containers.

## Repo map

| Path | What it is |
|---|---|
| [`lab/`](lab/) | **The compact lab** - compose stack, workflow DAGs, Frida hooks, Windows and Ubuntu host tooling |
| [`lab/README.md`](lab/README.md) | Lab runbook (Linux / macOS): setup, workflows, make targets, agent brief |
| [`lab/README-UBUNTU.md`](lab/README-UBUNTU.md) | **Ubuntu Server runbook**: host setup script, preflight, boot, workflows, systemd, troubleshooting |
| [`lab/README-WINDOWS.md`](lab/README-WINDOWS.md) | **Windows Non-Admin runbook**: PowerShell CLI (`lab.ps1`), VirtualBox, Podman, userland |
| [`knowledge/windows-nonadmin-lab.md`](knowledge/windows-nonadmin-lab.md) | **Windows Non-Admin architecture**: zero-elevation setup, VirtualBox, Podman, native engine |
| [`docker-android-cheat-sheet.md`](docker-android-cheat-sheet.md) | Master verified command reference (per-OS setup, run/lifecycle, pentest tools, troubleshooting) |
| [`knowledge/draft.md`](knowledge/draft.md) | Docker-Android technical overview: capabilities, use cases, constraints |
| [`knowledge/setup.md`](knowledge/setup.md) | Per-platform deployment guides (Kali, WSL2, VirtualBox, macOS) |
| [`knowledge/segmentation.md`](knowledge/segmentation.md) | Master blueprint: 4 segments, 6 UI phases, agent classifications, UX principles |
| [`knowledge/usecases.md`](knowledge/usecases.md) | Pentest and reverse-engineering usage patterns |
| [`knowledge/references.md`](knowledge/references.md) | Curated external references (tool images, guides, attack-sim projects) |
| [`format/Agent Build Brief.md`](format/Agent%20Build%20Brief.md) | Handover template for commissioning agents/subagents/skills |
| [`guidelines/`](guidelines/) | UI/UX design reference images for the planned frontend |
| [`TODO.md`](TODO.md) | Project roadmap and gap analysis carried over from apk-lab |

## Quick start

### Ubuntu Server (with KVM) - new

```bash
cd lab
cp .env.example .env
sudo ./setup.sh                   # KVM + Docker + adb + groups + dirs
newgrp docker                     # or log out/in
make preflight                    # OS / KVM / docker / ports / disk
make boot                         # start stack, wait for emulator
#   noVNC:   http://<server-ip>:6080
#   MobSF:   http://<server-ip>:8000
#   mitmweb: http://<server-ip>:8081
make wf1 APK=app.apk                    # static: MobSF + JADX
make wf2 APK=app.apk PKG=com.example    # dynamic: emulator + mitm + frida
make report                             # collect artifacts
```

`./run.sh` starts and waits for the emulator; `./run.sh --static` starts only
the KVM-free services (MobSF, mitmproxy, tools) on hosts without `/dev/kvm`.
See [`lab/README-UBUNTU.md`](lab/README-UBUNTU.md) for the full runbook.

### Linux / WSL2 (with KVM)

```bash
cd lab
cp .env.example .env
make preflight
make boot
make wf1 APK=app.apk
make wf2 APK=app.apk PKG=com.example
make report
```

### Windows (Zero-Admin / PowerShell)

No Administrator privileges or `/dev/kvm` required. Supports VirtualBox,
Podman, and a pure userland engine:

```powershell
cd lab
.\lab.ps1 preflight                     # environment and non-admin status
.\lab.ps1 setup                         # .venv, frida, mitmproxy, portable tools
.\lab.ps1 wf1 -Apk path\to\app.apk      # static: manifest + JADX + MobSF
.\lab.ps1 wf2 -Apk path\to\app.apk -Pkg com.example  # dynamic: ADB + mitm + frida
.\lab.ps1 report                        # telemetry and artifacts
```

## Profiles and management

From the repository root, `./labctl` manages profiles, lifecycle, hardware and
monitoring:

```bash
./labctl android profiles
./labctl android profile use lightweight   # KVM-free static stack
./labctl android start --wait
./labctl android monitor
./labctl android doctor --profile lightweight
./labctl android resize --cpus 4 --ram 6g --device "Samsung Galaxy S10" --apply
./labctl android config show --profile performance
./labctl android stop
```

| Profile | Mode | CPU | RAM | Use |
|---|---|---:|---:|---|
| `lightweight` | static | 1 | 2g | MobSF/mitmproxy/tools only; no KVM |
| `development` | dynamic | 2 | 4g | Android 11 emulator, balanced |
| `performance` | dynamic | 4 | 6g | Android 13 emulator, parallel analysis |

`profile use` writes the preset into `lab/.env`; `--profile P` applies it for
one command without modifying `.env`. Android "hardware" is the emulator device
profile plus host CPU/RAM limits; changing the device may require resetting the
`android_data` volume for a fresh AVD.

## Architecture

```
┌────────────────── lab/ (compact core) ──────────────────┐
│ WF1 static   : MobSF scan -> JADX decompile -> report   │
│ WF2 dynamic  : boot emulator -> install APK ->          │
│                mitmproxy capture -> Frida hooks         │
│ services     : android :6080/:5555 · mobsf :8000 ·      │
│                mitmproxy :8080/:8081 · tools (RE kit)   │
└─────────────────────────────────────────────────────────┘
```

The knowledge docs define the full product blueprint (landing, providers,
workflows, console, analytics - `knowledge/segmentation.md`); `lab/` is the
backend core those future agents and UI drive via `make` targets and scripts.

## Status

- [x] Knowledge base and verified cheat sheet (carried over from apk-lab)
- [x] Agent handover format
- [x] Compact lab (compose stack, WF1/WF2, hooks, runbook)
- [x] Windows Zero-Admin and VirtualBox/Podman lab suite
- [x] Ubuntu Server setup script, preflight, run wrappers and runbook
- [x] `labctl` profiles, lifecycle, hardware resize, monitoring and config
- [x] Agentic orchestrator (Orchestrator / Analyst / Exploit per segmentation.md)
- [x] Interactive web console (`/`, `/providers`, `/workflows`, `/console`, `/reports`, `/sitemap`)
- [x] Automated IPC and Component Fuzzer
- [x] Zero-Admin APK Patcher and Frida Gadget Injector
