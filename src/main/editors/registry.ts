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
  },
];
