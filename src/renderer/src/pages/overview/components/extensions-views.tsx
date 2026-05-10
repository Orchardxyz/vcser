import classNames from "classnames";
import { CheckCheck, CircleOff } from "lucide-react";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "../../../components/ui/Button";
import { Popover } from "../../../components/ui/Popover";
import { EDITOR_IDENTITY_MODE, EditorIdentity } from "../../../components/editor/EditorIdentity";
import type { ExtensionPresence, ResolvedEditor } from "../../../types";
import {
  displayName,
  shortenExtensionId,
  formatVersion,
  ExtensionIcon,
  EditorPresenceBadge,
  EditorVersionPill,
  VersionMismatchIndicator
} from "./extension-helpers";

export function ExtensionsByExtensionView({
  rows,
  editorNames,
  editorByName
}: {
  rows: ExtensionPresence[];
  editorNames: string[];
  editorByName: Map<string, ResolvedEditor>;
}) {
  return (
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50">
          <th className="w-[42%] px-4 py-3 text-left text-xs font-medium text-slate-500">Extension</th>
          <th className="w-[29%] px-4 py-3 text-left text-xs font-medium text-slate-500">Installed In</th>
          <th className="w-[29%] px-4 py-3 text-left text-xs font-medium text-slate-500">Not Installed In</th>
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
              <tr key={entry.extensionId} className="transition-all duration-200 hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <ExtensionIcon extensionId={entry.extensionId} iconDataUrl={entry.iconDataUrl} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-slate-800">{displayName(entry.extensionId)}</span>
                        <VersionMismatchIndicator entry={entry} editorNames={editorNames} />
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
                                <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Disabled in</div>
                                <div className="space-y-1">
                                  {disabledIn.map((name) => (
                                    <div key={name} className="rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-700">
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
                      <span className="block truncate font-mono text-xs text-slate-400" title={entry.extensionId}>
                        {shortenExtensionId(entry.extensionId)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                    {installed.map((name) => (
                      <EditorVersionPill key={name} name={name} version={entry.versions[name]} editorByName={editorByName} />
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {missing.length === 0 ? (
                    <span
                      className="inline-flex h-5.5 w-5.5 items-center justify-center text-emerald-600"
                      title="Installed in all editors"
                      aria-label="Installed in all editors"
                    >
                      <CheckCheck size={14} strokeWidth={1.9} />
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {missing.map((name) => (
                        <EditorPresenceBadge key={name} name={name} editorByName={editorByName} />
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

export function ExtensionsByEditorView({
  editorNames,
  rows,
  editorByName
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
          <section key={editorName} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex min-w-0 items-center gap-3">
                {editor ? (
                  <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.ICON} className="h-9 w-9 rounded-lg" />
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
                  <h3 className="truncate text-sm font-semibold text-slate-900">{editor?.displayName ?? editorName}</h3>
                  <p className="text-xs text-slate-500">
                    {installed.length} {installed.length === 1 ? "extension" : "extensions"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 max-h-90 space-y-3 overflow-y-auto pr-1">
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
                          : entry.hasVersionMismatch
                            ? "border border-sky-200 bg-sky-50/40"
                            : "border border-slate-200 bg-slate-50/50"
                      )}
                    >
                      <div className={classNames({ "opacity-50": isDisabled })}>
                        <ExtensionIcon extensionId={entry.extensionId} iconDataUrl={entry.iconDataUrl} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={classNames("block truncate text-sm font-medium", isDisabled ? "text-slate-400" : "text-slate-800")}>
                            {displayName(entry.extensionId)}
                          </span>
                          <VersionMismatchIndicator entry={entry} editorNames={editorNames} />
                        </div>
                        <span
                          className={classNames("block truncate font-mono text-xs", isDisabled ? "text-slate-300" : "text-slate-400")}
                          title={entry.extensionId}
                        >
                          {shortenExtensionId(entry.extensionId)}
                        </span>
                        <span className={classNames("mt-1 block text-[11px] font-medium", isDisabled ? "text-slate-300" : "text-slate-500")}>
                          Version {formatVersion(entry.versions[editorName])}
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
