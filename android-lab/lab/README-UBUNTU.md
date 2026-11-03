# Android lab on Ubuntu Server

This is the Ubuntu Server runbook for `android-lab`. It uses the same compose
stack, workflow scripts and Frida hooks as the Linux/Windows runbooks, and adds
a host setup script plus a readiness/wrapper workflow for a headless server.

The lab needs KVM for the Android emulator. If the host has no `/dev/kvm`, the
static analysis path still works (MobSF, JADX, apktool, radare2 in containers).

## Requirements

| Item | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 22.04/24.04/26.04 Server | latest Ubuntu LTS |
| CPU | x86_64 with VT-x/AMD-V | 4+ cores |
| RAM | 8 GB | 16 GB |
| Disk | 20 GB free | 40 GB+ |
| Runtime | Docker Engine + Compose | Docker Engine |
| Host tools | `curl`, `tar`, `adb` | plus Python venv for Frida |

The Android emulator images are x86_64. On ARM hosts they run under full
emulation and are not practical; use an x86_64 host with KVM.

## Quick start

```bash
cd lab
cp .env.example .env
./setup.sh                  # = sudo make setup
newgrp docker               # or log out/in so group changes apply
make preflight              # OS / KVM / docker / adb / ports / disk
make boot                   # start stack, wait for emulator "ready"
```

The lab exposes:

| Service | URL / port | Purpose |
|---|---|---|
| noVNC | `http://<server-ip>:6080/` | Emulator screen |
| ADB | `127.0.0.1:5555` | Device bridge |
| MobSF | `http://<server-ip>:8000/` | Static + dynamic scanner |
| mitmweb | `http://<server-ip>:8081/` | Live traffic UI |
| mitmproxy | `127.0.0.1:8080` | HTTP(S) proxy |
| tools | `make shell` / compose exec | JADX, apktool, radare2 |

`./run.sh` is a wrapper for `make boot`; `./run.sh --static` starts only the
KVM-free services.

## Profiles and management

From the repository root, `labctl` is the recommended server interface:

```bash
./labctl android profiles
./labctl android profile use lightweight   # static; no KVM needed
./labctl android doctor --profile lightweight
./labctl android start --wait
./labctl android status
./labctl android monitor                   # live CPU/RAM/endpoints
./labctl android restart
./labctl android stop
```

| Profile | Mode | CPU | RAM |
|---|---|---:|---:|
| `lightweight` | static | 1 | 2g |
| `development` | dynamic | 2 | 4g |
| `performance` | dynamic | 4 | 6g |

`profile use` writes the preset into `.env`; `--profile P` applies it to one
command only. Hardware changes use `./labctl android resize`, which writes host
CPU/RAM limits and the emulator device profile, then recreates the stack with
`--apply`.

## What setup does

`scripts/setup-ubuntu.sh` (run via `./setup.sh` or `sudo make setup`):

1. Installs `cpu-checker`, `adb`, `curl`, `git`/archive basics, Python venv,
   `ufw` and network tools.
2. Loads and persists the `kvm` / `kvm_intel` (or `kvm_amd`) modules.
3. Installs Docker Engine via `get.docker.com` when no usable runtime exists.
4. Adds the invoking user to the `docker` and `kvm` groups.
5. Creates `apks/`, `artifacts/`, `frida/` and `tools/`.
6. Optionally pulls images (`PULL_IMAGES=yes`) and builds `.venv`
   (`SETUP_PYTHON=yes`), and optionally opens the web ports
   (`OPEN_FIREWALL=yes`). Defaults are off.

Group membership only applies to new sessions. After setup, run `newgrp docker`
or log out and back in.

## KVM checks

```bash
grep -m1 -oE 'vmx|svm' /proc/cpuinfo
sudo apt-get install -y cpu-checker
sudo modprobe kvm kvm_intel        # or kvm_amd
sudo kvm-ok                        # "KVM acceleration can be used"
ls -l /dev/kvm                     # crw-rw---- root kvm
sudo usermod -aG kvm "$USER"       # re-login
```

If the host is itself a VM, nested virtualisation must be enabled. If
`/dev/kvm` is missing, only the static stack is usable.

## Static-only mode (no KVM)

`docker-compose.win.yml` defines the KVM-free services and is the right path on
laptops, Windows/Podman hosts, or servers without KVM:

```bash
make static-up       # mobsf + mitmproxy + tools
make wf1 APK=app.apk
make static-down
```

`./run.sh --static` does the same start and prints the URLs. The
`lightweight` profile is the same mode, with one-shot setup:

```bash
./labctl android profile use lightweight
./labctl android start --wait
```

Dynamic analysis (WF2) needs the emulator and therefore KVM.

## Workflows

**WF1 static** - `make wf1 APK=path/to/app.apk`
Uploads to MobSF, runs the scan (JSON + PDF), then decompiles with JADX in the
tools container. Artifacts land in `artifacts/<app>-static-<stamp>/`.

**WF2 dynamic** - `make wf2 APK=path/to/app.apk PKG=com.example.app`
Boots the emulator, installs the APK, routes traffic through mitmproxy, launches
the app, and starts `frida-server` if `frida/frida-server` exists.

