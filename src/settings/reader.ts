import { readFileSync } from "node:fs";
import type { ResolvedEditor } from "../editors/types.js";

export interface EditorSettings {
  editor: ResolvedEditor;
  settings: Record<string, unknown>;
  raw: string;
}

export function readSettings(editor: ResolvedEditor): EditorSettings {
  if (!editor.settingsExist) {
    return { editor, settings: {}, raw: "{}" };
  }

  try {
    const raw = readFileSync(editor.settingsPath, "utf-8");
    const settings = JSON.parse(raw) as Record<string, unknown>;
    return { editor, settings, raw };
  } catch {
    return { editor, settings: {}, raw: "{}" };
  }
}

export function readAllSettings(
  editors: ResolvedEditor[]
): EditorSettings[] {
  return editors.map(readSettings);
}
