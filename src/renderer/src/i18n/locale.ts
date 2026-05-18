import { APP_LOCALE, LOCALE_PREFERENCE, type AppLocale, type LocalePreference } from "@shared/i18n";

export function resolveAppLocale(locale: string | null | undefined): AppLocale {
  const normalized = locale?.trim().toLowerCase() ?? "";

  if (normalized.startsWith("zh")) {
    return APP_LOCALE.ZH_CN;
  }

  return APP_LOCALE.EN;
}

export function getSystemAppLocale(): AppLocale {
  if (typeof navigator === "undefined") {
    return APP_LOCALE.EN;
  }

  return resolveAppLocale(navigator.language);
}

export function resolvePreferredLocale(preference: LocalePreference): AppLocale {
  if (preference === LOCALE_PREFERENCE.SYSTEM) {
    return getSystemAppLocale();
  }

  return preference;
}
