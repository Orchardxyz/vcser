import { useState } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { BaseModal } from "@/components/ui/BaseModal";
import { Button, BUTTON_VARIANT } from "@/components/ui/Button";
import { invoke } from "@/ipc";
import type { ExtensionPresence, ResolvedEditor, SyncActionInput, SyncResult } from "@/types";
import { SYNC_ACTION_TYPE } from "@/types";
import { displayName, shortenExtensionId, ExtensionIcon } from "../ExtensionHelpers";

interface SyncExtensionModalProps {
  open: boolean;
  sourceEditor: ResolvedEditor;
  targetEditor: ResolvedEditor;
  extensions: ExtensionPresence[];
  onClose: () => void;
  onComplete: (results: SyncResult[]) => void;
}

type Phase = "idle" | "running" | "done";

export function SyncExtensionModal({ open, sourceEditor, targetEditor, extensions, onClose, onComplete }: SyncExtensionModalProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<SyncResult[]>([]);

  const handleClose = () => {
    if (phase === "running") return;
    setPhase("idle");
    setResults([]);
    onClose();
  };

  const handleDone = () => {
    setPhase("idle");
    const nextResults = results;
    setResults([]);
    onComplete(nextResults);
  };

  const handleSync = async () => {
    setPhase("running");

    const actions: SyncActionInput[] = extensions.map((ext) => ({
      actionType: SYNC_ACTION_TYPE.INSTALL,
      extensionId: ext.extensionId,
      sourceEditor: sourceEditor.name,
      targetEditor: targetEditor.name
    }));

    try {
      // @ts-expect-error SyncActionInput is JSON-compatible; type-fest JsonObject index-signature is overly strict
      const syncResults = await invoke<SyncResult[]>("execute_sync", { actions });
      setResults(syncResults);
    } catch (error) {
      setResults(
        extensions.map((extension) => ({
          action: SYNC_ACTION_TYPE.INSTALL,
          editor: targetEditor.name,
          extensionId: extension.extensionId,
          sourceEditor: sourceEditor.name,
          targetEditor: targetEditor.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        }))
      );
    }

    setPhase("done");
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  if (phase === "done") {
    return (
      <BaseModal
        open={open}
        title={`Sync complete — ${sourceEditor.displayName} → ${targetEditor.displayName}`}
        onClose={handleClose}
        footer={
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {successCount} succeeded{failCount > 0 ? `, ${failCount} failed` : ""}
            </span>
            <Button onClick={handleDone}>Done</Button>
          </div>
        }
      >
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {results.map((result, i) => {
            const ext = extensions.find((extension) => extension.extensionId === result.extensionId) ?? extensions[i];
            return (
              <div
                key={result.extensionId ?? ext?.extensionId ?? i}
                className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5"
              >
                {result.success ? (
                  <Check size={18} className="shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle size={18} className="shrink-0 text-red-500" />
                )}
                {ext && <ExtensionIcon extensionId={ext.extensionId} iconDataUrl={ext.iconDataUrl} />}
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">{ext ? displayName(ext.extensionId) : result.action}</span>
                  <span className="block truncate font-mono text-xs text-slate-400">{ext ? shortenExtensionId(ext.extensionId) : ""}</span>
                </div>
                {!result.success && result.error && (
                  <span className="shrink-0 text-xs text-red-500 max-w-[200px] truncate" title={result.error}>
                    {result.error}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      open={open}
      title={`Sync ${extensions.length} extensions — ${sourceEditor.displayName} → ${targetEditor.displayName}`}
      onClose={handleClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button variant={BUTTON_VARIANT.SECONDARY} onClick={handleClose} disabled={phase === "running"}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              void handleSync();
            }}
            disabled={phase === "running"}
          >
            {phase === "running" ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Syncing…
              </>
            ) : (
              `Sync ${extensions.length} Extension${extensions.length === 1 ? "" : "s"}`
            )}
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {extensions.map((ext) => (
            <div key={ext.extensionId} className="flex items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5">
              <ExtensionIcon extensionId={ext.extensionId} iconDataUrl={ext.iconDataUrl} />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-slate-800">{displayName(ext.extensionId)}</span>
                <span className="block truncate font-mono text-xs text-slate-400" title={ext.extensionId}>
                  {shortenExtensionId(ext.extensionId)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400">Extensions will be copied from {sourceEditor.displayName}&apos;s local directory.</p>
      </div>
    </BaseModal>
  );
}
