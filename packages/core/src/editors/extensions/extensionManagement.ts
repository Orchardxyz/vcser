import { rm } from "node:fs/promises";
import { join } from "node:path";
import { hasStringProperty } from "../../typeGuards";
import { findExtensionDir } from "./extensionFs";
import { isExtensionManifestEntry, readExtensionManifestEntries, writeExtensionManifestEntries, resolveManifestDirName } from "./manifestHelpers";
import { readStateDatabaseValue, writeStateDatabaseValue } from "./stateDb";

interface DisabledExtensionRow {
  id: string;
  uuid?: string;
}

function isDisabledExtensionRow(value: unknown): value is DisabledExtensionRow {
  return hasStringProperty(value, "id");
}

function parseDisabledExtensionRows(rawValue: string): DisabledExtensionRow[] {
  const parsed: unknown = JSON.parse(rawValue);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.filter(isDisabledExtensionRow);
}

function readDisabledExtensionRows(stateDbPath: string): DisabledExtensionRow[] {
  try {
    const rawValue = readStateDatabaseValue(stateDbPath, "extensionsIdentifiers/disabled");
    if (!rawValue) {
      return [];
    }

    return parseDisabledExtensionRows(rawValue);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to read disabled extensions from state database", { cause: error });
  }
}

function writeDisabledExtensionRows(stateDbPath: string, rows: DisabledExtensionRow[]) {
  try {
    writeStateDatabaseValue(stateDbPath, "extensionsIdentifiers/disabled", JSON.stringify(rows));
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to write disabled extensions to state database", { cause: error });
  }
}

export function setEditorExtensionDisabled(params: { stateDbPath: string; extensionId: string; disabled: boolean }): boolean {
  const { stateDbPath, extensionId, disabled } = params;
  const currentRows = readDisabledExtensionRows(stateDbPath);
  const withoutTarget = currentRows.filter((row) => row.id !== extensionId);
  const nextRows = disabled ? [...withoutTarget, { id: extensionId }] : withoutTarget;

  writeDisabledExtensionRows(stateDbPath, nextRows);
  return nextRows.some((row) => row.id === extensionId);
}

export async function uninstallEditorExtension(params: { extensionsPath: string; extensionId: string; stateDbPath?: string }): Promise<void> {
  const { extensionsPath, extensionId, stateDbPath } = params;
  const manifestEntries = readExtensionManifestEntries(extensionsPath);
  const nextManifestEntries = manifestEntries.filter((entry) => !isExtensionManifestEntry(entry) || entry.identifier.id !== extensionId);
  const manifestEntry = manifestEntries.find((entry) => isExtensionManifestEntry(entry) && entry.identifier.id === extensionId);
  const manifestDirName = resolveManifestDirName(manifestEntry);
  const extensionDir = manifestDirName ? join(extensionsPath, manifestDirName) : await findExtensionDir(extensionsPath, extensionId);

  if (!extensionDir && nextManifestEntries.length === manifestEntries.length) {
    throw new Error(`Extension ${extensionId} is not installed`);
  }

  if (extensionDir) {
    await rm(extensionDir, { recursive: true, force: true });
  }

  if (nextManifestEntries.length !== manifestEntries.length) {
    writeExtensionManifestEntries(extensionsPath, nextManifestEntries);
  }

  if (stateDbPath) {
    try {
      setEditorExtensionDisabled({ stateDbPath, extensionId, disabled: false });
    } catch {
      // Removing a stale disabled marker is best-effort after uninstall.
    }
  }
}
