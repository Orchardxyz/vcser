import { useCallback, useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SegmentedTabs } from "@/components/ui/SegmentedTabs";
import { invoke } from "@/ipc";
import { useAppStore } from "@/store";
import { EXTENSION_VIEW_MODE, type ExtensionDiffResult, type ExtensionViewMode, type ResolvedEditor } from "@/types";
import { ExtensionsByExtensionView } from "./components/ExtensionViews";
import { ExtensionsByEditorView } from "./components/ExtensionsByEditorView";
import { ExtensionTableSkeleton, EditorGridSkeleton } from "./components/ExtensionSkeletons";

export function ExtensionsTab() {
  const { t } = useTranslation();
  const editors = useAppStore((s) => s.editors);
  const [diffResult, setDiffResult] = useState<ExtensionDiffResult | null>(null);
  const [viewMode, setViewMode] = useState<ExtensionViewMode>(EXTENSION_VIEW_MODE.BY_EXTENSION);

  const extensionViewModeItems = [
    { value: EXTENSION_VIEW_MODE.BY_EXTENSION, label: t("overview.extensionsTab.byExtension") },
    { value: EXTENSION_VIEW_MODE.BY_EDITOR, label: t("overview.extensionsTab.byEditor") }
  ] as const;

  const fetchDiff = useCallback(async () => {
    const nextDiffResult = await invoke<ExtensionDiffResult>("compute_extension_diff");
    setDiffResult(nextDiffResult);
  }, []);

  useEffect(() => {
    void fetchDiff();
  }, [fetchDiff]);

  const editorByName = useMemo(() => {
    const map = new Map<string, ResolvedEditor>();
    for (const editor of editors) {
      map.set(editor.name, editor);
      map.set(editor.displayName, editor);
    }
    return map;
  }, [editors]);

  const editorBySlug = useMemo(() => {
    const map = new Map<string, ResolvedEditor>();
    for (const editor of editors) {
      map.set(editor.slug, editor);
    }
    return map;
  }, [editors]);

  const rows = diffResult?.all ?? [];
  const totalCount = diffResult?.all.length ?? 0;

  const toolbar = (
    <div className="border-b border-slate-100 px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SegmentedTabs items={[...extensionViewModeItems]} value={viewMode} onChange={setViewMode} className="w-full sm:w-fit" />

        <span className="text-xs text-slate-500">{t("overview.extensionsTab.showing", { count: totalCount })}</span>
      </div>
    </div>
  );

  if (!diffResult) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {toolbar}
        {viewMode === EXTENSION_VIEW_MODE.BY_EXTENSION ? <ExtensionTableSkeleton /> : <EditorGridSkeleton />}
      </div>
    );
  }

  if (diffResult.all.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-16 shadow-sm">
        <Package size={32} className="text-slate-300" />
        <p className="text-sm text-slate-500">{t("overview.extensionsTab.empty")}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {toolbar}
      {viewMode === EXTENSION_VIEW_MODE.BY_EXTENSION ? (
        <ExtensionsByExtensionView
          rows={rows}
          editorNames={diffResult.editorNames}
          editorByName={editorByName}
          editors={editors}
          onRefresh={fetchDiff}
        />
      ) : (
        <ExtensionsByEditorView
          editorNames={diffResult.editorNames}
          rows={rows}
          editorBySlug={editorBySlug}
          editors={editors}
          onRefresh={fetchDiff}
        />
      )}
    </div>
  );
}
