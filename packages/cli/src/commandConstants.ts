export const CLI_SCOPE = {
  SYNC: "sync",
  RESET: "reset",
  EDITOR: "editor",
  MIGRATE: "migrate"
} as const;

export type CliScope = (typeof CLI_SCOPE)[keyof typeof CLI_SCOPE];

export const CLI_EDITOR_ACTION = {
  LIST: "list",
  ADD: "add",
  UPDATE: "update",
  REMOVE: "remove"
} as const;

export type CliEditorAction = (typeof CLI_EDITOR_ACTION)[keyof typeof CLI_EDITOR_ACTION];

export const CLI_MIGRATION_TARGET = {
  CUSTOM_EDITORS: "custom-editors"
} as const;

export type CliMigrationTarget = (typeof CLI_MIGRATION_TARGET)[keyof typeof CLI_MIGRATION_TARGET];
