import classNames from "classnames";
import { AlertCircle, CheckCheck, CircleCheck, CircleMinus } from "lucide-react";
import { Badge, BADGE_VARIANT } from "@/components/ui/Badge";
import { formatVersion } from "./ExtensionHelpers";

export interface SyncFeedback {
  tone: "success" | "error";
  title: string;
  detail: string;
}

export function SyncFeedbackBanner({ feedback }: { feedback: SyncFeedback }) {
  const isSuccess = feedback.tone === "success";

  return (
    <div
      className={classNames(
        "flex items-start gap-3 rounded-lg border px-4 py-3",
        isSuccess ? "border-emerald-200 bg-emerald-50/70" : "border-rose-200 bg-rose-50/70"
      )}
    >
      {isSuccess ? (
        <CheckCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
      ) : (
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
      )}
      <div className="min-w-0">
        <div className={classNames("text-sm font-medium", isSuccess ? "text-emerald-900" : "text-rose-900")}>{feedback.title}</div>
        <div className={classNames("mt-1 text-sm", isSuccess ? "text-emerald-800" : "text-rose-800")}>{feedback.detail}</div>
      </div>
    </div>
  );
}

export function PairStatusCell({ installed, version, disabled }: { installed: boolean; version: string | null; disabled: boolean }) {
  if (!installed) {
    return (
      <span className="inline-flex items-center text-slate-500" title="Missing" aria-label="Missing">
        <CircleMinus size={16} strokeWidth={1.9} />
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center text-emerald-600" title="Installed" aria-label="Installed">
        <CircleCheck size={16} strokeWidth={1.9} />
      </span>
      <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] text-slate-500">
        {formatVersion(version)}
      </span>
      {disabled ? <Badge variant={BADGE_VARIANT.WARNING}>Disabled</Badge> : null}
    </div>
  );
}
