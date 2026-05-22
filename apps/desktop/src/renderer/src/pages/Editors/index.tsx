import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, FileText, FolderOpen, MoreHorizontal, PencilLine, Plus, Terminal, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ResolvedEditor } from "@/types";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/Button";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { EditorIdentity, EDITOR_IDENTITY_MODE } from "@/components/editor/EditorIdentity";
import { invoke } from "@/ipc";
import { getEditorExtensionsRoute } from "@/routes";
import { useAppStore } from "@/store";
import { toast } from "@/store/toast";
import { createCustomEditorSchema, customEditorDefaultValues, getInputClass, type CustomEditorFormValues } from "./form";
import { EditorsSkeleton } from "./Skeleton";

const PICK_CUSTOM_EDITOR_APP_PATH_COMMAND = "pick_custom_editor_app_path";
const PICK_CUSTOM_EDITOR_EXTENSIONS_PATH_COMMAND = "pick_custom_editor_extensions_path";
const PICK_CUSTOM_EDITOR_SETTINGS_PATH_COMMAND = "pick_custom_editor_settings_path";
const ADD_CUSTOM_EDITOR_COMMAND = "add_custom_editor";
const UPDATE_CUSTOM_EDITOR_COMMAND = "update_custom_editor";
const DELETE_CUSTOM_EDITOR_COMMAND = "delete_custom_editor";
const CUSTOM_EDITOR_SOURCE = "custom";

type CustomEditorModalMode = "create" | "edit";
type EditableCustomEditor = ResolvedEditor & { id: string };

function logCustomEditorDebug(message: string, details?: unknown) {
  if (details === undefined) {
    console.info(`[vcser][custom-editor][renderer] ${message}`);
    return;
  }

  console.info(`[vcser][custom-editor][renderer] ${message}`, details);
}

function resolveRuntimeMessage(
  t: (key: string, options?: Record<string, string | number | boolean>) => string,
  errorKey: string | undefined,
  errorMessage: string | undefined,
  fallbackKey: string,
  errorParams?: Record<string, string | number | boolean>
) {
  return errorKey ? t(errorKey, errorParams ?? {}) : (errorMessage ?? t(fallbackKey));
}

function isEditableCustomEditor(editor: ResolvedEditor): editor is EditableCustomEditor {
  return editor.source === CUSTOM_EDITOR_SOURCE && typeof editor.id === "string" && editor.id.trim().length > 0;
}

function toFormValues(editor: ResolvedEditor): CustomEditorFormValues {
  return {
    appPath: editor.appPath ?? "",
    name: editor.displayName ?? editor.name,
    cli: editor.cli ?? "",
    extensionsPath: editor.extensionsPath,
    settingsPath: editor.settingsPath
  };
}

