import type { ResolvedEditor } from "../editors/types";

export interface PreflightResult {
  editor: ResolvedEditor;
  ready: boolean;
  warnings: string[];
}

export function runPreflight(editors: ResolvedEditor[]): PreflightResult[] {
  return editors.map((editor) => {
    const warnings: string[] = [];

    if (!editor.extensionsExist) {
      warnings.push(`Extensions directory not found: ${editor.extensionsPath}`);
    }

    if (!editor.settingsExist) {
      warnings.push(`Settings file not found: ${editor.settingsPath}`);
    }

    if (!editor.cliAvailable) {
      warnings.push(
        `CLI "${editor.cli}" not found on PATH — extension install/uninstall will not work`
      );
    }

    const ready = editor.extensionsExist || editor.settingsExist;

    return { editor, ready, warnings };
  });
}

export function allReady(results: PreflightResult[]): boolean {
  return results.every((r) => r.ready);
}
