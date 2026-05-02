export const APP_ICON_STATUS = {
  READY: "ready",
  FALLBACK: "fallback",
} as const;

export type AppIconStatus = (typeof APP_ICON_STATUS)[keyof typeof APP_ICON_STATUS];

export interface ResolvedEditor {
  name: string;
  displayName: string;
  slug: string;
  cli: string;
  badgeColor: string;
  extensionsPath: string;
  settingsPath: string;
  cliAvailable: boolean;
  extensionsExist: boolean;
  settingsExist: boolean;
  appPath?: string;
  iconPayload?: string;
  iconStatus: AppIconStatus;
}

export interface CustomEditorInput {
  name: string;
  extensionsPath: string;
  settingsPath: string;
  cli: string;
}

export interface ExtensionPresence {
  extensionId: string;
  iconDataUrl?: string;
  presence: Record<string, boolean>;
}

export interface ExtensionDiffResult {
  editorNames: string[];
  all: ExtensionPresence[];
  onlyDiffs: ExtensionPresence[];
}

export const SETTINGS_MODE = {
  SAFE: "safe",
  EXACT: "exact",
} as const;

export type SettingsMode = (typeof SETTINGS_MODE)[keyof typeof SETTINGS_MODE];

export const CHANGE_TYPE = {
  ADD: "add",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export type ChangeType = (typeof CHANGE_TYPE)[keyof typeof CHANGE_TYPE];

export interface SettingsKeyDiff {
  key: string;
  changeType: ChangeType;
  sourceValue?: unknown;
  targetValue?: unknown;
}

export interface SettingsDiffResult {
  sourceName: string;
  targetName: string;
  diffs: SettingsKeyDiff[];
  addCount: number;
  updateCount: number;
  deleteCount: number;
}

export const SYNC_ACTION_TYPE = {
  INSTALL: "install",
  UNINSTALL: "uninstall",
  SETTINGS: "settings",
} as const;

export type SyncActionType = (typeof SYNC_ACTION_TYPE)[keyof typeof SYNC_ACTION_TYPE];

export interface SyncActionInput {
  actionType: SyncActionType;
  extensionId?: string;
  sourceEditor?: string;
  targetEditor: string;
  diffs?: SettingsKeyDiff[];
}

export interface SyncResult {
  action: string;
  editor: string;
  success: boolean;
  error?: string;
  backupPath?: string;
}

export interface ActionItem {
  id: string;
  label: string;
  actionType: SyncActionType;
  extensionId?: string;
  sourceEditor?: string;
  targetEditor: string;
  diffs?: SettingsKeyDiff[];
}
