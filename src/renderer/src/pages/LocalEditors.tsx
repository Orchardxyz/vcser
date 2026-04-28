import { useState } from "react";
import { Plus, Puzzle } from "lucide-react";
import { BaseModal } from "../components/BaseModal";

interface EditorCard {
  id: string;
  name: string;
  initials: string;
  status: "running" | "stopped";
  version: string;
  path: string;
  extensionCount: number;
}

const DEMO_EDITORS: EditorCard[] = [
  {
    id: "vscode",
    name: "VSCode",
    initials: "VS",
    status: "running",
    version: "1.89.1",
    path: "/Applications/Visual Studio Code.app",
    extensionCount: 45,
  },
  {
    id: "cursor",
    name: "Cursor",
    initials: "Cu",
    status: "stopped",
    version: "0.32.5",
    path: "/Applications/Cursor.app",
    extensionCount: 32,
  },
  {
    id: "windsurf",
    name: "Windsurf",
    initials: "Wi",
    status: "stopped",
    version: "1.2.0",
    path: "/Applications/Windsurf.app",
    extensionCount: 28,
  },
];

function StatusBadge({ status }: { status: "running" | "stopped" }) {
  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Running
      </span>
    );
  }
  return <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500">Stopped</span>;
}

export function LocalEditors() {
  const [addModalOpen, setAddModalOpen] = useState(false);

  const secondaryButtonClass =
    "rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition-colors outline-none hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  const primaryButtonClass =
    "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-xs transition-colors outline-none hover:bg-blue-600 hover:shadow-sm active:bg-blue-700 active:shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  const inputClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-[30px] font-bold leading-9 text-slate-950">Local Editors</h1>
        <p className="mt-1 text-sm text-slate-500">Manage editor instances installed on this device</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEMO_EDITORS.map((editor) => (
          <div
            key={editor.id}
            className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700"
              >
                {editor.initials}
              </div>
              <StatusBadge status={editor.status} />
            </div>

            <div>
              <p className="text-xl font-semibold leading-7 text-slate-950">{editor.name}</p>
              <p className="mt-0.5 text-xs text-slate-400 truncate">
                Version {editor.version} · Path {editor.path}
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Puzzle size={13} className="text-slate-400" />
              {editor.extensionCount} extensions
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="flex min-h-[152px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-transparent p-5 text-slate-400 transition-colors outline-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <Plus size={22} strokeWidth={1.5} />
          <span className="text-sm font-medium">Add Other Editor</span>
        </button>
      </div>

      <BaseModal
        open={addModalOpen}
        title="Add Custom Editor"
        onClose={() => setAddModalOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className={secondaryButtonClass}
            >
              Cancel
            </button>
            <button
              type="button"
              className={primaryButtonClass}
            >
              Add Editor
            </button>
          </div>
        }
      >
        <div className="grid gap-4">
          <p className="text-sm text-slate-500">Provide the CLI command and file paths for your custom editor.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">Name</span>
              <input
                type="text"
                placeholder="My Editor"
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-slate-700">CLI Command</span>
              <input
                type="text"
                placeholder="myeditor"
                className={inputClass}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Extensions Path</span>
            <input
              type="text"
              placeholder="/path/to/extensions"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Settings Path</span>
            <input
              type="text"
              placeholder="/path/to/User/settings.json"
              className={inputClass}
            />
          </label>
        </div>
      </BaseModal>
    </div>
  );
}
