# Operating win-lab

This is the day-2 runbook: lifecycle, readiness signals, storage, backup,
resizing, updates and troubleshooting. Commands assume you are in `win-lab/`.

## Lifecycle

| Action | Command | Notes |
|---|---|---|
| Start | `make up` | Returns immediately |
| Start + wait for web | `make boot` | Polls `http://127.0.0.1:8006/` |
| Wait for installation | `make wait-install` | Waits for `storage/windows.boot` |
| Status | `make status` | Compose state, port, marker |
| Logs | `make logs` | Follow container output |
| Shell in container | `make shell` | Debugging only |
| Stop | `make down` | Graceful ACPI shutdown, up to 2 min |
| Restart | `make restart` | `down` then `up` |
| Update image | `make update` | Pull, then recreate |
| Delete VM | `make reset CONFIRM=yes` | Destroys disks; irreversible |

Always prefer `make down` over killing the container. The image sets
`SHUTDOWN=Y` and gives Windows up to `TIMEOUT` seconds (default 105) to shut
down; the compose file uses a 2 minute stop grace period. A hard kill can leave
the NTFS volume dirty and trigger a boot-time check.

## Readiness signals

There are three different kinds of "ready":

1. **Container running** - `docker compose ps` shows `Up`. This only means QEMU
   started.
2. **Web viewer reachable** - `curl http://127.0.0.1:8006/` returns HTTP 200.
   This happens during installation too.
3. **Windows installed** - `storage/windows.boot` exists. The upstream
   entrypoint writes this marker after a successful installation and uses it to
   decide whether to boot the installed disk or the installer. This is what
   `make wait-install` polls.

`make status` reports all three. The log line `Windows started successfully`
appears when QEMU reaches the guest boot stage; it is not proof that Windows
setup finished.

## Storage layout

Everything the guest owns lives under `win-lab/storage/`:

| Path | Purpose |
|---|---|
| `storage/windows.raw` (or `.qcow2`) | Primary Windows disk |
| `storage/windows.boot` | Installation-complete marker |
| `storage/windows.ver` | Installed version metadata |
| `storage/*.iso` | Downloaded media, deleted after install when `REMOVE=Y` |
| `storage/*.vars` | UEFI NVRAM variables |
| `storage/serial.sock` etc. | Optional QEMU sockets when enabled |

`DISK_FMT=raw` is the default. `raw` is simple and fast; `qcow2` supports
snapshots and growth but has a small overhead. `DISK_SIZE` controls the virtual
size, not the current file size. With `ALLOCATE=N` the disk file grows as
Windows writes to it. Enable `DISCARD=unmap` (default) and periodic TRIM inside
Windows to reclaim space.

The downloaded ISO is the other large consumer. Keep `REMOVE=Y` (default) unless
you plan to rebuild, or cache a local ISO and mount it at `/custom.iso`.

## Backup and restore

The VM is defined entirely by `win-lab/storage/` plus the configuration in `.env`
and `docker-compose.yml`.

Recommended backup:

```bash
make backup            # stops the guest, archives storage/ and config into backups/
make backup --full     # include shared/ and oem/ as well
```

Restore:

```bash
make restore FILE=backups/win-lab-20260101-120000.tar.gz
```

A cold backup (container stopped) is consistent. Copying `windows.raw` while
Windows is running can capture a dirty filesystem; if you must do that, use a
filesystem snapshot (LVM/ZFS/btrfs) or a live backup tool inside the guest.

Offline manual copy:

```bash
docker compose down
tar -C . -czf /path/to/win-lab-storage.tar.gz storage
docker compose up -d
```

## Resizing the disk

1. Set a larger `DISK_SIZE` in `.env` (never smaller).
2. `make restart`.
3. The added space appears as unallocated in Windows Disk Management; extend
   the volume there.

To convert formats, create a new disk and reinstall, or use QEMU tools against
the stopped image. Keep a backup first.

## Updating the container

```bash
make update            # docker compose pull && up -d
```

Pin `IMAGE_TAG` in `.env` for reproducible deployments (for example `6.06`)
instead of `latest`. Updates to the image do not touch `storage/`, but read the
release notes if the state layout or default firmware changes.

## Changing CPU / RAM

Edit `CPU_CORES` and `RAM_SIZE`, then `make restart`. The guest must be shut
down first; the values are QEMU arguments. For hosts that run other services,
enable memory ballooning:

