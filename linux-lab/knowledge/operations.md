# linux-lab operations

Day-to-day lifecycle, state, backup and recovery.

## Lifecycle

```bash
make up            # start (no wait)
make boot          # start + wait for the web viewer
make wait-ready    # wait for the web viewer and SSH
make status        # compose state, endpoints, boot marker, storage
make logs          # follow container logs
make shell         # shell inside the QEMU container (debugging, not the guest)
make ssh           # print guest SSH details
make down          # graceful ACPI shutdown
make restart       # recreate using the current .env
make update        # pull image + recreate
```

Or drive everything through `../labctl linux <command>`.

## State model

All guest state lives in `storage/` (the virtual disk, ISO cache and the
`linux.ready` marker). Configuration is `.env` plus `docker-compose.yml`. There
is no hidden state — copy `storage/` and `.env` and you have copied the lab.

## Backup and restore

```bash
make backup                 # archive .env, docker-compose.yml, storage/
make backup FULL=1          # also include shared/
make restore FILE=backups/linux-lab-YYYYmmdd-HHMMSS.tar.gz
```

`backup.sh` stops the container for a crash-consistent archive (use `--live`
to skip). `restore.sh` moves the current `storage/` aside to `storage.bak-*`
before extracting, so a restore is reversible.

## Reset / re-provision

```bash
make reset CONFIRM=yes       # destroy storage/, re-provision on next boot
```

This is destructive and cannot be undone — take a backup first if the guest
holds anything you want.

## Resize

```bash
../labctl linux resize --cpus 4 --ram 8G --apply
../labctl linux resize --disk 128G --apply   # grow-only; extend FS in guest
```

The disk can only grow. After growing `DISK_SIZE`, extend the partition and
filesystem inside the guest (`growpart` + `resize2fs`/`xfs_growfs`).

## Run at boot

```bash
make install-service         # systemd unit: starts linux-lab on boot
make uninstall-service
```

## Snapshots

For quick experiment/rollback cycles, take a `make backup` before the change
and `make restore` to roll back. For finer-grained snapshots, use `qcow2`
(`DISK_FMT=qcow2`, the default) and manage snapshots with `qemu-img` against
the disk in `storage/` while the container is stopped.
