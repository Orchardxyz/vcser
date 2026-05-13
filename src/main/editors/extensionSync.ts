import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { cp, readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { promisify } from "node:util";
import type { Schema } from "type-fest";
import type { SyncResult } from "@shared/types";
import { findExtensionDir } from "./extensionFs";

const execFilePromise = promisify(execFile);

interface IExtensionIdentifier {
  id: string;
}

interface ExtensionManifestEntry {
  identifier: IExtensionIdentifier;
  version?: string;
  relativeLocation?: string;
}

type JsonObject = Record<string, unknown>;

function isExtensionManifestEntry(value: unknown): value is ExtensionManifestEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as {
    identifier?: Schema<IExtensionIdentifier, unknown>;
    version?: unknown;
    relativeLocation?: unknown;
  };
  const identifier = entry.identifier;

  return (
    !!identifier &&
    typeof identifier.id === "string" &&
    (entry.version === undefined || typeof entry.version === "string") &&
    (entry.relativeLocation === undefined || typeof entry.relativeLocation === "string")
  );
}

function isJsonObject(value: unknown): value is JsonObject {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function createInstallSyncResult(params: {
  extensionId: string;
  sourceEditorName?: string;
  targetEditorName: string;
  success: boolean;
  error?: string;
}): SyncResult {
  const { extensionId, sourceEditorName, targetEditorName, success, error } = params;

  return {
    action: "install",
    editor: targetEditorName,
    extensionId,
    sourceEditor: sourceEditorName,
    targetEditor: targetEditorName,
    success,
    error
  };
}

function readExtensionManifestEntries(extensionsPath: string): unknown[] {
  try {
    const manifestPath = join(extensionsPath, "extensions.json");
    const parsed: unknown = JSON.parse(readFileSync(manifestPath, "utf-8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function findExtensionManifestEntry(extensionsPath: string, extensionId: string): JsonObject | undefined {
  return readExtensionManifestEntries(extensionsPath).find(
    (entry): entry is JsonObject => isJsonObject(entry) && isExtensionManifestEntry(entry) && entry.identifier.id === extensionId
  );
}

function cloneJsonObject<T extends JsonObject>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolveManifestDirName(entry: JsonObject | undefined, fallbackDirName?: string): string | undefined {
  if (entry && typeof entry.relativeLocation === "string" && entry.relativeLocation.length > 0) {
    return entry.relativeLocation;
  }

  if (entry && isJsonObject(entry.location) && typeof entry.location.path === "string" && entry.location.path.length > 0) {
    return basename(entry.location.path);
  }

  return fallbackDirName;
}

function buildPatchedManifestEntry(params: {
  extensionId: string;
  version?: string;
  dirName: string;
  targetExtensionsPath: string;
  sourceEntry?: JsonObject;
  existingEntry?: JsonObject;
}): JsonObject {
  const { extensionId, version, dirName, targetExtensionsPath, sourceEntry, existingEntry } = params;
  const baseEntry = sourceEntry ?? existingEntry;
  const clonedBaseEntry = baseEntry ? cloneJsonObject(baseEntry) : {};
  const identifier = isJsonObject(clonedBaseEntry.identifier) ? { ...clonedBaseEntry.identifier } : {};
  const metadata = isJsonObject(clonedBaseEntry.metadata) ? { ...clonedBaseEntry.metadata } : {};
  const location = isJsonObject(clonedBaseEntry.location) ? { ...clonedBaseEntry.location } : {};
  const manifestUuid = typeof identifier.uuid === "string" ? identifier.uuid : typeof metadata.id === "string" ? metadata.id : randomUUID();

  return {
    ...clonedBaseEntry,
    identifier: {
      ...identifier,
      id: extensionId,
      uuid: manifestUuid
    },
    ...((version ?? (typeof clonedBaseEntry.version === "string" && clonedBaseEntry.version)) ? { version: version ?? clonedBaseEntry.version } : {}),
    location: {
      ...location,
      $mid: 1,
      path: join(targetExtensionsPath, dirName),
      scheme: "file"
    },
    relativeLocation: dirName,
    metadata: {
      ...metadata,
      id: typeof metadata.id === "string" ? metadata.id : manifestUuid,
      ...(typeof metadata.installedTimestamp === "number" ? {} : { installedTimestamp: Date.now() })
    }
  };
}

async function readExtensionVersion(sourceExtensionDir: string): Promise<string | undefined> {
  try {
    const pkgRaw = await readFile(join(sourceExtensionDir, "package.json"), "utf-8");
    const pkg: unknown = JSON.parse(pkgRaw);
    if (pkg && typeof pkg === "object" && "version" in pkg && typeof (pkg as { version: unknown }).version === "string") {
      return (pkg as { version: string }).version;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export async function syncExtensionLocal(params: {
  extensionId: string;
  sourceEditorName?: string;
  sourceExtensionsPath: string;
  targetExtensionsPath: string;
  targetEditorName: string;
  targetCli: string | undefined;
  targetCliAvailable: boolean;
}): Promise<SyncResult> {
  const { extensionId, sourceEditorName, sourceExtensionsPath, targetExtensionsPath, targetEditorName, targetCli, targetCliAvailable } = params;

  const sourceExtensionDir = await findExtensionDir(sourceExtensionsPath, extensionId);
  if (!sourceExtensionDir) {
    return createInstallSyncResult({
      extensionId,
      sourceEditorName,
      targetEditorName,
      success: false,
      error: `Extension ${extensionId} not found in source`
    });
  }

  if (targetCliAvailable && targetCli) {
    try {
      await execFilePromise(targetCli, ["--install-extension", sourceExtensionDir], { timeout: 30000 });
      return createInstallSyncResult({
        extensionId,
        sourceEditorName,
        targetEditorName,
        success: true
      });
    } catch {
      // CLI failed, fall through to filesystem copy fallback.
    }
  }

  try {
    const existingTargetExtensionDir = await findExtensionDir(targetExtensionsPath, extensionId);
    const dirName = existingTargetExtensionDir ? basename(existingTargetExtensionDir) : basename(sourceExtensionDir);
    const targetDir = join(targetExtensionsPath, dirName);

    if (!existingTargetExtensionDir) {
      await cp(sourceExtensionDir, targetDir, { recursive: true });
    }

    const extJsonPath = join(targetExtensionsPath, "extensions.json");
    const entries = readExtensionManifestEntries(targetExtensionsPath);

    const version = await readExtensionVersion(sourceExtensionDir);
    const sourceEntry = findExtensionManifestEntry(sourceExtensionsPath, extensionId);
    const normalizedEntries = entries.map((entry) => {
      if (!isJsonObject(entry) || !isExtensionManifestEntry(entry)) {
        return entry;
      }

      const currentExtensionId = entry.identifier.id;
      const entryDirName = resolveManifestDirName(entry, currentExtensionId === extensionId ? dirName : undefined);
      if (!entryDirName) {
        return entry;
      }

      return buildPatchedManifestEntry({
        extensionId: currentExtensionId,
        version: typeof entry.version === "string" ? entry.version : undefined,
        dirName: entryDirName,
        targetExtensionsPath,
        sourceEntry: currentExtensionId === extensionId ? sourceEntry : undefined,
        existingEntry: entry
      });
    });
    const existingEntryIndex = entries.findIndex((entry) => isExtensionManifestEntry(entry) && entry.identifier.id === extensionId);

    if (existingEntryIndex >= 0) {
      const existingEntry = entries[existingEntryIndex];
      if (isJsonObject(existingEntry) && isExtensionManifestEntry(existingEntry)) {
        normalizedEntries[existingEntryIndex] = buildPatchedManifestEntry({
          extensionId,
          version,
          dirName,
          targetExtensionsPath,
          sourceEntry,
          existingEntry
        });
      }
    } else {
      normalizedEntries.push(
        buildPatchedManifestEntry({
          extensionId,
          version,
          dirName,
          targetExtensionsPath,
          sourceEntry
        })
      );
    }

    writeFileSync(extJsonPath, JSON.stringify(normalizedEntries, null, 2));

    return createInstallSyncResult({
      extensionId,
      sourceEditorName,
      targetEditorName,
      success: true
    });
  } catch (error) {
    return createInstallSyncResult({
      extensionId,
      sourceEditorName,
      targetEditorName,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
