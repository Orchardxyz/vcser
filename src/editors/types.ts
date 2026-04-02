export interface EditorPaths {
  darwin: { extensions: string; settings: string };
  linux: { extensions: string; settings: string };
  win32: { extensions: string; settings: string };
}

export interface EditorDefinition {
  name: string;
  slug: string;
  cli: string;
  badgeColor: string;
  paths: EditorPaths;
}

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

export type SettingsMode = "safe" | "exact";

export interface CliFlags {
  dryRun: boolean;
  settingsMode: SettingsMode;
  customEditors: CustomEditorInput[];
}
