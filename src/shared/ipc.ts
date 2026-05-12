import type { ValueOf } from "type-fest";

export const SUPPORTED_COMMAND = {
  GET_MACHINE_IDENTITY: "get_machine_identity",
  DETECT_EDITORS: "detect_editors",
  COMPUTE_EXTENSION_DIFF: "compute_extension_diff",
  COMPUTE_SETTINGS_DIFF: "compute_settings_diff",
  COMPUTE_SETTINGS_DIFF_BY_EXTENSION: "compute_settings_diff_by_extension",
  EXECUTE_SYNC: "execute_sync"
} as const;

export type SupportedCommand = ValueOf<typeof SUPPORTED_COMMAND>;
