import { ipcMain } from "electron";
import { SUPPORTED_COMMAND } from "@shared/ipc";
import { EDITOR_EXTENSION_ACTION, type EditorExtensionMutationResult, type EditorExtensionsResult } from "@shared/types";
import { detectEditors } from "../editors/detect";
import { setEditorExtensionDisabled, uninstallEditorExtension } from "../editors/extensionManagement";
import { listEditorExtensions } from "../editors/extensions";

interface EditorSlugPayload {
  editorSlug: string;
}

interface SetEditorExtensionDisabledPayload extends EditorSlugPayload {
  extensionId: string;
  disabled: boolean;
}

interface UninstallEditorExtensionPayload extends EditorSlugPayload {
  extensionId: string;
}

function isEditorSlugPayload(value: unknown): value is EditorSlugPayload {
  return !!value && typeof value === "object" && typeof (value as EditorSlugPayload).editorSlug === "string";
}

function isSetEditorExtensionDisabledPayload(value: unknown): value is SetEditorExtensionDisabledPayload {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as SetEditorExtensionDisabledPayload).editorSlug === "string" &&
    typeof (value as SetEditorExtensionDisabledPayload).extensionId === "string" &&
    typeof (value as SetEditorExtensionDisabledPayload).disabled === "boolean"
  );
}

function isUninstallEditorExtensionPayload(value: unknown): value is UninstallEditorExtensionPayload {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as UninstallEditorExtensionPayload).editorSlug === "string" &&
    typeof (value as UninstallEditorExtensionPayload).extensionId === "string"
  );
}

function createMissingEditorResult(editorSlug: string): EditorExtensionsResult {
  return {
    editorSlug,
    editorName: editorSlug,
    items: []
  };
}

export function registerEditorExtensionHandlers() {
  ipcMain.handle(SUPPORTED_COMMAND.GET_EDITOR_EXTENSIONS, async (_event, payload: unknown) => {
    if (!isEditorSlugPayload(payload)) {
      return createMissingEditorResult("");
    }

    const detected = await detectEditors();
    const editor = detected.find((item) => item.slug === payload.editorSlug);

    if (!editor) {
      return createMissingEditorResult(payload.editorSlug);
    }

    return {
      editorSlug: editor.slug,
      editorName: editor.displayName,
      items: await listEditorExtensions({
        extensionsPath: editor.extensionsPath,
        stateDbPath: editor.stateDbPath
      })
    } satisfies EditorExtensionsResult;
  });

  ipcMain.handle(SUPPORTED_COMMAND.SET_EDITOR_EXTENSION_DISABLED, async (_event, payload: unknown) => {
    if (!isSetEditorExtensionDisabledPayload(payload)) {
      return {
        action: EDITOR_EXTENSION_ACTION.DISABLE,
        editorSlug: "",
        editorName: "",
        extensionId: "",
        success: false,
        error: "Invalid disable payload"
      } satisfies EditorExtensionMutationResult;
    }

    const detected = await detectEditors();
    const editor = detected.find((item) => item.slug === payload.editorSlug);

    if (!editor) {
      return {
        action: payload.disabled ? EDITOR_EXTENSION_ACTION.DISABLE : EDITOR_EXTENSION_ACTION.ENABLE,
        editorSlug: payload.editorSlug,
        editorName: payload.editorSlug,
        extensionId: payload.extensionId,
        success: false,
        disabled: payload.disabled,
        error: "Editor is no longer available"
      } satisfies EditorExtensionMutationResult;
    }

    if (!editor.stateDbPath) {
      return {
        action: payload.disabled ? EDITOR_EXTENSION_ACTION.DISABLE : EDITOR_EXTENSION_ACTION.ENABLE,
        editorSlug: editor.slug,
        editorName: editor.displayName,
        extensionId: payload.extensionId,
        success: false,
        disabled: payload.disabled,
        error: "This editor does not expose a writable state database"
      } satisfies EditorExtensionMutationResult;
    }

    try {
      const disabled = setEditorExtensionDisabled({
        stateDbPath: editor.stateDbPath,
        extensionId: payload.extensionId,
        disabled: payload.disabled
      });

      return {
        action: disabled ? EDITOR_EXTENSION_ACTION.DISABLE : EDITOR_EXTENSION_ACTION.ENABLE,
        editorSlug: editor.slug,
        editorName: editor.displayName,
        extensionId: payload.extensionId,
        success: true,
        disabled
      } satisfies EditorExtensionMutationResult;
    } catch (error) {
      return {
        action: payload.disabled ? EDITOR_EXTENSION_ACTION.DISABLE : EDITOR_EXTENSION_ACTION.ENABLE,
        editorSlug: editor.slug,
        editorName: editor.displayName,
        extensionId: payload.extensionId,
        success: false,
        disabled: payload.disabled,
        error: error instanceof Error ? error.message : String(error)
      } satisfies EditorExtensionMutationResult;
    }
  });

  ipcMain.handle(SUPPORTED_COMMAND.UNINSTALL_EDITOR_EXTENSION, async (_event, payload: unknown) => {
    if (!isUninstallEditorExtensionPayload(payload)) {
      return {
        action: EDITOR_EXTENSION_ACTION.UNINSTALL,
        editorSlug: "",
        editorName: "",
        extensionId: "",
        success: false,
        error: "Invalid uninstall payload"
      } satisfies EditorExtensionMutationResult;
    }

    const detected = await detectEditors();
    const editor = detected.find((item) => item.slug === payload.editorSlug);

    if (!editor) {
      return {
        action: EDITOR_EXTENSION_ACTION.UNINSTALL,
        editorSlug: payload.editorSlug,
        editorName: payload.editorSlug,
        extensionId: payload.extensionId,
        success: false,
        error: "Editor is no longer available"
      } satisfies EditorExtensionMutationResult;
    }

    try {
      await uninstallEditorExtension({
        extensionsPath: editor.extensionsPath,
        extensionId: payload.extensionId,
        stateDbPath: editor.stateDbPath
      });

      return {
        action: EDITOR_EXTENSION_ACTION.UNINSTALL,
        editorSlug: editor.slug,
        editorName: editor.displayName,
        extensionId: payload.extensionId,
        success: true
      } satisfies EditorExtensionMutationResult;
    } catch (error) {
      return {
        action: EDITOR_EXTENSION_ACTION.UNINSTALL,
        editorSlug: editor.slug,
        editorName: editor.displayName,
        extensionId: payload.extensionId,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      } satisfies EditorExtensionMutationResult;
    }
  });
}
