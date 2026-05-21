import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { APP_ICON_STATUS, type AppIconStatus } from "../shared/types";

export interface MacOSAppInfo {
  CFBundleDisplayName?: string;
  CFBundleIdentifier?: string;
  CFBundleIconFile?: string;
  CFBundleIconName?: string;
  CFBundleName?: string;
  CFBundleIcons?: {
    CFBundlePrimaryIcon?: {
      CFBundleIconFiles?: string[];
    };
  };
}

export function readMacOSAppInfo(appPath: string): MacOSAppInfo {
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

function resolveMacOSBundleIconPath(appPath: string): string | null {
  const resourcesDir = join(appPath, "Contents", "Resources");
  const info = readMacOSAppInfo(appPath);
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

export async function extractMacOSAppIcon(appPath: string): Promise<{
  iconPayload?: string;
  iconStatus: AppIconStatus;
}> {
  try {
    const iconPath = resolveMacOSBundleIconPath(appPath);
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

export function inferMacOSAppDisplayName(appPath: string): string {
  try {
    const info = readMacOSAppInfo(appPath);
    const displayName = info.CFBundleDisplayName?.trim() || info.CFBundleName?.trim();
    if (displayName) {
      return displayName;
    }
  } catch {
    // fall back to bundle basename
  }

  return basename(appPath, ".app").trim() || basename(appPath).trim();
}

export function inferMacOSBundleIdentifier(appPath: string): string | undefined {
  try {
    return readMacOSAppInfo(appPath).CFBundleIdentifier?.trim();
  } catch {
    return undefined;
  }
}
