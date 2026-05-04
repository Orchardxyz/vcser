import { useState, useRef, useCallback } from "react";
import { useClickAway } from "react-use";
import { ChevronDown } from "lucide-react";
import type { ResolvedEditor } from "../../types";
import { EditorIdentity, EDITOR_IDENTITY_MODE } from "./EditorIdentity";

interface EditorSelectProps {
  editors: ResolvedEditor[];
  value: string;
  onChange: (slug: string) => void;
}

export function EditorSelect({ editors, value, onChange }: EditorSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickAway(ref, () => setOpen(false));

  const selected = editors.find((e) => e.slug === value);
  const selectedEditor = selected ?? editors[0];

  const handleSelect = useCallback(
    (slug: string) => {
      onChange(slug);
      setOpen(false);
    },
    [onChange],
  );

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all duration-200 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
      >
        {selectedEditor && (
          <EditorIdentity editor={selectedEditor} mode={EDITOR_IDENTITY_MODE.COMPACT} />
        )}
        <ChevronDown
          size={14}
          className={[
            "shrink-0 text-slate-400 transition-transform duration-200",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {editors.map((editor) => (
            <button
              key={editor.slug}
              type="button"
              onClick={() => handleSelect(editor.slug)}
              className={[
                "flex w-full items-center px-3 py-2 text-sm outline-none transition-colors",
                editor.slug === value
                  ? "bg-slate-50 text-slate-900"
                  : "text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.COMPACT} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
