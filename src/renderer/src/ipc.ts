import type {
  ExtensionDiffResult,
  ResolvedEditor,
  SettingsDiffResult,
  SyncResult,
} from "./types";

type InvokePayload = Record<string, unknown> | undefined;

type SupportedCommand =
  | "detect_editors"
  | "compute_extension_diff"
  | "compute_settings_diff"
  | "execute_sync";

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
  detect_editors: demoEditors,
  compute_extension_diff: {
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
  compute_settings_diff: [
    {
      sourceName: "Cursor",
      targetName: "Windsurf",
      diffs: [
        {
          key: "editor.formatOnSave",
          changeType: "update",
          sourceValue: true,
          targetValue: false,
        },
        {
          key: "editor.tabSize",
          changeType: "update",
          sourceValue: 2,
          targetValue: 4,
        },
      ],
      addCount: 0,
      updateCount: 2,
      deleteCount: 0,
    },
  ] as SettingsDiffResult[],
  execute_sync: [] as SyncResult[],
};

export async function invoke<T>(command: string, _payload?: InvokePayload): Promise<T> {
  if (command in defaultResponses) {
    return structuredClone(defaultResponses[command as SupportedCommand]) as T;
  }

  return undefined as T;
}
