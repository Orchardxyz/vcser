import { EditorIdentity, EDITOR_IDENTITY_MODE } from "@/components/editor/EditorIdentity";
import { Badge, BADGE_VARIANT } from "@/components/ui/Badge";
import { useTranslation } from "react-i18next";
import type { ExtensionPresence, ResolvedEditor } from "@/types";
import { displayName, ExtensionIcon, formatVersion } from "../ExtensionHelpers";

interface EditorSyncSourcePanelProps {
  editor: ResolvedEditor;
  installedCount: number;
  targetCount: number;
  totalMissingAcrossTargets: number;
  installedExtensions: ExtensionPresence[];
}

export function EditorSyncSourcePanel({
  editor,
  installedCount,
  targetCount,
  totalMissingAcrossTargets,
  installedExtensions
}: EditorSyncSourcePanelProps) {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-lg border border-sky-200 bg-sky-50/40 shadow-sm">
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-700">{t("overview.sync.sourcePanelTitle")}</p>
              <div className="mt-2 flex min-w-0 items-center gap-3">
                <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.ICON} className="h-11 w-11 rounded-lg" />
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold text-slate-950">{editor.displayName}</h3>
                  <p className="text-sm text-slate-500">{t("overview.sync.sourcePanelDescription")}</p>
                </div>
              </div>
            </div>
            <Badge variant={BADGE_VARIANT.INFO}>{t("overview.sync.sourceBadge")}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-sky-100 bg-white/80 px-3 py-2">
              <p className="text-[11px] font-medium text-slate-500">{t("overview.sync.installedStat")}</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{installedCount}</p>
            </div>
            <div className="rounded-lg border border-sky-100 bg-white/80 px-3 py-2">
              <p className="text-[11px] font-medium text-slate-500">{t("overview.sync.comparedStat")}</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{targetCount}</p>
            </div>
            <div className="rounded-lg border border-sky-100 bg-white/80 px-3 py-2">
              <p className="text-[11px] font-medium text-slate-500">{t("overview.sync.missingCopiesStat")}</p>
              <p className="mt-1 text-lg font-semibold text-slate-950">{totalMissingAcrossTargets}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-sky-100 bg-white/80">
          <div className="border-b border-sky-100 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-slate-900">{t("overview.sync.installedExtensionsTitle")}</h4>
                <p className="text-xs text-slate-500">{t("overview.sync.installedExtensionsDescription")}</p>
              </div>
              <span className="text-xs font-medium text-slate-400">{t("overview.sync.totalCount", { count: installedExtensions.length })}</span>
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto px-3 py-2">
            {installedExtensions.length > 0 ? (
              <div className="space-y-1.5">
                {installedExtensions.map((entry) => (
                  <div key={entry.extensionId} className="flex items-center gap-2.5 rounded-md px-1 py-1.5 text-sm">
                    <ExtensionIcon extensionId={entry.extensionId} iconDataUrl={entry.iconDataUrl} />
                    <span className="truncate text-slate-700" title={displayName(entry.extensionId)}>
                      {displayName(entry.extensionId)}
                    </span>
                    <span className="ml-auto shrink-0 font-mono text-[11px] text-slate-400">{formatVersion(entry.versions[editor.name])}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-3 py-8 text-center text-sm text-slate-500">{t("overview.sync.noExtensionsDetected")}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
