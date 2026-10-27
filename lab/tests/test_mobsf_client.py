import os
import json
import pytest
from unittest.mock import patch, MagicMock
from mobsf_client import (
    encode_multipart_formdata,
    check_status,
    upload_apk,
    trigger_scan,
    download_json_report,
)


def test_encode_multipart_formdata():
    fields = {"test_key": "test_val"}
    files = {"file": ("test.apk", b"PK\x03\x04mockapk")}
    content_type, body = encode_multipart_formdata(fields, files)

    assert content_type.startswith("multipart/form-data; boundary=")
    assert b"name=\"test_key\"" in body
    assert b"test_val" in body
    assert b"filename=\"test.apk\"" in body
    assert b"PK\x03\x04mockapk" in body


def test_check_status_offline():
    # An unreachable port should return False without crashing
    assert check_status("http://127.0.0.1:59999") is False


def test_upload_apk_mocked(sample_apk):
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.read.return_value = json.dumps({"hash": "deadbeef1234", "scan_type": "apk"}).encode("utf-8")
    mock_cm = MagicMock()
    mock_cm.__enter__.return_value = mock_resp

    with patch("urllib.request.urlopen", return_value=mock_cm):
        res = upload_apk(sample_apk, host="http://127.0.0.1:8000", api_key="test-key")
        assert res["hash"] == "deadbeef1234"
        assert res["scan_type"] == "apk"


def test_trigger_scan_mocked():
    mock_resp = MagicMock()
    mock_resp.status = 200
    mock_resp.read.return_value = json.dumps({"status": "success"}).encode("utf-8")
    mock_cm = MagicMock()
    mock_cm.__enter__.return_value = mock_resp

    with patch("urllib.request.urlopen", return_value=mock_cm):
        res = trigger_scan("deadbeef1234", host="http://127.0.0.1:8000", api_key="test-key")
        assert res["status"] == "success"


def test_download_json_report_mocked(tmp_path):
    mock_resp = MagicMock()
    mock_resp.status = 200
    report_data = {
        "security_score": 45,
        "app_name": "TestApp",
        "high_findings": 3
    }
    mock_resp.read.return_value = json.dumps(report_data).encode("utf-8")
    mock_cm = MagicMock()
    mock_cm.__enter__.return_value = mock_resp

    out_file = str(tmp_path / "mobsf_report.json")
    with patch("urllib.request.urlopen", return_value=mock_cm):
        res = download_json_report("deadbeef1234", host="http://127.0.0.1:8000", api_key="test-key", out_file=out_file)
        assert res["security_score"] == 45
        assert os.path.exists(out_file)
        with open(out_file, "r", encoding="utf-8") as f:
            saved = json.load(f)
        assert saved["high_findings"] == 3
