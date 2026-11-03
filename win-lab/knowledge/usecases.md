# Use cases and lab patterns

`win-lab` is a reproducible way to get a Windows machine on an Ubuntu Server
without a physical PC, a hypervisor UI, or interactive installation. The
patterns below are the ones this repo is built for.

## 1. Windows application testing

Run software that only exists for Windows: installers, desktop clients,
drivers, OEM tools, proprietary VPN or device software. Because the guest is a
normal Windows machine, the app sees a normal desktop and filesystem.

- Rebuild the guest from `VERSION` at any time.
- Keep one clean `storage/` snapshot and clone it for destructive tests.
- Install test builds through the `shared/` folder.

## 2. Remote Windows desktop on a Linux server

The container is a headless Windows workstation with RDP and a browser viewer.
Useful when the server is the only always-on machine.

- Use RDP for day-to-day work; the web viewer is for installation and recovery.
- Back up `storage/` so the workstation can be restored on another host.
- Bind ports to localhost and tunnel over SSH for remote access.

## 3. Cross-browser and legacy Internet Explorer testing

Windows guests include legacy browsers that are hard to run on modern Linux.
Windows 11/10 cover Edge/IE mode; older `VERSION` values (`7u`, `xp`) provide
genuinely old environments for compatibility checks.

- Use a separate container/volume per Windows version, or reinstall between
  projects.
- Keep the legacy guests off any network with internet-facing credentials.

## 4. Malware and untrusted-software analysis

A disposable Windows VM is the standard detonation environment. `win-lab`
makes it quick to rebuild and easy to inspect from the host.

Recommended pattern:

- Dedicated host or lab VLAN; no route to production.
- Remove port publishing or bind to `127.0.0.1`.
- Restrict egress to only what the analysis needs (or none).
- Keep `shared/` disposable and never share host credentials.
- Snapshot `storage/` before detonation; restore or destroy after.
- Capture traffic at the host/bridge if the analysis needs network evidence.

Caveats: this is a VM boundary, not an air gap. Treat QEMU, the container image
and the host kernel as part of the attack surface and keep them patched. Do not
use the default `admin` password on any guest with network access.

## 5. QA and CI

The container can be started non-interactively and used as a Windows test
runner.

- Pin `IMAGE_TAG` and `VERSION` for reproducibility.
- Pre-seed software with `/oem` and `install.bat`, or bake a custom image/ISO.
- Use the state marker `storage/windows.boot` as the installation gate.
- For CI, prepare `storage/` once and start from that cached volume; do not
  reinstall Windows on every job.
- Use RDP or WinRM only inside the CI network; never publish 3389.

Note that a full Windows install is slow and network-heavy; a prebuilt disk or
a custom ISO is usually the right approach for frequent jobs.

## 6. Testing Windows Server / Active Directory scenarios

`VERSION=2022`, `2019`, `2025` and the enterprise/eval editions let you stand up
a domain controller or member server. `DOMAIN`, `DOMAIN_OU`, `WORKGROUP` and
`USERNAME`/`PASSWORD` configure domain join during installation.

- Give each role its own container and storage volume.
- Use an isolated docker network/VLAN for the domain.
- Be aware that eval editions expire; use `KEY` for licensed installs.

## 7. USB and hardware passthrough experiments

Pass USB devices or raw disks into the guest for driver testing, flashing, or
device research. This is powerful and risky:

- Never attach a USB mass-storage device during the first installation; it can
  be formatted as the system disk.
- Pass through only devices you can afford to expose or lose.
- Use `/disk1` only when you intend the device to become the primary disk.

## 8. Training and demos

A one-command Windows environment is useful for workshops and screenshots.
Reset to a clean state with `make reset CONFIRM=yes` and reinstall when done.
Budget time for the first install and keep a prepared `storage/` copy for the
session.

## Anti-patterns

- Exposing RDP (3389) directly to the internet.
- Using the default `Docker` / `admin` credentials on a network-reachable guest.
- Running untrusted guests on a host that also runs production services with a
  shared bridge and no egress filtering.
- Treating `make reset` as a backup; it deletes the disks.
- Editing `storage/windows.raw` while Windows is running.
