#!/usr/bin/env bash
# firewall-lab VM preflight: read-only checks for a KVM-capable Linux host.
set -euo pipefail

LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$LAB_DIR"
[ -f .env ] && { set -a; . ./.env; set +a; }

if [ -t 1 ]; then RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; BOLD=$'\033[1m'; RESET=$'\033[0m'
else RED=""; GREEN=""; YELLOW=""; BOLD=""; RESET=""; fi
FAILS=0; WARNS=0
ok()   { printf '  %s[ok]%s   %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '  %s[warn]%s %s\n' "$YELLOW" "$RESET" "$*"; WARNS=$((WARNS+1)); }
fail() { printf '  %s[fail]%s %s\n' "$RED" "$RESET" "$*"; FAILS=$((FAILS+1)); }
hdr()  { printf '\n%s%s%s\n' "$BOLD" "$*" "$RESET"; }

WEB_PORT="${WEB_PORT:-8007}"; SSH_PORT="${SSH_PORT:-2223}"

hdr "Container runtime"
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then ok "docker usable"
elif command -v podman >/dev/null 2>&1 && podman info >/dev/null 2>&1; then ok "podman usable"
else fail "no usable Docker/Podman (install Docker Engine + compose)"; fi

hdr "Virtualization (KVM)"
if [ -e /dev/kvm ]; then
  if [ -r /dev/kvm ] && [ -w /dev/kvm ]; then ok "/dev/kvm present and accessible"
  else warn "/dev/kvm present but not writable by you (add your user to the kvm group)"; fi
else
  warn "/dev/kvm missing — on a non-Linux host (macOS/Windows) this VM layer can't run."
  warn "You can still use the renderer: python3 scripts/render-rules.py <slug> --target table"
fi

hdr "Ports"
for p in "$WEB_PORT" "$SSH_PORT"; do
  if (exec 3<>"/dev/tcp/127.0.0.1/$p") 2>/dev/null; then warn "port $p already in use (linux-lab uses 8006/2222)"; else ok "port $p free"; fi
done

hdr "Tooling"
command -v python3 >/dev/null 2>&1 && ok "python3: $(python3 --version 2>&1)" || fail "python3 missing (needed by render-rules.py)"
command -v sshpass >/dev/null 2>&1 && ok "sshpass present (make apply works)" || warn "sshpass missing (make apply prints manual steps instead)"

printf '\n%s%d fail, %d warn%s\n' "$BOLD" "$FAILS" "$WARNS" "$RESET"
[ "$FAILS" -eq 0 ]
