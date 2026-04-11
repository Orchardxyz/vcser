use std::path::PathBuf;

#[derive(Clone, Copy, Debug)]
pub enum Platform {
    Darwin,
    Linux,
    Win32,
}

impl Platform {
    pub fn current() -> Self {
        match std::env::consts::OS {
            "macos" => Self::Darwin,
            "windows" => Self::Win32,
            _ => Self::Linux,
        }
    }
}

pub fn home_dir() -> Result<PathBuf, String> {
    dirs::home_dir().ok_or_else(|| "Unable to resolve home directory".to_string())
}

pub fn settings_base(platform: Platform) -> Result<PathBuf, String> {
    let home = home_dir()?;

    let base = match platform {
        Platform::Darwin => home.join("Library").join("Application Support"),
        Platform::Linux => home.join(".config"),
        Platform::Win32 => std::env::var_os("APPDATA")
            .map(PathBuf::from)
            .unwrap_or_else(|| home.join("AppData").join("Roaming")),
    };

    Ok(base)
}
