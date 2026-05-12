import { useEffect, useState, type ElementType } from "react";
import { LayoutDashboard, MonitorCog, Settings } from "lucide-react";
import logoSvg from "../../../../assets/logo.svg";
import { invoke } from "../../ipc";
import { useAppStore } from "../../store";
import type { MachineIdentity } from "../../types";
import { Tooltip } from "../ui/Tooltip";

export const PAGE = {
  OVERVIEW: "overview",
  EDITORS: "editors",
  SETTINGS: "settings"
} as const;

export type Page = (typeof PAGE)[keyof typeof PAGE];

interface SidebarProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: ElementType }[] = [
  { page: PAGE.OVERVIEW, label: "Overview", icon: LayoutDashboard },
  { page: PAGE.EDITORS, label: "Editors", icon: MonitorCog },
  { page: PAGE.SETTINGS, label: "Settings", icon: Settings }
];

const FALLBACK_MACHINE_IDENTITY: MachineIdentity = {
  displayName: "This device",
  hostname: "",
  platformLabel: "macOS"
};

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [machineIdentity, setMachineIdentity] = useState<MachineIdentity>(FALLBACK_MACHINE_IDENTITY);
  const editorCount = useAppStore((s) => s.editors.length);

  useEffect(() => {
    let cancelled = false;

    void invoke<MachineIdentity>("get_machine_identity")
      .then((value) => {
        if (!cancelled) {
          setMachineIdentity({
            displayName: value?.displayName?.trim() || FALLBACK_MACHINE_IDENTITY.displayName,
            hostname: value?.hostname?.trim() || "",
            platformLabel: value?.platformLabel?.trim() || FALLBACK_MACHINE_IDENTITY.platformLabel
          });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = machineIdentity.displayName || FALLBACK_MACHINE_IDENTITY.displayName;
  const hostnameLabel = machineIdentity.hostname;
  const avatarLabel = displayName.charAt(0).toUpperCase() || "?";
  const editorCountLabel = `${editorCount} editor${editorCount === 1 ? "" : "s"} · ${machineIdentity.platformLabel}`;

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50 text-slate-600">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-5">
        <img src={logoSvg} alt="vcser logo" className="h-8 w-8 shrink-0 select-none" />
        <span className="text-2xl font-semibold text-slate-950">vcser</span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ page, label, icon: Icon }) => {
          const isActive = activePage === page;
          return (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              className={[
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50",
                isActive
                  ? "border-slate-200 bg-white text-slate-950 shadow-xs"
                  : "border-transparent text-slate-600 hover:bg-white hover:text-slate-900"
              ].join(" ")}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-slate-200 px-4 py-4">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700 select-none">
          {avatarLabel}
        </div>
        <div className="min-w-0">
          <Tooltip content={hostnameLabel || displayName} disabled={!hostnameLabel}>
            <p className="truncate text-xs font-medium text-slate-700">{displayName}</p>
          </Tooltip>
          <p className="text-xs text-slate-500">{editorCountLabel}</p>
        </div>
      </div>
    </aside>
  );
}
