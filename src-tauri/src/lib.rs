mod editors;
mod extensions;
mod platform;
mod settings;
mod sync;

use editors::{detect::detect_installed_editors, CustomEditorInput, ResolvedEditor};
use extensions::diff::ExtensionDiffResult;
use settings::diff::{SettingsDiffResult, SettingsMode};
use sync::execute::{SyncActionInput, SyncResult};

#[tauri::command]
fn detect_editors(custom_editors: Vec<CustomEditorInput>) -> Result<Vec<ResolvedEditor>, String> {
    detect_installed_editors(&custom_editors)
}

#[tauri::command]
fn compute_extension_diff(editors: Vec<ResolvedEditor>) -> Result<ExtensionDiffResult, String> {
    let extension_state = extensions::reader::read_all_extensions(&editors);
    Ok(extensions::diff::compute_extension_diff(&extension_state))
}

#[tauri::command]
fn compute_settings_diff(
    editors: Vec<ResolvedEditor>,
    mode: SettingsMode,
) -> Result<Vec<SettingsDiffResult>, String> {
    if editors.len() < 2 {
        return Ok(Vec::new());
    }

    let all_settings = settings::reader::read_all_settings(&editors);
    let source = all_settings
        .first()
        .ok_or_else(|| "Missing source editor settings".to_string())?;

    let mut diffs = Vec::new();
    for target in all_settings.iter().skip(1) {
        diffs.push(settings::diff::compute_settings_diff(source, target, mode));
    }

    Ok(diffs)
}

#[tauri::command]
fn execute_sync(
    editors: Vec<ResolvedEditor>,
    actions: Vec<SyncActionInput>,
    dry_run: bool,
) -> Result<Vec<SyncResult>, String> {
    sync::execute::execute_sync(&editors, &actions, dry_run)
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            detect_editors,
            compute_extension_diff,
            compute_settings_diff,
            execute_sync
        ])
        .run(tauri::generate_context!())
        .expect("error while running vcser desktop app");
}
