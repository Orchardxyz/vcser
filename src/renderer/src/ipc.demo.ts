/* eslint-disable max-lines */
import type { JsonObject } from "type-fest";
import type {
  EditorExtensionItem,
  EditorExtensionMutationResult,
  EditorExtensionsResult,
  ExtensionDiffResult,
  MachineIdentity,
  ResolvedEditor,
  SettingsDiffByExtensionResult,
  SettingsDiffResult,
  SyncResult
} from "./types";
import { APP_ICON_STATUS, CHANGE_TYPE, EDITOR_EXTENSION_ACTION, EXTENSION_SETTINGS_GROUP_KIND } from "./types";
import { SUPPORTED_COMMAND, type SupportedCommand } from "@shared/ipc";

function createDemoItems(items: EditorExtensionItem[]): EditorExtensionItem[] {
  return items.map((item) => ({ ...item }));
}

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

const demoEditorExtensionsBySlug = new Map<string, EditorExtensionsResult>([
  [
    "cursor",
    {
      editorSlug: "cursor",
      editorName: "Cursor",
      items: createDemoItems([
        { extensionId: "bradlc.vscode-tailwindcss", version: "0.14.26", disabled: false },
        { extensionId: "dbaeumer.vscode-eslint", version: "3.0.10", disabled: true },
        { extensionId: "github.copilot-chat", version: "0.27.2025050801", disabled: false }
      ])
    }
  ],
  [
    "windsurf",
    {
      editorSlug: "windsurf",
      editorName: "Windsurf",
      items: createDemoItems([
        { extensionId: "bradlc.vscode-tailwindcss", version: "0.14.26", disabled: false },
        { extensionId: "ms-python.python", version: "2026.4.1", disabled: false }
      ])
    }
  ],
  [
    "vscode",
    {
      editorSlug: "vscode",
      editorName: "VSCode",
      items: createDemoItems([
        { extensionId: "bradlc.vscode-tailwindcss", version: "0.14.25", disabled: true },
        { extensionId: "dbaeumer.vscode-eslint", version: "3.0.10", disabled: false },
        { extensionId: "ms-python.python", version: "2026.4.1", disabled: false }
      ])
    }
  ]
]);

