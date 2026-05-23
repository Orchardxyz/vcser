import { execFile } from "node:child_process";
import { access, constants } from "node:fs/promises";
import { promisify } from "node:util";
import { APP_ICON_STATUS, EDITOR_SOURCE, type ResolvedEditor } from "@vcser/core/types";
import { listCustomEditors } from "@vcser/core/customEditors";
import { detectEditors } from "@vcser/core/editors/detect/detect";
import type { CliLogger } from "./logger";

const execFilePromise = promisify(execFile);

export interface CliEditor extends ResolvedEditor {
  stateDbPath?: string;
}

export async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.F_OK | constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export async function canRunCommand(command: string): Promise<boolean> {
  if (!command) {
    return false;
  }

  try {
    await execFilePromise(command, ["--version"], {
      timeout: 5000,
      windowsHide: true
    });
    return true;
  } catch {
    return false;
  }
}

async function toCliEditor(editor: Omit<CliEditor, "cliAvailable" | "extensionsExist" | "settingsExist">, logger: CliLogger): Promise<CliEditor> {
  const extensionsExist = await pathExists(editor.extensionsPath);
  const settingsExist = await pathExists(editor.settingsPath);
  const cliAvailable = await canRunCommand(editor.cli);

  logger.debug(
    `${editor.slug}: source=${editor.source} extensions=${extensionsExist} settings=${settingsExist} cli=${cliAvailable} path=${editor.extensionsPath} command=${editor.cli}`
  );

  return {
    ...editor,
    cliAvailable,
    extensionsExist,
    settingsExist
  };
}

export async function resolveCliEditors(logger: CliLogger): Promise<CliEditor[]> {
  const [detectedEditors, customEditors] = await Promise.all([detectEditors(), listCustomEditors()]);

  const detected = detectedEditors.map((editor) => ({
    name: editor.name,
    displayName: editor.displayName,
    slug: editor.slug,
    cli: editor.cli,
    badgeColor: editor.badgeColor,
    extensionsPath: editor.extensionsPath,
    settingsPath: editor.settingsPath,
    appPath: editor.appPath,
    iconPayload: editor.iconPayload,
    iconStatus: editor.iconStatus,
    source: EDITOR_SOURCE.DETECTED,
    stateDbPath: editor.stateDbPath
  }));
  const custom = customEditors.map((editor) => ({
    id: editor.id,
    name: editor.name,
    displayName: editor.displayName,
    slug: editor.slug,
    cli: editor.cli ?? "",
    badgeColor: "slate",
    extensionsPath: editor.extensionsPath,
    settingsPath: editor.settingsPath,
    appPath: editor.appPath,
    iconStatus: APP_ICON_STATUS.FALLBACK,
    source: EDITOR_SOURCE.CUSTOM
  }));

  return Promise.all([...detected, ...custom].map((editor) => toCliEditor(editor, logger)));
}
