use serde_json::{Map, Value};

use super::diff::{ChangeType, SettingsKeyDiff};

pub fn apply_settings_diffs(
    target: &Map<String, Value>,
    source: &Map<String, Value>,
    selected_diffs: &[SettingsKeyDiff],
) -> Map<String, Value> {
    let mut result = target.clone();

    for diff in selected_diffs {
        match diff.change_type {
            ChangeType::Add | ChangeType::Update => {
                if let Some(value) = source.get(&diff.key) {
                    result.insert(diff.key.clone(), value.clone());
                }
            }
            ChangeType::Delete => {
                result.remove(&diff.key);
            }
        }
    }

    result
}

#[cfg(test)]
mod tests {
    use serde_json::{json, Map, Value};

    use crate::settings::diff::{ChangeType, SettingsKeyDiff};

    use super::apply_settings_diffs;

    fn map(entries: &[(&str, Value)]) -> Map<String, Value> {
        entries
            .iter()
            .map(|(key, value)| ((*key).to_string(), value.clone()))
            .collect()
    }

    #[test]
    fn applies_add_update_delete() {
        let target = map(&[("same", json!(1)), ("remove", json!(2)), ("update", json!(0))]);
        let source = map(&[("same", json!(1)), ("update", json!(9)), ("add", json!(5))]);

        let diffs = vec![
            SettingsKeyDiff {
                key: "add".to_string(),
                change_type: ChangeType::Add,
                source_value: Some(json!(5)),
                target_value: None,
            },
            SettingsKeyDiff {
                key: "update".to_string(),
                change_type: ChangeType::Update,
                source_value: Some(json!(9)),
                target_value: Some(json!(0)),
            },
            SettingsKeyDiff {
                key: "remove".to_string(),
                change_type: ChangeType::Delete,
                source_value: None,
                target_value: Some(json!(2)),
            },
        ];

        let merged = apply_settings_diffs(&target, &source, &diffs);
        assert_eq!(merged.get("add"), Some(&json!(5)));
        assert_eq!(merged.get("update"), Some(&json!(9)));
        assert!(!merged.contains_key("remove"));
    }
}
