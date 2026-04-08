use std::collections::HashMap;
use std::process::Command;

use serde::{Deserialize, Serialize};

use crate::editors::ResolvedEditor;
use crate::settings::diff::SettingsKeyDiff;
use crate::settings::merge::apply_settings_diffs;
use crate::settings::reader::read_settings;

use super::backup::create_backup;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SyncActionType {
    Install,
    Uninstall,
    Settings,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncActionInput {
    pub action_type: SyncActionType,
    pub extension_id: Option<String>,
    pub source_editor: Option<String>,
    pub target_editor: String,
    pub diffs: Option<Vec<SettingsKeyDiff>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SyncResult {
    pub action: String,
    pub editor: String,
    pub success: bool,
    pub error: Option<String>,
    pub backup_path: Option<String>,
}

fn extension_command_flag(action_type: &SyncActionType) -> Option<&'static str> {
    match action_type {
        SyncActionType::Install => Some("--install-extension"),
        SyncActionType::Uninstall => Some("--uninstall-extension"),
        SyncActionType::Settings => None,
    }
}

fn execute_extension_action(
    action: &SyncActionInput,
    target_editor: &ResolvedEditor,
    dry_run: bool,
) -> SyncResult {
    let extension_id = action.extension_id.clone().unwrap_or_default();
    let flag = extension_command_flag(&action.action_type).unwrap_or("--install-extension");
    let cmd = format!("{} {} {}", target_editor.cli, flag, extension_id);

    if extension_id.is_empty() {
        return SyncResult {
            action: cmd,
            editor: target_editor.name.clone(),
            success: false,
            error: Some("Missing extensionId for extension action".to_string()),
            backup_path: None,
        };
    }

    if dry_run {
        return SyncResult {
            action: format!("[DRY RUN] {cmd}"),
            editor: target_editor.name.clone(),
            success: true,
            error: None,
            backup_path: None,
        };
    }

    if !target_editor.cli_available {
        return SyncResult {
            action: cmd,
            editor: target_editor.name.clone(),
            success: false,
            error: Some(format!("CLI '{}' is not available", target_editor.cli)),
            backup_path: None,
        };
    }

    match Command::new(&target_editor.cli)
        .arg(flag)
        .arg(&extension_id)
        .output()
    {
        Ok(output) if output.status.success() => SyncResult {
            action: cmd,
            editor: target_editor.name.clone(),
            success: true,
            error: None,
            backup_path: None,
        },
        Ok(output) => SyncResult {
            action: cmd,
            editor: target_editor.name.clone(),
            success: false,
            error: Some(String::from_utf8_lossy(&output.stderr).to_string()),
            backup_path: None,
        },
        Err(err) => SyncResult {
            action: cmd,
            editor: target_editor.name.clone(),
            success: false,
            error: Some(err.to_string()),
            backup_path: None,
        },
    }
}

fn execute_settings_action(
    action: &SyncActionInput,
    source_editor: &ResolvedEditor,
    target_editor: &ResolvedEditor,
    dry_run: bool,
) -> SyncResult {
    let diffs = action.diffs.clone().unwrap_or_default();
    let description = format!(
        "Sync settings: {} → {} ({} keys)",
        source_editor.name,
        target_editor.name,
        diffs.len()
    );

    if dry_run {
        return SyncResult {
            action: format!("[DRY RUN] {description}"),
            editor: target_editor.name.clone(),
            success: true,
            error: None,
            backup_path: None,
        };
    }

    let backup_path = match create_backup(&target_editor.settings_path) {
        Ok(path) => path,
        Err(err) => {
            return SyncResult {
                action: description,
                editor: target_editor.name.clone(),
                success: false,
                error: Some(err),
                backup_path: None,
            }
        }
    };

    let source = read_settings(source_editor);
    let target = read_settings(target_editor);

    let merged = apply_settings_diffs(&target.settings, &source.settings, &diffs);

    let write_result = serde_json::to_string_pretty(&serde_json::Value::Object(merged))
        .map_err(|err| err.to_string())
        .and_then(|json| {
            std::fs::write(&target_editor.settings_path, format!("{json}\n"))
                .map_err(|err| err.to_string())
        });

    match write_result {
        Ok(()) => SyncResult {
            action: description,
            editor: target_editor.name.clone(),
            success: true,
            error: None,
            backup_path,
        },
        Err(err) => SyncResult {
            action: description,
            editor: target_editor.name.clone(),
            success: false,
            error: Some(err),
            backup_path,
        },
    }
}

pub fn execute_sync(
    editors: &[ResolvedEditor],
    actions: &[SyncActionInput],
    dry_run: bool,
) -> Result<Vec<SyncResult>, String> {
    let editor_map = editors
        .iter()
        .map(|editor| (editor.name.clone(), editor.clone()))
        .collect::<HashMap<_, _>>();

    let mut results = Vec::new();

    for action in actions {
        let Some(target_editor) = editor_map.get(&action.target_editor) else {
            results.push(SyncResult {
                action: "Unknown target editor".to_string(),
                editor: action.target_editor.clone(),
                success: false,
                error: Some("Target editor was not selected".to_string()),
                backup_path: None,
            });
            continue;
        };

        match action.action_type {
            SyncActionType::Install | SyncActionType::Uninstall => {
                results.push(execute_extension_action(action, target_editor, dry_run));
            }
            SyncActionType::Settings => {
                let Some(source_editor_name) = &action.source_editor else {
                    results.push(SyncResult {
                        action: "Settings sync".to_string(),
                        editor: target_editor.name.clone(),
                        success: false,
                        error: Some("Settings action missing source editor".to_string()),
                        backup_path: None,
                    });
                    continue;
                };

                let Some(source_editor) = editor_map.get(source_editor_name) else {
                    results.push(SyncResult {
                        action: "Settings sync".to_string(),
                        editor: target_editor.name.clone(),
                        success: false,
                        error: Some("Source editor was not selected".to_string()),
                        backup_path: None,
                    });
                    continue;
                };

                results.push(execute_settings_action(
                    action,
                    source_editor,
                    target_editor,
                    dry_run,
                ));
            }
        }
    }

    Ok(results)
}
