import { existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import type {
  EditorDefinition,
  ResolvedEditor,
  CustomEditorInput,
} from "./types.js";
import {
  currentPlatform,
  homeDir,
  settingsBase,
  type Platform,
} from "../platform/paths.js";

function resolveBuiltinPaths(
  editor: EditorDefinition,
  platform: Platform
): { extensionsPath: string; settingsPath: string } {
  const home = homeDir();
  const platPaths = editor.paths[platform];

  const extensionsPath = join(home, platPaths.extensions);

  let settingsPath: string;
  if (platform === "win32") {
    const appData =
      process.env.APPDATA || join(home, "AppData", "Roaming");
    settingsPath = join(appData, platPaths.settings);
  } else if (platform === "darwin") {
    settingsPath = join(home, platPaths.settings);
  } else {
    settingsPath = join(home, platPaths.settings);
  }

  return { extensionsPath, settingsPath };
}

function isCliAvailable(cli: string): boolean {
  try {
    const cmd =
      process.platform === "win32" ? `where ${cli}` : `which ${cli}`;
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function resolveEditor(
  editor: EditorDefinition,
  platform?: Platform
): ResolvedEditor {
  const plat = platform ?? currentPlatform();
  const { extensionsPath, settingsPath } = resolveBuiltinPaths(editor, plat);

  return {
    name: editor.name,
    slug: editor.slug,
    cli: editor.cli,
    badgeColor: editor.badgeColor,
    extensionsPath,
    settingsPath,
    cliAvailable: isCliAvailable(editor.cli),
    extensionsExist: existsSync(extensionsPath),
    settingsExist: existsSync(settingsPath),
  };
}

export function resolveCustomEditor(input: CustomEditorInput): ResolvedEditor {
  return {
    name: input.name,
    slug: input.name.toLowerCase().replace(/\s+/g, "-"),
    cli: input.cli,
    badgeColor: "gray",
    extensionsPath: input.extensionsPath,
    settingsPath: input.settingsPath,
    cliAvailable: isCliAvailable(input.cli),
    extensionsExist: existsSync(input.extensionsPath),
    settingsExist: existsSync(input.settingsPath),
  };
}

export function detectInstalledEditors(
  builtins: EditorDefinition[],
  customInputs: CustomEditorInput[] = []
): ResolvedEditor[] {
  const platform = currentPlatform();
  const resolved: ResolvedEditor[] = [];

  for (const editor of builtins) {
    const r = resolveEditor(editor, platform);
    if (r.extensionsExist || r.settingsExist) {
      resolved.push(r);
    }
  }

  for (const input of customInputs) {
    resolved.push(resolveCustomEditor(input));
  }

  return resolved;
}
