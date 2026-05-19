import { ipcMain } from "electron";
import { RUNTIME_MESSAGE_KEY } from "@vcser/core/i18n";
import { SUPPORTED_COMMAND } from "@vcser/core/ipc";
import { EDITOR_EXTENSION_ACTION, type EditorExtensionMutationResult, type EditorExtensionsResult } from "@vcser/core/types";
import { detectEditors } from "@vcser/core/editors/detect";
import { listEditorExtensions, setEditorExtensionDisabled, uninstallEditorExtension } from "@vcser/core/editors/extensions";
import { hasBooleanProperty, hasStringProperty, isRecord } from "@vcser/core/typeGuards";

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
  return hasStringProperty(value, "editorSlug");
}

function isSetEditorExtensionDisabledPayload(value: unknown): value is SetEditorExtensionDisabledPayload {
  return (
    isRecord(value) && hasStringProperty(value, "editorSlug") && hasStringProperty(value, "extensionId") && hasBooleanProperty(value, "disabled")
  );
}

function isUninstallEditorExtensionPayload(value: unknown): value is UninstallEditorExtensionPayload {
  return isRecord(value) && hasStringProperty(value, "editorSlug") && hasStringProperty(value, "extensionId");
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
        errorKey: RUNTIME_MESSAGE_KEY.INVALID_DISABLE_PAYLOAD
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
        errorKey: RUNTIME_MESSAGE_KEY.EDITOR_UNAVAILABLE
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
        errorKey: RUNTIME_MESSAGE_KEY.STATE_DATABASE_NOT_WRITABLE
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
        errorKey: RUNTIME_MESSAGE_KEY.INVALID_UNINSTALL_PAYLOAD
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
        errorKey: RUNTIME_MESSAGE_KEY.EDITOR_UNAVAILABLE
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
        ...(error instanceof Error && error.message === `Extension ${payload.extensionId} is not installed`
          ? {
              errorKey: RUNTIME_MESSAGE_KEY.EXTENSION_NOT_INSTALLED,
              errorParams: {
                extensionId: payload.extensionId
              }
            }
          : { error: error instanceof Error ? error.message : String(error) })
      } satisfies EditorExtensionMutationResult;
    }
  });
}
