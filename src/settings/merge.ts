import type { SettingsKeyDiff } from "./diff";

export function applySettingsDiffs(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  selectedDiffs: SettingsKeyDiff[]
): Record<string, unknown> {
  const result = { ...target };

  for (const diff of selectedDiffs) {
    switch (diff.changeType) {
      case "add":
      case "update":
        result[diff.key] = source[diff.key];
        break;
      case "delete":
        delete result[diff.key];
        break;
    }
  }

  return result;
}
