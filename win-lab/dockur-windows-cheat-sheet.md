# dockur/windows cheat sheet (win-lab)

Verified command reference for running Windows in a Docker container on a Linux
host with KVM. Image name is `dockurr/windows` (double `r`); repository is
`dockur/windows`. Commands assume the `win-lab/` directory unless stated otherwise.

## 0. Host prerequisites

```bash
grep -m1 -oE 'vmx|svm' /proc/cpuinfo     # CPU virtualization flag
sudo apt install -y cpu-checker
sudo modprobe kvm && sudo modprobe kvm_intel   # or kvm_amd
sudo kvm-ok                              # "KVM acceleration can be used"
ls -l /dev/kvm                           # crw-rw---- root kvm
sudo usermod -aG kvm "$USER"             # re-login afterwards
```

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
docker compose version
```

Minimum: 2 GB free RAM, 32 GB free disk, outbound HTTPS. Docker Desktop is not
supported because it does not expose `/dev/kvm`.

## 1. Start with compose (lab default)

```yaml
services:
  windows:
    image: dockurr/windows
    container_name: windows
    environment:
      VERSION: "11"
    devices:
      - /dev/kvm
      - /dev/net/tun
    cap_add:
      - NET_ADMIN
    ports:
      - 8006:8006
      - 3389:3389/tcp
      - 3389:3389/udp
    volumes:
      - ./windows:/storage
    restart: unless-stopped
    stop_grace_period: 2m
```

```bash
docker compose up -d
docker compose logs -f
docker compose down
```

## 2. Start with docker run (minimal)

```bash
docker run -it --rm --name windows \
  -e "VERSION=11" \
  -p 8006:8006 \
  -p 3389:3389/tcp -p 3389:3389/udp \
  --device=/dev/kvm --device=/dev/net/tun \
  --cap-add NET_ADMIN \
  -v "${PWD:-.}/windows:/storage" \
  --stop-timeout 120 \
  docker.io/dockurr/windows
```

Open `http://127.0.0.1:8006/`. Installation is automatic. The web viewer is for
installation; use RDP for daily use.

## 3. Lab lifecycle

```bash
make preflight                 # read-only checks
sudo make setup                # KVM + Docker + groups + dirs
make boot                      # up + wait for web viewer
make wait-install              # wait for storage/windows.boot
make status
make logs
make rdp                       # print RDP credentials/command
make smb                       # show shared folder
make restart
make update                    # pull + recreate
make down                      # graceful stop
make backup FULL=1
make restore FILE=backups/win-lab-....tar.gz
make reset CONFIRM=yes         # DESTROY disks
```

Readiness:

| Signal | Meaning |
|---|---|
| `docker compose ps` -> `Up` | QEMU started |
| `curl -I http://127.0.0.1:8006/` -> 200 | web viewer up (also true during install) |
| `storage/windows.boot` exists | Windows installation finished |
| log `Windows started successfully` | QEMU reached the guest boot stage (not install completion) |

## 4. Windows versions (`VERSION`)

| Value | Version | Size |
|---|---|---|
| `11` | Windows 11 Pro (default) | 7.9 GB |
| `11l` | Windows 11 LTSC | 4.7 GB |
| `11e` | Windows 11 Enterprise | 6.6 GB |
| `10` / `10l` / `10e` | Windows 10 Pro / LTSC / Enterprise | 5.7 / 4.6 / 5.2 GB |
| `8e` | Windows 8.1 Enterprise | 3.7 GB |
| `7u` | Windows 7 Ultimate | 3.1 GB |
| `vu` | Windows Vista Ultimate | 3.0 GB |
| `xp` | Windows XP Professional | 0.6 GB |
| `2k` / `me` / `98` / `95` | legacy | 0.4-0.7 GB |
| `2025` / `2022` / `2019` / `2016` | Windows Server | 7.6 / 6.0 / 5.3 / 6.5 GB |
| `2012` / `2008` / `2003` | Windows Server legacy | 4.3 / 3.0 / 0.6 GB |
| `core11` / `tiny11` / `tiny10` | Tiny images | 3.0 / 5.3 / 3.6 GB |
| `reactos` | ReactOS | 0.1 GB |

Custom media: `VERSION=<ISO URL>` or bind `./example.iso:/custom.iso` (VERSION
is then ignored). ARM64: use `dockur/windows-arm`.

## 5. Common environment variables

