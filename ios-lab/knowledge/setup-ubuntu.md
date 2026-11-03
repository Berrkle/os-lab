# Ubuntu Server setup

This is the container path: an x86_64 Ubuntu host runs `dockurr/macos` with
KVM. macOS and Xcode are installed inside the guest; the host only provides
QEMU/KVM, Docker, storage and network access.

## Requirements

| Item | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 22.04/24.04/26.04 Server | latest Ubuntu LTS |
| CPU | x86_64, VT-x/AMD-V, 4 cores | 8 cores |
| RAM | 16 GB | 24-32 GB |
| Disk | 64 GB free | 128 GB+ SSD |
| GPU | none (software rendering) | Vulkan Intel/AMD GPU for Reims vGPU |
| Runtime | Docker Engine + Compose | Docker Engine |
| Network | outbound HTTPS | wired, stable |

ARM64 hosts are not supported by `dockurr/macos`. Use an Apple Silicon Mac with
the native path in [`setup-mac.md`](setup-mac.md).

## 1. Install host dependencies

From the repository root:

```bash
cd ios-lab
cp .env.example .env
sudo ./setup.sh
newgrp docker
make preflight
```

`setup.sh` installs KVM tools, Docker (if needed), adds the invoking user to
`docker` and `kvm`, creates `storage/`, `shared/` and `backups/`, and can open
ports when `OPEN_FIREWALL=yes`.

If `/dev/kvm` is not accessible:

```bash
sudo usermod -aG kvm "$USER"
newgrp kvm
ls -l /dev/kvm
```

If the host is itself a VM, enable nested virtualization first.

## 2. First boot and macOS installation

```bash
make boot
```

Open `http://<server-ip>:8006/`. The recovery image downloads, then macOS
Setup Assistant runs. This is manual; `make boot` only waits for the web viewer.
Do not stop the container during installation.

Notes:

- The default guest is macOS 15 Sequoia. macOS 26 Tahoe works but is slow on
  x86; select it with `MACOS_VERSION=26` only when needed.
- On AMD hosts, do not assign more than 8 GB RAM during the initial install.
- The web viewer is fine for installation; use VNC (`127.0.0.1:5900`) for a
  smoother desktop if needed.
- The guest disk is `storage/`. Back it up before changing hardware.

## 3. Install Xcode and the Simulator

Inside macOS:

1. Sign in to the App Store with an Apple ID, or download Xcode from
   <https://developer.apple.com/download/all/>.
2. Install Xcode, open it once, accept the licence and install additional
   components.
3. Open **Xcode > Settings > Components** and install an iOS Simulator runtime.
4. Verify in Terminal inside the guest:

```bash
xcodebuild -version
xcrun simctl list runtimes
xcrun simctl list devices available
```

Xcode plus several simulator runtimes can consume 40-80 GB. Size `DISK_SIZE`
accordingly.

## 4. Host shared folder

The compose file mounts `./shared` at `/shared` in the container. Inside macOS,
mount the 9p share:

```bash
sudo -S mount_9p shared
```

Then use Finder **Go > Computer** to open the shared folder. This is useful for
moving `.ipa` files, Xcode `.xip` downloads and test fixtures into the guest.

## 5. Appium and XCUITest

The clean topology is to run Appium **inside the macOS guest**, because the
XCUITest driver needs Xcode and must see the simulator. Install Node and Appium
inside macOS, then expose the Appium port from the guest if you need host
access. The exact `USER_PORTS` forwarding depends on the current dockur/macos
release; verify with the upstream environment-variable documentation before
relying on it. Prefer running test clients inside the guest for the first setup.

Minimal in-guest flow:

```bash
xcodebuild -version
npm install -g appium
appium driver install xcuitest
appium --address 127.0.0.1 --port 4723
```

For a native Mac host, the `mac/appium.sh` script automates this part.

## 6. GPU acceleration (optional)

Reims vGPU translates Metal to Vulkan on the Linux host. It requires a
Vulkan-capable Intel/AMD GPU and `/dev/dri`:

```bash
make up-gpu
```

For NVIDIA, install the NVIDIA Container Toolkit, expose the GPU, and use
`GPU=Y`; see the upstream dockur/macos documentation. If the host has no
render node, leave `GPU=N`; the Simulator will be slow but functional.

## 7. Operations

```bash
make status
make logs
make backup FULL=1
make restore FILE=backups/ios-lab-....tar.gz
make down
make reset CONFIRM=yes     # destroys storage/
```

Full lifecycle and resizing details: [`operations.md`](operations.md).

## Troubleshooting

| Symptom | Check |
|---|---|
| `permission denied /dev/kvm` | `id`, `getent group kvm`, re-login after `usermod -aG kvm` |
| Web viewer not reachable | `make logs`, `ss -ltnp '( sport = :8006 )'`, firewall |
| macOS recovery loop | new install, `PICKER=Y` and upstream debug options |
| Simulator extremely slow | expected without GPU; try `GPU=Y` on a supported GPU |
| Xcode won't install | free disk space; Xcode needs tens of GB |
| No simulator runtime | Xcode > Settings > Components; check `xcrun simctl list runtimes` |
| Physical iPhone not seen | USB passthrough and `usbfluxd` note in Docker-OSX; verify host USB access |

## Legal

Apple's macOS EULA does not permit installing macOS on non-Apple hardware.
The container projects document this limitation. Run macOS virtualization only
on hardware you are entitled to use, and keep the guest isolated.
