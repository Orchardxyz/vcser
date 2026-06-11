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
import type { CliI18n } from "../locales/i18n";
import type { CliLogger, CliTableColumn } from "../logger";
import type { CliEditor } from "../editor/resolution";
import type { PromptRunner } from "../prompt";

function createSettingsTableColumns(i18n: CliI18n): readonly CliTableColumn[] {
  return [
    { key: "sourceExtension", label: i18n.t("settings.column.sourceExtension"), maxWidth: 28 },
    { key: "targetExtension", label: i18n.t("settings.column.targetExtension"), maxWidth: 28 },
    { key: "namespace", label: i18n.t("settings.column.namespace"), maxWidth: 16 },
    { key: "key", label: i18n.t("settings.column.key"), maxWidth: 36 },
    { key: "change", label: i18n.t("settings.column.change"), maxWidth: 8 },
    { key: "sourceValue", label: i18n.t("settings.column.sourceValue"), maxWidth: 24 },
    { key: "targetValue", label: i18n.t("settings.column.targetValue"), maxWidth: 24 }
  ] as const satisfies readonly CliTableColumn[];
}

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

function formatTargetExtensionLabel(extensionId: string, item: EditorExtensionItem | undefined, i18n: CliI18n): string {
  if (!item) {
    return i18n.t("settings.targetNotInstalled");
  }

  return `${extensionId}@${formatVersion(item.version)}`;
}

function createSettingsDiffRows(params: {
  diffs: readonly SettingsKeyDiff[];
  sourceItems: readonly EditorExtensionItem[];
  targetItems: readonly EditorExtensionItem[];
  i18n: CliI18n;
  namespaceToExtension: ReadonlyMap<string, string>;
}): Record<string, string>[] {
  const sourceById = new Map(params.sourceItems.map((item) => [item.extensionId, item]));
  const targetById = new Map(params.targetItems.map((item) => [item.extensionId, item]));

  return params.diffs.map((diff) => {
    const extensionId = params.namespaceToExtension.get(namespaceOf(diff.key)) ?? "unknown";

    return {
      sourceExtension: formatSourceExtensionLabel(extensionId, sourceById.get(extensionId)),
      targetExtension: formatTargetExtensionLabel(extensionId, targetById.get(extensionId), params.i18n),
      namespace: namespaceOf(diff.key),
      key: diff.key,
      change: diff.changeType,
      sourceValue: stableStringify(diff.sourceValue),
      targetValue: stableStringify(diff.targetValue)
    };
  });
}

function logSettingsSkip(logger: CliLogger, i18n: CliI18n, message: string, details?: string): void {
  logger.line(
    logger.palette.yellow(
      i18n.t("settings.skipPrefix", {
        message
      })
    )
  );

  if (details) {
    logger.debug(details);
  }
}

export async function maybeSyncSettings(params: {
  i18n: CliI18n;
  logger: CliLogger;
  prompt: PromptRunner;
  sourceEditor: CliEditor;
  targetEditor: CliEditor;
  sourceItems: readonly EditorExtensionItem[];
  successfulExtensionIds: readonly string[];
}): Promise<{ exitCode?: number }> {
  const { i18n, logger, prompt, sourceEditor, targetEditor, sourceItems, successfulExtensionIds } = params;

  if (successfulExtensionIds.length === 0) {
    return {};
  }

  if (!sourceEditor.settingsPath || !targetEditor.settingsPath) {
    logSettingsSkip(logger, i18n, i18n.t("settings.skip.missingPath"));
    return {};
  }

  const sourceSettings = readSettingsJsonFile(sourceEditor.settingsPath);
  if (!sourceSettings.success) {
    logSettingsSkip(
      logger,
      i18n,
      i18n.t("settings.skip.sourceUnavailable", {
        source: sourceEditor.displayName
      }),
      sourceSettings.error
    );
    return {};
  }

  const targetSettings = readSettingsJsonFile(targetEditor.settingsPath, { missingAsEmpty: true });
  if (!targetSettings.success) {
    logSettingsSkip(
      logger,
      i18n,
      i18n.t("settings.skip.targetParseFailed", {
        target: targetEditor.displayName
      }),
      targetSettings.error
    );
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
    logSettingsSkip(
      logger,
      i18n,
      i18n.t("settings.skip.targetRefreshFailed", {
        target: targetEditor.displayName
      }),
      String(error)
    );
    return {};
  }

  const { namespaceToExtension } = await resolveNamespacesToExtensions({
    extensionIds: [...successfulExtensionIds],
    extensionsPaths: Array.from(new Set([sourceEditor.extensionsPath, targetEditor.extensionsPath]))
  });

  if (namespaceToExtension.size === 0) {
    logger.line(logger.palette.dim(i18n.t("settings.noNamespaces")));
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
    logger.line(logger.palette.dim(i18n.t("settings.noDifferences")));
    return {};
  }

  logger.line();
  logger.line(logger.palette.cyan(i18n.t("settings.availableToSync")));
  logger.table({
    columns: createSettingsTableColumns(i18n),
    rows: createSettingsDiffRows({
      diffs: scopedDiffs,
      i18n,
      sourceItems,
      targetItems,
      namespaceToExtension
    })
  });

  const confirmSettings = await prompt<{ confirmed?: boolean }>({
    type: "confirm",
    name: "confirmed",
    initial: true,
    message: i18n.t("settings.confirmSync", {
      source: sourceEditor.displayName,
      target: targetEditor.displayName
    })
  });

  if (!confirmSettings.confirmed) {
    logger.line(i18n.t("settings.syncSkipped"));
    return {};
  }

  const syncResult = syncSettingsValues({
    targetSettingsPath: targetEditor.settingsPath,
    diffs: scopedDiffs
  });

  if (!syncResult.success) {
    logger.error(logger.palette.red(syncResult.error ?? i18n.t("settings.syncFailed")));
    return { exitCode: 1 };
  }

  logger.settingsSyncApplied({
    appliedCount: syncResult.appliedCount,
    backupPath: syncResult.backupPath
  });

  return {};
}
