import classNames from "classnames";
import { ArrowRight, CheckCheck, Loader2 } from "lucide-react";
import { Badge, BADGE_VARIANT } from "@/components/ui/Badge";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/Button";
import type { ExtensionPresence, ResolvedEditor } from "@/types";
import {
  DisabledIndicator,
  displayName,
  EditorPresenceBadge,
  EditorVersionPill,
  ExtensionIcon,
  shortenExtensionId,
  VersionMismatchIndicator
} from "./ExtensionHelpers";
import { PairStatusCell } from "./ExtensionSyncStatus";

interface ExtensionSyncTableProps {
  rows: ExtensionPresence[];
  editorNames: string[];
  editorByName: Map<string, ResolvedEditor>;
  hasPair: boolean;
  sourceEditor?: ResolvedEditor;
  targetEditor?: ResolvedEditor;
  sourceName?: string;
  targetName?: string;
  eligibleCount: number;
  allSelected: boolean;
  someSelected: boolean;
  selectedIds: Set<string>;
  syncingId: string | null;
  onToggleAll: () => void;
  onToggleSelect: (id: string, checked: boolean) => void;
  onSyncSingle: (entry: ExtensionPresence) => void;
}

export function ExtensionSyncTable({
  rows,
  editorNames,
  editorByName,
  hasPair,
  sourceEditor,
  targetEditor,
  sourceName,
  targetName,
  eligibleCount,
  allSelected,
  someSelected,
  selectedIds,
  syncingId,
  onToggleAll,
  onToggleSelect,
  onSyncSingle
}: ExtensionSyncTableProps) {
  return (
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50">
          {hasPair && (
            <th className="w-10 px-4 py-3">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) {
                    el.indeterminate = someSelected;
                  }
                }}
                onChange={onToggleAll}
                className="h-4 w-4 cursor-pointer accent-primary"
                disabled={eligibleCount === 0}
                aria-label="Select all eligible extensions"
              />
            </th>
          )}
          <th className="w-[42%] px-4 py-3 text-left text-xs font-medium text-slate-500">Extension</th>
          <th className="w-[29%] px-4 py-3 text-left text-xs font-medium text-slate-500">
            {hasPair ? `In ${sourceEditor?.displayName ?? "Source"}` : "Installed In"}
          </th>
          <th className="w-[29%] px-4 py-3 text-left text-xs font-medium text-slate-500">
            {hasPair ? `In ${targetEditor?.displayName ?? "Target"}` : "Missing In"}
          </th>
          {hasPair ? <th className="w-32 px-4 py-3 text-left text-xs font-medium text-slate-500">Action</th> : null}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.length === 0 ? (
          <tr>
            <td colSpan={hasPair ? 5 : 3} className="px-4 py-12">
              <div className="flex flex-col items-center justify-center gap-3 text-center text-slate-500">
                <CheckCheck size={24} className="text-emerald-500" />
                <p className="text-sm">{hasPair ? "No extensions match the selected editor pair." : "No extensions available for this view."}</p>
              </div>
            </td>
          </tr>
        ) : (
          rows.map((entry) => {
            const installed: string[] = [];
            const missing: string[] = [];
            const disabledIn: string[] = [];

            for (const name of editorNames) {
              if (entry.presence[name]) {
                installed.push(name);
                if (entry.disabled[name]) {
                  disabledIn.push(name);
                }
              } else {
                missing.push(name);
              }
            }

            const isEligible = sourceName && targetName ? entry.presence[sourceName] === true && entry.presence[targetName] === false : false;
            const isChecked = selectedIds.has(entry.extensionId);
            const isThisSyncing = syncingId === entry.extensionId;
            const sourceInstalled = sourceName ? entry.presence[sourceName] === true : false;
            const targetInstalled = targetName ? entry.presence[targetName] === true : false;
            const sourceDisabled = sourceName ? entry.disabled[sourceName] === true : false;
            const targetDisabled = targetName ? entry.disabled[targetName] === true : false;

            return (
              <tr key={entry.extensionId} className="transition-all duration-200 hover:bg-slate-50/60">
                {hasPair ? (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!isEligible}
                      onChange={(event) => onToggleSelect(entry.extensionId, event.target.checked)}
                      className={classNames("h-4 w-4 accent-primary", isEligible ? "cursor-pointer" : "cursor-not-allowed opacity-30")}
                      aria-label={`Select ${displayName(entry.extensionId)} for sync`}
                    />
                  </td>
                ) : null}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ExtensionIcon extensionId={entry.extensionId} iconDataUrl={entry.iconDataUrl} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-slate-800">{displayName(entry.extensionId)}</span>
                        <VersionMismatchIndicator entry={entry} editorNames={editorNames} />
                        <DisabledIndicator disabledIn={disabledIn} />
                      </div>
                      <span className="block truncate font-mono text-xs text-slate-400" title={entry.extensionId}>
                        {shortenExtensionId(entry.extensionId)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {hasPair && sourceName ? (
                    <PairStatusCell installed={sourceInstalled} version={entry.versions[sourceName]} disabled={sourceDisabled} />
                  ) : (
                    <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                      {installed.map((name) => (
                        <EditorVersionPill key={name} name={name} version={entry.versions[name]} editorByName={editorByName} />
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {hasPair && targetName ? (
                    <PairStatusCell installed={targetInstalled} version={entry.versions[targetName]} disabled={targetDisabled} />
                  ) : missing.length === 0 ? (
                    <span
                      className="inline-flex h-5.5 w-5.5 items-center justify-center text-emerald-600"
                      title="Installed in all editors"
                      aria-label="Installed in all editors"
                    >
                      <CheckCheck size={14} strokeWidth={1.9} />
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {missing.map((name) => (
                        <EditorPresenceBadge key={name} name={name} editorByName={editorByName} />
                      ))}
                    </div>
                  )}
                </td>
                {hasPair ? (
                  <td className="px-4 py-3">
                    {isEligible ? (
                      <Button
                        variant={BUTTON_VARIANT.SECONDARY}
                        size={BUTTON_SIZE.SM}
                        leadingIcon={isThisSyncing ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                        onClick={() => onSyncSingle(entry)}
                        disabled={isThisSyncing}
                        title={`Copy ${displayName(entry.extensionId)} from ${sourceEditor?.displayName} to ${targetEditor?.displayName}`}
                        aria-label={`Sync ${displayName(entry.extensionId)}`}
                      >
                        {isThisSyncing ? "Syncing" : "Sync"}
                      </Button>
                    ) : sourceInstalled && targetInstalled ? (
                      <Badge variant={BADGE_VARIANT.SUCCESS}>Already in target</Badge>
                    ) : (
                      <Badge variant={BADGE_VARIANT.NEUTRAL}>Not in source</Badge>
                    )}
                  </td>
                ) : null}
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}
