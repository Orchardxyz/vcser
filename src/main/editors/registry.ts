export interface EditorRegistryEntry {
  slug: string;
  displayName: string;
  cli: string;
  badgeColor: string;
  /** macOS .app bundle name used for filesystem lookup. */
  macOSBundleName: string;
  /** Windows executable or directory name used for filesystem lookup. */
  windowsSearchName?: string;
}

export const SUPPORTED_EDITORS: EditorRegistryEntry[] = [
  {
    slug: "vscode",
    displayName: "VSCode",
    cli: "code",
    badgeColor: "sky",
    macOSBundleName: "Visual Studio Code.app",
  },
  {
    slug: "cursor",
    displayName: "Cursor",
    cli: "cursor",
    badgeColor: "magenta",
    macOSBundleName: "Cursor.app",
  },
  {
    slug: "windsurf",
    displayName: "Windsurf",
    cli: "windsurf",
    badgeColor: "blue",
    macOSBundleName: "Windsurf.app",
  },
  {
    slug: "antigravity",
    displayName: "Antigravity",
    cli: "antigravity",
    badgeColor: "emerald",
    macOSBundleName: "Antigravity.app",
  },
  {
    slug: "kiro",
    displayName: "Kiro",
    cli: "kiro",
    badgeColor: "orange",
    macOSBundleName: "Kiro.app",
  },
  {
    slug: "trae",
    displayName: "Trae",
    cli: "trae",
    badgeColor: "violet",
    macOSBundleName: "Trae.app",
  },
  {
    slug: "trae-cn",
    displayName: "Trae CN",
    cli: "trae-cn",
    badgeColor: "red",
    macOSBundleName: "Trae CN.app",
  },
  {
    slug: "qoder",
    displayName: "Qoder",
    cli: "qoder",
    badgeColor: "amber",
    macOSBundleName: "Qoder.app",
  },
];
