import { useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { CheckCheck, CircleOff, Package } from "lucide-react";
import { EditorIdentity, EDITOR_IDENTITY_MODE } from "../../components/editor/EditorIdentity";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "../../components/ui/Button";
import { Popover } from "../../components/ui/Popover";
import { SegmentedTabs } from "../../components/ui/SegmentedTabs";
import { Skeleton } from "../../components/ui/Skeleton";
import { invoke } from "../../ipc";
import { useAppStore } from "../../store";
import {
  EXTENSION_VIEW_MODE,
  type ExtensionDiffResult,
  type ExtensionPresence,
  type ExtensionViewMode,
  type ResolvedEditor,
} from "../../types";

const EXTENSION_VIEW_MODE_ITEMS = [
  { value: EXTENSION_VIEW_MODE.BY_EXTENSION, label: "By Extension" },
  { value: EXTENSION_VIEW_MODE.BY_EDITOR, label: "By Editor" },
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

function EditorPresenceBadge({
  name,
  editorByName,
}: {
  name: string;
  editorByName: Map<string, ResolvedEditor>;
}) {
  const editor = editorByName.get(name);

  if (editor) {
    return (
      <EditorIdentity
        editor={editor}
        mode={EDITOR_IDENTITY_MODE.ICON}
        className="h-[22px] w-[22px] rounded-md"
      />
    );
  }

  return (
    <span
      className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600"
      title={name}
      aria-label={name}
    >
      {name[0]}
    </span>
  );
}

function ExtensionTableSkeleton() {
  return (
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
                <Skeleton className="h-6 w-6" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                {[1, 2, 3].map((item) => (
                  <Skeleton key={item} className="h-[22px] w-[22px] rounded-full" />
                ))}
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((item) => (
                  <Skeleton key={item} className="h-[22px] w-[22px] rounded-full" />
                ))}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EditorGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {[1, 2, 3].map((index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <Skeleton className="h-7 w-7" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ExtensionsByExtensionView({
  rows,
  editorNames,
  editorByName,
}: {
  rows: ExtensionPresence[];
  editorNames: string[];
  editorByName: Map<string, ResolvedEditor>;
}) {
  return (
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
        {rows.length === 0 ? (
          <tr>
            <td colSpan={3} className="px-4 py-12">
              <div className="flex flex-col items-center justify-center gap-3 text-center text-slate-500">
                <CheckCheck size={24} className="text-emerald-500" />
                <p className="text-sm">No extensions available for this view.</p>
              </div>
            </td>
          </tr>
        ) : (
          rows.map((entry) => {
            const installed: string[] = [];
            const missing: string[] = [];
            const disabledIn: string[] = [];

            for (const name of editorNames) {
              if (entry.presence[name]) {
                installed.push(name);
                if (entry.disabled[name]) {
                  disabledIn.push(name);
                }
              } else {
                missing.push(name);
              }
            }

            return (
              <tr
                key={entry.extensionId}
                className="transition-all duration-200 hover:bg-slate-50/60"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ExtensionIcon
                      extensionId={entry.extensionId}
                      iconDataUrl={entry.iconDataUrl}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-slate-800">
                          {displayName(entry.extensionId)}
                        </span>
                        {disabledIn.length > 0 && (
                          <Popover
                            trigger="click"
                            placement="bottom"
                            align="start"
                            sideOffset={10}
                            showArrow
                            panelClassName="min-w-[180px]"
                            content={
                              <div className="space-y-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                  Disabled in
                                </div>
                                <div className="space-y-1">
                                  {disabledIn.map((name) => (
                                    <div
                                      key={name}
                                      className="rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-700"
                                    >
                                      {name}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            }
                          >
                            <Button
                              variant={BUTTON_VARIANT.GHOST}
                              size={BUTTON_SIZE.ICON_XS}
                              className="text-amber-600 hover:bg-transparent hover:text-amber-700 active:bg-transparent"
                              aria-label={`Show disabled editors for ${entry.extensionId}`}
                            >
                              <CircleOff size={14} strokeWidth={1.9} />
                            </Button>
                          </Popover>
                        )}
                      </div>
                      <span
                        className="block truncate font-mono text-xs text-slate-400"
                        title={entry.extensionId}
                      >
                        {shortenExtensionId(entry.extensionId)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {installed.map((name) => (
                      <EditorPresenceBadge
                        key={name}
                        name={name}
                        editorByName={editorByName}
                      />
                    ))}
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
                      {missing.map((name) => (
                        <EditorPresenceBadge
                          key={name}
                          name={name}
                          editorByName={editorByName}
                        />
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  );
}

function ExtensionsByEditorView({
  editorNames,
  rows,
  editorByName,
}: {
  editorNames: string[];
  rows: ExtensionPresence[];
  editorByName: Map<string, ResolvedEditor>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {editorNames.map((editorName) => {
        const editor = editorByName.get(editorName);
        const installed = rows.filter((entry) => entry.presence[editorName]);

        return (
          <section
            key={editorName}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex min-w-0 items-center gap-3">
                {editor ? (
                  <EditorIdentity
                    editor={editor}
                    mode={EDITOR_IDENTITY_MODE.ICON}
                    className="h-9 w-9 rounded-lg"
                  />
                ) : (
                  <span
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold text-slate-600"
                    aria-label={editorName}
                    title={editorName}
                  >
                    {editorName[0]}
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-slate-900">
                    {editor?.displayName ?? editorName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {installed.length} {installed.length === 1 ? "extension" : "extensions"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {installed.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
                  No extensions detected.
                </div>
              ) : (
                installed.map((entry) => {
                  const isDisabled = entry.disabled[editorName];

                  return (
                    <div
                      key={`${editorName}-${entry.extensionId}`}
                      className={classNames(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5",
                        isDisabled
                          ? "border border-slate-100 bg-white opacity-60"
                          : "border border-slate-200 bg-slate-50/50",
                      )}
                    >
                      <div className={classNames({ "opacity-50": isDisabled })}>
                        <ExtensionIcon
                          extensionId={entry.extensionId}
                          iconDataUrl={entry.iconDataUrl}
                        />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={classNames(
                            "block truncate text-sm font-medium",
                            isDisabled ? "text-slate-400" : "text-slate-800",
                          )}
                        >
                          {displayName(entry.extensionId)}
                        </span>
                        <span
                          className={classNames(
                            "block truncate font-mono text-xs",
                            isDisabled ? "text-slate-300" : "text-slate-400",
                          )}
                          title={entry.extensionId}
                        >
                          {shortenExtensionId(entry.extensionId)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function ExtensionsTab() {
  const editors = useAppStore((s) => s.editors);
  const [diffResult, setDiffResult] = useState<ExtensionDiffResult | null>(null);
  const [viewMode, setViewMode] = useState<ExtensionViewMode>(
    EXTENSION_VIEW_MODE.BY_EXTENSION,
  );

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

  const rows = diffResult?.all ?? [];

  const toolbar = (
    <div className="border-b border-slate-100 px-4 py-3">
      <SegmentedTabs
        items={[...EXTENSION_VIEW_MODE_ITEMS]}
        value={viewMode}
        onChange={setViewMode}
        className="w-full sm:w-fit"
      />
    </div>
  );

  if (!diffResult) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {toolbar}
        {viewMode === EXTENSION_VIEW_MODE.BY_EXTENSION ? (
          <ExtensionTableSkeleton />
        ) : (
          <EditorGridSkeleton />
        )}
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
      {toolbar}
      {viewMode === EXTENSION_VIEW_MODE.BY_EXTENSION ? (
        <ExtensionsByExtensionView
          rows={rows}
          editorNames={diffResult.editorNames}
          editorByName={editorByName}
        />
      ) : (
        <ExtensionsByEditorView
          editorNames={diffResult.editorNames}
          rows={rows}
          editorByName={editorByName}
        />
      )}
    </div>
  );
}