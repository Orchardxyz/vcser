import { copyFileSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { applyEdits, modify, parse, printParseErrorCode, type ParseError } from "jsonc-parser";
import type { JsonObject } from "type-fest";
import type { ChangeType, SettingsKeyDiff } from "../shared/types";
import { CHANGE_TYPE } from "../shared/types";

export interface ReadSettingsJsonResult {
  success: boolean;
  exists: boolean;
  settings: JsonObject;
  error?: string;
}

export interface SyncSettingsValuesInput {
  targetSettingsPath: string;
  diffs: readonly SettingsKeyDiff[];
  backup?: boolean;
}

export interface SyncSettingsValuesResult {
  success: boolean;
  appliedCount: number;
  backupPath?: string;
  error?: string;
}

function formatParseErrors(errors: ParseError[]): string {
  return errors.map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`).join("; ");
}

function readSettingsText(settingsPath: string): { exists: boolean; raw?: string; error?: string } {
  try {
    return {
      exists: true,
      raw: readFileSync(settingsPath, "utf-8")
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        exists: false,
        error: message
      };
    }

    return {
      exists: true,
      error: message
    };
  }
}

function parseSettingsText(raw: string, settingsPath: string): ReadSettingsJsonResult {
  if (raw.trim() === "") {
    return {
      success: true,
      exists: true,
      settings: {}
    };
  }

  const errors: ParseError[] = [];
  const parsed: unknown = parse(raw, errors, {
    allowTrailingComma: true,
    disallowComments: false
  });

  if (errors.length > 0) {
    return {
      success: false,
      exists: true,
      settings: {},
      error: `[vcser] Failed to parse settings file: ${settingsPath} (${formatParseErrors(errors)})`
    };
  }

  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return {
      success: true,
      exists: true,
      settings: parsed as JsonObject
    };
  }

  return {
    success: false,
    exists: true,
    settings: {},
    error: `[vcser] Failed to parse settings file: ${settingsPath} (Expected a JSON object at the top level)`
  };
}

export function readSettingsJsonFile(settingsPath: string, options?: { missingAsEmpty?: boolean }): ReadSettingsJsonResult {
  const readResult = readSettingsText(settingsPath);

  if (!readResult.exists) {
    if (options?.missingAsEmpty) {
      return {
        success: true,
        exists: false,
        settings: {}
      };
    }

    return {
      success: false,
      exists: false,
      settings: {},
      error: `[vcser] Failed to parse settings file: ${settingsPath} (${readResult.error ?? "File not found"})`
    };
  }

  if (readResult.error) {
    return {
      success: false,
      exists: true,
      settings: {},
      error: `[vcser] Failed to parse settings file: ${settingsPath} (${readResult.error})`
    };
  }

  return parseSettingsText(readResult.raw ?? "", settingsPath);
}

export function readSettingsJson(settingsPath: string): JsonObject {
  const result = readSettingsJsonFile(settingsPath);

  if (!result.success) {
    console.warn(result.error ?? `[vcser] Failed to parse settings file: ${settingsPath}`);
  }

  return result.settings;
}

function changeType(leftHas: boolean, rightHas: boolean): ChangeType {
  if (!leftHas) return CHANGE_TYPE.ADD;
  if (!rightHas) return CHANGE_TYPE.DELETE;
  return CHANGE_TYPE.UPDATE;
}

export function diffSettings(left: JsonObject, right: JsonObject): SettingsKeyDiff[] {
  const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const diffs: SettingsKeyDiff[] = [];

  for (const key of Array.from(allKeys).sort()) {
    const hasLeft = Object.prototype.hasOwnProperty.call(left, key);
    const hasRight = Object.prototype.hasOwnProperty.call(right, key);

    if (!hasLeft || !hasRight) {
      diffs.push({
        key,
        changeType: changeType(hasLeft, hasRight),
        sourceValue: hasLeft ? left[key] : undefined,
        targetValue: hasRight ? right[key] : undefined
      });
      continue;
    }

    const leftVal = JSON.stringify(left[key]);
    const rightVal = JSON.stringify(right[key]);

    if (leftVal !== rightVal) {
      diffs.push({
        key,
        changeType: CHANGE_TYPE.UPDATE,
        sourceValue: left[key],
        targetValue: right[key]
      });
    }
  }

  return diffs;
}

export function namespaceOf(key: string): string {
  return key.split(".")[0] ?? key;
}

export function filterSettingsDiffsByExtensionNamespaces(params: {
  diffs: readonly SettingsKeyDiff[];
  extensionIds: readonly string[];
  namespaceToExtension: ReadonlyMap<string, string>;
}): SettingsKeyDiff[] {
  const selectedExtensionIds = new Set(params.extensionIds);

  return params.diffs.filter((diff) => {
    const extensionId = params.namespaceToExtension.get(namespaceOf(diff.key));
    return extensionId ? selectedExtensionIds.has(extensionId) : false;
  });
}

export function orientSettingsDiffsForSourceTargetSync(diffs: readonly SettingsKeyDiff[]): SettingsKeyDiff[] {
  return diffs.map((diff) => {
    switch (diff.changeType) {
      case CHANGE_TYPE.ADD:
        return {
          ...diff,
          changeType: CHANGE_TYPE.DELETE
        };
      case CHANGE_TYPE.DELETE:
        return {
          ...diff,
          changeType: CHANGE_TYPE.ADD
        };
      default:
        return { ...diff };
    }
  });
}

function buildBackupPath(targetSettingsPath: string): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
  return `${targetSettingsPath}.bak-${timestamp}`;
}

function applySettingsDiffs(targetText: string, diffs: readonly SettingsKeyDiff[]): string {
  let nextText = targetText.trim() === "" ? "{}" : targetText;

  for (const diff of diffs) {
    const value = diff.changeType === CHANGE_TYPE.DELETE ? undefined : diff.sourceValue;
    const edits = modify(nextText, [diff.key], value, {
      formattingOptions: {
        insertSpaces: true,
        tabSize: 2,
        eol: "\n"
      }
    });
    nextText = applyEdits(nextText, edits);
  }

  return nextText;
}

export function syncSettingsValues(params: SyncSettingsValuesInput): SyncSettingsValuesResult {
  const shouldBackup = params.backup ?? true;
  const targetReadResult = readSettingsJsonFile(params.targetSettingsPath, { missingAsEmpty: true });
  const targetExists = targetReadResult.exists;

  if (!targetReadResult.success) {
    return {
      success: false,
      appliedCount: 0,
      error: targetReadResult.error
    };
  }

  const targetText = targetExists ? readFileSync(params.targetSettingsPath, "utf-8") : "{}";

  let nextText: string;
  try {
    nextText = applySettingsDiffs(targetText, params.diffs);
  } catch (error) {
    return {
      success: false,
      appliedCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }

  let backupPath: string | undefined;
  const tempPath = join(dirname(params.targetSettingsPath), `.vcser-settings-${process.pid}-${Date.now()}.tmp`);

  try {
    mkdirSync(dirname(params.targetSettingsPath), { recursive: true });

    if (targetExists && shouldBackup) {
      backupPath = buildBackupPath(params.targetSettingsPath);
      copyFileSync(params.targetSettingsPath, backupPath);
    }

    writeFileSync(tempPath, nextText, "utf-8");
    renameSync(tempPath, params.targetSettingsPath);

    return {
      success: true,
      appliedCount: params.diffs.length,
      backupPath
    };
  } catch (error) {
    rmSync(tempPath, { force: true });
    return {
      success: false,
      appliedCount: 0,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export interface NamespaceStats {
  diffs: SettingsKeyDiff[];
  identicalCount: number;
  totalCount: number;
}

export function groupSettingsByNamespace(left: JsonObject, right: JsonObject, diffs: SettingsKeyDiff[]): Map<string, NamespaceStats> {
  const allKeys = new Set([...Object.keys(left), ...Object.keys(right)]);
  const diffKeys = new Set(diffs.map((d) => d.key));
  const diffByKey = new Map(diffs.map((d) => [d.key, d]));

  const grouped = new Map<string, NamespaceStats>();

  for (const key of Array.from(allKeys)) {
    const ns = namespaceOf(key);
    if (!grouped.has(ns)) {
      grouped.set(ns, { diffs: [], identicalCount: 0, totalCount: 0 });
    }

    const stats = grouped.get(ns)!;
    stats.totalCount += 1;

    if (diffKeys.has(key)) {
      stats.diffs.push(diffByKey.get(key)!);
    } else {
      stats.identicalCount += 1;
    }
  }

  return grouped;
}
