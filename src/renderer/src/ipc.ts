import type { JsonObject, ValueOf } from "type-fest";
import type { ExtensionDiffResult, MachineIdentity, ResolvedEditor, SettingsDiffByExtensionResult, SettingsDiffResult, SyncResult } from "./types";
import { APP_ICON_STATUS, CHANGE_TYPE, EXTENSION_SETTINGS_GROUP_KIND } from "./types";

type InvokePayload = JsonObject | undefined;

const SUPPORTED_COMMAND = {
  GET_MACHINE_IDENTITY: "get_machine_identity",
  DETECT_EDITORS: "detect_editors",
  COMPUTE_EXTENSION_DIFF: "compute_extension_diff",
  COMPUTE_SETTINGS_DIFF: "compute_settings_diff",
  COMPUTE_SETTINGS_DIFF_BY_EXTENSION: "compute_settings_diff_by_extension",
  EXECUTE_SYNC: "execute_sync"
} as const;

type SupportedCommand = ValueOf<typeof SUPPORTED_COMMAND>;

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
    iconStatus: APP_ICON_STATUS.FALLBACK
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
    iconStatus: APP_ICON_STATUS.FALLBACK
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
    iconStatus: APP_ICON_STATUS.FALLBACK
  }
];

const demoMachineIdentity: MachineIdentity = {
  displayName: "My MacBook",
  hostname: "my-macbook.local",
  platformLabel: "macOS"
};

const defaultResponses: Record<SupportedCommand, unknown> = {
  [SUPPORTED_COMMAND.GET_MACHINE_IDENTITY]: demoMachineIdentity,
  [SUPPORTED_COMMAND.DETECT_EDITORS]: demoEditors,
  [SUPPORTED_COMMAND.COMPUTE_EXTENSION_DIFF]: {
    editorNames: ["Cursor", "Windsurf", "VS Code"],
    all: [
      {
        extensionId: "bradlc.vscode-tailwindcss",
        presence: { Cursor: true, Windsurf: true, "VS Code": true },
        disabled: { Cursor: false, Windsurf: false, "VS Code": true },
        versions: {
          Cursor: "0.14.26",
          Windsurf: "0.14.26",
          "VS Code": "0.14.25"
        },
        hasVersionMismatch: true
      },
      {
        extensionId: "dbaeumer.vscode-eslint",
        presence: { Cursor: true, Windsurf: false, "VS Code": true },
        disabled: { Cursor: true, Windsurf: false, "VS Code": false },
        versions: { Cursor: "3.0.10", Windsurf: null, "VS Code": "3.0.10" },
        hasVersionMismatch: false
      },
      {
        extensionId: "github.copilot-chat",
        presence: { Cursor: true, Windsurf: false, "VS Code": false },
        disabled: { Cursor: false, Windsurf: false, "VS Code": false },
        versions: {
          Cursor: "0.27.2025050801",
          Windsurf: null,
          "VS Code": null
        },
        hasVersionMismatch: false
      },
      {
        extensionId: "ms-python.python",
        presence: { Cursor: false, Windsurf: true, "VS Code": true },
        disabled: { Cursor: false, Windsurf: false, "VS Code": false },
        versions: { Cursor: null, Windsurf: "2026.4.1", "VS Code": "2026.4.1" },
        hasVersionMismatch: false
      }
    ],
    onlyDiffs: [
      {
        extensionId: "bradlc.vscode-tailwindcss",
        presence: { Cursor: true, Windsurf: true, "VS Code": true },
        disabled: { Cursor: false, Windsurf: false, "VS Code": true },
        versions: {
          Cursor: "0.14.26",
          Windsurf: "0.14.26",
          "VS Code": "0.14.25"
        },
        hasVersionMismatch: true
      },
      {
        extensionId: "dbaeumer.vscode-eslint",
        presence: { Cursor: true, Windsurf: false, "VS Code": true },
        disabled: { Cursor: true, Windsurf: false, "VS Code": false },
        versions: { Cursor: "3.0.10", Windsurf: null, "VS Code": "3.0.10" },
        hasVersionMismatch: false
      },
      {
        extensionId: "github.copilot-chat",
        presence: { Cursor: true, Windsurf: false, "VS Code": false },
        disabled: { Cursor: false, Windsurf: false, "VS Code": false },
        versions: {
          Cursor: "0.27.2025050801",
          Windsurf: null,
          "VS Code": null
        },
        hasVersionMismatch: false
      },
      {
        extensionId: "ms-python.python",
        presence: { Cursor: false, Windsurf: true, "VS Code": true },
        disabled: { Cursor: false, Windsurf: false, "VS Code": false },
        versions: { Cursor: null, Windsurf: "2026.4.1", "VS Code": "2026.4.1" },
        hasVersionMismatch: false
      }
    ]
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
          targetValue: false
        },
        {
          key: "editor.tabSize",
          changeType: CHANGE_TYPE.UPDATE,
          sourceValue: 2,
          targetValue: 4
        }
      ],
      addCount: 0,
      updateCount: 2,
      deleteCount: 0
    }
  ] as SettingsDiffResult[],
  [SUPPORTED_COMMAND.COMPUTE_SETTINGS_DIFF_BY_EXTENSION]: {
    leftName: "Cursor",
    rightName: "Windsurf",
    groups: [
      {
        kind: EXTENSION_SETTINGS_GROUP_KIND.NAMESPACE,
        namespace: "eslint",
        extensionId: "dbaeumer.vscode-eslint",
        extensionIconDataUrl: undefined,
        leftHasExtension: true,
        rightHasExtension: true,
        leftVersion: "3.0.10",
        rightVersion: "3.0.8",
        hasVersionMismatch: true,
        diffs: [
          {
            key: "eslint.validate",
            changeType: CHANGE_TYPE.UPDATE,
            sourceValue: ["javascript", "typescript"],
            targetValue: ["javascript"]
          }
        ],
        identicalCount: 1,
        totalCount: 2
      },
      {
        kind: EXTENSION_SETTINGS_GROUP_KIND.NAMESPACE,
        namespace: "tailwindCSS",
        extensionId: "bradlc.vscode-tailwindcss",
        extensionIconDataUrl: undefined,
        leftHasExtension: true,
        rightHasExtension: false,
        leftVersion: "0.14.26",
        rightVersion: null,
        hasVersionMismatch: false,
        diffs: [],
        identicalCount: 2,
        totalCount: 2
      }
    ]
  } as SettingsDiffByExtensionResult,
  [SUPPORTED_COMMAND.EXECUTE_SYNC]: [] as SyncResult[]
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
