# linux-lab

A disposable Linux VM on Ubuntu Server, built on `qemux/qemu`, for malware
detonation, ELF reverse engineering, exploit/kernel work and container-escape
practice behind KVM. It mirrors [[win-lab]] but boots any distro or ISO.

See [[linux-lab]], the service in [[linux-lab/docker-compose.yml]] and the
runbook [[linux-lab/README.md]].

## Service and endpoints

The `linux` service (container `linux-lab`) serves the noVNC web viewer on
`WEB_PORT` (8006) and SSH on `SSH_PORT` (2222 -> guest 22).

The guest is chosen with `BOOT` (a distro shortcut or an ISO URL) and
`BOOT_MODE` (UEFI by default), configured in [[linux-lab/.env.example]]. It
requires `/dev/kvm` and `/dev/net/tun` and `NET_ADMIN`; `storage/` and `shared/`
are bind-mounted.

## Lifecycle and readiness

`make boot` waits for the web viewer; `make wait-ready` also waits for SSH and
then writes the `storage/linux.ready` marker.

Probing logic is in [[linux-lab/scripts/wait-ready.sh]]; host checks (with a
lower 16 GB disk floor than the Windows lab) in [[linux-lab/scripts/preflight.sh]].
Readiness stages: container `Up`, web viewer HTTP 200, and SSH accepting.

## State, backup and containment

All guest state is in `storage/`; backup/restore reuse the shared pattern.

See [[linux-lab/scripts/backup.sh]] and [[linux-lab/scripts/restore.sh]];
`make reset CONFIRM=yes` re-provisions a clean guest. Because untrusted code is
expected, network containment is documented in
[[linux-lab/knowledge/networking.md]] and worked workflows in
[[linux-lab/knowledge/usecases.md]].

## Why qemux/qemu

The engine was chosen to match the Windows and macOS labs' compose+web-viewer UX.

Rationale and the alternatives considered (privileged containers, libvirt,
Firecracker, gVisor) are recorded in [[linux-lab/knowledge/draft.md]].
