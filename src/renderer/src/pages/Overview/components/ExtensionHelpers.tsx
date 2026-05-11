import { useEffect, useState } from "react";
import { ArrowLeftRight, CircleOff } from "lucide-react";
import { EditorIdentity, EDITOR_IDENTITY_MODE } from "../../../components/editor/EditorIdentity";
import { Badge, BADGE_VARIANT } from "../../../components/ui/Badge";
import { Popover } from "../../../components/ui/Popover";
import type { ExtensionPresence, ResolvedEditor } from "../../../types";

export function displayName(id: string): string {
  const local = id.split(".")[1] ?? id;
  return local.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function shortenExtensionId(id: string, maxLength = 28): string {
  if (id.length <= maxLength) {
    return id;
  }

  const prefixLength = Math.max(12, Math.floor((maxLength - 1) * 0.6));
  const suffixLength = Math.max(8, maxLength - prefixLength - 1);
  return `${id.slice(0, prefixLength)}…${id.slice(-suffixLength)}`;
}

export function formatVersion(version: string | null | undefined): string {
  return version ?? "Unknown";
}

export function ExtensionIcon({ extensionId, iconDataUrl }: { extensionId: string; iconDataUrl?: string }) {
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

export function EditorPresenceBadge({ name, editorByName }: { name: string; editorByName: Map<string, ResolvedEditor> }) {
  const editor = editorByName.get(name);

  if (editor) {
    return <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.ICON} className="h-5.5 w-5.5 rounded-md" />;
  }

  return (
    <span
      className="inline-flex h-5.5 w-5.5 items-center justify-center rounded-full bg-slate-100 text-[10px] font-medium text-slate-600"
      title={name}
      aria-label={name}
    >
      {name[0]}
    </span>
  );
}

export function EditorVersionPill({
  name,
  version,
  editorByName
}: {
  name: string;
  version: string | null;
  editorByName: Map<string, ResolvedEditor>;
}) {
  return (
    <div className="relative inline-flex pr-7 pt-1">
      <EditorPresenceBadge name={name} editorByName={editorByName} />
      <span className="absolute right-4 top-0 rounded-full border border-slate-200 bg-white/95 px-1.5 py-0.5 text-[10px] font-medium leading-none text-slate-500 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
        {formatVersion(version)}
      </span>
    </div>
  );
}

export function VersionMismatchIndicator({
  entry,
  editorNames,
  ribbon = false
}: {
  entry: ExtensionPresence;
  editorNames: string[];
  ribbon?: boolean;
}) {
  if (!entry.hasVersionMismatch) {
    return null;
  }

  const installedVersions = editorNames.filter((name) => entry.presence[name]);

  return (
    <Popover
      trigger="click"
      placement="bottom"
      align="start"
      sideOffset={10}
      panelClassName="min-w-[200px]"
      content={
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Installed versions</div>
          <div className="space-y-1">
            {installedVersions.map((name) => (
              <div key={name} className="rounded-md bg-slate-50 px-2 py-1 text-sm text-slate-700">
                <span className="font-medium">{name}:</span> {formatVersion(entry.versions[name])}
              </div>
            ))}
          </div>
        </div>
      }
    >
      {ribbon ? (
        <Badge.Ribbon
          variant={BADGE_VARIANT.INFO}
          role="button"
          tabIndex={0}
          aria-label="Show version mismatch details"
          title="Version mismatch"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/50"
        >
          <ArrowLeftRight size={12} aria-hidden="true" />
        </Badge.Ribbon>
      ) : (
        <Badge variant={BADGE_VARIANT.INFO} leadingIcon={<ArrowLeftRight size={12} />}>
          Version mismatch
        </Badge>
      )}
    </Popover>
  );
}

export function DisabledIndicator({ disabledIn }: { disabledIn: string[] }) {
  if (disabledIn.length === 0) {
    return null;
  }

  return (
    <Popover
      trigger="click"
      placement="bottom"
      align="start"
      sideOffset={10}
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
      <button
        type="button"
        className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50"
        aria-label="Show disabled editors"
      >
        <Badge variant={BADGE_VARIANT.WARNING} leadingIcon={<CircleOff size={12} aria-hidden="true" />}>
          Disabled
        </Badge>
      </button>
    </Popover>
  );
}
