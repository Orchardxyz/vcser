import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, CheckCheck, FileJson } from "lucide-react";
import type { ValueOf } from "type-fest";
import { EditorSelect } from "../../components/editor/EditorSelect";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "../../components/ui/Button";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import { invoke } from "../../ipc";
import { useAppStore } from "../../store";
import type { ResolvedEditor, SettingsDiffByExtensionResult } from "../../types";
import { ExtensionGroupRow } from "./components/ExtensionGroupRow";
import { SkeletonRow } from "./components/ExtensionSkeletons";

const TAB = {
  VERSION_MATCH: "versionMatch",
  VERSION_MISMATCH: "versionMismatch"
} as const;

type TabType = ValueOf<typeof TAB>;

const TAB_ITEMS: { value: TabType; label: string }[] = [
  { value: TAB.VERSION_MATCH, label: "Version Match" },
  { value: TAB.VERSION_MISMATCH, label: "Version Mismatch" }
];

function TabEmptyState({ tab, leftName, rightName }: { tab: TabType; leftName: string; rightName: string }) {
  if (tab === TAB.VERSION_MISMATCH) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <CheckCheck size={32} className="text-emerald-400" />
        <p className="text-sm text-slate-500">
          No version mismatches found between {leftName} and {rightName}.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
      <ArrowLeftRight size={32} className="text-sky-400" />
      <p className="text-sm text-slate-500">
        All groups have version mismatches between {leftName} and {rightName}.
      </p>
    </div>
  );
}

export function ConfigFilesTab() {
  const editors = useAppStore((s) => s.editors);
  const [leftSlug, setLeftSlug] = useState<string>("");
  const [rightSlug, setRightSlug] = useState<string>("");
  const [diffResult, setDiffResult] = useState<SettingsDiffByExtensionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>(TAB.VERSION_MATCH);
  const [mismatchSelectedNamespaces, setMismatchSelectedNamespaces] = useState<Set<string>>(new Set());
  const [matchSelectedNamespaces, setMatchSelectedNamespaces] = useState<Set<string>>(new Set());

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
    setMismatchSelectedNamespaces(new Set());
    setMatchSelectedNamespaces(new Set());
    invoke<SettingsDiffByExtensionResult>("compute_settings_diff_by_extension", {
      leftEditor: leftName,
      rightEditor: rightName
    })
      .then((result) => {
        setDiffResult(result);
      })
      .finally(() => setLoading(false));
  }, [leftName, rightName]);

  const groups = useMemo(() => diffResult?.groups ?? [], [diffResult?.groups]);

  const mismatchGroups = useMemo(() => groups.filter((g) => g.hasVersionMismatch), [groups]);
  const matchGroups = useMemo(() => groups.filter((g) => !g.hasVersionMismatch), [groups]);

  const activeGroups = activeTab === TAB.VERSION_MISMATCH ? mismatchGroups : matchGroups;
  const activeSelectedNamespaces = activeTab === TAB.VERSION_MISMATCH ? mismatchSelectedNamespaces : matchSelectedNamespaces;

  const activeAllNamespaces = activeGroups.map((g) => g.namespace);
  const activeAllSelected = activeAllNamespaces.length > 0 && activeAllNamespaces.every((n) => activeSelectedNamespaces.has(n));
  const activeSomeSelected = !activeAllSelected && activeAllNamespaces.some((n) => activeSelectedNamespaces.has(n));

  const mergedSelectedNamespaces = useMemo(() => {
    const merged = new Set(mismatchSelectedNamespaces);
    for (const ns of matchSelectedNamespaces) merged.add(ns);
    return merged;
  }, [mismatchSelectedNamespaces, matchSelectedNamespaces]);

  const toggleAll = useCallback(() => {
    const setter = activeTab === TAB.VERSION_MISMATCH ? setMismatchSelectedNamespaces : setMatchSelectedNamespaces;
    if (activeAllSelected) {
      setter(new Set());
    } else {
      setter(new Set(activeAllNamespaces));
    }
  }, [activeAllSelected, activeAllNamespaces, activeTab]);

  const toggleNamespace = useCallback(
    (namespace: string, checked: boolean) => {
      const setter = activeTab === TAB.VERSION_MISMATCH ? setMismatchSelectedNamespaces : setMatchSelectedNamespaces;
      setter((prev) => {
        const next = new Set(prev);
        if (checked) next.add(namespace);
        else next.delete(namespace);
        return next;
      });
    },
    [activeTab]
  );

  const selectedGroups = groups.filter((g) => mergedSelectedNamespaces.has(g.namespace));
  const canOverride = selectedGroups.length > 0;

  const activeSelectedCount = activeSelectedNamespaces.size;
  const mergedSelectedCount = mergedSelectedNamespaces.size;

  let selectionText: string;
  if (activeSelectedCount > 0) {
    selectionText = `${activeSelectedCount} of ${activeGroups.length} selected`;
    if (mergedSelectedCount > activeSelectedCount) {
      selectionText += ` (${mergedSelectedCount} total)`;
    }
  } else {
    selectionText = `${activeGroups.length} namespace${activeGroups.length === 1 ? "" : "s"}`;
  }

  const activeHasDiffs = activeGroups.some((g) => g.diffs.length > 0);
  const activeDiffCount = activeGroups.reduce((acc, g) => acc + g.diffs.length, 0);
  const activeGroupsWithDiffs = activeGroups.filter((g) => g.diffs.length > 0).length;
  const isMismatchTab = activeTab === TAB.VERSION_MISMATCH;

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

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {headerBar}

      <div className="flex items-center border-b border-slate-100 px-4 py-3">
        <SegmentedTabs items={TAB_ITEMS} value={activeTab} onChange={setActiveTab} />
      </div>

      {activeGroups.length === 0 ? (
        <TabEmptyState tab={activeTab} leftName={leftName} rightName={rightName} />
      ) : (
        <>
          <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={activeAllSelected}
                ref={(el) => {
                  if (el) el.indeterminate = activeSomeSelected;
                }}
                onChange={toggleAll}
                className="h-4 w-4 cursor-pointer accent-primary"
                aria-label="Select all extension groups in current tab"
              />
              <span className="text-xs text-slate-500">{selectionText}</span>
            </label>

            {activeHasDiffs && (
              <span className="ml-auto text-xs text-slate-400">
                {activeDiffCount} total {activeDiffCount === 1 ? "diff" : "diffs"} across {activeGroupsWithDiffs} groups
                {isMismatchTab ? `, ${activeGroups.length} version mismatch${activeGroups.length === 1 ? "" : "es"}` : ""}
              </span>
            )}

            {!activeHasDiffs && isMismatchTab && (
              <span className="ml-auto flex items-center gap-1 text-xs text-sky-700">
                <ArrowLeftRight size={12} />
                Config values match, but {activeGroups.length} extension version
                {activeGroups.length === 1 ? "" : "s"} differ
              </span>
            )}

            {!activeHasDiffs && !isMismatchTab && (
              <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
                <CheckCheck size={12} />
                All settings identical
              </span>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {activeGroups.map((group) => (
              <ExtensionGroupRow
                key={`${group.kind}:${group.extensionId ?? group.namespace}`}
                group={group}
                leftName={leftName}
                rightName={rightName}
                checked={activeSelectedNamespaces.has(group.namespace)}
                onCheckedChange={(checked) => toggleNamespace(group.namespace, checked)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
