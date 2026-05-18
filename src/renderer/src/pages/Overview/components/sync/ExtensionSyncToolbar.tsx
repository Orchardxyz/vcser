import classNames from "classnames";
import { ArrowRight, CheckCheck, RefreshCw, RotateCcw } from "lucide-react";
import { EditorSelect } from "@/components/editor/EditorSelect";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { ResolvedEditor } from "@/types";

interface ExtensionSyncToolbarProps {
  sourceOptions: ResolvedEditor[];
  targetOptions: ResolvedEditor[];
  sourceSlug: string;
  targetSlug: string;
  hasPair: boolean;
  refreshing: boolean;
  visibleCount: number;
  collapsedCount: number;
  eligibleCount: number;
  selectedCount: number;
  refreshTooltipLabel: string;
  resetTooltipLabel: string;
  syncTooltipLabel: string;
  onSourceChange: (slug: string) => void;
  onTargetChange: (slug: string) => void;
  onRefresh: () => void;
  onReset: () => void;
  onOpenBulkSync: () => void;
}

export function ExtensionSyncToolbar({
  sourceOptions,
  targetOptions,
  sourceSlug,
  targetSlug,
  hasPair,
  refreshing,
  visibleCount,
  collapsedCount,
  eligibleCount,
  selectedCount,
  refreshTooltipLabel,
  resetTooltipLabel,
  syncTooltipLabel,
  onSourceChange,
  onTargetChange,
  onRefresh,
  onReset,
  onOpenBulkSync
}: ExtensionSyncToolbarProps) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/40 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-slate-500">From</span>
            <EditorSelect editors={sourceOptions} value={sourceSlug} onChange={onSourceChange} className="w-56 min-w-56 max-w-full" />
          </div>
          <ArrowRight size={16} className="shrink-0 text-slate-300" />
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-medium text-slate-500">To</span>
            <EditorSelect editors={targetOptions} value={targetSlug} onChange={onTargetChange} className="w-56 min-w-56 max-w-full" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip content={refreshTooltipLabel}>
            <span className="inline-flex">
              <Button
                variant={BUTTON_VARIANT.SECONDARY}
                size={BUTTON_SIZE.ICON}
                onClick={onRefresh}
                disabled={refreshing}
                aria-label={refreshTooltipLabel}
              >
                <RefreshCw size={15} className={classNames({ "animate-spin": refreshing })} />
              </Button>
            </span>
          </Tooltip>
          {hasPair ? (
            <Tooltip content={resetTooltipLabel}>
              <span className="inline-flex">
                <Button variant={BUTTON_VARIANT.SECONDARY} size={BUTTON_SIZE.ICON} onClick={onReset} aria-label={resetTooltipLabel}>
                  <RotateCcw size={15} />
                </Button>
              </span>
            </Tooltip>
          ) : null}
          <Tooltip content={syncTooltipLabel}>
            <span className="inline-flex">
              <Button size={BUTTON_SIZE.ICON} onClick={onOpenBulkSync} disabled={!hasPair || selectedCount === 0} aria-label={syncTooltipLabel}>
                <CheckCheck size={16} />
              </Button>
            </span>
          </Tooltip>
        </div>
      </div>

      {!hasPair ? (
        <p className="mt-4 text-sm text-slate-500">
          Choose a source and target editor to reveal pair-specific statuses, sync eligibility, and bulk actions.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500">
          <span>Showing {visibleCount} extensions</span>
          {collapsedCount > 0 ? (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
              <span>Collapsed {collapsedCount}</span>
            </>
          ) : null}
          <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
          <span>Ready {eligibleCount}</span>
          {selectedCount > 0 ? (
            <>
              <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden="true" />
              <span>Selected {selectedCount}</span>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