**Frida hook** - `make hook PKG=com.example.app HOOK=hooks/ssl-pinning-bypass.js`
Uses `.venv/bin/frida` when the venv exists, otherwise `frida` on PATH.

To enable runtime hooking, download the x86_64 `frida-server` matching your
`frida` CLI from <https://github.com/frida/frida/releases> and put it at
`frida/frida-server` (the scripts copy it into the emulator).

**Report** - `make report`
Sweeps device state, logcat, container logs and mitm flows into
`artifacts/report-<stamp>/`.

## Ports, firewall and SSH tunnels

With `ufw` active, the web UIs are blocked until allowed:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 6080 proto tcp   # noVNC
sudo ufw allow from 192.168.1.0/24 to any port 8000 proto tcp   # MobSF
sudo ufw allow from 192.168.1.0/24 to any port 8081 proto tcp   # mitmweb
```

Do not expose ADB (5555) or the emulator console (5554) to an untrusted network.
Prefer tunnels:

```bash
ssh -L 6080:127.0.0.1:6080 -L 8000:127.0.0.1:8000 \
    -L 8080:127.0.0.1:8080 -L 8081:127.0.0.1:8081 \
    -L 5555:127.0.0.1:5555 user@server
```

`OPEN_FIREWALL=yes` in `.env` (or the environment) opens the web ports only,
never 5555.

## Run at boot (systemd)

```bash
sudo make install-service
sudo systemctl status android-lab
```

The unit runs `docker compose up -d` in the lab directory. Remove it with
`sudo make uninstall-service`. Auto-starting the emulator is heavy; on a shared
server you may prefer manual starts.

## Common commands

```bash
make help
make setup                 # host setup (sudo)
make setup-python          # .venv + requirements.txt
make pull                  # pull images
make preflight
make up / make boot
make status
make logs                  # emulator logs
make shell                 # shell inside the tools container
make install APK=app.apk   # install into the emulator
make adb                   # adb shell in the emulator
make wf1 APK=app.apk
make wf2 APK=app.apk PKG=com.example
make hook PKG=com.example HOOK=hooks/ssl-pinning-bypass.js
make report
make clean                 # remove artifacts (keeps .gitkeep)
```

## Troubleshooting

### `/dev/kvm` permission denied

```bash
id
ls -l /dev/kvm
sudo usermod -aG kvm "$USER"
newgrp kvm        # or log out/in
```

### Emulator never reports ready

```bash
make logs
docker compose exec -T android cat device_status
```

Check KVM access, host RAM, and that port 5555/6080 are free. The first boot
pulls a 2-3 GB image and can take several minutes. `wait-boot.sh` times out
after 600 seconds by default; rerun `make boot` if the image is still pulling.

### MobSF not reachable

`make wf1` starts MobSF and waits up to 180 seconds. Check:

```bash
docker compose logs --tail=100 mobsf
curl -I http://127.0.0.1:8000/
```

The API key comes from `.env` (`MOBSF_API_KEY`) and must match the container.

### Ports already in use

`make preflight` checks 6080, 5554, 5555, 8000, 8080, 8081. Stop the conflicting
service or edit `docker-compose.yml`.

### Docker permission denied

You are not in the `docker` group in this session. Run `newgrp docker` or log
out/in. `sudo make ...` also works but leaves root-owned artifacts.

### Disk pressure

The emulator image, MobSF data and artifacts grow quickly. Prune with
`make clean`, `docker image prune`, and `docker volume prune` when the lab is
stopped. Do not prune volumes while a scan or capture is in progress.

### Static analysis only

If KVM is unavailable, use `make static-up` / `./run.sh --static` and run WF1.
Dynamic workflows require the emulator.

## Layout

```
lab/
├── docker-compose.yml       # android + mobsf + mitmproxy + tools
├── docker-compose.win.yml   # KVM-free subset for static work
├── .env.example             # EMULATOR_DEVICE, ANDROID_TAG, MOBSF_API_KEY
├── Makefile                 # all targets above
├── setup.sh / run.sh        # Ubuntu wrappers
├── scripts/
│   ├── setup-ubuntu.sh      # host setup
│   ├── preflight.sh         # OS / KVM / docker / adb / ports / disk
│   ├── wait-boot.sh         # wait for emulator readiness
│   ├── wf1-static.sh        # MobSF + JADX
│   ├── wf2-dynamic.sh       # emulator + mitm + frida
│   ├── report.sh            # artifact sweep
│   ├── setup-docker-android.sh  # in-guest bootstrap (VM/Podman path)
│   ├── install-service.sh   # systemd unit
│   └── uninstall-service.sh
├── hooks/                   # Frida scripts
├── tests/                   # Python tests
├── tools/platform-tools/    # portable adb.exe and friends (Windows path)
├── apks/  artifacts/  frida/
```

See `../knowledge/`, `../docker-android-cheat-sheet.md` and
`README-WINDOWS.md` for the platform research, command reference and the
zero-admin Windows path.
