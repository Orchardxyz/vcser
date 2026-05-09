import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cloneElement, ReactElement, ReactNode, useState } from "react";
import classNames from "classnames";

const TOOLTIP_PLACEMENT = {
  TOP: "top",
  BOTTOM: "bottom",
  LEFT: "left",
  RIGHT: "right",
} as const;

type TooltipPlacement =
  (typeof TOOLTIP_PLACEMENT)[keyof typeof TOOLTIP_PLACEMENT];

type TooltipTriggerProps = {
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
};

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

  /** Disable all tooltip behavior. */
  disabled?: boolean;

  /**
   * Max width of the bubble in pixels.
   * @default 240
   */
  maxWidth?: number;
}

const TOOLTIP_CONTENT_CLASS_NAME = classNames(
  "z-50 rounded-sm px-2 py-1",
  "text-xs leading-4 font-medium",
  "bg-foreground text-primary-foreground",
  "shadow-md outline-none",
  "pointer-events-none",
  "opacity-0 scale-[0.98] transition-[opacity,transform] duration-150 ease-out",
  "data-[state=instant-open]:opacity-100 data-[state=instant-open]:scale-100",
  "data-[state=delayed-open]:opacity-100 data-[state=delayed-open]:scale-100",
  "data-[side=top]:data-[state=closed]:translate-y-1",
  "data-[side=bottom]:data-[state=closed]:-translate-y-1",
  "data-[side=left]:data-[state=closed]:translate-x-1",
  "data-[side=right]:data-[state=closed]:-translate-x-1",
);

export function Tooltip({
  content,
  children,
  trigger: triggerType = "hover",
  placement = TOOLTIP_PLACEMENT.TOP,
  delay = 400,
  disabled = false,
  maxWidth = 240,
}: TooltipProps) {
  const [clickOpen, setClickOpen] = useState(false);

  if (disabled) {
    return children;
  }

  if (triggerType === "click") {
    const clickChild = children as ReactElement<TooltipTriggerProps>;
    const clickChildProps = clickChild.props as TooltipTriggerProps;

    return (
      <PopoverPrimitive.Root open={clickOpen} onOpenChange={setClickOpen}>
        <PopoverPrimitive.Anchor asChild>
          {cloneElement(clickChild, {
            onClick(e: React.MouseEvent<HTMLElement>) {
              e.stopPropagation();
              clickChildProps.onClick?.(e);
              setClickOpen((previous) => !previous);
            },
          })}
        </PopoverPrimitive.Anchor>
        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            role="tooltip"
            side={placement}
            align="center"
            sideOffset={8}
            arrowPadding={6}
            collisionPadding={8}
            className={TOOLTIP_CONTENT_CLASS_NAME}
            style={{ maxWidth }}
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            {content}
            <PopoverPrimitive.Arrow
              width={10}
              height={5}
              style={{ fill: "var(--color-foreground)" }}
            />
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
    );
  }

  return (
    <TooltipPrimitive.Provider delayDuration={delay} skipDelayDuration={0}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={placement}
            align="center"
            sideOffset={8}
            arrowPadding={6}
            collisionPadding={8}
            className={TOOLTIP_CONTENT_CLASS_NAME}
            style={{ maxWidth }}
          >
            {content}
            <TooltipPrimitive.Arrow
              width={10}
              height={5}
              style={{ fill: "var(--color-foreground)" }}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
