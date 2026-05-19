import "./Toast.css";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { Toaster as SonnerToaster } from "sonner";
import { useTranslation } from "react-i18next";
import { TOAST_DURATION_MS, TOAST_VARIANT } from "@/store/toast";

interface ToastViewportProps {
  theme: "light" | "dark";
}

export function ToastViewport({ theme }: ToastViewportProps) {
  const { t } = useTranslation();

  return (
    <SonnerToaster
      theme={theme}
      position="top-right"
      richColors
      visibleToasts={5}
      gap={12}
      offset={16}
      mobileOffset={{ top: 16, left: 16, right: 16 }}
      containerAriaLabel={t("common.notifications")}
      style={{ zIndex: 40 }}
      toastOptions={{
        duration: TOAST_DURATION_MS[TOAST_VARIANT.INFO],
        classNames: {
          toast: "vcser-sonner-toast",
          content: "vcser-sonner-content",
          title: "vcser-sonner-title",
          description: "vcser-sonner-description",
          icon: "vcser-sonner-icon",
          success: "vcser-sonner-success",
          error: "vcser-sonner-error",
          info: "vcser-sonner-info"
        }
      }}
      icons={{
        success: <CircleCheck size={16} className="text-emerald-600" />,
        error: <CircleAlert size={16} className="text-rose-600" />,
        info: <Info size={16} className="text-blue-600" />
      }}
    />
  );
}
