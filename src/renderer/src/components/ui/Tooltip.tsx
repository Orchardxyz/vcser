import {
  cloneElement,
  ReactElement,
  ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import classNames from "classnames";

const TOOLTIP_PLACEMENT = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
} as const;

type TooltipPlacement =
  (typeof TOOLTIP_PLACEMENT)[keyof typeof TOOLTIP_PLACEMENT];

interface TooltipProps {
  /** Content shown inside the bubble. String or any ReactNode. */
  content: ReactNode;

  /** The element that triggers the tooltip. Must be a single child. */
  children: ReactElement;

  /**
   * How the tooltip is triggered.
   * - `"hover"` — opens on mouse enter / focus, closes on mouse leave / blur.
   * - `"click"` — toggles on click.
   * @default "hover"
   */
  trigger?: "hover" | "click";

  /**
   * Preferred placement of the bubble relative to the trigger.
   * @default "top"
   */
  placement?: TooltipPlacement;

  /**
   * Delay (ms) before the tooltip appears after hover/focus enters.
   * @default 400
   */
  delay?: number;

  /** Renders the tooltip but keeps it permanently invisible. */
  disabled?: boolean;

  /**
   * Max width of the bubble in pixels.
   * @default 240
   */
  maxWidth?: number;
}

const PLACEMENT_CLASSES: Record<TooltipPlacement, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const CARET_CLASSES: Record<TooltipPlacement, string> = {
  top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  left: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  right: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
};

export function Tooltip({
  content,
  children,
  trigger: triggerType = "hover",
  placement = TOOLTIP_PLACEMENT.TOP,
  delay = 400,
  disabled = false,
  maxWidth = 240,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleOpen() {
    if (disabled) return;
    timerRef.current = setTimeout(() => setOpen(true), delay);
  }

  function handleClose() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
  }

  function handleToggle() {
    if (disabled) return;
    setOpen((prev) => !prev);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const triggerProps =
    open && !disabled ? { "aria-describedby": id } : {};

  const childProps = children.props as {
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    onClick?: (e: React.MouseEvent) => void;
  };

  const trigger =
    triggerType === "click"
      ? cloneElement(children, {
          ...triggerProps,
          onClick(e: React.MouseEvent) {
            e.stopPropagation();
            childProps.onClick?.(e);
            handleToggle();
          },
        })
      : cloneElement(children, {
          ...triggerProps,
          onMouseEnter(e: React.MouseEvent) {
            childProps.onMouseEnter?.(e);
            handleOpen();
          },
          onMouseLeave(e: React.MouseEvent) {
            childProps.onMouseLeave?.(e);
            handleClose();
          },
          onFocus(e: React.FocusEvent) {
            childProps.onFocus?.(e);
            handleOpen();
          },
          onBlur(e: React.FocusEvent) {
            childProps.onBlur?.(e);
            handleClose();
          },
        });

  return (
    <div className="relative inline-flex">
      {trigger}

      <div
        role="tooltip"
        id={id}
        data-open={open}
        className={classNames(
          "absolute z-50 rounded-sm px-2 py-1",
          "text-xs leading-4 font-medium",
          "bg-foreground text-primary-foreground",
          "shadow-md",
          "opacity-0 translate-y-1",
          "transition-[opacity,transform] duration-150 ease-out",
          "data-[open=true]:opacity-100 data-[open=true]:translate-y-0",
          "pointer-events-none",
          PLACEMENT_CLASSES[placement],
        )}
        style={{ maxWidth }}
      >
        {content}
        <span
          aria-hidden="true"
          className={classNames(
            "absolute rotate-45 size-[5px] bg-foreground",
            CARET_CLASSES[placement],
          )}
        />
      </div>
    </div>
  );
}
