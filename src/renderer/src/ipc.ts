import type {
  ExtensionDiffResult,
  ResolvedEditor,
  SettingsDiffResult,
  SyncResult,
} from "./types";
import { CHANGE_TYPE } from "./types";

type InvokePayload = Record<string, unknown> | undefined;

const SUPPORTED_COMMAND = {
  DETECT_EDITORS: "detect_editors",
  COMPUTE_EXTENSION_DIFF: "compute_extension_diff",
  COMPUTE_SETTINGS_DIFF: "compute_settings_diff",
  EXECUTE_SYNC: "execute_sync",
} as const;

type SupportedCommand = (typeof SUPPORTED_COMMAND)[keyof typeof SUPPORTED_COMMAND];

const demoEditors: ResolvedEditor[] = [
  {
    name: "Cursor",
    slug: "cursor",
    cli: "cursor",
    badgeColor: "magenta",
    extensionsPath: "/Users/demo/.cursor/extensions",
    settingsPath: "/Users/demo/.cursor/User/settings.json",
    cliAvailable: true,
    extensionsExist: true,
    settingsExist: true,
  },
  {
    name: "Windsurf",
    slug: "windsurf",
    cli: "windsurf",
    badgeColor: "blue",
    extensionsPath: "/Users/demo/.windsurf/extensions",
    settingsPath: "/Users/demo/.windsurf/User/settings.json",
    cliAvailable: true,
    extensionsExist: true,
    settingsExist: true,
  },
  {
    name: "VS Code",
    slug: "vscode",
    cli: "code",
    badgeColor: "sky",
    extensionsPath: "/Users/demo/.vscode/extensions",
    settingsPath: "/Users/demo/Library/Application Support/Code/User/settings.json",
    cliAvailable: true,
    extensionsExist: true,
    settingsExist: true,
  },
];

const defaultResponses: Record<SupportedCommand, unknown> = {
  [SUPPORTED_COMMAND.DETECT_EDITORS]: demoEditors,
  [SUPPORTED_COMMAND.COMPUTE_EXTENSION_DIFF]: {
    editorNames: ["Cursor", "Windsurf", "VS Code"],
    all: [
      {
        extensionId: "esbenp.prettier-vscode",
        presence: {
          Cursor: true,
          Windsurf: true,
          "VS Code": true,
        },
      },
      {
        extensionId: "dbaeumer.vscode-eslint",
        presence: {
          Cursor: true,
          Windsurf: false,
          "VS Code": true,
        },
      },
      {
        extensionId: "usernamehw.errorlens",
        presence: {
          Cursor: false,
          Windsurf: true,
          "VS Code": false,
        },
      },
    ],
    onlyDiffs: [
      {
        extensionId: "dbaeumer.vscode-eslint",
        presence: {
          Cursor: true,
          Windsurf: false,
          "VS Code": true,
        },
      },
      {
        extensionId: "usernamehw.errorlens",
        presence: {
          Cursor: false,
          Windsurf: true,
          "VS Code": false,
        },
      },
    ],
  } as ExtensionDiffResult,
  [SUPPORTED_COMMAND.COMPUTE_SETTINGS_DIFF]: [
    {
      sourceName: "Cursor",
      targetName: "Windsurf",
      diffs: [
        {
          key: "editor.formatOnSave",
          changeType: CHANGE_TYPE.UPDATE,
          sourceValue: true,
          targetValue: false,
        },
        {
          key: "editor.tabSize",
          changeType: CHANGE_TYPE.UPDATE,
          sourceValue: 2,
          targetValue: 4,
        },
      ],
      addCount: 0,
      updateCount: 2,
      deleteCount: 0,
    },
  ] as SettingsDiffResult[],
  [SUPPORTED_COMMAND.EXECUTE_SYNC]: [] as SyncResult[],
};

export async function invoke<T>(command: string, _payload?: InvokePayload): Promise<T> {
  if (command in defaultResponses) {
    return structuredClone(defaultResponses[command as SupportedCommand]) as T;
  }

  return undefined as T;
}
