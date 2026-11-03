# Linux-in-Docker: options and rationale

This lab runs a **full Linux VM inside a container** rather than just another
container, so the guest has its own kernel, can be a different distribution,
and is isolated behind KVM. That isolation is the point: the guest is treated
as untrusted (malware detonation, exploit work, container-escape practice).

## Options considered

| Approach | Isolation | Kernel | Notes |
|---|---|---|---|
| **`qemux/qemu` (chosen)** | VM (KVM) | guest's own | Web viewer + any distro/ISO; same UX as `dockur/windows`/`dockurr/macos`, so it fits the repo's pattern. |
| Plain privileged container | namespace only | host kernel | No kernel isolation; unsafe for untrusted code. Fine for tooling, not detonation. |
| `libvirt`/`virt-manager` on the host | VM (KVM) | guest's own | Powerful but not reproducible-by-compose; more host state. |
| Firecracker microVM | VM (KVM) | guest's own | Great isolation and boot time, but no turnkey web viewer and more wiring. |
| gVisor (`runsc`) | user-space kernel | sandboxed | Strong syscall isolation for containers, but not a full distro/VM. |

`qemux/qemu` wins here because it mirrors the Windows and macOS labs exactly:
one compose service, a web viewer on `:8006`, KVM acceleration, a persistent
`storage/` disk, and a one-line `BOOT` selector for the distribution or ISO.

## What the guest is for

- **Dynamic analysis / detonation** of ELF binaries and scripts in a disposable
  VM, with the network locked down (see [networking](networking.md)).
- **Exploit and kernel experiments** that need root and a real kernel without
  risking the host.
- **Container-escape and privilege-escalation practice** inside the guest.
- **Reproducible build/test environments** pinned to a specific distro.

## Non-goals

- Not a production VM host or a daily-driver desktop.
- Not an alternative to the host's own containers for trusted tooling.
- Not a hardening reference for Linux servers — it is a throwaway target.

See [setup](setup.md) for the host, [operations](operations.md) for day-to-day
use, and [usecases](usecases.md) for worked workflows.
