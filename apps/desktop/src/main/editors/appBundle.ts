import { inferCustomEditorNameFromAppPath, isUnsupportedCustomEditorApp } from "@vcser/core/customEditors";
import { extractWindowsAppIcon } from "@vcser/core/editors/windowsAppIcon";
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
  if (process.platform === "darwin") {
    return extractMacOSAppIcon(appPath);
  }

  if (process.platform === "win32") {
    return extractWindowsAppIcon(appPath);
  }

  return { iconStatus: APP_ICON_STATUS.FALLBACK };
}

function inferNameFromPath(appPath: string) {
  if (process.platform === "darwin") {
    return inferMacOSAppDisplayName(appPath);
  }

  return inferCustomEditorNameFromAppPath(appPath);
}

export async function resolveAppBundleSelection(appPath: string): Promise<AppBundleSelectionResult> {
  const suggestedName = inferNameFromPath(appPath);
  const bundleIdentifier = process.platform === "darwin" ? inferMacOSBundleIdentifier(appPath) : undefined;
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
