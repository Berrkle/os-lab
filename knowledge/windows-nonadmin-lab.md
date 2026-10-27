# 🪟 Windows Non-Admin Mobile Security Lab Architecture & Guide

> **Target Audience:** Security researchers, reverse engineers, and developers running on **Windows 10/11 without Administrator privileges** (corporate-managed machines, restricted lab environments, non-elevated user accounts).

---

## 1. Executive Summary & Constraints

The standard `budtmo/docker-android` setup assumes:
1. A Linux kernel with `/dev/kvm` exposed directly.
2. Root/Administrator privileges to install Docker Desktop, WSL2 kernel modules, or Hyper-V hypervisors.

On Windows in a **non-admin context**, these assumptions break down:
- **No UAC / Elevation:** You cannot run `wsl --install`, install kernel drivers, enable Windows Optional Features (Hyper-V / Virtual Machine Platform), or execute installer `.msi`/`.exe` packages that write to `C:\Program Files` or system registries.
- **No `/dev/kvm` on Host:** Windows does not have a native `/dev/kvm` device node.
- **Firmware Virtualization Caveat:** If `systeminfo` reports `Virtualization Enabled In Firmware: No`, hardware-accelerated VT-x/AMD-V nested virtualization is blocked at the CPU firmware level until toggled in UEFI/BIOS.

### The Solution: Multi-Tiered Non-Admin Lab Architecture

To fulfill the lab goals (**WF1 Static Analysis**, **WF2 Dynamic Analysis**, **Frida Hooking**, **Traffic Interception**, and **Telemetry Reporting**) without admin rights, we deploy three complementary models:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Windows Non-Admin Host Environment                       │
│                                                                             │
│  ┌─────────────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│  │   Model 1: VirtualBox   │  │  Model 2: Podman  │  │  Model 3: Native  │  │
│  │   Headless VM (VBox)    │  │  Container Engine │  │  Userland Engine  │  │
│  │                         │  │                   │  │                   │  │
│  │ • User-owned VM in      │  │ • Portable Podman │  │ • Python .venv    │  │
│  │   $HOME\VirtualBox VMs  │  │   CLI (Userland)  │  │   (frida, mitm)   │  │
│  │ • Android-x86 or Linux  │  │ • Rootless MobSF  │  │ • Portable ADB    │  │
│  │ • NAT Port Forwarding   │  │ • Connects to VM  │  │ • Portable JADX   │  │
│  │   :6080, :5555, :8000   │  │   or remote host  │  │ • Local Reports   │  │
│  └─────────────────────────┘  └───────────────────┘  └───────────────────┘  │
│                               ▲                   ▲                         │
│                               │                   │                         │
│                    Unified PowerShell / Python CLI Orchestrator             │
│                      (lab.ps1 / orchestrator.py / preflight)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. The Three Non-Admin Models

### 📦 Model 1: VirtualBox Headless VM Lab (Non-Admin)

If Oracle VirtualBox is already installed on the host (e.g. at `C:\Program Files\Oracle\VirtualBox\VBoxManage.exe`), any standard unprivileged user can manage VMs without administrative access.

#### Why it works without Admin:
- VirtualBox configuration, disk images (`.vdi`), and state files are written to `%USERPROFILE%\VirtualBox VMs` and `%USERPROFILE%\.VirtualBox\`.
- `VBoxManage.exe` runs entirely under your current user token.
- Guest NAT networking allows port-forwarding high ports (`6080`, `5555`, `8000`, `8080`, `8081`) to `127.0.0.1` without needing administrative network bridge drivers.

#### VBoxManage Non-Admin Lifecycle Recipes:

```powershell
$VBOX = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
$VM_NAME = "apk-lab-vm"

# 1. Create VM registered in user profile
& $VBOX createvm --name $VM_NAME --ostype "Ubuntu_64" --register

# 2. Configure Memory & CPU
& $VBOX modifyvm $VM_NAME --memory 4096 --cpus 2 --vram 32

# 3. Configure Network (NAT) & Port Forwarding
& $VBOX modifyvm $VM_NAME --nic1 nat
& $VBOX modifyvm $VM_NAME --natpf1 "novnc,tcp,127.0.0.1,6080,,6080"
& $VBOX modifyvm $VM_NAME --natpf1 "adb,tcp,127.0.0.1,5555,,5555"
& $VBOX modifyvm $VM_NAME --natpf1 "mobsf,tcp,127.0.0.1,8000,,8000"
& $VBOX modifyvm $VM_NAME --natpf1 "mitmproxy,tcp,127.0.0.1,8080,,8080"
& $VBOX modifyvm $VM_NAME --natpf1 "mitmweb,tcp,127.0.0.1,8081,,8081"

