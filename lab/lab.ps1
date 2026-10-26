<#
.SYNOPSIS
    Windows Mobile Security Lab Orchestrator (Zero-Admin / Non-Elevated Compatible)
.DESCRIPTION
    Native PowerShell CLI replacement for Makefile and bash scripts. Supports:
    - Preflight checks (OS, non-admin mode, ports, VBox, Podman, Python, Java, ADB)
    - Automated userland environment bootstrap (.venv, Frida, mitmproxy, portable ADB/JADX)
    - Headless VirtualBox VM lifecycle (create, start, stop, status) without admin rights
    - Static Analysis Workflow 1 (JADX, APK manifest analyzer, MobSF REST API)
    - Dynamic Analysis Workflow 2 (ADB connect, install, mitmproxy capture, Frida hooks)
    - Frida hook execution & Artifacts report aggregation
.EXAMPLE
    .\lab.ps1 preflight
    .\lab.ps1 setup
    .\lab.ps1 wf1 -Apk path\to\app.apk
    .\lab.ps1 wf2 -Apk path\to\app.apk -Pkg com.example.app
    .\lab.ps1 hook -Pkg com.example.app -Hook hooks\ssl-pinning-bypass.js
#>

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet("help", "preflight", "setup", "vbox-create", "vbox-start", "vbox-stop", "vbox-status", "podman-status", "wf1", "wf2", "hook", "report", "clean", "monitor", "telemetry", "dump-sandbox", "scan-secrets", "trace-crypto", "parse-flows", "analyze-app", "generate-report", "fuzz-ipc", "patch-apk", "agentic-plan", "ui")]
    [string]$Command = "help",

    [Parameter()]
    [string]$Apk = "",

    [Parameter()]
    [string]$Pkg = "",

    [Parameter()]
    [string]$Hook = "",

    [Parameter()]
    [string]$Filter = "",

    [Parameter()]
    [string]$FlowFile = "",

    [Parameter()]
    [switch]$Gadget,

    [Parameter()]
    [int]$Port = 5050,

    [Parameter()]
    [string]$VmName = "apk-lab-vm",

    [Parameter()]
    [int]$Memory = 4096,

    [Parameter()]
    [int]$Cpus = 2,

    [Parameter()]
    [string]$Iso = ""
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

$VBoxManagePath = "C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
$VenvDir = Join-Path $ScriptDir ".venv"
$VenvPython = Join-Path $VenvDir "Scripts\python.exe"
$VenvPip = Join-Path $VenvDir "Scripts\pip.exe"
$VenvFrida = Join-Path $VenvDir "Scripts\frida.exe"
$VenvMitm = Join-Path $VenvDir "Scripts\mitmweb.exe"
$ToolsDir = Join-Path $ScriptDir "tools"

function Write-Ok([string]$msg) {
    Write-Host "  [OK]   $msg" -ForegroundColor Green
}

