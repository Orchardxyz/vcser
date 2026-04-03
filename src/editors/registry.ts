import type { EditorDefinition } from "./types";

function ed(
  name: string,
  slug: string,
  cli: string,
  badgeColor: string,
  dotDir: string,
  darwinApp: string,
  linuxApp?: string,
  win32App?: string
): EditorDefinition {
  const linux = linuxApp ?? darwinApp;
  const win = win32App ?? darwinApp;
  return {
    name,
    slug,
    cli,
    badgeColor,
    paths: {
      darwin: {
        extensions: `${dotDir}/extensions`,
        settings: `Library/Application Support/${darwinApp}/User/settings.json`,
      },
      linux: {
        extensions: `${dotDir}/extensions`,
        settings: `.config/${linux}/User/settings.json`,
      },
      win32: {
        extensions: `${dotDir}/extensions`,
        settings: `${win}/User/settings.json`,
      },
    },
  };
}

export const BUILTIN_EDITORS: EditorDefinition[] = [
  ed("VSCode", "vscode", "code", "blue", ".vscode", "Code"),
  ed(
    "VSCode Insiders",
    "vscode-insiders",
    "code-insiders",
    "green",
    ".vscode-insiders",
    "Code - Insiders"
  ),
  ed("VSCodium", "vscodium", "codium", "cyan", ".vscode-oss", "VSCodium"),
  ed("Cursor", "cursor", "cursor", "magenta", ".cursor", "Cursor"),
  ed("Windsurf", "windsurf", "windsurf", "blueBright", ".windsurf", "Windsurf"),
  ed("Kiro", "kiro", "kiro", "yellowBright", ".kiro", "Kiro"),
  ed("Trae", "trae", "trae", "redBright", ".trae", "Trae"),
  ed("Trae CN", "trae-cn", "trae-cn", "red", ".trae-cn", "Trae CN"),
  ed(
    "Antigravity",
    "antigravity",
    "antigravity",
    "magentaBright",
    ".antigravity",
    "Antigravity"
  ),
];
