# dockur/windows: Technical Overview

## Definition

`dockur/windows` (Docker image `dockurr/windows`, note the double `r`) runs a
complete Windows machine inside a Docker container. The container embeds QEMU,
firmware (UEFI/BIOS), a virtual display, VNC/noVNC, Samba and the automation
needed to download installation media and complete an unattended Windows
installation.

It is a containerised virtual machine, not an emulator wrapper around Wine. A
Linux host with KVM exposes `/dev/kvm` to the container, and QEMU runs the guest
with hardware acceleration.

- Upstream: <https://github.com/dockur/windows>
- Image: `docker.io/dockurr/windows` (also `ghcr.io/dockur/windows`)
- License: MIT (the project ships code, not Windows itself)
- Popularity at time of writing: ~54k stars, ~5k forks

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│ Docker host (Ubuntu Server, KVM enabled)                     │
│                                                              │
│  ┌────────────────────── container: win-lab ──────────────┐  │
│  │  nginx / noVNC  :8006  ── browser desktop + console    │  │
│  │  QEMU + KVM             ── guest CPU/RAM/disk          │  │
│  │  dnsmasq / NAT          ── guest network               │  │
│  │  Samba                  ── /shared  ->  Z: on guest    │  │
│  │  RDP (guest)    :3389  ── Remote Desktop               │  │
│  │  /storage               ── disks, ISO, state markers   │  │
│  └────────────────────────────────────────────────────────┘  │
│  /dev/kvm  /dev/net/tun  host ports 8006, 3389               │
└──────────────────────────────────────────────────────────────┘
```

Key components inside the image:

- QEMU system emulator built for x86_64, with KVM acceleration.
- UEFI firmware with TPM/Secure Boot modes (selected by `BOOT_MODE`).
- An unattended answer file generator; installation is hands-free.
- A small nginx server that serves the noVNC viewer on port `8006`.
- Samba for the shared folder and `wsdd` for Windows network discovery.
- A downloader (`mido`) that fetches ISO/ESD media directly from Microsoft,
  with optional checksum verification.

## How first boot works

1. `docker compose up -d` starts the container.
2. If `/storage` contains no installed system, the entrypoint resolves
   `VERSION` to an official Microsoft image and downloads it (several GB).
3. The installer creates an unattended answer file from `USERNAME`, `PASSWORD`,
   `LANGUAGE`, `KEYBOARD`, `REGION`, `DOMAIN`, `COMMAND`, etc.
4. QEMU boots the installation media and Windows installs automatically.
5. The Windows disk is created in `/storage` (default 64 GB, `raw`, sparse).
6. On success a state marker `/storage/windows.boot` is written. This is the
   reliable "installation finished" signal used by `win-lab/scripts/wait-ready.sh`.
7. Later starts boot directly from the installed disk. The downloaded ISO is
   deleted afterwards unless `REMOVE=N`.

During installation the web viewer at `http://<host>:8006/` shows progress. The
whole process commonly takes 20-60+ minutes depending on bandwidth, disk and
CPU. Do not stop the container during the first installation.

## Core capabilities

- Automatic download and unattended installation of modern and legacy Windows.
- Near-native performance with KVM; dynamic memory ballooning is available.
- Configurable CPU cores, RAM, disk size, disk format (raw/qcow2) and cache.
- Web desktop (noVNC) and RDP; audio streaming to the browser is optional.
- Host folder sharing through Samba (`/shared` -> `Z:` and desktop shortcut).
- Multiple disks, raw disk passthrough, USB passthrough.
- NAT (default), user-mode, macvlan and macvtap/DHCP networking.
- Additional OEM files and post-install commands (`/oem`, `COMMAND`).
- Optional TPM, Secure Boot, Hyper-V enlightenments, custom QEMU arguments.

## Supported Windows versions

`VERSION` accepts shortcuts (see `docs/environment.md` upstream for the full
list). The common values are:

| Value | Edition | Approx. media size |
|---|---|---|
| `11` | Windows 11 Pro | 7.9 GB |
| `11l` | Windows 11 LTSC | 4.7 GB |
| `11e` | Windows 11 Enterprise | 6.6 GB |
| `10` | Windows 10 Pro | 5.7 GB |
| `10l` | Windows 10 LTSC | 4.6 GB |
| `10e` | Windows 10 Enterprise | 5.2 GB |
| `8e` | Windows 8.1 Enterprise | 3.7 GB |
| `7u` | Windows 7 Ultimate | 3.1 GB |
| `xp` | Windows XP Professional | 0.6 GB |
| `2025` | Windows Server 2025 | 7.6 GB |
| `2022` | Windows Server 2022 | 6.0 GB |
| `2019` | Windows Server 2019 | 5.3 GB |
| `core11` | Tiny11 Core | 3.0 GB |
| `tiny11` | Tiny11 | 5.3 GB |
| `tiny10` | Tiny10 | 3.6 GB |
| `reactos` | ReactOS | 0.1 GB |

A custom image is supported by setting `VERSION` to an ISO URL or by bind
mounting a local ISO to `/custom.iso` (then `VERSION` is ignored). ARM64
Windows uses the separate project `dockur/windows-arm`.

## Requirements and constraints

| Component | Requirement |
|---|---|
| Host OS | Linux with KVM (Ubuntu Server recommended) |
| Runtime | Docker Engine or Podman; Docker Desktop is not supported |
| CPU | Intel VT-x or AMD-V enabled; nested virtualisation if the host is a VM |
| Device | `/dev/kvm` must exist and be accessible |
| RAM | 2 GB minimum; 4 GB+ recommended for the guest plus host overhead |
| Disk | 32 GB minimum free; 64 GB+ comfortable with the default disk |
| Network | Outbound HTTPS for Microsoft media, or a local ISO |

Important constraints:

- Without KVM the guest falls back to TCG emulation and is impractically slow.
- Docker Desktop on Linux, macOS and Windows 10 does not expose KVM. Use a
  native Linux Docker Engine (or Windows 11 with nested virtualisation).
- The default guest disk is sparse but the ISO download plus Windows itself
  consumes real space quickly. Monitor `df -h`.
- The project contains generic Microsoft trial keys only. You are responsible
  for having a valid Windows licence and complying with Microsoft's terms.
- The container is a VM boundary, not a hardening boundary. Treat a Windows
  guest used for malware analysis as untrusted and isolate it at the network
  level (see `networking.md` and `usecases.md`).

## Image tags and versions

The upstream repository publishes version tags (for example `6.06`) and
`latest`. Pin a version tag for reproducibility:

```yaml
image: dockurr/windows:6.06
```

The architecture of the image follows the host (`amd64`); ARM64 hosts need
`dockur/windows-arm`.
