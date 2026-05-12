import { useState } from "react";
import type { ValueOf } from "type-fest";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { ConfigFilesTab } from "./ConfigFilesTab";
import { ExtensionsTab } from "./ExtensionsTab";

const TAB = {
  EXTENSIONS: "extensions",
  CONFIG_FILES: "configFiles"
} as const;

type Tab = ValueOf<typeof TAB>;

const OVERVIEW_TAB_ITEMS = [
  { value: TAB.EXTENSIONS, label: "Extensions" },
  { value: TAB.CONFIG_FILES, label: "Config Files" }
] as const;

export function Overview() {
  const [tab, setTab] = useState<Tab>(TAB.EXTENSIONS);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === tab) return;
    setTab(newTab);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-[30px] font-bold leading-9 text-slate-950">Global Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Cross-editor config diff comparison and one-click sync</p>
      </div>

      <SegmentedTabs items={[...OVERVIEW_TAB_ITEMS]} value={tab} onChange={handleTabChange} className="w-fit self-start" />

      {tab === TAB.EXTENSIONS ? <ExtensionsTab /> : <ConfigFilesTab />}
    </div>
  );
}
