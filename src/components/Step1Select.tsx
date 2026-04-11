import { FormEvent, useEffect, useId, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  LoaderCircle,
  PlusCircle,
  Terminal,
} from "lucide-react";
import type { CustomEditorInput, ResolvedEditor } from "../types";
import { BaseModal } from "./BaseModal";
import { IconCheckbox } from "./IconCheckbox";
import { UiIcon } from "./UiIcon";

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
  const customEditorFormId = useId();
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [extensionsPath, setExtensionsPath] = useState("");
  const [settingsPath, setSettingsPath] = useState("");
  const [cli, setCli] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canContinue = selectedEditorNames.length >= 2;

  useEffect(() => {
    if (!isCustomModalOpen) return;

    const timer = window.setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isCustomModalOpen]);

  function resetCustomForm() {
    setName("");
    setExtensionsPath("");
    setSettingsPath("");
    setCli("");
    setCustomError(null);
  }

  function openCustomModal() {
    resetCustomForm();
    setIsCustomModalOpen(true);
  }

  function closeCustomModal() {
    if (submitting) return;
    setIsCustomModalOpen(false);
  }

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
      resetCustomForm();
      setIsCustomModalOpen(false);
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
        {loading && (
          <span className="pill inline-flex items-center gap-1 bg-sky-100 text-sky-700">
            <UiIcon icon={LoaderCircle} size={14} className="animate-spin" />
            Detecting…
          </span>
        )}
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
                <IconCheckbox
                  checked={selected}
                  onChange={() => onToggleEditor(editor.name)}
                  ariaLabel={`Select ${editor.name}`}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                <span
                  className={`pill inline-flex items-center gap-1 ${
                    editor.cliAvailable
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  <UiIcon
                    icon={editor.cliAvailable ? CheckCircle2 : AlertCircle}
                    size={13}
                    className={editor.cliAvailable ? "text-emerald-600" : "text-amber-600"}
                  />
                  CLI {editor.cliAvailable ? "ready" : "missing"}
                </span>
                <span className="pill inline-flex items-center gap-1 bg-slate-100 text-slate-700">
                  <UiIcon icon={Terminal} size={13} className="text-slate-600" />
                  {editor.cli}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      <div className="flex justify-end">
        <button
          className="btn-secondary inline-flex items-center gap-2"
          type="button"
          onClick={openCustomModal}
          disabled={loading}
        >
          <UiIcon icon={PlusCircle} size={16} />
          Add custom editor
        </button>
      </div>

      <BaseModal
        open={isCustomModalOpen}
        title="Add custom editor"
        onClose={closeCustomModal}
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="btn-secondary inline-flex items-center gap-2"
              type="button"
              onClick={closeCustomModal}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              className="btn-primary inline-flex items-center gap-2"
              type="submit"
              form={customEditorFormId}
              disabled={submitting}
            >
              {submitting ? "Adding..." : "Add editor"}
            </button>
          </div>
        }
      >
        <form id={customEditorFormId} className="grid gap-3" onSubmit={handleCustomSubmit}>
          <p className="text-sm text-slate-600">Provide CLI and file paths for your custom editor.</p>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span>Name</span>
              <input
                ref={nameInputRef}
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

          {customError && <p className="text-sm text-rose-600">{customError}</p>}
        </form>
      </BaseModal>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          {canContinue
            ? `${selectedEditorNames.length} editors selected`
            : "Select at least 2 editors to continue."}
        </p>
        <button
          className="btn-primary inline-flex items-center gap-2"
          disabled={!canContinue || loading}
          onClick={onContinue}
        >
          Continue to diff
          <UiIcon icon={ArrowRight} size={16} />
        </button>
      </div>
    </section>
  );
}
