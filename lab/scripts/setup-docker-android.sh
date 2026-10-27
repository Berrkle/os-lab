#!/bin/sh
# ---------------------------------------------------------------------------
# Automated Guest Setup Script for Docker-Android on apk-lab-vm
# Compatible with Alpine Linux, Debian, and Ubuntu
# ---------------------------------------------------------------------------

set -e

echo "=== 🛡️ apk-lab Guest: Deploying docker-android ==="

# 1. Detect Distribution & Install Docker + KVM
if [ -f /etc/alpine-release ]; then
    echo "[*] Detected Alpine Linux Guest"
    apk update
    apk add docker qemu-modules libvirt curl
    modprobe kvm
    modprobe kvm_intel 2>/dev/null || modprobe kvm_amd 2>/dev/null || true
    rc-update add docker boot
    service docker start
elif [ -f /etc/debian_version ] || [ -f /etc/lsb-release ]; then
    echo "[*] Detected Debian/Ubuntu Linux Guest"
    apt-get update
    apt-get install -y qemu-kvm libvirt-daemon-system curl
    modprobe kvm
    modprobe kvm_intel 2>/dev/null || modprobe kvm_amd 2>/dev/null || true
    if ! command -v docker >/dev/null 2>&1; then
        curl -fsSL https://get.docker.com | sh
    fi
    systemctl enable --now docker
fi

# 2. Verify KVM Acceleration
echo "[*] Verifying /dev/kvm presence..."
if [ -e /dev/kvm ]; then
    echo "[OK] /dev/kvm is active! Hardware accelerated Android virtualization ready."
    chmod 666 /dev/kvm
else
    echo "[WARN] /dev/kvm not found! Ensure '--nested-hw-virt on' was enabled in VirtualBox."
fi

# 3. Pull & Run budtmo/docker-android
echo "[*] Pulling and launching budtmo/docker-android:emulator_11.0 container..."
docker run -d \
  -p 6080:6080 \
  -p 5554:5554 \
  -p 5555:5555 \
  -e EMULATOR_DEVICE="Samsung Galaxy S10" \
  -e WEB_VNC=true \
  --device /dev/kvm \
  -v android-data:/home/androidusr \
  --name android-container \
  --restart unless-stopped \
  budtmo/docker-android:emulator_11.0

echo "=== ✅ docker-android is up and running! ==="
echo "Web VNC Display : http://127.0.0.1:6080"
echo "ADB Bridge      : 127.0.0.1:5555"
