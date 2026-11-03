#!/usr/bin/env bash
# ios-lab host setup for Ubuntu Server.
# Installs KVM tooling and a container runtime, creates the lab directories,
# adds the invoking user to the kvm/docker groups, and optionally opens ports.
#
# Usage: sudo bash scripts/setup-ubuntu.sh
# Idempotent: safe to re-run.
set -euo pipefail

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  awk 'NR>1 && /^#/ {print; next} NR>1 {exit}' "$0"
  exit 0
fi

if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    exec sudo --preserve-env=OPEN_FIREWALL,PULL_IMAGES -- bash "$0" "$@"
  fi
  echo "error: run as root (sudo)" >&2
  exit 1
fi

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"

if [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
  LAB_USER="$SUDO_USER"
elif [ -n "${LAB_USER:-}" ]; then
  LAB_USER="$LAB_USER"
else
  LAB_USER="$(logname 2>/dev/null || true)"
fi

if [ -f .env ]; then
  set -a
  . ./.env
  set +a
fi
OPEN_FIREWALL="${OPEN_FIREWALL:-no}"
PULL_IMAGES="${PULL_IMAGES:-no}"
WEB_PORT="${WEB_PORT:-8006}"
VNC_PORT="${VNC_PORT:-5900}"

say() { printf '\n==> %s\n' "$*"; }
note() { printf '    %s\n' "$*"; }

if [ -r /etc/os-release ]; then
  . /etc/os-release
  case "${ID:-}" in
    ubuntu|debian) note "detected ${PRETTY_NAME:-$ID}" ;;
    *) note "warning: ${PRETTY_NAME:-unknown} is not Ubuntu/Debian; continuing carefully" ;;
  esac
fi

case "$(uname -m)" in
  x86_64) ;;
  *) note "warning: dockur/macos is x86_64; use the native macOS lab on ARM64" ;;
esac

say "Installing base packages (curl, KVM tools, networking)"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg lsb-release \
  cpu-checker iproute2 tar gzip \
  ufw systemd

say "Loading KVM modules"
modprobe kvm || true
if grep -qm1 -E '\bvmx\b' /proc/cpuinfo; then
  modprobe kvm_intel || true
  KVM_MOD="kvm_intel"
elif grep -qm1 -E '\bsvm\b' /proc/cpuinfo; then
  modprobe kvm_amd || true
  KVM_MOD="kvm_amd"
else
  KVM_MOD=""
  note "warning: no vmx/svm CPU flag found; KVM may not work"
fi

if [ -n "$KVM_MOD" ]; then
  printf 'kvm\n%s\n' "$KVM_MOD" > /etc/modules-load.d/kvm.conf
  note "persisted kvm and $KVM_MOD in /etc/modules-load.d/kvm.conf"
fi

say "Installing a container runtime"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  note "docker is already usable"
elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
  note "podman is already usable"
else
  curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
  sh /tmp/get-docker.sh
  systemctl enable --now docker 2>/dev/null || true
fi

if [ -n "$LAB_USER" ] && [ "$LAB_USER" != "root" ]; then
  for grp in docker kvm; do
    if getent group "$grp" >/dev/null 2>&1; then
      usermod -aG "$grp" "$LAB_USER"
      note "added $LAB_USER to group $grp"
    fi
  done
  note "group changes apply to new sessions; run: newgrp docker"
fi

say "Creating lab directories"
mkdir -p storage shared backups

if [ "$PULL_IMAGES" = "yes" ]; then
  say "Pulling images"
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    ( cd "$LAB_DIR" && docker compose pull macos ) || note "image pull failed; continue and retry later"
  fi
fi

if [ "$OPEN_FIREWALL" = "yes" ]; then
  if command -v ufw >/dev/null 2>&1; then
    say "Opening web and VNC ports in ufw"
    ufw allow "${WEB_PORT}/tcp" >/dev/null
    ufw allow "${VNC_PORT}/tcp" >/dev/null
    ufw allow "${VNC_PORT}/udp" >/dev/null
    note "allowed ${WEB_PORT}/tcp ${VNC_PORT}/tcp ${VNC_PORT}/udp"
  else
    note "ufw not available; skipping firewall changes"
  fi
fi

say "Host setup complete"
note "macOS is not distributed with the image; installation runs from Apple recovery and requires accepting Apple's EULA."
note "Run: make preflight && make boot"
