import { useCallback, useMemo, useState } from "react";
import { invoke } from "@/ipc";
import { toast } from "@/store/toast";
import type { ExtensionPresence, ResolvedEditor, SyncActionInput, SyncResult } from "@/types";
import { SYNC_ACTION_TYPE } from "@/types";
import { displayName } from "./ExtensionHelpers";
import { EditorSyncSourcePanel, SyncExtensionModal } from "./sync";
import { EditorSyncControlBar } from "./EditorSyncControlBar";
import { EditorSyncCard } from "./EditorSyncCard";
import { computeTargetDataBySlug } from "../utils/editorDiff";
export function ExtensionsByEditorView({
  editorNames,
  rows,
  editorBySlug,
  editors,
  onRefresh
}: {
  editorNames: string[];
  rows: ExtensionPresence[];
  editorBySlug: Map<string, ResolvedEditor>;
  editors: ResolvedEditor[];
  onRefresh: () => Promise<void>;
}) {
  const [sourceSlug, setSourceSlug] = useState<string>("");
  const [selectionByTargetSlug, setSelectionByTargetSlug] = useState<Record<string, Set<string>>>({});
  const [syncingKey, setSyncingKey] = useState<string | null>(null);
  const [syncingTargetSlug, setSyncingTargetSlug] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncModalTarget, setSyncModalTarget] = useState<{
    targetSlug: string;
    extensions: ExtensionPresence[];
  } | null>(null);
  const sourceEditor = useMemo(() => editorBySlug.get(sourceSlug), [editorBySlug, sourceSlug]);
  const sourceName = sourceEditor?.name;

  // Per-target derived data
  const targetDataBySlug = useMemo(() => {
    if (!sourceName) return null;
    return computeTargetDataBySlug(editors, rows, sourceSlug, sourceName);
  }, [editors, rows, sourceName, sourceSlug]);
  const installedByEditorName = useMemo(() => {
    const map = new Map<string, ExtensionPresence[]>();
    for (const name of editorNames) {
      map.set(
        name,
        rows.filter((row) => row.presence[name])
      );
    }
    return map;
  }, [editorNames, rows]);
  const sourceStats = useMemo(() => {
    if (!sourceSlug || !targetDataBySlug) return null;

    const installed = installedByEditorName.get(sourceName ?? "") ?? [];
    const targetSlugs = editors.filter((e) => e.slug !== sourceSlug).map((e) => e.slug);
    let totalMissingAcrossTargets = 0;
    for (const slug of targetSlugs) totalMissingAcrossTargets += targetDataBySlug[slug]?.missingRows.length ?? 0;

    return {
      installedCount: installed.length,
      targetCount: targetSlugs.length,
      totalMissingAcrossTargets,
      installedExtensions: installed
    };
  }, [sourceSlug, sourceName, targetDataBySlug, installedByEditorName, editors]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const handleReset = useCallback(() => {
    setSourceSlug("");
    setSelectionByTargetSlug({});
    setSyncingKey(null);
    setSyncingTargetSlug(null);
    setSyncModalOpen(false);
    setSyncModalTarget(null);
  }, []);

  const handleSourceChange = useCallback(
    (slug: string) => {
      if (slug === sourceSlug) return;
      setSourceSlug(slug);
      setSelectionByTargetSlug({});
      setSyncModalOpen(false);
      setSyncModalTarget(null);
    },
    [sourceSlug]
  );

  const handleToggleSelect = useCallback((targetSlug: string, extensionId: string, checked: boolean) => {
    setSelectionByTargetSlug((prev) => {
      const next = { ...prev };
      const current = prev[targetSlug] ?? new Set<string>();
      const nextSet = new Set(current);
      if (checked) {
        nextSet.add(extensionId);
      } else {
        nextSet.delete(extensionId);
      }
      next[targetSlug] = nextSet;
      return next;
    });
  }, []);

  const handleSyncSingle = useCallback(
    async (targetSlug: string, entry: ExtensionPresence) => {
      if (!sourceName || !sourceEditor) return;

      const targetEditor = editorBySlug.get(targetSlug);
      if (!targetEditor) return;

      const targetName = targetEditor.name;
      const key = `${targetSlug}:${entry.extensionId}`;

      setSyncingKey(key);
      setSyncingTargetSlug(targetSlug);

      const actions: SyncActionInput[] = [
        {
          actionType: SYNC_ACTION_TYPE.INSTALL,
          extensionId: entry.extensionId,
          sourceEditor: sourceName,
          targetEditor: targetName
        }
      ];

      try {
        // @ts-expect-error SyncActionInput is JSON-compatible; type-fest JsonObject index-signature is overly strict
        const results = await invoke<SyncResult[]>("execute_sync", { actions });
        const result = results[0];

        if (!result?.success) {
          toast.error(`Could not sync ${displayName(entry.extensionId)}`, result?.error ?? "The target editor did not return a sync result.");
          return;
        }

        setSelectionByTargetSlug((prev) => {
          const next = { ...prev };
          const current = prev[targetSlug] ?? new Set<string>();
          const nextSet = new Set(current);
          nextSet.delete(entry.extensionId);
          next[targetSlug] = nextSet;
          return next;
        });
        toast.success(`Synced ${displayName(entry.extensionId)}`, `${sourceEditor.displayName} → ${targetEditor.displayName}`);
        await onRefresh();
      } catch (error) {
        toast.error(`Could not sync ${displayName(entry.extensionId)}`, error instanceof Error ? error.message : String(error));
      } finally {
        setSyncingKey(null);
        setSyncingTargetSlug(null);
      }
    },
    [sourceName, sourceEditor, editorBySlug, onRefresh]
  );

  const handleOpenBulkSync = useCallback(
    (targetSlug: string, mode: "selected" | "all") => {
      if (!targetDataBySlug) return;

      const data = targetDataBySlug[targetSlug];
      if (!data) return;
      const selected = selectionByTargetSlug[targetSlug] ?? new Set<string>();
      const extensions = mode === "selected" ? data.missingRows.filter((r) => selected.has(r.extensionId)) : [...data.missingRows];
      if (extensions.length === 0) return;
      setSyncModalTarget({ targetSlug, extensions });
      setSyncModalOpen(true);
    },
    [targetDataBySlug, selectionByTargetSlug]
  );

  const handleSyncModalComplete = useCallback(
    (results: SyncResult[]) => {
      const targetSlug = syncModalTarget?.targetSlug;
      setSyncModalOpen(false);
      setSyncModalTarget(null);

      if (targetSlug) {
        const failedIds = new Set(results.filter((r) => !r.success).map((r) => r.extensionId ?? ""));
        setSelectionByTargetSlug((prev) => {
          const next = { ...prev };
          if (failedIds.size === 0) {
            next[targetSlug] = new Set();
          } else {
            next[targetSlug] = failedIds;
          }
          return next;
        });
      }

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.length - successCount;

      if (failureCount === 0) {
        const pluralS = successCount === 1 ? "" : "s";
        toast.success("Batch sync completed", `${successCount} extension${pluralS} synced.`);
      } else {
        toast.error("Batch sync completed with issues", `${successCount} succeeded, ${failureCount} failed.`);
      }

      void onRefresh();
    },
    [syncModalTarget, onRefresh]
  );
  const modalSourceEditor = syncModalTarget && sourceEditor ? sourceEditor : undefined;
  const modalTargetEditor = syncModalTarget ? editorBySlug.get(syncModalTarget.targetSlug) : undefined;
  const hasSource = sourceSlug !== "";
  const gridEditors = hasSource ? editors.filter((editor) => editor.slug !== sourceSlug) : editors;
  const gridClass = hasSource
    ? "grid items-start grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3"
    : "grid items-start grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

  return (
    <div>
      <EditorSyncControlBar
        editors={editors}
        sourceSlug={sourceSlug}
        refreshing={refreshing}
        onSourceChange={handleSourceChange}
        onRefresh={() => void handleRefresh()}
        onReset={handleReset}
      />

      {sourceEditor && sourceStats ? (
        <div className="px-4 pt-4">
          <EditorSyncSourcePanel
            editor={sourceEditor}
            installedCount={sourceStats.installedCount}
            targetCount={sourceStats.targetCount}
            totalMissingAcrossTargets={sourceStats.totalMissingAcrossTargets}
            installedExtensions={sourceStats.installedExtensions}
          />
        </div>
      ) : null}

      <div className={gridClass}>
        {gridEditors.map((editor) => {
          const slug = editor.slug;
          const targetData = targetDataBySlug?.[slug];
          if (!sourceSlug) {
            const installed = installedByEditorName.get(editor.name) ?? [];
            return (
              <EditorSyncCard
                key={slug}
                editor={editor}
                mode="neutral"
                installedCount={installed.length}
                installedExtensions={installed}
                onUseAsSource={(s) => handleSourceChange(s)}
              />
            );
          }
          if (targetData) {
            const selectedIds = selectionByTargetSlug[slug] ?? new Set<string>();
            const isSyncingThis = syncingTargetSlug === slug;
            return (
              <EditorSyncCard
                key={`${slug}-${sourceSlug}`}
                editor={editor}
                mode="target"
                installedCount={installedByEditorName.get(editor.name)?.length ?? 0}
                sourceEditor={sourceEditor}
                sourceName={sourceName}
                targetName={targetData.targetName}
                missingRows={targetData.missingRows}
                sharedRows={targetData.sharedRows}
                mismatchRows={targetData.mismatchRows}
                selectedIds={selectedIds}
                syncingKey={isSyncingThis ? syncingKey : null}
                isSyncingBatch={isSyncingThis}
                onToggleSelect={(extensionId, checked) => handleToggleSelect(slug, extensionId, checked)}
                onSyncSingle={(entry) => void handleSyncSingle(slug, entry)}
                onSyncSelected={() => handleOpenBulkSync(slug, "selected")}
                onSyncAllMissing={() => handleOpenBulkSync(slug, "all")}
                initialSection="missing"
              />
            );
          }
          const installed = installedByEditorName.get(editor.name) ?? [];
          return (
            <EditorSyncCard
              key={slug}
              editor={editor}
              mode="neutral"
              installedCount={installed.length}
              installedExtensions={installed}
              onUseAsSource={(s) => handleSourceChange(s)}
            />
          );
        })}
      </div>

      {modalSourceEditor && modalTargetEditor && syncModalTarget && (
        <SyncExtensionModal
          open={syncModalOpen}
          sourceEditor={modalSourceEditor}
          targetEditor={modalTargetEditor}
          extensions={syncModalTarget.extensions}
          onClose={() => {
            setSyncModalOpen(false);
            setSyncModalTarget(null);
          }}
          onComplete={handleSyncModalComplete}
        />
      )}
    </div>
  );
}