| Variable | Default | Purpose |
|---|---|---|
| `VERSION` | `11` | Windows release or ISO URL |
| `EDITION` | | e.g. `core` for Server Core |
| `LANGUAGE` | `en-US` | Display language |
| `REGION` / `KEYBOARD` | from language | Locale / layout |
| `USERNAME` / `PASSWORD` | `Docker` / `admin` | Windows account |
| `DOMAIN` / `DOMAIN_OU` / `WORKGROUP` | | Domain join / workgroup |
| `CPU_CORES` | `2` | vCPUs (`4`, `half`, `max`) |
| `RAM_SIZE` | `4G` | Guest RAM |
| `KVM` / `HV` | `Y` / `Y` | KVM acceleration / Hyper-V enlightenments |
| `DISK_SIZE` | `64G` | Primary disk virtual size |
| `DISK_FMT` | `raw` | `raw` or `qcow2` |
| `DISK_TYPE` / `DISK_CACHE` / `DISK_IO` | `scsi` / `none` / `native` | Disk tuning |
| `ALLOCATE` | `N` | Preallocate disk |
| `NETWORK` | NAT | `nat`, `user`, or `N` |
| `DHCP` | `N` | macvtap + router DHCP |
| `ADAPTER` | `virtio-net-pci` | virtio by default |
| `WEB` / `WEB_PORT` | `Y` / `8006` | Web viewer |
| `PROTECT` | `N` | Basic auth on web viewer |
| `AUDIO` | `N` | Stream audio to browser |
| `SAMBA` / `SHORTCUT` | `Y` / `Y` | Shared folder + shortcuts |
| `SHUTDOWN` / `TIMEOUT` | `Y` / `105` | Graceful ACPI shutdown |
| `REMOVE` | `Y` | Delete ISO after install |
| `CONNECTIONS` | `4` | ISO download connections |
| `VERIFY` | `N` | Verify media checksums |
| `COMMAND` | | Command at final install step |
| `DEBUG` / `TRACE` | `N` / `N` | Verbose output |
| `ARGUMENTS` | | Extra raw QEMU args |

Full list: `docs/environment.md` upstream.

## 6. Storage and sharing

| Container path | Host (lab default) | Purpose |
|---|---|---|
| `/storage` | `./storage` | Disk, ISO cache, state markers |
| `/shared` | `./shared` | Guest `Z:` / `Shared` folder |
| `/oem` | `./oem` | Copied to `C:\OEM`, runs `install.bat` |
| `/custom.iso` | `./custom.iso` | Local installation media |

Additional disks:

```yaml
environment:
  DISK2_SIZE: "32G"
volumes:
  - ./storage2:/storage2
```

Raw disk passthrough (destructive on `/disk1`):

```yaml
devices:
  - /dev/sdb:/disk1
  - /dev/sdc1:/disk2
```

## 7. Networking

Default NAT:

```bash
docker compose port windows 8006
curl -I http://127.0.0.1:8006/
```

macvlan (own LAN IP):

```bash
docker network create -d macvlan \
  --subnet=192.168.1.0/24 --gateway=192.168.1.1 \
  --ip-range=192.168.1.100/28 -o parent=eth0 vlan
```

Then attach the service to `vlan` with `ipv4_address: 192.168.1.100`. Macvlan
containers cannot reach the Docker host directly.

DHCP (Windows gets a router lease):

```yaml
environment:
  DHCP: "Y"
devices:
  - /dev/vhost-net
device_cgroup_rules:
  - 'c *:* rwm'
```

Firewall (Ubuntu):

```bash
sudo ufw allow from 192.168.1.0/24 to any port 8006 proto tcp
sudo ufw allow from 192.168.1.0/24 to any port 3389 proto tcp
```

Prefer SSH tunnels over exposing ports:

```bash
ssh -L 8006:127.0.0.1:8006 -L 3389:127.0.0.1:3389 user@server
```

## 8. RDP and shared folder

- RDP: `<server-ip>:3389`, user/password from `.env` (default `Docker`/`admin`).
- Linux client: `xfreerdp /v:<server> /u:Docker /p:<password> /dynamic-resolution`.
- Host shared folder: `win-lab/shared/`; guest: drive `Z:` or `\\<guest>\Shared`.

## 9. Backup and restore

```bash
docker compose down
tar -czf win-lab-storage.tar.gz storage .env docker-compose.yml
docker compose up -d
```

```bash
mv storage storage.old
tar -xzf win-lab-storage.tar.gz
docker compose up -d
```

The lab scripts do this with `make backup` / `make restore FILE=...` and stop
the guest for consistency.

## 10. Resize disk

1. Increase `DISK_SIZE` (never decrease).
2. Restart the container.
3. Extend the volume in Windows Disk Management (new space is unallocated).

## 11. Troubleshooting

| Symptom | Check / fix |
|---|---|
| `failed to initialize kvm: Permission denied` | `id`, `ls -l /dev/kvm`, add user to `kvm`, re-login |
| KVM unavailable even though `kvm-ok` passes | container `/dev/kvm` access; try temporary `privileged: true` |
| No bootable device / boot loop | install still running, or disk corrupted by hard stop; move `storage/` aside and reinstall |
| ISO download fails | outbound HTTPS/DNS/disk; `CONNECTIONS=1`, `VERIFY=Y`, explicit URL or local ISO |
| Very slow guest | confirm KVM in logs, more cores/RAM, fast SSD, use RDP |
| RDP refused | install not finished (`storage/windows.boot`), guest firewall, service disabled |
| Web viewer blank | early boot normal; `make logs`; check browser console and `WEB_PORT` |
| Container restart loop | logs, exit code, free disk, host RAM, KVM permissions |
| Wrong device formatted | never attach USB/disk passthrough before installation finishes |

Diagnostics:

```bash
docker compose ps
docker compose logs --tail=500 windows
docker inspect win-lab --format '{{.State.Status}} {{.Config.Image}}'
df -h . && free -h
ls -lah storage/
```

## 12. Points to remember

- Image is `dockurr/windows`; repo is `dockur/windows`.
- KVM is mandatory for usable performance.
- First boot is automatic but slow; installation completion is marked by
  `storage/windows.boot`.
- All guest state is in `storage/`; back it up cold.
- Do not expose RDP to the internet; isolate untrusted guests.
- The project ships code, not Windows; licensing is your responsibility.
