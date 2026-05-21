import { useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Plus, FolderOpen, FileText, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button, BUTTON_VARIANT } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EditorIdentity, EDITOR_IDENTITY_MODE } from "@/components/editor/EditorIdentity";
import { getEditorExtensionsRoute } from "@/routes";
import { useAppStore } from "@/store";
import { createCustomEditorSchema, customEditorDefaultValues, getInputClass } from "./Editors.form";
import type { CustomEditorInput } from "@/types";

function EditorsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Skeleton className="h-11 w-11 rounded-lg" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Editors() {
  const { t } = useTranslation();
  const editors = useAppStore((s) => s.editors);
  const editorsLoading = useAppStore((s) => s.editorsLoading);

  const schema = useMemo(() => createCustomEditorSchema(t), [t]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CustomEditorInput>({
    resolver: zodResolver(schema),
    defaultValues: customEditorDefaultValues,
    mode: "onBlur",
    reValidateMode: "onChange"
  });

  const [addModalOpen, setAddModalOpen] = useState(false);

  const openModal = useCallback(() => {
    reset(customEditorDefaultValues);
    setAddModalOpen(true);
  }, [reset]);

  const closeModal = useCallback(() => {
    reset(customEditorDefaultValues);
    setAddModalOpen(false);
  }, [reset]);

  const onSubmit = useCallback((_values: CustomEditorInput) => {
    // TODO: Wire to store action / IPC for persistence (Phase 2)
  }, []);

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
                aria-label={t("editors.detected")}
                title={t("editors.detected")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-blue-600"
              >
                <BadgeCheck size={14} strokeWidth={1.75} />
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
              <span className="font-medium text-slate-700">{t("editors.modal.extensionsPath")}</span>
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
              <span className="font-medium text-slate-700">{t("editors.modal.settingsPath")}</span>
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
