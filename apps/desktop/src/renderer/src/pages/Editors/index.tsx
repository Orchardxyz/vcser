import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Plus, FolderOpen, FileText, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/Button";
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
const CUSTOM_EDITOR_SOURCE = "custom";

function resolveRuntimeMessage(
  t: (key: string, options?: Record<string, string | number | boolean>) => string,
  errorKey: string | undefined,
  errorMessage: string | undefined,
  fallbackKey: string,
  errorParams?: Record<string, string | number | boolean>
) {
  return errorKey ? t(errorKey, errorParams ?? {}) : (errorMessage ?? t(fallbackKey));
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

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [lastSuggestedName, setLastSuggestedName] = useState<string | null>(null);
  const openModal = useCallback(() => {
    reset(customEditorDefaultValues);
    setLastSuggestedName(null);
    setAddModalOpen(true);
  }, [reset]);
  const closeModal = useCallback(() => {
    reset(customEditorDefaultValues);
    setLastSuggestedName(null);
    setAddModalOpen(false);
  }, [reset]);

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
      try {
        const rawResult = await invoke<unknown>(ADD_CUSTOM_EDITOR_COMMAND, values);

        if (!rawResult || typeof rawResult !== "object" || Array.isArray(rawResult)) {
          toast.error(t("editors.toasts.addFailed"), t("runtime.customEditorPersistFailed"));
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
          toast.error(
            t("editors.toasts.addFailed"),
            resolveRuntimeMessage(t, errorKey, errorMessage, "runtime.customEditorPersistFailed", errorParams)
          );
          return;
        }

        await loadEditors();
        closeModal();
        toast.success(t("editors.toasts.added"), editorDisplayName ?? values.name.trim());
      } catch (error) {
        toast.error(t("editors.toasts.addFailed"), error instanceof Error ? error.message : String(error));
      }
    },
    [closeModal, loadEditors, t]
  );

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
        {editors.map((editor) => (
          <Link
            key={editor.slug}
            to={getEditorExtensionsRoute(editor.slug)}
            className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 transition-shadow outline-none hover:shadow-sm focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <div className="flex items-start justify-between">
              <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.ICON} />
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
            </div>

            <div>
              <p className="text-xl font-semibold leading-7 text-slate-950">{editor.displayName ?? editor.name}</p>
              {editor.appPath && <p className="mt-0.5 text-xs text-slate-400 truncate">{editor.appPath}</p>}
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
        ))}

        <button
          type="button"
          onClick={openModal}
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
        open={addModalOpen}
        title={t("editors.modal.title")}
        onClose={closeModal}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={closeModal}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" form="add-custom-editor-form" disabled={isSubmitting}>
              {t("editors.modal.addEditor")}
            </Button>
          </div>
        }
      >
        <form
          id="add-custom-editor-form"
          onSubmit={(e) => {
            handleSubmit(onSubmit)(e);
          }}
          noValidate
        >
          <div className="grid gap-4">
            <p className="text-sm text-slate-500">{t("editors.modal.description")}</p>
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
    </div>
  );
}
