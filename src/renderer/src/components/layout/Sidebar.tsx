import { useEffect, useState, type ElementType } from "react";
import { LayoutDashboard, MonitorCog, Settings } from "lucide-react";
import type { ValueOf } from "type-fest";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import logoSvg from "@assets/logo.svg";
import { invoke } from "@/ipc";
import { APP_ROUTE } from "@/routes";
import { useAppStore } from "@/store";
import type { MachineIdentity } from "@/types";
import { Tooltip } from "@/components/ui/Tooltip";

export const PAGE = {
  OVERVIEW: APP_ROUTE.OVERVIEW,
  EDITORS: APP_ROUTE.EDITORS,
  SETTINGS: APP_ROUTE.SETTINGS
} as const;

export type Page = ValueOf<typeof PAGE>;

const navItems: { page: Page; label: string; icon: ElementType }[] = [
  { page: PAGE.OVERVIEW, label: "navigation.overview", icon: LayoutDashboard },
  { page: PAGE.EDITORS, label: "navigation.editors", icon: MonitorCog },
  { page: PAGE.SETTINGS, label: "navigation.settings", icon: Settings }
];

const FALLBACK_MACHINE_IDENTITY: MachineIdentity = {
  displayName: "",
  hostname: "",
  platformLabel: ""
};

export function Sidebar() {
  const { t } = useTranslation();
  const [machineIdentity, setMachineIdentity] = useState<MachineIdentity>(FALLBACK_MACHINE_IDENTITY);
  const editorCount = useAppStore((s) => s.editors.length);

  useEffect(() => {
    let cancelled = false;

    void invoke<MachineIdentity>("get_machine_identity")
      .then((value) => {
        if (!cancelled) {
          setMachineIdentity({
            displayName: value?.displayName?.trim() || "",
            hostname: value?.hostname?.trim() || "",
            platformLabel: value?.platformLabel?.trim() || ""
          });
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = machineIdentity.displayName || t("navigation.thisDevice");
  const hostnameLabel = machineIdentity.hostname;
  const avatarLabel = displayName.charAt(0).toUpperCase() || "?";
  const platformLabel = machineIdentity.platformLabel || t("common.unknown");
  const editorCountLabel = t("navigation.editorCountLabel", { count: editorCount, platform: platformLabel });

  return (
    <aside className="flex h-screen w-56 shrink-0 flex-col border-r border-slate-200 bg-slate-50 text-slate-600">
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-5">
        <img src={logoSvg} alt="vcser logo" className="h-8 w-8 shrink-0 select-none" />
        <span className="text-2xl font-semibold text-slate-950">vcser</span>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {navItems.map(({ page, label, icon: Icon }) => {
          return (
            <NavLink
              key={page}
              to={page}
              end={page !== PAGE.EDITORS}
              className={({ isActive }) =>
                [
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50",
                  isActive
                    ? "border-slate-200 bg-white text-slate-950 shadow-xs"
                    : "border-transparent text-slate-600 hover:bg-white hover:text-slate-900"
                ].join(" ")
              }
            >
              <Icon size={16} className="shrink-0" />
              {t(label)}
            </NavLink>
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
