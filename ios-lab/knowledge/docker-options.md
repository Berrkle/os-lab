# iOS in Docker: top options

Data collected November 2026 from GitHub and Docker Hub. Star and pull counts
move; use them as a maturity signal, not a guarantee.

## Top 4

| Rank | Project | Stars | Pulls | Licence | Last push | Role |
|---:|---|---:|---:|---|---|---|
| 1 | [`sickcodes/Docker-OSX`](https://github.com/sickcodes/Docker-OSX) | 53,002 | 265,332 | GPL-3.0 | 2025-11-11 | Mature macOS-in-Docker; install Xcode manually |
| 2 | [`dockur/macos`](https://github.com/dockur/macos) | 21,714 | 465,871 | MIT | 2026-10-08 | Simplest maintained macOS container; web viewer; Reims vGPU option |
| 3 | [`cocoonstack/cocoon-macos`](https://github.com/cocoonstack/cocoon-macos) | 55 | n/a (ghcr) | MIT | 2026-11-02 | OCI/Docker-like macOS VM engine for CI, snapshots and clones |
| 4 | [`TUNA-NOPE/macbox`](https://github.com/TUNA-NOPE/macbox) | 6 | n/a | NOASSERTION | 2026-10-29 | Purpose-built Xcode + iOS Simulator on Linux; experimental |

### 1. sickcodes/Docker-OSX

- Runs macOS via QEMU/KVM inside Docker; images for modern macOS including
  Sequoia and Tahoe.
- Long track record, large issue base, serial generation, USB passthrough and
  `usbfluxd` notes for physical iPhones.
- Xcode is not the product: install it inside macOS and budget ~50 GB for
  Xcode plus simulators.
- x86_64 host only; macOS under QEMU is not Apple-supported; software rendering
  makes the Simulator slow.

### 2. dockur/macos

- Same QEMU/KVM approach with a smaller, compose-first interface and a web
  viewer on `:8006`.
- `VERSION`, `CPU_CORES`, `RAM_SIZE`, `DISK_SIZE`, `GPU`, `PROTECT` and related
  environment variables are documented.
- Reims vGPU translates Metal to Vulkan when `GPU=Y`; requires a Vulkan GPU and
  `/dev/dri` or the NVIDIA container toolkit.
- macOS installation is still manual: recovery download, Setup Assistant,
  then Xcode from the App Store or Apple Developer downloads.

### 3. cocoonstack/cocoon-macos

- Not a `docker run` macOS image: it is an OCI-image-based VM engine with a
  Docker-like CLI (`image pull`, `vm run`, `vm clone`).
- Boots Sequoia 15 / Tahoe 26 with OpenCore + OVMF, provides SSH and VNC,
  snapshots, clone-per-run, per-VM SMBIOS identity and CNI networking.
- Good fit for ephemeral CI runners and repeatable macOS build environments.
- Still needs Xcode installed in the image/guest for iOS Simulator work; check
  the project's current image contents before relying on it.

### 4. TUNA-NOPE/macbox

- Explicitly targets the real iOS Simulator on Linux: macOS 26 Tahoe, Xcode 26,
  iOS 26 simulators, a simulator pool for agents, GPU acceleration via Reims
  vGPU, and `mac-sim` tooling.
- Requires Linux + KVM + a Vulkan GPU + Docker/Podman.
- Very young (created October 2026, 6 stars at collection time) and has a
  `NOASSERTION` licence. Treat it as an experiment, not a production base.

## Honourable mentions

| Project | Why it matters | Why it is not top 4 |
|---|---|---|
| [`MobAI-App/iosbox`](https://github.com/MobAI-App/iosbox) | Cross-compiles Flutter iOS apps to unsigned `.ipa` in Docker, no Mac | No simulator, no UI testing; physical-device target only |
| [`sickcodes/Docker-eyeOS`](https://github.com/sickcodes/Docker-eyeOS) | iPhone xnu-arm64 kernel in Docker, KVM + GDB kernel debugging | iOS 12-era, last push 2022; not an app simulator |
| [`kholia/OSX-KVM`](https://github.com/kholia/OSX-KVM) | 23.8k-star upstream QEMU/KVM macOS project | Not Docker; it is the base many containers wrap |
| [`Cleafy/sxkdvm`](https://github.com/Cleafy/sxkdvm) | Early macOS KVM container | Last push 2017; not suitable for current Xcode |
| [`taylorcoffelt/macos-docker`](https://github.com/taylorcoffelt/macos-docker) | QEMU macOS container with VNC/SSH/SPICE | Last push 2020; stale relative to modern macOS |

## Selection guidance

- **Want the smallest operational surprise on Ubuntu:** `dockur/macos`.
- **Want the largest community and long history:** `Docker-OSX`.
- **Want snapshots/clones for CI:** `cocoon-macos`.
- **Want the real simulator with GPU on Linux and accept experimental risk:**
  `macbox`.
- **Have a Mac:** skip Docker for the simulator; use the native path in
  [`setup-mac.md`](setup-mac.md).

## Non-options

- Docker Desktop on macOS/Windows does not expose `/dev/kvm`, so it cannot run
  the x86 macOS VM path.
- An iOS Simulator binary cannot run directly on Linux; the simulator depends on
  macOS frameworks and Xcode.
- A cloud device farm is not a Docker replacement; it is a different operating
  model with its own cost, data and authorization rules.
