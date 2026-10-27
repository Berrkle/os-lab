import os
import json
import pytest
from scripts.app_reporter import generate_reports


def test_app_reporter_generates_all_formats(tmp_path):
    out_dir = str(tmp_path / "reports_out")

    mock_analysis = {
        "target_file": "test-app.apk",
        "package_info": {"package_name": "com.testlab.fixture"},
        "analysis_timestamp": "2026-10-27T12:00:00",
        "metrics": {
            "security_score": 45,
            "grade": "F",
            "total_vulnerabilities": 3,
            "critical_count": 1,
            "high_count": 1,
            "medium_count": 1,
            "low_count": 0
        },
        "vulnerabilities": [
            {
                "id": "MANIFEST-DEBUGGABLE",
                "title": "Application Is Debuggable",
                "severity": "CRITICAL",
                "owasp": "M1",
                "desc": "App can be attached to debugger.",
                "remediation": "Set android:debuggable to false."
            }
        ],
        "secrets": [
            {"rule": "Google API Key", "severity": "HIGH", "file": "res/values/strings.xml", "line": 5, "preview": "AIzaSy..."}
        ],
        "permissions": ["android.permission.INTERNET"]
    }

    results = generate_reports(mock_analysis, out_dir=out_dir)

    assert os.path.exists(results["html"])
    assert os.path.exists(results["md"])
    assert os.path.exists(results["json"])

    # Verify HTML contains crucial elements
    with open(results["html"], "r", encoding="utf-8") as f:
        html_content = f.read()
        assert "com.testlab.fixture" in html_content
        assert "Application Is Debuggable" in html_content
        assert "45" in html_content
