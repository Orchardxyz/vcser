import { useAppStore } from "@/store";
import { useTranslation } from "react-i18next";
import { APP_LOCALE, LOCALE_PREFERENCE, THEME_MODE, type LocalePreference, type ThemeMode } from "@/types";

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
  { value: THEME_MODE.LIGHT, label: "settings.theme.light" },
  { value: THEME_MODE.DARK, label: "settings.theme.dark" },
  { value: THEME_MODE.SYSTEM, label: "settings.theme.system" }
];

const localePreferences: { value: LocalePreference; label: string }[] = [
  { value: LOCALE_PREFERENCE.SYSTEM, label: "common.system" },
  { value: LOCALE_PREFERENCE.EN, label: "common.english" },
  { value: LOCALE_PREFERENCE.ZH_CN, label: "common.simplifiedChinese" }
];

export function Settings() {
  const { t } = useTranslation();
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const localePreference = useAppStore((s) => s.localePreference);
  const resolvedLocale = useAppStore((s) => s.resolvedLocale);
  const setLocalePreference = useAppStore((s) => s.setLocalePreference);

  const resolvedLocaleLabel = t(resolvedLocale === APP_LOCALE.ZH_CN ? "common.simplifiedChinese" : "common.english");

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 p-8">
      <div>
        <h1 className="text-[30px] font-bold leading-9 text-slate-950">{t("settings.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("settings.description")}</p>
      </div>

      <SectionCard title={t("settings.appearance")}>
        <SettingRow label={t("settings.themeMode")} description={t("settings.themeModeDescription")}>
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
                {t(label)}
              </button>
            ))}
          </div>
        </SettingRow>
      </SectionCard>

      <SectionCard title={t("settings.internationalization")}>
        <SettingRow
          label={t("settings.languageLabel")}
          description={
            localePreference === LOCALE_PREFERENCE.SYSTEM
              ? `${t("settings.languageDescription")} · ${t("settings.resolvedLanguage", { language: resolvedLocaleLabel })}`
              : t("settings.languageDescription")
          }
        >
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {localePreferences.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setLocalePreference(value)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  localePreference === value ? "bg-white text-slate-950 shadow-xs" : "text-slate-500 hover:text-slate-700"
                ].join(" ")}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </SettingRow>
      </SectionCard>
    </div>
  );
}
