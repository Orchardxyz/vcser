import { basename } from "node:path";
import { listEditorExtensions, syncExtensionLocal } from "@vcser/core/editors/extensions";
import { RUNTIME_MESSAGE_KEY } from "@vcser/core/i18n";
import type { EditorExtensionItem, SyncResult } from "@vcser/core/types";
import ora from "ora";
import type { CliI18n } from "../locales/i18n";
import type { CliLogger } from "../logger";
import { canRunCommand, resolveCliEditors, type CliEditor } from "../editor/resolution";
import { createPromptRunner } from "../prompt";
import { maybeSyncSettings } from "./settings";

interface SyncCandidate {
  extensionId: string;
  sourceVersion: string | null;
  sourceDisabled: boolean;
  targetVersion: string | null;
  targetDisabled: boolean;
  status: "missing" | "version-mismatch";
}

type CandidateViewMode = "missing" | "version-mismatch" | "all";

function formatVersion(version: string | null): string {
  return version ?? "unknown";
}

function formatEditorDescription(editor: CliEditor, i18n: CliI18n): string {
  const parts = [basename(editor.extensionsPath)];

  if (!editor.cliAvailable) {
    parts.push(i18n.t("wizard.editorDescription.cliUnavailable"));
  }

  return parts.join(" | ");
}

function buildSyncCandidates(sourceItems: EditorExtensionItem[], targetItems: EditorExtensionItem[]): SyncCandidate[] {
  const targetById = new Map(targetItems.map((item) => [item.extensionId, item]));
  const candidates: SyncCandidate[] = [];

  for (const sourceItem of sourceItems) {
    const targetItem = targetById.get(sourceItem.extensionId);

    if (!targetItem) {
      candidates.push({
        extensionId: sourceItem.extensionId,
        sourceVersion: sourceItem.version,
        sourceDisabled: sourceItem.disabled,
        targetVersion: null,
        targetDisabled: false,
        status: "missing"
      });
      continue;
    }

    if (sourceItem.version !== targetItem.version) {
      candidates.push({
        extensionId: sourceItem.extensionId,
        sourceVersion: sourceItem.version,
        sourceDisabled: sourceItem.disabled,
        targetVersion: targetItem.version,
        targetDisabled: targetItem.disabled,
        status: "version-mismatch"
      });
    }
  }

  return candidates;
}

function formatCandidateDescription(candidate: SyncCandidate, i18n: CliI18n): string {
  const parts = [
    candidate.status === "missing" ? i18n.t("wizard.candidateStatus.missingOnTarget") : i18n.t("wizard.candidateStatus.versionMismatch")
  ];
  parts.push(i18n.t("wizard.candidateStatus.sourceVersion", { version: formatVersion(candidate.sourceVersion) }));
  parts.push(
    candidate.targetVersion
      ? i18n.t("wizard.candidateStatus.targetVersion", { version: candidate.targetVersion })
      : i18n.t("wizard.candidateStatus.targetNotInstalled")
  );

  if (candidate.sourceDisabled) {
    parts.push(i18n.t("wizard.candidateStatus.sourceDisabled"));
  }

  if (candidate.targetDisabled) {
    parts.push(i18n.t("wizard.candidateStatus.targetDisabled"));
  }

  return parts.join(" | ");
}

function filterCandidatesByMode(candidates: SyncCandidate[], mode: CandidateViewMode): SyncCandidate[] {
  if (mode === "all") {
    return candidates;
  }

  return candidates.filter((candidate) => candidate.status === mode);
}

function formatCandidateModeLabel(mode: CandidateViewMode, i18n: CliI18n): string {
  switch (mode) {
    case "missing":
      return i18n.t("wizard.mode.missing");
    case "version-mismatch":
      return i18n.t("wizard.mode.versionMismatch");
    default:
      return i18n.t("wizard.mode.all");
  }
}

function formatSyncFailure(result: SyncResult, i18n: CliI18n): string {
  switch (result.errorKey) {
    case RUNTIME_MESSAGE_KEY.EXTENSION_NOT_FOUND_IN_SOURCE:
      return i18n.t("wizard.syncFailure.extensionNotFoundInSource");
    case RUNTIME_MESSAGE_KEY.SOURCE_OR_TARGET_EDITOR_UNAVAILABLE:
      return i18n.t("wizard.syncFailure.sourceOrTargetEditorUnavailable");
    case RUNTIME_MESSAGE_KEY.MISSING_EXTENSION_ID_OR_SOURCE_EDITOR:
      return i18n.t("wizard.syncFailure.missingExtensionIdOrSourceEditor");
    case RUNTIME_MESSAGE_KEY.UNSUPPORTED_SYNC_ACTION:
      return i18n.t("wizard.syncFailure.unsupportedSyncAction");
    case RUNTIME_MESSAGE_KEY.MISSING_SYNC_RESULT:
      return i18n.t("wizard.syncFailure.missingSyncResult");
    default:
      return result.error ?? i18n.t("wizard.syncFailure.unknown");
  }
}

