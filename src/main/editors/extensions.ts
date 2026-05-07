import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { ExtensionDiffResult, ExtensionPresence } from "../../renderer/src/types";
import { mimeTypeForPath } from "./utils";

interface EditorWithExtensions {
  name: string;
  extensionsPath: string;
  stateDbPath?: string;
}

interface DisabledExtensionRow {
  id: string;
  uuid?: string;
}

interface ExtensionManifestEntry {
  identifier: {
    id: string;
  };
}

interface ExtensionPackageJson {
  icon?: string;
}

function isExtensionManifestEntry(value: unknown): value is ExtensionManifestEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const identifier = (value as { identifier?: { id?: unknown } }).identifier;
  return !!identifier && typeof identifier.id === "string";
}

function isExtensionPackageJson(value: unknown): value is ExtensionPackageJson {
  if (!value || typeof value !== "object") {
    return false;
  }

  const icon = (value as { icon?: unknown }).icon;
  return icon === undefined || typeof icon === "string";
}

function isDisabledExtensionRow(value: unknown): value is DisabledExtensionRow {
  return !!value && typeof value === "object" && typeof (value as DisabledExtensionRow).id === "string";
}

function parseDisabledExtensionIds(rawValue: string): Set<string> {
  const parsed: unknown = JSON.parse(rawValue);

  if (!Array.isArray(parsed)) {
    return new Set();
  }

  const ids = new Set<string>();

  for (const item of parsed) {
    if (isDisabledExtensionRow(item)) {
      ids.add(item.id);
    }
  }

  return ids;
}

function readDisabledExtensionIdsFromSqliteCli(stateDbPath: string): Set<string> {
  try {
    const rawValue = execFileSync(
      "sqlite3",
      [
        stateDbPath,
        "SELECT value FROM ItemTable WHERE key = 'extensionsIdentifiers/disabled'",
      ],
      { encoding: "utf8" },
    ).trim();

    if (!rawValue) {
      return new Set();
    }

    return parseDisabledExtensionIds(rawValue);
  } catch {
    return new Set();
  }
}

async function findExtensionDir(
  extensionsPath: string,
  extensionId: string,
): Promise<string | undefined> {
  try {
    const prefix = `${extensionId.toLowerCase()}-`;
    const entries = await readdir(extensionsPath, { withFileTypes: true });
    const match = entries.find(
      (entry) => entry.isDirectory() && entry.name.toLowerCase().startsWith(prefix),
    );

    return match ? join(extensionsPath, match.name) : undefined;
  } catch {
    return undefined;
  }
}

async function getExtensionIconDataUrl(
  extensionsPath: string,
  extensionId: string,
): Promise<string | undefined> {
  try {
    const extensionDir = await findExtensionDir(extensionsPath, extensionId);
    if (!extensionDir) {
      return undefined;
    }

    const manifestRaw = await readFile(join(extensionDir, "package.json"), "utf-8");
    const manifestParsed: unknown = JSON.parse(manifestRaw);

    if (!isExtensionPackageJson(manifestParsed) || !manifestParsed.icon) {
      return undefined;
    }

    const iconPath = resolve(extensionDir, manifestParsed.icon);
    if (iconPath !== extensionDir && !iconPath.startsWith(`${extensionDir}${sep}`)) {
      return undefined;
    }

    const mimeType = mimeTypeForPath(iconPath);
    if (!mimeType) {
      return undefined;
    }

    const iconBuffer = await readFile(iconPath);
    return `data:${mimeType};base64,${iconBuffer.toString("base64")}`;
  } catch {
    return undefined;
  }
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
 * Read disabled extension IDs from a VS Code state.vscdb database.
 * Returns an empty set on any failure — this is best-effort.
 */
function readDisabledExtensionIds(stateDbPath: string): Set<string> {
  return readDisabledExtensionIdsFromSqliteCli(stateDbPath);
}

/**
 * Build an ExtensionDiffResult from a list of editors with their extensions paths.
 */
export async function computeExtensionDiff(
  editors: EditorWithExtensions[],
): Promise<ExtensionDiffResult> {
  const editorNames = editors.map((e) => e.name);
  const editorExtensionsPath = new Map(editors.map((editor) => [editor.name, editor.extensionsPath]));

  const allIds = new Set<string>();
  const byEditor = new Map<string, Set<string>>();
  const disabledByEditor = new Map<string, Set<string>>();

  for (const editor of editors) {
    const ids = new Set(listInstalledExtensions(editor.extensionsPath));
    byEditor.set(editor.name, ids);
    for (const id of ids) allIds.add(id);

    if (editor.stateDbPath) {
      disabledByEditor.set(editor.name, readDisabledExtensionIds(editor.stateDbPath));
    } else {
      disabledByEditor.set(editor.name, new Set());
    }
  }

  const all: ExtensionPresence[] = [];
  const onlyDiffs: ExtensionPresence[] = [];

  for (const extensionId of Array.from(allIds).sort()) {
    const presence: Record<string, boolean> = {};
    const disabled: Record<string, boolean> = {};
    let allTrue = true;

    for (const name of editorNames) {
      const installed = byEditor.get(name)?.has(extensionId) ?? false;
      presence[name] = installed;
      disabled[name] = installed && (disabledByEditor.get(name)?.has(extensionId) ?? false);
      if (!installed) allTrue = false;
    }

    const entry: ExtensionPresence = { extensionId, presence, disabled };
    all.push(entry);
    if (!allTrue) onlyDiffs.push(entry);
  }

  await Promise.allSettled(
    all.map(async (entry) => {
      const installedEditor = editorNames.find((name) => entry.presence[name]);
      if (!installedEditor) {
        return;
      }

      const extensionsPath = editorExtensionsPath.get(installedEditor);
      if (!extensionsPath) {
        return;
      }

      entry.iconDataUrl = await getExtensionIconDataUrl(extensionsPath, entry.extensionId);
    }),
  );

  return { editorNames, all, onlyDiffs };
}
