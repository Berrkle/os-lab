# Release automation

The app version in `app/package.json`, `app/src-tauri/Cargo.toml` and
`app/src-tauri/tauri.conf.json` must agree before creating `app-v<version>` at the intended commit.
Release workflows only publish assets for that tagged commit. Each workflow can also be run
manually without publishing, to inspect its build artifacts.

| Workflow | Output | Automatic tag publishing |
|---|---|---|
| `release-linux` | amd64 and arm64 Debian, RPM and AppImage packages, with SHA-256 files | yes |
| `release-win` | x64 NSIS and MSI, with SHA-256 files | after SignPath is configured |
| `release-mac` | universal signed and notarized DMG, with SHA-256 file | after Apple secrets and `MACOS_RELEASE_CI_ENABLED=true` are set |

The Linux workflow runs on pull requests touching app or dashboard files. It installs, launches
under Xvfb, and removes each Debian package before publishing. The macOS workflow uses
`app/scripts/release-mac.sh`, which verifies both the app and DMG signatures and notarization.

## macOS signing setup

Add these repository secrets for the `release-mac` workflow:

- `APPLE_CERTIFICATE`: base64 encoded Developer ID Application `.p12`, including its private key
- `APPLE_CERTIFICATE_PASSWORD`: password used to export that `.p12`
- `KEYCHAIN_PASSWORD`: temporary CI keychain password
- `APPLE_API_KEY_P8`: contents of an App Store Connect API `.p8` key
- `APPLE_API_KEY`: App Store Connect key ID
- `APPLE_API_ISSUER`: App Store Connect issuer ID

After a manual `release-mac` run builds and notarizes successfully, set repository variable
`MACOS_RELEASE_CI_ENABLED` to `true`. Future `app-v*` tags then publish automatically. Until then,
the local signed release command remains `app/scripts/release-mac.sh --publish`.

Never commit certificate or key files. The workflow writes the temporary key into the runner's
private temporary directory and the runner is discarded after the job.

## Windows signing setup

Follow [SIGNING.md](SIGNING.md) to enroll the project in SignPath Foundation and configure
`SIGNPATH_API_TOKEN` and `SIGNPATH_ORGANIZATION_ID`. The workflow verifies both Authenticode
signatures before publishing. A valid signature helps establish trust; SmartScreen reputation may
still take time to build. Unsigned builds remain available as workflow artifacts for inspection.

## Release order

1. Merge and test all release changes.
2. Set the intended version, then create and push `app-v<version>` on that exact commit.
3. Inspect the workflow results and release assets. Do not mark the release complete until the
   macOS, Windows and Linux files and SHA-256 checks are present.
4. Install and launch at least one file on each OS; record any platform limitation in the release
   notes and [INSTALL.md](INSTALL.md).
