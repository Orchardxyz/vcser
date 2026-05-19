import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { APP_LOCALE } from "@shared/i18n";
import { resources } from "./resources";

i18n.use(initReactI18next).init({
  resources,
  lng: APP_LOCALE.EN,
  fallbackLng: APP_LOCALE.EN,
  interpolation: {
    escapeValue: false
  },
  returnNull: false
});

export function translate(key: string, options?: Record<string, unknown>): string {
  const result = i18n.t(key, options) as unknown;
  return typeof result === "string" ? result : String(result);
}

export { i18n };
export default i18n;
