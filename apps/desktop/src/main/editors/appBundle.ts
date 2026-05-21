import { basename, extname } from "node:path";
import { APP_ICON_STATUS, type AppIconStatus } from "@vcser/core/types";
import { extractMacOSAppIcon, inferMacOSAppDisplayName, inferMacOSBundleIdentifier } from "../../../../../packages/core/src/editors/macosAppBundle";

export interface AppBundleSelectionResult {
  appPath: string;
  suggestedName: string;
  iconPayload?: string;
  iconStatus: AppIconStatus;
  unsupported: boolean;
}

async function extractAppIcon(appPath: string): Promise<{
  iconPayload?: string;
  iconStatus: AppIconStatus;
}> {
  if (process.platform !== "darwin") {
    return { iconStatus: APP_ICON_STATUS.FALLBACK };
  }

  return extractMacOSAppIcon(appPath);
}

function inferNameFromPath(appPath: string) {
  if (process.platform === "darwin") {
    return inferMacOSAppDisplayName(appPath);
  }

  const extension = extname(appPath);
  return basename(appPath, extension || undefined).trim() || basename(appPath).trim();
}

function inferBundleIdentifier(appPath: string) {
  if (process.platform !== "darwin") {
    return undefined;
  }

  return inferMacOSBundleIdentifier(appPath);
}

export function isUnsupportedCustomEditorApp(params: { appPath?: string; suggestedName?: string; bundleIdentifier?: string }) {
  const candidates = [params.appPath, params.suggestedName, params.bundleIdentifier]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim().toLowerCase());

  return candidates.some((value) => value.includes("url handler") || value.includes("url-handler"));
}

export async function resolveAppBundleSelection(appPath: string): Promise<AppBundleSelectionResult> {
  const suggestedName = inferNameFromPath(appPath);
  const bundleIdentifier = inferBundleIdentifier(appPath);
  const icon = await extractAppIcon(appPath);

  return {
    appPath,
    suggestedName,
    iconPayload: icon.iconPayload,
    iconStatus: icon.iconStatus,
    unsupported: isUnsupportedCustomEditorApp({
      appPath,
      suggestedName,
      bundleIdentifier
    })
  };
}
