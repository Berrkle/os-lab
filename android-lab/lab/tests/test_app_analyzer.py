import os
import json
import pytest
from scripts.app_analyzer import analyze_app


def test_app_analyzer_finds_vulnerabilities(sample_apk, tmp_path):
    out_dir = str(tmp_path / "analyzer_out")
    result = analyze_app(sample_apk, out_dir=out_dir)

    assert result["metrics"]["security_score"] < 100
    assert result["metrics"]["total_vulnerabilities"] >= 3

    # Check OWASP mapping
    vuln_ids = [v["id"] for v in result["vulnerabilities"]]
    assert "MAN-DEBUGGABLE" in vuln_ids
    assert "MAN-CLEARTEXT" in vuln_ids
    assert "MAN-BACKUP" in vuln_ids
    assert "INTENT-UNPROTECTED-EXPORT" in vuln_ids
    assert "DEEPLINK-CUSTOM-SCHEME" in vuln_ids
    assert result["attack_surface"]["deep_links_count"] >= 1

    # Check secrets integrated into analysis
    assert len(result["secrets"]) >= 3

    # Check saved JSON
    json_path = os.path.join(out_dir, "app-analysis.json")
    assert os.path.exists(json_path)
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        assert data["package_info"]["package_name"] == "com.testlab.fixture"
