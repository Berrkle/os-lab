Below is a verified, step-by-step cheatsheet for deploying `budtmo/docker-android` across the four requested environments. The critical constraint to understand before starting is that the emulator **hard-requires KVM (Kernel-based Virtual Machine)** for acceptable performance; without it, the x86/x86_64 Android images will either fail to boot or run impractically slowly. Because KVM is a Linux kernel feature, native Linux hosts (including Kali) are the only platform that can run the container directly. Windows and macOS require a Linux virtualisation layer (WSL2 or a full Ubuntu VM) that can expose `/dev/kvm` to Docker.

---

### 🐧 Kali Linux (Native Linux — Recommended Path)

Kali Linux is a Debian-based host with direct access to KVM, making it the simplest and most performant platform for Docker-Android.

**Requirements**

| Component | Requirement |
|---|---|
| **CPU** | Intel VT-x or AMD-V enabled in BIOS/UEFI |
| **Kernel modules** | `kvm`, `kvm_intel` or `kvm_amd` loaded |
| **Docker** | Docker Engine (not Docker Desktop) installed and running |
| **RAM** | Minimum 4 GB available; 8 GB+ recommended |
| **Disk** | At least 8–10 GB free (Android 11 image alone is ~2–3 GB) |

**Step 1 — Verify KVM support**

Install the CPU checker and run `kvm-ok`. A successful result prints `INFO: /dev/kvm exists` and `KVM acceleration can be used`.

```bash
sudo apt update
sudo apt install cpu-checker -y
kvm-ok
```

If `kvm-ok` fails, enable virtualisation in BIOS/UEFI and load the kernel module:

```bash
sudo modprobe kvm
sudo modprobe kvm_intel   # or kvm_amd for AMD CPUs
```

**Step 2 — Install Docker Engine**

Use Docker's official convenience script or your distribution's repository. Avoid Docker Desktop on Linux, as it can interfere with nested virtualisation.

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
sudo usermod -aG docker $USER   # log out/in for group changes to apply
```

**Step 3 — Run the Docker-Android container**

The canonical command mounts `/dev/kvm` and exposes the Web VNC port (6080) and ADB ports (5554/5555):

```bash
docker run -d \
  -p 6080:6080 \
  -p 5554:5554 \
  -p 5555:5555 \
  -e EMULATOR_DEVICE="Samsung Galaxy S10" \
  -e WEB_VNC=true \
  --device /dev/kvm \
  -v data:/home/androidusr \
  --name android-container \
  budtmo/docker-android:emulator_11.0
```

**Step 4 — Verify the emulator is running**

Open `http://localhost:6080` in a browser to see the emulator screen via noVNC. Check the emulator status from the CLI with:

```bash
docker exec -it android-container cat device_status
```

To connect ADB from the Kali host to the containerised emulator, map the ADB ports (already done in Step 3) and connect:

```bash
adb connect 127.0.0.1:5555
adb devices
```

> **⚠️ Persistence note:** The emulated device is destroyed on container restart unless a volume is mounted. The `-v data:/home/androidusr` flag above persists the data directory.

---

### 🪟 Windows (WSL2 — Windows 11 Only)

Windows cannot run Docker-Android directly because Docker Desktop on Windows uses a Hyper-V-based VM that does **not** expose `/dev/kvm`. The only supported native path on Windows is **WSL2 with nested virtualisation enabled**, and this requires **Windows 11** (Windows 10 is not sufficient).

**Requirements**

| Component | Requirement |
|---|---|
| **OS** | Windows 11 (build 22000+) |
| **Virtualisation** | VT-x/AMD-V enabled in BIOS/UEFI |
| **Windows features** | WSL2 and Virtual Machine Platform enabled |
| **WSL2 config** | `nestedVirtualization=true` in `.wslconfig` |
| **Docker** | Docker Engine installed **inside** the WSL2 Ubuntu distribution |

**Step 1 — Enable WSL2 and Virtual Machine Platform**

Run PowerShell as Administrator:

```powershell
wsl --install
wsl --set-default-version 2
```

Ensure the **Virtual Machine Platform** optional feature is enabled in Windows Features.

**Step 2 — Enable nested virtualisation for WSL2**

Create or edit `C:\Users\<YourUsername>\.wslconfig` and add:

```ini
[wsl2]
nestedVirtualization=true
```

Then shut down and restart WSL:

```powershell
wsl --shutdown
```

**Step 3 — Install Docker Engine inside WSL2 Ubuntu**

Open your WSL2 Ubuntu terminal and install Docker Engine (not Docker Desktop):

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo service docker start
sudo usermod -aG docker $USER
```

**Step 4 — Verify KVM is available inside WSL2**

```bash
sudo apt install cpu-checker -y
kvm-ok
ls -l /dev/kvm
```

If `/dev/kvm` is missing, nested virtualisation is not active. Re-check `.wslconfig` and confirm you are on Windows 11.

**Step 5 — Run Docker-Android**

Use the same `docker run` command as the Kali section. From Windows, access the Web VNC at `http://localhost:6080`; WSL2 forwards localhost by default.

> **⚠️ Windows caveat:** Even with nested virtualisation, WSL2 KVM performance may be lower than native Linux. For production-level or performance-sensitive testing, a full Ubuntu VM (see VirtualBox section) may be more reliable.

---

### 📦 VirtualBox (Cross-Platform Fallback — Ubuntu VM)

A full Ubuntu virtual machine inside VirtualBox is the **most universal fallback** for macOS and older Windows hosts. However, **nested virtualisation must be explicitly enabled**, and there are significant CPU limitations.

**Requirements**

