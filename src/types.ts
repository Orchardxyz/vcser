export interface ResolvedEditor {
  name: string;
  slug: string;
  cli: string;
  badgeColor: string;
  extensionsPath: string;
  settingsPath: string;
  cliAvailable: boolean;
  extensionsExist: boolean;
  settingsExist: boolean;
}

export interface CustomEditorInput {
  name: string;
  extensionsPath: string;
  settingsPath: string;
  cli: string;
}

export interface ExtensionPresence {
  extensionId: string;
  presence: Record<string, boolean>;
}

export interface ExtensionDiffResult {
  editorNames: string[];
  all: ExtensionPresence[];
  onlyDiffs: ExtensionPresence[];
}

export type SettingsMode = "safe" | "exact";
export type ChangeType = "add" | "update" | "delete";

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

export type SyncActionType = "install" | "uninstall" | "settings";

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
