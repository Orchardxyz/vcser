import { useState, useMemo } from "react";
import { ArrowLeftRight, Download } from "lucide-react";
import { EditorIdentity } from "../components/EditorIdentity";
import { EditorSelect } from "../components/EditorSelect";
import { useAppStore } from "../store";
import type { ResolvedEditor } from "../types";

const TAB = {
  EXTENSIONS: "extensions",
  CONFIG_FILES: "configFiles",
} as const;

type Tab = (typeof TAB)[keyof typeof TAB];

interface ExtensionRow {
  id: string;
  name: string;
  installed: string[];
  missing: string[];
}

const DEMO_EXTENSIONS: ExtensionRow[] = [
  {
    id: "prettier",
    name: "Prettier",
    installed: ["VSCode", "Cursor", "Windsurf"],
    missing: [],
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    installed: ["VSCode", "Cursor"],
    missing: ["Windsurf"],
  },
  {
    id: "gitlens",
    name: "GitLens",
    installed: ["VSCode"],
    missing: ["Cursor", "Windsurf"],
  },
  {
    id: "eslint",
    name: "ESLint",
    installed: ["VSCode", "Cursor", "Windsurf"],
    missing: [],
  },
];

const CONFIG_FILES = [
  { name: "settings.json", status: "diff" as const },
  { name: "keybindings.json", status: "identical" as const },
];

const primaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white shadow-xs transition-colors outline-none hover:bg-blue-600 hover:shadow-sm active:bg-blue-700 active:shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none";

const secondaryButtonClass =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors outline-none hover:bg-slate-200 active:bg-slate-300 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:bg-slate-100 disabled:text-slate-400";

function ExtensionsTab() {
  const editors = useAppStore((s) => s.editors);
  const editorByName = useMemo(() => {
    const map = new Map<string, ResolvedEditor>();
    for (const e of editors) {
      map.set(e.name, e);
      map.set(e.displayName, e);
    }
    return map;
  }, [editors]);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-slate-500">
              Extension Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
              Installed
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
              Not Installed
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {DEMO_EXTENSIONS.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/60 transition-all duration-200">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded bg-slate-200 text-xs font-bold text-slate-600 shrink-0">
                    {row.name[0]}
                  </div>
                  <span className="font-medium text-slate-800">{row.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1.5">
                  {row.installed.map((name) => {
                    const editor = editorByName.get(name);
                    return editor ? (
                      <EditorIdentity key={name} editor={editor} mode="tag" />
                    ) : (
                      <span
                        key={name}
                        className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600"
                      >
                        {name}
                      </span>
                    );
                  })}
                </div>
              </td>
              <td className="px-4 py-3">
                {row.missing.length === 0 ? (
                  <span className="text-xs text-slate-400">All installed</span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    {row.missing.map((name) => {
                      const editor = editorByName.get(name);
                      return editor ? (
                        <EditorIdentity key={name} editor={editor} mode="tag" />
                      ) : (
                        <span
                          key={name}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600"
                        >
                          {name}
                        </span>
                      );
                    })}
                    <button type="button" className={primaryButtonClass}>
                      <Download size={12} />
                      Install Missing
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfigFilesTab() {
  const editors = useAppStore((s) => s.editors);
  const [leftSlug, setLeftSlug] = useState<string>("");
  const [rightSlug, setRightSlug] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState("settings.json");

  const editorSlugs = useMemo(() => editors.map((e) => e.slug), [editors]);

  // Initialize to first two editors when data loads
  const leftEditorSlug =
    leftSlug && editorSlugs.includes(leftSlug) ? leftSlug : editorSlugs[0] ?? "";
  const rightEditorSlug =
    rightSlug && editorSlugs.includes(rightSlug) ? rightSlug : editorSlugs[1] ?? editorSlugs[0] ?? "";

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        {editors.length > 0 ? (
          <>
            <EditorSelect editors={editors} value={leftEditorSlug} onChange={setLeftSlug} />
            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors outline-none hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <ArrowLeftRight size={16} />
            </button>
            <EditorSelect editors={editors} value={rightEditorSlug} onChange={setRightSlug} />
          </>
        ) : (
          <span className="text-sm text-slate-400">No editors detected</span>
        )}

        <div className="ml-auto flex items-center gap-2">
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
            {CONFIG_FILES.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setSelectedFile(f.name)}
                className={[
                  "flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
                  selectedFile === f.name
                    ? "bg-slate-100 text-slate-900 shadow-xs"
                    : "text-slate-600 hover:bg-slate-50",
                ].join(" ")}
              >
                <span className="truncate">{f.name}</span>
                {f.status === "diff" ? (
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

export function Overview() {
  const [tab, setTab] = useState<Tab>(TAB.EXTENSIONS);

  const handleTabChange = (newTab: Tab) => {
    if (newTab === tab) return;
    setTab(newTab);
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-[30px] font-bold leading-9 text-slate-950">Global Overview</h1>
        <p className="mt-1 text-sm text-slate-500">Cross-editor config diff comparison and one-click sync</p>
      </div>

      <div className="relative flex w-fit items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <div
          className="absolute top-1 bottom-1 rounded-lg bg-slate-950 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
          style={{
            left: tab === TAB.EXTENSIONS ? "4px" : "calc(50% + 2px)",
            right: tab === TAB.EXTENSIONS ? "calc(50% + 2px)" : "4px",
          }}
        />
        <button
          type="button"
          onClick={() => handleTabChange(TAB.EXTENSIONS)}
          className={[
            "relative z-10 rounded-lg px-4 py-2 text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            tab === TAB.EXTENSIONS ? "text-white" : "text-slate-600 hover:text-slate-900",
          ].join(" ")}
        >
          Extensions
        </button>
        <button
          type="button"
          onClick={() => handleTabChange(TAB.CONFIG_FILES)}
          className={[
            "relative z-10 rounded-lg px-4 py-2 text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            tab === TAB.CONFIG_FILES ? "text-white" : "text-slate-600 hover:text-slate-900",
          ].join(" ")}
        >
          Config Files
        </button>
      </div>

      {tab === TAB.EXTENSIONS ? <ExtensionsTab /> : <ConfigFilesTab />}
    </div>
  );
}
