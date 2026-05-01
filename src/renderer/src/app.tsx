import { useState, useEffect } from "react";
import { PAGE, Sidebar, type Page } from "./components/Sidebar";
import { Overview } from "./pages/Overview";
import { Editors } from "./pages/Editors";
import { Settings } from "./pages/Settings";
import { useAppStore } from "./store";

export default function App() {
  const [activePage, setActivePage] = useState<Page>(PAGE.OVERVIEW);
  const loadEditors = useAppStore((s) => s.loadEditors);

  useEffect(() => {
    loadEditors();
  }, [loadEditors]);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-950">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {activePage === PAGE.OVERVIEW && <Overview />}
        {activePage === PAGE.EDITORS && <Editors />}
        {activePage === PAGE.SETTINGS && <Settings />}
      </main>
    </div>
  );
}
