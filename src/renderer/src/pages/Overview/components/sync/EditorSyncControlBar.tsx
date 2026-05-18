import classNames from "classnames";
import { RefreshCw, X } from "lucide-react";
import { EditorSelect } from "@/components/editor/EditorSelect";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { ResolvedEditor } from "@/types";

interface EditorSyncControlBarProps {
  editors: ResolvedEditor[];
  sourceSlug: string;
  refreshing: boolean;
  onSourceChange: (slug: string) => void;
  onRefresh: () => void;
  onReset: () => void;
}

export function EditorSyncControlBar({ editors, sourceSlug, refreshing, onSourceChange, onRefresh, onReset }: EditorSyncControlBarProps) {
  return (
    <div className="border-b border-slate-100 bg-slate-50/30 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-xs font-medium text-slate-500">Source editor</span>
          <EditorSelect editors={editors} value={sourceSlug} onChange={onSourceChange} className="w-48 min-w-48 max-w-full" />
        </div>

        {sourceSlug && (
          <div className="flex items-center gap-1.5">
            <Tooltip content="Reset comparison">
              <Button variant={BUTTON_VARIANT.SECONDARY} size={BUTTON_SIZE.ICON} onClick={onReset} aria-label="Reset comparison">
                <X size={15} />
              </Button>
            </Tooltip>
            <Tooltip content="Refresh extension diff">
              <Button
                variant={BUTTON_VARIANT.SECONDARY}
                size={BUTTON_SIZE.ICON}
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="Refresh extension diff"
              >
                <RefreshCw size={15} className={classNames({ "animate-spin": refreshing })} />
              </Button>
            </Tooltip>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {sourceSlug ? "Comparing all editors against the selected source." : "Choose a source editor to compare every other editor against it."}
      </p>
    </div>
  );
}