| Component | Requirement |
|---|---|
| **Host OS** | macOS, Windows, or Linux |
| **VirtualBox** | Version 6.0 or later |
| **Guest OS** | Ubuntu (20.04/22.04/24.04 LTS) |
| **CPU** | Nested VT-x/AMD-V support |
| **RAM (VM)** | At least 4 GB assigned to the Ubuntu VM |

> **⚠️ Critical hardware constraint:** VirtualBox nested virtualisation for **Intel CPUs is not supported** in VirtualBox 6.0. It only works on **AMD processors** (or Intel with later VirtualBox versions on certain hosts). If you are on an Intel Mac or Intel Windows host, this path may not work.

**Step 1 — Enable nested virtualisation on the VirtualBox VM**

With the Ubuntu VM **powered off**, run on the host:

```bash
VBoxManage modifyvm "<VM_Name>" --nested-hw-virt on
```

Alternatively, enable **Processor → Extended Features → Enable Nested VT-x/AMD-V** in the VM settings GUI.

**Step 2 — Boot the Ubuntu VM and verify CPU flags**

Inside the Ubuntu VM:

```bash
grep -E '(vmx|svm)' /proc/cpuinfo
```

If the output is empty, nested virtualisation is not active.

**Step 3 — Install KVM, Docker, and verify**

```bash
sudo apt update
sudo apt install cpu-checker qemu-kvm libvirt-daemon-system -y
kvm-ok

curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

`kvm-ok` must report `KVM acceleration can be used` before proceeding.

**Step 4 — Run Docker-Android**

Use the same `docker run` command as the Kali section. Access Web VNC from the host by forwarding port 6080 in VirtualBox (**Settings → Network → Advanced → Port Forwarding**) or by browsing `http://<VM_IP>:6080` from the host if bridged networking is configured.

---

### 🍏 macOS (Ubuntu VM via VirtualBox — Only Viable Path)

**Docker-Android cannot run natively on macOS.** Docker Desktop for Mac uses Apple's Hypervisor framework (or a Linux VM on Apple Silicon), neither of which exposes `/dev/kvm` to containers. Apple Silicon (M1/M2/M3) Macs are additionally problematic because the available Android images are x86/x86_64, requiring slow QEMU emulation even if KVM were available.

The only verified path on macOS is to run an **Ubuntu VM inside VirtualBox** (or another hypervisor that supports nested virtualisation on the host CPU), following the **VirtualBox section above**.

**macOS-specific requirements**

| Component | Requirement |
|---|---|
| **macOS** | Intel Mac is strongly preferred (Apple Silicon has no native KVM path) |
| **VirtualBox** | 6.0+ with nested virtualisation (AMD CPU required for nested VT-x) |
| **Ubuntu VM** | 4 GB+ RAM, 20 GB+ disk |
| **Docker** | Docker Engine inside the Ubuntu VM |

**Steps:** Follow **Step 1 through Step 4** of the VirtualBox section exactly. On an Intel Mac, the host CPU must support VT-x, and `VBoxManage modifyvm "<VM_Name>" --nested-hw-virt on` must be executed with the VM powered off. Once the Ubuntu VM is running Docker-Android, access Web VNC from the macOS host via `http://<VM_IP>:6080` or via a VirtualBox port-forward rule for port 6080.

> **⚠️ Apple Silicon note:** On M1/M2/M3 Macs, the x86 Android images will run under full CPU emulation (QEMU TCG), which is extremely slow and generally not practical for interactive use. For CI or headless testing, consider a Linux CI runner with KVM instead.

---

### 🛠️ Universal Docker-Android Command Reference

Once the platform-specific KVM prerequisite is satisfied, the container invocation is identical across all environments.

| Flag | Purpose | Example |
|---|---|---|
| `-p 6080:6080` | Web VNC (browser access) | Required for visual access |
| `-p 5554:5554` | Emulator console port | Needed for `adb connect` |
| `-p 5555:5555` | ADB connection port | Needed for `adb connect` |
| `-e EMULATOR_DEVICE` | Device profile | `"Samsung Galaxy S10"` |
| `-e WEB_VNC=true` | Enable noVNC | Required for browser UI |
| `-e VNC_PASSWORD` | Optional VNC password | `mypassword` |
| `--device /dev/kvm` | **Mandatory** KVM passthrough | Without this, performance is unusable |
| `-v data:/home/androidusr` | Persist emulator data | Prevents data loss on restart |
| `--name android-container` | Container name | Used in `docker exec` commands |
| `budtmo/docker-android:emulator_11.0` | Image tag | Choose `emulator_9.0` through `emulator_14.0` |

### 📋 Platform Decision Matrix

| Host | Native KVM | Supported Path | Performance | Recommended For |
|---|---|---|---|---|
| **Kali Linux** | ✅ Yes | Direct Docker | Native (fastest) | Security testing, CI, daily use |
| **Windows 11** | ❌ No | WSL2 + nested virtualisation | Moderate | Development, testing |
| **Windows 10** | ❌ No | VirtualBox Ubuntu VM (AMD CPU) | Low–moderate | Legacy fallback only |
| **macOS (Intel)** | ❌ No | VirtualBox Ubuntu VM (AMD CPU) | Low–moderate | Lab/experimentation |
| **macOS (Apple Silicon)** | ❌ No | Ubuntu VM (full emulation) | Very slow / impractical | Not recommended |

**Bottom line:** If you have access to a Linux host (Kali, Ubuntu, or Arch), use it directly — it is the only environment where Docker-Android runs as designed. For Windows 11 users, WSL2 with nested virtualisation is the next best option. VirtualBox is a last-resort fallback, and macOS (especially Apple Silicon) is not a practical native target for this specific x86 emulator image stack.