import { z } from "zod";
import type { TFunction } from "i18next";
import type { CustomEditorInput } from "@/types";

export const customEditorDefaultValues: CustomEditorInput = {
  appPath: "",
  name: "",
  cli: "",
  extensionsPath: "",
  settingsPath: ""
};

export function createCustomEditorSchema(t: TFunction<"translation", undefined>) {
  return z.object({
    appPath: z.string().trim(),
    name: z.string().trim().min(1, t("editors.modal.validation.nameRequired")).min(2, t("editors.modal.validation.nameTooShort")),
    cli: z.string().trim(),
    extensionsPath: z.string().trim().min(1, t("editors.modal.validation.extensionsPathRequired")),
    settingsPath: z.string().trim().min(1, t("editors.modal.validation.settingsPathRequired"))
  });
}

export type CustomEditorFormValues = z.infer<ReturnType<typeof createCustomEditorSchema>>;

export function getInputClass(hasError: boolean) {
  const base =
    "rounded-lg border bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white";
  if (hasError) {
    return `${base} border-red-300 focus-visible:ring-red-500/20`;
  }
  return `${base} border-slate-200 focus-visible:ring-slate-950/15`;
}
