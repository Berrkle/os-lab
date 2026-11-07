# os-lab app (Tauri v2)

The os-lab dashboard in a native window, for macOS, Windows and Linux. Ported from
[qLar's Tauri app](https://github.com/keyvanarasteh/qLar) (`agents-apps/qLar`): the same
single-instance, store, dialog and opener plugins, without its agent-host code.

## How it works

1. A local launcher page (`ui/`, plain HTML/JS) calls the `console_start` command.
2. The shell finds an os-lab root (see below), finds Python 3.9+, starts
   `android-lab/lab/web_ui.py` on a free `127.0.0.1` port and waits for `/healthz`.
3. The window navigates to that URL. The page is the normal dashboard, served by the normal
   console, so every page and lab action (preview → token → run) behaves as in `./labctl ui`.

Nothing in the app runs lab commands. The dashboard page gets **no Tauri IPC**
(`capabilities/launcher.json` names the launcher window only). Links that leave the console open in
the system browser. The console runs under a small supervisor and exits with the app, even if the
app is killed; quitting stops its process group, jobs included.

### Which os-lab files run

In order: `OSLAB_ROOT` → a checkout chosen with **Use my os-lab checkout…** (remembered) → the
repository containing `app/` in a debug build → the **bundled runtime**, copied into the app data
folder on first launch and after an update. A sync never overwrites or removes `.env`,
`config.env`, `storage/`, `artifacts/` and the other state names listed in `runtime.rs`; only the
dashboard build is replaced wholesale.

## Develop and build

Needs Node 22+, Rust 1.85+ and Python 3.9+.

```bash
cd app
npm ci
npm run stage     # bundle tracked lab files + a fresh dashboard build (src-tauri/resources/os-lab)
npm run dev       # debug app; runs against this checkout, no staging needed
npm run build     # release bundle: .app/.dmg, NSIS/MSI, deb/AppImage (per host OS)
npm run test:stage
(cd src-tauri && cargo test)
```

`npm run stage` bundles **git-tracked** files only, minus credentials and guest data, so an
untracked `.env` or VM disk cannot ship. `--no-build` stages the committed `dashboard/dist`.

## Release (macOS DMG, notarized)

`app/scripts/release-mac.sh` builds a universal DMG, signs it (Developer ID), notarizes the app and the DMG, staples, verifies with `codesign`/`spctl`/`stapler`, and with `--publish` uploads it to the GitHub release `app-v<version>` with a SHA-256 file. Without `--publish` it uploads nothing; `--no-notarize` signs only. Credentials come from the environment, the git-ignored `secrets/` folder or the login keychain, never from the repo (`secrets/README.md`); the script refuses to run if a key or secrets file is tracked.

## Release (Windows installers, Debian package)

Run these on the machine that matches the platform; all three publish into the same GitHub release
`app-v<version>` (whichever runs first creates it), each asset with a `.sha256` file.

- `app\scripts\release-win.ps1 [-Publish] [-NoSign]` (PowerShell on Windows) builds the NSIS setup `.exe` and the WiX `.msi`
  as `os-lab_<v>_windows_x64-setup.exe` / `.msi`. Authenticode signing is optional: it is used when a certificate
  thumbprint or `.pfx` is configured (`secrets/README.md`), otherwise the installers are unsigned and SmartScreen warns.
  `-Publish` uses `gh`, or the credential git already stores for pushes.
- `app/scripts/release-deb.sh [--publish] [--install-deps]` (Debian/Ubuntu) builds `os-lab_<v>_linux_<arch>.deb`, checks that
  it depends on `python3`, bundles the runtime and contains no secret-looking file. Nothing to sign.

Signed Windows installers (free, through SignPath Foundation and GitHub Actions) are described in [SIGNING.md](SIGNING.md).

Like the macOS script, both refuse to run if anything under `secrets/` (except its README) or a key file is tracked.

## Not done yet

- No auto-update (needs a signing key).
- `release-win.ps1` built and published the unsigned 0.1.0 Windows installers; installing and launching them is still untested. `release-deb.sh` has built and published the 0.1.0 `.deb` on Ubuntu (amd64); installing and launching it is still untested.
- Only built and run on macOS (aarch64); the Windows and Linux paths (`py -3`, `taskkill`, the
  supervisor's `ctypes` parent check) compile-time-gated but untested.
- Phones are out of scope: labs need a desktop host.
- If a release build fails with `can't find crate for ..._macros`, run the same
  `cargo build --release --features tauri/custom-protocol` once, then `npm run build` again;
  it was flaky here on macOS 27 and not caused by the profile.
