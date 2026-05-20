import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import { hasStringProperty, isRecord } from "../../typeGuards";
import { findExtensionDir } from "./extensionFs";

interface DisabledExtensionRow {
  id: string;
  uuid?: string;
}

interface IExtensionIdentifier {
  id: string;
}

interface ExtensionManifestEntry {
  identifier: IExtensionIdentifier;
  relativeLocation?: string;
}

function isDisabledExtensionRow(value: unknown): value is DisabledExtensionRow {
  return hasStringProperty(value, "id");
}

function isExtensionManifestEntry(value: unknown): value is ExtensionManifestEntry {
  if (!isRecord(value)) {
    return false;
  }

  const identifier = value.identifier;

  return hasStringProperty(identifier, "id") && (value.relativeLocation === undefined || typeof value.relativeLocation === "string");
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
    const rawValue = execFileSync("sqlite3", [stateDbPath, "SELECT value FROM ItemTable WHERE key = 'extensionsIdentifiers/disabled'"], {
      encoding: "utf8"
    }).trim();

    if (!rawValue) {
      return [];
    }

    return parseDisabledExtensionRows(rawValue);
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to read disabled extensions from state database", { cause: error });
  }
}

function escapeSqlString(value: string): string {
  return value.replaceAll("'", "''");
}

function writeDisabledExtensionRows(stateDbPath: string, rows: DisabledExtensionRow[]) {
  const serialized = escapeSqlString(JSON.stringify(rows));
  const sql =
    "INSERT INTO ItemTable(key, value) VALUES ('extensionsIdentifiers/disabled', '" +
    serialized +
    "') ON CONFLICT(key) DO UPDATE SET value = excluded.value";

  try {
    execFileSync("sqlite3", [stateDbPath, sql], { encoding: "utf8" });
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Failed to write disabled extensions to state database", { cause: error });
  }
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

function writeExtensionManifestEntries(extensionsPath: string, entries: unknown[]) {
  writeFileSync(join(extensionsPath, "extensions.json"), JSON.stringify(entries, null, 2));
}

function resolveManifestDirectoryName(entry: unknown): string | undefined {
  if (!isRecord(entry) || !isExtensionManifestEntry(entry)) {
    return undefined;
  }

  if (typeof entry.relativeLocation === "string" && entry.relativeLocation.length > 0) {
    return entry.relativeLocation;
  }

  return undefined;
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
  const manifestDirName = resolveManifestDirectoryName(manifestEntry);
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
