import os
import json
import pytest
from scripts.secret_scanner import scan_content, scan_target, SECRET_PATTERNS


def test_secret_patterns_detection():
    test_content = """
    AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE"
    FIREBASE_URL = "https://my-app.firebaseio.com"
    API_KEY = "AIzaSyB_MockGoogleApiKey1234567890ABCDE"
    """
    findings = scan_content(test_content, "test_config.py")
    assert len(findings) >= 3
    rules = [f["rule"] for f in findings]
    assert "AWS Access Key ID" in rules
    assert "Firebase URL" in rules
    assert "Google API Key" in rules


def test_secret_scanner_on_apk(sample_apk):
    report = scan_target(sample_apk)

    assert "total_findings" in report
    assert report["total_findings"] >= 4
    rules = [f["rule"] for f in report["findings"]]
    assert "AWS Access Key ID" in rules
    assert "Google API Key" in rules
    assert report["critical_count"] >= 1
