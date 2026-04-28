import { useState } from "react";
import { Sidebar, type Page } from "./components/Sidebar";
import { Overview } from "./pages/Overview";
import { LocalEditors } from "./pages/LocalEditors";
import { Settings } from "./pages/Settings";

export default function App() {
  const [activePage, setActivePage] = useState<Page>("overview");

  return (
    <div className="flex h-screen overflow-hidden bg-white text-slate-950">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="flex-1 overflow-y-auto">
        {activePage === "overview" && <Overview />}
        {activePage === "localEditors" && <LocalEditors />}
        {activePage === "settings" && <Settings />}
      </main>
    </div>
  );
}
