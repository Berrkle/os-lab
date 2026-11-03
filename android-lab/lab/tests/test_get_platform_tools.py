"""Offline tests for scripts/get_platform_tools.py (no network: the download is faked)."""
import os
import stat
import sys
import zipfile

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import get_platform_tools as gpt  # noqa: E402


def make_zip(path, entries):
    with zipfile.ZipFile(path, "w") as z:
        for name, data, mode in entries:
            info = zipfile.ZipInfo(name)
            info.external_attr = mode << 16
            z.writestr(info, data)


def fake_download(entries):
    def _download(url, target):
        assert url.startswith("https://dl.google.com/android/repository/platform-tools-latest-")
        make_zip(target, entries)
    return _download


GOOD = [
    ("platform-tools/adb", b"#!/bin/sh\necho adb\n", stat.S_IFREG | 0o755),
    ("platform-tools/source.properties", b"Pkg.Revision=99.0.0\n", stat.S_IFREG | 0o644),
]


def test_host_flavor_and_adb_name():
    assert gpt.host_flavor("linux") == "linux"
    assert gpt.host_flavor("darwin") == "darwin"
    assert gpt.host_flavor("win32") == "windows"
    assert gpt.adb_name("win32") == "adb.exe" and gpt.adb_name("linux") == "adb"
    with pytest.raises(RuntimeError):
        gpt.host_flavor("sunos5")


def test_install_extracts_and_keeps_exec_bit(tmp_path, monkeypatch):
    monkeypatch.setattr(gpt, "_download", fake_download(GOOD))
    dest = tmp_path / "tools" / "platform-tools"
    adb = gpt.install(dest=str(dest), flavor="linux", quiet=True)
    assert adb == str(dest / "adb")
    assert gpt.installed_revision(str(dest)) == "99.0.0"
    if os.name == "posix":
        assert os.stat(adb).st_mode & 0o111


def test_install_skips_when_present_unless_forced(tmp_path, monkeypatch):
    calls = []
    monkeypatch.setattr(gpt, "_download", lambda url, target: (calls.append(url), make_zip(target, GOOD)))
    monkeypatch.setattr(gpt, "adb_name", lambda platform=sys.platform: "adb")
    dest = str(tmp_path / "platform-tools")
    gpt.install(dest=dest, flavor="linux", quiet=True)
    gpt.install(dest=dest, flavor="linux", quiet=True)
    assert len(calls) == 1
    gpt.install(dest=dest, flavor="linux", quiet=True, force=True)
    assert len(calls) == 2


@pytest.mark.parametrize("entries", [
    [("platform-tools/../../evil", b"x", stat.S_IFREG | 0o644)],
    [("/etc/evil", b"x", stat.S_IFREG | 0o644)],
    [("other/adb", b"x", stat.S_IFREG | 0o755)],
    [("platform-tools/adb", b"/etc/passwd", stat.S_IFLNK | 0o777)],
    [("platform-tools/readme.txt", b"no adb here", stat.S_IFREG | 0o644)],
])
def test_install_rejects_unsafe_or_wrong_archives(tmp_path, monkeypatch, entries):
    monkeypatch.setattr(gpt, "_download", fake_download(entries))
    dest = tmp_path / "platform-tools"
    with pytest.raises(RuntimeError):
        gpt.install(dest=str(dest), flavor="linux", quiet=True)
    assert not dest.exists()
    assert not (tmp_path.parent / "evil").exists()


def test_download_refuses_other_hosts(tmp_path):
    with pytest.raises(RuntimeError):
        gpt._download("https://example.com/platform-tools.zip", str(tmp_path / "x.zip"))
    with pytest.raises(RuntimeError):
        gpt._download("http://dl.google.com/android/repository/x.zip", str(tmp_path / "x.zip"))


def test_ensure_respects_opt_out(monkeypatch):
    monkeypatch.setattr(gpt.shutil, "which", lambda name: None)
    monkeypatch.setattr(gpt, "local_adb", lambda dest=gpt.DEST: None)
    monkeypatch.setenv("OSLAB_NO_DOWNLOAD", "1")
    monkeypatch.setattr(gpt, "install", lambda **kw: pytest.fail("must not download"))
    assert gpt.ensure_platform_tools(quiet=True) is None
