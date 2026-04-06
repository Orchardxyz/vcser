import type { ActionItem, SyncResult } from "../types";

interface Step3SyncProps {
  actions: ActionItem[];
  dryRun: boolean;
  onDryRunChange: (value: boolean) => void;
  selectedActionIds: Set<string>;
  onToggleAction: (id: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  onBack: () => void;
  onExecute: () => void;
  running: boolean;
  error: string | null;
  results: SyncResult[] | null;
  onStartOver: () => void;
}

export function Step3Sync({
  actions,
  dryRun,
  onDryRunChange,
  selectedActionIds,
  onToggleAction,
  onSelectAll,
  onClearAll,
  onBack,
  onExecute,
  running,
  error,
  results,
  onStartOver,
}: Step3SyncProps) {
  const selectedCount = selectedActionIds.size;

  if (results) {
    const successCount = results.filter((item) => item.success).length;
    const failureCount = results.length - successCount;

    return (
      <section className="panel-surface flex flex-col gap-5 px-6 py-6">
        <h2 className="text-lg font-semibold">Step 3 — Results</h2>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="pill bg-emerald-100 text-emerald-700">{successCount} succeeded</span>
          {failureCount > 0 && (
            <span className="pill bg-rose-100 text-rose-700">{failureCount} failed</span>
          )}
          <span className="pill bg-slate-100 text-slate-700">{dryRun ? "Dry-run" : "Real run"}</span>
        </div>

        <div className="max-h-90 overflow-auto rounded-xl border border-slate-200 bg-white/90">
          <ul className="divide-y divide-slate-100 text-sm">
            {results.map((result, index) => (
              <li key={`${result.action}-${index}`} className="space-y-1 px-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`pill ${
                      result.success ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {result.success ? "OK" : "FAILED"}
                  </span>
                  <span className="font-medium">{result.editor}</span>
                  <code className="text-xs">{result.action}</code>
                </div>
                {result.backupPath && (
                  <p className="text-xs text-slate-500">backup: {result.backupPath}</p>
                )}
                {result.error && <p className="text-xs text-rose-600">{result.error}</p>}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end">
          <button className="btn-primary" onClick={onStartOver}>
            Start over
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-surface flex flex-col gap-5 px-6 py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Step 3 — Execute Sync</h2>
          <p className="mt-1 text-sm text-slate-600">
            Select actions to apply. Keep dry-run enabled until output looks correct.
          </p>
        </div>

        <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(event) => onDryRunChange(event.target.checked)}
          />
          Dry-run mode
        </label>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {actions.length === 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          Nothing to sync — all selected editors are already aligned.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-slate-600">{selectedCount} / {actions.length} actions selected</p>
            <div className="flex gap-2">
              <button className="btn-secondary" onClick={onSelectAll}>Select all</button>
              <button className="btn-secondary" onClick={onClearAll}>Clear</button>
            </div>
          </div>

          <ul className="max-h-96 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-white/85 p-3">
            {actions.map((action) => {
              const selected = selectedActionIds.has(action.id);
              const tone =
                action.actionType === "install"
                  ? "text-emerald-700"
                  : action.actionType === "uninstall"
                  ? "text-rose-700"
                  : "text-amber-700";

              return (
                <li
                  key={action.id}
                  className={`rounded-lg border px-3 py-2 ${
                    selected ? "border-slate-900 bg-slate-50" : "border-slate-200 bg-white"
                  }`}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      className="mt-1"
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleAction(action.id)}
                    />
                    <span className="space-y-1">
                      <span className={`block text-xs font-semibold uppercase tracking-wide ${tone}`}>
                        {action.actionType}
                      </span>
                      <span className="block text-sm">{action.label}</span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </>
      )}

      <div className="flex items-center justify-between gap-3">
        <button className="btn-secondary" onClick={onBack} disabled={running}>
          Back
        </button>
        <button
          className="btn-primary"
          disabled={running || selectedCount === 0 || actions.length === 0}
          onClick={onExecute}
        >
          {running ? "Running..." : dryRun ? "Run dry-run" : "Apply sync"}
        </button>
      </div>
    </section>
  );
}
