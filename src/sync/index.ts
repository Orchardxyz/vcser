import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import type { ResolvedEditor } from "../editors/types.js";
import type { SettingsKeyDiff } from "../settings/diff.js";
import { applySettingsDiffs } from "../settings/merge.js";
import { readSettings } from "../settings/reader.js";
import { createBackup } from "./backup.js";

export interface SyncAction {
  type: "install" | "uninstall";
  extensionId: string;
  targetEditor: ResolvedEditor;
}

export interface SettingsSyncAction {
  sourceEditor: ResolvedEditor;
  targetEditor: ResolvedEditor;
  diffs: SettingsKeyDiff[];
}

export interface SyncResult {
  action: string;
  editor: string;
  success: boolean;
  error?: string;
  backupPath?: string;
}

export function executeExtensionSync(
  actions: SyncAction[],
  dryRun: boolean
): SyncResult[] {
  const results: SyncResult[] = [];

  for (const action of actions) {
    const flag =
      action.type === "install"
        ? "--install-extension"
        : "--uninstall-extension";
    const cmd = `${action.targetEditor.cli} ${flag} ${action.extensionId}`;

    if (dryRun) {
      results.push({
        action: `[DRY RUN] ${cmd}`,
        editor: action.targetEditor.name,
        success: true,
      });
      continue;
    }

    if (!action.targetEditor.cliAvailable) {
      results.push({
        action: cmd,
        editor: action.targetEditor.name,
        success: false,
        error: `CLI "${action.targetEditor.cli}" not available`,
      });
      continue;
    }

    try {
      execSync(cmd, { stdio: "ignore", timeout: 60000 });
      results.push({
        action: cmd,
        editor: action.targetEditor.name,
        success: true,
      });
    } catch (err) {
      results.push({
        action: cmd,
        editor: action.targetEditor.name,
        success: false,
        error: (err as Error).message,
      });
    }
  }

  return results;
}

export function executeSettingsSync(
  syncAction: SettingsSyncAction,
  dryRun: boolean
): SyncResult {
  const { sourceEditor, targetEditor, diffs } = syncAction;
  const description = `Sync settings: ${sourceEditor.name} → ${targetEditor.name} (${diffs.length} keys)`;

  if (dryRun) {
    return {
      action: `[DRY RUN] ${description}`,
      editor: targetEditor.name,
      success: true,
    };
  }

  const backupPath = createBackup(targetEditor.settingsPath);

  try {
    const sourceSettings = readSettings(sourceEditor);
    const targetSettings = readSettings(targetEditor);

    const merged = applySettingsDiffs(
      targetSettings.settings,
      sourceSettings.settings,
      diffs
    );

    writeFileSync(
      targetEditor.settingsPath,
      JSON.stringify(merged, null, 2) + "\n",
      "utf-8"
    );

    return {
      action: description,
      editor: targetEditor.name,
      success: true,
      backupPath: backupPath ?? undefined,
    };
  } catch (err) {
    return {
      action: description,
      editor: targetEditor.name,
      success: false,
      error: (err as Error).message,
      backupPath: backupPath ?? undefined,
    };
  }
}
