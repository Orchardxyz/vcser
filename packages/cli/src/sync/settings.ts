import { listEditorExtensions, resolveNamespacesToExtensions } from "@vcser/core/editors/extensions";
import {
  diffSettings,
  filterSettingsDiffsByExtensionNamespaces,
  orientSettingsDiffsForSourceTargetSync,
  namespaceOf,
  readSettingsJsonFile,
  syncSettingsValues
} from "@vcser/core/editors/settings";
import type { EditorExtensionItem, SettingsKeyDiff } from "@vcser/core/types";
import type { CliLogger, CliTableColumn } from "../logger";
import type { CliEditor } from "../editor/resolution";
import type { PromptRunner } from "../prompt";

const SETTINGS_TABLE_COLUMNS = [
  { key: "sourceExtension", label: "Source extension", maxWidth: 28 },
  { key: "targetExtension", label: "Target extension", maxWidth: 28 },
  { key: "namespace", label: "Namespace", maxWidth: 16 },
  { key: "key", label: "Key", maxWidth: 36 },
  { key: "change", label: "Change", maxWidth: 8 },
  { key: "sourceValue", label: "Source value", maxWidth: 24 },
  { key: "targetValue", label: "Target value", maxWidth: 24 }
] as const satisfies readonly CliTableColumn[];

function formatVersion(version: string | null): string {
  return version ?? "unknown";
}

function stableStringify(value: unknown): string {
  if (value === undefined) {
    return "-";
  }

  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(", ")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, entryValue]) => `${JSON.stringify(key)}: ${stableStringify(entryValue)}`).join(", ")}}`;
}

function formatSourceExtensionLabel(extensionId: string, item?: EditorExtensionItem): string {
  return `${extensionId}@${formatVersion(item?.version ?? null)}`;
}

function formatTargetExtensionLabel(extensionId: string, item?: EditorExtensionItem): string {
  if (!item) {
    return "not installed";
  }

  return `${extensionId}@${formatVersion(item.version)}`;
}

function createSettingsDiffRows(params: {
  diffs: readonly SettingsKeyDiff[];
  sourceItems: readonly EditorExtensionItem[];
  targetItems: readonly EditorExtensionItem[];
  namespaceToExtension: ReadonlyMap<string, string>;
}): Record<string, string>[] {
  const sourceById = new Map(params.sourceItems.map((item) => [item.extensionId, item]));
  const targetById = new Map(params.targetItems.map((item) => [item.extensionId, item]));

  return params.diffs.map((diff) => {
    const extensionId = params.namespaceToExtension.get(namespaceOf(diff.key)) ?? "unknown";

    return {
      sourceExtension: formatSourceExtensionLabel(extensionId, sourceById.get(extensionId)),
      targetExtension: formatTargetExtensionLabel(extensionId, targetById.get(extensionId)),
      namespace: namespaceOf(diff.key),
      key: diff.key,
      change: diff.changeType,
      sourceValue: stableStringify(diff.sourceValue),
      targetValue: stableStringify(diff.targetValue)
    };
  });
}

function logSettingsSkip(logger: CliLogger, message: string, details?: string): void {
  logger.line(logger.palette.yellow(`Skipping settings sync: ${message}`));

  if (details) {
    logger.debug(details);
  }
}

export async function maybeSyncSettings(params: {
  logger: CliLogger;
  prompt: PromptRunner;
  sourceEditor: CliEditor;
  targetEditor: CliEditor;
  sourceItems: readonly EditorExtensionItem[];
  successfulExtensionIds: readonly string[];
}): Promise<{ exitCode?: number }> {
  const { logger, prompt, sourceEditor, targetEditor, sourceItems, successfulExtensionIds } = params;

  if (successfulExtensionIds.length === 0) {
    return {};
  }

  if (!sourceEditor.settingsPath || !targetEditor.settingsPath) {
    logSettingsSkip(logger, "one of the selected editors does not expose a settings.json path.");
    return {};
  }

  const sourceSettings = readSettingsJsonFile(sourceEditor.settingsPath);
  if (!sourceSettings.success) {
    logSettingsSkip(logger, `source settings are unavailable for ${sourceEditor.displayName}.`, sourceSettings.error);
    return {};
  }

  const targetSettings = readSettingsJsonFile(targetEditor.settingsPath, { missingAsEmpty: true });
  if (!targetSettings.success) {
    logSettingsSkip(logger, `target settings could not be parsed for ${targetEditor.displayName}.`, targetSettings.error);
    return {};
  }

  let targetItems: EditorExtensionItem[];
  try {
    targetItems = await listEditorExtensions({
      extensionsPath: targetEditor.extensionsPath,
      stateDbPath: targetEditor.stateDbPath,
      includeIcons: false
    });
  } catch (error) {
    logSettingsSkip(logger, `target extension inventory could not be refreshed for ${targetEditor.displayName}.`, String(error));
    return {};
  }

  const { namespaceToExtension } = await resolveNamespacesToExtensions({
    extensionIds: [...successfulExtensionIds],
    extensionsPaths: Array.from(new Set([sourceEditor.extensionsPath, targetEditor.extensionsPath]))
  });

  if (namespaceToExtension.size === 0) {
    logger.line(logger.palette.dim("No extension settings namespaces found for the synced extensions."));
    return {};
  }

  const scopedDiffs = orientSettingsDiffsForSourceTargetSync(
    filterSettingsDiffsByExtensionNamespaces({
      diffs: diffSettings(sourceSettings.settings, targetSettings.settings),
      extensionIds: successfulExtensionIds,
      namespaceToExtension
    })
  );

  if (scopedDiffs.length === 0) {
    logger.line(logger.palette.dim("No extension settings differences found for the synced extensions."));
    return {};
  }

  logger.line();
  logger.line(logger.palette.cyan("Settings values available to sync"));
  logger.table({
    columns: SETTINGS_TABLE_COLUMNS,
    rows: createSettingsDiffRows({
      diffs: scopedDiffs,
      sourceItems,
      targetItems,
      namespaceToExtension
    })
  });

  const confirmSettings = await prompt<{ confirmed?: boolean }>({
    type: "confirm",
    name: "confirmed",
    initial: true,
    message: `Sync these settings values from ${sourceEditor.displayName} to ${targetEditor.displayName}?`
  });

  if (!confirmSettings.confirmed) {
    logger.line("Settings sync skipped.");
    return {};
  }

  const syncResult = syncSettingsValues({
    targetSettingsPath: targetEditor.settingsPath,
    diffs: scopedDiffs
  });

  if (!syncResult.success) {
    logger.error(logger.palette.red(syncResult.error ?? "Failed to sync settings."));
    return { exitCode: 1 };
  }

  logger.settingsSyncApplied({
    appliedCount: syncResult.appliedCount,
    backupPath: syncResult.backupPath
  });

  return {};
}
