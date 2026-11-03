#!/usr/bin/env bash
# ios-lab preflight: read-only checks for an Ubuntu Server host.
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"

if [ -t 1 ]; then
  RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
else
  RED=""; GREEN=""; YELLOW=""; BOLD=""; RESET=""
fi

FAILS=0
WARNS=0

ok()   { printf '  %s[ok]%s   %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '  %s[warn]%s %s\n' "$YELLOW" "$RESET" "$*"; WARNS=$((WARNS + 1)); }
fail() { printf '  %s[fail]%s %s\n' "$RED" "$RESET" "$*"; FAILS=$((FAILS + 1)); }
hdr()  { printf '\n%s%s%s\n' "$BOLD" "$*" "$RESET"; }

ENV_FILE="${LAB_ENV_FILE:-.env}"
if [ "${LAB_ENV_LOADED:-0}" = "1" ]; then
  ok "using exported lab configuration"
elif [ -f "$ENV_FILE" ]; then
  set -a
  . "$ENV_FILE"
  set +a
  ok "loaded $ENV_FILE"
else
  warn ".env not found (using defaults); run: cp .env.example .env"
fi

WEB_PORT="${WEB_PORT:-8006}"
VNC_PORT="${VNC_PORT:-5900}"
DISK_SIZE="${DISK_SIZE:-128G}"
RAM_SIZE="${RAM_SIZE:-8G}"
CPU_CORES="${CPU_CORES:-4}"
GPU="${GPU:-N}"

hdr "Host"
if [ -r /etc/os-release ]; then
  . /etc/os-release
  case "${ID:-}" in
    ubuntu|debian) ok "OS: ${PRETTY_NAME:-$ID}" ;;
    *) warn "OS: ${PRETTY_NAME:-unknown} (Ubuntu/Debian recommended)" ;;
  esac
else
  warn "cannot read /etc/os-release"
fi
ok "kernel: $(uname -r)"

ARCH="$(uname -m)"
if [ "$ARCH" = "x86_64" ]; then
  ok "arch: x86_64"
else
  fail "arch: $ARCH — dockur/macos needs x86_64; use the native macOS path on Apple Silicon"
fi

hdr "Virtualization (KVM)"
if grep -qm1 -E '(^flags.*\b(vmx|svm)\b)' /proc/cpuinfo; then
  if grep -qm1 -E '\bvmx\b' /proc/cpuinfo; then ok "CPU flag: vmx (Intel)"; else ok "CPU flag: svm (AMD)"; fi
else
  warn "no vmx/svm flag in /proc/cpuinfo (enable VT-x/AMD-V in firmware)"
fi

if [ -e /dev/kvm ]; then
  ok "/dev/kvm exists"
  if [ -r /dev/kvm ] && [ -w /dev/kvm ]; then
    ok "/dev/kvm is readable and writable by $(id -un)"
  elif [ "$(id -u)" -eq 0 ]; then
    ok "/dev/kvm accessible as root"
  else
    fail "/dev/kvm not accessible by $(id -un); add user to the kvm group and re-login"
  fi
else
  fail "/dev/kvm missing; load kvm/kvm_intel (or kvm_amd) and install KVM"
fi

if command -v kvm-ok >/dev/null 2>&1; then
  if kvm-ok >/dev/null 2>&1; then ok "$(kvm-ok 2>&1 | tail -1)"; else fail "kvm-ok failed; see output of: kvm-ok"; fi
else
  warn "kvm-ok not installed (apt install cpu-checker)"
fi

if command -v systemd-detect-virt >/dev/null 2>&1; then
  VIRT="$(systemd-detect-virt 2>/dev/null || true)"
  if [ "$VIRT" = "none" ]; then
    ok "not running inside a VM"
  else
    warn "running inside '$VIRT'; nested virtualization must be enabled for KVM"
  fi
fi

if [ -e /dev/net/tun ]; then
  ok "/dev/net/tun exists"
else
  warn "/dev/net/tun missing; compose attaches it for guest networking"
fi

hdr "Container runtime"
RUNTIME=""
COMPOSE=""
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    RUNTIME="docker"
    ok "docker: $(docker version --format '{{.Server.Version}}' 2>/dev/null || echo present)"
  else
    warn "docker CLI present but daemon not reachable as $(id -un) (group/permission?)"
  fi
fi
if [ -z "$RUNTIME" ] && command -v podman >/dev/null 2>&1; then
  if podman info >/dev/null 2>&1; then
    RUNTIME="podman"
    ok "podman: $(podman --version 2>/dev/null || echo present)"
  else
    warn "podman CLI present but not usable"
  fi
fi

if [ -n "$RUNTIME" ]; then
  if "$RUNTIME" compose version >/dev/null 2>&1; then
    COMPOSE="$RUNTIME compose"
    ok "compose: $($COMPOSE version 2>/dev/null | head -1)"
  else
    fail "$RUNTIME compose plugin is not available"
  fi
else
  fail "no usable Docker or Podman runtime (run: sudo make setup)"
fi

