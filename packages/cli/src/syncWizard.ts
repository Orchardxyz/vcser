import { basename } from "node:path";
import { listEditorExtensions, syncExtensionLocal } from "@vcser/core/editors/extensions";
import { RUNTIME_MESSAGE_KEY } from "@vcser/core/i18n";
import type { EditorExtensionItem, SyncResult } from "@vcser/core/types";
import ora from "ora";
import type { CliLogger } from "./logger";
import { canRunCommand, resolveCliEditors, type CliEditor } from "./editorResolution";
import { createPromptRunner } from "./prompt";

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

function formatEditorDescription(editor: CliEditor): string {
  const parts = [basename(editor.extensionsPath)];

  if (!editor.cliAvailable) {
    parts.push("CLI unavailable, filesystem fallback only");
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

function formatCandidateDescription(candidate: SyncCandidate): string {
  const parts = [candidate.status === "missing" ? "missing on target" : "version mismatch"];
  parts.push(`source ${formatVersion(candidate.sourceVersion)}`);
  parts.push(candidate.targetVersion ? `target ${candidate.targetVersion}` : "target not installed");

  if (candidate.sourceDisabled) {
    parts.push("source disabled");
  }

  if (candidate.targetDisabled) {
    parts.push("target disabled");
  }

  return parts.join(" | ");
}

function filterCandidatesByMode(candidates: SyncCandidate[], mode: CandidateViewMode): SyncCandidate[] {
  if (mode === "all") {
    return candidates;
  }

  return candidates.filter((candidate) => candidate.status === mode);
}

function formatCandidateModeLabel(mode: CandidateViewMode): string {
  switch (mode) {
    case "missing":
      return "missing";
    case "version-mismatch":
      return "version mismatch";
    default:
      return "all";
  }
}

function formatSyncFailure(result: SyncResult): string {
  switch (result.errorKey) {
    case RUNTIME_MESSAGE_KEY.EXTENSION_NOT_FOUND_IN_SOURCE:
      return "Extension was not found in the source editor.";
    case RUNTIME_MESSAGE_KEY.SOURCE_OR_TARGET_EDITOR_UNAVAILABLE:
      return "Source or target editor is no longer available.";
    case RUNTIME_MESSAGE_KEY.MISSING_EXTENSION_ID_OR_SOURCE_EDITOR:
      return "Missing extension or source editor information.";
    case RUNTIME_MESSAGE_KEY.UNSUPPORTED_SYNC_ACTION:
      return "Unsupported sync action.";
    case RUNTIME_MESSAGE_KEY.MISSING_SYNC_RESULT:
      return "Sync did not return a result.";
    default:
      return result.error ?? "Unknown sync error.";
  }
}

export async function runWizard(logger: CliLogger): Promise<number> {
  const prompt = createPromptRunner();

  logger.banner();

  const detectionSpinner = ora({
    text: "Detecting editors",
    color: "magenta",
    isEnabled: process.stderr.isTTY
  }).start();

  const resolvedEditors = await resolveCliEditors(logger);
  const eligibleEditors = resolvedEditors.filter((editor) => editor.extensionsExist);

  detectionSpinner.stop();

  if (eligibleEditors.length < 2) {
    logger.error(logger.palette.red("At least two detected editors with readable extensions directories are required."));
    return 1;
  }

  const sqliteAvailable = await canRunCommand("sqlite3");
  if (!sqliteAvailable) {
    logger.line(logger.palette.dim("Disabled extension state may be incomplete because sqlite3 is not available."));
    logger.line();
  }

  const sourceAnswer = await prompt<{ sourceSlug?: string }>({
    type: "select",
    name: "sourceSlug",
    message: "Select source editor",
    choices: eligibleEditors.map((editor) => ({
      title: editor.displayName,
      value: editor.slug,
      description: formatEditorDescription(editor)
    }))
  });

  const sourceEditor = eligibleEditors.find((editor) => editor.slug === sourceAnswer.sourceSlug);
  if (!sourceEditor) {
    logger.error(logger.palette.red("A source editor must be selected."));
    return 1;
  }

  const targetOptions = eligibleEditors.filter((editor) => editor.slug !== sourceEditor.slug);
  if (targetOptions.length === 0) {
    logger.error(logger.palette.red("A second editor is required as the sync target."));
    return 1;
  }

  const targetAnswer = await prompt<{ targetSlug?: string }>({
    type: "select",
    name: "targetSlug",
    message: "Select target editor",
    choices: targetOptions.map((editor) => ({
      title: editor.displayName,
      value: editor.slug,
      description: formatEditorDescription(editor)
    }))
  });

  const targetEditor = targetOptions.find((editor) => editor.slug === targetAnswer.targetSlug);
  if (!targetEditor) {
    logger.error(logger.palette.red("A target editor must be selected."));
    return 1;
  }

  if (!targetEditor.cliAvailable) {
    logger.line(logger.palette.dim(`Target CLI is unavailable for ${targetEditor.displayName}; sync will use filesystem fallback when needed.`));
    logger.line();
  }

  const inventorySpinner = ora({
    text: `Reading extensions from ${sourceEditor.displayName} and ${targetEditor.displayName}`,
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
    logger.line(logger.palette.yellow(`${sourceEditor.displayName} has no local extensions to sync.`));
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
    logger.line(logger.palette.green("Source and target are already aligned for local extensions."));
    return 0;
  }

  const mismatchCount = candidates.length - missingCount;
  let visibleCandidates: SyncCandidate[] = [];
  let selectedMode: CandidateViewMode = "missing";

  while (visibleCandidates.length === 0) {
    const modeAnswer = await prompt<{ viewMode?: CandidateViewMode }>({
      type: "select",
      name: "viewMode",
      message: "Choose extensions to review",
      initial: 0,
      choices: [
        {
          title: `Missing (${missingCount})`,
          value: "missing",
          description: "Installed in source but not in target"
        },
        {
          title: `Version mismatch (${mismatchCount})`,
          value: "version-mismatch",
          description: "Installed in both editors with different versions"
        },
        {
          title: `All (${candidates.length})`,
          value: "all",
          description: "Show both missing and version-mismatch extensions"
        }
      ]
    });

    selectedMode = modeAnswer.viewMode ?? "missing";
    visibleCandidates = filterCandidatesByMode(candidates, selectedMode);

    if (visibleCandidates.length === 0) {
      logger.line(logger.palette.yellow(`No ${formatCandidateModeLabel(selectedMode)} candidates are available.`));
      logger.line();
    }
  }

  const candidateAnswer = await prompt<{ extensionIds?: string[] }>({
    type: "multiselect",
    name: "extensionIds",
    message: `Select ${formatCandidateModeLabel(selectedMode)} extensions to sync`,
    instructions: false,
    choices: visibleCandidates.map((candidate) => ({
      title: candidate.extensionId,
      value: candidate.extensionId,
      selected: false,
      description: formatCandidateDescription(candidate)
    }))
  });

  const selectedIds = candidateAnswer.extensionIds ?? [];
  if (selectedIds.length === 0) {
    logger.line(logger.palette.yellow("No extensions selected."));
    return 0;
  }

  const confirmAnswer = await prompt<{ confirmed?: boolean }>({
    type: "confirm",
    name: "confirmed",
    initial: true,
    message: `Sync ${selectedIds.length} extension${selectedIds.length === 1 ? "" : "s"} from ${sourceEditor.displayName} to ${targetEditor.displayName}?`
  });

  if (!confirmAnswer.confirmed) {
    logger.line(logger.palette.yellow("Cancelled."));
    return 0;
  }

  const selectedCandidates = visibleCandidates.filter((candidate) => selectedIds.includes(candidate.extensionId));
  const syncSpinner = ora({
    text: `Syncing 1/${selectedCandidates.length}`,
    color: "magenta",
    isEnabled: process.stderr.isTTY
  }).start();

  const results: SyncResult[] = [];

  for (const [index, candidate] of selectedCandidates.entries()) {
    syncSpinner.text = `Syncing ${index + 1}/${selectedCandidates.length}: ${candidate.extensionId}`;

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
        message: formatSyncFailure(result)
      }))
  });

  return failed > 0 ? 1 : 0;
}