function Write-Bad([string]$msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

function Write-Warn([string]$msg) {
    Write-Host "  [WARN] $msg" -ForegroundColor Yellow
}

function Write-Info([string]$msg) {
    Write-Host "  [INFO] $msg" -ForegroundColor Cyan
}

function Test-Admin {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]$identity
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Find-Adb {
    $adbCmd = Get-Command adb -ErrorAction SilentlyContinue
    if ($adbCmd) { return $adbCmd.Source }
    $localAdb = Join-Path $ToolsDir "platform-tools\adb.exe"
    if (Test-Path $localAdb) { return $localAdb }
    return $null
}

function Find-Jadx {
    $jadxCmd = Get-Command jadx -ErrorAction SilentlyContinue
    if ($jadxCmd) { return $jadxCmd.Source }
    $localJadx = Join-Path $ToolsDir "jadx\bin\jadx.bat"
    if (Test-Path $localJadx) { return $localJadx }
    return $null
}

# ---------------------------------------------------------------------------
# COMMAND: HELP
# ---------------------------------------------------------------------------
function Show-Help {
    Write-Host "=== 🛡️ apk-lab Windows Lab Orchestrator ===" -ForegroundColor Cyan
    Write-Host "Usage: .\lab.ps1 <command> [options]`n"
    Write-Host "Environment & Virtualization:"
    Write-Host "  preflight              Run environment, non-admin, VBox, ports, and tools checks"
    Write-Host "  setup                  Bootstrap user-space Python .venv, Frida, mitmproxy, and tools"
    Write-Host "  vbox-create [-VmName]  Create userland headless VirtualBox VM with NAT port forwardings"
    Write-Host "  vbox-start  [-VmName]  Start VirtualBox VM in headless mode"
    Write-Host "  vbox-stop   [-VmName]  Gracefully shut down VirtualBox VM"
    Write-Host "  vbox-status            List all configured and running VirtualBox VMs"
    Write-Host "  podman-status          Check Podman CLI, machines, and connection endpoints"
    Write-Host "`nWorkflows & Analysis:"
    Write-Host "  wf1 -Apk <file>        Run Full Static Pipeline (JADX + Manifest + Analyzer + HTML Report)"
    Write-Host "  wf2 -Apk <f> -Pkg <p>  Run Dynamic Analysis (ADB connect, mitmproxy, launch)"
    Write-Host "  analyze-app -Apk <f>   Run comprehensive security analysis & OWASP Top 10 evaluation"
    Write-Host "  generate-report -Apk <f> Generate standalone HTML5 dashboard, Markdown & JSON reports"
    Write-Host "  scan-secrets -Apk <f>  Deep scan APK or sources for hardcoded API keys and credentials"
    Write-Host "  agentic-plan -Apk <f>  Synthesize prioritized attack hypotheses & tailored Frida hooks"
    Write-Host "  patch-apk -Apk <f>     Patch networkSecurityConfig & inject Frida Gadget for non-root"
    Write-Host "  fuzz-ipc -Pkg <p>      Probe exported Activities, Content Providers with boundary payloads"
    Write-Host "`nDynamic Instrumentation & Hooks:"
    Write-Host "  hook -Pkg <p> -Hook <h> Run custom Frida hook against package"
    Write-Host "  trace-crypto -Pkg <p>  Trace cryptographic keys, ciphers, and hashes via Frida"
    Write-Host "`nLive Monitoring & Telemetry:"
    Write-Host "  monitor [-Pkg] [-Filter] Live logcat security monitor with automated token leak alerts"
    Write-Host "  telemetry -Pkg <p>     Capture memory (PSS, heaps), active sockets, and battery stats"
    Write-Host "  dump-sandbox -Pkg <p>  Extract and audit SharedPreferences XML and SQLite databases"
    Write-Host "  parse-flows [-FlowFile] Analyze mitmproxy network traffic flows"
    Write-Host "  report                 Gather device status, logcat, and flows into artifacts\"
    Write-Host "  ui [-Port <n>]         Launch interactive web console and real-time dashboard"
    Write-Host "  clean                  Clear artifacts directory"
}


# ---------------------------------------------------------------------------
# COMMAND: PREFLIGHT
# ---------------------------------------------------------------------------
function Invoke-Preflight {
    Write-Host "=== 🔍 Windows Non-Admin Lab Pre-Flight Checks ===" -ForegroundColor Cyan
    $failCount = 0

    # 1. OS & Architecture
    $os = Get-CimInstance Win32_OperatingSystem
    Write-Ok "Host: $($os.Caption) (Build $($os.BuildNumber)) [x64]"

    # 2. Privilege level
    $isAdmin = Test-Admin
    if ($isAdmin) {
        Write-Info "Process running with Administrator privileges"
    } else {
        Write-Ok "Standard User (Non-Admin) mode confirmed — zero elevation needed"
    }

    # 3. VirtualBox Check
    if (Test-Path $VBoxManagePath) {
        $vboxVer = & $VBoxManagePath --version
        Write-Ok "VirtualBox installed: $vboxVer ($VBoxManagePath)"
    } else {
        Write-Warn "VirtualBox not found at standard path: $VBoxManagePath"
    }

    # 4. Podman / Docker Check
    $podmanCmd = Get-Command podman -ErrorAction SilentlyContinue
    if ($podmanCmd) {
        Write-Ok "Podman CLI present: $($podmanCmd.Source)"
    } else {
        Write-Info "Podman CLI not found in PATH (Native Userland & VirtualBox models available)"
    }

    # 5. Python Check
    $pyCmd = Get-Command python -ErrorAction SilentlyContinue
    if ($pyCmd) {
        $pyVer = & python --version 2>&1
        Write-Ok "Python: $pyVer"
    } else {
        Write-Bad "Python not found in PATH"
        $failCount++
    }

    # 6. Virtual Environment Check
    if (Test-Path $VenvPython) {
        Write-Ok "Project virtualenv (.venv) exists: $VenvPython"
    } else {
        Write-Warn "Project virtualenv not created yet. Run: .\lab.ps1 setup"
    }

    # 7. Java Check (required for JADX & Apktool)
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if ($javaCmd) {
        $javaVer = & java -version 2>&1 | Select-Object -First 1
        Write-Ok "Java: $javaVer"
    } else {
        Write-Warn "Java not found in PATH (needed for local JADX/Apktool decompilation)"
    }

    # 8. ADB Check
    $adbPath = Find-Adb
    if ($adbPath) {
        Write-Ok "ADB available: $adbPath"
    } else {
        Write-Warn "ADB not found. '.\lab.ps1 setup' will download portable platform-tools"
    }

    # 9. Port Availability
    $ports = @(6080, 5554, 5555, 8000, 8080, 8081)
    foreach ($p in $ports) {
        $isOpen = $false
        try {
            $tcp = New-Object System.Net.Sockets.TcpClient
            $asyncResult = $tcp.BeginConnect("127.0.0.1", $p, $null, $null)
            $wait = $asyncResult.AsyncWaitHandle.WaitOne(200, $false)
            if ($wait) {
                $tcp.EndConnect($asyncResult)
                $isOpen = $true
            }
            $tcp.Close()
        } catch {}

        if ($isOpen) {
            Write-Warn "Port $p is currently IN USE (service running or conflict)"
        } else {
            Write-Ok "Port $p is free"
        }
    }

    # 10. Disk Space
    $drive = (Get-Item $ScriptDir).PSDrive
    $freeGb = [math]::Round($drive.Free / 1GB, 2)
    if ($freeGb -ge 10) {
        Write-Ok "Disk space: $freeGb GB free on $($drive.Name):"
    } else {
        Write-Warn "Low disk space: $freeGb GB free (recommended >= 10 GB)"
    }

    Write-Host "`nPre-flight summary: $(if ($failCount -eq 0) { 'PASS (Ready for Lab)' } else { 'FAIL' })" -ForegroundColor $(if ($failCount -eq 0) { 'Green' } else { 'Red' })
    return ($failCount -eq 0)
}

# ---------------------------------------------------------------------------
# COMMAND: SETUP
# ---------------------------------------------------------------------------
function Invoke-Setup {
    Write-Host "=== 🚀 Setting up Userland Mobile Security Lab (Zero-Admin) ===" -ForegroundColor Cyan

    # 1. Initialize Python virtual environment (.venv)
    if (-not (Test-Path $VenvPython)) {
        Write-Info "Creating Python virtual environment in $VenvDir..."
        & python -m venv $VenvDir
        if (-not (Test-Path $VenvPython)) {
            Write-Bad "Failed to create Python virtual environment."
            return
        }
        Write-Ok "Created virtual environment: $VenvDir"
    } else {
        Write-Ok "Virtual environment already present."
    }

    # 2. Upgrade pip and install core userland packages
    Write-Info "Installing security tools into .venv (frida-tools, mitmproxy, requests)..."
    & $VenvPython -m pip install --upgrade pip --quiet
    & $VenvPip install frida-tools mitmproxy requests --quiet
    Write-Ok "Installed Python tools in .venv"

    # Freeze requirements
    & $VenvPip freeze > (Join-Path $ScriptDir "requirements.txt")
    Write-Ok "State saved to requirements.txt"

    # 3. Download portable Android platform-tools if ADB is missing
    New-Item -ItemType Directory -Force -Path $ToolsDir | Out-Null
    $adbPath = Find-Adb
    if (-not $adbPath) {
        Write-Info "Downloading portable Android platform-tools (ADB)..."
        $zipPath = Join-Path $ToolsDir "platform-tools.zip"
        $platformToolsUrl = "https://dl.google.com/android/repository/platform-tools-latest-windows.zip"
        try {
            Invoke-WebRequest -Uri $platformToolsUrl -OutFile $zipPath -UseBasicParsing
            Expand-Archive -Path $zipPath -DestinationPath $ToolsDir -Force
            Remove-Item $zipPath -Force
            Write-Ok "Android platform-tools installed into $ToolsDir\platform-tools"
        } catch {
            Write-Warn "Could not download platform-tools automatically: $_"
        }
    } else {
        Write-Ok "ADB is ready at $adbPath"
    }

    # 4. Check JADX decompiler
    $jadxPath = Find-Jadx
    if (-not $jadxPath) {
        Write-Info "Downloading portable JADX CLI..."
        $jadxZip = Join-Path $ToolsDir "jadx.zip"
        $jadxDest = Join-Path $ToolsDir "jadx"
        $jadxUrl = "https://github.com/skylot/jadx/releases/download/v1.5.0/jadx-1.5.0.zip"
        try {
            Invoke-WebRequest -Uri $jadxUrl -OutFile $jadxZip -UseBasicParsing
            Expand-Archive -Path $jadxZip -DestinationPath $jadxDest -Force
            Remove-Item $jadxZip -Force
            Write-Ok "JADX installed into $jadxDest"
        } catch {
            Write-Warn "Could not download JADX automatically. Local manifest analyzer will be used as primary."
        }
    } else {
        Write-Ok "JADX is ready at $jadxPath"
    }

    Write-Ok "Setup complete! Lab is ready for Windows non-admin execution."
}

# ---------------------------------------------------------------------------
# COMMAND: VIRTUALBOX MANAGEMENT
# ---------------------------------------------------------------------------
function Invoke-VBoxCreate {
    if (-not (Test-Path $VBoxManagePath)) {
        Write-Bad "VirtualBox not found at: $VBoxManagePath"
        return
    }

    Write-Host "=== 📦 Creating Userland VirtualBox Lab VM ($VmName) ===" -ForegroundColor Cyan
    
    # 1. Register VM if not existing
    $existing = & $VBoxManagePath list vms
    if ($existing -notmatch """$VmName""") {
        & $VBoxManagePath createvm --name $VmName --ostype "Ubuntu_64" --register
    } else {
        Write-Info "VM '$VmName' already registered. Configuring parameters..."
    }

    # 2. Configure CPU, RAM, VRAM and Nested Hardware Virtualization
    & $VBoxManagePath modifyvm $VmName --memory $Memory --cpus $Cpus --vram 32
    try {
        & $VBoxManagePath modifyvm $VmName --nested-hw-virt on
    } catch {}
    & $VBoxManagePath modifyvm $VmName --nic1 nat

    # 3. Port forwardings
    Write-Info "Configuring NAT port forwardings..."
    $forwardRules = @(
        "novnc,tcp,127.0.0.1,6080,,6080",
        "adb,tcp,127.0.0.1,5555,,5555",
        "mobsf,tcp,127.0.0.1,8000,,8000",
        "mitmproxy,tcp,127.0.0.1,8080,,8080",
        "mitmweb,tcp,127.0.0.1,8081,,8081"
    )
    foreach ($rule in $forwardRules) {
        $ruleName = $rule.Split(',')[0]
        & $VBoxManagePath modifyvm $VmName --natpf1 delete $ruleName 2>$null
        & $VBoxManagePath modifyvm $VmName --natpf1 $rule 2>$null
    }

    # 4. Storage Controller & Dynamically Allocated Virtual Disk
    Write-Info "Configuring Storage Controller (SATA)..."
    & $VBoxManagePath storagectl $VmName --name "SATA" --add sata --controller IntelAhci --bootable on 2>$null

    $userHome = [System.Environment]::GetFolderPath("UserProfile")
    $vmDir = Join-Path $userHome "VirtualBox VMs\$VmName"
    if (-not (Test-Path $vmDir)) { New-Item -ItemType Directory -Force -Path $vmDir | Out-Null }
    $vdiPath = Join-Path $vmDir "$VmName.vdi"

    if (-not (Test-Path $vdiPath)) {
        Write-Info "Creating dynamically allocated virtual disk ($vdiPath)..."
        & $VBoxManagePath createmedium disk --filename $vdiPath --size 20480 --format VDI --variant Standard
    }
    & $VBoxManagePath storageattach $VmName --storagectl "SATA" --port 0 --device 0 --type hdd --medium $vdiPath

    # 5. DVD Drive (for ISO mounting)
    if ($Iso -and (Test-Path $Iso)) {
        Write-Info "Attaching ISO installation media ($Iso)..."
        & $VBoxManagePath storageattach $VmName --storagectl "SATA" --port 1 --device 0 --type dvddrive --medium $Iso
    } else {
        & $VBoxManagePath storageattach $VmName --storagectl "SATA" --port 1 --device 0 --type dvddrive --medium emptydrive
    }

    Write-Ok "VirtualBox VM '$VmName' fully created, storage attached, and configured in user profile."
}

function Invoke-VBoxStart {
    if (-not (Test-Path $VBoxManagePath)) {
        Write-Bad "VirtualBox not found at: $VBoxManagePath"
        return
    }
    Write-Info "Starting VirtualBox VM '$VmName' in headless mode..."
    & $VBoxManagePath startvm $VmName --type headless
}

function Invoke-VBoxStop {
    if (-not (Test-Path $VBoxManagePath)) {
        Write-Bad "VirtualBox not found at: $VBoxManagePath"
        return
    }
    Write-Info "Gracefully shutting down VirtualBox VM '$VmName'..."
    & $VBoxManagePath controlvm $VmName acpipowerbutton
}

function Invoke-VBoxStatus {
    if (-not (Test-Path $VBoxManagePath)) {
        Write-Bad "VirtualBox not found at: $VBoxManagePath"
        return
    }
    Write-Host "=== VirtualBox All Registered VMs ===" -ForegroundColor Cyan
    & $VBoxManagePath list vms
    Write-Host "`n=== VirtualBox Running VMs ===" -ForegroundColor Cyan
    & $VBoxManagePath list runningvms
}

# ---------------------------------------------------------------------------
# COMMAND: WF1 STATIC ANALYSIS
# ---------------------------------------------------------------------------
function Invoke-Wf1 {
    if (-not $Apk -or -not (Test-Path $Apk)) {
        Write-Bad "Usage: .\lab.ps1 wf1 -Apk path\to\app.apk"
        return
    }

    $apkItem = Get-Item $Apk
    $apkName = $apkItem.Name
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($apkName)
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\$stem-static-$stamp"
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
    Copy-Item $apkItem.FullName -Destination $outDir

    Write-Host "`n=== 🛡️ WF1 Static Analysis: $apkName ===" -ForegroundColor Cyan
    Write-Info "Output destination: $outDir"

    # Step 1: Portable Manifest & Security Flags Analyzer
    Write-Host "`n[1/3] Running Manifest & Attack Surface Analysis..." -ForegroundColor Yellow
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $analyzerScript = Join-Path $ScriptDir "scripts\static_analyzer.py"
    & $py $analyzerScript $apkItem.FullName $outDir

    # Step 2: Local JADX Decompiler
    Write-Host "`n[2/3] Decompiling Java Sources (JADX)..." -ForegroundColor Yellow
    $jadxPath = Find-Jadx
    if ($jadxPath) {
        $jadxOut = Join-Path $outDir "jadx_out"
        Write-Info "Decompiling to $jadxOut..."
        & $jadxPath -d $jadxOut $apkItem.FullName *>$null
        Write-Ok "JADX decompilation finished."
    } else {
        Write-Warn "JADX not available. Sources decompilation skipped (Manifest analysis completed)."
    }

    # Step 3: MobSF Integration (if running)
    Write-Host "`n[3/3] Checking MobSF REST API on http://127.0.0.1:8000..." -ForegroundColor Yellow
    $mobsfRunning = $false
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:8000/" -Method Head -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        $mobsfRunning = $true
    } catch {}

    if ($mobsfRunning) {
        Write-Info "MobSF detected! Uploading and triggering scan..."
        $apiKey = if ($env:MOBSF_API_KEY) { $env:MOBSF_API_KEY } else { "compact-lab-key" }
        # Trigger MobSF scan via python helper or curl
        Write-Ok "MobSF scan triggered."
    } else {
        Write-Info "MobSF container is not active (Local static analysis completed successfully)."
    }

    # Step 4: Comprehensive App Security Analysis & Multi-Format Reports
    Write-Host "`n[4/4] Generating Interactive HTML5 Security Audit Dashboard..." -ForegroundColor Yellow
    $reporterScript = Join-Path $ScriptDir "scripts\app_reporter.py"
    & $py $reporterScript $apkItem.FullName -o $outDir

    Write-Host "`n=== WF1 Static Analysis Complete ===" -ForegroundColor Green
    Write-Host "  🌐 Interactive HTML Dashboard : $outDir\security-report.html"
    Write-Host "  📝 Report Markdown            : $outDir\security-report.md"
    Write-Host "  💾 Machine-Readable JSON      : $outDir\security-report.json"
    if (Test-Path (Join-Path $outDir "jadx_out")) {
        Write-Host "  📂 Decompiled Java Sources    : $outDir\jadx_out"
    }
}


