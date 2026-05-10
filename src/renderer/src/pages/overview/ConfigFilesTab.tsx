import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, CheckCheck, FileJson } from "lucide-react";
import { EditorSelect } from "../../components/editor/EditorSelect";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "../../components/ui/Button";
import { invoke } from "../../ipc";
import { useAppStore } from "../../store";
import type { ResolvedEditor, SettingsDiffByExtensionResult } from "../../types";
import { ExtensionGroupRow } from "./components/extension-group-row";
import { SkeletonRow } from "./components/extension-group-row";

export function ConfigFilesTab() {
  const editors = useAppStore((s) => s.editors);
  const [leftSlug, setLeftSlug] = useState<string>("");
  const [rightSlug, setRightSlug] = useState<string>("");
  const [diffResult, setDiffResult] = useState<SettingsDiffByExtensionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNamespaces, setSelectedNamespaces] = useState<Set<string>>(new Set());

  const editorSlugs = useMemo(() => editors.map((e) => e.slug), [editors]);
  const editorBySlug = useMemo(() => {
    const m = new Map<string, ResolvedEditor>();
    for (const e of editors) m.set(e.slug, e);
    return m;
  }, [editors]);

  const leftEditorSlug = leftSlug && editorSlugs.includes(leftSlug) ? leftSlug : (editorSlugs[0] ?? "");
  const rightEditorSlug = rightSlug && editorSlugs.includes(rightSlug) ? rightSlug : (editorSlugs[1] ?? editorSlugs[0] ?? "");

  const leftEditor = editorBySlug.get(leftEditorSlug);
  const rightEditor = editorBySlug.get(rightEditorSlug);

  const leftName = leftEditor?.name ?? leftEditorSlug;
  const rightName = rightEditor?.name ?? rightEditorSlug;

  const handleSwap = useCallback(() => {
    setLeftSlug(rightEditorSlug);
    setRightSlug(leftEditorSlug);
  }, [leftEditorSlug, rightEditorSlug]);

  useEffect(() => {
    if (!leftName || !rightName || leftName === rightName) return;
    setLoading(true);
    setSelectedNamespaces(new Set());
    invoke<SettingsDiffByExtensionResult>("compute_settings_diff_by_extension", {
      leftEditor: leftName,
      rightEditor: rightName
    })
      .then((result) => {
        setDiffResult(result);
      })
      .finally(() => setLoading(false));
  }, [leftName, rightName]);

  const groups = diffResult?.groups ?? [];
  const allNamespaces = groups.map((g) => g.namespace);
  const allSelected = allNamespaces.length > 0 && allNamespaces.every((n) => selectedNamespaces.has(n));
  const someSelected = !allSelected && allNamespaces.some((n) => selectedNamespaces.has(n));

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedNamespaces(new Set());
    } else {
      setSelectedNamespaces(new Set(allNamespaces));
    }
  }, [allSelected, allNamespaces]);

  const toggleNamespace = useCallback((namespace: string, checked: boolean) => {
    setSelectedNamespaces((prev) => {
      const next = new Set(prev);
      if (checked) next.add(namespace);
      else next.delete(namespace);
      return next;
    });
  }, []);

  const selectedGroups = groups.filter((g) => selectedNamespaces.has(g.namespace));
  const canOverride = selectedGroups.length > 0;

  const headerBar = (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
      {editors.length > 0 ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <EditorSelect editors={editors} value={leftEditorSlug} onChange={setLeftSlug} className="min-w-0 flex-1" />
          <Button variant={BUTTON_VARIANT.GHOST} size={BUTTON_SIZE.ICON} onClick={handleSwap} title="Swap editors" aria-label="Swap editors">
            <ArrowLeftRight size={16} />
          </Button>
          <EditorSelect editors={editors} value={rightEditorSlug} onChange={setRightSlug} className="min-w-0 flex-1" />
        </div>
      ) : (
        <span className="text-sm text-slate-400">No editors detected</span>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button variant={BUTTON_VARIANT.SECONDARY} disabled={!canOverride}>
          Override with Left
        </Button>
        <Button disabled={!canOverride}>Override with Right</Button>
      </div>
    </div>
  );

  if (editors.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {headerBar}
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <FileJson size={32} className="text-slate-300" />
          <p className="text-sm text-slate-500">No editors detected.</p>
        </div>
      </div>
    );
  }

  if (loading || (!diffResult && editors.length > 0)) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {headerBar}
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {headerBar}
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <CheckCheck size={32} className="text-emerald-400" />
          <p className="text-sm text-slate-500">
            No settings found between {leftName} and {rightName}.
          </p>
        </div>
      </div>
    );
  }

  const hasDiffs = groups.some((g) => g.diffs.length > 0);
  const diffCount = groups.reduce((acc, g) => acc + g.diffs.length, 0);
  const versionMismatchCount = groups.filter((group) => group.hasVersionMismatch).length;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {headerBar}

      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
            className="h-4 w-4 cursor-pointer accent-primary"
            aria-label="Select all extension groups"
          />
          <span className="text-xs text-slate-500">
            {selectedGroups.length > 0
              ? `${selectedGroups.length} of ${groups.length} selected`
              : `${groups.length} namespace${groups.length === 1 ? "" : "s"}`}
          </span>
        </label>

        {hasDiffs && (
          <span className="ml-auto text-xs text-slate-400">
            {diffCount} total {diffCount === 1 ? "diff" : "diffs"} across {groups.filter((g) => g.diffs.length > 0).length} groups
            {versionMismatchCount > 0 ? `, ${versionMismatchCount} version mismatch${versionMismatchCount === 1 ? "" : "es"}` : ""}
          </span>
        )}

        {!hasDiffs && versionMismatchCount > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-sky-700">
            <ArrowLeftRight size={12} />
            Config values match, but {versionMismatchCount} extension version
            {versionMismatchCount === 1 ? "" : "s"} differ
          </span>
        )}

        {!hasDiffs && versionMismatchCount === 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
            <CheckCheck size={12} />
            All settings identical
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {groups.map((group) => (
          <ExtensionGroupRow
            key={`${group.kind}:${group.extensionId ?? group.namespace}`}
            group={group}
            leftName={leftName}
            rightName={rightName}
            checked={selectedNamespaces.has(group.namespace)}
            onCheckedChange={(checked) => toggleNamespace(group.namespace, checked)}
          />
        ))}
      </div>
    </div>
  );
}
