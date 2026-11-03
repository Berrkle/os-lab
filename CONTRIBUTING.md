# Contributing to os-lab

Thanks for your interest in contributing! os-lab builds isolated security labs
(Android, Windows, Linux and macOS/iOS) and a web console that drives them.
Contributions of all kinds are welcome: code, documentation, Frida hooks,
workflow recipes, translations and bug reports.

## Ground rules

- **Authorization only.** Everything here is for testing systems and apps you
  own or are authorized in writing to assess, inside isolated labs. Do not
  contribute content, artifacts or examples taken from systems you were not
  authorized to test. See the [Acceptable Use Policy](docs/legal/ACCEPTABLE_USE.md).
- **No third-party binaries or proprietary media.** Do not commit APKs you do
  not own, Windows or macOS images, Google's platform-tools or other vendor
  binaries. Download them at setup time from the vendor instead (see
  `android-lab/lab/scripts/get_platform_tools.py`).
- **Compatible licences only.** New dependencies must have a licence compatible
  with Apache-2.0 and must be added to the
  [Third-Party Notices](docs/legal/THIRD_PARTY_NOTICES.md).
- **No secrets or personal data** in code, tests, fixtures or screenshots.
- Be respectful: see the [Code of Conduct](CODE_OF_CONDUCT.md).
- Found a vulnerability in os-lab itself? Follow the [Security Policy](SECURITY.md);
  do **not** open a public issue.

## Step 1: Set up

You need git, Python 3.11 or newer and bash (Linux, macOS or WSL2). Node.js 22+
is only needed to work on the dashboard.

```bash
git clone https://github.com/<you>/os-lab   # your fork
cd os-lab
git remote add upstream https://github.com/keyvanarasteh/os-lab
./labctl ui                                  # the web console at http://127.0.0.1:5050
```

The one-command installers in [`scripts/setup/`](scripts/setup/README.md) also
set up a virtualenv and the dashboard.

## Step 2: Create a branch

```bash
git fetch upstream
git checkout -b feat/short-description upstream/master   # or fix/…, docs/…, chore/…
```

Keep each pull request to one logical change.

## Step 3: Make the change

| Area | Where | Notes |
|------|-------|-------|
| Android lab scripts | `android-lab/lab/scripts/` | Prefer the Python standard library; expose a `main()` and importable helpers |
| Frida hooks | `android-lab/lab/hooks/` | One concern per file, with a header comment saying what it bypasses or traces and how to load it |
| Web console API and lab engine | `android-lab/lab/web_ui.py`, `console/oslab.py` | Lab actions must stay typed and validated; never accept command strings from the page |
| Dashboard | `dashboard/src/` | Astro + React + Tailwind; run `npm run dev` with the console on port 5050 |
| VM labs | `win-lab/`, `linux-lab/`, `ios-lab/`, `labctl` | `bash` with `set -euo pipefail` |
| Windows lab script | `android-lab/lab/lab.ps1`, `scripts/setup/install.ps1` | Must parse in Windows PowerShell 5.1 and PowerShell 7; keep **UTF-8 with BOM** |
| Legal documents | `docs/legal/` | Shown in the dashboard at `/legal/`; every statement must match what the code does |

For the Android lab runbook see [`android-lab/lab/README.md`](android-lab/lab/README.md),
for Windows non-admin use [`android-lab/lab/README-WINDOWS.md`](android-lab/lab/README-WINDOWS.md),
and for iOS [`ios-lab/README.md`](ios-lab/README.md).

## Curated Contribution Roadmap & Priority TODOs

Looking for high-impact areas to contribute? The following curated tasks are classified across our three core domains: **Penetration Testing**, **Open Source Operating Systems**, and **Firewall Solutions**. They incorporate architectural patterns from our desktop runtime (local MCP hosting, capability discovery, single-instance execution, release profile tuning) and real-world security engineering instrumentation.

These tasks are also interactively browsable and filterable inside the dashboard under the **Contribute → Roadmap & TODOs** tab.

