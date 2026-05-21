import { dialog, ipcMain } from "electron";
import { RUNTIME_MESSAGE_KEY } from "@vcser/core/i18n";
import { SUPPORTED_COMMAND } from "@vcser/core/ipc";
import {
  type AddCustomEditorResult,
  type CustomEditorInput,
  type PickCustomEditorAppResult,
  type PickCustomEditorPathResult
} from "@vcser/core/types";
import { hasStringProperty, isRecord } from "@vcser/core/typeGuards";
import { appendCustomEditor } from "../customEditors/store";
import { resolveAppBundleSelection } from "../editors/appBundle";
import { resolveAllEditors } from "../editors/resolveAllEditors";

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

function normalizeRequiredString(value: string) {
  return value.trim();
}

function normalizeOptionalString(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
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
    if (!isCustomEditorInput(payload)) {
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

    if (normalized.appPath) {
      const selection = await resolveAppBundleSelection(normalized.appPath);

      if (selection.unsupported) {
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

    if (samePathEditor) {
      return {
        success: false,
        errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_ALREADY_EXISTS,
        errorParams: {
          editorName: samePathEditor.displayName
        }
      } satisfies AddCustomEditorResult;
    }

    try {
      const record = appendCustomEditor(
        normalized,
        editors.map((editor) => editor.slug)
      );
      const nextEditors = await resolveAllEditors();
      const created = nextEditors.find((editor) => editor.slug === record.slug);

      return {
        success: true,
        editor: created
      } satisfies AddCustomEditorResult;
    } catch (error) {
      return {
        success: false,
        errorKey: RUNTIME_MESSAGE_KEY.CUSTOM_EDITOR_PERSIST_FAILED,
        error: error instanceof Error ? error.message : String(error)
      } satisfies AddCustomEditorResult;
    }
  });
}
