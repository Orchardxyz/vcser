import { create } from "zustand";
import type { ResolvedEditor, ThemeMode } from "../types";
import { invoke } from "../ipc";
import { THEME_MODE } from "../types";

const THEME_MODE_STORAGE_KEY = "vcser.theme-mode";

const themeModes = new Set<ThemeMode>(Object.values(THEME_MODE));

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

function persistThemeMode(themeMode: ThemeMode) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_MODE_STORAGE_KEY, themeMode);
}

interface AppStoreState {
  shellReady: boolean;
  setShellReady: (shellReady: boolean) => void;
  themeMode: ThemeMode;
  setThemeMode: (themeMode: ThemeMode) => void;
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
