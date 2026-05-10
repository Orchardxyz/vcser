import { useAppStore } from "../store";
import { THEME_MODE, type ThemeMode } from "../types";

interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

function SectionCard({ title, children }: SectionCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-xl font-semibold leading-7 text-slate-950">{title}</h2>
      </div>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-6 px-6 py-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const themeModes: { value: ThemeMode; label: string }[] = [
  { value: THEME_MODE.LIGHT, label: "Light" },
  { value: THEME_MODE.DARK, label: "Dark" },
  { value: THEME_MODE.SYSTEM, label: "System" }
];

export function Settings() {
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-[30px] font-bold leading-9 text-slate-950">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage application appearance preferences</p>
      </div>

      <SectionCard title="Appearance">
        <SettingRow label="Theme Mode" description="Choose Light, Dark, or follow your system appearance">
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {themeModes.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setThemeMode(value)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  themeMode === value ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-700"
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </SettingRow>
      </SectionCard>
    </div>
  );
}
