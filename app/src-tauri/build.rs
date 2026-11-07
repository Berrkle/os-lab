fn main() {
    // Each command is a permission (allow-console-*), so only windows whose capability grants
    // them can call these. The dashboard served from 127.0.0.1 gets none (capabilities/).
    tauri_build::try_build(tauri_build::Attributes::new().app_manifest(
        tauri_build::AppManifest::new().commands(&[
            "console_start",
            "console_status",
            "console_restart",
            "console_choose_root",
            "console_reset_root",
            "console_logs",
            "python_install",
        ]),
    ))
    .expect("failed to run tauri-build");
}
