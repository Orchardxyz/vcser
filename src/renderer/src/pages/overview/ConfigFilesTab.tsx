import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactDiffViewer from "react-diff-viewer-continued";
import {
  AlertCircle,
  ArrowLeftRight,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  FileJson,
} from "lucide-react";
import classNames from "classnames";
import { EditorSelect } from "../../components/editor/EditorSelect";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "../../components/ui/Button";
import { Badge, BADGE_VARIANT } from "../../components/ui/Badge";
import { Popover } from "../../components/ui/Popover";
import { invoke } from "../../ipc";
import { Skeleton } from "../../components/ui/Skeleton";
import { useAppStore } from "../../store";
import {
  EXTENSION_SETTINGS_GROUP_KIND,
  type ExtensionSettingsGroup,
  type ResolvedEditor,
  type SettingsDiffByExtensionResult,
  type SettingsKeyDiff,
} from "../../types";
import { formatDiffValue } from "../../utils";
import { diffHeaderClass, diffViewerStyles } from "../../lib/diff-constants";

function DiffHtml({
  diff,
  leftName,
  rightName,
}: {
  diff: SettingsKeyDiff;
  leftName: string;
  rightName: string;
}) {
  const isDark = document.documentElement.dataset.theme === "dark";
  const oldValue = formatDiffValue(diff.sourceValue);
  const newValue = formatDiffValue(diff.targetValue);

  // When one side is absent, ReactDiffViewer renders an entirely blank half-column.
  // Use a custom two-column layout instead so the absent side shows a clear indicator.
  if (oldValue.length === 0 || newValue.length === 0) {
    const isAddition = oldValue.length === 0;
    const presentLines = (isAddition ? newValue : oldValue).split("\n");

    const presentCell = isAddition ? (
      <div className="bg-emerald-50">
        {presentLines.map((line, i) => (
          <div key={i} className="flex items-baseline gap-1 px-2 py-px">
            <span className="w-6 shrink-0 select-none text-right text-emerald-300">
              {i + 1}
            </span>
            <span className="select-none text-emerald-400">+</span>
            <span className="whitespace-pre-wrap break-all text-emerald-800">
              {line}
            </span>
          </div>
        ))}
      </div>
    ) : (
      <div className="border-r border-slate-100 bg-rose-50">
        {presentLines.map((line, i) => (
          <div key={i} className="flex items-baseline gap-1 px-2 py-px">
            <span className="w-6 shrink-0 select-none text-right text-rose-300">
              {i + 1}
            </span>
            <span className="select-none text-rose-400">−</span>
            <span className="whitespace-pre-wrap break-all text-rose-800">
              {line}
            </span>
          </div>
        ))}
      </div>
    );

    const absentCell = (
      <div
        className={classNames(
          "flex items-center justify-center px-3 py-3 text-xs italic text-slate-400",
          isAddition
            ? "border-r border-slate-100 bg-slate-50/40"
            : "bg-slate-50/40",
        )}
      >
        — not set —
      </div>
    );

    return (
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div
          className={classNames(
            "grid grid-cols-2 border-b border-slate-200 bg-slate-50/70",
            diffHeaderClass,
          )}
        >
          <div className="border-r border-slate-200 px-3 py-2">{leftName}</div>
          <div className="px-3 py-2">{rightName}</div>
        </div>
        <div className="grid grid-cols-2 font-mono text-xs">
          {isAddition ? absentCell : presentCell}
          {isAddition ? presentCell : absentCell}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <ReactDiffViewer
        oldValue={oldValue}
        newValue={newValue}
        splitView
        leftTitle={leftName}
        rightTitle={rightName}
        useDarkTheme={isDark}
        extraLinesSurroundingDiff={2}
        showDiffOnly
        disableWorker
        styles={diffViewerStyles}
      />
    </div>
  );
}

function DiffBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <Badge
        variant={BADGE_VARIANT.SUCCESS}
        leadingIcon={<CheckCheck size={10} strokeWidth={2} />}
      >
        Identical
      </Badge>
    );
  }
  return (
    <Badge variant={BADGE_VARIANT.DANGER}>
      {count} {count === 1 ? "diff" : "diffs"}
    </Badge>
  );
}

function VersionMismatchBadge({ group }: { group: ExtensionSettingsGroup }) {
  if (!group.hasVersionMismatch) {
    return null;
  }

  return <Badge variant={BADGE_VARIANT.INFO}>Version mismatch</Badge>;
}

