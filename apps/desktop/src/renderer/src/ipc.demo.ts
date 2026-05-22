/* eslint-disable max-lines */
import { RUNTIME_MESSAGE_KEY } from "@vcser/core/i18n";
import type { JsonObject } from "type-fest";
import type {
  AddCustomEditorResult,
  DeleteCustomEditorResult,
  EditorExtensionItem,
  EditorExtensionMutationResult,
  EditorExtensionsResult,
  ExtensionDiffResult,
  MachineIdentity,
  PickCustomEditorAppResult,
  PickCustomEditorPathResult,
  ResolvedEditor,
  SettingsDiffByExtensionResult,
  SettingsDiffResult,
  SyncResult,
  UpdateCustomEditorResult
} from "./types";
import { APP_ICON_STATUS, CHANGE_TYPE, EDITOR_EXTENSION_ACTION, EDITOR_SOURCE, EXTENSION_SETTINGS_GROUP_KIND } from "./types";
import { SUPPORTED_COMMAND, type SupportedCommand } from "@vcser/core/ipc";

function createDemoItems(items: EditorExtensionItem[]): EditorExtensionItem[] {
  return items.map((item) => ({ ...item }));
}

const builtInDemoEditors: ResolvedEditor[] = [
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
    source: EDITOR_SOURCE.DETECTED
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
    source: EDITOR_SOURCE.DETECTED
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
    source: EDITOR_SOURCE.DETECTED
  }
];

const demoCustomEditors: ResolvedEditor[] = [];

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

function getDemoEditors(): ResolvedEditor[] {
  return [...builtInDemoEditors, ...demoCustomEditors].map((editor) => ({ ...editor }));
}

function isCustomEditorInputPayload(value: unknown): value is {
  name: string;
  cli?: string;
  appPath?: string;
  extensionsPath: string;
  settingsPath: string;
} {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { name?: unknown }).name === "string" &&
    typeof (value as { extensionsPath?: unknown }).extensionsPath === "string" &&
    typeof (value as { settingsPath?: unknown }).settingsPath === "string"
  );
}

function isUpdateCustomEditorInputPayload(value: unknown): value is {
  id: string;
  name: string;
  cli?: string;
  appPath?: string;
  extensionsPath: string;
  settingsPath: string;
} {
  return isCustomEditorInputPayload(value) && typeof (value as { id?: unknown }).id === "string";
}

function isDeleteCustomEditorInputPayload(value: unknown): value is {
  id: string;
} {
  return !!value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string";
}

function slugifyName(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "editor"
  );
}

function createDemoCustomEditor(payload: {
  name: string;
  cli?: string;
  appPath?: string;
  extensionsPath: string;
  settingsPath: string;
}): ResolvedEditor {
  const usedSlugs = new Set(getDemoEditors().map((editor) => editor.slug));
  const baseSlug = `custom-${slugifyName(payload.name)}`;
  let slug = baseSlug;
  let index = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return {
    id: crypto.randomUUID(),
    name: payload.name.trim(),
    displayName: payload.name.trim(),
    slug,
    cli: payload.cli?.trim() ?? "",
    badgeColor: "slate",
    extensionsPath: payload.extensionsPath.trim(),
    settingsPath: payload.settingsPath.trim(),
    cliAvailable: Boolean(payload.cli?.trim()),
    extensionsExist: true,
    settingsExist: true,
    appPath: payload.appPath?.trim() || undefined,
    iconStatus: APP_ICON_STATUS.FALLBACK,
    source: EDITOR_SOURCE.CUSTOM
  };
}

function findDemoCustomEditorIndex(id: string): number {
  return demoCustomEditors.findIndex((editor) => editor.id === id);
}

function updateDemoCustomEditor(payload: {
  id: string;
  name: string;
  cli?: string;
  appPath?: string;
  extensionsPath: string;
  settingsPath: string;
}): UpdateCustomEditorResult {
  const index = findDemoCustomEditorIndex(payload.id);

  if (index < 0) {
    return {
      success: false,
      errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_NOT_FOUND
    };
  }

  const current = demoCustomEditors[index];
  const nextEditor: ResolvedEditor = {
    ...current,
    name: payload.name.trim(),
    displayName: payload.name.trim(),
    cli: payload.cli?.trim() ?? "",
    cliAvailable: Boolean(payload.cli?.trim()),
    appPath: payload.appPath?.trim() || undefined,
    extensionsPath: payload.extensionsPath.trim(),
    settingsPath: payload.settingsPath.trim()
  };

  demoCustomEditors[index] = nextEditor;
  const currentExtensions = demoEditorExtensionsBySlug.get(current.slug);
  if (currentExtensions) {
    demoEditorExtensionsBySlug.set(current.slug, {
      ...currentExtensions,
      editorName: nextEditor.displayName
    });
  }

  return {
    success: true,
    editor: { ...nextEditor }
  };
}

