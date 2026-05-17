import { useEffect, useState } from "react";
import classNames from "classnames";
import { ArrowRight, Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { EditorIdentity, EDITOR_IDENTITY_MODE } from "@/components/editor/EditorIdentity";
import { Badge, BADGE_VARIANT } from "@/components/ui/Badge";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/Button";
import { Tooltip } from "@/components/ui/Tooltip";
import type { ExtensionPresence, ResolvedEditor } from "@/types";
import { displayName, shortenExtensionId, formatVersion, ExtensionIcon } from "./ExtensionHelpers";

type CardSection = "missing" | "shared" | "mismatch";

interface EditorSyncCardProps {
  editor: ResolvedEditor;
  mode: "neutral" | "source" | "target";
  installedCount: number;
  onUseAsSource?: (slug: string) => void;
  targetCount?: number;
  totalMissingAcrossTargets?: number;
  installedExtensions?: ExtensionPresence[];
  sourceEditor?: ResolvedEditor;
  sourceName?: string;
  targetName?: string;
  missingRows?: ExtensionPresence[];
  sharedRows?: ExtensionPresence[];
  mismatchRows?: ExtensionPresence[];
  selectedIds?: Set<string>;
  syncingKey?: string | null;
  isSyncingBatch?: boolean;
  onToggleSelect?: (extensionId: string, checked: boolean) => void;
  onSyncSingle?: (entry: ExtensionPresence) => void;
  onSyncSelected?: () => void;
  onSyncAllMissing?: () => void;
  initialSection?: CardSection;
}

const SECTION_ITEMS: { value: CardSection; label: string }[] = [
  { value: "missing", label: "Missing" },
  { value: "shared", label: "Shared" },
  { value: "mismatch", label: "Mismatch" }
];

function countForSection(section: CardSection, missing: number, shared: number, mismatch: number): number {
  if (section === "missing") return missing;
  if (section === "shared") return shared;
  return mismatch;
}

function SectionChips({
  activeSection,
  onSectionChange,
  missingCount,
  sharedCount,
  mismatchCount
}: {
  activeSection: CardSection;
  onSectionChange: (section: CardSection) => void;
  missingCount: number;
  sharedCount: number;
  mismatchCount: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {SECTION_ITEMS.map((item) => {
        const count = countForSection(item.value, missingCount, sharedCount, mismatchCount);
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => onSectionChange(item.value)}
            className={classNames(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              activeSection === item.value
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-500 hover:bg-white/50 hover:text-slate-700"
            )}
          >
            {item.label}
            <span className={classNames("ml-1", activeSection === item.value ? "text-slate-400" : "text-slate-400")}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
const PREVIEW_LIMIT = 8;
export function EditorSyncCard({
  editor,
  mode,
  installedCount,
  onUseAsSource,
  targetCount,
  totalMissingAcrossTargets,
  installedExtensions,
  sourceEditor,
  sourceName,
  targetName,
  missingRows = [],
  sharedRows = [],
  mismatchRows = [],
  selectedIds = new Set(),
  syncingKey,
  isSyncingBatch,
  onToggleSelect,
  onSyncSingle,
  onSyncSelected,
  onSyncAllMissing,
  initialSection
}: EditorSyncCardProps) {
  const [activeSection, setActiveSection] = useState<CardSection>(initialSection ?? "missing");
  const [expandedPreview, setExpandedPreview] = useState(false);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const selectedCount = missingRows.filter((r) => selectedIds.has(r.extensionId)).length;

  const isPreviewExpandable = (mode === "neutral" || mode === "source") && installedExtensions && installedExtensions.length > PREVIEW_LIMIT;

  function renderPreviewList(extensions: ExtensionPresence[]) {
    if (extensions.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-5 text-center text-xs text-slate-400">
          No extensions detected.
        </div>
      );
    }

    const visible = isPreviewExpandable && !expandedPreview ? extensions.slice(0, PREVIEW_LIMIT) : extensions;
    return (
      <div>
        <div className="space-y-1.5">
          {visible.map((entry) => (
            <div key={entry.extensionId} className="flex items-center gap-2.5 rounded-md px-1 py-1 text-sm">
              <ExtensionIcon extensionId={entry.extensionId} iconDataUrl={entry.iconDataUrl} />
              <span className="truncate text-slate-700">{displayName(entry.extensionId)}</span>
              <span className="ml-auto shrink-0 font-mono text-[11px] text-slate-400">{formatVersion(entry.versions[editor.name])}</span>
            </div>
          ))}
        </div>
        {isPreviewExpandable && (
          <button
            type="button"
            onClick={() => setExpandedPreview(!expandedPreview)}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-md py-1 text-xs text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
          >
            {expandedPreview ? (
              <>
                <ChevronUp size={12} />
                Show less
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                Show all {installedExtensions!.length}
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div
        className={classNames("flex items-start justify-between gap-3 px-4 py-3 border-b", {
          "border-sky-200 bg-sky-50/60": mode === "source",
          "border-slate-100": mode !== "source"
        })}
      >
        <div className="flex min-w-0 items-center gap-3">
          <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.ICON} className="h-8 w-8 rounded-lg" />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">{editor.displayName}</h3>
            {mode === "source" && (
              <p className="text-xs text-slate-500">
                {installedCount} installed · {targetCount} compared · {totalMissingAcrossTargets} missing copies
              </p>
            )}
            {mode === "target" && (
              <p className="text-xs text-slate-500">
                <span className="font-medium text-slate-700">{missingRows.length}</span> missing
                {" · "}
                <span className="font-medium text-slate-700">{sharedRows.length}</span> shared
                {" · "}
                <span className="font-medium text-slate-700">{mismatchRows.length}</span> mismatch
                {mismatchRows.length > 0 && <span className="text-slate-400"> of shared</span>}
              </p>
            )}
            {mode === "neutral" && (
              <p className="text-xs text-slate-500">
                {installedCount} extension{installedCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </div>

        {mode === "source" && <Badge variant={BADGE_VARIANT.INFO}>Source</Badge>}
        {mode === "neutral" && (
          <Button variant={BUTTON_VARIANT.SECONDARY} size={BUTTON_SIZE.SM} onClick={() => onUseAsSource?.(editor.slug)}>
            Use as source
          </Button>
        )}
      </div>

      {/* Neutral / Source body — preview list */}
      {(mode === "neutral" || mode === "source") && installedExtensions && (
        <div className="flex-1 overflow-y-auto px-3 py-2.5" style={{ maxHeight: expandedPreview ? 320 : 224 }}>
          {expandedPreview && isPreviewExpandable && <p className="mb-1.5 text-[11px] text-slate-400">{installedExtensions.length} installed</p>}
          {renderPreviewList(installedExtensions)}
        </div>
      )}

      {/* Target body */}
      {mode === "target" && sourceEditor && sourceName && targetName && (
        <>
          {/* Section chips */}
          <div className="bg-slate-50/50 px-4 py-2">
            <SectionChips
              activeSection={activeSection}
              onSectionChange={setActiveSection}
              missingCount={missingRows.length}
              sharedCount={sharedRows.length}
              mismatchCount={mismatchRows.length}
            />
          </div>

          {/* Section list */}
          <div className="max-h-64 flex-1 overflow-y-auto">
            {activeSection === "missing" &&
              (missingRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                  <Check size={18} className="text-emerald-400" />
                  <p className="text-sm text-slate-500">Already aligned with source.</p>
                </div>
              ) : (
                <div>
                  {missingRows.map((entry) => {
                    const isChecked = selectedIds.has(entry.extensionId);
                    const isThisSyncing = syncingKey === entry.extensionId;

                    return (
                      <div key={entry.extensionId} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50/60">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => onToggleSelect?.(entry.extensionId, e.target.checked)}
                          className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
                          aria-label={`Select ${displayName(entry.extensionId)} for sync`}
                        />
                        <ExtensionIcon extensionId={entry.extensionId} iconDataUrl={entry.iconDataUrl} />
                        <div className="min-w-0 flex-1" title={displayName(entry.extensionId)}>
                          <span className="block truncate text-[13px] font-medium text-slate-800">{displayName(entry.extensionId)}</span>
                          <span className="block truncate font-mono text-[11px] text-slate-400" title={entry.extensionId}>
                            {shortenExtensionId(entry.extensionId)}
                          </span>
                        </div>
                        <Tooltip content={`Installed version in ${sourceEditor.displayName}: ${formatVersion(entry.versions[sourceName])}`}>
                          <span className="shrink-0 cursor-default font-mono text-[11px] text-slate-400">
                            {formatVersion(entry.versions[sourceName])}
                          </span>
                        </Tooltip>
                        <Button
                          variant={BUTTON_VARIANT.GHOST}
                          size={BUTTON_SIZE.SM}
                          onClick={() => onSyncSingle?.(entry)}
                          disabled={Boolean(isThisSyncing) || isSyncingBatch}
                          aria-label={`Sync ${displayName(entry.extensionId)}`}
                          leadingIcon={isThisSyncing ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
                        >
                          Sync
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ))}
            {activeSection === "shared" &&
              (sharedRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                  <p className="text-sm text-slate-400">No shared extensions.</p>
                </div>
              ) : (
                <div>
                  {sharedRows.map((entry) => (
                    <div key={entry.extensionId} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50/60">
                      <ExtensionIcon extensionId={entry.extensionId} iconDataUrl={entry.iconDataUrl} />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-800">{displayName(entry.extensionId)}</span>
                        <span className="block truncate font-mono text-[11px] text-slate-400" title={entry.extensionId}>
                          {shortenExtensionId(entry.extensionId)}
                        </span>
                      </div>
                      <span className="shrink-0 font-mono text-[11px] text-slate-400">{formatVersion(entry.versions[targetName])}</span>
                      <Check size={14} className="shrink-0 text-emerald-400" />
                    </div>
                  ))}
                </div>
              ))}
            {activeSection === "mismatch" &&
              (mismatchRows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                  <Check size={18} className="text-emerald-400" />
                  <p className="text-sm text-slate-500">All versions match.</p>
                </div>
              ) : (
                <div>
                  {mismatchRows.map((entry) => (
                    <div key={entry.extensionId} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-slate-50/60">
                      <ExtensionIcon extensionId={entry.extensionId} iconDataUrl={entry.iconDataUrl} />
                      <div className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-800">{displayName(entry.extensionId)}</span>
                        <span className="block truncate font-mono text-[11px] text-slate-400" title={entry.extensionId}>
                          {shortenExtensionId(entry.extensionId)}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 text-[11px]">
                        <span className="font-mono text-slate-500">{formatVersion(entry.versions[sourceName])}</span>
                        <ArrowRight size={10} className="text-slate-300" />
                        <span className="font-mono text-amber-600">{formatVersion(entry.versions[targetName])}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>

          {/* Footer */}
          {missingRows.length > 0 && (
            <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
              <Button
                variant={BUTTON_VARIANT.PRIMARY}
                size={BUTTON_SIZE.SM}
                onClick={onSyncAllMissing}
                disabled={isSyncingBatch}
                leadingIcon={isSyncingBatch ? <Loader2 size={13} className="animate-spin" /> : undefined}
              >
                Sync all missing
              </Button>
              <Button variant={BUTTON_VARIANT.GHOST} size={BUTTON_SIZE.SM} onClick={onSyncSelected} disabled={selectedCount === 0 || isSyncingBatch}>
                Sync selected{selectedCount > 0 ? ` (${selectedCount})` : ""}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
