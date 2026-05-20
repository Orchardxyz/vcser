import { useState } from "react";
import type { ValueOf } from "type-fest";
import { useTranslation } from "react-i18next";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { ConfigFilesTab } from "./ConfigFilesTab";
import { ExtensionsTab } from "./ExtensionsTab";

const TAB = {
  EXTENSIONS: "extensions",
  CONFIG_FILES: "configFiles"
} as const;

type Tab = ValueOf<typeof TAB>;

export function Overview() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(TAB.EXTENSIONS);

  const overviewTabItems = [
    { value: TAB.EXTENSIONS, label: t("overview.tabs.extensions") },
    { value: TAB.CONFIG_FILES, label: t("overview.tabs.configFiles") }
  ] as const;

  const handleTabChange = (newTab: Tab) => {
    if (newTab === tab) return;
    setTab(newTab);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-[30px] font-bold leading-9 text-slate-950">{t("overview.title")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("overview.description")}</p>
      </div>

      <SegmentedTabs items={[...overviewTabItems]} value={tab} onChange={handleTabChange} className="w-fit self-start" />

      {tab === TAB.EXTENSIONS ? <ExtensionsTab /> : <ConfigFilesTab />}
    </div>
  );
}