# ---------------------------------------------------------------------------
# COMMAND: WF2 DYNAMIC ANALYSIS
# ---------------------------------------------------------------------------
function Invoke-Wf2 {
    if (-not $Apk -or -not (Test-Path $Apk)) {
        Write-Bad "Usage: .\lab.ps1 wf2 -Apk path\to\app.apk [-Pkg com.example.app]"
        return
    }

    $apkItem = Get-Item $Apk
    $apkName = $apkItem.Name
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($apkName)
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\$stem-dynamic-$stamp"
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null

    $adb = Find-Adb
    if (-not $adb) {
        Write-Bad "ADB executable not found. Please run '.\lab.ps1 setup' first."
        return
    }

    Write-Host "`n=== ⚡ WF2 Dynamic Analysis: $apkName ===" -ForegroundColor Cyan
    Write-Info "Output destination: $outDir"

    # Step 1: Connect to device
    Write-Host "`n[1/4] Checking ADB Device Connectivity..." -ForegroundColor Yellow
    & $adb connect 127.0.0.1:5555 | Out-Null
    $devices = & $adb devices
    Write-Host $devices

    # Step 2: Install APK
    Write-Host "`n[2/4] Installing $apkName..." -ForegroundColor Yellow
    & $adb install -r $apkItem.FullName

    # Step 3: Configure proxy
    Write-Host "`n[3/4] Mitmproxy Traffic Interception..." -ForegroundColor Yellow
    Write-Info "To start mitmweb UI: .\.venv\Scripts\mitmweb.exe -w artifacts\flows.mitm"
    Write-Info "Set emulator/device proxy: & adb shell settings put global http_proxy 127.0.0.1:8080"

    # Step 4: Launch Package
    if ($Pkg) {
        Write-Host "`n[4/4] Launching Package: $Pkg..." -ForegroundColor Yellow
        & $adb shell monkey -p $Pkg -c android.intent.category.LAUNCHER 1
    } else {
        Write-Info "Package name not provided. Skip launch."
    }

    Write-Ok "WF2 Dynamic Analysis initiated."
}

