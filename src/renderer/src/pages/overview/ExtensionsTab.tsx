import { useEffect, useMemo, useState } from "react";
import { CheckCheck, Package } from "lucide-react";
import { EditorIdentity, EDITOR_IDENTITY_MODE } from "../../components/EditorIdentity";
import { SegmentedTabs } from "../../components/SegmentedTabs";
import { invoke } from "../../ipc";
import { useAppStore } from "../../store";
import type { ExtensionDiffResult, ResolvedEditor } from "../../types";

const EXTENSION_FILTER = {
  ALL: "all",
  DIFFS: "diffs",
} as const;

type ExtensionFilter = (typeof EXTENSION_FILTER)[keyof typeof EXTENSION_FILTER];

const EXTENSION_FILTER_ITEMS = [
  { value: EXTENSION_FILTER.ALL, label: "All Extensions" },
  { value: EXTENSION_FILTER.DIFFS, label: "Missing in Some" },
] as const;

function displayName(id: string): string {
  const local = id.split(".")[1] ?? id;
  return local
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function shortenExtensionId(id: string, maxLength = 28): string {
  if (id.length <= maxLength) {
    return id;
  }

  const prefixLength = Math.max(12, Math.floor((maxLength - 1) * 0.6));
  const suffixLength = Math.max(8, maxLength - prefixLength - 1);
  return `${id.slice(0, prefixLength)}…${id.slice(-suffixLength)}`;
}

function ExtensionIcon({
  extensionId,
  iconDataUrl,
}: {
  extensionId: string;
  iconDataUrl?: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [iconDataUrl]);

  if (iconDataUrl && !imageFailed) {
    return (
      <img
        src={iconDataUrl}
        alt={`${displayName(extensionId)} icon`}
        className="h-7 w-7 shrink-0 rounded object-contain"
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-200 text-xs font-bold text-slate-600">
      {displayName(extensionId)[0]}
    </div>
  );
}

export function ExtensionsTab() {
  const editors = useAppStore((s) => s.editors);
  const [diffResult, setDiffResult] = useState<ExtensionDiffResult | null>(null);
  const [filter, setFilter] = useState<ExtensionFilter>(EXTENSION_FILTER.ALL);

  useEffect(() => {
    invoke<ExtensionDiffResult>("compute_extension_diff").then(setDiffResult);
  }, []);

  const editorByName = useMemo(() => {
    const map = new Map<string, ResolvedEditor>();
    for (const editor of editors) {
      map.set(editor.name, editor);
      map.set(editor.displayName, editor);
    }
    return map;
  }, [editors]);

  const rows = filter === EXTENSION_FILTER.ALL ? diffResult?.all : diffResult?.onlyDiffs;

  if (!diffResult) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <SegmentedTabs
            items={[...EXTENSION_FILTER_ITEMS]}
            value={filter}
            onChange={setFilter}
            className="w-fit"
          />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="w-1/3 px-4 py-3 text-left text-xs font-medium text-slate-500">
                Extension
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                Installed In
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">
                Not Installed In
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {[1, 2, 3].map((index) => (
              <tr key={index}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-slate-100 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-28 rounded bg-slate-100 animate-pulse" />
                      <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-[22px] w-[22px] rounded-full bg-slate-100 animate-pulse"
                      />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div
                        key={item}
                        className="h-[22px] w-[22px] rounded-full bg-slate-100 animate-pulse"
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (diffResult.all.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-16 shadow-sm">
        <Package size={32} className="text-slate-300" />
        <p className="text-sm text-slate-500">
          No extensions found. Make sure at least one editor is detected.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <SegmentedTabs
          items={[...EXTENSION_FILTER_ITEMS]}
          value={filter}
          onChange={setFilter}
          className="w-fit"
        />
      </div>

      <table className="w-full table-fixed text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50">
            <th className="w-[42%] px-4 py-3 text-left text-xs font-medium text-slate-500">
              Extension
            </th>
            <th className="w-[29%] px-4 py-3 text-left text-xs font-medium text-slate-500">
              Installed In
            </th>
            <th className="w-[29%] px-4 py-3 text-left text-xs font-medium text-slate-500">
              Not Installed In
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows?.map((entry) => {
            const installed: string[] = [];
            const missing: string[] = [];

            for (const name of diffResult.editorNames) {
              if (entry.presence[name]) {
                installed.push(name);
              } else {
                missing.push(name);
              }
            }

            return (
              <tr
                key={entry.extensionId}
                className="hover:bg-slate-50/60 transition-all duration-200"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ExtensionIcon
                      extensionId={entry.extensionId}
                      iconDataUrl={entry.iconDataUrl}
                    />
                    <div className="min-w-0">
                      <span className="block truncate font-medium text-slate-800">
                        {displayName(entry.extensionId)}
                      </span>
                      <span
                        className="block truncate text-xs text-slate-400 font-mono"
                        title={entry.extensionId}
                      >
                        {shortenExtensionId(entry.extensionId)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {installed.map((name) => {
                      const editor = editorByName.get(name);
                      return editor ? (
                        <EditorIdentity
                          key={name}
                          editor={editor}
                          mode={EDITOR_IDENTITY_MODE.ICON}
                          className="h-[22px] w-[22px] rounded-md"
                        />
                      ) : (
                        <span
                          key={name}
                          className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600"
                          title={name}
                          aria-label={name}
                        >
                          {name[0]}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {missing.length === 0 ? (
                    <span
                      className="inline-flex h-[22px] w-[22px] items-center justify-center text-emerald-600"
                      title="Installed in all editors"
                      aria-label="Installed in all editors"
                    >
                      <CheckCheck size={14} strokeWidth={1.9} />
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {missing.map((name) => {
                        const editor = editorByName.get(name);
                        return editor ? (
                          <EditorIdentity
                            key={name}
                            editor={editor}
                            mode={EDITOR_IDENTITY_MODE.ICON}
                            className="h-[22px] w-[22px] rounded-md"
                          />
                        ) : (
                          <span
                            key={name}
                            className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600"
                            title={name}
                            aria-label={name}
                          >
                            {name[0]}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}