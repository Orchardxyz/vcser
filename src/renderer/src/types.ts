import type { ValueOf } from "type-fest";

export const EXTENSION_VIEW_MODE = {
  BY_EXTENSION: "by_extension",
  BY_EDITOR: "by_editor"
} as const;

export type ExtensionViewMode = ValueOf<typeof EXTENSION_VIEW_MODE>;

export const THEME_MODE = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system"
} as const;

export type ThemeMode = ValueOf<typeof THEME_MODE>;

export {
  APP_ICON_STATUS,
  type AppIconStatus,
  type ResolvedEditor,
  type CustomEditorInput,
  type MachineIdentity,
  type ExtensionPresence,
  type ExtensionDiffResult,
  SETTINGS_MODE,
  type SettingsMode,
  CHANGE_TYPE,
  type ChangeType,
  type SettingsKeyDiff,
  type SettingsDiffResult,
  SYNC_ACTION_TYPE,
  type SyncActionType,
  type SyncActionInput,
  type SyncResult,
  type ActionItem,
  EXTENSION_SETTINGS_GROUP_KIND,
  type ExtensionSettingsGroupKind,
  type ExtensionSettingsGroup,
  type SettingsDiffByExtensionResult
} from "../../shared/types";
