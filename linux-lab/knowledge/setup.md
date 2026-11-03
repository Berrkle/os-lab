# linux-lab setup (Ubuntu Server host)

The guest needs KVM; the host just needs a container runtime and `/dev/kvm`.

## 1. Host prerequisites

- Ubuntu Server 22.04/24.04/26.04 (or another Linux with KVM).
- CPU virtualization enabled in firmware (`vmx` for Intel, `svm` for AMD).
- If the host is itself a VM, enable **nested virtualization** on the hypervisor.
- 16 GB free disk (32 GB+ recommended) and 2 GB+ free RAM.

Check the CPU flag:

```bash
grep -oE '(vmx|svm)' /proc/cpuinfo | head -1
```

## 2. One-command setup

```bash
cd linux-lab
cp .env.example .env
sudo ./setup.sh        # = sudo bash scripts/setup-ubuntu.sh
newgrp docker          # or log out/in for group changes to apply
```

`setup-ubuntu.sh` is idempotent and:

- installs KVM tooling, `cpu-checker`, and a container runtime (Docker via
  `get.docker.com` if none is usable);
- loads and persists `kvm` + `kvm_intel`/`kvm_amd`;
- adds the invoking user to the `kvm` and `docker` groups;
- creates `storage/ shared/ backups/`;
- optionally opens ufw ports when `OPEN_FIREWALL=yes` in `.env`.

## 3. Verify

```bash
make preflight
```

Preflight is read-only and checks OS, the `vmx`/`svm` flag, `/dev/kvm`
access, the container runtime and Compose, the web/SSH ports, and disk/RAM.
Fix every `[fail]` before booting.

## 4. Boot

```bash
make boot           # start and wait for the web viewer
make wait-ready     # also wait for SSH
make status
```

Open `http://<server-ip>:8006/` for the console, or `make ssh` for SSH details.

## Podman instead of Docker

The Makefile and scripts auto-detect Podman when Docker is absent. You need a
Compose provider (`podman compose` or `podman-compose`) and `/dev/kvm` access
for your user.

## Choosing the guest

Set `BOOT` in `.env` to a distro shortcut (`ubuntu`, `debian`, `alpine`,
`fedora`, `arch`, `kali`, ...) or an ISO URL. For an offline/local image, bind
`./boot.iso:/boot.iso` in `docker-compose.yml`. Change `BOOT_MODE` to `legacy`
for images that do not boot under UEFI.

## Remote access

Prefer an SSH tunnel over opening ports:

```bash
ssh -L 8006:127.0.0.1:8006 -L 2222:127.0.0.1:2222 user@server
```

Then browse `http://127.0.0.1:8006/` and `ssh -p 2222 ...` locally.
