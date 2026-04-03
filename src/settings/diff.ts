import type { EditorSettings } from "./reader";

export type ChangeType = "add" | "update" | "delete";

export interface SettingsKeyDiff {
  key: string;
  changeType: ChangeType;
  sourceValue?: unknown;
  targetValue?: unknown;
}

export interface SettingsDiffResult {
  sourceName: string;
  targetName: string;
  diffs: SettingsKeyDiff[];
  addCount: number;
  updateCount: number;
  deleteCount: number;
}

export function computeSettingsDiff(
  source: EditorSettings,
  target: EditorSettings,
  mode: "safe" | "exact"
): SettingsDiffResult {
  const diffs: SettingsKeyDiff[] = [];

  const sourceKeys = new Set(Object.keys(source.settings));
  const targetKeys = new Set(Object.keys(target.settings));

  for (const key of sourceKeys) {
    if (!targetKeys.has(key)) {
      diffs.push({
        key,
        changeType: "add",
        sourceValue: source.settings[key],
      });
    } else if (
      JSON.stringify(source.settings[key]) !==
      JSON.stringify(target.settings[key])
    ) {
      diffs.push({
        key,
        changeType: "update",
        sourceValue: source.settings[key],
        targetValue: target.settings[key],
      });
    }
  }

  if (mode === "exact") {
    for (const key of targetKeys) {
      if (!sourceKeys.has(key)) {
        diffs.push({
          key,
          changeType: "delete",
          targetValue: target.settings[key],
        });
      }
    }
  }

  diffs.sort((a, b) => a.key.localeCompare(b.key));

  return {
    sourceName: source.editor.name,
    targetName: target.editor.name,
    diffs,
    addCount: diffs.filter((d) => d.changeType === "add").length,
    updateCount: diffs.filter((d) => d.changeType === "update").length,
    deleteCount: diffs.filter((d) => d.changeType === "delete").length,
  };
}
