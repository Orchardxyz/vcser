type SegmentedTabItem<T extends string> = {
  value: T;
  label: string;
};

interface SegmentedTabsProps<T extends string> {
  items: SegmentedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: SegmentedTabsProps<T>) {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );
  const gap = 4;
  const padding = 4;
  const width = `calc((100% - ${padding * 2}px - ${(items.length - 1) * gap}px) / ${items.length})`;
  const left = `calc(${padding}px + ${activeIndex} * (${width} + ${gap}px))`;

  return (
    <div
      className={[
        "relative inline-grid items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    >
      <div
        className="absolute top-1 bottom-1 rounded-lg bg-slate-950 shadow-xs transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
        style={{ left, width }}
      />
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={[
            "relative z-10 rounded-lg px-4 py-2 text-sm font-medium outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            value === item.value
              ? "text-white"
              : "text-slate-600 hover:text-slate-900",
          ].join(" ")}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
