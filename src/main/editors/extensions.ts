import { readdirSync } from "node:fs";
import type { ExtensionDiffResult, ExtensionPresence } from "../../renderer/src/types";

interface EditorWithExtensions {
  name: string;
  extensionsPath: string;
}

/**
 * Given a directory entry name like "esbenp.prettier-vscode-10.4.0",
 * return the stable extension ID "esbenp.prettier-vscode".
 *
 * Strategy: strip the trailing "-<semver>" segment.
 * A semver segment starts with "-" followed by a digit.
 */
function parseExtensionId(dirName: string): string {
  const match = dirName.match(/^(.+?)-(\d+\.\d+\.\d+.*)$/);
  return match ? match[1] : dirName;
}

/**
 * List all extension IDs installed under a given extensions directory.
 * Returns an empty array if the directory is missing or unreadable.
 */
export function listInstalledExtensions(extensionsPath: string): string[] {
  try {
    return readdirSync(extensionsPath, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => parseExtensionId(d.name))
      .filter((id) => id.includes("."))
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
