"""Unit tests for console/oslab.py: host-dependent lab availability, typed plans, signing and jobs."""
import copy
import os
import sys
import time

import pytest

REPO_ROOT = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, os.path.join(REPO_ROOT, "console"))

import oslab  # noqa: E402


def make_host(os_name="linux", arch="x86_64", kvm=True, runtime="docker", tools=(), distros=()):
    found = set(tools) | {"bash"}
    if runtime:
        found.add(runtime)
    return {
        "os": os_name, "arch": arch, "root": REPO_ROOT,
        "kvm": {"present": kvm, "usable": kvm},
        "wsl": {"guest": False, "distributions": list(distros)},
        "runtime": runtime,
        "tools": [{"id": t, "label": label, "found": t in found, "path": None} for t, label in oslab.TOOLS],
    }


def states(host):
    return {lab["id"]: lab["state"] for lab in oslab.lab_catalog(REPO_ROOT, host)["labs"]}


def test_linux_kvm_host_runs_container_labs_but_not_native_mac():
    assert states(make_host()) == {
        "android": "ready", "windows": "ready", "linux": "ready", "ios": "ready", "macos": "unavailable",
    }


def test_missing_kvm_needs_setup_except_android_static():
    s = states(make_host(kvm=False))
    assert s["android"] == "ready"
    assert s["windows"] == s["linux"] == s["ios"] == "needs-setup"
    android = oslab.lab_status("android", make_host(kvm=False))
    assert any("static" in note for note in android["notes"])


def test_arm_linux_cannot_run_x86_guests():
    s = states(make_host(arch="aarch64"))
    assert s["windows"] == "unavailable"
    assert s["ios"] == "unavailable"
    assert s["linux"] == "ready"


def test_macos_offers_native_simulator_and_static_android_only():
    host = make_host(os_name="macos", kvm=False, tools=("xcrun", "brew"))
    s = states(host)
    assert s["ios"] == "ready" and s["macos"] == "ready"
    assert s["windows"] == "unavailable" and s["linux"] == "unavailable"
    android = oslab.lab_status("android", host)
    assert android["provider"] == "macos-containers"
    assert not any(a["privileged"] for a in android["actions"])


def test_windows_host_uses_wsl2():
    without = states(make_host(os_name="windows", kvm=False, runtime=None, tools=("wsl",)))
    assert without["windows"] == "needs-setup"
    host = make_host(os_name="windows", kvm=False, runtime=None, tools=("wsl",), distros=("Ubuntu",))
    assert states(host)["windows"] == "ready"
    assert states(host)["macos"] == "unavailable"
    assert oslab.lab_status("linux", host)["provider"] == "wsl2"


def test_plan_builds_typed_labctl_command():
    p = oslab.plan(REPO_ROOT, {"lab": "windows", "action": "start"}, make_host())
    assert p["program"] == "bash"
    assert p["args"][0].endswith("/labctl")
    assert p["args"][1:] == ["win", "start"]
    assert p["runnable"] and not p["privileged"]


def test_plan_profile_and_resize_validation():
    host = make_host()
    p = oslab.plan(REPO_ROOT, {"lab": "linux", "action": "profile", "profile": "lightweight"}, host)
    assert p["args"][1:] == ["linux", "profile", "use", "lightweight"]
    p = oslab.plan(REPO_ROOT, {"lab": "windows", "action": "resize", "cpus": "4", "ram": "8G", "disk": "128G"}, host)
    assert p["args"][2:] == ["resize", "--cpus", "4", "--ram", "8G", "--disk", "128G"]
    for bad in (
        {"lab": "windows", "action": "resize", "ram": "8G;rm -rf /"},
        {"lab": "windows", "action": "resize", "cpus": "999"},
        {"lab": "linux", "action": "resize", "disk": "64G"},
        {"lab": "windows", "action": "resize"},
        {"lab": "windows", "action": "start", "profile": "../../etc/passwd"},
        {"lab": "windows", "action": "start", "profile": "-x"},
        {"lab": "windows", "action": "start", "ram": "8G"},
        {"lab": "windows", "action": "shell"},
        {"lab": "windows", "action": "start", "command": "id"},
        {"lab": "nope", "action": "start"},
        {"lab": "macos", "action": "status"},
    ):
        with pytest.raises(oslab.PlanError):
            oslab.plan(REPO_ROOT, bad, host)


