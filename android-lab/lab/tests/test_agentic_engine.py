import os
import json
import pytest
from scripts.agentic_engine import generate_agentic_plan
from scripts.app_analyzer import analyze_app


def test_agentic_engine_generates_hypotheses_and_playbook(sample_apk, tmp_path):
    out_dir = str(tmp_path / "agentic_out")
    analysis = analyze_app(sample_apk)
    playbook = generate_agentic_plan(analysis, out_dir=out_dir)

    assert playbook["target_package"] == "com.testlab.fixture"
    assert len(playbook["attack_hypotheses"]) >= 2
    assert len(playbook["tailored_frida_hooks"]) >= 1

    # Check generated files
    md_file = os.path.join(out_dir, "agentic-playbook.md")
    json_file = os.path.join(out_dir, "agentic-plan.json")

    assert os.path.exists(md_file)
    assert os.path.exists(json_file)

    with open(md_file, "r", encoding="utf-8") as f:
        content = f.read()
        assert "Agentic Security Playbook" in content
