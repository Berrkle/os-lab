#!/usr/bin/env bash
# win-lab host setup for Ubuntu Server.
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
    exec sudo --preserve-env=OPEN_FIREWALL -- bash "$0" "$@"
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
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi
OPEN_FIREWALL="${OPEN_FIREWALL:-no}"
WEB_PORT="${WEB_PORT:-8006}"
RDP_PORT="${RDP_PORT:-3389}"

say() { printf '\n==> %s\n' "$*"; }
note() { printf '    %s\n' "$*"; }

if [ -r /etc/os-release ]; then
  # shellcheck disable=SC1091
  . /etc/os-release
  case "${ID:-}" in
    ubuntu|debian) note "detected ${PRETTY_NAME:-$ID}" ;;
    *) note "warning: ${PRETTY_NAME:-unknown} is not Ubuntu/Debian; continuing carefully" ;;
  esac
fi

say "Installing base packages (curl, KVM tools, firewall/network tools)"
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

if [ -e /dev/kvm ]; then
  note "/dev/kvm present"
else
  note "warning: /dev/kvm is missing; enable VT-x/AMD-V (and nested virtualization if this is a VM)"
fi
if command -v kvm-ok >/dev/null 2>&1; then
  kvm-ok || note "warning: kvm-ok did not report usable acceleration"
fi

say "Ensuring a container runtime"
runtime_ok() {
  if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
    return 0
  fi
  if command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

if runtime_ok; then
  note "existing container runtime is usable"
else
  if command -v systemctl >/dev/null 2>&1 && systemctl list-unit-files docker.service >/dev/null 2>&1; then
    systemctl enable --now docker || true
  fi
  if ! runtime_ok; then
    note "installing Docker Engine via get.docker.com"
    curl -fsSL https://get.docker.com | sh
    systemctl enable --now docker || true
  fi
fi

if command -v docker >/dev/null 2>&1; then
  if docker compose version >/dev/null 2>&1; then
    note "docker compose: $(docker compose version | head -1)"
  else
    note "warning: docker compose plugin not found; install docker-compose-plugin"
  fi
fi
if command -v podman >/dev/null 2>&1; then
  note "podman: $(podman --version)"
fi

say "Configuring group access"
if [ -n "${LAB_USER:-}" ] && id "$LAB_USER" >/dev/null 2>&1; then
  if getent group docker >/dev/null 2>&1; then
    usermod -aG docker "$LAB_USER" && note "added $LAB_USER to group docker"
  fi
  if getent group kvm >/dev/null 2>&1; then
    usermod -aG kvm "$LAB_USER" && note "added $LAB_USER to group kvm"
  fi
  note "log out and back in (or run: newgrp docker) for group changes to apply"
else
  note "no non-root user detected; skipping group membership (set LAB_USER=... to override)"
fi

say "Creating lab directories"
mkdir -p "$LAB_DIR/storage" "$LAB_DIR/shared" "$LAB_DIR/oem" "$LAB_DIR/backups"
if [ -n "${LAB_USER:-}" ] && id "$LAB_USER" >/dev/null 2>&1; then
  chown "$LAB_USER":"$LAB_USER" \
    "$LAB_DIR/storage" "$LAB_DIR/shared" "$LAB_DIR/oem" "$LAB_DIR/backups" || true
fi
note "storage/ shared/ oem/ backups/ ready"

if [ "$OPEN_FIREWALL" = "yes" ] || [ "$OPEN_FIREWALL" = "Y" ] || [ "$OPEN_FIREWALL" = "1" ]; then
  say "Opening firewall ports $WEB_PORT/tcp and $RDP_PORT/tcp,udp"
  ufw allow "$WEB_PORT/tcp" || true
  ufw allow "$RDP_PORT/tcp" || true
  ufw allow "$RDP_PORT/udp" || true
else
  say "Firewall left unchanged"
  note "the web viewer (port $WEB_PORT) and RDP (port $RDP_PORT) may be blocked by ufw"
  note "allow them from a trusted network, or use an SSH tunnel"
fi

say "Verification"
[ -e /dev/kvm ] && note "KVM device: ok" || note "KVM device: MISSING"
if command -v docker >/dev/null 2>&1; then docker info >/dev/null 2>&1 && note "docker: ok" || note "docker: not reachable as root (check service)"; fi
if command -v podman >/dev/null 2>&1; then podman info >/dev/null 2>&1 && note "podman: ok" || note "podman: not reachable rootless"; fi

say "Next steps"
cat <<EOF
    cd $LAB_DIR
    cp -n .env.example .env    # if not present
    make preflight
    make boot                  # start, then open http://<server-ip>:$WEB_PORT/
    make wait-install          # waits for storage/windows.boot
    make status
EOF
