use serde::{Deserialize, Serialize};
use serde_json::Value;

use super::reader::EditorSettings;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum SettingsMode {
    Safe,
    Exact,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum ChangeType {
    Add,
    Update,
    Delete,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsKeyDiff {
    pub key: String,
    pub change_type: ChangeType,
    pub source_value: Option<Value>,
    pub target_value: Option<Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SettingsDiffResult {
    pub source_name: String,
    pub target_name: String,
    pub diffs: Vec<SettingsKeyDiff>,
    pub add_count: usize,
    pub update_count: usize,
    pub delete_count: usize,
}

pub fn compute_settings_diff(
    source: &EditorSettings,
    target: &EditorSettings,
    mode: SettingsMode,
) -> SettingsDiffResult {
    let mut diffs = Vec::new();

    for (key, source_value) in &source.settings {
        match target.settings.get(key) {
            None => {
                diffs.push(SettingsKeyDiff {
                    key: key.clone(),
                    change_type: ChangeType::Add,
                    source_value: Some(source_value.clone()),
                    target_value: None,
                });
            }
            Some(target_value) => {
                if source_value != target_value {
                    diffs.push(SettingsKeyDiff {
                        key: key.clone(),
                        change_type: ChangeType::Update,
                        source_value: Some(source_value.clone()),
                        target_value: Some(target_value.clone()),
                    });
                }
            }
        }
    }

    if mode == SettingsMode::Exact {
        for (key, target_value) in &target.settings {
            if !source.settings.contains_key(key) {
                diffs.push(SettingsKeyDiff {
                    key: key.clone(),
                    change_type: ChangeType::Delete,
                    source_value: None,
                    target_value: Some(target_value.clone()),
                });
            }
        }
    }

    diffs.sort_by(|left, right| left.key.cmp(&right.key));

    let add_count = diffs
        .iter()
        .filter(|diff| diff.change_type == ChangeType::Add)
        .count();
    let update_count = diffs
        .iter()
        .filter(|diff| diff.change_type == ChangeType::Update)
        .count();
    let delete_count = diffs
        .iter()
        .filter(|diff| diff.change_type == ChangeType::Delete)
        .count();

    SettingsDiffResult {
        source_name: source.editor.name.clone(),
        target_name: target.editor.name.clone(),
        diffs,
        add_count,
        update_count,
        delete_count,
    }
}

#[cfg(test)]
mod tests {
    use serde_json::{json, Map, Value};

    use crate::editors::ResolvedEditor;
    use crate::settings::reader::EditorSettings;

    use super::{compute_settings_diff, ChangeType, SettingsMode};

    fn editor(name: &str) -> ResolvedEditor {
        ResolvedEditor {
            name: name.to_string(),
            slug: name.to_lowercase(),
            cli: name.to_lowercase(),
            badge_color: "gray".to_string(),
            extensions_path: "".to_string(),
            settings_path: "".to_string(),
            cli_available: true,
            extensions_exist: true,
            settings_exist: true,
        }
    }

    fn map(entries: &[(&str, Value)]) -> Map<String, Value> {
        entries
            .iter()
            .map(|(key, value)| ((*key).to_string(), value.clone()))
            .collect()
    }

    #[test]
    fn safe_mode_only_add_update() {
        let source = EditorSettings {
            editor: editor("Source"),
            settings: map(&[("a", json!(1)), ("b", json!(2))]),
            raw: "{}".to_string(),
        };

        let target = EditorSettings {
            editor: editor("Target"),
            settings: map(&[("b", json!(3)), ("c", json!(5))]),
            raw: "{}".to_string(),
        };

        let result = compute_settings_diff(&source, &target, SettingsMode::Safe);

        assert_eq!(result.add_count, 1);
        assert_eq!(result.update_count, 1);
        assert_eq!(result.delete_count, 0);
        assert!(result
            .diffs
            .iter()
            .all(|diff| diff.change_type != ChangeType::Delete));
    }

    #[test]
    fn exact_mode_includes_delete() {
        let source = EditorSettings {
            editor: editor("Source"),
            settings: map(&[("a", json!(1))]),
            raw: "{}".to_string(),
        };

        let target = EditorSettings {
            editor: editor("Target"),
            settings: map(&[("a", json!(1)), ("legacy", json!(true))]),
            raw: "{}".to_string(),
        };

        let result = compute_settings_diff(&source, &target, SettingsMode::Exact);
        assert_eq!(result.delete_count, 1);
    }
}
