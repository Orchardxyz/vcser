import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LoaderCircle,
  Minus,
  Plus,
  RefreshCw,
} from "lucide-react";
import type {
  ExtensionDiffResult,
  ResolvedEditor,
  SettingsDiffResult,
  SettingsMode,
} from "../types";
import { UiIcon } from "./UiIcon";

interface Step2DiffProps {
  editors: ResolvedEditor[];
  extensionDiff: ExtensionDiffResult | null;
  settingsDiffs: SettingsDiffResult[];
  settingsMode: SettingsMode;
  loading: boolean;
  error: string | null;
  onSettingsModeChange: (mode: SettingsMode) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function Step2Diff({
  editors,
  extensionDiff,
  settingsDiffs,
  settingsMode,
  loading,
  error,
  onSettingsModeChange,
  onBack,
  onContinue,
}: Step2DiffProps) {
  const [showAll, setShowAll] = useState(false);

  const extensionRows = useMemo(() => {
    if (!extensionDiff) return [];
    return showAll ? extensionDiff.all : extensionDiff.onlyDiffs;
  }, [extensionDiff, showAll]);

  const totalSettingsChanges = settingsDiffs.reduce(
    (sum, item) => sum + item.diffs.length,
    0
  );

  return (
    <section className="panel-surface flex flex-col gap-6 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Step 2 — Review Diffs</h2>
          <p className="mt-1 text-sm text-slate-600">
            Source editor is <code>{editors[0]?.name ?? "-"}</code>; all others are sync targets.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-600">Settings mode</span>
          <button
            className={`btn-secondary ${settingsMode === "safe" ? "border-slate-900 text-slate-900" : ""}`}
            onClick={() => onSettingsModeChange("safe")}
          >
            safe
          </button>
          <button
            className={`btn-secondary ${settingsMode === "exact" ? "border-slate-900 text-slate-900" : ""}`}
            onClick={() => onSettingsModeChange("exact")}
          >
            exact
          </button>
        </div>
      </div>

      {loading && (
        <div className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
          <UiIcon icon={LoaderCircle} size={15} className="animate-spin" />
          Computing extension/settings diffs...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && extensionDiff && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Extensions matrix</h3>
            <button
              className="btn-secondary inline-flex items-center gap-2"
              onClick={() => setShowAll((current) => !current)}
            >
              <UiIcon icon={showAll ? EyeOff : Eye} size={15} />
              {showAll ? "Show diffs only" : "Show all extensions"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white/90">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-2">Extension</th>
                  {extensionDiff.editorNames.map((editorName) => (
                    <th key={editorName} className="px-3 py-2">
                      {editorName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {extensionRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={extensionDiff.editorNames.length + 1}>
                      No extension differences found.
                    </td>
                  </tr>
                ) : (
                  extensionRows.map((row) => (
                    <tr key={row.extensionId} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">{row.extensionId}</td>
                      {extensionDiff.editorNames.map((editorName) => (
                        <td key={`${row.extensionId}-${editorName}`} className="px-3 py-2">
                          <span
                            className={`inline-flex items-center ${
                              row.presence[editorName] ? "text-emerald-600" : "text-slate-300"
                            }`}
                            title={row.presence[editorName] ? "Installed" : "Not installed"}
                            aria-label={row.presence[editorName] ? "Installed" : "Not installed"}
                          >
                            <UiIcon icon={row.presence[editorName] ? Check : Minus} size={14} />
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Settings summary</h3>
          {settingsDiffs.length === 0 ? (
            <p className="text-sm text-slate-500">No settings diffs found.</p>
          ) : (
            <div className="grid gap-2">
              {settingsDiffs.map((diff) => (
                <div
                  key={`${diff.sourceName}-${diff.targetName}`}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white/90 px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {diff.sourceName} → {diff.targetName}
                  </span>
                  <span className="pill inline-flex items-center gap-1 bg-emerald-100 text-emerald-700">
                    <UiIcon icon={Plus} size={13} />
                    {diff.addCount}
                  </span>
                  <span className="pill inline-flex items-center gap-1 bg-amber-100 text-amber-700">
                    <UiIcon icon={RefreshCw} size={13} />
                    {diff.updateCount}
                  </span>
                  {diff.deleteCount > 0 && (
                    <span className="pill inline-flex items-center gap-1 bg-rose-100 text-rose-700">
                      <UiIcon icon={Minus} size={13} />
                      {diff.deleteCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500">
            {extensionDiff?.onlyDiffs.length ?? 0} extension diffs · {totalSettingsChanges} settings changes
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <button className="btn-secondary inline-flex items-center gap-2" onClick={onBack}>
          <UiIcon icon={ArrowLeft} size={16} />
          Back
        </button>
        <button
          className="btn-primary inline-flex items-center gap-2"
          disabled={loading || Boolean(error)}
          onClick={onContinue}
        >
          Continue to sync
          <UiIcon icon={ArrowRight} size={16} />
        </button>
      </div>
    </section>
  );
}
