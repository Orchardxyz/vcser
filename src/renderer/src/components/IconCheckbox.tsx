import { Check } from "lucide-react";
import { UiIcon } from "./UiIcon";

interface IconCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
}

export function IconCheckbox({
  checked,
  onChange,
  ariaLabel,
  disabled = false,
  className,
}: IconCheckboxProps) {
  return (
    <span className={`relative inline-flex h-5 w-5 shrink-0 ${className ?? ""}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={ariaLabel}
        disabled={disabled}
        className="peer absolute inset-0 z-10 m-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-flex h-5 w-5 items-center justify-center rounded-md border transition ${
          checked
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 bg-white text-transparent"
        } peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400 peer-focus-visible:ring-offset-1 peer-disabled:border-slate-200 peer-disabled:bg-slate-100`}
      >
        <UiIcon icon={Check} size={12} strokeWidth={2.5} />
      </span>
    </span>
  );
}
