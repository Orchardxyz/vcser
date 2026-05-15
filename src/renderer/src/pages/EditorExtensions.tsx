import { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { ChevronLeft, CircleOff, LoaderCircle, Power, Puzzle, RefreshCw, Trash2, TriangleAlert } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { EditorIdentity, EDITOR_IDENTITY_MODE } from "@/components/editor/EditorIdentity";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { invoke } from "@/ipc";
import { displayName, ExtensionIcon, formatVersion, shortenExtensionId } from "@/pages/Overview/components/ExtensionHelpers";
import { APP_ROUTE } from "@/routes";
import { useAppStore } from "@/store";
import { toast } from "@/store/toast";
import type { EditorExtensionItem, EditorExtensionMutationResult, EditorExtensionsResult } from "@/types";
import { SUPPORTED_COMMAND } from "@shared/ipc";

function ExtensionsListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs md:flex-row md:items-center md:justify-between"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EditorExtensions() {
  const { editorSlug } = useParams<{ editorSlug: string }>();
  const editor = useAppStore((state) => state.editors.find((item) => item.slug === editorSlug));
  const [extensionsResult, setExtensionsResult] = useState<EditorExtensionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);
  const [extensionToRemove, setExtensionToRemove] = useState<EditorExtensionItem | null>(null);

  const loadExtensions = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!editorSlug) {
        setExtensionsResult(null);
        setErrorMessage("Missing editor route parameter.");
        setLoading(false);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }

      setErrorMessage(null);

      try {
        const result = await invoke<EditorExtensionsResult>(SUPPORTED_COMMAND.GET_EDITOR_EXTENSIONS, { editorSlug });
        setExtensionsResult(result);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load extensions.");
      } finally {
        setLoading(false);
      }
    },
    [editorSlug]
  );

  useEffect(() => {
    void loadExtensions();
  }, [loadExtensions]);

  async function handleSetDisabled(item: EditorExtensionItem, disabled: boolean) {
    if (!editorSlug) {
      return;
    }

    const actionKey = `${item.extensionId}:${disabled ? "disable" : "enable"}`;
    setPendingActionKey(actionKey);

    try {
      const result = await invoke<EditorExtensionMutationResult>(SUPPORTED_COMMAND.SET_EDITOR_EXTENSION_DISABLED, {
        editorSlug,
        extensionId: item.extensionId,
        disabled
      });

      if (!result.success) {
        toast.error(disabled ? "Failed to disable extension" : "Failed to enable extension", result.error);
        return;
      }

      toast.success(disabled ? "Extension disabled" : "Extension enabled", displayName(item.extensionId));
      await loadExtensions({ silent: true });
    } catch (error) {
      toast.error(disabled ? "Failed to disable extension" : "Failed to enable extension", error instanceof Error ? error.message : String(error));
    } finally {
      setPendingActionKey(null);
    }
  }

  async function handleConfirmUninstall() {
    if (!editorSlug || !extensionToRemove) {
      return;
    }

    const actionKey = `${extensionToRemove.extensionId}:uninstall`;
    setPendingActionKey(actionKey);

    try {
      const result = await invoke<EditorExtensionMutationResult>(SUPPORTED_COMMAND.UNINSTALL_EDITOR_EXTENSION, {
        editorSlug,
        extensionId: extensionToRemove.extensionId
      });

      if (!result.success) {
        toast.error("Failed to uninstall extension", result.error);
        return;
      }

      toast.success("Extension uninstalled", displayName(extensionToRemove.extensionId));
      setExtensionToRemove(null);
      await loadExtensions({ silent: true });
    } catch (error) {
      toast.error("Failed to uninstall extension", error instanceof Error ? error.message : String(error));
    } finally {
      setPendingActionKey(null);
    }
  }

  if (!editor) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <div>
          <h1 className="text-[30px] font-bold leading-9 text-slate-950">Editor not found</h1>
          <p className="mt-1 text-sm text-slate-500">The requested editor is unavailable or has not been detected on this device.</p>
        </div>

        <div className="flex max-w-xl flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-amber-900 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <TriangleAlert size={18} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm font-semibold">No editor matches this route.</p>
              <p className="text-sm text-amber-800/80">The editor may have been removed or the route is stale.</p>
            </div>
          </div>

          <div>
            <Link
              to={APP_ROUTE.EDITORS}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium text-amber-900 transition-colors hover:border-amber-400 hover:bg-amber-100/60"
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
              Back to editors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const extensions = extensionsResult?.items ?? [];
  const extensionsCountLabel = `${extensions.length} extension${extensions.length === 1 ? "" : "s"}`;
  const headerStatusLabel = loading && !extensionsResult ? "Loading current editor state..." : extensionsCountLabel;

  function renderContent() {
    if (loading && !extensionsResult) return <ExtensionsListSkeleton />;
    if (errorMessage) {
      return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-700">
          <p className="font-medium">Failed to load extensions.</p>
          <p className="mt-1 text-rose-700/80">{errorMessage}</p>
        </div>
      );
    }
    if (extensions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center text-slate-500">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-xs">
            <Puzzle size={20} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-700">No extensions detected</p>
            <p className="mt-1 text-sm text-slate-500">This editor does not currently expose any installed extensions.</p>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {extensions.map((item) => {
          const disableActionKey = `${item.extensionId}:${item.disabled ? "enable" : "disable"}`;
          const uninstallActionKey = `${item.extensionId}:uninstall`;
          const disablePending = pendingActionKey === disableActionKey;
          const uninstallPending = pendingActionKey === uninstallActionKey;
          const actionPending = disablePending || uninstallPending;

          function getDisableIcon() {
            if (disablePending) return <LoaderCircle size={14} className="animate-spin" />;
            if (item.disabled) return <Power size={14} strokeWidth={1.75} />;
            return <CircleOff size={14} strokeWidth={1.75} />;
          }
          const disableIcon = getDisableIcon();

          return (
            <div
              key={item.extensionId}
              className={classNames(
                "flex flex-col gap-4 rounded-2xl border px-4 py-4 transition-colors md:flex-row md:items-center md:justify-between",
                item.disabled ? "border-amber-200 bg-amber-50/60" : "border-slate-200 bg-white"
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <ExtensionIcon extensionId={item.extensionId} iconDataUrl={item.iconDataUrl} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900">{displayName(item.extensionId)}</p>
                    <span
                      className={classNames(
                        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
                        item.disabled ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                      )}
                    >
                      {item.disabled ? "Disabled" : "Enabled"}
                    </span>
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                      {formatVersion(item.version)}
                    </span>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-slate-400" title={item.extensionId}>
                    {shortenExtensionId(item.extensionId, 40)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <Button
                  variant={BUTTON_VARIANT.SECONDARY}
                  size={BUTTON_SIZE.SM}
                  leadingIcon={disableIcon}
                  className={classNames(
                    item.disabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200/70 disabled:border-emerald-100 disabled:bg-emerald-50 disabled:text-emerald-300"
                      : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 active:bg-amber-200/70 disabled:border-amber-100 disabled:bg-amber-50 disabled:text-amber-300"
                  )}
                  disabled={actionPending}
                  onClick={() => void handleSetDisabled(item, !item.disabled)}
                >
                  {item.disabled ? "Enable" : "Disable"}
                </Button>
                <Button
                  variant={BUTTON_VARIANT.GHOST}
                  size={BUTTON_SIZE.SM}
                  leadingIcon={uninstallPending ? <LoaderCircle size={14} className="animate-spin" /> : <Trash2 size={14} strokeWidth={1.75} />}
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:bg-rose-100/80 disabled:text-rose-300"
                  disabled={actionPending}
                  onClick={() => setExtensionToRemove(item)}
                >
                  Uninstall
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex min-w-0 flex-col gap-4">
            <Link
              to={APP_ROUTE.EDITORS}
              className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
            >
              <ChevronLeft size={16} strokeWidth={1.75} />
              Back to editors
            </Link>

            <div className="flex items-center gap-4">
              <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.ICON} className="h-14 w-14 rounded-2xl" />
              <div>
                <h1 className="text-[30px] font-bold leading-9 text-slate-950">Installed extensions</h1>
                <p className="mt-1 text-sm text-slate-500">{headerStatusLabel}</p>
              </div>
            </div>
          </div>

          <Button
            variant={BUTTON_VARIANT.SECONDARY}
            size={BUTTON_SIZE.SM}
            leadingIcon={<RefreshCw size={14} strokeWidth={1.75} />}
            onClick={() => void loadExtensions()}
          >
            Refresh
          </Button>
        </div>

        <div className="mt-4">{renderContent()}</div>
      </section>

      <BaseModal
        open={extensionToRemove !== null}
        title="Uninstall extension"
        onClose={() => (pendingActionKey ? undefined : setExtensionToRemove(null))}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant={BUTTON_VARIANT.SECONDARY} onClick={() => setExtensionToRemove(null)} disabled={pendingActionKey !== null}>
              Cancel
            </Button>
            <Button
              leadingIcon={
                pendingActionKey === `${extensionToRemove?.extensionId}:uninstall` ? <LoaderCircle size={14} className="animate-spin" /> : undefined
              }
              disabled={pendingActionKey !== null}
              onClick={() => void handleConfirmUninstall()}
            >
              Uninstall
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Remove{" "}
            <span className="font-semibold text-slate-900">{extensionToRemove ? displayName(extensionToRemove.extensionId) : "this extension"}</span>{" "}
            from
            <span className="font-semibold text-slate-900"> {editor.displayName}</span>.
          </p>
          <p>This removes the local extension files from the selected editor. Reinstallation is intentionally out of scope for this screen.</p>
          {extensionToRemove ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
              {extensionToRemove.extensionId}
            </div>
          ) : null}
        </div>
      </BaseModal>
    </div>
  );
}