const defaultResponses: Record<SupportedCommand, unknown> = {
  [SUPPORTED_COMMAND.GET_MACHINE_IDENTITY]: demoMachineIdentity,
  [SUPPORTED_COMMAND.DETECT_EDITORS]: demoEditors,
  [SUPPORTED_COMMAND.GET_EDITOR_EXTENSIONS]: getDemoEditorExtensions("cursor"),
  [SUPPORTED_COMMAND.SET_EDITOR_EXTENSION_DISABLED]: {
    action: EDITOR_EXTENSION_ACTION.DISABLE,
    editorSlug: "cursor",
    editorName: "Cursor",
    extensionId: "bradlc.vscode-tailwindcss",
    success: true,
    disabled: true
  } as EditorExtensionMutationResult,
  [SUPPORTED_COMMAND.UNINSTALL_EDITOR_EXTENSION]: {
    action: EDITOR_EXTENSION_ACTION.UNINSTALL,
    editorSlug: "cursor",
    editorName: "Cursor",
    extensionId: "bradlc.vscode-tailwindcss",
    success: true
  } as EditorExtensionMutationResult,
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

function isSyncPayload(value: JsonObject | undefined): value is JsonObject & { actions: Array<Record<string, unknown>> } {
  return !!value && Array.isArray(value.actions);
}

function isEditorSlugPayload(value: JsonObject | undefined): value is JsonObject & { editorSlug: string } {
  return !!value && typeof value.editorSlug === "string";
}

function isSetEditorExtensionDisabledPayload(
  value: JsonObject | undefined
): value is JsonObject & { editorSlug: string; extensionId: string; disabled: boolean } {
  return !!value && typeof value.editorSlug === "string" && typeof value.extensionId === "string" && typeof value.disabled === "boolean";
}

function isUninstallEditorExtensionPayload(value: JsonObject | undefined): value is JsonObject & { editorSlug: string; extensionId: string } {
  return !!value && typeof value.editorSlug === "string" && typeof value.extensionId === "string";
}

function getDemoEditorName(editorSlug: string): string {
  return demoEditors.find((editor) => editor.slug === editorSlug)?.displayName ?? editorSlug;
}

function getDemoEditorExtensions(editorSlug: string): EditorExtensionsResult {
  const current = demoEditorExtensionsBySlug.get(editorSlug);

  if (current) {
    return {
      editorSlug: current.editorSlug,
      editorName: current.editorName,
      items: createDemoItems(current.items)
    };
  }

  return {
    editorSlug,
    editorName: getDemoEditorName(editorSlug),
    items: []
  };
}

function setDemoEditorExtensionDisabled(params: { editorSlug: string; extensionId: string; disabled: boolean }): EditorExtensionMutationResult {
  const current = getDemoEditorExtensions(params.editorSlug);
  const nextItems = current.items.map((item) => (item.extensionId === params.extensionId ? { ...item, disabled: params.disabled } : item));
  const targetExists = nextItems.some((item) => item.extensionId === params.extensionId);

  if (targetExists) {
    demoEditorExtensionsBySlug.set(params.editorSlug, {
      editorSlug: current.editorSlug,
      editorName: current.editorName,
      items: nextItems
    });
  }

  return {
    action: params.disabled ? EDITOR_EXTENSION_ACTION.DISABLE : EDITOR_EXTENSION_ACTION.ENABLE,
    editorSlug: params.editorSlug,
    editorName: current.editorName,
    extensionId: params.extensionId,
    success: targetExists,
    disabled: params.disabled,
    ...(targetExists ? {} : { error: `Extension ${params.extensionId} is not installed` })
  };
}

function uninstallDemoEditorExtension(params: { editorSlug: string; extensionId: string }): EditorExtensionMutationResult {
  const current = getDemoEditorExtensions(params.editorSlug);
  const nextItems = current.items.filter((item) => item.extensionId !== params.extensionId);
  const targetExists = nextItems.length !== current.items.length;

  if (targetExists) {
    demoEditorExtensionsBySlug.set(params.editorSlug, {
      editorSlug: current.editorSlug,
      editorName: current.editorName,
      items: nextItems
    });
  }

  return {
    action: EDITOR_EXTENSION_ACTION.UNINSTALL,
    editorSlug: params.editorSlug,
    editorName: current.editorName,
    extensionId: params.extensionId,
    success: targetExists,
    ...(targetExists ? {} : { error: `Extension ${params.extensionId} is not installed` })
  };
}

export function resolveDemoResponse<T>(command: string, payload?: JsonObject): T | undefined {
  if (command === SUPPORTED_COMMAND.EXECUTE_SYNC && isSyncPayload(payload)) {
    const results: SyncResult[] = payload.actions.map((action) => ({
      action: typeof action.actionType === "string" ? action.actionType : "install",
      editor: typeof action.targetEditor === "string" ? action.targetEditor : "Unknown",
      extensionId: typeof action.extensionId === "string" ? action.extensionId : undefined,
      sourceEditor: typeof action.sourceEditor === "string" ? action.sourceEditor : undefined,
      targetEditor: typeof action.targetEditor === "string" ? action.targetEditor : undefined,
      success: true
    }));
    return results as T;
  }

  if (command === SUPPORTED_COMMAND.GET_EDITOR_EXTENSIONS && isEditorSlugPayload(payload)) {
    return getDemoEditorExtensions(payload.editorSlug) as T;
  }

  if (command === SUPPORTED_COMMAND.SET_EDITOR_EXTENSION_DISABLED && isSetEditorExtensionDisabledPayload(payload)) {
    return setDemoEditorExtensionDisabled(payload) as T;
  }

  if (command === SUPPORTED_COMMAND.UNINSTALL_EDITOR_EXTENSION && isUninstallEditorExtensionPayload(payload)) {
    return uninstallDemoEditorExtension(payload) as T;
  }

  if (command in defaultResponses) {
    return structuredClone(defaultResponses[command as SupportedCommand]) as T;
  }

  return undefined;
}
