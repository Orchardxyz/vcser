import { useEffect, useMemo, useState } from "react";
import { Package } from "lucide-react";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import { invoke } from "../../ipc";
import { useAppStore } from "../../store";
import { EXTENSION_VIEW_MODE, type ExtensionDiffResult, type ExtensionViewMode, type ResolvedEditor } from "../../types";
import { ExtensionsByExtensionView, ExtensionsByEditorView } from "./components/ExtensionViews";
import { ExtensionTableSkeleton, EditorGridSkeleton } from "./components/ExtensionSkeletons";

const EXTENSION_VIEW_MODE_ITEMS = [
  { value: EXTENSION_VIEW_MODE.BY_EXTENSION, label: "By Extension" },
  { value: EXTENSION_VIEW_MODE.BY_EDITOR, label: "By Editor" }
] as const;

export function ExtensionsTab() {
  const editors = useAppStore((s) => s.editors);
  const [diffResult, setDiffResult] = useState<ExtensionDiffResult | null>(null);
  const [viewMode, setViewMode] = useState<ExtensionViewMode>(EXTENSION_VIEW_MODE.BY_EXTENSION);

  useEffect(() => {
    invoke<ExtensionDiffResult>("compute_extension_diff").then(setDiffResult);
  }, []);

  const editorByName = useMemo(() => {
    const map = new Map<string, ResolvedEditor>();
    for (const editor of editors) {
      map.set(editor.name, editor);
      map.set(editor.displayName, editor);
    }
    return map;
  }, [editors]);

  const rows = diffResult?.all ?? [];

  const toolbar = (
    <div className="border-b border-slate-100 px-4 py-3">
      <SegmentedTabs items={[...EXTENSION_VIEW_MODE_ITEMS]} value={viewMode} onChange={setViewMode} className="w-full sm:w-fit" />
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
        <p className="text-sm text-slate-500">No extensions found. Make sure at least one editor is detected.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {toolbar}
      {viewMode === EXTENSION_VIEW_MODE.BY_EXTENSION ? (
        <ExtensionsByExtensionView rows={rows} editorNames={diffResult.editorNames} editorByName={editorByName} />
      ) : (
        <ExtensionsByEditorView editorNames={diffResult.editorNames} rows={rows} editorByName={editorByName} />
      )}
    </div>
  );
}
