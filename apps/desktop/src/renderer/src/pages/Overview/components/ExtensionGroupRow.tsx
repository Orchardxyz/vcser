import { useEffect, useRef, useState } from "react";
import classNames from "classnames";
import { AlertCircle, ArrowLeftRight, CheckCheck, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge, BADGE_VARIANT } from "@/components/ui/Badge";
import { Popover } from "@/components/ui/Popover";

import { EXTENSION_SETTINGS_GROUP_KIND, type ExtensionSettingsGroup } from "@/types";
import { DiffTable, DiffBadge } from "./DiffComponents";

export function groupPrimaryLabel(group: ExtensionSettingsGroup, t: (key: string) => string): string {
  if (group.kind === EXTENSION_SETTINGS_GROUP_KIND.VERSION_ONLY) {
    return t("overview.groupRow.versionMismatchOnly");
  }

  return group.namespace;
}

export function groupSecondaryLabel(group: ExtensionSettingsGroup, t: (key: string) => string): string | undefined {
  if (group.extensionId) {
    return group.extensionId;
  }

  if (group.kind === EXTENSION_SETTINGS_GROUP_KIND.VERSION_ONLY) {
    return t("overview.groupRow.noNamespaceKeysFound");
  }

  return undefined;
}

export function VersionMismatchBadge({ group }: { group: ExtensionSettingsGroup }) {
  const { t } = useTranslation();

  if (!group.hasVersionMismatch) {
    return null;
  }

  return <Badge variant={BADGE_VARIANT.INFO}>{t("overview.groupRow.versionMismatch")}</Badge>;
}

export function VersionMismatchIndicator({ group, leftName, rightName }: { group: ExtensionSettingsGroup; leftName: string; rightName: string }) {
  const { t } = useTranslation();

  if (!group.hasVersionMismatch) {
    return null;
  }

  return (
    <Popover
      trigger="hover"
      placement="top"
      align="center"
      sideOffset={8}
      panelClassName="min-w-[180px]"
      content={
        <div className="space-y-1.5 text-sm text-slate-700">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{t("overview.groupRow.installedVersions")}</div>
          <div className="rounded-md bg-slate-50 px-2 py-1">
            <span className="font-medium">{leftName}:</span> {group.leftVersion ?? t("common.unknown")}
          </div>
          <div className="rounded-md bg-slate-50 px-2 py-1">
            <span className="font-medium">{rightName}:</span> {group.rightVersion ?? t("common.unknown")}
          </div>
        </div>
      }
    >
      <span className="inline-flex shrink-0 items-center text-sky-500">
        <ArrowLeftRight size={14} />
      </span>
    </Popover>
  );
}

export function MissingExtensionIndicator({ group, leftName, rightName }: { group: ExtensionSettingsGroup; leftName: string; rightName: string }) {
  const { t } = useTranslation();
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
      panelClassName="min-w-[160px]"
      content={
        <div className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">{t("overview.groupRow.notInstalledIn")}</div>
          {missing.map((name) => (
            <div key={name} className="rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-700">
              {name}
            </div>
          ))}
        </div>
      }
    >
      <span className="inline-flex shrink-0 items-center text-amber-500">
        <AlertCircle size={14} />
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

function GroupDetails({ group, leftName, rightName }: { group: ExtensionSettingsGroup; leftName: string; rightName: string }) {
  const { t } = useTranslation();

  if (group.diffs.length > 0) {
    return <DiffTable diffs={group.diffs} leftName={leftName} rightName={rightName} />;
  }

  if (group.hasVersionMismatch) {
    return (
      <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-sky-700">
        <ArrowLeftRight size={16} className="text-sky-500" />
        {group.kind === EXTENSION_SETTINGS_GROUP_KIND.VERSION_ONLY
          ? t("overview.diff.noConfigKeysFoundVersionsDiffer")
          : t("overview.diff.noConfigDiffsVersionsDiffer")}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
      <CheckCheck size={16} className="text-emerald-500" />
      {t("overview.diff.noDifferencesInGroup")}
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
  const { t } = useTranslation();
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
          aria-label={t("overview.groupRow.selectGroup", { group: group.namespace })}
        />

        <ExtensionIcon group={group} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-slate-800">{groupPrimaryLabel(group, t)}</span>
            <MissingExtensionIndicator group={group} leftName={leftName} rightName={rightName} />
            <VersionMismatchIndicator group={group} leftName={leftName} rightName={rightName} />
          </div>
          {groupSecondaryLabel(group, t) && <span className="block truncate font-mono text-xs text-slate-400">{groupSecondaryLabel(group, t)}</span>}
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
