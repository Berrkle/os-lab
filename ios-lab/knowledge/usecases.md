# Use cases

All use cases require authorization. Test only apps you own or have explicit
permission to assess.

## 1. Native iOS app development on Linux

Use the Docker macOS guest to run Xcode, build an app and exercise it in the
Simulator. This is the closest Linux-only equivalent to a Mac. Expect a manual
macOS/Xcode install and slower graphics without GPU passthrough.

## 2. React Native / Expo / Flutter verification

- Run the JS/Metro or Flutter toolchain on the Linux host.
- Use `shared/` to move the built `.app`/`.ipa` or project into macOS.
- Install and launch in the Simulator.
- Optionally drive the app with Appium XCUITest.

For Flutter without a simulator, `iosbox` cross-compiles an unsigned `.ipa`;
sign and deploy it with your normal pipeline.

## 3. Appium mobile test automation

Native macOS is the supported path: Xcode + Simulator + Appium XCUITest.
On Ubuntu, run Appium inside the macOS guest and keep the test client close to
it. The `ios-lab/mac/` scripts cover the native lifecycle; the Ubuntu lab
covers the container lifecycle.

## 4. Security review and reverse engineering

- Install the app and supporting tools inside the disposable macOS guest.
- Capture traffic with mitmproxy on the host or in a sidecar container; install
  the mitmproxy CA in the simulator.
- Use Frida/objection only on apps and devices you are authorized to test.
- Prefer a fresh guest snapshot or backup for each engagement.
- Keep secrets and customer data out of `shared/` and backups.

## 5. CI and build reproducibility

For headless macOS builds, use a real macOS runner or `cocoon-macos` snapshots.
The Docker macOS guest is not a lightweight CI container: it is a full VM with a
manual install and a persistent disk. GitHub-hosted macOS runners are usually a
better fit for hosted CI.

## 6. Device/simulator matrix

Native macOS: create multiple simulators with `xcrun simctl create`, boot the
configured one, and use `xcrun simctl list` for the matrix.

Docker: a single macOS guest can host several simulators, subject to RAM and
disk. Heavy parallel simulator use needs a large `RAM_SIZE` and CPU budget.

## Anti-patterns

- Treating an iOS Simulator as a security boundary.
- Running untrusted apps on a personal Mac.
- Exposing VNC/Appium to the internet.
- Assuming a Linux container can run the iOS Simulator directly.
- Using the x86 macOS VM path on Apple Silicon as a performance shortcut.
