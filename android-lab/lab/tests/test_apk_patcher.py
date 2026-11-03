import os
import zipfile
import pytest
from scripts.apk_patcher import patch_apk, zipalign_apk


def test_apk_patcher_network_security_config(sample_apk, tmp_path):
    out_apk = str(tmp_path / "patched.apk")
    res_path = patch_apk(sample_apk, out_apk=out_apk, inject_gadget=False)

    assert os.path.exists(res_path)
    assert os.path.getsize(res_path) > 0

    # Inspect zip to verify res/xml/network_security_config.xml is injected
    with zipfile.ZipFile(res_path, "r") as z:
        names = z.namelist()
        assert "res/xml/network_security_config.xml" in names
        config_xml = z.read("res/xml/network_security_config.xml").decode("utf-8")
        assert 'cleartextTrafficPermitted="true"' in config_xml
        assert "<trust-anchors>" in config_xml

        # Verify automated v1 signing
        assert "META-INF/MANIFEST.MF" in names
        assert "META-INF/CERT.SF" in names
        assert "META-INF/CERT.RSA" in names


def test_zipalign_apk(tmp_path):
    test_zip = str(tmp_path / "unaligned.apk")
    with zipfile.ZipFile(test_zip, "w") as z:
        z.writestr("test.txt", b"A" * 13)
        z.writestr("lib/x86_64/libtest.so", b"ELF" + b"\x00" * 37)

    zipalign_apk(test_zip, alignment=4)

    # Verify that the zip is valid and uncorrupted after alignment
    with zipfile.ZipFile(test_zip, "r") as z:
        assert z.read("test.txt") == b"A" * 13
        assert z.read("lib/x86_64/libtest.so") == b"ELF" + b"\x00" * 37

