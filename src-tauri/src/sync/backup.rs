use chrono::Local;

pub fn create_backup(settings_path: &str) -> Result<Option<String>, String> {
    let path = std::path::Path::new(settings_path);
    if !path.exists() {
        return Ok(None);
    }

    let parent = path
        .parent()
        .ok_or_else(|| format!("Invalid settings path: {settings_path}"))?;

    let timestamp = Local::now().format("%Y%m%d-%H%M%S").to_string();
    let backup_name = format!("settings.vcser-backup-{timestamp}.json");
    let backup_path = parent.join(backup_name);

    std::fs::copy(path, &backup_path)
        .map_err(|err| format!("Unable to create backup for {}: {err}", path.display()))?;

    Ok(Some(backup_path.to_string_lossy().to_string()))
}
