import classNames from "classnames";

interface RadioChipsProps<T extends string> {
  items: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

export function RadioChips<T extends string>({ items, value, onChange, label }: RadioChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="radio"
          aria-checked={value === item.value}
          onClick={() => onChange(item.value)}
          className={classNames(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === item.value ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" : "text-slate-500 hover:text-slate-700"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