```dotenv
BALLOONING=Y
BALLOONING_MIN_MEM=33%
```

Ballooning reclaims unused guest RAM based on host pressure but is not a
substitute for right-sizing the guest. `RAM_CHECK=Y` refuses to start if the
host cannot provide the configured memory.

## Networking quick reference

Default is NAT: the guest shares the host IP, and only explicitly mapped ports
are reachable from outside. See `networking.md` for macvlan/DHCP and isolation.

- Web viewer: `WEB_PORT` (8006)
- RDP: 3389/tcp and 3389/udp
- Shared folder: SMB inside the guest; not exposed on the host by default

## Troubleshooting

### `qemu-system-x86_64: -accel kvm: failed to initialize kvm: Permission denied`

Your user cannot open `/dev/kvm`. Check groups and re-login:

```bash
id
ls -l /dev/kvm
sudo usermod -aG kvm "$USER"
newgrp kvm
```

### `KVM not available` despite `kvm-ok` succeeding

Usually a device/group problem or a missing `/dev/kvm` in the container. Verify:

```bash
docker compose exec windows ls -l /dev/kvm
```

Temporarily adding `privileged: true` can distinguish a permission issue from a
missing device, but do not keep it as a permanent setting.

### Boot loops or "no bootable device"

- The installation may still be in progress; watch the web viewer and logs.
- A hard shutdown mid-install can corrupt the disk. Reinstall by moving
  `storage/` aside and starting again.
- If you mount USB/disk passthrough before installation finishes, the wrong
  device can be selected. Disconnect it and reinstall.

### ISO download fails

Check outbound HTTPS, DNS and disk space. `MIDO=Y` downloads directly from
Microsoft and is sensitive to region/CDN issues. Options:

```dotenv
CONNECTIONS=1          # fewer parallel connections
VERIFY=Y               # check media checksums (slower)
VERSION=https://...iso # explicit mirror
```

Then `make restart`. A local ISO mounted at `win-lab/custom.iso:/custom.iso`
bypasses the downloader entirely.

### Windows is very slow

- Confirm KVM is actually used: logs should not mention TCG.
- Give the guest more cores/RAM if the host has capacity.
- Prefer `DISK_CACHE=none` with a fast SSD; avoid network storage for the disk.
- RDP is much more responsive than the browser viewer.

### RDP refused

RDP is available only after Windows has finished installing and booted. Confirm
`storage/windows.boot`, then check the guest firewall and that the service is
enabled. Use the web viewer for the initial setup and to enable RDP if needed.

### Container restarts in a loop

```bash
docker compose logs --tail=200 windows
docker inspect win-lab --format '{{.State.ExitCode}}'
```

Common causes: not enough free disk, not enough host RAM (`RAM_CHECK`), KVM
permission, or a corrupted disk after a hard stop.

### Web viewer shows nothing

The viewer is a noVNC canvas; a blank page during early boot is normal. Check
`make logs` and the browser console. If you changed `WEB_PORT`, use the new port
and confirm the host firewall allows it.

### Collect diagnostics

```bash
make status
docker compose logs --tail=500 windows > artifacts-windows.log
ls -lah storage/
df -h .
free -h
```

Include the container version (`docker inspect win-lab --format '{{.Config.Image}}'`)
and whether `/dev/kvm` is accessible when reporting issues upstream.

## Useful environment variables

See `../knowledge/draft.md` and the upstream `docs/environment.md` for the full
list. The ones most used in a lab:

| Variable | Default | Use |
|---|---|---|
| `VERSION` | `11` | Windows release or ISO URL |
| `RAM_SIZE` | `4G` | Guest RAM |
| `CPU_CORES` | `2` | Guest vCPUs |
| `DISK_SIZE` | `64G` | Primary disk virtual size |
| `DISK_FMT` | `raw` | `raw` or `qcow2` |
| `USERNAME` / `PASSWORD` | `Docker` / `admin` | Windows account |
| `LANGUAGE` / `KEYBOARD` / `REGION` | `en-US` | Locale |
| `PROTECT` | `N` | Basic auth on web viewer |
| `SAMBA` | `Y` | Shared folder |
| `DEBUG` | `N` | Verbose entrypoint output |
| `SHUTDOWN` | `Y` | Graceful ACPI shutdown |
| `TIMEOUT` | `105` | Shutdown timeout (seconds) |
