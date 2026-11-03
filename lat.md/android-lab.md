# android-lab

An Android application security and reverse-engineering lab built on
`budtmo/docker-android`, MobSF, mitmproxy, Frida and containerized RE tools. It
is a multi-container stack with several execution paths.

The lab root is [[android-lab]]; the runnable core is [[android-lab/lab]] with
compose [[android-lab/lab/docker-compose.yml]] and runbook
[[android-lab/lab/README.md]].

## Execution paths

The lab runs in several modes depending on host capabilities.

- **Dynamic (KVM):** the full emulator stack via [[android-lab/lab/docker-compose.yml]]
  — noVNC :6080, ADB :5555, MobSF :8000, mitmproxy :8080/:8081.
- **Static (KVM-free):** MobSF + mitmproxy + tools only, via
  [[android-lab/lab/docker-compose.win.yml]], for hosts without `/dev/kvm`.
- **Windows zero-admin:** a PowerShell orchestrator [[android-lab/lab/lab.ps1]]
  that provisions a VirtualBox/Podman userland lab without elevation; runbook
  [[android-lab/lab/README-WINDOWS.md]]. It is UTF-8 **with BOM** so it parses
  under Windows PowerShell 5.1, and defines `Send-VmKeyString` at script scope.
- **Ubuntu Server:** host provisioning via [[android-lab/lab/scripts/setup-ubuntu.sh]]
  and runbook [[android-lab/lab/README-UBUNTU.md]].

## Workflows

Two end-to-end workflows are wrapped by the [[android-lab/lab/Makefile]].

- **WF1 (static):** MobSF scan + JADX decompile + report —
  [[android-lab/lab/scripts/wf1-static.sh]].
- **WF2 (dynamic):** emulator + mitmproxy + Frida instrumentation —
  [[android-lab/lab/scripts/wf2-dynamic.sh]].

The orchestrator entry point is [[android-lab/lab/orchestrator.py]], with a web
console in [[android-lab/lab/web_ui.py]].

## Analysis components

Reusable analysis scripts live in [[android-lab/lab/scripts]].

They include the deep analyzer [[android-lab/lab/scripts/app_analyzer.py]], the
report generator [[android-lab/lab/scripts/app_reporter.py]], the MobSF client
[[android-lab/lab/scripts/mobsf_client.py]], the secret scanner
[[android-lab/lab/scripts/secret_scanner.py]], the agentic Frida-hook generator
[[android-lab/lab/scripts/agentic_engine.py]] and the APK patcher
[[android-lab/lab/scripts/apk_patcher.py]]. Prebuilt Frida hooks are in
[[android-lab/lab/hooks]].

## Tests

The lab ships a pytest suite in [[android-lab/lab/tests]].

It covers the analyzer, reporter, MobSF client, secret scanner, patcher, flow
parser, agentic engine and web UI, and runs in CI — see
[[tooling#Local test runner]].
