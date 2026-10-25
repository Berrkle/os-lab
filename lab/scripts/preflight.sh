#!/usr/bin/env bash
# Pre-flight (docker-android-cheat-sheet.md §0): OS / KVM / docker / ports / disk.
# Run before `make up`. Exit code 0 = safe to proceed.
set -uo pipefail

FAIL=0
ok()   { echo "  [ok]   $*"; }
bad()  { echo "  [FAIL] $*"; FAIL=1; }
warn() { echo "  [warn] $*"; }

echo "== pre-flight checks =="

# --- OS / virtualization ------------------------------------------------
OS="$(uname -s)"
ARCH="$(uname -m)"
echo "host: $OS $ARCH"

case "$OS" in
  Linux)
    if [[ -e /dev/kvm ]]; then
      ok "/dev/kvm present"
    else
      bad "/dev/kvm missing — enable VT-x/AMD-V in BIOS, then: sudo modprobe kvm kvm_intel (or kvm_amd)"
    fi
    if command -v kvm-ok >/dev/null 2>&1; then
      kvm-ok || bad "kvm-ok failed — see cheat sheet §0"
    fi
    ;;
  Darwin)
    warn "macOS cannot run docker-android natively (Docker Desktop exposes no /dev/kvm)."
    warn "Use an Ubuntu VM with nested virtualization per ../docker-android-cheat-sheet.md §3–§4."
    warn "Apple Silicon: x86 emulator images run under QEMU TCG — impractically slow."
    FAIL=1
    ;;
  MINGW*|CYGWIN*|MSYS*)
    warn "Windows: run inside WSL2 with nestedVirtualization=true (Win11 only) — cheat sheet §2."
    FAIL=1
    ;;
esac

[[ "$ARCH" == "x86_64" ]] || warn "arch=$ARCH — docker-android images are x86/x86_64"

# --- docker -------------------------------------------------------------
if command -v docker >/dev/null 2>&1; then
  ok "docker: $(docker --version 2>/dev/null || echo present)"
  if docker compose version >/dev/null 2>&1; then
    ok "docker compose plugin present"
  else
    bad "docker compose not found (install the compose plugin)"
  fi
else
  bad "docker not found"
fi

# --- port availability ---------------------------------------------------
for p in 6080 5554 5555 8000 8080 8081; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then
    exec 3>&- 3<&- 2>/dev/null
    bad "port $p already in use — stop the conflicting service or edit docker-compose.yml"
  else
    ok "port $p free"
  fi
done

# --- disk -----------------------------------------------------------------
AVAIL_MB="$(df -Pm . 2>/dev/null | awk 'NR==2 {print $4}')"
if [[ -n "${AVAIL_MB:-}" && "$AVAIL_MB" -lt 10240 ]]; then
  bad "only ${AVAIL_MB} MB free — need ≥ 10 GB (images are 2–3 GB each)"
else
  ok "disk: ${AVAIL_MB:-?} MB free"
fi

echo "== pre-flight done: $([[ $FAIL -eq 0 ]] && echo PASS || echo FAIL) =="
exit "$FAIL"
