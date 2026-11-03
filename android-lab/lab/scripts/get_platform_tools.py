#!/usr/bin/env python3
"""Download Android SDK Platform-Tools (adb, fastboot) from Google into tools/platform-tools.

os-lab does not redistribute Google's binaries: the Android SDK Terms and Conditions govern
them, so they are fetched from Google's official URL on the machine that needs them.

    python3 scripts/get_platform_tools.py            # download if tools/platform-tools has no adb
    python3 scripts/get_platform_tools.py --force    # replace with the latest release
    python3 scripts/get_platform_tools.py --check    # report what is installed, download nothing

The orchestrator's preflight calls ensure_platform_tools() when adb is missing; set
OSLAB_NO_DOWNLOAD=1 to stop that.
"""

from __future__ import annotations

import argparse
import os
import shutil
import stat
import sys
import tempfile
import urllib.request
import zipfile

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LAB_DIR = os.path.dirname(SCRIPT_DIR)
TOOLS_DIR = os.path.join(LAB_DIR, "tools")
DEST = os.path.join(TOOLS_DIR, "platform-tools")
BASE_URL = "https://dl.google.com/android/repository/platform-tools-latest-{}.zip"
TERMS_URL = "https://developer.android.com/studio/terms"
MAX_BYTES = 200 * 1024 * 1024  # the zip is ~7-15 MB; refuse anything absurd


def host_flavor(platform: str = sys.platform) -> str:
    if platform.startswith("win") or platform == "cygwin":
        return "windows"
    if platform == "darwin":
        return "darwin"
    if platform.startswith("linux"):
        return "linux"
    raise RuntimeError(f"Google publishes no platform-tools build for {platform}")


def adb_name(platform: str = sys.platform) -> str:
    return "adb.exe" if host_flavor(platform) == "windows" else "adb"


def local_adb(dest: str = DEST) -> str | None:
    path = os.path.join(dest, adb_name())
    return path if os.path.isfile(path) else None


def installed_revision(dest: str = DEST) -> str | None:
    try:
        with open(os.path.join(dest, "source.properties"), encoding="utf-8") as f:
            for line in f:
                if line.startswith("Pkg.Revision="):
                    return line.split("=", 1)[1].strip()
    except OSError:
        pass
    return None


def _download(url: str, target: str) -> None:
    if not url.startswith("https://dl.google.com/"):
        raise RuntimeError(f"Refusing to download from an unexpected host: {url}")
    request = urllib.request.Request(url, headers={"User-Agent": "os-lab platform-tools downloader"})
    with urllib.request.urlopen(request, timeout=60) as response, open(target, "wb") as out:
        total = 0
        while True:
            chunk = response.read(1 << 16)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_BYTES:
                raise RuntimeError("Download is larger than expected; aborting")
            out.write(chunk)


def _safe_extract(zip_path: str, into: str) -> None:
    """Extract only platform-tools/…, refusing absolute paths, '..' and symlinks; keep exec bits."""
    with zipfile.ZipFile(zip_path) as archive:
        root = os.path.realpath(into)
        for info in archive.infolist():
            name = info.filename
            if not name.startswith("platform-tools/"):
                raise RuntimeError(f"Unexpected entry in archive: {name}")
            target = os.path.realpath(os.path.join(root, name))
            if os.path.commonpath([root, target]) != root:
                raise RuntimeError(f"Unsafe path in archive: {name}")
            mode = (info.external_attr >> 16) & 0o177777
            if stat.S_ISLNK(mode):
                raise RuntimeError(f"Symlink in archive: {name}")
            if info.is_dir():
                os.makedirs(target, exist_ok=True)
                continue
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with archive.open(info) as src, open(target, "wb") as dst:
                shutil.copyfileobj(src, dst)
            if mode & 0o111 and os.name == "posix":
                os.chmod(target, 0o755)


def install(force: bool = False, quiet: bool = False, flavor: str | None = None, dest: str = DEST) -> str:
    """Download and install platform-tools; returns the adb path. Raises RuntimeError on failure."""
    say = (lambda *_: None) if quiet else print
    existing = local_adb(dest)
    if existing and not force:
        say(f"[ok] platform-tools {installed_revision(dest) or ''} already in {dest}".replace("  ", " "))
        return existing
    flavor = flavor or host_flavor()
    url = BASE_URL.format(flavor)
    say(f"[*] Downloading Android SDK Platform-Tools for {flavor} from Google")
    say(f"    {url}")
    say(f"    Use is governed by the Android SDK Terms and Conditions: {TERMS_URL}")
    parent = os.path.dirname(dest)
    os.makedirs(parent, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".platform-tools-", dir=parent) as work:
        zip_path = os.path.join(work, "platform-tools.zip")
        _download(url, zip_path)
        if not zipfile.is_zipfile(zip_path):
            raise RuntimeError("The download is not a zip archive")
        staging = os.path.join(work, "extract")
        _safe_extract(zip_path, staging)
        fresh = os.path.join(staging, "platform-tools")
        if not os.path.isfile(os.path.join(fresh, adb_name("win32" if flavor == "windows" else "linux"))):
            raise RuntimeError("The archive does not contain adb")
        # Swap in the new copy only once it is complete
        if os.path.isdir(dest):
            shutil.rmtree(dest)
        shutil.move(fresh, dest)
    adb = os.path.join(dest, adb_name("win32" if flavor == "windows" else "linux"))
    say(f"[ok] platform-tools {installed_revision(dest) or ''} installed: {adb}".replace("  ", " "))
    return adb


def ensure_platform_tools(quiet: bool = False) -> str | None:
    """adb from PATH or tools/platform-tools, downloading it when missing. None if unavailable."""
    found = shutil.which("adb") or local_adb()
    if found:
        return found
    if os.environ.get("OSLAB_NO_DOWNLOAD") == "1":
        return None
    try:
        return install(quiet=quiet)
    except (OSError, RuntimeError, zipfile.BadZipFile) as e:
        if not quiet:
            print(f"[!] Could not download platform-tools: {e}")
        return None


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--force", action="store_true", help="re-download even if already installed")
    parser.add_argument("--check", action="store_true", help="report the installed copy and exit")
    args = parser.parse_args(argv)
    if args.check:
        adb = local_adb()
        print(f"tools/platform-tools: {installed_revision() or 'installed' if adb else 'not installed'}")
        print(f"adb on PATH: {shutil.which('adb') or 'no'}")
        return 0 if adb or shutil.which("adb") else 1
    try:
        install(force=args.force)
    except (OSError, RuntimeError, zipfile.BadZipFile) as e:
        print(f"[!] {e}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
