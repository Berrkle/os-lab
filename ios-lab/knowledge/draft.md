# iOS lab: research brief

## Executive summary

There is no official, Apple-supported iOS Simulator container. The simulator is
part of Xcode, and Xcode requires macOS. An `ios-lab` therefore has two honest
paths:

1. **Native macOS** (recommended when a Mac is available): Xcode + Simulator +
   Appium/XCUITest directly on the host.
2. **macOS inside a container on x86_64 Linux** (Ubuntu Server): QEMU/KVM runs a
   macOS guest in Docker; Xcode and the Simulator are installed manually inside
   that guest and reached through the web viewer or VNC.

A third path, cross-compiling an iOS app without a simulator, is represented by
`MobAI-App/iosbox`. It produces an unsigned `.ipa` from Flutter sources but
cannot run or test the UI.

## Why this is harder than the Android lab

| Constraint | Android | iOS |
|---|---|---|
| Emulator/simulator licence | AOSP emulator is redistributable | Simulator ships with Xcode/macOS |
| Container support | `docker-android` images exist | No official macOS container |
| Host CPU | x86_64 or arm64 images | x86_64 macOS VM on Intel/AMD; Apple Silicon uses native macOS |
| GPU | KVM + SwiftShader/GPU | Simulator needs Metal; software rendering is slow |
| Installation | Automated | Manual Apple recovery + macOS Setup Assistant |
| Legal | AOSP | Apple EULA restricts virtualization to Apple hardware |

## Host and performance envelope

- **Ubuntu Server:** x86_64, `/dev/kvm`, 16 GB RAM minimum (24-32 GB
  recommended), 128 GB free disk, 4-8 vCPU. Docker-OSX and dockur/macos are
  x86_64-only. macOS 26 Tahoe is the last x86 release; iOS 27 simulators are
  Apple Silicon-only.
- **Google-free rendering:** without GPU passthrough the macOS desktop and the
  Simulator render with software acceleration. Expect slow UI and low frame
  rates. Reims vGPU (`GPU=Y`) can improve this on Vulkan-capable Intel/AMD
  hosts, but is not a supported Apple graphics stack.
- **Apple Silicon Mac:** use the native path. Docker cannot run the macOS
  simulator on Linux/ARM, and the x86 macOS VM path is the wrong architecture.

## Decision

- Primary Ubuntu container: **`dockurr/macos`** (dockur/macos) because it is
  simple, actively maintained, MIT-licensed, has a web viewer and supports
  Reims vGPU. `sickcodes/Docker-OSX` remains the mature fallback.
- Primary native path: **Xcode + `xcrun simctl` + Appium XCUITest**, with the
  scripts in `../mac/`.
- Experimental simulator-on-Linux option: **`TUNA-NOPE/macbox`**; do not use it
  as the only supported lab path.
- CI/snapshot option: **`cocoonstack/cocoon-macos`**; not a drop-in Docker
  replacement but a capable OCI-based macOS VM engine.

## Legal and security notes

- Only test apps you own or have written permission to assess.
- Apple's macOS EULA does not permit installing macOS on non-Apple hardware.
  The container projects link to this limitation in their own documentation.
- Do not expose the web viewer, VNC or Appium to untrusted networks. Prefer
  localhost, an SSH tunnel or a private VPN.
- Treat the macOS guest as a disposable, isolated analysis environment.

See [`docker-options.md`](docker-options.md), [`setup-ubuntu.md`](setup-ubuntu.md),
[`setup-mac.md`](setup-mac.md), [`operations.md`](operations.md),
[`networking.md`](networking.md), [`usecases.md`](usecases.md) and
[`references.md`](references.md).
