import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Step1Select } from "./components/Step1Select";
import { Step2Diff } from "./components/Step2Diff";
import { Step3Sync } from "./components/Step3Sync";
import type {
  ActionItem,
  CustomEditorInput,
  ExtensionDiffResult,
  ResolvedEditor,
  SettingsDiffResult,
  SettingsMode,
  SyncActionInput,
  SyncResult,
} from "./types";

type Step = 1 | 2 | 3;

function buildActions(
  editors: ResolvedEditor[],
  extDiff: ExtensionDiffResult | null,
  settingsDiffs: SettingsDiffResult[]
): ActionItem[] {
  if (!extDiff) return [];

  const actions: ActionItem[] = [];
  let index = 0;

  for (const row of extDiff.onlyDiffs) {
    for (const editorName of extDiff.editorNames) {
      const hasExtension = row.presence[editorName];
      if (!hasExtension) {
        actions.push({
          id: `install-${index++}`,
          label: `Install ${row.extensionId} → ${editorName}`,
          actionType: "install",
          extensionId: row.extensionId,
          targetEditor: editorName,
        });
      }
    }
  }

  for (const diff of settingsDiffs) {
    if (diff.diffs.length === 0) continue;
    const targetExists = editors.some((editor) => editor.name === diff.targetName);
    if (!targetExists) continue;

    actions.push({
      id: `settings-${index++}`,
      label: `Sync settings: ${diff.sourceName} → ${diff.targetName} (${diff.diffs.length} keys)`,
      actionType: "settings",
      sourceEditor: diff.sourceName,
      targetEditor: diff.targetName,
      diffs: diff.diffs,
    });
  }

  return actions;
}

