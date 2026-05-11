import { readFileSync } from "node:fs";
import { parse, printParseErrorCode, type ParseError } from "jsonc-parser";
import type { JsonObject } from "type-fest";
import type { ChangeType, SettingsKeyDiff } from "../../renderer/src/types";
import { CHANGE_TYPE } from "../../renderer/src/types";

function formatParseErrors(errors: ParseError[]): string {
  return errors.map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`).join("; ");
}

export function readSettingsJson(settingsPath: string): JsonObject {
  try {
    const raw = readFileSync(settingsPath, "utf-8");
    const errors: ParseError[] = [];
    const parsed: unknown = parse(raw, errors, {
      allowTrailingComma: true,
      disallowComments: false
    });

    if (errors.length > 0) {
      console.warn(`[vcser] Failed to parse settings file: ${settingsPath} (${formatParseErrors(errors)})`);
      return {};
    }

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as JsonObject;
    }
    return {};
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[vcser] Failed to parse settings file: ${settingsPath} (${message})`);
    return {};
  }
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
