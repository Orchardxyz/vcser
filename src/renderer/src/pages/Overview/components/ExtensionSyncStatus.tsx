import { CircleCheck, CircleMinus } from "lucide-react";
import { Badge, BADGE_VARIANT } from "@/components/ui/Badge";
import { formatVersion } from "./ExtensionHelpers";

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