export async function runWizard(logger: CliLogger, i18n: CliI18n): Promise<number> {
  const prompt = createPromptRunner();

  logger.banner();

  const detectionSpinner = ora({
    text: i18n.t("wizard.detectingEditors"),
    color: "magenta",
    isEnabled: process.stderr.isTTY
  }).start();

  const resolvedEditors = await resolveCliEditors(logger);
  const eligibleEditors = resolvedEditors.filter((editor) => editor.extensionsExist);

  detectionSpinner.stop();

  if (eligibleEditors.length < 2) {
    logger.error(logger.palette.red(i18n.t("wizard.requiresAtLeastTwoEditors")));
    return 1;
  }

  const sqliteAvailable = await canRunCommand("sqlite3");
  if (!sqliteAvailable) {
    logger.line(logger.palette.dim(i18n.t("wizard.sqliteUnavailable")));
    logger.line();
  }

  const sourceAnswer = await prompt<{ sourceSlug?: string }>({
    type: "select",
    name: "sourceSlug",
    message: i18n.t("wizard.selectSourceEditor"),
    choices: eligibleEditors.map((editor) => ({
      title: editor.displayName,
      value: editor.slug,
      description: formatEditorDescription(editor, i18n)
    }))
  });

  const sourceEditor = eligibleEditors.find((editor) => editor.slug === sourceAnswer.sourceSlug);
  if (!sourceEditor) {
    logger.error(logger.palette.red(i18n.t("wizard.sourceEditorRequired")));
    return 1;
  }

  const targetOptions = eligibleEditors.filter((editor) => editor.slug !== sourceEditor.slug);
  if (targetOptions.length === 0) {
    logger.error(logger.palette.red(i18n.t("wizard.secondEditorRequired")));
    return 1;
  }

  const targetAnswer = await prompt<{ targetSlug?: string }>({
    type: "select",
    name: "targetSlug",
    message: i18n.t("wizard.selectTargetEditor"),
    choices: targetOptions.map((editor) => ({
      title: editor.displayName,
      value: editor.slug,
      description: formatEditorDescription(editor, i18n)
    }))
  });

  const targetEditor = targetOptions.find((editor) => editor.slug === targetAnswer.targetSlug);
  if (!targetEditor) {
    logger.error(logger.palette.red(i18n.t("wizard.targetEditorRequired")));
    return 1;
  }

  if (!targetEditor.cliAvailable) {
    logger.line(
      logger.palette.dim(
        i18n.t("wizard.targetCliUnavailable", {
          target: targetEditor.displayName
        })
      )
    );
    logger.line();
  }

  const inventorySpinner = ora({
    text: i18n.t("wizard.readingExtensions", {
      source: sourceEditor.displayName,
      target: targetEditor.displayName
    }),
    color: "magenta",
    isEnabled: process.stderr.isTTY
  }).start();

  const [sourceItems, targetItems] = await Promise.all([
    listEditorExtensions({
      extensionsPath: sourceEditor.extensionsPath,
      stateDbPath: sourceEditor.stateDbPath,
      includeIcons: false
    }),
    listEditorExtensions({
      extensionsPath: targetEditor.extensionsPath,
      stateDbPath: targetEditor.stateDbPath,
      includeIcons: false
    })
  ]);

  inventorySpinner.stop();

  if (sourceItems.length === 0) {
    logger.line(
      logger.palette.yellow(
        i18n.t("wizard.sourceHasNoExtensions", {
          source: sourceEditor.displayName
        })
      )
    );
    return 0;
  }

  const candidates = buildSyncCandidates(sourceItems, targetItems);
  const missingCount = candidates.filter((candidate) => candidate.status === "missing").length;

  logger.inventorySummary({
    sourceLabel: sourceEditor.displayName,
    sourceCount: sourceItems.length,
    targetLabel: targetEditor.displayName,
    targetCount: targetItems.length,
    candidateCount: candidates.length,
    missingCount,
    mismatchCount: candidates.length - missingCount
  });

  if (candidates.length === 0) {
    logger.line(logger.palette.green(i18n.t("wizard.sourceAndTargetAlreadyAligned")));
    return 0;
  }

  const mismatchCount = candidates.length - missingCount;
  let visibleCandidates: SyncCandidate[] = [];
  let selectedMode: CandidateViewMode = "missing";

  while (visibleCandidates.length === 0) {
    const modeAnswer = await prompt<{ viewMode?: CandidateViewMode }>({
      type: "select",
      name: "viewMode",
      message: i18n.t("wizard.chooseExtensionsToReview"),
      initial: 0,
      choices: [
        {
          title: i18n.t("wizard.modeChoice.missingTitle", { count: missingCount }),
          value: "missing",
          description: i18n.t("wizard.modeChoice.missingDescription")
        },
        {
          title: i18n.t("wizard.modeChoice.versionMismatchTitle", {
            count: mismatchCount
          }),
          value: "version-mismatch",
          description: i18n.t("wizard.modeChoice.versionMismatchDescription")
        },
        {
          title: i18n.t("wizard.modeChoice.allTitle", {
            count: candidates.length
          }),
          value: "all",
          description: i18n.t("wizard.modeChoice.allDescription")
        }
      ]
    });

    selectedMode = modeAnswer.viewMode ?? "missing";
    visibleCandidates = filterCandidatesByMode(candidates, selectedMode);

    if (visibleCandidates.length === 0) {
      logger.line(
        logger.palette.yellow(
          i18n.t("wizard.noModeCandidates", {
            mode: formatCandidateModeLabel(selectedMode, i18n)
          })
        )
      );
      logger.line();
    }
  }

  const candidateAnswer = await prompt<{ extensionIds?: string[] }>({
    type: "multiselect",
    name: "extensionIds",
    message: i18n.t("wizard.selectExtensionsToSync", {
      mode: formatCandidateModeLabel(selectedMode, i18n)
    }),
    instructions: false,
    choices: visibleCandidates.map((candidate) => ({
      title: candidate.extensionId,
      value: candidate.extensionId,
      selected: false,
      description: formatCandidateDescription(candidate, i18n)
    }))
  });

  const selectedIds = candidateAnswer.extensionIds ?? [];
  if (selectedIds.length === 0) {
    logger.line(logger.palette.yellow(i18n.t("wizard.noExtensionsSelected")));
    return 0;
  }

  const confirmAnswer = await prompt<{ confirmed?: boolean }>({
    type: "confirm",
    name: "confirmed",
    initial: true,
    message: i18n.t("wizard.confirmSync", {
      count: selectedIds.length,
      source: sourceEditor.displayName,
      target: targetEditor.displayName
    })
  });

  if (!confirmAnswer.confirmed) {
    logger.line(logger.palette.yellow(i18n.t("common.cancelled")));
    return 0;
  }

  const selectedCandidates = visibleCandidates.filter((candidate) => selectedIds.includes(candidate.extensionId));
  const syncSpinner = ora({
    text: i18n.t("wizard.syncingProgress", {
      current: 1,
      total: selectedCandidates.length
    }),
    color: "magenta",
    isEnabled: process.stderr.isTTY
  }).start();

  const results: SyncResult[] = [];

  for (const [index, candidate] of selectedCandidates.entries()) {
    syncSpinner.text = i18n.t("wizard.syncingExtensionProgress", {
      current: index + 1,
      total: selectedCandidates.length,
      extensionId: candidate.extensionId
    });

    const result = await syncExtensionLocal({
      extensionId: candidate.extensionId,
      sourceEditorName: sourceEditor.displayName,
      sourceExtensionsPath: sourceEditor.extensionsPath,
      targetExtensionsPath: targetEditor.extensionsPath,
      targetEditorName: targetEditor.displayName,
      targetCli: targetEditor.cli,
      targetCliAvailable: targetEditor.cliAvailable
    });

    results.push(result);

    if (!result.success) {
      logger.debug(`${candidate.extensionId}: ${JSON.stringify(result)}`);
    }
  }

  syncSpinner.stop();

  const succeeded = results.filter((result) => result.success).length;
  const failed = results.length - succeeded;

  logger.syncSummary({
    selectedCount: results.length,
    succeededCount: succeeded,
    failedCount: failed,
    failures: results
      .filter((result) => !result.success)
      .map((result) => ({
        extensionId: result.extensionId ?? "unknown",
        message: formatSyncFailure(result, i18n)
      }))
  });

  const successfulExtensionIds = selectedCandidates.filter((_candidate, index) => results[index]?.success).map((candidate) => candidate.extensionId);

  const settingsResult = await maybeSyncSettings({
    i18n,
    logger,
    prompt,
    sourceEditor,
    targetEditor,
    sourceItems,
    successfulExtensionIds
  });

  if (settingsResult.exitCode !== undefined) {
    return settingsResult.exitCode;
  }

  return failed > 0 ? 1 : 0;
}
