import type { EditorExtensions } from "./reader.js";

export interface ExtensionPresence {
  extensionId: string;
  presence: Map<string, boolean>;
}

export interface ExtensionDiffResult {
  editorNames: string[];
  all: ExtensionPresence[];
  onlyDiffs: ExtensionPresence[];
}

export function computeExtensionDiff(
  editorExtensions: EditorExtensions[]
): ExtensionDiffResult {
  const editorNames = editorExtensions.map((e) => e.editor.name);

  const allIds = new Set<string>();
  const editorSets = new Map<string, Set<string>>();

  for (const { editor, extensions } of editorExtensions) {
    const ids = new Set(extensions.map((e) => e.id));
    editorSets.set(editor.name, ids);
    for (const id of ids) allIds.add(id);
  }

  const sortedIds = [...allIds].sort();

  const all: ExtensionPresence[] = sortedIds.map((extensionId) => {
    const presence = new Map<string, boolean>();
    for (const name of editorNames) {
      presence.set(name, editorSets.get(name)?.has(extensionId) ?? false);
    }
    return { extensionId, presence };
  });

  const onlyDiffs = all.filter((entry) => {
    const values = [...entry.presence.values()];
    return !(values.every(Boolean) || values.every((v) => !v));
  });

  return { editorNames, all, onlyDiffs };
}
