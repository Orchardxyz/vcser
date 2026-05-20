import { execFileSync } from "node:child_process";
import { accessSync, constants, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { extname, join } from "node:path";
import type { EditorRegistryEntry } from "../registry";
import type { AppIconStatus } from "./detect";
import { type DetectedEditor, APP_ICON_STATUS } from "./detect";

interface MacOSAppInfo {
  CFBundleIconFile?: string;
  CFBundleIconName?: string;
  CFBundleIcons?: {
    CFBundlePrimaryIcon?: {
      CFBundleIconFiles?: string[];
    };
  };
}

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

function readAppInfo(appPath: string): MacOSAppInfo {
  const plistPath = join(appPath, "Contents", "Info.plist");
  const output = execFileSync("plutil", ["-convert", "json", "-o", "-", plistPath], {
    encoding: "utf8"
  });

  return JSON.parse(output) as MacOSAppInfo;
}

function collectIconNames(info: MacOSAppInfo): string[] {
  const primaryIcons = info.CFBundleIcons?.CFBundlePrimaryIcon?.CFBundleIconFiles ?? [];

  return Array.from(
    new Set([info.CFBundleIconFile, info.CFBundleIconName, ...primaryIcons].filter((value): value is string => Boolean(value && value.trim())))
  );
}

function resolveResourceIconPath(resourcesDir: string, iconName: string): string | null {
  const normalized = iconName.trim();
  const candidates = normalized.includes(".") ? [normalized] : [`${normalized}.icns`, `${normalized}.png`, normalized];

  for (const candidate of candidates) {
    const candidatePath = join(resourcesDir, candidate);
    if (existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  return null;
}

function resolveBundleIconPath(appPath: string): string | null {
  const resourcesDir = join(appPath, "Contents", "Resources");
  const info = readAppInfo(appPath);
  const iconNames = collectIconNames(info);

  for (const iconName of iconNames) {
    const iconPath = resolveResourceIconPath(resourcesDir, iconName);
    if (iconPath) {
      return iconPath;
    }
  }

  return null;
}

function convertIcnsToPngDataUrl(iconPath: string): string | null {
  const tempDir = mkdtempSync(join(tmpdir(), "vcser-icon-"));
  const tempPngPath = join(tempDir, "icon.png");

  try {
    execFileSync("sips", ["-s", "format", "png", iconPath, "--out", tempPngPath], {
      stdio: "ignore"
    });

    if (!existsSync(tempPngPath)) {
      return null;
    }

    return toPngDataUrl(readFileSync(tempPngPath));
  } catch {
    return null;
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function toPngDataUrl(content: Buffer): string {
  return `data:image/png;base64,${content.toString("base64")}`;
}

function createIconDataUrl(iconPath: string): string | null {
  const extension = extname(iconPath).toLowerCase();

  if (extension === ".png") {
    return toPngDataUrl(readFileSync(iconPath));
  }

  if (extension === ".icns") {
    return convertIcnsToPngDataUrl(iconPath);
  }

  return null;
}

async function extractIcon(appPath: string): Promise<{
  iconPayload?: string;
  iconStatus: AppIconStatus;
}> {
  try {
    const iconPath = resolveBundleIconPath(appPath);
    if (!iconPath) {
      return { iconStatus: APP_ICON_STATUS.FALLBACK };
    }

    const iconPayload = createIconDataUrl(iconPath);
    if (!iconPayload) {
      return { iconStatus: APP_ICON_STATUS.FALLBACK };
    }

    return { iconPayload, iconStatus: APP_ICON_STATUS.READY };
  } catch {
    return { iconStatus: APP_ICON_STATUS.FALLBACK };
  }
}

export async function detectMacOSEditors(entries: readonly EditorRegistryEntry[]): Promise<DetectedEditor[]> {
  const searchPaths = resolveAppPaths();
  const results: DetectedEditor[] = [];

  for (const entry of entries) {
    const appPath = findAppBundle(entry, searchPaths);
    if (!appPath) continue;

    const icon = await extractIcon(appPath);

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
