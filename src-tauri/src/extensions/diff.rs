use std::collections::{BTreeMap, BTreeSet};

use serde::{Deserialize, Serialize};

use super::reader::EditorExtensions;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionPresence {
    pub extension_id: String,
    pub presence: BTreeMap<String, bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionDiffResult {
    pub editor_names: Vec<String>,
    pub all: Vec<ExtensionPresence>,
    pub only_diffs: Vec<ExtensionPresence>,
}

pub fn compute_extension_diff(editor_extensions: &[EditorExtensions]) -> ExtensionDiffResult {
    let editor_names = editor_extensions
        .iter()
        .map(|item| item.editor.name.clone())
        .collect::<Vec<_>>();

    let mut all_ids = BTreeSet::new();
    let mut editor_sets: BTreeMap<String, BTreeSet<String>> = BTreeMap::new();

    for entry in editor_extensions {
        let ids = entry
            .extensions
            .iter()
            .map(|item| item.id.clone())
            .collect::<BTreeSet<_>>();

        for id in &ids {
            all_ids.insert(id.clone());
        }

        editor_sets.insert(entry.editor.name.clone(), ids);
    }

    let all = all_ids
        .into_iter()
        .map(|extension_id| {
            let mut presence = BTreeMap::new();

            for editor_name in &editor_names {
                let exists = editor_sets
                    .get(editor_name)
                    .map(|set| set.contains(&extension_id))
                    .unwrap_or(false);

                presence.insert(editor_name.clone(), exists);
            }

            ExtensionPresence {
                extension_id,
                presence,
            }
        })
        .collect::<Vec<_>>();

    let only_diffs = all
        .iter()
        .filter(|entry| {
            let values = entry.presence.values().copied().collect::<Vec<_>>();
            let all_true = values.iter().all(|value| *value);
            let all_false = values.iter().all(|value| !*value);
            !(all_true || all_false)
        })
        .cloned()
        .collect::<Vec<_>>();

    ExtensionDiffResult {
        editor_names,
        all,
        only_diffs,
    }
}

#[cfg(test)]
mod tests {
    use crate::editors::ResolvedEditor;
    use crate::extensions::reader::{EditorExtensions, ExtensionInfo};

    use super::compute_extension_diff;

    #[test]
    fn computes_only_diffs() {
        let base = ResolvedEditor {
            name: "A".to_string(),
            slug: "a".to_string(),
            cli: "a".to_string(),
            badge_color: "blue".to_string(),
            extensions_path: "".to_string(),
            settings_path: "".to_string(),
            cli_available: true,
            extensions_exist: true,
            settings_exist: true,
        };

        let second = ResolvedEditor {
            name: "B".to_string(),
            ..base.clone()
        };

        let data = vec![
            EditorExtensions {
                editor: base,
                extensions: vec![
                    ExtensionInfo {
                        id: "one.ext".to_string(),
                        source: "cli".to_string(),
                    },
                    ExtensionInfo {
                        id: "two.ext".to_string(),
                        source: "cli".to_string(),
                    },
                ],
            },
            EditorExtensions {
                editor: second,
                extensions: vec![ExtensionInfo {
                    id: "one.ext".to_string(),
                    source: "cli".to_string(),
                }],
            },
        ];

        let result = compute_extension_diff(&data);
        assert_eq!(result.only_diffs.len(), 1);
        assert_eq!(result.only_diffs[0].extension_id, "two.ext");
    }
}