def test_privileged_setup_without_graphical_agent_is_manual(monkeypatch):
    monkeypatch.delenv("DISPLAY", raising=False)
    monkeypatch.delenv("WAYLAND_DISPLAY", raising=False)
    p = oslab.plan(REPO_ROOT, {"lab": "windows", "action": "setup"}, make_host())
    assert p["privileged"] and not p["runnable"]
    assert p["manualCommand"].startswith("sudo ")
    assert p["manualCommand"].endswith("win-lab/scripts/setup-ubuntu.sh")
    assert p["setup"]["guestDisk"]
    assert "authorization" in p["setup"]["privileges"]


def test_macos_android_start_requires_static_profile():
    host = make_host(os_name="macos", kvm=False, tools=("xcrun", "brew"))
    mode = oslab.env_entries(open(os.path.join(REPO_ROOT, "android-lab/lab/.env"), encoding="utf-8").read()).get("LAB_MODE") \
        if os.path.isfile(os.path.join(REPO_ROOT, "android-lab/lab/.env")) else None
    if mode == "static":
        pytest.skip("this checkout already uses the static Android profile")
    with pytest.raises(oslab.PlanError):
        oslab.plan(REPO_ROOT, {"lab": "android", "action": "start"}, host)


def test_plan_signer_binds_the_exact_request():
    signer = oslab.PlanSigner()
    req = {"lab": "linux", "action": "start"}
    token = signer.sign(req)
    assert signer.verify(copy.deepcopy(req), token)
    assert not signer.verify({"lab": "linux", "action": "stop"}, token)
    assert not signer.verify(req, "0" * 64)
    assert not oslab.PlanSigner().verify(req, token)


def test_env_parsing_and_secret_masking(tmp_path):
    text = "# comment\nexport WEB_PORT=9000\nUSER_PASSWORD='hunter22'\nBAD LINE\nAPI_TOKEN=\n"
    entries = oslab.env_entries(text)
    assert entries == {"WEB_PORT": "9000", "USER_PASSWORD": "hunter22", "API_TOKEN": ""}
    assert oslab.is_secret("USER_PASSWORD") and not oslab.is_secret("WEB_PORT")
    assert oslab.endpoints("windows", entries)[0]["address"] == "http://127.0.0.1:9000/"


def test_lab_config_masks_secrets():
    cfg = oslab.lab_config(REPO_ROOT, "windows")
    assert cfg["path"] == "win-lab/.env"
    for field in cfg["fields"]:
        if oslab.is_secret(field["key"]) and field["value"]:
            assert field["value"] == "••••••"


def test_job_service_runs_redacts_and_reports(monkeypatch):
    monkeypatch.setattr(oslab, "secret_values", lambda root: ["s3cr3t-value"])
    jobs = oslab.JobService(REPO_ROOT)
    plan = {"lab": "linux", "action": "status", "program": sys.executable, "runnable": True, "timeoutSec": 30,
            "display": "python -c ...",
            "args": ["-c", "print('token=s3cr3t-value'); print('\\x1b[32mok\\x1b[0m'); raise SystemExit(3)"]}
    job = jobs.start(plan)
    with pytest.raises(oslab.PlanError):
        jobs.start(plan)  # one running job per lab
    deadline = time.time() + 10
    while job.state == "running" and time.time() < deadline:
        time.sleep(0.05)
    assert job.state == "failed" and job.exit_code == 3
    assert job.lines == ["token=[redacted]", "ok"]
    assert jobs.list()[0]["id"] == job.id


def test_job_service_cancel():
    jobs = oslab.JobService(REPO_ROOT)
    plan = {"lab": "ios", "action": "start", "program": sys.executable, "runnable": True, "timeoutSec": 30,
            "display": "sleep", "args": ["-c", "import time; print('up', flush=True); time.sleep(30)"]}
    job = jobs.start(plan)
    deadline = time.time() + 5
    while job.proc is None and time.time() < deadline:
        time.sleep(0.02)
    jobs.cancel(job.id)
    deadline = time.time() + 10
    while job.state == "running" and time.time() < deadline:
        time.sleep(0.05)
    assert job.state == "cancelled"


def test_manual_plans_never_start():
    jobs = oslab.JobService(REPO_ROOT)
    with pytest.raises(oslab.PlanError):
        jobs.start({"lab": "windows", "action": "setup", "runnable": False, "manualCommand": "sudo bash x"})


def test_monitor_without_runtime():
    host = make_host(runtime=None)
    assert oslab.monitor(REPO_ROOT, "windows", host)["state"] == "no-runtime"
    assert oslab.monitor(REPO_ROOT, "macos", host)["containers"] == []
