use std::path::PathBuf;

use super::{builtin_editors, CustomEditorInput, EditorDefinition, PlatformPaths, ResolvedEditor};
use crate::platform::{home_dir, settings_base, Platform};

fn resolve_builtin_paths(
    editor: &EditorDefinition,
    platform: Platform,
) -> Result<(PathBuf, PathBuf), String> {
    let home = home_dir()?;

    let paths: &PlatformPaths = match platform {
        Platform::Darwin => &editor.paths.darwin,
        Platform::Linux => &editor.paths.linux,
        Platform::Win32 => &editor.paths.win32,
    };

    let extensions_path = home.join(&paths.extensions);
    let settings_path = match platform {
        Platform::Win32 => settings_base(platform)?.join(&paths.settings),
        Platform::Darwin | Platform::Linux => home.join(&paths.settings),
    };

    Ok((extensions_path, settings_path))
}

fn slugify(name: &str) -> String {
    name.trim()
        .to_ascii_lowercase()
        .chars()
        .map(|ch| if ch.is_ascii_whitespace() { '-' } else { ch })
        .collect::<String>()
        .split('-')
        .filter(|segment| !segment.is_empty())
        .collect::<Vec<&str>>()
        .join("-")
}

fn is_cli_available(cli: &str) -> bool {
    which::which(cli).is_ok()
}

fn validate_cli_name(cli: &str) -> Result<String, String> {
    let value = cli.trim();

    if value.is_empty() {
        return Err("CLI command is required".to_string());
    }

    let allowed = value
        .chars()
        .all(|ch| ch.is_ascii_alphanumeric() || matches!(ch, '-' | '_' | '.'));

    if !allowed {
        return Err("CLI command can only contain letters, numbers, '-', '_' and '.'".to_string());
    }

    Ok(value.to_string())
}

fn expand_tilde(path: &str) -> Result<PathBuf, String> {
    if path == "~" {
        return home_dir();
    }

    if let Some(rest) = path.strip_prefix("~/") {
        return Ok(home_dir()?.join(rest));
    }

    Ok(PathBuf::from(path))
}

fn normalize_path(path: &str) -> Result<PathBuf, String> {
    let trimmed = path.trim();

    if trimmed.is_empty() {
        return Err("Path is required".to_string());
    }

    if trimmed.contains('\0') {
        return Err("Path contains invalid null bytes".to_string());
    }

    let expanded = expand_tilde(trimmed)?;
    let absolute = if expanded.is_absolute() {
        expanded
    } else {
        std::env::current_dir()
            .map_err(|err| format!("Unable to resolve current directory: {err}"))?
            .join(expanded)
    };

    if absolute.exists() {
        return absolute
            .canonicalize()
            .map_err(|err| format!("Unable to canonicalize path {}: {err}", absolute.display()));
    }

    let parent = absolute
        .parent()
        .ok_or_else(|| format!("Invalid path: {}", absolute.display()))?;

    if !parent.exists() {
        return Err(format!("Path parent does not exist: {}", parent.display()));
    }

    let canonical_parent = parent
        .canonicalize()
        .map_err(|err| format!("Unable to canonicalize path parent {}: {err}", parent.display()))?;

    let file_name = absolute
        .file_name()
        .ok_or_else(|| format!("Invalid path: {}", absolute.display()))?;

    Ok(canonical_parent.join(file_name))
}

pub fn resolve_editor(editor: &EditorDefinition, platform: Platform) -> Result<ResolvedEditor, String> {
    let (extensions_path, settings_path) = resolve_builtin_paths(editor, platform)?;

    Ok(ResolvedEditor {
        name: editor.name.clone(),
        slug: editor.slug.clone(),
        cli: editor.cli.clone(),
        badge_color: editor.badge_color.clone(),
        extensions_path: extensions_path.to_string_lossy().to_string(),
        settings_path: settings_path.to_string_lossy().to_string(),
        cli_available: is_cli_available(&editor.cli),
        extensions_exist: extensions_path.exists(),
        settings_exist: settings_path.exists(),
    })
}

pub fn resolve_custom_editor(input: &CustomEditorInput) -> Result<ResolvedEditor, String> {
    let name = input.name.trim();
    if name.is_empty() {
        return Err("Custom editor name is required".to_string());
    }

    let cli = validate_cli_name(&input.cli)?;
    let extensions_path = normalize_path(&input.extensions_path)?;
    let settings_path = normalize_path(&input.settings_path)?;

    Ok(ResolvedEditor {
        name: name.to_string(),
        slug: slugify(name),
        cli: cli.clone(),
        badge_color: "gray".to_string(),
        extensions_path: extensions_path.to_string_lossy().to_string(),
        settings_path: settings_path.to_string_lossy().to_string(),
        cli_available: is_cli_available(&cli),
        extensions_exist: extensions_path.exists(),
        settings_exist: settings_path.exists(),
    })
}

pub fn detect_installed_editors(custom_inputs: &[CustomEditorInput]) -> Result<Vec<ResolvedEditor>, String> {
    let platform = Platform::current();
    let mut resolved = Vec::new();

    for editor in builtin_editors() {
        let entry = resolve_editor(&editor, platform)?;
        if entry.extensions_exist || entry.settings_exist {
            resolved.push(entry);
        }
    }

    for input in custom_inputs {
        resolved.push(resolve_custom_editor(input)?);
    }

    Ok(resolved)
}

#[cfg(test)]
mod tests {
    use super::{resolve_custom_editor, CustomEditorInput};

    #[test]
    fn rejects_invalid_cli() {
        let temp = std::env::temp_dir();
        let input = CustomEditorInput {
            name: "Bad CLI".to_string(),
            extensions_path: temp.to_string_lossy().to_string(),
            settings_path: temp.join("settings.json").to_string_lossy().to_string(),
            cli: "bad cli".to_string(),
        };

        let result = resolve_custom_editor(&input);
        assert!(result.is_err());
    }

    #[test]
    fn rejects_non_existing_parent_path() {
        let temp = std::env::temp_dir().join("vcser_missing_parent").join("nested");

        let input = CustomEditorInput {
            name: "Custom".to_string(),
            extensions_path: temp.join("extensions").to_string_lossy().to_string(),
            settings_path: temp.join("settings.json").to_string_lossy().to_string(),
            cli: "custom".to_string(),
        };

        let result = resolve_custom_editor(&input);
        assert!(result.is_err());
    }
}