# 4. Create and attach user-owned virtual disk (20 GB dynamic)
$DISK_PATH = "$env:USERPROFILE\VirtualBox VMs\$VM_NAME\$VM_NAME.vdi"
& $VBOX createhd --filename $DISK_PATH --size 20480 --format VDI
& $VBOX storagectl $VM_NAME --name "SATA" --add sata --controller IntelAhci
& $VBOX storageattach $VM_NAME --storagectl "SATA" --port 0 --device 0 --type hdd --medium $DISK_PATH

# 5. Start VM in headless background mode
& $VBOX startvm $VM_NAME --type headless

# 6. Stop / Snapshot
& $VBOX controlvm $VM_NAME acpipowerbutton
& $VBOX snapshot $VM_NAME take "clean-baseline"
```

---

### 🦭 Model 2: Podman Container Engine (Non-Admin)

Podman provides a rootless daemonless architecture. On Windows without admin privileges:
1. **Podman Portable Client:** The Podman CLI (`podman.exe`) can be placed in user path (e.g. `lab/tools/podman/`).
2. **Remote Container Backend:** When local WSL2/Hyper-V cannot be installed due to lack of admin rights, Podman connects seamlessly to a Linux VM (such as the VirtualBox VM from Model 1 or a remote research server):
   ```powershell
   podman system connection add lab-vm ssh://user@127.0.0.1:2222/run/user/1000/podman/podman.sock
   podman system connection default lab-vm
   ```
3. **No-KVM Static Stack:** For running MobSF and RE tools via containers on Windows without `/dev/kvm`, use the adapted `docker-compose.win.yml`:
   ```powershell
   podman compose -f docker-compose.win.yml up -d mobsf tools
   ```

---

### ⚡ Model 3: Native Windows Userland Lab (Zero-Admin, Zero-Hypervisor)

This is the most dependable and lightweight model when hardware virtualization is disabled in firmware or when hypervisors cannot be run.

#### Components Installed in User Space:
| Tool | Installation / Execution Mode | Privilege Required |
|---|---|---|
| **Python Virtualenv** | `python -m venv lab/.venv` | User only |
| **Frida & Frida Tools** | `lab/.venv/Scripts/pip install frida-tools` | User only |
| **Mitmproxy & Mitmweb** | `lab/.venv/Scripts/pip install mitmproxy` | User only |
| **Android Platform-Tools (`adb`)** | Downloaded portable zip to `lab/tools/platform-tools/` | User only |
| **JADX Decompiler** | Downloaded portable zip to `lab/tools/jadx/` (runs via Java) | User only |
| **Apktool** | Portable `apktool.jar` executed via Java | User only |
| **Static Analyzer Engine** | Built-in Python AST & AndroidManifest analyzer (`scripts/static_analyzer.py`) | User only |

#### Device Connectivity:
- **Physical Device:** Connect Android device via USB with Developer Mode & USB Debugging enabled.
- **Wi-Fi ADB:** Connect to any network-accessible Android device (`adb connect <IP>:5555`).
- **Cloud / Remote Emulator:** Connect to a remote Cuttlefish / Genymotion Cloud / Docker-Android instance.

---

## 3. Workflow Execution Matrix (Windows Non-Admin)

| Goal / Workflow | Recommended Non-Admin Path | Fallback Path |
|---|---|---|
| **Preflight Verification** | `.\lab.ps1 preflight` (diagnoses OS, ports, VBox, tools) | Python `orchestrator.py preflight` |
| **Environment Setup** | `.\lab.ps1 setup` (sets up `.venv`, portable tools) | Manual user extraction |
| **WF1: Static Analysis** | Native JADX + Manifest Analyzer (`.\lab.ps1 wf1 -Apk <path>`) | MobSF in VirtualBox / Podman |
| **WF2: Dynamic Analysis** | Physical/Remote ADB + Frida + Mitmproxy (`.\lab.ps1 wf2`) | VirtualBox Android-x86 |
| **Frida Hooking** | Native `.\lab.ps1 hook -Pkg <pkg> -Hook <path>` | Direct frida CLI in `.venv` |
| **Report Generation** | Automated JSON + Markdown aggregation (`.\lab.ps1 report`) | Python reporter |

---

## 4. Verification Checkpoints

1. **Privilege Isolation:** Verify that no operation requests elevation or writes to protected directories (`C:\Windows`, `C:\Program Files`).
2. **Port Integrity:** Ensure standard ports (`6080`, `5555`, `8000`, `8080`, `8081`) can bind to `127.0.0.1` in userland.
3. **Decompilation Validity:** Confirm JADX decompiles APK classes to readable Java sources.
4. **Traffic Interception:** Confirm `mitmweb` launches on `http://127.0.0.1:8081` and captures flows into `artifacts/flows.mitm`.
5. **Frida Injection:** Confirm Frida communicates with target process via ADB tunnel.
