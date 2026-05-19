import type { ValueOf } from "type-fest";
import { detectMacOSEditors } from "./detect.macos";
import { detectWindowsEditors } from "./detect.windows";
import { SUPPORTED_EDITORS } from "./registry";

export const APP_ICON_STATUS = {
  READY: "ready",
  FALLBACK: "fallback"
} as const;

export type AppIconStatus = ValueOf<typeof APP_ICON_STATUS>;

export interface DetectedEditor {
  name: string;
  displayName: string;
  slug: string;
  cli: string;
  badgeColor: string;
  appPath: string;
  extensionsPath: string;
  settingsPath: string;
  stateDbPath?: string;
  iconPayload?: string;
  iconStatus: AppIconStatus;
}

export async function detectEditors(): Promise<DetectedEditor[]> {
  if (process.platform === "darwin") {
    return detectMacOSEditors(SUPPORTED_EDITORS);
  }
  if (process.platform === "win32") {
    return detectWindowsEditors(SUPPORTED_EDITORS);
  }
  return [];
}