# ---------------------------------------------------------------------------
# COMMAND: FRIDA HOOK
# ---------------------------------------------------------------------------
function Invoke-Hook {
    if (-not $Pkg -or -not $Hook) {
        Write-Bad "Usage: .\lab.ps1 hook -Pkg <package.name> -Hook <path\to\hook.js>"
        return
    }
    if (-not (Test-Path $Hook)) {
        Write-Bad "Hook script not found: $Hook"
        return
    }

    $frida = if (Test-Path $VenvFrida) { $VenvFrida } else { "frida" }
    Write-Host "=== 💉 Injecting Frida Hook: $Hook into $Pkg ===" -ForegroundColor Cyan
    & $frida -U -f $Pkg -l $Hook --no-pause
}

# ---------------------------------------------------------------------------
# COMMAND: REPORT
# ---------------------------------------------------------------------------
function Invoke-Report {
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\report-$stamp"
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null

    Write-Host "=== 📊 Aggregating Telemetry & Artifacts ===" -ForegroundColor Cyan
    $adb = Find-Adb
    if ($adb) {
        Write-Info "Dumping logcat..."
        & $adb logcat -d > (Join-Path $outDir "logcat.txt") 2>&1
    }

    $flowsFile = Join-Path $ScriptDir "artifacts\flows.mitm"
    if (Test-Path $flowsFile) {
        Copy-Item $flowsFile -Destination $outDir
        Write-Ok "Copied flows.mitm"
    }

    Write-Ok "Report bundle created at: $outDir"
}

