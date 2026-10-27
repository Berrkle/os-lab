import os
import json
import threading
import time
import urllib.request
import pytest
from http.server import HTTPServer
from web_ui import LabHttpHandler


@pytest.fixture(scope="module")
def web_server():
    server = HTTPServer(("127.0.0.1", 5059), LabHttpHandler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    time.sleep(0.5)
    yield "http://127.0.0.1:5059"
    server.shutdown()


def test_web_ui_health_endpoint(web_server):
    url = f"{web_server}/api/health"
    req = urllib.request.urlopen(url)
    assert req.status == 200
    data = json.loads(req.read().decode("utf-8"))
    assert data["status"] == "ok"
    assert data["app"] == "apk-lab"


def test_web_ui_dashboard_page(web_server):
    url = f"{web_server}/"
    req = urllib.request.urlopen(url)
    assert req.status == 200
    body = req.read().decode("utf-8")
    assert "apk-lab" in body
    assert "Mobile Security Console" in body


def test_web_ui_logs_and_reports_endpoints(web_server):
    # Logs endpoint
    req_logs = urllib.request.urlopen(f"{web_server}/api/logs")
    assert req_logs.status == 200
    logs_data = json.loads(req_logs.read().decode("utf-8"))
    assert "logs" in logs_data

    # Reports endpoint
    req_reports = urllib.request.urlopen(f"{web_server}/api/reports")
    assert req_reports.status == 200
    reports_data = json.loads(req_reports.read().decode("utf-8"))
    assert "reports" in reports_data


def test_web_ui_upload_endpoint(web_server):
    boundary = "----TestBoundary12345"
    file_bytes = b"PK\x03\x04mock_apk_content"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="apk"; filename="uploaded-sample.apk"\r\n'
        f"Content-Type: application/vnd.android.package-archive\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    req = urllib.request.Request(
        f"{web_server}/api/upload",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    with urllib.request.urlopen(req) as resp:
        assert resp.status == 200
        data = json.loads(resp.read().decode("utf-8"))
        assert data["status"] == "success"
        assert data["filename"] == "uploaded-sample.apk"
        assert data["size"] == len(file_bytes)
        assert data["path"].endswith("uploaded-sample.apk")

