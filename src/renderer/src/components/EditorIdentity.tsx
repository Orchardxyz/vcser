import { Box } from "lucide-react";
import type { ResolvedEditor } from "../types";
import { APP_ICON_STATUS } from "../types";

export const EDITOR_IDENTITY_MODE = {
  CARD: "card",
  TAG: "tag",
  COMPACT: "compact",
  ICON: "icon",
} as const;

export type EditorIdentityMode =
  (typeof EDITOR_IDENTITY_MODE)[keyof typeof EDITOR_IDENTITY_MODE];

interface EditorIdentityProps {
  editor: ResolvedEditor;
  mode?: EditorIdentityMode;
  className?: string;
}

function FallbackIcon({ className }: { className?: string }) {
  return (
    <div
      className={[
        "flex items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 shrink-0",
        className,
      ].join(" ")}
    >
      <Box size="60%" strokeWidth={1.5} />
    </div>
  );
}

function EditorImg({ editor, className }: { editor: ResolvedEditor; className?: string }) {
  if (editor.iconStatus === APP_ICON_STATUS.READY && editor.iconPayload) {
    return (
      <img
        src={editor.iconPayload}
        alt={editor.displayName ?? editor.name}
        className={["shrink-0 object-contain", className].join(" ")}
      />
    );
  }

  return <FallbackIcon className={className} />;
}

export function EditorIdentity({ editor, mode = "compact", className }: EditorIdentityProps) {
  switch (mode) {
    case EDITOR_IDENTITY_MODE.CARD:
      return (
        <div className={["flex items-center gap-3", className].join(" ")}>
          <EditorImg editor={editor} className="h-11 w-11 rounded-lg" />
          <span className="text-xl font-semibold leading-7 text-slate-950">
            {editor.displayName ?? editor.name}
          </span>
        </div>
      );
    case EDITOR_IDENTITY_MODE.TAG:
      return (
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600",
            className,
          ].join(" ")}
        >
          <EditorImg editor={editor} className="h-4 w-4 rounded-sm" />
          {editor.displayName ?? editor.name}
        </span>
      );
    case EDITOR_IDENTITY_MODE.ICON:
      return (
        <EditorImg
          editor={editor}
          className={["h-11 w-11 rounded-lg", className].filter(Boolean).join(" ")}
        />
      );
    case EDITOR_IDENTITY_MODE.COMPACT:
    default:
      return (
        <span className={["inline-flex items-center gap-2", className].join(" ")}>
          <EditorImg editor={editor} className="h-5 w-5 rounded-sm" />
          <span className="text-sm text-slate-700">{editor.displayName ?? editor.name}</span>
        </span>
      );
  }
}
