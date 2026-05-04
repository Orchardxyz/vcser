import {
  cloneElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useClickAway, useKey } from "react-use";
import classNames from "classnames";

const POPOVER_PLACEMENT = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
} as const;

type PopoverPlacement =
  (typeof POPOVER_PLACEMENT)[keyof typeof POPOVER_PLACEMENT];

const POPOVER_ALIGN = {
  START: "start",
  CENTER: "center",
  END: "end",
} as const;

type PopoverAlign = (typeof POPOVER_ALIGN)[keyof typeof POPOVER_ALIGN];

interface PopoverProps {
  /** Interactive content rendered inside the floating panel. */
  content: ReactNode;

  /** Trigger element. Must be a single React element. */
  children: ReactElement;

  /** Controlled open state. */
  open?: boolean;

  /** Uncontrolled initial state. */
  defaultOpen?: boolean;

  /** Controlled/uncontrolled state callback. */
  onOpenChange?: (nextOpen: boolean) => void;

  /** Preferred side of the panel relative to the trigger. */
  placement?: PopoverPlacement;

  /** Alignment along the cross axis. */
  align?: PopoverAlign;

  /** Gap between trigger and panel in pixels. */
  sideOffset?: number;

  /**
   * How the popover is triggered.
   * - `"click"` — toggles on click.
   * - `"hover"` — opens on mouse enter, closes on mouse leave.
  * @default "hover"
   */
  trigger?: "click" | "hover";

  /** Disable all popover behavior. */
  disabled?: boolean;

  /**
   * Close when clicking outside the popover root.
   * @default true
   */
  closeOnOutsideClick?: boolean;

  /**
   * Close on Escape key.
   * @default true
   */
  closeOnEscape?: boolean;

  /**
   * Close when clicking inside the panel, unless opted out by content.
   * @default false
   */
  closeOnSelect?: boolean;

  /**
   * Show a small arrow/caret pointing to the trigger.
   * @default false
   */
  showArrow?: boolean;

  /** Optional width constraint for the panel. */
  maxWidth?: number | string;

  /** Optional class override for the floating panel container. */
  panelClassName?: string;
}

const PLACEMENT_CLASSES: Record<
  PopoverPlacement,
  string
> = {
  top: "bottom-full",
  bottom: "top-full",
  left: "right-full",
  right: "left-full",
};

const VERTICAL_ALIGN_CLASSES: Record<
  PopoverAlign,
  string
> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

const HORIZONTAL_ALIGN_CLASSES: Record<
  PopoverAlign,
  string
> = {
  start: "top-0",
  center: "top-1/2 -translate-y-1/2",
  end: "bottom-0",
};

const ANIMATION_CLASSES: Record<
  PopoverPlacement,
  string
> = {
  top: "translate-y-1",
  bottom: "-translate-y-1",
  left: "translate-x-1",
  right: "-translate-x-1",
};

const ARROW_CLASSES: Record<PopoverPlacement, string> = {
  top: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2",
  bottom: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2",
  left: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2",
  right: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2",
};

export function Popover({
  content,
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  placement = POPOVER_PLACEMENT.BOTTOM,
  align = POPOVER_ALIGN.CENTER,
  sideOffset,
  trigger: triggerType = "hover",
  disabled = false,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  closeOnSelect = false,
  showArrow = false,
  maxWidth,
  panelClassName,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const panelId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (disabled) return;
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [disabled, isControlled, onOpenChange],
  );

  const openPopover = useCallback(() => setOpen(true), [setOpen]);
  const closePopover = useCallback(() => setOpen(false), [setOpen]);
  const togglePopover = useCallback(
    () => setOpen(!isOpen),
    [setOpen, isOpen],
  );

  // Dismiss on outside click
  useClickAway(rootRef, () => {
    if (!isOpen || !closeOnOutsideClick) return;
    closePopover();
  });

  // Dismiss on Escape
  useKey(
    "Escape",
    () => {
      if (!isOpen || !closeOnEscape) return;
      closePopover();
      triggerRef.current?.focus();
    },
    {},
    [isOpen, closeOnEscape, closePopover],
  );

  // Dismiss when focus leaves the root
  function handleRootBlur() {
    requestAnimationFrame(() => {
      if (
        rootRef.current &&
        !rootRef.current.contains(document.activeElement)
      ) {
        closePopover();
      }
    });
  }

  // Keep latest values for unmount cleanup
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    return () => {
      if (isOpenRef.current) {
        onOpenChangeRef.current?.(false);
      }
    };
  }, []);

  const alignmentClass =
    placement === "top" || placement === "bottom"
      ? VERTICAL_ALIGN_CLASSES[align]
      : HORIZONTAL_ALIGN_CLASSES[align];

  const panelOffsetStyle: React.CSSProperties = {
    maxWidth,
    marginTop: placement === "bottom" ? sideOffset : undefined,
    marginBottom: placement === "top" ? sideOffset : undefined,
    marginLeft: placement === "right" ? sideOffset : undefined,
    marginRight: placement === "left" ? sideOffset : undefined,
  };

  // ARIA attributes for the trigger
  const ariaProps = {
    "aria-haspopup": "dialog" as const,
    "aria-expanded": isOpen,
    ...(isOpen ? { "aria-controls": panelId } : {}),
  };

  // Clone the trigger with appropriate event handlers
  const childProps = children.props as {
    onClick?: (e: React.MouseEvent) => void;
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
  };

  function mergeRef(node: HTMLElement) {
    triggerRef.current = node;
    const originalRef = (children as { ref?: React.Ref<HTMLElement> }).ref;
    if (typeof originalRef === "function") {
      originalRef(node);
    } else if (originalRef && "current" in originalRef) {
      (originalRef as React.MutableRefObject<HTMLElement | null>).current =
        node;
    }
  }

  const trigger =
    triggerType === "click"
      ? cloneElement(children, {
          ...ariaProps,
          ref: mergeRef,
          onClick(e: React.MouseEvent) {
            childProps.onClick?.(e);
            togglePopover();
          },
        })
      : cloneElement(children, {
          ...ariaProps,
          ref: mergeRef,
          onClick(e: React.MouseEvent) {
            childProps.onClick?.(e);
          },
        });

  return (
    <div
      ref={rootRef}
      className="relative inline-flex"
      onBlurCapture={handleRootBlur}
      {...(triggerType === "hover"
        ? {
            onMouseEnter: openPopover,
            onMouseLeave: closePopover,
          }
        : {})}
    >
      {trigger}

      <div
        role="dialog"
        id={panelId}
        data-open={isOpen}
        className={classNames(
          "absolute z-50",
          "rounded-xl border border-border bg-popover text-popover-foreground",
          "shadow-lg p-3",
          "opacity-0 scale-[0.98]",
          "transition-[opacity,transform] duration-150 ease-out",
          "data-[open=true]:opacity-100 data-[open=true]:scale-100",
          PLACEMENT_CLASSES[placement],
          alignmentClass,
          ANIMATION_CLASSES[placement],
          "data-[open=true]:translate-y-0 data-[open=true]:translate-x-0",
          panelClassName,
        )}
        style={panelOffsetStyle}
        onClickCapture={
          closeOnSelect
            ? (e) => {
                if (
                  e.target instanceof Element &&
                  e.target.closest('[data-popover-keep-open="true"]')
                ) {
                  return;
                }
                closePopover();
              }
            : undefined
        }
      >
        {content}
        {showArrow && (
          <span
            aria-hidden="true"
            className={classNames(
              "absolute rotate-45 size-[8px] bg-popover",
              ARROW_CLASSES[placement],
            )}
          />
        )}
      </div>
    </div>
  );
}
