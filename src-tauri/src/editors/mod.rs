pub mod detect;

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PlatformPaths {
    pub extensions: String,
    pub settings: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorPaths {
    pub darwin: PlatformPaths,
    pub linux: PlatformPaths,
    pub win32: PlatformPaths,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorDefinition {
    pub name: String,
    pub slug: String,
    pub cli: String,
    pub badge_color: String,
    pub paths: EditorPaths,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResolvedEditor {
    pub name: String,
    pub slug: String,
    pub cli: String,
    pub badge_color: String,
    pub extensions_path: String,
    pub settings_path: String,
    pub cli_available: bool,
    pub extensions_exist: bool,
    pub settings_exist: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomEditorInput {
    pub name: String,
    pub extensions_path: String,
    pub settings_path: String,
    pub cli: String,
}

fn ed(
    name: &str,
    slug: &str,
    cli: &str,
    badge_color: &str,
    dot_dir: &str,
    darwin_app: &str,
    linux_app: Option<&str>,
    win32_app: Option<&str>,
) -> EditorDefinition {
    let linux = linux_app.unwrap_or(darwin_app);
    let win32 = win32_app.unwrap_or(darwin_app);

    EditorDefinition {
        name: name.to_string(),
        slug: slug.to_string(),
        cli: cli.to_string(),
        badge_color: badge_color.to_string(),
        paths: EditorPaths {
            darwin: PlatformPaths {
                extensions: format!("{dot_dir}/extensions"),
                settings: format!("Library/Application Support/{darwin_app}/User/settings.json"),
            },
            linux: PlatformPaths {
                extensions: format!("{dot_dir}/extensions"),
                settings: format!(".config/{linux}/User/settings.json"),
            },
            win32: PlatformPaths {
                extensions: format!("{dot_dir}/extensions"),
                settings: format!("{win32}/User/settings.json"),
            },
        },
    }
}

pub fn builtin_editors() -> Vec<EditorDefinition> {
    vec![
        ed("VSCode", "vscode", "code", "blue", ".vscode", "Code", None, None),
        ed(
            "VSCode Insiders",
            "vscode-insiders",
            "code-insiders",
            "green",
            ".vscode-insiders",
            "Code - Insiders",
            None,
            None,
        ),
        ed("VSCodium", "vscodium", "codium", "cyan", ".vscode-oss", "VSCodium", None, None),
        ed("Cursor", "cursor", "cursor", "magenta", ".cursor", "Cursor", None, None),
        ed(
            "Windsurf",
            "windsurf",
            "windsurf",
            "blueBright",
            ".windsurf",
            "Windsurf",
            None,
            None,
        ),
        ed("Kiro", "kiro", "kiro", "yellowBright", ".kiro", "Kiro", None, None),
        ed("Trae", "trae", "trae", "redBright", ".trae", "Trae", None, None),
        ed(
            "Trae CN",
            "trae-cn",
            "trae-cn",
            "red",
            ".trae-cn",
            "Trae CN",
            None,
            None,
        ),
        ed(
            "Antigravity",
            "antigravity",
            "antigravity",
            "magentaBright",
            ".antigravity",
            "Antigravity",
            None,
            None,
        ),
    ]
}