function VersionMismatchIndicator({
  group,
  leftName,
  rightName,
}: {
  group: ExtensionSettingsGroup;
  leftName: string;
  rightName: string;
}) {
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
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Installed versions
          </div>
          <div className="rounded-md bg-slate-50 px-2 py-1">
            <span className="font-medium">{leftName}:</span>{" "}
            {group.leftVersion ?? "Unknown"}
          </div>
          <div className="rounded-md bg-slate-50 px-2 py-1">
            <span className="font-medium">{rightName}:</span>{" "}
            {group.rightVersion ?? "Unknown"}
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

function groupPrimaryLabel(group: ExtensionSettingsGroup): string {
  if (group.kind === EXTENSION_SETTINGS_GROUP_KIND.VERSION_ONLY) {
    return "Version mismatch only";
  }

  return group.namespace;
}

function groupSecondaryLabel(
  group: ExtensionSettingsGroup,
): string | undefined {
  if (group.extensionId) {
    return group.extensionId;
  }

  if (group.kind === EXTENSION_SETTINGS_GROUP_KIND.VERSION_ONLY) {
    return "No extension namespace keys found";
  }

  return undefined;
}

function GroupDetails({
  group,
  leftName,
  rightName,
}: {
  group: ExtensionSettingsGroup;
  leftName: string;
  rightName: string;
}) {
  if (group.diffs.length > 0) {
    return (
      <DiffTable
        diffs={group.diffs}
        leftName={leftName}
        rightName={rightName}
      />
    );
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

function MissingExtensionIndicator({
  group,
  leftName,
  rightName,
}: {
  group: ExtensionSettingsGroup;
  leftName: string;
  rightName: string;
}) {
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
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Not installed in
          </div>
          {missing.map((name) => (
            <div
              key={name}
              className="rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-700"
            >
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

function ExtensionIcon({ group }: { group: ExtensionSettingsGroup }) {
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

function DiffTable({
  diffs,
  leftName,
  rightName,
}: {
  diffs: SettingsKeyDiff[];
  leftName: string;
  rightName: string;
}) {
  return (
    <table className="w-full table-fixed text-xs">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/60">
          <th className="w-[24%] px-3 py-2 text-left font-medium text-slate-500">
            Key
          </th>
          <th className="w-[76%] px-3 py-2 text-left font-medium text-slate-500">
            Diff
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {diffs.map((diff) => {
          return (
            <tr key={diff.key} className="align-top hover:bg-slate-50/60">
              <td className="break-all px-3 py-3 font-mono text-slate-600">
                {diff.key}
              </td>
              <td className="px-3 py-3">
                <DiffHtml
                  diff={diff}
                  leftName={leftName}
                  rightName={rightName}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SkeletonRow() {
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

function ExtensionGroupRow({
  group,
  leftName,
  rightName,
  checked,
  onCheckedChange,
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
        className={classNames(
          "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50/60",
          { "bg-slate-50/40": expanded },
        )}
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
            <span className="truncate text-sm font-medium text-slate-800">
              {groupPrimaryLabel(group)}
            </span>
            <MissingExtensionIndicator
              group={group}
              leftName={leftName}
              rightName={rightName}
            />
            <VersionMismatchIndicator
              group={group}
              leftName={leftName}
              rightName={rightName}
            />
          </div>
          {groupSecondaryLabel(group) && (
            <span className="block truncate font-mono text-xs text-slate-400">
              {groupSecondaryLabel(group)}
            </span>
          )}
        </div>

        <VersionMismatchBadge group={group} />
        <DiffBadge count={group.diffs.length} />

        <span className="ml-1 shrink-0 text-slate-400">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/30">
          <GroupDetails
            group={group}
            leftName={leftName}
            rightName={rightName}
          />
        </div>
      )}
    </div>
  );
}

export function ConfigFilesTab() {
  const editors = useAppStore((s) => s.editors);
  const [leftSlug, setLeftSlug] = useState<string>("");
  const [rightSlug, setRightSlug] = useState<string>("");
  const [diffResult, setDiffResult] =
    useState<SettingsDiffByExtensionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNamespaces, setSelectedNamespaces] = useState<Set<string>>(
    new Set(),
  );

  const editorSlugs = useMemo(() => editors.map((e) => e.slug), [editors]);
  const editorBySlug = useMemo(() => {
    const m = new Map<string, ResolvedEditor>();
    for (const e of editors) m.set(e.slug, e);
    return m;
  }, [editors]);

  const leftEditorSlug =
    leftSlug && editorSlugs.includes(leftSlug)
      ? leftSlug
      : (editorSlugs[0] ?? "");
  const rightEditorSlug =
    rightSlug && editorSlugs.includes(rightSlug)
      ? rightSlug
      : (editorSlugs[1] ?? editorSlugs[0] ?? "");

  const leftEditor = editorBySlug.get(leftEditorSlug);
  const rightEditor = editorBySlug.get(rightEditorSlug);

  const leftName = leftEditor?.name ?? leftEditorSlug;
  const rightName = rightEditor?.name ?? rightEditorSlug;

  const handleSwap = useCallback(() => {
    setLeftSlug(rightEditorSlug);
    setRightSlug(leftEditorSlug);
  }, [leftEditorSlug, rightEditorSlug]);

  useEffect(() => {
    if (!leftName || !rightName || leftName === rightName) return;
    setLoading(true);
    setSelectedNamespaces(new Set());
    invoke<SettingsDiffByExtensionResult>(
      "compute_settings_diff_by_extension",
      {
        leftEditor: leftName,
        rightEditor: rightName,
      },
    )
      .then((result) => {
        setDiffResult(result);
      })
      .finally(() => setLoading(false));
  }, [leftName, rightName]);

  const groups = diffResult?.groups ?? [];
  const allNamespaces = groups.map((g) => g.namespace);
  const allSelected =
    allNamespaces.length > 0 &&
    allNamespaces.every((n) => selectedNamespaces.has(n));
  const someSelected =
    !allSelected && allNamespaces.some((n) => selectedNamespaces.has(n));

  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedNamespaces(new Set());
    } else {
      setSelectedNamespaces(new Set(allNamespaces));
    }
  }, [allSelected, allNamespaces]);

  const toggleNamespace = useCallback((namespace: string, checked: boolean) => {
    setSelectedNamespaces((prev) => {
      const next = new Set(prev);
      if (checked) next.add(namespace);
      else next.delete(namespace);
      return next;
    });
  }, []);

  const selectedGroups = groups.filter((g) =>
    selectedNamespaces.has(g.namespace),
  );
  const canOverride = selectedGroups.length > 0;

  const headerBar = (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
      {editors.length > 0 ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <EditorSelect
            editors={editors}
            value={leftEditorSlug}
            onChange={setLeftSlug}
            className="min-w-0 flex-1"
          />
          <Button
            variant={BUTTON_VARIANT.GHOST}
            size={BUTTON_SIZE.ICON}
            onClick={handleSwap}
            title="Swap editors"
            aria-label="Swap editors"
          >
            <ArrowLeftRight size={16} />
          </Button>
          <EditorSelect
            editors={editors}
            value={rightEditorSlug}
            onChange={setRightSlug}
            className="min-w-0 flex-1"
          />
        </div>
      ) : (
        <span className="text-sm text-slate-400">No editors detected</span>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <Button variant={BUTTON_VARIANT.SECONDARY} disabled={!canOverride}>
          Override with Left
        </Button>
        <Button disabled={!canOverride}>Override with Right</Button>
      </div>
    </div>
  );

  if (editors.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {headerBar}
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <FileJson size={32} className="text-slate-300" />
          <p className="text-sm text-slate-500">No editors detected.</p>
        </div>
      </div>
    );
  }

  if (loading || (!diffResult && editors.length > 0)) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {headerBar}
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        {headerBar}
        <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
          <CheckCheck size={32} className="text-emerald-400" />
          <p className="text-sm text-slate-500">
            No settings found between {leftName} and {rightName}.
          </p>
        </div>
      </div>
    );
  }

  const hasDiffs = groups.some((g) => g.diffs.length > 0);
  const diffCount = groups.reduce((acc, g) => acc + g.diffs.length, 0);
  const versionMismatchCount = groups.filter(
    (group) => group.hasVersionMismatch,
  ).length;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      {headerBar}

      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-2">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={toggleAll}
            className="h-4 w-4 cursor-pointer accent-primary"
            aria-label="Select all extension groups"
          />
          <span className="text-xs text-slate-500">
            {selectedGroups.length > 0
              ? `${selectedGroups.length} of ${groups.length} selected`
              : `${groups.length} namespace${groups.length === 1 ? "" : "s"}`}
          </span>
        </label>

        {hasDiffs && (
          <span className="ml-auto text-xs text-slate-400">
            {diffCount} total {diffCount === 1 ? "diff" : "diffs"} across{" "}
            {groups.filter((g) => g.diffs.length > 0).length} groups
            {versionMismatchCount > 0
              ? `, ${versionMismatchCount} version mismatch${versionMismatchCount === 1 ? "" : "es"}`
              : ""}
          </span>
        )}

        {!hasDiffs && versionMismatchCount > 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-sky-700">
            <ArrowLeftRight size={12} />
            Config values match, but {versionMismatchCount} extension version
            {versionMismatchCount === 1 ? "" : "s"} differ
          </span>
        )}

        {!hasDiffs && versionMismatchCount === 0 && (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600">
            <CheckCheck size={12} />
            All settings identical
          </span>
        )}
      </div>

      <div className="divide-y divide-slate-100">
        {groups.map((group) => (
          <ExtensionGroupRow
            key={`${group.kind}:${group.extensionId ?? group.namespace}`}
            group={group}
            leftName={leftName}
            rightName={rightName}
            checked={selectedNamespaces.has(group.namespace)}
            onCheckedChange={(checked) =>
              toggleNamespace(group.namespace, checked)
            }
          />
        ))}
      </div>
    </div>
  );
}
