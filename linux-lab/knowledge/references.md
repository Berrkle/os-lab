# linux-lab references

Curated external references. Verify versions and licences before relying on them.

## Base image

- **qemux/qemu** — Linux VMs in Docker (the engine this lab uses):
  https://github.com/qemus/qemu
- **qemus** org (sibling projects, incl. the `dockur` Windows/macOS images):
  https://github.com/qemus

## Virtualization

- KVM: https://www.linux-kvm.org/
- QEMU documentation: https://www.qemu.org/docs/master/
- libvirt (alternative host-side management): https://libvirt.org/
- Firecracker microVMs: https://firecracker-microvm.github.io/
- gVisor (container sandbox): https://gvisor.dev/

## Analysis tooling (install inside the guest)

- strace / ltrace, gdb + pwndbg/GEF, radare2 / rizin, Ghidra
- INetSim (network sinkhole for detonation): https://www.inetsim.org/
- `growpart` (cloud-guest-utils) and `resize2fs`/`xfs_growfs` for disk growth

## Hardening & isolation reading

- Docker security: https://docs.docker.com/engine/security/
- nftables wiki: https://wiki.nftables.org/

## This repository

- Root overview: [`../../README.md`](../../README.md)
- Sibling labs: [`../../win-lab/`](../../win-lab/),
  [`../../android-lab/`](../../android-lab/), [`../../ios-lab/`](../../ios-lab/)