export function Editors() {
  const { t } = useTranslation();
  const editors = useAppStore((s) => s.editors);
  const editorsLoading = useAppStore((s) => s.editorsLoading);
  const loadEditors = useAppStore((s) => s.loadEditors);

  const schema = useMemo(() => createCustomEditorSchema(t), [t]);

  const {
    register,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CustomEditorFormValues>({
    resolver: zodResolver(schema),
    defaultValues: customEditorDefaultValues,
    mode: "onBlur",
    reValidateMode: "onChange"
  });

  const [customEditorModalMode, setCustomEditorModalMode] = useState<CustomEditorModalMode>("create");
  const [customEditorModalOpen, setCustomEditorModalOpen] = useState(false);
  const [editingEditor, setEditingEditor] = useState<EditableCustomEditor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EditableCustomEditor | null>(null);
  const [lastSuggestedName, setLastSuggestedName] = useState<string | null>(null);

  const openCreateModal = useCallback(() => {
    reset(customEditorDefaultValues);
    setLastSuggestedName(null);
    setEditingEditor(null);
    setCustomEditorModalMode("create");
    setCustomEditorModalOpen(true);
  }, [reset]);

  const openEditModal = useCallback(
    (editor: EditableCustomEditor) => {
      reset(toFormValues(editor));
      setLastSuggestedName(null);
      setEditingEditor(editor);
      setCustomEditorModalMode("edit");
      setCustomEditorModalOpen(true);
    },
    [reset]
  );

  const closeCustomEditorModal = useCallback(() => {
    reset(customEditorDefaultValues);
    setLastSuggestedName(null);
    setEditingEditor(null);
    setCustomEditorModalMode("create");
    setCustomEditorModalOpen(false);
  }, [reset]);

  const closeDeleteModal = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handlePickAppPath = useCallback(async () => {
    try {
      const rawResult = await invoke<unknown>(PICK_CUSTOM_EDITOR_APP_PATH_COMMAND);

      if (!rawResult || typeof rawResult !== "object" || Array.isArray(rawResult)) {
        return;
      }

      const result = rawResult as Record<string, unknown>;
      const errorKey = typeof result.errorKey === "string" ? result.errorKey : undefined;
      const errorMessage = typeof result.error === "string" ? result.error : undefined;
      const canceled = result.canceled === true;
      const appPath = typeof result.appPath === "string" ? result.appPath : undefined;
      const suggestedName = typeof result.suggestedName === "string" ? result.suggestedName.trim() : undefined;
      const errorParams =
        result.errorParams && typeof result.errorParams === "object" && !Array.isArray(result.errorParams)
          ? (result.errorParams as Record<string, string | number | boolean>)
          : undefined;

      if (errorKey || errorMessage) {
        toast.error(
          t("editors.toasts.pickerFailed"),
          resolveRuntimeMessage(t, errorKey, errorMessage, "runtime.customEditorPickerUnavailable", errorParams)
        );
        return;
      }

      if (canceled || !appPath) {
        return;
      }

      setValue("appPath", appPath, { shouldDirty: true, shouldTouch: true, shouldValidate: true });

      const currentName = getValues("name")?.trim();
      const shouldOverwriteName = !currentName || (!!lastSuggestedName && currentName === lastSuggestedName);

      if (suggestedName && shouldOverwriteName) {
        setValue("name", suggestedName, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      }

      if (suggestedName) {
        setLastSuggestedName(suggestedName);
      }
    } catch {
      toast.error(t("editors.toasts.pickerFailed"), t("runtime.customEditorPickerUnavailable"));
    }
  }, [getValues, lastSuggestedName, setValue, t]);

  const handlePickPath = useCallback(
    async (command: string, field: "extensionsPath" | "settingsPath") => {
      try {
        const rawResult = await invoke<unknown>(command);

        if (!rawResult || typeof rawResult !== "object" || Array.isArray(rawResult)) {
          return;
        }

        const result = rawResult as Record<string, unknown>;
        const canceled = result.canceled === true;
        const pathValue = typeof result.path === "string" ? result.path : undefined;

        if (canceled || !pathValue) {
          return;
        }

        setValue(field, pathValue, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
      } catch {
        toast.error(t("editors.toasts.pickerFailed"), t("runtime.customEditorPickerUnavailable"));
      }
    },
    [setValue, t]
  );

  const onSubmit = useCallback(
    async (values: CustomEditorFormValues) => {
      const isEditing = customEditorModalMode === "edit";
      const actionFailedKey = isEditing ? "editors.toasts.updateFailed" : "editors.toasts.addFailed";

      try {
        const payload = isEditing && editingEditor ? { id: editingEditor.id, ...values } : values;
        const command = isEditing ? UPDATE_CUSTOM_EDITOR_COMMAND : ADD_CUSTOM_EDITOR_COMMAND;
        logCustomEditorDebug("Submitting custom editor request.", {
          command,
          payload
        });
        const rawResult = await invoke<unknown>(command, payload);
        logCustomEditorDebug("Received custom editor response.", rawResult);

        if (!rawResult || typeof rawResult !== "object" || Array.isArray(rawResult)) {
          logCustomEditorDebug("Custom editor response is not an object.", rawResult);
          toast.error(actionFailedKey ? t(actionFailedKey) : t("editors.toasts.addFailed"), t("runtime.customEditorPersistFailed"));
          return;
        }

        const result = rawResult as Record<string, unknown>;
        const success = result.success === true;
        const errorKey = typeof result.errorKey === "string" ? result.errorKey : undefined;
        const errorMessage = typeof result.error === "string" ? result.error : undefined;
        const errorParams =
          result.errorParams && typeof result.errorParams === "object" && !Array.isArray(result.errorParams)
            ? (result.errorParams as Record<string, string | number | boolean>)
            : undefined;
        const editorDisplayName =
          result.editor &&
          typeof result.editor === "object" &&
          !Array.isArray(result.editor) &&
          typeof (result.editor as { displayName?: unknown }).displayName === "string"
            ? ((result.editor as { displayName?: string }).displayName ?? undefined)
            : undefined;

        if (!success) {
          logCustomEditorDebug("Custom editor request failed.", {
            errorKey,
            errorMessage,
            errorParams
          });
          toast.error(t(actionFailedKey), resolveRuntimeMessage(t, errorKey, errorMessage, "runtime.customEditorPersistFailed", errorParams));
          return;
        }

        logCustomEditorDebug("Custom editor request succeeded.", {
          editorDisplayName
        });
        await loadEditors();
        closeCustomEditorModal();
        toast.success(t(isEditing ? "editors.toasts.updated" : "editors.toasts.added"), editorDisplayName ?? values.name.trim());
      } catch (error) {
        logCustomEditorDebug("Custom editor submit threw an exception.", error);
        toast.error(t(actionFailedKey), error instanceof Error ? error.message : String(error));
      }
    },
    [closeCustomEditorModal, customEditorModalMode, editingEditor, loadEditors, t]
  );

  const handleDeleteEditor = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const rawResult = await invoke<unknown>(DELETE_CUSTOM_EDITOR_COMMAND, { id: deleteTarget.id });

      if (!rawResult || typeof rawResult !== "object" || Array.isArray(rawResult)) {
        toast.error(t("editors.toasts.deleteFailed"), t("runtime.customEditorDeleteFailed"));
        return;
      }

      const result = rawResult as Record<string, unknown>;
      const success = result.success === true;
      const errorKey = typeof result.errorKey === "string" ? result.errorKey : undefined;
      const errorMessage = typeof result.error === "string" ? result.error : undefined;
      const errorParams =
        result.errorParams && typeof result.errorParams === "object" && !Array.isArray(result.errorParams)
          ? (result.errorParams as Record<string, string | number | boolean>)
          : undefined;

      if (!success) {
        toast.error(
          t("editors.toasts.deleteFailed"),
          resolveRuntimeMessage(t, errorKey, errorMessage, "runtime.customEditorDeleteFailed", errorParams)
        );
        return;
      }

      await loadEditors();
      closeDeleteModal();
      toast.success(t("editors.toasts.deleted"), deleteTarget.displayName ?? deleteTarget.name);
    } catch (error) {
      toast.error(t("editors.toasts.deleteFailed"), error instanceof Error ? error.message : String(error));
    }
  }, [closeDeleteModal, deleteTarget, loadEditors, t]);

  function renderEditorCard(editor: ResolvedEditor) {
    const customEditor = isEditableCustomEditor(editor) ? editor : null;

    return (
      <div key={editor.slug} className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.ICON} />

          <div className="flex items-center gap-2">
            <span
              aria-label={editor.source === CUSTOM_EDITOR_SOURCE ? t("editors.custom") : t("editors.detected")}
              title={editor.source === CUSTOM_EDITOR_SOURCE ? t("editors.custom") : t("editors.detected")}
              className={
                editor.source === CUSTOM_EDITOR_SOURCE
                  ? "inline-flex rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700"
                  : "inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600"
              }
            >
              {editor.source === CUSTOM_EDITOR_SOURCE ? t("editors.custom") : <BadgeCheck size={14} strokeWidth={1.75} />}
            </span>

            {customEditor && (
              <DropdownMenu
                trigger={
                  <Button
                    variant={BUTTON_VARIANT.GHOST}
                    size={BUTTON_SIZE.ICON_SM}
                    className="rounded-full"
                    aria-label={t("editors.actions.openMenu")}
                  >
                    <MoreHorizontal size={16} />
                  </Button>
                }
                options={[
                  {
                    key: "edit",
                    label: t("editors.actions.edit"),
                    icon: <PencilLine size={14} />,
                    onSelect: () => {
                      openEditModal(customEditor);
                    }
                  },
                  {
                    key: "delete",
                    label: t("editors.actions.delete"),
                    icon: <Trash2 size={14} />,
                    tone: "danger",
                    onSelect: () => {
                      setDeleteTarget(customEditor);
                    }
                  }
                ]}
              />
            )}
          </div>
        </div>

        <Link
          to={getEditorExtensionsRoute(editor.slug)}
          className="flex flex-col gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <div>
            <p className="text-xl font-semibold leading-7 text-slate-950">{editor.displayName ?? editor.name}</p>
            {editor.appPath && <p className="mt-0.5 truncate text-xs text-slate-400">{editor.appPath}</p>}
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {editor.cliAvailable && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-1">
                <Terminal size={11} />
                {editor.cli}
              </span>
            )}
            {editor.extensionsExist && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-1">
                <FileText size={11} />
                {t("editors.extensions")}
              </span>
            )}
            {editor.settingsExist && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-50 px-2 py-1">
                <FileText size={11} />
                {t("editors.settings")}
              </span>
            )}
          </div>
        </Link>
      </div>
    );
  }

  function renderContent() {
    if (editorsLoading) return <EditorsSkeleton />;
    if (editors.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-200 py-16 text-slate-400">
          <FolderOpen size={32} strokeWidth={1.5} />
          <p className="text-sm font-medium">{t("editors.emptyTitle")}</p>
          <p className="text-xs text-slate-400">{t("editors.emptyDescription")}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {editors.map(renderEditorCard)}

        <button
          type="button"
          onClick={openCreateModal}
          className="flex min-h-50 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-transparent p-5 text-slate-400 transition-colors outline-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <Plus size={22} strokeWidth={1.5} />
          <span className="text-sm font-medium">{t("editors.addOtherEditor")}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-[30px] font-bold leading-9 text-slate-950">{t("editors.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("editors.description")}</p>
      </div>

      {renderContent()}

      <BaseModal
        open={customEditorModalOpen}
        title={t(customEditorModalMode === "edit" ? "editors.modal.editTitle" : "editors.modal.title")}
        onClose={closeCustomEditorModal}
        maskClosable={false}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={closeCustomEditorModal}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="custom-editor-form" disabled={isSubmitting}>
              {t(customEditorModalMode === "edit" ? "editors.modal.saveEditor" : "editors.modal.addEditor")}
            </Button>
          </div>
        }
      >
        <form
          id="custom-editor-form"
          onSubmit={(event) => {
            handleSubmit(onSubmit)(event);
          }}
          noValidate
        >
          <div className="grid gap-4">
            <p className="text-sm text-slate-500">
              {t(customEditorModalMode === "edit" ? "editors.modal.editDescription" : "editors.modal.description")}
            </p>
            <label className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-700">{t("editors.modal.appPath")}</span>
                <Button
                  variant={BUTTON_VARIANT.SECONDARY}
                  size={BUTTON_SIZE.SM}
                  onClick={() => {
                    handlePickAppPath().catch(() => undefined);
                  }}
                  disabled={isSubmitting}
                >
                  {t("editors.modal.browseApp")}
                </Button>
              </div>
              <input type="text" placeholder={t("editors.modal.placeholderAppPath")} className={getInputClass(false)} {...register("appPath")} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700">{t("editors.modal.name")}</span>
                <input
                  type="text"
                  placeholder={t("editors.modal.placeholderName")}
                  className={getInputClass(!!errors.name)}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  {...register("name")}
                />
                {errors.name && (
                  <p id="name-error" className="text-xs text-red-500" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700">{t("editors.modal.cliCommand")}</span>
                <input
                  type="text"
                  placeholder={t("editors.modal.placeholderCli")}
                  className={getInputClass(!!errors.cli)}
                  aria-invalid={!!errors.cli}
                  aria-describedby={errors.cli ? "cli-error" : undefined}
                  {...register("cli")}
                />
                {errors.cli && (
                  <p id="cli-error" className="text-xs text-red-500" role="alert">
                    {errors.cli.message}
                  </p>
                )}
              </label>
            </div>
            <label className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-700">{t("editors.modal.extensionsPath")}</span>
                <Button
                  variant={BUTTON_VARIANT.SECONDARY}
                  size={BUTTON_SIZE.SM}
                  onClick={() => {
                    handlePickPath(PICK_CUSTOM_EDITOR_EXTENSIONS_PATH_COMMAND, "extensionsPath").catch(() => undefined);
                  }}
                  disabled={isSubmitting}
                >
                  {t("editors.modal.browseFolder")}
                </Button>
              </div>
              <input
                type="text"
                placeholder={t("editors.modal.placeholderExtensionsPath")}
                className={getInputClass(!!errors.extensionsPath)}
                aria-invalid={!!errors.extensionsPath}
                aria-describedby={errors.extensionsPath ? "extensionsPath-error" : undefined}
                {...register("extensionsPath")}
              />
              {errors.extensionsPath && (
                <p id="extensionsPath-error" className="text-xs text-red-500" role="alert">
                  {errors.extensionsPath.message}
                </p>
              )}
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-700">{t("editors.modal.settingsPath")}</span>
                <Button
                  variant={BUTTON_VARIANT.SECONDARY}
                  size={BUTTON_SIZE.SM}
                  onClick={() => {
                    handlePickPath(PICK_CUSTOM_EDITOR_SETTINGS_PATH_COMMAND, "settingsPath").catch(() => undefined);
                  }}
                  disabled={isSubmitting}
                >
                  {t("editors.modal.browseFile")}
                </Button>
              </div>
              <input
                type="text"
                placeholder={t("editors.modal.placeholderSettingsPath")}
                className={getInputClass(!!errors.settingsPath)}
                aria-invalid={!!errors.settingsPath}
                aria-describedby={errors.settingsPath ? "settingsPath-error" : undefined}
                {...register("settingsPath")}
              />
              {errors.settingsPath && (
                <p id="settingsPath-error" className="text-xs text-red-500" role="alert">
                  {errors.settingsPath.message}
                </p>
              )}
            </label>
          </div>
        </form>
      </BaseModal>

      <BaseModal
        open={Boolean(deleteTarget)}
        title={t("editors.deleteModal.title")}
        onClose={closeDeleteModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={closeDeleteModal}>
              {t("common.cancel")}
            </Button>
            <Button
              variant={BUTTON_VARIANT.SECONDARY}
              className="border-red-200 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200"
              onClick={() => {
                handleDeleteEditor().catch(() => undefined);
              }}
            >
              {t("editors.actions.delete")}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 text-sm text-slate-600">
          <p>
            {t("editors.deleteModal.description", {
              editor: deleteTarget?.displayName ?? deleteTarget?.name ?? ""
            })}
          </p>
          <p>{t("editors.deleteModal.note")}</p>
        </div>
      </BaseModal>
    </div>
  );
}
