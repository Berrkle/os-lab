# Native macOS setup

This is the recommended path when a Mac is available. It is the only path that
uses Apple's supported simulator stack and the only practical Apple Silicon
path.

## Requirements

- macOS current enough for the installed Xcode.
- Xcode from the App Store or Apple Developer downloads.
- 16 GB RAM minimum; 24 GB+ recommended for Xcode + Simulator + Appium.
- 30 GB+ free disk for Xcode and simulator runtimes.

## 1. Check the host

```bash
cd ios-lab
make mac-doctor
```

This checks macOS, CPU architecture, memory, disk, Xcode, installed runtimes,
available devices, Node and Appium.

If Xcode is missing:

```bash
xcode-select --install
```

Then install Xcode from the App Store, open it once, accept the licence and
install additional components.

## 2. Install a simulator runtime

Open **Xcode > Settings > Components** and install an iOS runtime. Confirm:

```bash
xcrun simctl list runtimes
xcrun simctl list devices available
```

On Apple Silicon, use native arm64 simulators. On Intel Macs, the newest
available simulator depends on the installed macOS and Xcode.

## 3. Configure the lab

```bash
cd ios-lab/mac
cp config.env.example config.env
```

Set `SIM_DEVICE` to an installed device, or use a preset:

```bash
cd ..
make mac-profiles
make mac-profile PROFILE=iphone
make mac-profile PROFILE=ipad
make mac-profile PROFILE=legacy
```

`run-simulator.sh` falls back to the first available iPhone if the configured
device is not installed.

## 4. Boot the simulator

```bash
make mac-sim
make mac-status
make mac-stop
```

The script boots the configured device with `xcrun simctl`, opens Simulator.app
and waits for `simctl bootstatus`.

## 5. Appium / XCUITest

Check prerequisites:

```bash
make mac-doctor
```

Install tooling via Homebrew when needed:

```bash
make mac-setup INSTALL=1
```

This installs Node and Appium, then the XCUITest driver. Start and stop it:

```bash
make mac-appium
make mac-status
make mac-appium-stop
```

The Appium endpoint is `http://127.0.0.1:4723` by default. The log is
`ios-lab/artifacts/appium.log`.

## 6. WebDriverAgent

Appium's XCUITest driver builds and installs WebDriverAgent into the simulator
on first use. This requires Xcode command-line access and may take a minute.
If the first session fails, open the generated Xcode project under
`~/Library/Developer/Xcode/DerivedData` or rerun with verbose Appium logs.

## 7. Suggested directory layout

```
ios-lab/mac/
├── config.env.example   # device, Appium host/port, timeouts
├── profiles/            # iphone / ipad / legacy presets
├── doctor-mac.sh
├── setup-mac.sh
├── run-simulator.sh
├── stop-simulator.sh
├── appium.sh
├── profile.sh
├── status-mac.sh
└── lib.sh
```

## 8. CI note

GitHub-hosted macOS runners already provide Xcode and simulators. Do not try to
run the macOS-in-Docker path there; use `xcrun simctl` plus `xcodebuild test`
or a hosted macOS runner. The Docker path in this repository is for Linux
servers.

## Limitations

- A physical iPhone needs a provisioning profile and a development team; the
  simulator does not.
- The Simulator is not a security boundary. Do not install untrusted apps on a
  Mac you care about; use a dedicated user or a disposable macOS VM.
- Appium XCUITest can only drive simulators and devices that Xcode can see.
