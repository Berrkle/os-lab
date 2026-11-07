//! os-lab desktop app.
//!
//! The dashboard (`dashboard/`) is the UI and the os-lab console is the backend. This crate is
//! the glue: a local launcher page (`ui/`) calls `console_start`, which finds an os-lab root,
//! starts `android-lab/lab/web_ui.py` on a free loopback port and returns its URL; the launcher
//! then hands the window to the dashboard. Every dashboard page and lab action therefore works
//! exactly as it does in `./labctl ui`: the same server, the same preview → token → run flow.
//!
//! The dashboard page is a plain web page on `127.0.0.1` and gets no Tauri IPC
//! (`capabilities/launcher.json` names the launcher window only). Links that leave the console
//! open in the system browser.

mod console;
mod runtime;

use std::path::PathBuf;

use tauri::{AppHandle, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_dialog::DialogExt;
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_store::StoreExt;

use console::{Console, Started};
use runtime::Source;

const STORE: &str = "settings.json";
const ROOT_KEY: &str = "root";

fn data_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_data_dir().map_err(|e| e.to_string())
}

fn log_dir(app: &AppHandle) -> Result<PathBuf, String> {
    app.path().app_log_dir().map_err(|e| e.to_string())
}

fn chosen_root(app: &AppHandle) -> Option<PathBuf> {
    let store = app.store(STORE).ok()?;
    let value = store.get(ROOT_KEY)?;
    let path = PathBuf::from(value.as_str()?);
    runtime::is_root(&path).then_some(path)
}

/// Env → chosen checkout → development checkout → the bundled runtime in the data folder.
fn resolve_root(app: &AppHandle) -> Result<(PathBuf, Source), String> {
    if let Some(dir) = std::env::var_os("OSLAB_ROOT") {
        let dir = PathBuf::from(dir);
        return if runtime::is_root(&dir) {
            Ok((dir, Source::Env))
        } else {
            Err(format!("OSLAB_ROOT ({}) is not an os-lab checkout (labctl, console/ and android-lab/ are missing).", dir.display()))
        };
    }
    if let Some(dir) = chosen_root(app) {
        return Ok((dir, Source::Chosen));
    }
    if let Some(dir) = runtime::dev_checkout() {
        return Ok((dir, Source::Checkout));
    }
    let bundle = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("os-lab");
    let target = data_dir(app)?.join("os-lab");
    runtime::sync_bundle(&bundle, &target, &app.package_info().version.to_string())?;
    Ok((target, Source::Bundled))
}

#[tauri::command]
async fn console_start(app: AppHandle, state: State<'_, Console>) -> Result<Started, String> {
    let (root, source) = resolve_root(&app)?;
    // Downloaded content packs (console/content.py) live in the app's data folder, beside but
    // never inside the bundled copy, so "reset" always returns to what shipped.
    if std::env::var_os("OSLAB_CONTENT_DIR").is_none() {
        std::env::set_var("OSLAB_CONTENT_DIR", data_dir(&app)?.join("content"));
    }
    let log = console::log_path(&log_dir(&app)?);
    let console = state.inner().clone();
    tauri::async_runtime::spawn_blocking(move || console.start(&root, source, &log))
        .await
        .map_err(|e| e.to_string())?
}

#[tauri::command]
fn console_status(state: State<'_, Console>) -> Option<String> {
    state.running_url()
}

#[tauri::command]
fn console_restart(state: State<'_, Console>) {
    state.stop();
}

#[tauri::command]
fn console_logs(app: AppHandle) -> Result<String, String> {
    Ok(console::tail(&console::log_path(&log_dir(&app)?), 200))
}

/// Pick an os-lab checkout to run instead of the bundled copy. Returns the path, or None when
/// the dialog was cancelled.
#[tauri::command]
async fn console_choose_root(app: AppHandle, state: State<'_, Console>) -> Result<Option<String>, String> {
    let app2 = app.clone();
    let picked = tauri::async_runtime::spawn_blocking(move || {
        app2.dialog().file().set_title("Choose your os-lab checkout").blocking_pick_folder()
    })
    .await
    .map_err(|e| e.to_string())?;
    let Some(picked) = picked else { return Ok(None) };
    let path = picked.into_path().map_err(|e| e.to_string())?;
    if !runtime::is_root(&path) {
        return Err(format!(
            "{} is not an os-lab checkout: labctl, console/oslab.py and android-lab/lab/web_ui.py must exist.",
            path.display()
        ));
    }
    let store = app.store(STORE).map_err(|e| e.to_string())?;
    store.set(ROOT_KEY, path.display().to_string());
    store.save().map_err(|e| e.to_string())?;
    state.stop();
    Ok(Some(path.display().to_string()))
}

/// Forget the chosen checkout and go back to the bundled copy.
#[tauri::command]
fn console_reset_root(app: AppHandle, state: State<'_, Console>) -> Result<(), String> {
    let store = app.store(STORE).map_err(|e| e.to_string())?;
    store.delete(ROOT_KEY);
    store.save().map_err(|e| e.to_string())?;
    state.stop();
    Ok(())
}

/// Loopback pages stay in the window; everything else leaves for the system browser.
fn is_internal(url: &url::Url) -> bool {
    match url.scheme() {
        "tauri" | "asset" | "about" | "blob" | "data" => true,
        "http" | "https" => matches!(url.host_str(), Some("127.0.0.1") | Some("localhost") | Some("tauri.localhost") | Some("::1") | Some("[::1]")),
        _ => false,
    }
}

fn open_external(app: &AppHandle, url: &url::Url) {
    if matches!(url.scheme(), "http" | "https" | "mailto") {
        let _ = app.opener().open_url(url.as_str(), None::<&str>);
    }
}

fn build_window(app: &AppHandle) -> tauri::Result<()> {
    if let Some(old) = app.get_webview_window("main") {
        let _ = old.destroy();
    }
    let nav = app.clone();
    let popup = app.clone();
    WebviewWindowBuilder::new(app, "main", WebviewUrl::App("index.html".into()))
        .title("os-lab")
        .inner_size(1280.0, 840.0)
        .min_inner_size(420.0, 560.0)
        .on_navigation(move |url| {
            if is_internal(url) {
                true
            } else {
                open_external(&nav, url);
                false
            }
        })
        .on_new_window(move |url, _features| {
            if is_internal(&url) {
                // A new window for a console page (target=_blank): keep it in this window.
                if let Some(w) = popup.get_webview_window("main") {
                    let _ = w.eval(format!("window.location.href = {}", serde_json::to_string(url.as_str()).unwrap_or_default()));
                }
            } else {
                open_external(&popup, &url);
            }
            tauri::webview::NewWindowResponse::Deny
        })
        .build()?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.unminimize();
                let _ = w.show();
                let _ = w.set_focus();
            }
        }))
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .manage(Console::new())
        .invoke_handler(tauri::generate_handler![
            console_start,
            console_status,
            console_restart,
            console_choose_root,
            console_reset_root,
            console_logs
        ])
        .setup(|app| {
            build_window(app.handle())?;
            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building the os-lab app");

    app.run(|handle, event| {
        if let tauri::RunEvent::Exit = event {
            // Stop the console (and the jobs in its process group) with the app.
            handle.state::<Console>().stop();
        }
    });
}
