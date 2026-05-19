import { useEffect, useLayoutEffect } from "react";
import { useMedia } from "react-use";
import { Navigate, Route, Routes } from "react-router-dom";
import i18n from "./i18n";
import { Sidebar } from "./components/layout/Sidebar";
import { ToastViewport } from "./components/ui/Toast";
import { Overview } from "./pages/Overview";
import { EditorExtensions } from "./pages/EditorExtensions";
import { Editors } from "./pages/Editors";
import { Settings } from "./pages/Settings";
import { APP_ROUTE } from "./routes";
import { useAppStore } from "./store";
import { THEME_MODE, type ThemeMode } from "./types";

const PREFERS_DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function resolveThemeMode(themeMode: ThemeMode, prefersDark: boolean): ThemeMode {
  if (themeMode !== THEME_MODE.SYSTEM) {
    return themeMode;
  }

  if (prefersDark) {
    return THEME_MODE.DARK;
  }

  return THEME_MODE.LIGHT;
}

export default function App() {
  const loadEditors = useAppStore((s) => s.loadEditors);
  const themeMode = useAppStore((s) => s.themeMode);
  const resolvedLocale = useAppStore((s) => s.resolvedLocale);
  const prefersDark = useMedia(PREFERS_DARK_MEDIA_QUERY, typeof window !== "undefined" ? window.matchMedia(PREFERS_DARK_MEDIA_QUERY).matches : false);

  const resolvedTheme = resolveThemeMode(themeMode, prefersDark);

  useEffect(() => {
    loadEditors();
  }, [loadEditors]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.lang = resolvedLocale;
    i18n.changeLanguage(resolvedLocale);
  }, [resolvedLocale]);

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-white text-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path={APP_ROUTE.ROOT} element={<Navigate to={APP_ROUTE.OVERVIEW} replace />} />
          <Route path={APP_ROUTE.OVERVIEW} element={<Overview />} />
          <Route path={APP_ROUTE.EDITORS} element={<Editors />} />
          <Route path={`${APP_ROUTE.EDITORS}/:editorSlug/extensions`} element={<EditorExtensions />} />
          <Route path={APP_ROUTE.SETTINGS} element={<Settings />} />
          <Route path="*" element={<Navigate to={APP_ROUTE.OVERVIEW} replace />} />
        </Routes>
      </main>
      <ToastViewport theme={resolvedTheme === THEME_MODE.DARK ? "dark" : "light"} />
    </div>
  );
}
