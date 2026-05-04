export interface EditorRegistryEntry {
  slug: string;
  displayName: string;
  cli: string;
  badgeColor: string;
  /** macOS .app bundle name used for filesystem lookup. */
  macOSBundleName: string;
  /** Windows executable or directory name used for filesystem lookup. */
  windowsSearchName?: string;
  /**
   * Template for the extensions directory path.
   * `~` is replaced with the user's home directory, `{slug}` with the editor slug.
   */
  extensionsPath: {
    mac: string;
    win: string;
  };
  /**
   * Template for the state.vscdb SQLite database path.
   * `~` is replaced with the user's home directory.
   */
  stateDbPath: {
    mac: string;
    win: string;
  };
}

export const SUPPORTED_EDITORS: EditorRegistryEntry[] = [
  {
    slug: "vscode",
    displayName: "VSCode",
    cli: "code",
    badgeColor: "sky",
    macOSBundleName: "Visual Studio Code.app",
    extensionsPath: {
      mac: "~/.vscode/extensions",
      win: "~/.vscode/extensions",
    },
    stateDbPath: {
      mac: "~/Library/Application Support/Code/User/globalStorage/state.vscdb",
      win: "~/AppData/Roaming/Code/User/globalStorage/state.vscdb",
    },
  },
  {
    slug: "cursor",
    displayName: "Cursor",
    cli: "cursor",
    badgeColor: "magenta",
    macOSBundleName: "Cursor.app",
    extensionsPath: {
      mac: "~/.cursor/extensions",
      win: "~/.cursor/extensions",
    },
    stateDbPath: {
      mac: "~/Library/Application Support/Cursor/User/globalStorage/state.vscdb",
      win: "~/AppData/Roaming/Cursor/User/globalStorage/state.vscdb",
    },
  },
  {
    slug: "windsurf",
    displayName: "Windsurf",
    cli: "windsurf",
    badgeColor: "blue",
    macOSBundleName: "Windsurf.app",
    extensionsPath: {
      mac: "~/.windsurf/extensions",
      win: "~/.windsurf/extensions",
    },
    stateDbPath: {
      mac: "~/Library/Application Support/Windsurf/User/globalStorage/state.vscdb",
      win: "~/AppData/Roaming/Windsurf/User/globalStorage/state.vscdb",
    },
  },
  {
    slug: "antigravity",
    displayName: "Antigravity",
    cli: "antigravity",
    badgeColor: "emerald",
    macOSBundleName: "Antigravity.app",
    extensionsPath: {
      mac: "~/.antigravity/extensions",
      win: "~/.antigravity/extensions",
    },
    stateDbPath: {
      mac: "~/Library/Application Support/Antigravity/User/globalStorage/state.vscdb",
      win: "~/AppData/Roaming/Antigravity/User/globalStorage/state.vscdb",
    },
  },
  {
    slug: "kiro",
    displayName: "Kiro",
    cli: "kiro",
    badgeColor: "orange",
    macOSBundleName: "Kiro.app",
    extensionsPath: {
      mac: "~/.kiro/extensions",
      win: "~/.kiro/extensions",
    },
    stateDbPath: {
      mac: "~/Library/Application Support/Kiro/User/globalStorage/state.vscdb",
      win: "~/AppData/Roaming/Kiro/User/globalStorage/state.vscdb",
    },
  },
  {
    slug: "trae",
    displayName: "Trae",
    cli: "trae",
    badgeColor: "violet",
    macOSBundleName: "Trae.app",
    extensionsPath: {
      mac: "~/.trae/extensions",
      win: "~/.trae/extensions",
    },
    stateDbPath: {
      mac: "~/Library/Application Support/Trae/User/globalStorage/state.vscdb",
      win: "~/AppData/Roaming/Trae/User/globalStorage/state.vscdb",
    },
  },
  {
    slug: "trae-cn",
    displayName: "Trae CN",
    cli: "trae-cn",
    badgeColor: "red",
    macOSBundleName: "Trae CN.app",
    extensionsPath: {
      mac: "~/.trae-cn/extensions",
      win: "~/.trae-cn/extensions",
    },
    stateDbPath: {
      mac: "~/Library/Application Support/Trae CN/User/globalStorage/state.vscdb",
      win: "~/AppData/Roaming/Trae CN/User/globalStorage/state.vscdb",
    },
  },
  {
    slug: "qoder",
    displayName: "Qoder",
    cli: "qoder",
    badgeColor: "amber",
    macOSBundleName: "Qoder.app",
    extensionsPath: {
      mac: "~/.qoder/extensions",
      win: "~/.qoder/extensions",
    },
    stateDbPath: {
      mac: "~/Library/Application Support/Qoder/User/globalStorage/state.vscdb",
      win: "~/AppData/Roaming/Qoder/User/globalStorage/state.vscdb",
    },
  },
];