function deleteDemoCustomEditor(payload: { id: string }): DeleteCustomEditorResult {
  const index = findDemoCustomEditorIndex(payload.id);

  if (index < 0) {
    return {
      success: false,
      id: payload.id,
      errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_NOT_FOUND
    };
  }

  const [removed] = demoCustomEditors.splice(index, 1);
  demoEditorExtensionsBySlug.delete(removed.slug);

  return {
    success: true,
    id: payload.id,
    slug: removed.slug,
    displayName: removed.displayName
  };
}

const defaultResponses: Record<SupportedCommand, unknown> = {
  [SUPPORTED_COMMAND.GET_MACHINE_IDENTITY]: demoMachineIdentity,
  [SUPPORTED_COMMAND.DETECT_EDITORS]: builtInDemoEditors,
  [SUPPORTED_COMMAND.PICK_CUSTOM_EDITOR_APP_PATH]: {
    canceled: false,
    appPath: "/Applications/Demo Editor.app",
    suggestedName: "Demo Editor",
    iconStatus: APP_ICON_STATUS.FALLBACK
  } satisfies PickCustomEditorAppResult,
  [SUPPORTED_COMMAND.PICK_CUSTOM_EDITOR_EXTENSIONS_PATH]: {
    canceled: false,
    path: "/Users/demo/.demo-editor/extensions"
  } satisfies PickCustomEditorPathResult,
  [SUPPORTED_COMMAND.PICK_CUSTOM_EDITOR_SETTINGS_PATH]: {
    canceled: false,
    path: "/Users/demo/.demo-editor/User/settings.json"
  } satisfies PickCustomEditorPathResult,
  [SUPPORTED_COMMAND.ADD_CUSTOM_EDITOR]: {
    success: true,
    editor: undefined
  } satisfies AddCustomEditorResult,
  [SUPPORTED_COMMAND.UPDATE_CUSTOM_EDITOR]: {
    success: true,
    editor: undefined
  } satisfies UpdateCustomEditorResult,
  [SUPPORTED_COMMAND.DELETE_CUSTOM_EDITOR]: {
    success: true,
    id: "demo-custom-editor"
  } satisfies DeleteCustomEditorResult,
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

function isSyncPayload(value: unknown): value is JsonObject & { actions: Array<Record<string, unknown>> } {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Array.isArray((value as { actions?: unknown }).actions);
}

function isEditorSlugPayload(value: unknown): value is JsonObject & { editorSlug: string } {
  return !!value && typeof value === "object" && typeof (value as { editorSlug?: unknown }).editorSlug === "string";
}

function isSetEditorExtensionDisabledPayload(value: unknown): value is JsonObject & { editorSlug: string; extensionId: string; disabled: boolean } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { editorSlug?: unknown }).editorSlug === "string" &&
    typeof (value as { extensionId?: unknown }).extensionId === "string" &&
    typeof (value as { disabled?: unknown }).disabled === "boolean"
  );
}

function isUninstallEditorExtensionPayload(value: unknown): value is JsonObject & { editorSlug: string; extensionId: string } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { editorSlug?: unknown }).editorSlug === "string" &&
    typeof (value as { extensionId?: unknown }).extensionId === "string"
  );
}

function getDemoEditorName(editorSlug: string): string {
  return getDemoEditors().find((editor) => editor.slug === editorSlug)?.displayName ?? editorSlug;
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
    ...(targetExists
      ? {}
      : {
          errorKey: RUNTIME_MESSAGE_KEY.EXTENSION_NOT_INSTALLED,
          errorParams: {
            extensionId: params.extensionId
          }
        })
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
    ...(targetExists
      ? {}
      : {
          errorKey: RUNTIME_MESSAGE_KEY.EXTENSION_NOT_INSTALLED,
          errorParams: {
            extensionId: params.extensionId
          }
        })
  };
}

export function resolveDemoResponse<T>(command: string, payload?: unknown): T | undefined {
  if (command === SUPPORTED_COMMAND.DETECT_EDITORS) {
    return getDemoEditors() as T;
  }

  if (command === SUPPORTED_COMMAND.ADD_CUSTOM_EDITOR && isCustomEditorInputPayload(payload)) {
    const nextEditor = createDemoCustomEditor(payload);
    demoCustomEditors.push(nextEditor);
    demoEditorExtensionsBySlug.set(nextEditor.slug, {
      editorSlug: nextEditor.slug,
      editorName: nextEditor.displayName,
      items: []
    });

    return {
      success: true,
      editor: { ...nextEditor }
    } as T;
  }

  if (command === SUPPORTED_COMMAND.UPDATE_CUSTOM_EDITOR && isUpdateCustomEditorInputPayload(payload)) {
    return updateDemoCustomEditor(payload) as T;
  }

  if (command === SUPPORTED_COMMAND.DELETE_CUSTOM_EDITOR && isDeleteCustomEditorInputPayload(payload)) {
    return deleteDemoCustomEditor(payload) as T;
  }

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
