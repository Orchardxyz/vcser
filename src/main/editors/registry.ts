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
  extensionsPathTemplate: string;
}

export const SUPPORTED_EDITORS: EditorRegistryEntry[] = [
  {
    slug: "vscode",
    displayName: "VSCode",
    cli: "code",
    badgeColor: "sky",
    macOSBundleName: "Visual Studio Code.app",
    extensionsPathTemplate: "~/.vscode/extensions",
  },
  {
    slug: "cursor",
    displayName: "Cursor",
    cli: "cursor",
    badgeColor: "magenta",
    macOSBundleName: "Cursor.app",
    extensionsPathTemplate: "~/.cursor/extensions",
  },
  {
    slug: "windsurf",
    displayName: "Windsurf",
    cli: "windsurf",
    badgeColor: "blue",
    macOSBundleName: "Windsurf.app",
    extensionsPathTemplate: "~/.windsurf/extensions",
  },
  {
    slug: "antigravity",
    displayName: "Antigravity",
    cli: "antigravity",
    badgeColor: "emerald",
    macOSBundleName: "Antigravity.app",
    extensionsPathTemplate: "~/.antigravity/extensions",
  },
  {
    slug: "kiro",
    displayName: "Kiro",
    cli: "kiro",
    badgeColor: "orange",
    macOSBundleName: "Kiro.app",
    extensionsPathTemplate: "~/.kiro/extensions",
  },
  {
    slug: "trae",
    displayName: "Trae",
    cli: "trae",
    badgeColor: "violet",
    macOSBundleName: "Trae.app",
    extensionsPathTemplate: "~/.trae/extensions",
  },
  {
    slug: "trae-cn",
    displayName: "Trae CN",
    cli: "trae-cn",
    badgeColor: "red",
    macOSBundleName: "Trae CN.app",
    extensionsPathTemplate: "~/.trae-cn/extensions",
  },
  {
    slug: "qoder",
    displayName: "Qoder",
    cli: "qoder",
    badgeColor: "amber",
    macOSBundleName: "Qoder.app",
    extensionsPathTemplate: "~/.qoder/extensions",
  },
];
