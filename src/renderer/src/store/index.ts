import { create } from "zustand";
import type { AppLocale, LocalePreference, ResolvedEditor, ThemeMode } from "@/types";
import { invoke } from "@/ipc";
import { LOCALE_PREFERENCE, THEME_MODE } from "@/types";
import { resolvePreferredLocale } from "@/i18n/locale";

const THEME_MODE_STORAGE_KEY = "vcser.theme-mode";
const LOCALE_PREFERENCE_STORAGE_KEY = "vcser.locale-preference";

const themeModes = new Set<ThemeMode>(Object.values(THEME_MODE));
const localePreferences = new Set<LocalePreference>(Object.values(LOCALE_PREFERENCE));

function readStoredThemeMode(): ThemeMode {
  if (typeof window === "undefined") {
    return THEME_MODE.SYSTEM;
  }

  const storedThemeMode = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
  if (storedThemeMode && themeModes.has(storedThemeMode as ThemeMode)) {
    return storedThemeMode as ThemeMode;
  }

  return THEME_MODE.SYSTEM;
}

function readStoredLocalePreference(): LocalePreference {
  if (typeof window === "undefined") {
    return LOCALE_PREFERENCE.SYSTEM;
  }

  const storedLocalePreference = window.localStorage.getItem(LOCALE_PREFERENCE_STORAGE_KEY);
  if (storedLocalePreference && localePreferences.has(storedLocalePreference as LocalePreference)) {
    return storedLocalePreference as LocalePreference;
  }

  return LOCALE_PREFERENCE.SYSTEM;
}

function persistThemeMode(themeMode: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
}

function persistLocalePreference(localePreference: LocalePreference) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCALE_PREFERENCE_STORAGE_KEY, localePreference);
}

const initialLocalePreference = readStoredLocalePreference();

interface AppStoreState {
  shellReady: boolean;
  setShellReady: (shellReady: boolean) => void;
  themeMode: ThemeMode;
  setThemeMode: (themeMode: ThemeMode) => void;
  localePreference: LocalePreference;
  resolvedLocale: AppLocale;
  setLocalePreference: (localePreference: LocalePreference) => void;
  editors: ResolvedEditor[];
  editorsLoading: boolean;
  loadEditors: () => Promise<void>;
}

export const useAppStore = create<AppStoreState>((set, get) => ({
  shellReady: false,
  setShellReady: (shellReady: boolean) => set({ shellReady }),
  themeMode: readStoredThemeMode(),
  setThemeMode: (themeMode: ThemeMode) => {
    persistThemeMode(themeMode);
    set({ themeMode });
  },
  localePreference: initialLocalePreference,
  resolvedLocale: resolvePreferredLocale(initialLocalePreference),
  setLocalePreference: (localePreference: LocalePreference) => {
    persistLocalePreference(localePreference);
    set({
      localePreference,
      resolvedLocale: resolvePreferredLocale(localePreference)
    });
  },
  editors: [],
  editorsLoading: false,
  loadEditors: async () => {
    if (get().editorsLoading) return;
    set({ editorsLoading: true });
    try {
      const detected = await invoke<ResolvedEditor[]>("detect_editors");
      set({ editors: detected ?? [] });
    } finally {
      set({ editorsLoading: false });
    }
  }
}));
