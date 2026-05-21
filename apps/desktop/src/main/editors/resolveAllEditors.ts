import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { detectEditors, type DetectedEditor } from "@vcser/core/editors/detect";
import { APP_ICON_STATUS, EDITOR_SOURCE, type CustomEditorRecord, type ResolvedEditor } from "@vcser/core/types";
import { listCustomEditors } from "../customEditors/store";
import { resolveAppBundleSelection } from "./appBundle";

export interface ResolvedDesktopEditor extends ResolvedEditor {
  stateDbPath?: string;
}

function hasCommand(command: string | undefined) {
  const normalized = command?.trim();
  if (!normalized) {
    return false;
  }

  try {
    execFileSync(process.platform === "win32" ? "where" : "which", [normalized], {
      stdio: "ignore"
    });
    return true;
  } catch {
    return false;
  }
}

function toResolvedDetectedEditor(editor: DetectedEditor): ResolvedDesktopEditor {
  return {
    name: editor.name,
    displayName: editor.displayName,
    slug: editor.slug,
    cli: editor.cli,
    badgeColor: editor.badgeColor,
    extensionsPath: editor.extensionsPath,
    settingsPath: editor.settingsPath,
    cliAvailable: hasCommand(editor.cli),
    extensionsExist: existsSync(editor.extensionsPath),
    settingsExist: existsSync(editor.settingsPath),
    appPath: editor.appPath,
    iconPayload: editor.iconPayload,
    iconStatus: editor.iconStatus,
    source: EDITOR_SOURCE.DETECTED,
    stateDbPath: editor.stateDbPath
  };
}

async function toResolvedCustomEditor(editor: CustomEditorRecord): Promise<ResolvedDesktopEditor | null> {
  const selection = editor.appPath ? await resolveAppBundleSelection(editor.appPath) : undefined;

  if (selection?.unsupported) {
    return null;
  }

  return {
    name: editor.name,
    displayName: editor.displayName,
    slug: editor.slug,
    cli: editor.cli ?? "",
    badgeColor: "slate",
    extensionsPath: editor.extensionsPath,
    settingsPath: editor.settingsPath,
    cliAvailable: hasCommand(editor.cli),
    extensionsExist: existsSync(editor.extensionsPath),
    settingsExist: existsSync(editor.settingsPath),
    appPath: editor.appPath,
    iconPayload: selection?.iconPayload,
    iconStatus: selection?.iconStatus ?? APP_ICON_STATUS.FALLBACK,
    source: EDITOR_SOURCE.CUSTOM
  };
}

export async function resolveAllEditors(): Promise<ResolvedDesktopEditor[]> {
  const detected = await detectEditors();
  const custom = listCustomEditors();
  const resolvedCustom = await Promise.all(custom.map((editor) => toResolvedCustomEditor(editor)));

  return [...detected.map(toResolvedDetectedEditor), ...resolvedCustom.filter((editor): editor is ResolvedDesktopEditor => Boolean(editor))];
}
