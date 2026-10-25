# 🛡️ Docker-Android Security Lab — Master Command Cheat Sheet

> Consolidated, verified command reference covering **download / install / OS-check / setup / run / execute / follow / report / analyze** for every item in the project files (`setup.md`, `draft.md`, `usecases.md`, `references.md`, `segmentation.md`).
> Verified against official sources (Oct 2026): [budtmo/docker-android GitHub](https://github.com/budtmo/docker-android), [Docker Hub tags](https://hub.docker.com/r/budtmo/docker-android/tags), [Microsoft WSL config docs](https://learn.microsoft.com/en-us/windows/wsl/wsl-config).

---

## 🗺️ Cheat Sheet Map (Classification)

| # | Section | Action Class | Source |
|---|---------|-------------|--------|
| 0 | Global Pre-Flight (OS check) | check os / setup | setup.md |
| 1 | Kali Linux — Native Path | install / run / verify | setup.md |
| 2 | Windows 11 — WSL2 Path | setup / run / verify | setup.md |
| 3 | VirtualBox Ubuntu VM (cross-platform fallback) | setup / run | setup.md |
| 4 | macOS — VM-only path | setup | setup.md |
| 5 | Universal Docker-Android run & lifecycle | run / execute / follow | setup.md, draft.md |
| 6 | ADB connect & device control | execute | setup.md, draft.md |
| 7 | Pentest tools — MobSF, Frida/Objection, mitmproxy, Burp | install / run / analyze | usecases.md, references.md |
| 8 | Reverse-engineering toolkits | download / run / analyze | usecases.md, references.md |
| 9 | Attack simulation (Metasploit cyber range) | setup / execute | references.md |
| 10 | Lab segmentation → page/route mapping | follow / report | segmentation.md |
| 11 | Troubleshooting quick table | diagnose | all |
| 12 | Full reference list | — | references.md |

---

## 0. Global Pre-Flight — Check OS & Virtualization

Run **everywhere first** (native Linux, WSL2, Ubuntu VM). All later steps assume this passes.

```bash
# OS check
cat /etc/os-release
uname -m                      # expect x86_64

# Virtualization check (must print "KVM acceleration can be used")
sudo apt update
sudo apt install cpu-checker -y
kvm-ok
ls -l /dev/kvm
egrep -c '(vmx|svm)' /proc/cpuinfo   # > 0 means CPU virt flags visible
```

**If `kvm-ok` fails:**
```bash
# Load kernel modules (Kali / Ubuntu)
sudo modprobe kvm
sudo modprobe kvm_intel    # Intel
sudo modprobe kvm_amd      # AMD
```
Then enable VT-x/AMD-V in BIOS/UEFI and reboot. ⚠️ No KVM → x86 emulator images will not boot or run unusably slow.

---

## 1. 🐧 Kali Linux — Native Path (Recommended)

**Classification:** `Infrastructure → Environment` | **Perf:** native/fastest

```bash
# Step 1 — KVM check (see Section 0)

# Step 2 — Install Docker Engine (not Docker Desktop on Linux)
curl -fsSL https://get.docker.com | sudo sh
sudo systemctl enable --now docker
sudo usermod -aG docker $USER        # log out/in afterwards

# Step 3 — Run Docker-Android
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

# Step 4 — Verify
# Browser → http://localhost:6080  (noVNC screen)
docker exec -it android-container cat device_status
docker logs -f android-container            # follow boot logs
```

---

## 2. 🪟 Windows 11 — WSL2 Path

**Classification:** `Infrastructure → Environment` | Windows 10 **not supported** (nested virt silently disabled — confirmed in microsoft/WSL issue #40735).

```powershell
# Step 1 — Admin PowerShell
wsl --install
wsl --set-default-version 2

# Step 2 — Enable nested virtualization
# Edit C:\Users\<You>\.wslconfig :
[wsl2]
nestedVirtualization=true
wsl --shutdown
```

```bash
# Step 3 — Inside WSL2 Ubuntu: install Docker Engine
curl -fsSL https://get.docker.com | sudo sh
sudo service docker start
sudo usermod -aG docker $USER

# Step 4 — Verify KVM inside WSL2
sudo apt install cpu-checker -y
kvm-ok
ls -l /dev/kvm
# If permission denied on /dev/kvm:
sudo usermod -a -G kvm $USER
sudo chown root:kvm /dev/kvm && sudo chmod 660 /dev/kvm

# Step 5 — Run (identical docker run as Section 1)
# Browser → http://localhost:6080 (WSL2 forwards localhost by default)
```

---

## 3. 📦 VirtualBox — Ubuntu VM (Cross-Platform Fallback)

**Classification:** `Infrastructure → Environment` | ⚠️ Nested VT-x in VirtualBox is limited — historically reliable on **AMD CPUs**; Intel hosts often fail.

```bash
# Step 1 — VM POWERED OFF, on host:
VBoxManage modifyvm "<VM_Name>" --nested-hw-virt on
# (or GUI: Settings → System → Processor → Enable Nested VT-x/AMD-V)

# Step 2 — Boot Ubuntu VM, verify flags
grep -E '(vmx|svm)' /proc/cpuinfo    # empty = nested virt not active

# Step 3 — Install KVM stack + Docker
sudo apt update
sudo apt install cpu-checker qemu-kvm libvirt-daemon-system -y
kvm-ok                               # must pass
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Step 4 — Run container (Section 1 command)
# Host access: Settings → Network → Advanced → Port Forwarding
#   Host 6080 → Guest 6080, then http://localhost:6080
# (VM needs ≥ 4 GB RAM, 20 GB disk)
```

---

## 4. 🍏 macOS — VM-Only Path

**Classification:** `Infrastructure → Environment` | No native path — Docker Desktop for Mac does **not** expose `/dev/kvm`.

- **Intel Mac:** Ubuntu VM in VirtualBox → follow Section 3 (CPU must support VT-x; nested virt on Intel hosts frequently unavailable in VirtualBox).
- **Apple Silicon (M1/M2/M3):** x86 Android images run under full QEMU TCG emulation → **impractically slow; not recommended**. Use a Linux CI runner with KVM instead.

---

## 5. 🔁 Universal Docker-Android — Run & Lifecycle

**Classification:** `Execution → Container lifecycle`

```bash
# Run (canonical)
docker run -d -p 6080:6080 -p 5554:5554 -p 5555:5555 \
  -e EMULATOR_DEVICE="Samsung Galaxy S10" -e WEB_VNC=true \
  --device /dev/kvm -v data:/home/androidusr \
  --name android-container budtmo/docker-android:emulator_11.0

# Image tags: emulator_9.0 → emulator_14.0 (API 28–34), plus genymotion & mcp variants
docker pull budtmo/docker-android:emulator_14.0

# Follow / inspect / manage
docker logs -f android-container
docker exec -it android-container cat device_status
docker stop android-container && docker start android-container
docker rm -f android-container
docker exec -it android-container bash        # shell inside

# Persistence (⚠️ device data is destroyed on restart without it)
docker run ... -v data:/home/androidusr ...
```

| Flag | Purpose |
|---|---|
| `-p 6080:6080` | noVNC browser UI |
| `-p 5554/5555` | emulator console + ADB |
| `--device /dev/kvm` | **mandatory** |
| `-e EMULATOR_DEVICE` | profile: "Samsung Galaxy S10", "Nexus 5", "Pixel C", … |
| `-e VNC_PASSWORD=xxx` | optional VNC lock |
| `-v data:/home/androidusr` | persist device data |

---

## 6. 📱 ADB — Connect & Control the Emulator

**Classification:** `Execution → Remote control`

```bash
# From host
adb connect 127.0.0.1:5555
adb devices                              # verify
adb install app.apk
adb shell                                # interactive shell (rooted env)
adb logcat                               # follow logs (stream to Progress Console)
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png ./artifacts/
adb emu kill                             # stop emulator
```

---

## 7. 🛡️ Pentest Tool Containers

**Classification:** `Dynamic → Instrumentation / Network / Static`

### 7a. MobSF (static + dynamic analysis)
```bash
# Official image
docker pull opensecurity/mobile-security-framework-mobsf:latest
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest
# UI → http://localhost:8000  (upload APK for static analysis)

# Dynamic mode: point MobSF at the Docker-Android emulator
docker run -it --rm -p 8000:8000 \
  -e MOBSF_ANALYZER_IDENTIFIER="127.0.0.1:5555" \
  opensecurity/mobile-security-framework-mobsf:latest
```

### 7b. Frida + Objection (runtime instrumentation)
```bash
docker pull andrewmackrodt/objection
docker pull va1da5/docker-objection-for-android
docker run --rm -it --network host andrewmackrodt/objection \
  objection -g <package.name> explore
# Inside explore:
#   android sslpinning disable
#   android root disable
#   android hooking list classes
```

### 7c. mitmproxy (traffic analysis)
```bash
docker pull mitmproxy/mitmproxy
docker run --rm -it -p 8080:8080 -p 8081:8081 \
  -v ~/.mitmproxy:/home/mitmproxy/.mitmproxy mitmproxy/mitmproxy mitmweb --web-host 0.0.0.0
# Emulator: Settings → Wi-Fi → proxy = host IP : 8080
# CA cert: http://mitm.it from the emulator browser
```
Alternative: route via **Burp Suite** proxy on host at `:8080`.

### 7d. All-in-one pentest environment
```bash
docker pull hackermater/mobile-pentesting-setup   # Frida, Objection, Apktool, Drozer, ADB, JADX pre-loaded
```

---

## 8. 🔬 Reverse-Engineering Toolkits

**Classification:** `Static → Decompile / Disassemble`

```bash
# Full RE toolkit (androguard, apktool, baksmali/smali, dex2jar, JADX, radare2, Frida, emulators 5.1–7.0)
docker pull cryptax/android-re
docker run -it --rm -v $(pwd)/apks:/work cryptax/android-re

# APK decompile/obfuscate toolkit
docker pull msonst/docker-android-reverse-engineering

# JADX / Apktool / Ghidra / ADB bundle (REA — MCP endpoint)
# → see references.md #18 (REA in Docker)

# Typical analysis flow inside toolkit:
jadx -d ./out app.apk            # decompile to Java
apktool d app.apk -o ./smali_out # decompile to smali
dex2jar app.apk                  # DEX → JAR
r2 app.apk                       # radare2 for native .so analysis
```

---

## 9. ⚔️ Attack Simulation (Cyber Range)

**Classification:** `Agents → Exploit`

```bash
# Docker Compose range: subnet with Docker-Android device + Kali attacker
git clone https://github.com/conteluca/androidExploitwithMetasploit
cd androidExploitwithMetasploit
docker compose up -d
# Workflow: msfvenom generate APK → adb install → Metasploit handler → meterpreter session
```

---

## 10. 🧭 Lab Segmentation → Follow & Report (UI Journey)

**Classification:** `Frontend → Analytics & UX` — from `segmentation.md`

| Phase | Page/Route | Day | Action | Console command anchor |
|---|---|---|---|---|
| 1 Lab Entry | `/` | 1 | authenticate, pick env | Section 0 pre-flight |
| 2 Integration | `/providers` | 2–3 | connect GitHub / upload APK | `adb install`, MobSF UI |
| 3 Agent Setup | `/workflows` | 4–5 | pick WF2 dynamic, configure Frida | Section 7b |
| 4 Execution | `/console-report` | 6–7 | watch live logs | `docker logs -f`, `adb logcat` |
| 5 Analysis | `/analytics` | 8 | segmented findings (severity/agent) | MobSF JSON report, hook success rate |
| 6 Review | `/sitemap` | 9 | export report | MobSF PDF/JSON export |

**Workflow DAGs:**
- **WF1 (Static):** MobSF scan → JADX decompile → report
- **WF2 (Dynamic):** boot Docker-Android → deploy APK → Frida hooks → mitmproxy capture

**Agent classes:** Orchestrator (container lifecycle) · Analyst (parses JADX/MobSF) · Exploit (runs Frida/Appium) · Providers: Static (JADX/Apktool/Ghidra), Dynamic (Frida/Objection/mitmproxy), Execution (Appium/Docker/ADB) · Outputs: Logs / Reports / Artifacts (`.so`, memory dumps, PCAPs).

**UX principles:** dark mode default; monospaced type for logs/routes; wizard-style minimal landing; dockable/filterable progress console.

---

## 11. 🩺 Troubleshooting Quick Table

| Symptom | Cause | Fix |
|---|---|---|
| `"/dev/kvm": no such file` (docker run error, GitHub issue #526) | KVM missing/nested virt off | Sections 0–4; BIOS VT-x; `wsl --shutdown` after `.wslconfig` |
| `kvm-ok` fails in WSL2 | Win10, or perms | Win11 only; `sudo chown root:kvm /dev/kvm; chmod 660` |
| Empty `(vmx|svm)` in VB guest | nested virt not on / Intel limitation | `VBoxManage modifyvm ... --nested-hw-virt on`; prefer AMD host |
| Device wiped after restart | no volume | add `-v data:/home/androidusr` |
| `adb` not found on host | not installed | `sudo apt install adb` (or android-tools-adb) |
| Emulator boots, port closed | ports not mapped | `-p 6080:6080 -p 5554:5554 -p 5555:5555` |
| Container name conflict | stale container | `docker rm -f android-container` |

---

## 12. 📚 References (from references.md, grouped)

**Dynamic analysis & instrumentation:** hackermater/mobile-pentesting-setup · andrewmackrodt/objection · va1da5/docker-objection-for-android · Medium guide (MobSF/Frida/Objection/reFlutter)
**MobSF:** official Docker docs · shahil-sk/AndroidVaptTools · HackerNoon "How to Run Android in Docker"
**Network:** Android Sniffing with mitmproxy (Ubuntu) · mitmproxy Docker image · Burp + mitmproxy refs
**Appium/Automation:** budtmo/docker-android distributed testing (Selenium Grid) · Appium + Docker-Android guide · git.speedcow.top notes
**Reverse engineering:** cryptax/androidre (GitHub + Docker Hub) · msonst/docker-android-reverse-engineering · REA in Docker (MCP)
**Attack simulation:** conteluca/androidExploitwithMetasploit · HackerNoon "Dockerized Android for Cyber Ranges"

**External verification used for this sheet:** [github.com/budtmo/docker-android](https://github.com/budtmo/docker-android) · [hub.docker.com/r/budtmo/docker-android/tags](https://hub.docker.com/r/budtmo/docker-android/tags) · [learn.microsoft.com WSL config](https://learn.microsoft.com/en-us/windows/wsl/wsl-config) · [microsoft/WSL issue #40735](https://github.com/microsoft/WSL/issues/40735) · [microsoft/WSL issue #526](https://github.com/budtmo/docker-android/issues/526)

---
*Generated 2026-10-25. All commands cross-checked against the five project files and official upstream docs.*
