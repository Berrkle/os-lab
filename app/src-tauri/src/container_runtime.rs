//! Acquire a verified host container installer when Docker/Podman is absent. The system installer
//! and its licence remain interactive; the app never silently changes host virtualization.

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

const DOWNLOAD: &str = r#"
import hashlib, os, sys, urllib.request
url, expected, target = sys.argv[1:]
part = target + '.part'
h = hashlib.sha256()
if os.path.isfile(target):
    with open(target, 'rb') as existing:
        for chunk in iter(lambda: existing.read(1024 * 1024), b''):
            h.update(chunk)
    if h.hexdigest() == expected:
        sys.exit(0)
h = hashlib.sha256()
try:
    with urllib.request.urlopen(url, timeout=60) as response, open(part, 'wb') as out:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk: break
            h.update(chunk)
            out.write(chunk)
    if h.hexdigest() != expected:
        raise RuntimeError('installer SHA-256 does not match Docker release notes')
    os.replace(part, target)
except Exception:
    if os.path.exists(part): os.remove(part)
    raise
"#;

pub struct Installer {
    pub url: &'static str,
    pub sha256: &'static str,
    pub name: &'static str,
}

pub fn installer() -> Option<Installer> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("macos", "aarch64") => Some(Installer {
            url: "https://desktop.docker.com/mac/main/arm64/245422/Docker.dmg",
            sha256: "9c6f13ce4edda2abf20d801552b6acb96acd3d64b3e91b50c4484353802758b5",
            name: "Docker-Desktop-4.98.0-arm64.dmg",
        }),
        ("macos", "x86_64") => Some(Installer {
            url: "https://desktop.docker.com/mac/main/amd64/245422/Docker.dmg",
            sha256: "96b53f9a4a807b6be6207d18f360b9778ff481e1d94b5027bdf1ae2a22d837cb",
            name: "Docker-Desktop-4.98.0-amd64.dmg",
        }),
        ("windows", "x86_64") => Some(Installer {
            url: "https://desktop.docker.com/win/main/amd64/245422/Docker%20Desktop%20Installer.exe",
            sha256: "cd6273d9eaa4f07fa7593fc6813d37e1004381cebc3f26047a2554fa5db24388",
            name: "Docker-Desktop-4.98.0-amd64.exe",
        }),
        _ => None,
    }
}

pub fn augment_path() {
    let mut paths: Vec<PathBuf> = std::env::split_paths(&std::env::var_os("PATH").unwrap_or_default()).collect();
    if cfg!(target_os = "macos") {
        paths.extend([PathBuf::from("/opt/homebrew/bin"), PathBuf::from("/usr/local/bin"), PathBuf::from("/opt/podman/bin")]);
        if let Some(home) = std::env::var_os("HOME") {
            paths.push(PathBuf::from(home).join(".docker/bin"));
        }
    } else if cfg!(target_os = "windows") {
        if let Some(programs) = std::env::var_os("ProgramFiles") {
            paths.push(PathBuf::from(programs).join("Docker/Docker/resources/bin"));
        }
        if let Some(local) = std::env::var_os("LOCALAPPDATA") {
            paths.push(PathBuf::from(local).join("Programs/DockerDesktop/resources/bin"));
        }
    }
    if let Ok(path) = std::env::join_paths(paths) {
        std::env::set_var("PATH", path);
    }
}

pub fn is_ready() -> bool {
    ["docker", "podman"].iter().any(|name| works(name))
}

pub fn cli_present() -> bool {
    ["docker", "podman"].iter().any(|name| Command::new(name).arg("--version")
        .stdout(Stdio::null()).stderr(Stdio::null()).status().is_ok_and(|status| status.success()))
}

fn works(name: &str) -> bool {
    let Ok(mut child) = Command::new(name).arg("info").stdout(Stdio::null()).stderr(Stdio::null()).spawn() else {
        return false;
    };
    let deadline = Instant::now() + Duration::from_secs(5);
    loop {
        match child.try_wait() {
            Ok(Some(status)) => return status.success(),
            Err(_) => {
                let _ = child.kill();
                let _ = child.wait();
                return false;
            }
            Ok(None) if Instant::now() < deadline => std::thread::sleep(Duration::from_millis(100)),
            Ok(None) => {
                let _ = child.kill();
                let _ = child.wait();
                return false;
            }
        }
    }
}

pub fn download(python: &str, data_dir: &Path) -> Result<PathBuf, String> {
    let spec = installer().ok_or("No managed container installer is available for this platform")?;
    let dir = data_dir.join("installers");
    fs::create_dir_all(&dir).map_err(|e| format!("Could not create installer folder: {e}"))?;
    let dest = dir.join(spec.name);
    let mut cmd = Command::new(python);
    if python == "py" { cmd.arg("-3"); }
    let output = cmd.arg("-c").arg(DOWNLOAD).arg(spec.url).arg(spec.sha256).arg(&dest)
        .output().map_err(|e| format!("Could not download Docker Desktop: {e}"))?;
    if !output.status.success() {
        return Err(format!("Docker Desktop download failed: {}", String::from_utf8_lossy(&output.stderr).trim()));
    }
    Ok(dest)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn supported_installer_has_pinned_https_url_and_digest() {
        if let Some(spec) = installer() {
            assert!(spec.url.starts_with("https://desktop.docker.com/"));
            assert_eq!(spec.sha256.len(), 64);
            assert!(spec.sha256.chars().all(|c| c.is_ascii_hexdigit()));
        }
    }
}
