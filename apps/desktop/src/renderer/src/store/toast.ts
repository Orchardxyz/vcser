import type { ValueOf } from "type-fest";
import { toast as sonnerToast, type ExternalToast } from "sonner";

export const TOAST_VARIANT = {
  SUCCESS: "success",
  ERROR: "error",
  INFO: "info"
} as const;

export type ToastVariant = ValueOf<typeof TOAST_VARIANT>;

export const TOAST_DURATION_MS = {
  [TOAST_VARIANT.SUCCESS]: 3200,
  [TOAST_VARIANT.ERROR]: 5600,
  [TOAST_VARIANT.INFO]: 3800
} satisfies Record<ToastVariant, number>;

export interface ToastInput {
  id?: string | number;
  variant?: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
}

function buildToastOptions({ id, description, durationMs }: ToastInput): ExternalToast {
  return {
    id,
    description,
    duration: durationMs,
    closeButton: true
  };
}

export function showToast(toast: ToastInput) {
  const variant = toast.variant ?? TOAST_VARIANT.INFO;
  const options = buildToastOptions({ ...toast, durationMs: toast.durationMs ?? TOAST_DURATION_MS[variant] });

  if (variant === TOAST_VARIANT.SUCCESS) {
    return sonnerToast.success(toast.title, options);
  }

  if (variant === TOAST_VARIANT.ERROR) {
    return sonnerToast.error(toast.title, options);
  }

  return sonnerToast.info(toast.title, options);
}

export const toast = {
  show: showToast,
  success: (title: string, description?: string, durationMs?: number) =>
    showToast({ variant: TOAST_VARIANT.SUCCESS, title, description, durationMs }),
  error: (title: string, description?: string, durationMs?: number) => showToast({ variant: TOAST_VARIANT.ERROR, title, description, durationMs }),
  info: (title: string, description?: string, durationMs?: number) => showToast({ variant: TOAST_VARIANT.INFO, title, description, durationMs }),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id)
};
