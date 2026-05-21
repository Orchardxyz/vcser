import { accessSync, constants } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import type { EditorRegistryEntry } from "../registry";
import { extractMacOSAppIcon } from "../macosAppBundle";
import { type DetectedEditor } from "./detect";

function resolveAppPaths(): string[] {
  const paths: string[] = [];
  const systemApps = "/Applications";
  const userApps = join(homedir(), "Applications");

  try {
    accessSync(systemApps, constants.R_OK);
    paths.push(systemApps);
  } catch {
    // path not accessible
  }

  try {
    accessSync(userApps, constants.R_OK);
    paths.push(userApps);
  } catch {
    // path not accessible
  }

  return paths;
}

function findAppBundle(entry: EditorRegistryEntry, searchPaths: string[]): string | null {
  for (const base of searchPaths) {
    const candidate = join(base, entry.macOSBundleName);
    try {
      accessSync(candidate, constants.R_OK);
      return candidate;
    } catch {
      // not found in this search path
    }
  }
  return null;
}

export async function detectMacOSEditors(entries: readonly EditorRegistryEntry[]): Promise<DetectedEditor[]> {
  const searchPaths = resolveAppPaths();
  const results: DetectedEditor[] = [];

  for (const entry of entries) {
    const appPath = findAppBundle(entry, searchPaths);
    if (!appPath) continue;

    const icon = await extractMacOSAppIcon(appPath);

    const template = entry.extensionsPath.mac.replace("{slug}", entry.slug);
    const extensionsPath = template.startsWith("~/") ? join(homedir(), template.slice(2)) : template;

    const settingsTemplate = entry.settingsPath.mac;
    const settingsPath = settingsTemplate.startsWith("~/") ? join(homedir(), settingsTemplate.slice(2)) : settingsTemplate;

    const stateDbTemplate = entry.stateDbPath.mac;
    const stateDbPath = stateDbTemplate.startsWith("~/") ? join(homedir(), stateDbTemplate.slice(2)) : stateDbTemplate;

    results.push({
      name: entry.displayName,
      displayName: entry.displayName,
      slug: entry.slug,
      cli: entry.cli,
      badgeColor: entry.badgeColor,
      appPath,
      extensionsPath,
      settingsPath,
      stateDbPath,
      iconPayload: icon.iconPayload,
      iconStatus: icon.iconStatus
    });
  }

  return results;
}
