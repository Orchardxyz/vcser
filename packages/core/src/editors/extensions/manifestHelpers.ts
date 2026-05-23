import { readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { hasStringProperty, isRecord } from "../../typeGuards";

export interface ExtensionManifestEntry {
  [key: string]: unknown;
  identifier: { id: string; uuid?: string };
  version?: string;
  relativeLocation?: string;
}

export function isExtensionManifestEntry(value: unknown): value is ExtensionManifestEntry {
  if (!isRecord(value)) {
    return false;
  }

  const identifier = value.identifier;

  return (
    hasStringProperty(identifier, "id") &&
    (value.version === undefined || typeof value.version === "string") &&
    (value.relativeLocation === undefined || typeof value.relativeLocation === "string")
  );
}

function resolveManifestPath(extensionsPath: string): string {
  return join(extensionsPath, "extensions.json");
}

export function readExtensionManifestEntries(extensionsPath: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(readFileSync(resolveManifestPath(extensionsPath), "utf-8"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeExtensionManifestEntries(extensionsPath: string, entries: unknown[]): void {
  writeFileSync(resolveManifestPath(extensionsPath), JSON.stringify(entries, null, 2));
}

export function findExtensionManifestEntry(extensionsPath: string, extensionId: string): ExtensionManifestEntry | undefined {
  return readExtensionManifestEntries(extensionsPath).find(
    (entry): entry is ExtensionManifestEntry => isExtensionManifestEntry(entry) && entry.identifier.id === extensionId
  );
}

export function resolveManifestDirName(entry: unknown, fallbackDirName?: string): string | undefined {
  if (!isExtensionManifestEntry(entry)) {
    return fallbackDirName;
  }

  if (typeof entry.relativeLocation === "string" && entry.relativeLocation.length > 0) {
    return entry.relativeLocation;
  }

  if (isRecord(entry.location) && typeof entry.location.path === "string" && entry.location.path.length > 0) {
    return basename(entry.location.path);
  }

  return fallbackDirName;
}