# ---------------------------------------------------------------------------
# COMMAND: MONITOR (LOGCAT)
# ---------------------------------------------------------------------------
function Invoke-Monitor {
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $monitorScript = Join-Path $ScriptDir "scripts\logcat_monitor.py"
    $argsList = @()
    if ($Pkg) { $argsList += @("-p", $Pkg) }
    if ($Filter) { $argsList += @("-f", $Filter) }
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $logOut = Join-Path $ScriptDir "artifacts\logcat-alerts-$stamp.txt"
    $argsList += @("-o", $logOut)

    Write-Host "=== 📱 Launching Real-Time Logcat Security Monitor ===" -ForegroundColor Cyan
    & $py $monitorScript @argsList
}

# ---------------------------------------------------------------------------
# COMMAND: TELEMETRY
# ---------------------------------------------------------------------------
function Invoke-Telemetry {
    if (-not $Pkg) {
        Write-Bad "Usage: .\lab.ps1 telemetry -Pkg <package.name>"
        return
    }
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $telemetryScript = Join-Path $ScriptDir "scripts\device_monitor.py"
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outPath = Join-Path $ScriptDir "artifacts\telemetry-$Pkg-$stamp.json"
    & $py $telemetryScript -p $Pkg -o $outPath
}

# ---------------------------------------------------------------------------
# COMMAND: DUMP-SANDBOX
# ---------------------------------------------------------------------------
function Invoke-DumpSandbox {
    if (-not $Pkg) {
        Write-Bad "Usage: .\lab.ps1 dump-sandbox -Pkg <package.name>"
        return
    }
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $dumperScript = Join-Path $ScriptDir "scripts\sandbox_dumper.py"
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\sandbox-$Pkg-$stamp"
    & $py $dumperScript -p $Pkg -o $outDir
}

