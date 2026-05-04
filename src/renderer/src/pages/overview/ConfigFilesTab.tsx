import { useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { EditorSelect } from "../../components/editor/EditorSelect";
import { useAppStore } from "../../store";

const CONFIG_FILES = [
  { name: "settings.json", status: "diff" as const },
  { name: "keybindings.json", status: "identical" as const },
];

const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-xs transition-colors outline-none hover:bg-blue-600 hover:shadow-sm active:bg-blue-700 active:shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors outline-none hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:bg-slate-100 disabled:text-slate-400";

export function ConfigFilesTab() {
  const editors = useAppStore((s) => s.editors);
  const [leftSlug, setLeftSlug] = useState<string>("");
  const [rightSlug, setRightSlug] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState("settings.json");

  const editorSlugs = useMemo(() => editors.map((editor) => editor.slug), [editors]);

  const leftEditorSlug =
    leftSlug && editorSlugs.includes(leftSlug) ? leftSlug : editorSlugs[0] ?? "";
  const rightEditorSlug =
    rightSlug && editorSlugs.includes(rightSlug)
      ? rightSlug
      : editorSlugs[1] ?? editorSlugs[0] ?? "";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        {editors.length > 0 ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <EditorSelect
              editors={editors}
              value={leftEditorSlug}
              onChange={setLeftSlug}
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <ArrowLeftRight size={16} />
            </button>
            <EditorSelect
              editors={editors}
              value={rightEditorSlug}
              onChange={setRightSlug}
              className="min-w-0 flex-1"
            />
          </div>
        ) : (
          <span className="text-sm text-slate-400">No editors detected</span>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button type="button" className={secondaryButtonClass}>
            Override with Left
          </button>
          <button type="button" className={primaryButtonClass}>
            Override with Right
          </button>
        </div>
      </div>

      <div className="flex">
        <div className="w-44 shrink-0 border-r border-slate-100 p-3">
          <p className="mb-2 text-xs font-medium text-slate-500">Config Files</p>
          <div className="space-y-1">
            {CONFIG_FILES.map((file) => (
              <button
                key={file.name}
                type="button"
                onClick={() => setSelectedFile(file.name)}
                className={[
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  selectedFile === file.name
                    ? "bg-slate-100 text-slate-900 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                <span className="truncate">{file.name}</span>
                {file.status === "diff" ? (
                  <span className="ml-1 shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    Diff
                  </span>
                ) : (
                  <span className="ml-1 shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                    Identical
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="grid flex-1 grid-cols-2 divide-x divide-slate-100">
          <pre className="bg-white p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
            <span className="text-slate-300">{"{"}
{`  "editor.fontSize": 14,
`}</span>
            <span className="text-rose-500">{`  "editor.formatOnSave": false,
`}</span>
            <span className="text-slate-300">{`  "workbench.colorTheme": "One Dark"
}`}</span>
          </pre>
          <pre className="bg-white p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
            <span className="text-slate-300">{"{"}
{`  "editor.fontSize": 14,
`}</span>
            <span className="text-emerald-600">{`  "editor.formatOnSave": true,
`}</span>
            <span className="text-slate-300">{`  "workbench.colorTheme": "One Dark"
}`}</span>
          </pre>
        </div>
      </div>
    </div>
  );
}