import type { ValueOf } from "type-fest";

export { APP_LOCALE, LOCALE_PREFERENCE, RUNTIME_MESSAGE_KEY } from "@vcser/core/i18n";
export type { AppLocale, LocalePreference, RuntimeMessageKey, RuntimeMessageParams } from "@vcser/core/i18n";

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
  EDITOR_SOURCE,
  type AppIconStatus,
  type EditorSource,
  type ResolvedEditor,
  type CustomEditorInput,
  type CustomEditorRecord,
  type PickCustomEditorAppResult,
  type PickCustomEditorPathResult,
  type AddCustomEditorResult,
  type MachineIdentity,
  type ExtensionPresence,
  type ExtensionDiffResult,
  type EditorExtensionItem,
  type EditorExtensionsResult,
  EDITOR_EXTENSION_ACTION,
  type EditorExtensionAction,
  type SetEditorExtensionDisabledInput,
  type UninstallEditorExtensionInput,
  type EditorExtensionMutationResult,
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
} from "@vcser/core/types";
