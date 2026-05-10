import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { AlertCircle, ArrowLeftRight, CheckCheck, ChevronDown, ChevronRight } from "lucide-react";
import { Badge, BADGE_VARIANT } from "../../../components/ui/Badge";
import { Popover } from "../../../components/ui/Popover";
import { Skeleton } from "../../../components/ui/Skeleton";
import { EXTENSION_SETTINGS_GROUP_KIND, type ExtensionSettingsGroup } from "../../../types";
import { DiffTable, DiffBadge } from "./diff-components";

export function groupPrimaryLabel(group: ExtensionSettingsGroup): string {
  if (group.kind === EXTENSION_SETTINGS_GROUP_KIND.VERSION_ONLY) {
    return "Version mismatch only";
  }

  return group.namespace;
}

export function groupSecondaryLabel(group: ExtensionSettingsGroup): string | undefined {
  if (group.extensionId) {
    return group.extensionId;
  }

  if (group.kind === EXTENSION_SETTINGS_GROUP_KIND.VERSION_ONLY) {
    return "No extension namespace keys found";
  }

  return undefined;
}

export function VersionMismatchBadge({ group }: { group: ExtensionSettingsGroup }) {
  if (!group.hasVersionMismatch) {
    return null;
  }

  return <Badge variant={BADGE_VARIANT.INFO}>Version mismatch</Badge>;
}

export function VersionMismatchIndicator({ group, leftName, rightName }: { group: ExtensionSettingsGroup; leftName: string; rightName: string }) {
  if (!group.hasVersionMismatch) {
    return null;
  }

  return (
    <Popover
      trigger="hover"
      placement="top"
      align="center"
      sideOffset={8}
      showArrow
      panelClassName="min-w-[180px]"
      content={
        <div className="space-y-1.5 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Installed versions</div>
          <div className="rounded-md bg-slate-50 px-2 py-1">
            <span className="font-medium">{leftName}:</span> {group.leftVersion ?? "Unknown"}
          </div>
          <div className="rounded-md bg-slate-50 px-2 py-1">
            <span className="font-medium">{rightName}:</span> {group.rightVersion ?? "Unknown"}
          </div>
        </div>
      }
    >
      <span className="inline-flex shrink-0 items-center text-sky-500">
        <ArrowLeftRight size={14} strokeWidth={1.9} />
      </span>
    </Popover>
  );
}

export function MissingExtensionIndicator({ group, leftName, rightName }: { group: ExtensionSettingsGroup; leftName: string; rightName: string }) {
  const missing: string[] = [];
  if (group.leftHasExtension === false) missing.push(leftName);
  if (group.rightHasExtension === false) missing.push(rightName);
  if (missing.length === 0) return null;

  return (
    <Popover
      trigger="hover"
      placement="top"
      align="center"
      sideOffset={8}
      showArrow
      panelClassName="min-w-[160px]"
      content={
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Not installed in</div>
          {missing.map((name) => (
            <div key={name} className="rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-700">
              {name}
            </div>
          ))}
        </div>
      }
    >
      <span className="inline-flex shrink-0 items-center text-amber-500">
        <AlertCircle size={14} strokeWidth={1.9} />
      </span>
    </Popover>
  );
}

export function ExtensionIcon({ group }: { group: ExtensionSettingsGroup }) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [group.extensionIconDataUrl]);

  if (group.extensionIconDataUrl && !imgFailed) {
    return (
      <img
        src={group.extensionIconDataUrl}
        alt={group.namespace}
        className="h-7 w-7 shrink-0 rounded object-contain"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-slate-200 text-xs font-bold uppercase text-slate-600">
      {(group.namespace || group.extensionId || "?")[0]}
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
      <Skeleton className="h-4 w-4" />
      <Skeleton className="h-7 w-7" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

function GroupDetails({ group, leftName, rightName }: { group: ExtensionSettingsGroup; leftName: string; rightName: string }) {
  if (group.diffs.length > 0) {
    return <DiffTable diffs={group.diffs} leftName={leftName} rightName={rightName} />;
  }

  if (group.hasVersionMismatch) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-sky-700">
        <ArrowLeftRight size={16} className="text-sky-500" />
        {group.kind === EXTENSION_SETTINGS_GROUP_KIND.VERSION_ONLY
          ? "No config keys found. Installed versions differ."
          : "No config diffs. Installed versions differ."}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
      <CheckCheck size={16} className="text-emerald-500" />
      No differences in this group.
    </div>
  );
}

export function ExtensionGroupRow({
  group,
  leftName,
  rightName,
  checked,
  onCheckedChange
}: {
  group: ExtensionSettingsGroup;
  leftName: string;
  rightName: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <div
        className={classNames("flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/60", {
          "bg-slate-50/40": expanded
        })}
        onClick={(e) => {
          if (checkboxRef.current?.contains(e.target as Node)) return;
          setExpanded((v) => !v);
        }}
      >
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
          aria-label={`Select ${group.namespace} group`}
        />

        <ExtensionIcon group={group} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-slate-800">{groupPrimaryLabel(group)}</span>
            <MissingExtensionIndicator group={group} leftName={leftName} rightName={rightName} />
            <VersionMismatchIndicator group={group} leftName={leftName} rightName={rightName} />
          </div>
          {groupSecondaryLabel(group) && <span className="block truncate font-mono text-xs text-slate-400">{groupSecondaryLabel(group)}</span>}
        </div>

        <VersionMismatchBadge group={group} />
        <DiffBadge count={group.diffs.length} />

        <span className="ml-1 shrink-0 text-slate-400">{expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/30">
          <GroupDetails group={group} leftName={leftName} rightName={rightName} />
        </div>
      )}
    </div>
  );
}
