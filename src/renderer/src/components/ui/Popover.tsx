import * as PopoverPrimitive from "@radix-ui/react-popover";
import type { ReactElement, ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import classNames from "classnames";

const POPOVER_PLACEMENT = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right"
} as const;

type PopoverPlacement = (typeof POPOVER_PLACEMENT)[keyof typeof POPOVER_PLACEMENT];

const POPOVER_ALIGN = {
  START: "start",
  CENTER: "center",
  END: "end"
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

  /** Optional width constraint for the panel. */
  maxWidth?: number | string;

  /** Optional class override for the floating panel container. */
  panelClassName?: string;
}

const HOVER_CLOSE_DELAY = 120;

function containsTarget(node: HTMLElement | null, target: EventTarget | null): target is Node {
  return target instanceof Node && node?.contains(target) === true;
}

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
  maxWidth,
  panelClassName
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const panelId = useId();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setOpen = useCallback(
    (next: boolean) => {
      if (disabled) return;
      if (!isControlled) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [disabled, isControlled, onOpenChange]
  );

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openPopover = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer, setOpen]);

  const closePopover = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer, setOpen]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, HOVER_CLOSE_DELAY);
  }, [clearCloseTimer, setOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (disabled) {
    return children;
  }

  function handleHoverBlur() {
    requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      if (containsTarget(triggerRef.current, activeElement) || containsTarget(contentRef.current, activeElement)) {
        return;
      }

      closePopover();
    });
  }

  const trigger =
    triggerType === "click" ? (
      <span ref={triggerRef} className="inline-flex">
        {children}
      </span>
    ) : (
      <span
        ref={triggerRef}
        className="inline-flex"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        {...(isOpen ? { "aria-controls": panelId } : {})}
        onMouseEnter={openPopover}
        onMouseLeave={scheduleClose}
        onFocus={openPopover}
        onBlur={handleHoverBlur}
      >
        {children}
      </span>
    );

  return (
    <PopoverPrimitive.Root open={isOpen} onOpenChange={setOpen} modal={false}>
      {triggerType === "click" ? (
        <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      ) : (
        <PopoverPrimitive.Anchor asChild>{trigger}</PopoverPrimitive.Anchor>
      )}

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={contentRef}
          role="dialog"
          id={panelId}
          side={placement}
          align={align}
          sideOffset={sideOffset}
          arrowPadding={12}
          collisionPadding={8}
          className={classNames(
            "z-50 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-lg outline-none",
            "opacity-0 scale-[0.98] transition-[opacity,transform] duration-150 ease-out",
            "data-[state=open]:opacity-100 data-[state=open]:scale-100",
            "data-[side=top]:data-[state=closed]:translate-y-1",
            "data-[side=bottom]:data-[state=closed]:-translate-y-1",
            "data-[side=left]:data-[state=closed]:translate-x-1",
            "data-[side=right]:data-[state=closed]:-translate-x-1",
            panelClassName
          )}
          style={{ maxWidth }}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
          }}
          onEscapeKeyDown={
            closeOnEscape
              ? undefined
              : (event) => {
                  event.preventDefault();
                }
          }
          onInteractOutside={
            closeOnOutsideClick
              ? undefined
              : (event) => {
                  event.preventDefault();
                }
          }
          onMouseEnter={triggerType === "hover" ? clearCloseTimer : undefined}
          onMouseLeave={triggerType === "hover" ? scheduleClose : undefined}
          onFocusCapture={triggerType === "hover" ? openPopover : undefined}
          onBlurCapture={triggerType === "hover" ? handleHoverBlur : undefined}
          onClickCapture={
            closeOnSelect
              ? (event) => {
                  if (event.target instanceof Element && event.target.closest('[data-popover-keep-open="true"]')) {
                    return;
                  }

                  closePopover();
                }
              : undefined
          }
        >
          {content}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
