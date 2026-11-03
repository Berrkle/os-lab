import os
import json
import pytest
from scripts.mitm_flow_parser import parse_flows_fallback


def test_mitm_flow_parser_fallback(tmp_path):
    flow_file = str(tmp_path / "dummy_flows.mitm")
    out_dir = str(tmp_path / "flow_audit")

    # Write dummy flow content with HTTP URLs and Auth headers
    content = b"GET http://insecure-api.corp/auth HTTP/1.1\r\nAuthorization: Bearer mytoken123\r\n\r\n"
    with open(flow_file, "wb") as f:
        f.write(content)

    parse_flows_fallback(flow_file, out_dir)

    report_path = os.path.join(out_dir, "traffic-audit-fallback.json")
    assert os.path.exists(report_path)

    with open(report_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        assert data["total_endpoints_found"] >= 1
        assert any("insecure-api.corp" in ep for ep in data["extracted_endpoints"])
