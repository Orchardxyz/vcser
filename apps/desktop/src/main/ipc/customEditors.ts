import { dialog, ipcMain } from "electron";
import { RUNTIME_MESSAGE_KEY } from "@vcser/core/i18n";
import { SUPPORTED_COMMAND } from "@vcser/core/ipc";
import {
  type AddCustomEditorResult,
  type CustomEditorInput,
  type DeleteCustomEditorInput,
  type DeleteCustomEditorResult,
  type PickCustomEditorAppResult,
  type PickCustomEditorPathResult,
  type UpdateCustomEditorInput,
  type UpdateCustomEditorResult
} from "@vcser/core/types";
import { hasStringProperty, isRecord } from "@vcser/core/typeGuards";
import { appendCustomEditor, CustomEditorStoreError, removeCustomEditor, updateCustomEditor } from "../customEditors/store";
import { resolveAppBundleSelection } from "../editors/appBundle";
import { resolveAllEditors } from "../editors/resolveAllEditors";

function logCustomEditorDebug(message: string, details?: unknown) {
  if (details === undefined) {
    console.info(`[vcser][custom-editor][ipc] ${message}`);
    return;
  }

  console.info(`[vcser][custom-editor][ipc] ${message}`, details);
}

function hasOptionalStringProperty(value: unknown, key: string): boolean {
  return !isRecord(value) || !(key in value) || typeof value[key] === "string";
}

function isCustomEditorInput(value: unknown): value is CustomEditorInput {
  return (
    isRecord(value) &&
    hasStringProperty(value, "name") &&
    hasStringProperty(value, "extensionsPath") &&
    hasStringProperty(value, "settingsPath") &&
    hasOptionalStringProperty(value, "cli") &&
    hasOptionalStringProperty(value, "appPath")
  );
}

function isUpdateCustomEditorInput(value: unknown): value is UpdateCustomEditorInput {
  return isCustomEditorInput(value) && hasStringProperty(value, "id");
}

function isDeleteCustomEditorInput(value: unknown): value is DeleteCustomEditorInput {
  return isRecord(value) && hasStringProperty(value, "id");
}

function normalizeRequiredString(value: string) {
  return value.trim();
}

