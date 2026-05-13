import { useCallback, useMemo, useState } from "react";
import { invoke } from "@/ipc";
import type { ExtensionPresence, ResolvedEditor, SyncActionInput, SyncResult } from "@/types";
import { SYNC_ACTION_TYPE } from "@/types";
import { displayName } from "./ExtensionHelpers";
import { ExtensionSyncTable } from "./ExtensionSyncTable";
import { type SyncFeedback, SyncFeedbackBanner } from "./ExtensionSyncStatus";
import { ExtensionSyncToolbar } from "./ExtensionSyncToolbar";
import { SyncExtensionModal } from "./SyncExtensionModal";

export function ExtensionsByExtensionView({
  rows,
  editorNames,
  editorByName,
  editors,
  onRefresh
}: {
  rows: ExtensionPresence[];
  editorNames: string[];
  editorByName: Map<string, ResolvedEditor>;
  editors: ResolvedEditor[];
  onRefresh: () => Promise<void>;
}) {
  const [sourceSlug, setSourceSlug] = useState<string>("");
  const [targetSlug, setTargetSlug] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<SyncFeedback | null>(null);

  const sourceEditor = useMemo(() => editors.find((e) => e.slug === sourceSlug), [editors, sourceSlug]);
  const targetEditor = useMemo(() => editors.find((e) => e.slug === targetSlug), [editors, targetSlug]);

  const sourceName = sourceEditor?.name;
  const targetName = targetEditor?.name;
  const hasPair = !!sourceEditor && !!targetEditor;
  const sourceOptions = useMemo(
    () => editors.filter((editor) => editor.slug === sourceSlug || editor.slug !== targetSlug),
    [editors, sourceSlug, targetSlug]
  );
  const targetOptions = useMemo(
    () => editors.filter((editor) => editor.slug === targetSlug || editor.slug !== sourceSlug),
    [editors, sourceSlug, targetSlug]
  );

  const pairRows = useMemo(() => {
    if (!sourceName || !targetName) {
      return rows;
    }

    return [...rows]
      .filter((row) => row.presence[sourceName] === true || row.presence[targetName] === true)
      .sort((left, right) => {
        const leftRank =
          left.presence[sourceName] === true && left.presence[targetName] === false
            ? 0
            : left.presence[sourceName] === true && left.presence[targetName] === true
              ? 1
              : 2;
        const rightRank =
          right.presence[sourceName] === true && right.presence[targetName] === false
            ? 0
            : right.presence[sourceName] === true && right.presence[targetName] === true
              ? 1
              : 2;

        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        return left.extensionId.localeCompare(right.extensionId);
      });
  }, [rows, sourceName, targetName]);

  const eligibleRows = useMemo(() => {
    if (!sourceName || !targetName) return [];
    return pairRows.filter((row) => row.presence[sourceName] === true && row.presence[targetName] === false);
  }, [pairRows, sourceName, targetName]);

  const handleSourceChange = useCallback(
    (slug: string) => {
      if (slug === targetSlug) setTargetSlug("");
      setSourceSlug(slug);
      setSelectedIds(new Set());
      setFeedback(null);
    },
    [targetSlug]
  );

  const handleTargetChange = useCallback(
    (slug: string) => {
      if (slug === sourceSlug) setSourceSlug("");
      setTargetSlug(slug);
      setSelectedIds(new Set());
      setFeedback(null);
    },
    [sourceSlug]
  );

  const toggleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === eligibleRows.length) return new Set();
      return new Set(eligibleRows.map((r) => r.extensionId));
    });
  }, [eligibleRows]);

  const selectedExtensions = useMemo(() => eligibleRows.filter((r) => selectedIds.has(r.extensionId)), [eligibleRows, selectedIds]);
  const selectedCount = selectedExtensions.length;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh]);

  const handleResetPair = useCallback(() => {
    setSourceSlug("");
    setTargetSlug("");
    setSelectedIds(new Set());
    setFeedback(null);
    setSyncModalOpen(false);
  }, []);

  const handleSyncSingle = useCallback(
    async (entry: ExtensionPresence) => {
      if (!sourceName || !targetName || !sourceEditor || !targetEditor) {
        return;
      }

      setSyncingId(entry.extensionId);
      setFeedback(null);

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
          setFeedback({
            tone: "error",
            title: `Could not sync ${displayName(entry.extensionId)}`,
            detail: result?.error ?? "The target editor did not return a sync result."
          });
          return;
        }

        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(entry.extensionId);
          return next;
        });
        setFeedback({
          tone: "success",
          title: `Synced ${displayName(entry.extensionId)}`,
          detail: `${sourceEditor.displayName} → ${targetEditor.displayName}`
        });
        await onRefresh();
      } catch (error) {
        setFeedback({
          tone: "error",
          title: `Could not sync ${displayName(entry.extensionId)}`,
          detail: error instanceof Error ? error.message : String(error)
        });
      } finally {
        setSyncingId(null);
      }
    },
    [onRefresh, sourceEditor, sourceName, targetEditor, targetName]
  );

  const allSelected = eligibleRows.length > 0 && selectedCount === eligibleRows.length;
  const someSelected = selectedCount > 0 && !allSelected;
  const syncTooltipLabel = !hasPair
    ? "Choose editors to sync"
    : selectedCount > 0
      ? `Sync ${selectedCount} selected`
      : eligibleRows.length > 0
        ? "Select extensions to sync"
        : "No extensions to sync";
  const refreshTooltipLabel = refreshing ? "Refreshing extension diff" : "Refresh extension diff";

  return (
    <div>
      <ExtensionSyncToolbar
        sourceOptions={sourceOptions}
        targetOptions={targetOptions}
        sourceSlug={sourceSlug}
        targetSlug={targetSlug}
        hasPair={hasPair}
        refreshing={refreshing}
        visibleCount={pairRows.length}
        eligibleCount={eligibleRows.length}
        selectedCount={selectedCount}
        refreshTooltipLabel={refreshTooltipLabel}
        resetTooltipLabel="Reset selected editors"
        syncTooltipLabel={syncTooltipLabel}
        onSourceChange={handleSourceChange}
        onTargetChange={handleTargetChange}
        onRefresh={() => {
          void handleRefresh();
        }}
        onReset={handleResetPair}
        onOpenBulkSync={() => setSyncModalOpen(true)}
      />

      {feedback ? (
        <div className="px-4 pt-4">
          <SyncFeedbackBanner feedback={feedback} />
        </div>
      ) : null}

      <ExtensionSyncTable
        rows={pairRows}
        editorNames={editorNames}
        editorByName={editorByName}
        hasPair={hasPair}
        sourceEditor={sourceEditor}
        targetEditor={targetEditor}
        sourceName={sourceName}
        targetName={targetName}
        eligibleCount={eligibleRows.length}
        allSelected={allSelected}
        someSelected={someSelected}
        selectedIds={selectedIds}
        syncingId={syncingId}
        onToggleAll={toggleAll}
        onToggleSelect={toggleSelect}
        onSyncSingle={(entry) => {
          void handleSyncSingle(entry);
        }}
      />

      {sourceEditor && targetEditor && (
        <SyncExtensionModal
          open={syncModalOpen}
          sourceEditor={sourceEditor}
          targetEditor={targetEditor}
          extensions={selectedExtensions}
          onClose={() => setSyncModalOpen(false)}
          onComplete={(results) => {
            setSyncModalOpen(false);
            setSelectedIds(new Set());
            const successCount = results.filter((result) => result.success).length;
            const failureCount = results.length - successCount;
            setFeedback({
              tone: failureCount === 0 ? "success" : "error",
              title: failureCount === 0 ? "Batch sync completed" : "Batch sync completed with issues",
              detail:
                failureCount === 0
                  ? `${successCount} extension${successCount === 1 ? "" : "s"} synced to ${targetEditor.displayName}.`
                  : `${successCount} succeeded, ${failureCount} failed. Review the result details in the modal output.`
            });
            void onRefresh();
          }}
        />
      )}
    </div>
  );
}