export default function App() {
  const [step, setStep] = useState<Step>(1);
  const [customEditors, setCustomEditors] = useState<CustomEditorInput[]>([]);

  const [detectedEditors, setDetectedEditors] = useState<ResolvedEditor[]>([]);
  const [detectLoading, setDetectLoading] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  const [selectedEditorNames, setSelectedEditorNames] = useState<string[]>([]);

  const [settingsMode, setSettingsMode] = useState<SettingsMode>("safe");
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState<string | null>(null);
  const [extensionDiff, setExtensionDiff] = useState<ExtensionDiffResult | null>(null);
  const [settingsDiffs, setSettingsDiffs] = useState<SettingsDiffResult[]>([]);

  const [dryRun, setDryRun] = useState(true);
  const [syncRunning, setSyncRunning] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<SyncResult[] | null>(null);

  const [selectedActionIds, setSelectedActionIds] = useState<Set<string>>(new Set());

  const selectedEditors = useMemo(
    () =>
      detectedEditors.filter((editor) => selectedEditorNames.includes(editor.name)),
    [detectedEditors, selectedEditorNames]
  );

  const actions = useMemo(
    () => buildActions(selectedEditors, extensionDiff, settingsDiffs),
    [selectedEditors, extensionDiff, settingsDiffs]
  );

  useEffect(() => {
    setSelectedActionIds(new Set(actions.map((action) => action.id)));
  }, [actions]);

  const refreshEditors = useCallback(async (nextCustomEditors: CustomEditorInput[]) => {
    setDetectLoading(true);
    setDetectError(null);

    try {
      const editors = await invoke<ResolvedEditor[]>("detect_editors", {
        customEditors: nextCustomEditors,
      });
      setDetectedEditors(editors);
    } catch (error) {
      setDetectedEditors([]);
      setDetectError(error instanceof Error ? error.message : String(error));
    } finally {
      setDetectLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshEditors([]);
  }, [refreshEditors]);

  useEffect(() => {
    setSelectedEditorNames((current) =>
      current.filter((name) => detectedEditors.some((editor) => editor.name === name))
    );
  }, [detectedEditors]);

  useEffect(() => {
    if (step !== 2 || selectedEditors.length < 2) return;

    let cancelled = false;

    async function loadDiffs() {
      setDiffLoading(true);
      setDiffError(null);

      try {
        const [ext, settings] = await Promise.all([
          invoke<ExtensionDiffResult>("compute_extension_diff", {
            editors: selectedEditors,
          }),
          invoke<SettingsDiffResult[]>("compute_settings_diff", {
            editors: selectedEditors,
            mode: settingsMode,
          }),
        ]);

        if (cancelled) return;
        setExtensionDiff(ext);
        setSettingsDiffs(settings);
      } catch (error) {
        if (cancelled) return;
        setExtensionDiff(null);
        setSettingsDiffs([]);
        setDiffError(error instanceof Error ? error.message : String(error));
      } finally {
        if (!cancelled) {
          setDiffLoading(false);
        }
      }
    }

    loadDiffs();

    return () => {
      cancelled = true;
    };
  }, [selectedEditors, settingsMode, step]);

  const handleToggleEditor = useCallback((editorName: string) => {
    setSelectedEditorNames((current) =>
      current.includes(editorName)
        ? current.filter((name) => name !== editorName)
        : [...current, editorName]
    );
  }, []);

  const handleAddCustomEditor = useCallback(
    async (input: CustomEditorInput) => {
      const nextCustomEditors = [...customEditors, input];

      setDetectLoading(true);
      setDetectError(null);

      try {
        const editors = await invoke<ResolvedEditor[]>("detect_editors", {
          customEditors: nextCustomEditors,
        });

        setCustomEditors(nextCustomEditors);
        setDetectedEditors(editors);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setDetectError(message);
        throw new Error(message);
      } finally {
        setDetectLoading(false);
      }
    },
    [customEditors]
  );

  const handleContinueToDiff = useCallback(() => {
    if (selectedEditorNames.length < 2) return;
    setDiffError(null);
    setSyncError(null);
    setSyncResults(null);
    setStep(2);
  }, [selectedEditorNames.length]);

  const handleContinueToSync = useCallback(() => {
    setSyncError(null);
    setSyncResults(null);
    setStep(3);
  }, []);

  const handleRunSync = useCallback(async () => {
    if (selectedActionIds.size === 0) return;

    setSyncRunning(true);
    setSyncError(null);
    setSyncResults(null);

    const payload: SyncActionInput[] = actions
      .filter((action) => selectedActionIds.has(action.id))
      .map((action) => ({
        actionType: action.actionType,
        extensionId: action.extensionId,
        sourceEditor: action.sourceEditor,
        targetEditor: action.targetEditor,
        diffs: action.diffs,
      }));

    try {
      const results = await invoke<SyncResult[]>("execute_sync", {
        editors: selectedEditors,
        actions: payload,
        dryRun,
      });
      setSyncResults(results);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : String(error));
    } finally {
      setSyncRunning(false);
    }
  }, [actions, dryRun, selectedActionIds, selectedEditors]);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 text-slate-900 md:px-8">
      <header className="panel-surface px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">vcser</p>
            <h1 className="mt-2 text-2xl font-semibold text-slate-900">Desktop Sync Console</h1>
            <p className="mt-1 text-sm text-slate-600">
              Detect editors, review extension/settings diffs, and apply sync safely.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            {[1, 2, 3].map((index) => (
              <span
                key={index}
                className={`pill ${
                  step === index
                    ? "bg-slate-900 text-white"
                    : step > index
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                Step {index}
              </span>
            ))}
          </div>
        </div>
      </header>

      {step === 1 && (
        <Step1Select
          editors={detectedEditors}
          selectedEditorNames={selectedEditorNames}
          loading={detectLoading}
          error={detectError}
          onToggleEditor={handleToggleEditor}
          onContinue={handleContinueToDiff}
          onAddCustomEditor={handleAddCustomEditor}
        />
      )}

      {step === 2 && (
        <Step2Diff
          editors={selectedEditors}
          extensionDiff={extensionDiff}
          settingsDiffs={settingsDiffs}
          settingsMode={settingsMode}
          loading={diffLoading}
          error={diffError}
          onSettingsModeChange={setSettingsMode}
          onBack={() => setStep(1)}
          onContinue={handleContinueToSync}
        />
      )}

      {step === 3 && (
        <Step3Sync
          actions={actions}
          dryRun={dryRun}
          onDryRunChange={setDryRun}
          selectedActionIds={selectedActionIds}
          onToggleAction={(id: string) => {
            setSelectedActionIds((current) => {
              const next = new Set(current);
              if (next.has(id)) {
                next.delete(id);
              } else {
                next.add(id);
              }
              return next;
            });
          }}
          onSelectAll={() => setSelectedActionIds(new Set(actions.map((item) => item.id)))}
          onClearAll={() => setSelectedActionIds(new Set())}
          onBack={() => setStep(2)}
          onExecute={handleRunSync}
          running={syncRunning}
          error={syncError}
          results={syncResults}
          onStartOver={() => {
            setStep(1);
            setSyncResults(null);
            setSyncError(null);
            setExtensionDiff(null);
            setSettingsDiffs([]);
          }}
        />
      )}
    </main>
  );
}
