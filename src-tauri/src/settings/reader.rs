use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use crate::editors::ResolvedEditor;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorSettings {
    pub editor: ResolvedEditor,
    pub settings: Map<String, Value>,
    pub raw: String,
}

pub fn read_settings(editor: &ResolvedEditor) -> EditorSettings {
    let path = std::path::Path::new(&editor.settings_path);
    if !path.exists() {
        return EditorSettings {
            editor: editor.clone(),
            settings: Map::new(),
            raw: "{}".to_string(),
        };
    }

    let raw = std::fs::read_to_string(path).unwrap_or_else(|_| "{}".to_string());
    let value: Value = serde_json::from_str(&raw).unwrap_or_else(|_| Value::Object(Map::new()));

    let settings = match value {
        Value::Object(map) => map,
        _ => Map::new(),
    };

    EditorSettings {
        editor: editor.clone(),
        settings,
        raw,
    }
}

pub fn read_all_settings(editors: &[ResolvedEditor]) -> Vec<EditorSettings> {
    editors.iter().map(read_settings).collect()
}
