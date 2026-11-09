# App releases

Release packages are built and published locally on the matching host with the scripts in
`app/scripts/`; the GitHub Actions release workflows are kept for reference but disabled. The
release note for each version follows.

## 0.2.7

- Add DNS roadmap tasks OS-37..OS-40 to the contribute page.
- Reserve roadmap tasks through a pull request.
- Rebuilt dashboard for all locales.

Assets published on `app-v0.2.7`:

| Platform | Files |
| --- | --- |
| Linux amd64 | `.deb`, `.rpm`, `.AppImage`, each with `.sha256` and `.sig` |
| Linux arm64 | `.deb`, `.rpm`, `.AppImage`, each with `.sha256` and `.sig` |
| macOS universal | `.dmg` and `.app.tar.gz`, each with `.sha256` and `.sig` |
| Windows x64 | `-setup.exe` and `.msi`, each with `.sha256` and `.sig` |

Linux packages were built locally with `app/scripts/release-deb.sh --all-formats` on an amd64
host. Verify a download by comparing it with the adjacent `.sha256`, and verify the detached
signature with `app/scripts/verify-release-signature.py <package> --version 0.2.7`.