function normalizeOptionalString(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function isStoreNotFoundError(error: unknown): error is CustomEditorStoreError {
  return error instanceof CustomEditorStoreError && error.code === "custom_editor_not_found";
}

function getAppFilters() {
  if (process.platform === "darwin") {
    return [{ name: "Applications", extensions: ["app"] }];
  }
  if (process.platform === "win32") {
    return [{ name: "Executables", extensions: ["exe"] }];
  }
  return undefined;
}

async function pickPath(params: {
  properties: Array<"openFile" | "openDirectory">;
  title: string;
  filters?: Array<{ name: string; extensions: string[] }>;
}): Promise<PickCustomEditorPathResult> {
  const result = await dialog.showOpenDialog({
    title: params.title,
    properties: params.properties,
    filters: params.filters
  });

  return {
    canceled: result.canceled,
    path: result.canceled ? undefined : result.filePaths[0]
  };
}

export function registerCustomEditorHandlers() {
  ipcMain.handle(SUPPORTED_COMMAND.PICK_CUSTOM_EDITOR_APP_PATH, async () => {
    try {
      const result = await pickPath({
        title: "Select editor application",
        properties: ["openFile"],
        filters: getAppFilters()
      });

      if (result.canceled || !result.path) {
        return { canceled: true } satisfies PickCustomEditorAppResult;
      }

      const selection = await resolveAppBundleSelection(result.path);

      if (selection.unsupported) {
        return {
          canceled: false,
          errorKey: RUNTIME_MESSAGE_KEY.UNSUPPORTED_CUSTOM_EDITOR_APP,
          errorParams: {
            appName: selection.suggestedName
          },
          iconStatus: selection.iconStatus
        } satisfies PickCustomEditorAppResult;
      }

      return {
        canceled: false,
        appPath: selection.appPath,
        suggestedName: selection.suggestedName,
        iconPayload: selection.iconPayload,
        iconStatus: selection.iconStatus
      } satisfies PickCustomEditorAppResult;
    } catch {
      return {
        canceled: true,
        errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_PICKER_UNAVAILABLE
      } satisfies PickCustomEditorAppResult;
    }
  });

  ipcMain.handle(SUPPORTED_COMMAND.PICK_CUSTOM_EDITOR_EXTENSIONS_PATH, async () => {
    return await pickPath({
      title: "Select extensions folder",
      properties: ["openDirectory"]
    });
  });

  ipcMain.handle(SUPPORTED_COMMAND.PICK_CUSTOM_EDITOR_SETTINGS_PATH, async () => {
    return await pickPath({
      title: "Select settings file",
      properties: ["openFile"],
      filters: [{ name: "JSON Files", extensions: ["json"] }]
    });
  });

  ipcMain.handle(SUPPORTED_COMMAND.ADD_CUSTOM_EDITOR, async (_event, payload: unknown) => {
    logCustomEditorDebug("Received add request.", payload);

    if (!isCustomEditorInput(payload)) {
      logCustomEditorDebug("Rejected add request because payload is invalid.");
      return {
        success: false,
        errorKey: RUNTIME_MESSAGE_KEY.INVALID_ADD_CUSTOM_EDITOR_PAYLOAD
      } satisfies AddCustomEditorResult;
    }

    const normalized: CustomEditorInput = {
      name: normalizeRequiredString(payload.name),
      cli: normalizeOptionalString(payload.cli),
      appPath: normalizeOptionalString(payload.appPath),
      extensionsPath: normalizeRequiredString(payload.extensionsPath),
      settingsPath: normalizeRequiredString(payload.settingsPath)
    };
    logCustomEditorDebug("Normalized add payload.", normalized);

    if (normalized.appPath) {
      const selection = await resolveAppBundleSelection(normalized.appPath);
      logCustomEditorDebug("Resolved application bundle selection.", selection);

      if (selection.unsupported) {
        logCustomEditorDebug("Rejected add request because selected application is unsupported.");
        return {
          success: false,
          errorKey: RUNTIME_MESSAGE_KEY.UNSUPPORTED_CUSTOM_EDITOR_APP,
          errorParams: {
            appName: selection.suggestedName
          }
        } satisfies AddCustomEditorResult;
      }
    }

    const editors = await resolveAllEditors();
    const samePathEditor = editors.find(
      (editor) =>
        editor.extensionsPath === normalized.extensionsPath || editor.settingsPath === normalized.settingsPath || editor.name === normalized.name
    );
    logCustomEditorDebug("Resolved editors before add.", {
      count: editors.length,
      editorSlugs: editors.map((editor) => editor.slug)
    });

    if (samePathEditor) {
      logCustomEditorDebug("Rejected add request because an editor already matches the submitted values.", samePathEditor);
      return {
        success: false,
        errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_ALREADY_EXISTS,
        errorParams: {
          editorName: samePathEditor.displayName
        }
      } satisfies AddCustomEditorResult;
    }

    try {
      logCustomEditorDebug("Persisting custom editor.");
      const record = await appendCustomEditor(
        normalized,
        editors.map((editor) => editor.slug)
      );
      logCustomEditorDebug("Persisted custom editor record.", record);
      const nextEditors = await resolveAllEditors();
      const created = nextEditors.find((editor) => editor.slug === record.slug);
      logCustomEditorDebug("Resolved editors after add.", {
        count: nextEditors.length,
        createdEditor: created
      });

      return {
        success: true,
        editor: created
      } satisfies AddCustomEditorResult;
    } catch (error) {
      logCustomEditorDebug("Failed to add custom editor.", error);
      return {
        success: false,
        errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_PERSIST_FAILED,
        error: error instanceof Error ? error.message : String(error)
      } satisfies AddCustomEditorResult;
    }
  });

  ipcMain.handle(SUPPORTED_COMMAND.UPDATE_CUSTOM_EDITOR, async (_event, payload: unknown) => {
    if (!isUpdateCustomEditorInput(payload)) {
      return {
        success: false,
        errorKey: RUNTIME_MESSAGE_KEY.INVALID_UPDATE_CUSTOM_EDITOR_PAYLOAD
      } satisfies UpdateCustomEditorResult;
    }

    const normalized: UpdateCustomEditorInput = {
      id: normalizeRequiredString(payload.id),
      name: normalizeRequiredString(payload.name),
      cli: normalizeOptionalString(payload.cli),
      appPath: normalizeOptionalString(payload.appPath),
      extensionsPath: normalizeRequiredString(payload.extensionsPath),
      settingsPath: normalizeRequiredString(payload.settingsPath)
    };

    if (normalized.appPath) {
      const selection = await resolveAppBundleSelection(normalized.appPath);

      if (selection.unsupported) {
        return {
          success: false,
          errorKey: RUNTIME_MESSAGE_KEY.UNSUPPORTED_CUSTOM_EDITOR_APP,
          errorParams: {
            appName: selection.suggestedName
          }
        } satisfies UpdateCustomEditorResult;
      }
    }

    const editors = await resolveAllEditors();
    const samePathEditor = editors.find(
      (editor) =>
        editor.id !== normalized.id &&
        (editor.extensionsPath === normalized.extensionsPath || editor.settingsPath === normalized.settingsPath || editor.name === normalized.name)
    );

    if (samePathEditor) {
      return {
        success: false,
        errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_ALREADY_EXISTS,
        errorParams: {
          editorName: samePathEditor.displayName
        }
      } satisfies UpdateCustomEditorResult;
    }

    try {
      const record = await updateCustomEditor(normalized);
      const nextEditors = await resolveAllEditors();
      const updated = nextEditors.find((editor) => editor.id === record.id);

      return {
        success: true,
        editor: updated
      } satisfies UpdateCustomEditorResult;
    } catch (error) {
      if (isStoreNotFoundError(error)) {
        return {
          success: false,
          errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_NOT_FOUND
        } satisfies UpdateCustomEditorResult;
      }

      return {
        success: false,
        errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_PERSIST_FAILED,
        error: error instanceof Error ? error.message : String(error)
      } satisfies UpdateCustomEditorResult;
    }
  });

  ipcMain.handle(SUPPORTED_COMMAND.DELETE_CUSTOM_EDITOR, async (_event, payload: unknown) => {
    if (!isDeleteCustomEditorInput(payload)) {
      return {
        success: false,
        id: "",
        errorKey: RUNTIME_MESSAGE_KEY.INVALID_DELETE_CUSTOM_EDITOR_PAYLOAD
      } satisfies DeleteCustomEditorResult;
    }

    const normalizedId = normalizeRequiredString(payload.id);

    try {
      const record = await removeCustomEditor(normalizedId);

      return {
        success: true,
        id: normalizedId,
        slug: record.slug,
        displayName: record.displayName
      } satisfies DeleteCustomEditorResult;
    } catch (error) {
      if (isStoreNotFoundError(error)) {
        return {
          success: false,
          id: normalizedId,
          errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_NOT_FOUND
        } satisfies DeleteCustomEditorResult;
      }

      return {
        success: false,
        id: normalizedId,
        errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_DELETE_FAILED,
        error: error instanceof Error ? error.message : String(error)
      } satisfies DeleteCustomEditorResult;
    }
  });
}
