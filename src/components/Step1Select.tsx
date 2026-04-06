import { FormEvent, useState } from "react";
import type { CustomEditorInput, ResolvedEditor } from "../types";

interface Step1SelectProps {
  editors: ResolvedEditor[];
  selectedEditorNames: string[];
  loading: boolean;
  error: string | null;
  onToggleEditor: (editorName: string) => void;
  onContinue: () => void;
  onAddCustomEditor: (customEditor: CustomEditorInput) => Promise<void> | void;
}

export function Step1Select({
  editors,
  selectedEditorNames,
  loading,
  error,
  onToggleEditor,
  onContinue,
  onAddCustomEditor,
}: Step1SelectProps) {
  const [name, setName] = useState("");
  const [extensionsPath, setExtensionsPath] = useState("");
  const [settingsPath, setSettingsPath] = useState("");
  const [cli, setCli] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canContinue = selectedEditorNames.length >= 2;

  async function handleCustomSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCustomError(null);

    if (!name.trim() || !extensionsPath.trim() || !settingsPath.trim() || !cli.trim()) {
      setCustomError("All custom editor fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      await onAddCustomEditor({
        name: name.trim(),
        extensionsPath: extensionsPath.trim(),
        settingsPath: settingsPath.trim(),
        cli: cli.trim(),
      });
      setName("");
      setExtensionsPath("");
      setSettingsPath("");
      setCli("");
    } catch (submitError) {
      setCustomError(
        submitError instanceof Error ? submitError.message : String(submitError)
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel-surface flex flex-col gap-6 px-6 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Step 1 — Select Editors</h2>
          <p className="mt-1 text-sm text-slate-600">
            Choose at least two editors. You can also add custom editor paths.
          </p>
        </div>
        {loading && <span className="pill bg-sky-100 text-sky-700">Detecting…</span>}
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {editors.map((editor) => {
          const selected = selectedEditorNames.includes(editor.name);
          return (
            <label
              key={editor.name}
              className={`cursor-pointer rounded-xl border px-4 py-3 transition ${
                selected
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{editor.name}</span>
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onToggleEditor(editor.name)}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                <span
                  className={`pill ${
                    editor.cliAvailable
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  CLI {editor.cliAvailable ? "ready" : "missing"}
                </span>
                <span className="pill bg-slate-100 text-slate-700">{editor.cli}</span>
              </div>
            </label>
          );
        })}
      </div>

      <form className="grid gap-3 rounded-xl border border-slate-200 bg-white/70 p-4" onSubmit={handleCustomSubmit}>
        <h3 className="text-sm font-semibold text-slate-800">Add custom editor</h3>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Name</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="MyEditor"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span>CLI command</span>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2"
              value={cli}
              onChange={(event) => setCli(event.target.value)}
              placeholder="myeditor"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          <span>Extensions path</span>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={extensionsPath}
            onChange={(event) => setExtensionsPath(event.target.value)}
            placeholder="/path/to/extensions"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span>Settings path</span>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            value={settingsPath}
            onChange={(event) => setSettingsPath(event.target.value)}
            placeholder="/path/to/User/settings.json"
          />
        </label>

        {customError && (
          <p className="text-sm text-rose-600">{customError}</p>
        )}

        <div className="flex justify-end">
          <button className="btn-secondary" type="submit" disabled={submitting}>
            {submitting ? "Adding..." : "Add custom editor"}
          </button>
        </div>
      </form>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          {canContinue
            ? `${selectedEditorNames.length} editors selected`
            : "Select at least 2 editors to continue."}
        </p>
        <button className="btn-primary" disabled={!canContinue || loading} onClick={onContinue}>
          Continue to diff
        </button>
      </div>
    </section>
  );
}
