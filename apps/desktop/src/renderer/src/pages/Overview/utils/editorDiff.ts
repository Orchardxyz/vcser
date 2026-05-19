import type { ExtensionPresence, ResolvedEditor } from "@/types";

export function hasPairVersionMismatch(row: ExtensionPresence, sourceName: string, targetName: string): boolean {
  const sourceVersion = row.versions[sourceName];
  const targetVersion = row.versions[targetName];
  return sourceVersion != null && targetVersion != null && sourceVersion !== targetVersion;
}

export interface TargetDiffData {
  targetEditor: ResolvedEditor;
  targetName: string;
  missingRows: ExtensionPresence[];
  sharedRows: ExtensionPresence[];
  mismatchRows: ExtensionPresence[];
}

export function computeTargetDataBySlug(
  editors: ResolvedEditor[],
  rows: ExtensionPresence[],
  sourceSlug: string,
  sourceName: string
): Record<string, TargetDiffData> {
  const result: Record<string, TargetDiffData> = {};

  for (const editor of editors) {
    if (editor.slug === sourceSlug) continue;
    const targetName = editor.name;

    const missingRows: ExtensionPresence[] = [];
    const sharedRows: ExtensionPresence[] = [];
    const mismatchRows: ExtensionPresence[] = [];

    for (const row of rows) {
      const inSource = row.presence[sourceName] === true;
      const inTarget = row.presence[targetName] === true;

      if (inSource && !inTarget) {
        missingRows.push(row);
      } else if (inSource && inTarget) {
        sharedRows.push(row);
        if (hasPairVersionMismatch(row, sourceName, targetName)) {
          mismatchRows.push(row);
        }
      }
    }

    result[editor.slug] = { targetEditor: editor, targetName, missingRows, sharedRows, mismatchRows };
  }

  return result;
}
