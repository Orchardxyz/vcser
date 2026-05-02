import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ExtensionDiffResult, ExtensionPresence } from "../../renderer/src/types";

interface EditorWithExtensions {
  name: string;
  extensionsPath: string;
}

interface ExtensionManifestEntry {
  identifier: {
    id: string;
  };
}

function isExtensionManifestEntry(value: unknown): value is ExtensionManifestEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const identifier = (value as { identifier?: { id?: unknown } }).identifier;
  return !!identifier && typeof identifier.id === "string";
}

/**
 * List all extension IDs installed under a given extensions directory.
 * Returns an empty array if the directory is missing or unreadable.
 */
export function listInstalledExtensions(extensionsPath: string): string[] {
  try {
    const manifestPath = join(extensionsPath, "extensions.json");
    const raw = readFileSync(manifestPath, "utf-8");
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isExtensionManifestEntry)
      .map((entry) => entry.identifier.id)
      .reduce<string[]>((acc, id) => {
        if (!acc.includes(id)) acc.push(id);
        return acc;
      }, []);
  } catch {
    return [];
  }
}

/**
 * Build an ExtensionDiffResult from a list of editors with their extensions paths.
 */
export function computeExtensionDiff(editors: EditorWithExtensions[]): ExtensionDiffResult {
  const editorNames = editors.map((e) => e.name);

  const allIds = new Set<string>();
  const byEditor = new Map<string, Set<string>>();

  for (const editor of editors) {
    const ids = new Set(listInstalledExtensions(editor.extensionsPath));
    byEditor.set(editor.name, ids);
    for (const id of ids) allIds.add(id);
  }

  const all: ExtensionPresence[] = [];
  const onlyDiffs: ExtensionPresence[] = [];

  for (const extensionId of Array.from(allIds).sort()) {
    const presence: Record<string, boolean> = {};
    let allTrue = true;

    for (const name of editorNames) {
      const installed = byEditor.get(name)?.has(extensionId) ?? false;
      presence[name] = installed;
      if (!installed) allTrue = false;
    }

    const entry: ExtensionPresence = { extensionId, presence };
    all.push(entry);
    if (!allTrue) onlyDiffs.push(entry);
  }

  return { editorNames, all, onlyDiffs };
}
