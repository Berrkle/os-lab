# Deploying win-lab on Ubuntu Server

This is the verified deployment path for a headless Ubuntu Server host. The
result is a Windows guest reachable at `http://<server-ip>:8006/` (web desktop)
and, after installation, over RDP on `3389`.

The quickest path uses the scripts in `../win-lab/`:

```bash
cd win-lab
cp .env.example .env
make preflight          # read-only environment check
sudo make setup         # install KVM/Docker, create dirs, groups
newgrp docker            # or log out/in, so group membership applies
make boot                # start and wait for the web UI
make wait-install        # wait for /storage/windows.boot (installation done)
```

The sections below explain each step and the equivalent manual commands.

## 1. Host requirements

| Item | Minimum | Recommended |
|---|---|---|
| OS | Ubuntu 22.04/24.04 Server (26.04 also works) | latest Ubuntu LTS Server |
| CPU | x86_64 with VT-x/AMD-V | 4+ cores |
| RAM | 2 GB free | 8-16 GB free |
| Disk | 32 GB free | 100 GB+ SSD |
| Network | outbound HTTPS | wired, stable, unmetered |

Check the CPU exposes virtualisation:

```bash
grep -m1 -oE 'vmx|svm' /proc/cpuinfo   # vmx = Intel, svm = AMD
```

If this prints nothing, enable VT-x/AMD-V in BIOS/UEFI. If Ubuntu itself is a
VM, the hypervisor must expose nested virtualisation.

## 2. Install KVM and verify `/dev/kvm`

```bash
sudo apt-get update
sudo apt-get install -y cpu-checker
sudo modprobe kvm
sudo modprobe kvm_intel    # or kvm_amd
sudo kvm-ok                # expect: "KVM acceleration can be used"
ls -l /dev/kvm             # expect a character device, group kvm
```

Persist the module across reboots:

```bash
echo -e "kvm\nkvm_intel" | sudo tee /etc/modules-load.d/kvm.conf
# use kvm_amd instead of kvm_intel on AMD hosts
```

`make setup` performs all of the above and adds your user to the `kvm` group.
Access to `/dev/kvm` is group-based (`crw-rw---- root:kvm`). If you skip the
group step, the container will fail to start with a KVM permission error even
though `kvm-ok` succeeds on the host.

## 3. Install Docker Engine

Install Docker Engine (not Docker Desktop) and the Compose plugin:

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

Log out and back in (or run `newgrp docker`) before using Docker as a non-root
user. Verify:

```bash
docker version
docker compose version
```

`make setup` installs Docker only when it is missing, so an existing Engine is
left alone. Podman with a Compose provider is also usable; the lab scripts
detect `docker` first and then `podman`.

## 4. Create the lab directories

```bash
cd win-lab
mkdir -p storage shared oem backups
cp .env.example .env
```

- `storage/` is the VM disk, ISO cache and state markers.
- `shared/` appears as `Z:` and the `Shared` desktop folder in Windows.
- `oem/` is copied to `C:\OEM` and `install.bat` is run at the end of setup.
- `backups/` holds archives produced by `make backup`.

## 5. Configure `.env`

The important values:

```dotenv
VERSION=11              # or 11l, 10, 2022, tiny11, a URL, ...
RAM_SIZE=4G
CPU_CORES=2
DISK_SIZE=64G
WINDOWS_USER=Docker
WINDOWS_PASSWORD=admin
WEB_PORT=8006
RDP_PORT=3389
```

Change `WINDOWS_PASSWORD` before first boot. It is the Windows account password
and, with `PROTECT=Y`, also the web viewer password.

Do not change `DISK_SIZE` downwards after installation. Increasing it is safe
but Windows must extend the partition afterwards.

## 6. Open ports (optional)

If `ufw` is active, the web viewer and RDP are blocked until allowed:

```bash
sudo ufw allow 8006/tcp
sudo ufw allow 3389/tcp
sudo ufw allow 3389/udp
```

Prefer restricting to a management network:

```bash
sudo ufw allow from 192.168.1.0/24 to any port 8006 proto tcp
```

Never expose RDP directly to the public internet. Use a VPN, an SSH tunnel or a
reverse proxy with authentication:

```bash
ssh -L 8006:127.0.0.1:8006 user@server
ssh -L 3389:127.0.0.1:3389 user@server
```

The default web viewer has no authentication. Set `PROTECT=Y` in `.env` to
enable HTTP basic auth using `WINDOWS_USER` / `WINDOWS_PASSWORD`.

## 7. First boot and installation

```bash
make preflight
make boot        # starts the container and waits for http://127.0.0.1:8006/
```

Follow progress at `http://<server-ip>:8006/`. The first boot downloads the
installation media and installs Windows automatically. Expect 20-60+ minutes.

Check status in another terminal:

```bash
make status
make logs        # live container log
```

Wait for completion:

```bash
make wait-install   # waits for storage/windows.boot, default timeout 2h
```

The marker file is only created after Windows setup has finished. Do not use
"web UI responds" as proof of installation; the viewer responds during setup.

## 8. Connect to Windows

- Web desktop: `http://<server-ip>:8006/` (fine for installation, slower than
  RDP, no clipboard integration).
- RDP: host `<server-ip>:3389`, user and password from `.env`.
  - Linux: `xfreerdp /v:<server-ip> /u:Docker /p:admin /dynamic-resolution`
  - macOS: Microsoft Remote Desktop
  - Windows: `mstsc`
- Shared folder: `\\<server-ip>\Shared` or drive `Z:` inside the guest.
  On the host the files are in `win-lab/shared/`.

## 9. Run on every boot (systemd)

`make install-service` writes a systemd unit that runs
`docker compose up -d` in `win-lab/` at boot. The container itself has
`restart: unless-stopped`, so either mechanism restarts it after a host reboot.

```bash
sudo make install-service
sudo systemctl status win-lab
```

Remove it with `sudo make uninstall-service`.

## 10. Verify the deployment

```bash
make preflight          # all checks green
make status             # container Up, port 8006 listening
curl -fsSI http://127.0.0.1:8006/ | head -1
ls -lh storage/windows.boot
```

Then connect over RDP and confirm the desktop, the `Shared` folder and outbound
network access.

## Manual compose reference

Without the Makefile:

```bash
cd win-lab
docker compose up -d
docker compose ps
docker compose logs -f
docker compose down
```

The compose file maps only `8006` and `3389`; all other guest traffic travels
through the container's NAT. See `networking.md` for macvlan and DHCP modes.
