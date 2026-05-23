import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { listDesktopCustomEditors, CustomEditorStoreError } from "../customEditors/store";
import { detectEditors, type DetectedEditor } from "@vcser/core/editors/detect";
import { APP_ICON_STATUS, EDITOR_SOURCE, type CustomEditorRecord, type ResolvedEditor } from "@vcser/core/types";
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
    id: editor.id,
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
  let custom: CustomEditorRecord[] = [];

  try {
    custom = await listDesktopCustomEditors();
  } catch (error) {
    if (!(error instanceof CustomEditorStoreError) || error.code !== "custom_editor_store_unavailable") {
      throw error;
    }

    console.warn("[vcser] Custom editor storage unavailable; continuing without custom editors.");
  }

  const resolvedCustom = await Promise.all(custom.map((editor) => toResolvedCustomEditor(editor)));

  return [...detected.map(toResolvedDetectedEditor), ...resolvedCustom.filter((editor): editor is ResolvedDesktopEditor => Boolean(editor))];
}