CONTAINER_UP=0
if [ -n "$RUNTIME" ] && "$RUNTIME" inspect ios-lab >/dev/null 2>&1; then
  STATE="$("$RUNTIME" inspect ios-lab --format '{{.State.Status}}' 2>/dev/null || echo unknown)"
  if [ "$STATE" = "running" ]; then CONTAINER_UP=1; ok "container ios-lab is running"; else warn "container ios-lab exists but is $STATE"; fi
fi

hdr "Ports"
check_tcp_port() {
  local port="$1" name="$2"
  if ss -H -ltn "sport = :$port" 2>/dev/null | grep -q .; then
    if [ "$CONTAINER_UP" -eq 1 ]; then ok "$name :$port in use by ios-lab (expected)"; else fail "$name :$port already in use by another process"; fi
  else
    ok "$name :$port free"
  fi
}
check_udp_port() {
  local port="$1" name="$2"
  if ss -H -lun "sport = :$port" 2>/dev/null | grep -q .; then
    if [ "$CONTAINER_UP" -eq 1 ]; then ok "$name :$port/udp in use by ios-lab (expected)"; else warn "$name :$port/udp in use by another process"; fi
  else
    ok "$name :$port/udp free"
  fi
}
check_tcp_port "$WEB_PORT" "web"
check_tcp_port "$VNC_PORT" "vnc"
check_udp_port "$VNC_PORT" "vnc"

hdr "Resources"
FREE_KB="$(df -Pk "$LAB_DIR" | awk 'NR==2 {print $4}')"
FREE_GB=$((FREE_KB / 1024 / 1024))
if [ "$FREE_GB" -lt 64 ]; then
  fail "disk: ${FREE_GB}G free in $LAB_DIR (64G minimum, 128G+ recommended)"
elif [ "$FREE_GB" -lt 128 ]; then
  warn "disk: ${FREE_GB}G free (128G+ recommended; DISK_SIZE=$DISK_SIZE)"
else
  ok "disk: ${FREE_GB}G free"
fi

MEM_AVAIL_MB="$(awk '/MemAvailable/ {printf "%d", $2/1024}' /proc/meminfo)"
MEM_TOTAL_MB="$(awk '/MemTotal/ {printf "%d", $2/1024}' /proc/meminfo)"
case "$RAM_SIZE" in
  *G|*g) WANT_MB=$((${RAM_SIZE%[Gg]} * 1024)) ;;
  *M|*m) WANT_MB="${RAM_SIZE%[Mm]}" ;;
  half) WANT_MB=$((MEM_TOTAL_MB / 2)) ;;
  max) WANT_MB="$MEM_TOTAL_MB" ;;
  *) WANT_MB=8192 ;;
esac
if [ "$MEM_AVAIL_MB" -lt 4096 ]; then
  fail "memory: ${MEM_AVAIL_MB}MB available (4GB minimum)"
elif [ "$MEM_AVAIL_MB" -lt 8192 ]; then
  warn "memory: ${MEM_AVAIL_MB}MB available (RAM_SIZE=$RAM_SIZE plus host overhead)"
else
  ok "memory: ${MEM_AVAIL_MB}MB available"
fi
if [ "$WANT_MB" -gt "$MEM_AVAIL_MB" ]; then
  warn "RAM_SIZE=$RAM_SIZE exceeds available memory (${MEM_AVAIL_MB}MB); expect swapping"
fi

CPUS="$(nproc)"
if [[ "$CPU_CORES" =~ ^[0-9]+$ ]] && [ "$CPU_CORES" -gt "$CPUS" ]; then
  warn "CPU_CORES=$CPU_CORES exceeds host cores ($CPUS)"
elif [ "$CPUS" -lt 2 ]; then
  warn "cpu: ${CPUS} core(s)"
else
  ok "cpu: ${CPUS} cores (guest $CPU_CORES)"
fi

hdr "Graphics"
if [ "$GPU" = "Y" ]; then
  if ls /dev/dri/renderD* >/dev/null 2>&1; then
    ok "GPU=Y and /dev/dri render node present"
    if [ ! -e "$LAB_DIR/docker-compose.gpu.yml" ]; then
      fail "GPU=Y but docker-compose.gpu.yml is missing"
    fi
  else
    fail "GPU=Y but no /dev/dri/renderD*; enable Reims vGPU only on a Vulkan-capable host"
  fi
else
  ok "GPU=N (software rendering; the Simulator will be slow)"
fi

hdr "Licensing"
warn "macOS may only be virtualized on Apple hardware under Apple's EULA; you are responsible for compliance"

printf '\n%sSummary%s: %d failure(s), %d warning(s)\n' "$BOLD" "$RESET" "$FAILS" "$WARNS"
if [ "$FAILS" -gt 0 ]; then
  printf '%sPreflight failed.%s Fix the failures above (see ../knowledge/setup-ubuntu.md).\n' "$RED" "$RESET"
  exit 1
fi
printf '%sPreflight passed.%s Next: make boot (or make up for no wait)\n' "$GREEN" "$RESET"
