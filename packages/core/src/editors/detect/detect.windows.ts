import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { win32 } from "node:path";
import type { EditorRegistryEntry } from "../registry";
import { APP_ICON_STATUS, type DetectedEditor } from "./detect";

interface WindowsDetectionDependencies {
  env?: NodeJS.ProcessEnv;
  homeDir?: string;
  pathExists?: (path: string) => boolean;
}

const WINDOWS_EXECUTABLE_PATTERNS: Record<string, string[]> = {
  vscode: ["Programs/Microsoft VS Code/Code.exe", "Microsoft VS Code/Code.exe", "Code.exe"],
  cursor: ["Programs/Cursor/Cursor.exe", "Cursor/Cursor.exe", "Cursor.exe"],
  windsurf: ["Programs/Windsurf/Windsurf.exe", "Windsurf/Windsurf.exe", "Windsurf.exe"],
  antigravity: ["Programs/Antigravity/Antigravity.exe", "Antigravity/Antigravity.exe", "Antigravity.exe"],
  kiro: ["Programs/Kiro/Kiro.exe", "Kiro/Kiro.exe", "Kiro.exe"],
  trae: ["Programs/Trae/Trae.exe", "Trae/Trae.exe", "Trae.exe"],
  "trae-cn": ["Programs/Trae CN/Trae CN.exe", "Trae CN/Trae CN.exe", "Trae CN.exe"],
  qoder: ["Programs/Qoder/Qoder.exe", "Qoder/Qoder.exe", "Qoder.exe"]
};

function normalizeWindowsBaseDir(pathValue: string | undefined, fallbackSegments: string[]): string {
  const normalized = pathValue?.trim();
  if (normalized) {
    return normalized;
  }

  return win32.join(...fallbackSegments);
}

function resolveWindowsBaseDirs(homeDir: string, env: NodeJS.ProcessEnv): string[] {
  const systemDrive = env.SystemDrive?.trim() || "C:";

  return [
    normalizeWindowsBaseDir(env.LOCALAPPDATA, [homeDir, "AppData", "Local"]),
    normalizeWindowsBaseDir(env.ProgramFiles, [systemDrive, "Program Files"]),
    normalizeWindowsBaseDir(env["ProgramFiles(x86)"], [systemDrive, "Program Files (x86)"])
  ];
}

function resolveTemplatePath(template: string, homeDir: string): string {
  if (template.startsWith("~/")) {
    return win32.join(homeDir, template.slice(2));
  }

  return template;
}

function resolveExecutableCandidates(entry: EditorRegistryEntry, baseDirs: string[]): string[] {
  const patterns = WINDOWS_EXECUTABLE_PATTERNS[entry.slug];
  if (!patterns?.length) {
    const searchName = entry.windowsSearchName?.trim();
    if (!searchName) {
      return [];
    }

    return baseDirs.flatMap((baseDir) => [
      win32.join(baseDir, "Programs", searchName, `${searchName}.exe`),
      win32.join(baseDir, searchName, `${searchName}.exe`),
      win32.join(baseDir, `${searchName}.exe`)
    ]);
  }

  return baseDirs.flatMap((baseDir) => patterns.map((pattern) => win32.join(baseDir, ...pattern.split("/"))));
}

function createDetectedEditor(entry: EditorRegistryEntry, appPath: string, homeDir: string): DetectedEditor {
  const extensionsPath = resolveTemplatePath(entry.extensionsPath.win, homeDir).replace("{slug}", entry.slug);
  const settingsPath = resolveTemplatePath(entry.settingsPath.win, homeDir);
  const stateDbPath = resolveTemplatePath(entry.stateDbPath.win, homeDir);

  return {
    name: entry.displayName,
    displayName: entry.displayName,
    slug: entry.slug,
    cli: entry.cli,
    badgeColor: entry.badgeColor,
    appPath,
    extensionsPath,
    settingsPath,
    stateDbPath,
    iconStatus: APP_ICON_STATUS.FALLBACK
  };
}

export async function detectWindowsEditors(
  entries: readonly EditorRegistryEntry[],
  dependencies: WindowsDetectionDependencies = {}
): Promise<DetectedEditor[]> {
  const env = dependencies.env ?? process.env;
  const homeDir = dependencies.homeDir ?? homedir();
  const pathExists = dependencies.pathExists ?? existsSync;
  const baseDirs = resolveWindowsBaseDirs(homeDir, env);
  const results: DetectedEditor[] = [];

  for (const entry of entries) {
    const candidateAppPaths = resolveExecutableCandidates(entry, baseDirs);
    const detectedAppPath = candidateAppPaths.find((candidatePath) => pathExists(candidatePath));
    const editor = createDetectedEditor(entry, detectedAppPath ?? candidateAppPaths[0] ?? entry.displayName, homeDir);

    if (detectedAppPath || pathExists(editor.settingsPath) || pathExists(editor.extensionsPath)) {
      results.push(editor);
    }
  }

  return results;
}
