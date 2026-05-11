import type { JsonValue, Simplify, ValueOf } from "type-fest";

export const APP_ICON_STATUS = {
  READY: "ready",
  FALLBACK: "fallback"
} as const;

export type AppIconStatus = ValueOf<typeof APP_ICON_STATUS>;

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
  disabled: Record<string, boolean>;
  versions: Record<string, string | null>;
  hasVersionMismatch: boolean;
}

export interface ExtensionDiffResult {
  editorNames: string[];
  all: ExtensionPresence[];
  onlyDiffs: ExtensionPresence[];
}

export const EXTENSION_VIEW_MODE = {
  BY_EXTENSION: "by_extension",
  BY_EDITOR: "by_editor"
} as const;

export type ExtensionViewMode = ValueOf<typeof EXTENSION_VIEW_MODE>;

export const SETTINGS_MODE = {
  SAFE: "safe",
  EXACT: "exact"
} as const;

export type SettingsMode = ValueOf<typeof SETTINGS_MODE>;

export const THEME_MODE = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system"
} as const;

export type ThemeMode = ValueOf<typeof THEME_MODE>;

export const CHANGE_TYPE = {
  ADD: "add",
  UPDATE: "update",
  DELETE: "delete"
} as const;

export type ChangeType = ValueOf<typeof CHANGE_TYPE>;

export interface SettingsKeyDiff {
  key: string;
  changeType: ChangeType;
  sourceValue?: JsonValue;
  targetValue?: JsonValue;
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
  SETTINGS: "settings"
} as const;

export type SyncActionType = ValueOf<typeof SYNC_ACTION_TYPE>;

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

export type ActionItem = Simplify<SyncActionInput & { id: string; label: string }>;

export const EXTENSION_SETTINGS_GROUP_KIND = {
  NAMESPACE: "namespace",
  VERSION_ONLY: "version_only"
} as const;

export type ExtensionSettingsGroupKind = ValueOf<typeof EXTENSION_SETTINGS_GROUP_KIND>;

export interface ExtensionSettingsGroup {
  kind: ExtensionSettingsGroupKind;
  namespace: string;
  extensionId?: string;
  extensionIconDataUrl?: string;
  /** null when extensionId is unknown (built-in / unmatched namespace) */
  leftHasExtension: boolean | null;
  rightHasExtension: boolean | null;
  leftVersion: string | null;
  rightVersion: string | null;
  hasVersionMismatch: boolean;
  diffs: SettingsKeyDiff[];
  identicalCount: number;
  totalCount: number;
}

export interface SettingsDiffByExtensionResult {
  leftName: string;
  rightName: string;
  groups: ExtensionSettingsGroup[];
}