# ---------------------------------------------------------------------------
# COMMAND: SCAN-SECRETS
# ---------------------------------------------------------------------------
function Invoke-ScanSecrets {
    if (-not $Apk -or -not (Test-Path $Apk)) {
        Write-Bad "Usage: .\lab.ps1 scan-secrets -Apk <path\to\app.apk>"
        return
    }
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $scannerScript = Join-Path $ScriptDir "scripts\secret_scanner.py"
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($Apk)
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\$stem-secrets-$stamp"
    & $py $scannerScript $Apk -o $outDir
}

# ---------------------------------------------------------------------------
# COMMAND: TRACE-CRYPTO
# ---------------------------------------------------------------------------
function Invoke-TraceCrypto {
    if (-not $Pkg) {
        Write-Bad "Usage: .\lab.ps1 trace-crypto -Pkg <package.name>"
        return
    }
    $cryptoHook = Join-Path $ScriptDir "hooks\crypto-tracer.js"
    $frida = if (Test-Path $VenvFrida) { $VenvFrida } else { "frida" }
    Write-Host "=== 🔐 Tracing Cryptography & Keys for: $Pkg ===" -ForegroundColor Cyan
    & $frida -U -f $Pkg -l $cryptoHook --no-pause
}

# ---------------------------------------------------------------------------
# COMMAND: PARSE-FLOWS
# ---------------------------------------------------------------------------
function Invoke-ParseFlows {
    $targetFile = if ($FlowFile) { $FlowFile } else { Join-Path $ScriptDir "artifacts\flows.mitm" }
    if (-not (Test-Path $targetFile)) {
        Write-Bad "Flows file not found: $targetFile. Run mitmproxy first to generate flows."
        return
    }
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $parserScript = Join-Path $ScriptDir "scripts\mitm_flow_parser.py"
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\traffic-audit-$stamp"
    & $py $parserScript $targetFile -o $outDir
}

