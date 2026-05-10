import type { ResolvedEditor } from "../../types";
import { EditorIdentity, EDITOR_IDENTITY_MODE } from "./EditorIdentity";
import { Select } from "../ui/Select";

interface EditorSelectProps {
  editors: ResolvedEditor[];
  value: string;
  onChange: (slug: string) => void;
  className?: string;
}

export function EditorSelect({ editors, value, onChange, className }: EditorSelectProps) {
  return (
    <Select<ResolvedEditor>
      options={editors}
      value={value}
      onChange={(editor) => onChange(editor.slug)}
      getOptionValue={(editor) => editor.slug}
      renderValue={(editor) => <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.COMPACT} className="min-w-0 flex-1" />}
      renderOption={(editor) => <EditorIdentity editor={editor} mode={EDITOR_IDENTITY_MODE.COMPACT} className="min-w-0 flex-1" />}
      ariaLabel="Editors"
      className={className}
      triggerClassName="min-w-50"
    />
  );
}
