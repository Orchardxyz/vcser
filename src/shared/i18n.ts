import type { ValueOf } from "type-fest";

export const APP_LOCALE = {
  EN: "en",
  ZH_CN: "zh-CN"
} as const;

export type AppLocale = ValueOf<typeof APP_LOCALE>;

export const LOCALE_PREFERENCE = {
  SYSTEM: "system",
  EN: APP_LOCALE.EN,
  ZH_CN: APP_LOCALE.ZH_CN
} as const;

export type LocalePreference = ValueOf<typeof LOCALE_PREFERENCE>;

export const RUNTIME_MESSAGE_KEY = {
  INVALID_DISABLE_PAYLOAD: "runtime.invalidDisablePayload",
  INVALID_UNINSTALL_PAYLOAD: "runtime.invalidUninstallPayload",
  EDITOR_UNAVAILABLE: "runtime.editorUnavailable",
  STATE_DATABASE_NOT_WRITABLE: "runtime.stateDatabaseNotWritable",
  MISSING_EXTENSION_ID_OR_SOURCE_EDITOR: "runtime.missingExtensionIdOrSourceEditor",
  SOURCE_OR_TARGET_EDITOR_UNAVAILABLE: "runtime.sourceOrTargetEditorUnavailable",
  UNSUPPORTED_SYNC_ACTION: "runtime.unsupportedSyncAction",
  EXTENSION_NOT_INSTALLED: "runtime.extensionNotInstalled",
  EXTENSION_NOT_FOUND_IN_SOURCE: "runtime.extensionNotFoundInSource",
  MISSING_SYNC_RESULT: "runtime.missingSyncResult"
} as const;

export type RuntimeMessageKey = ValueOf<typeof RUNTIME_MESSAGE_KEY>;

export type RuntimeMessageParamValue = string | number | boolean;

export type RuntimeMessageParams = Record<string, RuntimeMessageParamValue>;