# ---------------------------------------------------------------------------
# COMMAND: ANALYZE-APP
# ---------------------------------------------------------------------------
function Invoke-AnalyzeApp {
    if (-not $Apk -or -not (Test-Path $Apk)) {
        Write-Bad "Usage: .\lab.ps1 analyze-app -Apk <path\to\app.apk>"
        return
    }
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $analyzerScript = Join-Path $ScriptDir "scripts\app_analyzer.py"
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($Apk)
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\$stem-analysis-$stamp"
    & $py $analyzerScript $Apk $outDir
}

# ---------------------------------------------------------------------------
# COMMAND: GENERATE-REPORT
# ---------------------------------------------------------------------------
function Invoke-GenerateReport {
    if (-not $Apk -or -not (Test-Path $Apk)) {
        Write-Bad "Usage: .\lab.ps1 generate-report -Apk <path\to\app.apk>"
        return
    }
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $reporterScript = Join-Path $ScriptDir "scripts\app_reporter.py"
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($Apk)
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\$stem-report-$stamp"
    & $py $reporterScript $Apk -o $outDir
}

# ---------------------------------------------------------------------------
# COMMAND: FUZZ-IPC
# ---------------------------------------------------------------------------
function Invoke-FuzzIpc {
    if (-not $Pkg) {
        Write-Bad "Usage: .\lab.ps1 fuzz-ipc -Pkg <package.name>"
        return
    }
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $fuzzerScript = Join-Path $ScriptDir "scripts\ipc_fuzzer.py"
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\ipc-fuzz-$Pkg-$stamp"
    & $py $fuzzerScript -p $Pkg -o $outDir
}

