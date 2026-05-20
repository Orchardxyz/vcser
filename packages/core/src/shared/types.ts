import type { JsonValue, Simplify, ValueOf } from "type-fest";
import type { RuntimeMessageKey, RuntimeMessageParams } from "./i18n";

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

export interface MachineIdentity {
  displayName: string;
  hostname: string;
  platformLabel: string;
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

export interface EditorExtensionItem {
  extensionId: string;
  version: string | null;
  disabled: boolean;
  iconDataUrl?: string;
}

export interface EditorExtensionsResult {
  editorSlug: string;
  editorName: string;
  items: EditorExtensionItem[];
}

export const EDITOR_EXTENSION_ACTION = {
  DISABLE: "disable",
  ENABLE: "enable",
  UNINSTALL: "uninstall"
} as const;

export type EditorExtensionAction = ValueOf<typeof EDITOR_EXTENSION_ACTION>;

export interface SetEditorExtensionDisabledInput {
  editorSlug: string;
  extensionId: string;
  disabled: boolean;
}

export interface UninstallEditorExtensionInput {
  editorSlug: string;
  extensionId: string;
}

export interface EditorExtensionMutationResult {
  action: EditorExtensionAction;
  editorSlug: string;
  editorName: string;
  extensionId: string;
  success: boolean;
  disabled?: boolean;
  errorKey?: RuntimeMessageKey;
  errorParams?: RuntimeMessageParams;
  error?: string;
}

export const SETTINGS_MODE = {
  SAFE: "safe",
  EXACT: "exact"
} as const;

export type SettingsMode = ValueOf<typeof SETTINGS_MODE>;

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
  extensionId?: string;
  sourceEditor?: string;
  targetEditor?: string;
  errorKey?: RuntimeMessageKey;
  errorParams?: RuntimeMessageParams;
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

export type { RuntimeMessageKey, RuntimeMessageParams };