### 1. Penetration Testing (Pentesting)

| ID | Task | Scope & Reference | Priority / Effort |
|---|---|---|---|
| **PENT-01** | **Native Frida Instrumentation Module & Runtime Hook Suite** | Universal Interceptor skeleton (`onEnter`, `onLeave`, `retval.replace`), native test harness (`hedef.c`), and observation/modification scripts (`gozlem.js`, `degistir.js`). | **High** · Medium |
| **PENT-02** | **Automated Browser Extension Injection & Malicious Script Audit Engine** | Static and dynamic scanner for Manifest V3/V2 extensions; audits permissions (`all_urls`, `cookies`, `scripting`, `activeTab`, `nativeMessaging`) and AST/regex patterns for `eval`, `executeScript`, and two-stage dynamic payload delivery. | **High** · Medium |
| **PENT-03** | **Headless Android Analysis Pipeline & Objection SSL Pinning Bypass** | Containerized Alpine/Docker Android emulator runner; automated `frida-server` deployment, system CA installation for mitmproxy, and automated objection hooks for universal SSL pinning bypass. | **High** · Large |
| **PENT-04** | **Local MCP Security Tool Provider Host (Pattern D8/D9)** | Embedded Model Context Protocol (MCP) stdio JSON-RPC server exposing isolated security tools (Frida attachment, APK manifest inspector, socket audit) to autonomous AI agents. | **Medium** · Medium |
| **PENT-05** | **Binary Exploitation & Hardening Verification Harness** | Automated binary mitigation audit (`readelf` check for NX, ASLR/PIE, Stack Canaries, RELRO) and AFL++ crash triage smoke runner in `linux-lab/`. | **Medium** · Medium |

### 2. Open Source Operating Systems

| ID | Task | Scope & Reference | Priority / Effort |
|---|---|---|---|
| **OS-01** | **Automated Linux & Ubuntu Server Lab Provisioning with Systemd Lifecycle Engine** | Cloud-init unattended server deployment (Ubuntu Server / Alpine); hardened systemd service templates (`ProtectSystem=strict`, `PrivateTmp=true`, `Type=notify`) with automated watchdog timers and journal logging. | **High** · Medium |
| **OS-02** | **Remote-SSH Fleet Orchestration & Zero-Config Key Distribution** | Remote-SSH manager automating ed25519 key generation, dynamic IP discovery across virtualization bridges/NAT, and `~/.ssh/config` formatting with ProxyCommand and Cloudflare Access support. | **High** · Medium |
| **OS-03** | **Host Hardware & Installed Software Capability Detection Engine (Pattern D6)** | Cross-platform capability scanner querying package managers (`apt`, `dpkg`), toolchain versions (`git`, `node`, `uv`, `python3`), hypervisor capabilities (`/dev/kvm`, `VT-x/AMD-V`, `WSL2`), feeding the dashboard host view and client registry without external telemetry. | **High** · Small–Medium |
| **OS-04** | **Automated Auth Log Audit & Brute-Force Extraction Daemon** | Lightweight event-driven systemd service parsing `/var/log/auth.log` or SSH journal logs; extracts failed brute-force attacks, attacker IPs, and unauthorized `sudo` attempts into structured SQLite/JSON for dashboard analytics. | **Medium** · Small |
| **OS-05** | **Release Profile Tuning & Single-Instance Process Enforcement (Pattern D1/D5)** | Compiler profile optimization (`lto = true`, `codegen-units = 1`, `opt-level = "s"`, `panic = "abort"`, binary stripping) and single-instance socket/lockfile enforcement preventing redundant process execution. | **Medium** · Tiny–Small |

### 3. Firewall Solutions

