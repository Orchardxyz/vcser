import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@/ipc";
import { toast } from "@/store/toast";
import type { ExtensionPresence, ResolvedEditor, SyncActionInput, SyncResult } from "@/types";
import { SYNC_ACTION_TYPE } from "@/types";
import { displayName } from "./ExtensionHelpers";
import { ExtensionSyncTable, ExtensionSyncToolbar, SyncExtensionModal } from "./sync";

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
  const [alreadyInTargetExpanded, setAlreadyInTargetExpanded] = useState(false);
  const [notInSourceExpanded, setNotInSourceExpanded] = useState(false);

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

  useEffect(() => {
    setAlreadyInTargetExpanded(false);
    setNotInSourceExpanded(false);
  }, [sourceSlug, targetSlug]);

  const pairRowGroups = useMemo(() => {
    if (!sourceName || !targetName) {
      return null;
    }

    const eligibleRows: ExtensionPresence[] = [];
    const alreadyInTargetRows: ExtensionPresence[] = [];
    const notInSourceRows: ExtensionPresence[] = [];

    [...rows]
      .filter((row) => row.presence[sourceName] === true || row.presence[targetName] === true)
      .sort((left, right) => {
        const getPresenceRank = (row: ExtensionPresence) => {
          if (row.presence[sourceName] === true && row.presence[targetName] === false) return 0;
          if (row.presence[sourceName] === true && row.presence[targetName] === true) return 1;
          return 2;
        };
        const leftRank = getPresenceRank(left);
        const rightRank = getPresenceRank(right);

        if (leftRank !== rightRank) {
          return leftRank - rightRank;
        }

        return left.extensionId.localeCompare(right.extensionId);
      })
      .forEach((row) => {
        if (row.presence[sourceName] === true && row.presence[targetName] === false) {
          eligibleRows.push(row);
          return;
        }

        if (row.presence[sourceName] === true && row.presence[targetName] === true) {
          alreadyInTargetRows.push(row);
          return;
        }

        notInSourceRows.push(row);
      });

    return {
      eligibleRows,
      alreadyInTargetRows,
      notInSourceRows
    };
  }, [rows, sourceName, targetName]);

  const pairRows = useMemo(() => {
    if (!pairRowGroups) {
      return rows;
    }

    return [...pairRowGroups.eligibleRows, ...pairRowGroups.alreadyInTargetRows, ...pairRowGroups.notInSourceRows];
  }, [pairRowGroups, rows]);

  const eligibleRows = useMemo(() => {
    if (!pairRowGroups) return [];
    return pairRowGroups.eligibleRows;
  }, [pairRowGroups]);

  const alreadyInTargetRows = pairRowGroups?.alreadyInTargetRows ?? [];
  const notInSourceRows = pairRowGroups?.notInSourceRows ?? [];
  const visibleCount = hasPair
    ? eligibleRows.length + (alreadyInTargetExpanded ? alreadyInTargetRows.length : 0) + (notInSourceExpanded ? notInSourceRows.length : 0)
    : pairRows.length;
  const collapsedCount = hasPair
    ? (alreadyInTargetExpanded ? 0 : alreadyInTargetRows.length) + (notInSourceExpanded ? 0 : notInSourceRows.length)
    : 0;

  const handleSourceChange = useCallback(
    (slug: string) => {
      if (slug === targetSlug) setTargetSlug("");
      setSourceSlug(slug);
      setSelectedIds(new Set());
    },
    [targetSlug]
  );

  const handleTargetChange = useCallback(
    (slug: string) => {
      if (slug === sourceSlug) setSourceSlug("");
      setTargetSlug(slug);
      setSelectedIds(new Set());
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
    setSyncModalOpen(false);
  }, []);

  const handleSyncSingle = useCallback(
    async (entry: ExtensionPresence) => {
      if (!sourceName || !targetName || !sourceEditor || !targetEditor) {
        return;
      }

      setSyncingId(entry.extensionId);

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

        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(entry.extensionId);
          return next;
        });
        toast.success(`Synced ${displayName(entry.extensionId)}`, `${sourceEditor.displayName} → ${targetEditor.displayName}`);
        await onRefresh();
      } catch (error) {
        toast.error(`Could not sync ${displayName(entry.extensionId)}`, error instanceof Error ? error.message : String(error));
      } finally {
        setSyncingId(null);
      }
    },
    [onRefresh, sourceEditor, sourceName, targetEditor, targetName]
  );

  const allSelected = eligibleRows.length > 0 && selectedCount === eligibleRows.length;
  const someSelected = selectedCount > 0 && !allSelected;
  function getSyncTooltipLabel() {
    if (!hasPair) return "Choose editors to sync";
    if (selectedCount > 0) return `Sync ${selectedCount} selected`;
    if (eligibleRows.length > 0) return "Select extensions to sync";
    return "No extensions to sync";
  }
  const syncTooltipLabel = getSyncTooltipLabel();
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
        visibleCount={visibleCount}
        collapsedCount={collapsedCount}
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

      <ExtensionSyncTable
        rows={pairRows}
        editorNames={editorNames}
        editorByName={editorByName}
        hasPair={hasPair}
        sourceEditor={sourceEditor}
        targetEditor={targetEditor}
        sourceName={sourceName}
        targetName={targetName}
        syncableRows={hasPair ? eligibleRows : undefined}
        alreadyInTargetRows={hasPair ? alreadyInTargetRows : undefined}
        notInSourceRows={hasPair ? notInSourceRows : undefined}
        alreadyInTargetExpanded={alreadyInTargetExpanded}
        notInSourceExpanded={notInSourceExpanded}
        eligibleCount={eligibleRows.length}
        allSelected={allSelected}
        someSelected={someSelected}
        selectedIds={selectedIds}
        syncingId={syncingId}
        onToggleAll={toggleAll}
        onToggleAlreadyInTarget={() => setAlreadyInTargetExpanded((prev) => !prev)}
        onToggleNotInSource={() => setNotInSourceExpanded((prev) => !prev)}
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
            const pluralS = successCount === 1 ? "" : "s";
            const title = failureCount === 0 ? "Batch sync completed" : "Batch sync completed with issues";
            const description =
              failureCount === 0
                ? `${successCount} extension${pluralS} synced to ${targetEditor.displayName}.`
                : `${successCount} succeeded, ${failureCount} failed. Review the result details in the modal output.`;

            if (failureCount === 0) {
              toast.success(title, description);
            } else {
              toast.error(title, description);
            }

            void onRefresh();
          }}
        />
      )}
    </div>
  );
}
