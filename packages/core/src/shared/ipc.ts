import type { ValueOf } from "type-fest";

export const SUPPORTED_COMMAND = {
  GET_MACHINE_IDENTITY: "get_machine_identity",
  DETECT_EDITORS: "detect_editors",
  PICK_CUSTOM_EDITOR_APP_PATH: "pick_custom_editor_app_path",
  PICK_CUSTOM_EDITOR_EXTENSIONS_PATH: "pick_custom_editor_extensions_path",
  PICK_CUSTOM_EDITOR_SETTINGS_PATH: "pick_custom_editor_settings_path",
  ADD_CUSTOM_EDITOR: "add_custom_editor",
  UPDATE_CUSTOM_EDITOR: "update_custom_editor",
  DELETE_CUSTOM_EDITOR: "delete_custom_editor",
  GET_EDITOR_EXTENSIONS: "get_editor_extensions",
  SET_EDITOR_EXTENSION_DISABLED: "set_editor_extension_disabled",
  UNINSTALL_EDITOR_EXTENSION: "uninstall_editor_extension",
  COMPUTE_EXTENSION_DIFF: "compute_extension_diff",
  COMPUTE_SETTINGS_DIFF: "compute_settings_diff",
  COMPUTE_SETTINGS_DIFF_BY_EXTENSION: "compute_settings_diff_by_extension",
  EXECUTE_SYNC: "execute_sync"
} as const;

export type SupportedCommand = ValueOf<typeof SUPPORTED_COMMAND>;
