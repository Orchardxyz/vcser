import classNames from "classnames";
import { CheckCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import ReactDiffViewer from "react-diff-viewer-continued";
import { diffHeaderClass, diffViewerStyles } from "@/lib/diff-constants";
import type { SettingsKeyDiff } from "@/types";
import { formatDiffValue } from "@/utils";
import { Badge, BADGE_VARIANT } from "@/components/ui/Badge";

export function DiffHtml({ diff, leftName, rightName }: { diff: SettingsKeyDiff; leftName: string; rightName: string }) {
  const { t } = useTranslation();
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
            <span className="w-6 shrink-0 select-none text-right text-emerald-300">{i + 1}</span>
            <span className="select-none text-emerald-400">+</span>
            <span className="whitespace-pre-wrap break-all text-emerald-800">{line}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="border-r border-slate-100 bg-rose-50">
        {presentLines.map((line, i) => (
          <div key={i} className="flex items-baseline gap-1 px-2 py-px">
            <span className="w-6 shrink-0 select-none text-right text-rose-300">{i + 1}</span>
            <span className="select-none text-rose-400">−</span>
            <span className="whitespace-pre-wrap break-all text-rose-800">{line}</span>
          </div>
        ))}
      </div>
    );

    const absentCell = (
      <div
        className={classNames(
          "flex items-center justify-center px-3 py-3 text-xs italic text-slate-400",
          isAddition ? "border-r border-slate-100 bg-slate-50/40" : "bg-slate-50/40"
        )}
      >
        {t("common.notSet")}
      </div>
    );

    return (
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <div className={classNames("grid grid-cols-2 border-b border-slate-200 bg-slate-50/70", diffHeaderClass)}>
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

export function DiffBadge({ count }: { count: number }) {
  const { t } = useTranslation();

  if (count === 0) {
    return (
      <Badge variant={BADGE_VARIANT.SUCCESS} leadingIcon={<CheckCheck size={10} strokeWidth={2} />}>
        {t("overview.diff.identical")}
      </Badge>
    );
  }
  return <Badge variant={BADGE_VARIANT.DANGER}>{t("common.diffCount", { count })}</Badge>;
}

export function DiffTable({ diffs, leftName, rightName }: { diffs: SettingsKeyDiff[]; leftName: string; rightName: string }) {
  const { t } = useTranslation();

  return (
    <table className="w-full table-fixed text-xs">
      <thead>
        <tr className="border-b border-slate-100 bg-slate-50/60">
          <th className="w-[24%] px-3 py-2 text-left font-medium text-slate-500">{t("overview.diff.key")}</th>
          <th className="w-[76%] px-3 py-2 text-left font-medium text-slate-500">{t("overview.diff.diff")}</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {diffs.map((diff) => {
          return (
            <tr key={diff.key} className="align-top hover:bg-slate-50/60">
              <td className="break-all px-3 py-3 font-mono text-slate-600">{diff.key}</td>
              <td className="px-3 py-3">
                <DiffHtml diff={diff} leftName={leftName} rightName={rightName} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
