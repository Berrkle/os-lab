# Operations

## Lifecycle (Ubuntu container)

```bash
make preflight
make boot                 # start + wait for web viewer
make status
make logs
make down
make restart
make update               # pull image, recreate
```

`make up` starts without waiting. `make boot` waits up to `WEB_WAIT_TIMEOUT`
seconds for the web viewer. The viewer is available during installation, so it
is not a proof that macOS or Xcode is ready.

With the repository-level CLI:

```bash
../labctl ios profiles
../labctl ios profile use performance
../labctl ios start --wait
../labctl ios monitor
../labctl ios stop
```

## Changing hardware

CPU and RAM are applied on recreate. The disk is persistent and should only
grow.

```bash
make down
../labctl ios resize --cpus 8 --ram 12G
../labctl ios start --wait
```

For disk growth, increase `DISK_SIZE` and recreate; macOS should see the new
unallocated space and you extend the APFS container in Disk Utility. Always
back up first:

```bash
make backup FULL=1
make down
../labctl ios resize --disk 192G
../labctl ios start
```

Disk values below the current size are refused by `labctl` because shrinking a
live macOS disk is not supported.

## Backups

```bash
make backup              # .env, compose files, profiles, storage/
make backup FULL=1       # also shared/
make restore FILE=backups/ios-lab-20260101-120000.tar.gz
```

The container is stopped for a crash-consistent backup unless `--live` is
passed directly to `scripts/backup.sh`. Restore moves the old `storage/` aside
to `storage.bak-<stamp>`; it does not delete it.

## Reset

```bash
make reset CONFIRM=yes
```

This destroys `storage/` and forces a fresh macOS install. It does not touch
`shared/` or `backups/`.

## Shared folder

Inside macOS:

```bash
sudo -S mount_9p shared
```

Use Finder **Go > Computer** or `/Volumes` to access it. Move `.ipa` files and
Xcode downloads through `shared/` rather than copying large files over VNC.

## Appium

For the Docker path, run Appium inside the macOS guest. For native macOS:

```bash
make mac-appium
make mac-status
make mac-appium-stop
```

The XCUITest driver builds WebDriverAgent on first session. Keep Xcode
installed and accept its licence or Appium will fail to sign/build.

## Monitoring

```bash
../labctl ios monitor
```

Shows container state, CPU/RAM, web/VNC endpoints, storage size and host free
space. `status` is a one-shot version.

## Updating

```bash
make update
```

This pulls the latest `dockurr/macos` image and recreates the container. The
guest disk in `storage/` is preserved. Read upstream release notes before a
major macOS version change.

## Snapshots and clones

The base compose lab does not manage snapshots. Options:

- Stop the container, archive `storage/`, then restart.
- Use `storage/` on a filesystem with snapshots (ZFS/btrfs/LVM).
- Use `cocoon-macos` if clone-per-run and snapshotting are requirements.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Container exits immediately | `make logs`; check `/dev/kvm`, memory, `docker-compose.yml` |
| Web viewer password not working | adjust `WEB_PROTECT`; restart |
| macOS runs out of disk | grow `DISK_SIZE`, recreate, extend APFS in Disk Utility |
| Simulator stutters | reduce resolution, enable `GPU=Y` on supported hardware, close other VMs |
| Appium cannot build WDA | open Xcode once, accept licence, verify `xcodebuild -version` |
| Time drift/sleep in guest | check QEMU/OpenCore settings; reboot the guest |
