import { useState } from "react";
import { PAGE, Sidebar, type Page } from "./components/Sidebar";
import { Overview } from "./pages/Overview";
import { LocalEditors } from "./pages/LocalEditors";
import { Settings } from "./pages/Settings";

export default function App() {
  const [activePage, setActivePage] = useState<Page>(PAGE.OVERVIEW);

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-950">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {activePage === PAGE.OVERVIEW && <Overview />}
        {activePage === PAGE.LOCAL_EDITORS && <LocalEditors />}
        {activePage === PAGE.SETTINGS && <Settings />}
      </main>
    </div>
  );
}
