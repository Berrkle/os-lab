#!/usr/bin/env bash
# android-lab host setup for Ubuntu Server.
# Installs KVM tooling, adb, a container runtime and Python basics, creates the
# lab directories, adds the invoking user to the kvm/docker groups, and can
# optionally open the lab web ports and build the Python venv.
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
    exec sudo --preserve-env=OPEN_FIREWALL,PULL_IMAGES,SETUP_PYTHON -- bash "$0" "$@"
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
PULL_IMAGES="${PULL_IMAGES:-no}"
SETUP_PYTHON="${SETUP_PYTHON:-no}"

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

say "Installing base packages (curl, KVM tools, adb, Python, networking)"
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates curl gnupg lsb-release \
  cpu-checker iproute2 tar gzip unzip jq \
  adb python3 python3-venv python3-pip \
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
  note "warning: no vmx/svm CPU flag found; the Android emulator needs KVM"
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
  if command -v systemctl >/dev/null 2>&1; then
    systemctl enable --now docker 2>/dev/null || true
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
mkdir -p "$LAB_DIR/apks" "$LAB_DIR/artifacts" "$LAB_DIR/frida" "$LAB_DIR/tools"
if [ -n "${LAB_USER:-}" ] && id "$LAB_USER" >/dev/null 2>&1; then
  chown "$LAB_USER":"$LAB_USER" \
    "$LAB_DIR/apks" "$LAB_DIR/artifacts" "$LAB_DIR/frida" "$LAB_DIR/tools" || true
fi
note "apks/ artifacts/ frida/ tools/ ready"

if [ "$PULL_IMAGES" = "yes" ] || [ "$PULL_IMAGES" = "Y" ] || [ "$PULL_IMAGES" = "1" ]; then
  say "Pulling container images (this can take a while)"
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose pull || note "warning: image pull failed"
  elif command -v podman >/dev/null 2>&1; then
    podman compose pull || note "warning: image pull failed"
  fi
else
  say "Skipping image pull (set PULL_IMAGES=yes to pull during setup)"
fi

if [ "$SETUP_PYTHON" = "yes" ] || [ "$SETUP_PYTHON" = "Y" ] || [ "$SETUP_PYTHON" = "1" ]; then
  say "Creating Python virtual environment (.venv)"
  if [ -n "${LAB_USER:-}" ] && id "$LAB_USER" >/dev/null 2>&1; then
    sudo -u "$LAB_USER" python3 -m venv "$LAB_DIR/.venv" || note "warning: venv creation failed"
    sudo -u "$LAB_USER" "$LAB_DIR/.venv/bin/pip" install --upgrade pip || true
    sudo -u "$LAB_USER" "$LAB_DIR/.venv/bin/pip" install -r "$LAB_DIR/requirements.txt" \
      || note "warning: pip install -r requirements.txt failed"
  else
    python3 -m venv "$LAB_DIR/.venv" || note "warning: venv creation failed"
    "$LAB_DIR/.venv/bin/pip" install --upgrade pip || true
    "$LAB_DIR/.venv/bin/pip" install -r "$LAB_DIR/requirements.txt" \
      || note "warning: pip install -r requirements.txt failed"
  fi
else
  say "Skipping Python venv (set SETUP_PYTHON=yes, or run: make setup-python)"
fi

if [ "$OPEN_FIREWALL" = "yes" ] || [ "$OPEN_FIREWALL" = "Y" ] || [ "$OPEN_FIREWALL" = "1" ]; then
  say "Opening firewall ports for the lab web UIs"
  ufw allow 6080/tcp || true   # noVNC
  ufw allow 8000/tcp || true   # MobSF
  ufw allow 8080/tcp || true   # mitmproxy
  ufw allow 8081/tcp || true   # mitmweb
  note "ADB (5555) is intentionally not opened; use an SSH tunnel"
else
  say "Firewall left unchanged"
  note "web UIs 6080, 8000, 8080, 8081 may be blocked by ufw; use a trusted network or SSH tunnel"
fi

say "Verification"
[ -e /dev/kvm ] && note "KVM device: ok" || note "KVM device: MISSING"
command -v adb >/dev/null 2>&1 && note "adb: $(adb version 2>/dev/null | head -1)" || note "adb: MISSING"
if command -v docker >/dev/null 2>&1; then docker info >/dev/null 2>&1 && note "docker: ok" || note "docker: not reachable as root (check service)"; fi
if command -v podman >/dev/null 2>&1; then podman info >/dev/null 2>&1 && note "podman: ok" || note "podman: not reachable rootless"; fi

say "Next steps"
cat <<EOF
    cd $LAB_DIR
    cp -n .env.example .env    # if not present
    make preflight
    make boot                  # emulator; noVNC http://<server-ip>:6080/
    make wf1 APK=app.apk
    make wf2 APK=app.apk PKG=com.example
    make report
EOF