| ID | Task | Scope & Reference | Priority / Effort |
|---|---|---|---|
| **FW-01** | **UFW Automation Engine & Priority-Aware Rule Optimizer** | Programmatic UFW orchestrator managing default policies (`default deny incoming`, `default allow outgoing`) and rule ordering; optimizes rule sequence by placing high-frequency traffic rules ahead of broad matchers; handles `deny` vs `reject` semantics. | **High** · Medium |
| **FW-02** | **Real-Time Firewall Log Streaming & Telegram Alert Daemon with Loop Suppression** | Daemon tailing `/var/log/ufw.log` with instant alert dispatches; includes intelligent noise reduction and loop-prevention filters suppressing outbound ALLOW logs and port 53 DNS loops to avoid notification storms. | **High** · Medium |
| **FW-03** | **Automated Firewall Security Audit Engine & Systemd Timer** | Continuous compliance checker on systemd timer (`ufw-audit.timer`); audits active rules against RFC 1918 private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), flags insecure exposed management ports, and validates DMZ boundaries. | **High** · Small–Medium |
| **FW-04** | **Layer 7 WAF Integration & Application Threat Defense** | Ready-to-deploy L7 WAF recipes (ModSecurity / OWASP Core Rule Set / Nginx reverse proxy) illustrating defense-in-depth where L3/L4 packet filters cannot inspect payloads (e.g., PHP memory exhaustion RCE, request smuggling). | **Medium** · Medium |
| **FW-05** | **Multi-Branch Enterprise Network Segmentation & Open Source Appliance Benchmarks** | Realistic multi-branch topology templates (HQ, Branch, DMZ, Dev LAN) with CIDR allocations (/24, /17) and VLAN tagging; automated performance benchmarks comparing throughput and latency across pfSense, OPNsense, IPFire, and native UFW/nftables. | **Medium** · Large |
| **FW-06** | **Zero-Trust Role-Based VPN Gateway vs Direct SSH Ingress** | WireGuard mesh gateway eliminating public SSH port exposure; provides automated key provisioning and role-based subnet routing per authenticated client profile. | **Medium** · Medium |

## Step 4: Add tests

Add or update tests in `android-lab/lab/tests/` for any change in behaviour.
Tests run offline: mock network calls and never download from the internet.

## Step 5: Run the checks

GitHub Actions is disabled for this repository; the local runner replaces CI.
Run it before every pull request:

```bash
./scripts/run-tests.sh          # everything
./scripts/run-tests.sh --quick  # unit tests only
```

It runs the pytest suite, a sample-analysis smoke test, `bash -n` on every
shell script, `lat check` when `lat` is installed, and, when
`dashboard/node_modules` exists, the dashboard typecheck plus a check that the
committed build is current.

## Step 6: Rebuild the dashboard if you changed it

`dashboard/dist/` is committed so hosts without Node.js still get the
dashboard. After changing anything in `dashboard/src/` or `docs/legal/`:

```bash
cd dashboard
npm ci
npm run check
npm run build      # refreshes dashboard/dist; commit it with your change
```

## Step 7: Update the docs and the knowledge graph

- Update the README of the area you changed.
- If you changed architecture, behaviour or tests, update the knowledge graph in
  [`lat.md/`](lat.md/) (what the project does and why, not a changelog) and run
  `lat check`.
- If you changed what data is stored or sent, or added a dependency, update
  [`docs/legal/`](docs/legal/).

## Step 8: Commit and open a pull request

1. Commit with [Conventional Commits](https://www.conventionalcommits.org/),
   for example `fix(android): …`, `feat(dashboard): …`, `docs: …`.
2. Push to your fork and open a pull request against `master`.
3. Fill in the [pull request template](.github/PULL_REQUEST_TEMPLATE.md),
   including how you tested the change.
4. Respond to review comments; maintainers merge once the checks pass and the
   review is done.

## Reporting bugs and requesting features

Use the [issue templates](.github/ISSUE_TEMPLATE/). For open-ended questions,
open a [Discussion](https://github.com/keyvanarasteh/os-lab/discussions).

## Licence

By contributing, you agree that your contributions are licensed under the
[Apache License 2.0](LICENSE), the licence that covers this project.
