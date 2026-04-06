use std::collections::HashSet;
use std::process::Command;

use regex::Regex;
use serde::{Deserialize, Serialize};

use crate::editors::ResolvedEditor;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionInfo {
    pub id: String,
    pub source: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorExtensions {
    pub editor: ResolvedEditor,
    pub extensions: Vec<ExtensionInfo>,
}

fn read_via_cli(editor: &ResolvedEditor) -> Option<Vec<ExtensionInfo>> {
    let output = Command::new(&editor.cli)
        .arg("--list-extensions")
        .output()
        .ok()?;

    if !output.status.success() {
        return None;
    }

    let stdout = String::from_utf8_lossy(&output.stdout);

    let result = stdout
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .map(|line| ExtensionInfo {
            id: line.to_ascii_lowercase(),
            source: "cli".to_string(),
        })
        .collect::<Vec<_>>();

    Some(result)
}

fn read_via_dir_scan(editor: &ResolvedEditor) -> Option<Vec<ExtensionInfo>> {
    let path = std::path::Path::new(&editor.extensions_path);
    if !path.exists() {
        return None;
    }

    let regex = Regex::new(r"^(.+?)-\d+\.\d+\.\d+").ok()?;
    let entries = std::fs::read_dir(path).ok()?;

    let mut dedup = HashSet::new();
    let mut result = Vec::new();

    for entry in entries.flatten() {
        let file_type = match entry.file_type() {
            Ok(value) => value,
            Err(_) => continue,
        };

        if !file_type.is_dir() {
            continue;
        }

        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }

        let id = regex
            .captures(&name)
            .and_then(|capture| capture.get(1).map(|matched| matched.as_str().to_string()))
            .unwrap_or(name)
            .to_ascii_lowercase();

        if dedup.insert(id.clone()) {
            result.push(ExtensionInfo {
                id,
                source: "dir-scan".to_string(),
            });
        }
    }

    Some(result)
}

pub fn read_extensions(editor: &ResolvedEditor) -> EditorExtensions {
    if editor.cli_available {
        if let Some(cli_result) = read_via_cli(editor) {
            if !cli_result.is_empty() {
                return EditorExtensions {
                    editor: editor.clone(),
                    extensions: cli_result,
                };
            }
        }
    }

    if let Some(dir_result) = read_via_dir_scan(editor) {
        return EditorExtensions {
            editor: editor.clone(),
            extensions: dir_result,
        };
    }

    EditorExtensions {
        editor: editor.clone(),
        extensions: Vec::new(),
    }
}

pub fn read_all_extensions(editors: &[ResolvedEditor]) -> Vec<EditorExtensions> {
    editors.iter().map(read_extensions).collect()
}