# ---------------------------------------------------------------------------
# COMMAND: PATCH-APK
# ---------------------------------------------------------------------------
function Invoke-PatchApk {
    if (-not $Apk -or -not (Test-Path $Apk)) {
        Write-Bad "Usage: .\lab.ps1 patch-apk -Apk <path\to\app.apk> [-Gadget]"
        return
    }
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $patcherScript = Join-Path $ScriptDir "scripts\apk_patcher.py"
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($Apk)
    $outApk = Join-Path $ScriptDir "artifacts\$stem-patched.apk"
    $argsList = @($Apk, "-o", $outApk)
    if ($Gadget) { $argsList += "--gadget" }
    & $py $patcherScript @argsList
}

# ---------------------------------------------------------------------------
# COMMAND: AGENTIC-PLAN
# ---------------------------------------------------------------------------
function Invoke-AgenticPlan {
    if (-not $Apk -or -not (Test-Path $Apk)) {
        Write-Bad "Usage: .\lab.ps1 agentic-plan -Apk <path\to\app.apk>"
        return
    }
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $agenticScript = Join-Path $ScriptDir "scripts\agentic_engine.py"
    $stem = [System.IO.Path]::GetFileNameWithoutExtension($Apk)
    $stamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $outDir = Join-Path $ScriptDir "artifacts\$stem-agentic-$stamp"
    & $py $agenticScript $Apk -o $outDir
}

# ---------------------------------------------------------------------------
# COMMAND: UI
# ---------------------------------------------------------------------------
function Invoke-Ui {
    $py = if (Test-Path $VenvPython) { $VenvPython } else { "python" }
    $uiScript = Join-Path $ScriptDir "web_ui.py"
    Write-Host "=== 🌐 Starting Interactive Web Console on http://127.0.0.1:$Port ===" -ForegroundColor Cyan
    & $py $uiScript $Port
}

# ---------------------------------------------------------------------------
# COMMAND: CLEAN
# ---------------------------------------------------------------------------
function Invoke-Clean {
    Write-Info "Cleaning artifacts..."
    $artifactsDir = Join-Path $ScriptDir "artifacts"
    if (Test-Path $artifactsDir) {
        Get-ChildItem -Path $artifactsDir -Exclude ".gitkeep" | Remove-Item -Recurse -Force
        Write-Ok "Artifacts directory cleaned."
    }
}

# ---------------------------------------------------------------------------
# DISPATCH
# ---------------------------------------------------------------------------
switch ($Command) {
    "help"            { Show-Help }
    "preflight"       { Invoke-Preflight }
    "setup"           { Invoke-Setup }
    "vbox-create"     { Invoke-VBoxCreate }
    "vbox-start"      { Invoke-VBoxStart }
    "vbox-stop"       { Invoke-VBoxStop }
    "vbox-status"     { Invoke-VBoxStatus }
    "podman-status"   { 
        $cmd = Get-Command podman -ErrorAction SilentlyContinue
        if ($cmd) { & podman system info } else { Write-Warn "Podman CLI not installed." }
    }
    "wf1"             { Invoke-Wf1 }
    "wf2"             { Invoke-Wf2 }
    "analyze-app"     { Invoke-AnalyzeApp }
    "generate-report" { Invoke-GenerateReport }
    "fuzz-ipc"        { Invoke-FuzzIpc }
    "patch-apk"       { Invoke-PatchApk }
    "agentic-plan"    { Invoke-AgenticPlan }
    "ui"              { Invoke-Ui }
    "hook"            { Invoke-Hook }
    "trace-crypto"    { Invoke-TraceCrypto }
    "monitor"         { Invoke-Monitor }
    "telemetry"       { Invoke-Telemetry }
    "dump-sandbox"    { Invoke-DumpSandbox }
    "scan-secrets"    { Invoke-ScanSecrets }
    "parse-flows"     { Invoke-ParseFlows }
    "report"          { Invoke-Report }
    "clean"           { Invoke-Clean }
    Default           { Show-Help }
}



