import pytest
from orchestrator import run_preflight


def test_orchestrator_preflight_runs_without_crashing():
    # run_preflight checks environment and returns True or False
    result = run_preflight()
    assert isinstance(result, bool)
