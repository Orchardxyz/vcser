import { useEffect, useState } from "react";
import { useMedia } from "react-use";
import { PAGE, Sidebar, type Page } from "./components/layout/Sidebar";
import { Overview } from "./pages/Overview";
import { Editors } from "./pages/Editors";
import { Settings } from "./pages/Settings";
import { useAppStore } from "./store";
import { THEME_MODE, type ThemeMode } from "./types";

const PREFERS_DARK_MEDIA_QUERY = "(prefers-color-scheme: dark)";

function resolveThemeMode(
  themeMode: ThemeMode,
  prefersDark: boolean,
): ThemeMode {
  if (themeMode !== THEME_MODE.SYSTEM) {
    return themeMode;
  }

  if (prefersDark) {
    return THEME_MODE.DARK;
  }

  return THEME_MODE.LIGHT;
}

export default function App() {
  const [activePage, setActivePage] = useState<Page>(PAGE.OVERVIEW);
  const loadEditors = useAppStore((s) => s.loadEditors);
  const themeMode = useAppStore((s) => s.themeMode);
  const prefersDark = useMedia(
    PREFERS_DARK_MEDIA_QUERY,
    typeof window !== "undefined"
      ? window.matchMedia(PREFERS_DARK_MEDIA_QUERY).matches
      : false,
  );

  const resolvedTheme = resolveThemeMode(themeMode, prefersDark);

  useEffect(() => {
    loadEditors();
  }, [loadEditors]);

  return (
    <div
      className="app-shell flex h-screen overflow-hidden bg-white text-slate-950"
      data-theme={resolvedTheme}
      style={{ colorScheme: resolvedTheme }}
    >
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {activePage === PAGE.OVERVIEW && <Overview />}
        {activePage === PAGE.EDITORS && <Editors />}
        {activePage === PAGE.SETTINGS && <Settings />}
      </main>
      <div id="app-portal-root" />
    </div>
  );
}
