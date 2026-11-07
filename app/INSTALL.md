# Install and remove os-lab

Download the installer for your operating system and architecture from the
[app release](https://github.com/keyvanarasteh/os-lab/releases/latest). Compare its SHA-256 with
the adjacent `.sha256` file before opening it. The app stores the bundled lab files, downloaded
content and optional managed Python under its Files folder; changing or removing the app does not
silently delete those files.

## macOS

Use the universal `.dmg` on Apple Silicon or Intel. Open it, drag **os-lab** to Applications, then
launch it from Applications. The DMG and app must pass Apple's signing and notarization checks.
On first run, the launcher may offer to download managed Python and help start or install a
container engine. Xcode and an iOS Simulator runtime are needed only for the native Apple labs.

To remove the app, quit it and move `/Applications/os-lab.app` to Trash. The Files folder is shown
in the launcher's advanced view. Delete it separately only if you also want to remove downloaded
content, managed Python and local lab data.

## Windows

Use the x64 `-setup.exe` or `.msi`. Run one installer and then launch **os-lab** from the Start menu.
Current release installers are unsigned; Windows SmartScreen may show **More info → Run anyway**.
The app can download managed Python when needed. Docker or Podman with Compose is needed for
container labs, and WSL2 is needed for the Linux-backed VM labs.

Uninstall from **Settings → Apps → Installed apps**. Your chosen Files folder remains until you
remove it separately. If you installed the MSI for all users, Windows may require administrator
authorization to uninstall it.

## Linux

Choose the `amd64` or `arm64` build that matches `dpkg --print-architecture`.

- Debian and Ubuntu: `sudo apt install ./os-lab_<version>_linux_<arch>.deb`
- Fedora and other RPM distributions: `sudo dnf install ./os-lab_<version>_linux_<arch>.rpm`
- Portable AppImage: `chmod +x os-lab_<version>_linux_<arch>.AppImage`, then run it.

Linux packages still need the host WebKitGTK libraries. The app can download managed Python for
its own console, while some lab scripts need system packages and a working Docker or Podman engine.
Use **This computer** and **Health** to see which labs this host can run.

Remove a Debian package with `sudo apt remove os-lab`, an RPM with `sudo dnf remove os-lab`, or
delete the AppImage file. Lab files and downloaded content in the Files folder remain until you
remove them separately.

## Release checks

The release workflows verify package contents and hashes. Linux CI also installs the Debian
package, launches it under a virtual display, and uninstalls it. The macOS release script verifies
code signatures, notarization and stapling before upload. Windows CI checks Authenticode when
SignPath is configured. These checks do not replace a human first-run test on each operating
system, especially for virtualization, container engines and hardware-backed labs.
