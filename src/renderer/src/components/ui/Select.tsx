import { ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import { Check, ChevronDown } from "lucide-react";
import { useEvent, useKey } from "react-use";

const PANEL_GAP = 8;
const PANEL_MIN_WIDTH = 220;
const PANEL_MAX_HEIGHT = 320;
const VIEWPORT_PADDING = 8;

type PanelPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
};

function getPanelPosition(triggerRect: DOMRect, minPanelWidth: number): PanelPosition {
  const width = Math.max(triggerRect.width, minPanelWidth);
  const left = Math.min(
    Math.max(VIEWPORT_PADDING, triggerRect.left),
    window.innerWidth - width - VIEWPORT_PADDING,
  );

  const spaceBelow = window.innerHeight - triggerRect.bottom - PANEL_GAP - VIEWPORT_PADDING;
  const spaceAbove = triggerRect.top - PANEL_GAP - VIEWPORT_PADDING;
  const placement = spaceBelow < 220 && spaceAbove > spaceBelow ? "top" : "bottom";
  const availableHeight = placement === "bottom" ? spaceBelow : spaceAbove;

  return {
    top:
      placement === "bottom"
        ? triggerRect.bottom + PANEL_GAP
        : triggerRect.top - PANEL_GAP,
    left,
    width,
    maxHeight: Math.max(120, Math.min(PANEL_MAX_HEIGHT, availableHeight)),
    placement,
  };
}

interface SelectProps<T> {
  options: T[];
  value: string;
  onChange: (option: T) => void;
  getOptionValue: (option: T) => string;
  renderValue: (option: T) => ReactNode;
  renderOption?: (option: T) => ReactNode;
  ariaLabel: string;
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  optionClassName?: string;
  selectedOptionClassName?: string;
  placeholder?: ReactNode;
  minPanelWidth?: number;
}

export function Select<T>({
  options,
  value,
  onChange,
  getOptionValue,
  renderValue,
  renderOption,
  ariaLabel,
  className,
  triggerClassName,
  panelClassName,
  optionClassName,
  selectedOptionClassName,
  placeholder,
  minPanelWidth = PANEL_MIN_WIDTH,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const windowTarget = typeof window === "undefined" ? null : window;
  const documentTarget = typeof document === "undefined" ? null : document;

  const selectedOption = options.find((option) => getOptionValue(option) === value) ?? options[0];

  const updatePanelPosition = useCallback(() => {
    if (!triggerRef.current || !windowTarget) {
      return;
    }

    setPanelPosition(getPanelPosition(triggerRef.current.getBoundingClientRect(), minPanelWidth));
  }, [minPanelWidth, windowTarget]);

  const handleSelect = useCallback(
    (option: T) => {
      onChange(option);
      setOpen(false);
    },
    [onChange],
  );

  const toggleOpen = useCallback(() => {
    if (!options.length) {
      return;
    }

    setOpen((current) => !current);
  }, [options.length]);

  useEffect(() => {
    if (open) {
      updatePanelPosition();
    }
  }, [open, updatePanelPosition]);

  const handlePointerDown = useCallback(
    (event: Event) => {
      if (!open) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    },
    [open],
  );

  useEvent("mousedown", open ? handlePointerDown : undefined, documentTarget);
  useEvent("resize", open ? updatePanelPosition : undefined, windowTarget);
  useEvent("scroll", open ? updatePanelPosition : undefined, windowTarget, { capture: true });

  useKey(
    "Escape",
    () => {
      if (!open) {
        return;
      }

      setOpen(false);
      triggerRef.current?.focus();
    },
    {},
    [open],
  );

  return (
    <div ref={rootRef} className={classNames("w-full min-w-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        className={classNames(
          "inline-flex h-10 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 shadow-xs outline-none transition-[border-color,box-shadow] duration-200 hover:border-slate-300 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
          triggerClassName,
        )}
      >
        <div className="min-w-0 flex-1 truncate">
          {selectedOption ? renderValue(selectedOption) : placeholder}
        </div>
        <ChevronDown
          size={14}
          className={classNames(
            "shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {open && panelPosition && documentTarget
        ? createPortal(
            <div
              ref={panelRef}
              role="listbox"
              id={listboxId}
              aria-label={ariaLabel}
              className={classNames(
                "fixed z-50 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg",
                "transition-[opacity,transform] duration-150 ease-out",
                panelPosition.placement === "top" ? "origin-bottom" : "origin-top",
                panelClassName,
              )}
              style={{
                top: panelPosition.top,
                left: panelPosition.left,
                width: panelPosition.width,
                maxHeight: panelPosition.maxHeight,
                transform:
                  panelPosition.placement === "top" ? "translateY(-100%)" : undefined,
              }}
            >
              <div className="max-h-full overflow-y-auto">
                {options.map((option) => {
                  const optionValue = getOptionValue(option);
                  const isSelected = optionValue === value;

                  return (
                    <button
                      key={optionValue}
                      role="option"
                      aria-selected={isSelected}
                      type="button"
                      onClick={() => handleSelect(option)}
                      className={classNames(
                        "flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-sm outline-none transition-colors",
                        isSelected
                          ? "bg-slate-100 text-slate-950"
                          : "text-slate-700 hover:bg-slate-50 focus-visible:bg-slate-50",
                        optionClassName,
                        isSelected && selectedOptionClassName,
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        {renderOption ? renderOption(option) : renderValue(option)}
                      </div>
                      <Check
                        size={16}
                        className={classNames(
                          "shrink-0",
                          isSelected ? "text-slate-700" : "text-transparent",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}