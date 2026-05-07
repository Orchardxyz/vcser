import type {
  ExtensionDiffResult,
  ResolvedEditor,
  SettingsDiffByExtensionResult,
  SettingsDiffResult,
  SyncResult,
} from "./types";
import { CHANGE_TYPE, APP_ICON_STATUS } from "./types";

type InvokePayload = Record<string, unknown> | undefined;

const SUPPORTED_COMMAND = {
  DETECT_EDITORS: "detect_editors",
  COMPUTE_EXTENSION_DIFF: "compute_extension_diff",
  COMPUTE_SETTINGS_DIFF: "compute_settings_diff",
  COMPUTE_SETTINGS_DIFF_BY_EXTENSION: "compute_settings_diff_by_extension",
  EXECUTE_SYNC: "execute_sync",
} as const;

type SupportedCommand = (typeof SUPPORTED_COMMAND)[keyof typeof SUPPORTED_COMMAND];

const demoEditors: ResolvedEditor[] = [
  {
    name: "Cursor",
    displayName: "Cursor",
    slug: "cursor",
    cli: "cursor",
    badgeColor: "magenta",
    extensionsPath: "/Users/demo/.cursor/extensions",
    settingsPath: "/Users/demo/.cursor/User/settings.json",
    cliAvailable: true,
    extensionsExist: true,
    settingsExist: true,
    iconStatus: APP_ICON_STATUS.FALLBACK,
  },
  {
    name: "Windsurf",
    displayName: "Windsurf",
    slug: "windsurf",
    cli: "windsurf",
    badgeColor: "blue",
    extensionsPath: "/Users/demo/.windsurf/extensions",
    settingsPath: "/Users/demo/.windsurf/User/settings.json",
    cliAvailable: true,
    extensionsExist: true,
    settingsExist: true,
    iconStatus: APP_ICON_STATUS.FALLBACK,
  },
  {
    name: "VS Code",
    displayName: "VSCode",
    slug: "vscode",
    cli: "code",
    badgeColor: "sky",
    extensionsPath: "/Users/demo/.vscode/extensions",
    settingsPath: "/Users/demo/Library/Application Support/Code/User/settings.json",
    cliAvailable: true,
    extensionsExist: true,
    settingsExist: true,
    iconStatus: APP_ICON_STATUS.FALLBACK,
  },
];

const defaultResponses: Record<SupportedCommand, unknown> = {
  [SUPPORTED_COMMAND.DETECT_EDITORS]: demoEditors,
  [SUPPORTED_COMMAND.COMPUTE_EXTENSION_DIFF]: {
    editorNames: ["Cursor", "Windsurf", "VS Code"],
    all: [
      {
        extensionId: "bradlc.vscode-tailwindcss",
        presence: { Cursor: true, Windsurf: true, "VS Code": true },
        disabled: { Cursor: false, Windsurf: false, "VS Code": true },
      },
      {
        extensionId: "dbaeumer.vscode-eslint",
        presence: { Cursor: true, Windsurf: false, "VS Code": true },
        disabled: { Cursor: true, Windsurf: false, "VS Code": false },
      },
      {
        extensionId: "github.copilot-chat",
        presence: { Cursor: true, Windsurf: false, "VS Code": false },
        disabled: { Cursor: false, Windsurf: false, "VS Code": false },
      },
      {
        extensionId: "ms-python.python",
        presence: { Cursor: false, Windsurf: true, "VS Code": true },
        disabled: { Cursor: false, Windsurf: false, "VS Code": false },
      },
    ],
    onlyDiffs: [
      {
        extensionId: "dbaeumer.vscode-eslint",
        presence: { Cursor: true, Windsurf: false, "VS Code": true },
        disabled: { Cursor: true, Windsurf: false, "VS Code": false },
      },
      {
        extensionId: "github.copilot-chat",
        presence: { Cursor: true, Windsurf: false, "VS Code": false },
        disabled: { Cursor: false, Windsurf: false, "VS Code": false },
      },
      {
        extensionId: "ms-python.python",
        presence: { Cursor: false, Windsurf: true, "VS Code": true },
        disabled: { Cursor: false, Windsurf: false, "VS Code": false },
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
  [SUPPORTED_COMMAND.COMPUTE_SETTINGS_DIFF_BY_EXTENSION]: {
    leftName: "Cursor",
    rightName: "Windsurf",
    groups: [
      {
        namespace: "eslint",
        extensionId: "dbaeumer.vscode-eslint",
        extensionIconDataUrl: undefined,
        leftHasExtension: true,
        rightHasExtension: true,
        diffs: [
          {
            key: "eslint.validate",
            changeType: CHANGE_TYPE.UPDATE,
            sourceValue: ["javascript", "typescript"],
            targetValue: ["javascript"],
          },
        ],
        identicalCount: 1,
        totalCount: 2,
      },
      {
        namespace: "tailwindCSS",
        extensionId: "bradlc.vscode-tailwindcss",
        extensionIconDataUrl: undefined,
        leftHasExtension: true,
        rightHasExtension: false,
        diffs: [],
        identicalCount: 2,
        totalCount: 2,
      },
    ],
  } as SettingsDiffByExtensionResult,
  [SUPPORTED_COMMAND.EXECUTE_SYNC]: [] as SyncResult[],
};

export async function invoke<T>(command: string, payload?: InvokePayload): Promise<T> {
  if (window.electronAPI?.invoke) {
    try {
      return (await window.electronAPI.invoke(command, payload ?? {})) as T;
    } catch {
      // fall through to demo responses on error
    }
  }

  if (command in defaultResponses) {
    return structuredClone(defaultResponses[command as SupportedCommand]) as T;
  }

  return undefined as T;
}
