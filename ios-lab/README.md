# ios-lab: iOS Simulator lab on Ubuntu Server and macOS

A research-backed iOS lab with two runnable paths:

- **Ubuntu Server:** `dockurr/macos` in Docker/QEMU/KVM, web viewer on `:8006`,
  VNC on `:5900`. macOS and Xcode are installed inside the guest.
- **macOS:** native Xcode + `xcrun simctl` + Appium/XCUITest with scripts in
  [`mac/`](mac/).

There is no official iOS Simulator container. The simulator is part of Xcode,
so any Linux path is a macOS VM. See
[`knowledge/draft.md`](knowledge/draft.md) for the constraints and
[`knowledge/docker-options.md`](knowledge/docker-options.md) for the top-four
research.

> Use only apps and devices you are authorized to test. Apple's macOS EULA
> restricts virtualization to Apple hardware; you are responsible for
> compliance. Do not expose VNC, the web viewer or Appium publicly.

## Ubuntu Server quick start

```bash
cd ios-lab
cp .env.example .env
sudo ./setup.sh            # KVM + Docker + groups + directories
newgrp docker              # or log out/in

make preflight
make boot                  # open http://<server-ip>:8006/
```

First boot downloads the macOS recovery image and starts Setup Assistant. The
installation is manual; `make boot` only waits for the web viewer. Inside macOS,
install Xcode from the App Store or Apple Developer downloads, then install an
iOS Simulator runtime from **Xcode > Settings > Components**.

Full runbook: [`knowledge/setup-ubuntu.md`](knowledge/setup-ubuntu.md).

```bash
make status
make logs
make backup FULL=1
make monitor
make resize CPUS=8 RAM=12G APPLY=1
make down
```

## macOS quick start

```bash
cd ios-lab
make mac-doctor
make mac-setup             # checks Xcode; add INSTALL=1 for Node/Appium
make mac-sim               # boot the configured Simulator
make mac-status
make mac-appium            # Appium XCUITest on 127.0.0.1:4723
make mac-stop
```

Device presets:

```bash
make mac-profiles
make mac-profile PROFILE=iphone
make mac-profile PROFILE=ipad
make mac-profile PROFILE=legacy
```

Full runbook: [`knowledge/setup-mac.md`](knowledge/setup-mac.md).

## Profiles

Ubuntu container presets live in `profiles/`:

| Profile | CPU | RAM | Use |
|---|---:|---:|---|
| `lightweight` | 2 | 4G | setup and light simulator work; web viewer protected |
| `development` | 4 | 8G | Xcode, Simulator and Appium |
| `performance` | 8 | 12G | heavier Xcode builds |

```bash
make profiles
make profile PROFILE=development
make boot
```

The disk is persistent and grow-only. Change it with
`make resize DISK=192G`; then extend the APFS container in macOS Disk Utility. GPU acceleration is opt-in with `make up-gpu` on a Vulkan-capable
Intel/AMD host.

## Layout

```
ios-lab/
├── docker-compose.yml       # dockurr/macos VM
├── docker-compose.gpu.yml   # Reims vGPU override (/dev/dri)
├── .env.example             # macOS version, CPU/RAM/disk, ports, GPU
├── profiles/                # lightweight / development / performance
├── Makefile
├── setup.sh / run.sh
├── scripts/
│   ├── setup-ubuntu.sh
│   ├── preflight.sh
│   ├── wait-ready.sh
│   ├── backup.sh
│   ├── restore.sh
│   ├── profile.sh
│   ├── monitor.sh
│   ├── resize.sh
│   ├── install-service.sh
│   └── uninstall-service.sh
├── storage/                 # macOS disk (gitignored)
├── shared/                  # 9p share mounted in the guest
├── backups/
├── mac/                     # native macOS scripts and device presets
└── knowledge/               # research and runbooks
```

## Research

| Document | What it covers |
|---|---|
| [`knowledge/draft.md`](knowledge/draft.md) | Problem, constraints and decision |
| [`knowledge/docker-options.md`](knowledge/docker-options.md) | Top 4 iOS-in-Docker options and honourable mentions |
| [`knowledge/setup-ubuntu.md`](knowledge/setup-ubuntu.md) | Ubuntu container runbook |
| [`knowledge/setup-mac.md`](knowledge/setup-mac.md) | Native macOS runbook |
| [`knowledge/operations.md`](knowledge/operations.md) | Lifecycle, backups, resize, Appium |
| [`knowledge/networking.md`](knowledge/networking.md) | Ports, shared folder, USB, isolation |
| [`knowledge/usecases.md`](knowledge/usecases.md) | Development, testing, security research |
| [`knowledge/references.md`](knowledge/references.md) | Upstream links |

## Status

- [x] Top-four Docker research and constraints
- [x] Ubuntu Server container lab with profiles, preflight, backup and systemd
- [x] Native macOS simulator/Appium scripts and device presets
- [x] GPU override and EULA/security caveats
- [ ] End-to-end validation on a KVM host with GPU and an Apple ID
- [ ] Automated Xcode/Appium install inside the macOS guest
