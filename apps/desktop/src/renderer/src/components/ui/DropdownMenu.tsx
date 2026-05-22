import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import classNames from "classnames";
import type { ReactElement, ReactNode } from "react";
import type { ValueOf } from "type-fest";

const DROPDOWN_MENU_SIDE = {
  TOP: "top",
  RIGHT: "right",
  BOTTOM: "bottom",
  LEFT: "left"
} as const;

type DropdownMenuSide = ValueOf<typeof DROPDOWN_MENU_SIDE>;

const DROPDOWN_MENU_ALIGN = {
  START: "start",
  CENTER: "center",
  END: "end"
} as const;

type DropdownMenuAlign = ValueOf<typeof DROPDOWN_MENU_ALIGN>;

const DROPDOWN_MENU_TONE = {
  DEFAULT: "default",
  DANGER: "danger"
} as const;

type DropdownMenuTone = ValueOf<typeof DROPDOWN_MENU_TONE>;

export interface DropdownMenuOption {
  key: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  tone?: DropdownMenuTone;
  onSelect: () => void;
}

interface DropdownMenuProps {
  trigger: ReactElement;
  options: DropdownMenuOption[];
  side?: DropdownMenuSide;
  align?: DropdownMenuAlign;
  sideOffset?: number;
  contentClassName?: string;
}

export function DropdownMenu({
  trigger,
  options,
  side = DROPDOWN_MENU_SIDE.BOTTOM,
  align = DROPDOWN_MENU_ALIGN.END,
  sideOffset = 8,
  contentClassName
}: DropdownMenuProps) {
  const visibleOptions = options.filter((option) => option.label.trim().length > 0);

  if (visibleOptions.length === 0) {
    return trigger;
  }

  return (
    <DropdownMenuPrimitive.Root>
      <DropdownMenuPrimitive.Trigger asChild>{trigger}</DropdownMenuPrimitive.Trigger>

      <DropdownMenuPrimitive.Portal>
        <DropdownMenuPrimitive.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          collisionPadding={8}
          className={classNames(
            "z-50 min-w-40 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg outline-none",
            "opacity-0 scale-[0.98] transition-[opacity,transform] duration-150 ease-out",
            "data-[state=open]:opacity-100 data-[state=open]:scale-100",
            "data-[side=top]:data-[state=closed]:translate-y-1",
            "data-[side=bottom]:data-[state=closed]:-translate-y-1",
            "data-[side=left]:data-[state=closed]:translate-x-1",
            "data-[side=right]:data-[state=closed]:-translate-x-1",
            contentClassName
          )}
        >
          {visibleOptions.map((option) => (
            <DropdownMenuPrimitive.Item
              key={option.key}
              disabled={option.disabled}
              onSelect={option.onSelect}
              className={classNames(
                "flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none transition-colors",
                "data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950",
                "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                option.tone === DROPDOWN_MENU_TONE.DANGER
                  ? "text-red-600 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700"
                  : "text-slate-700"
              )}
            >
              {option.icon && <span className="shrink-0">{option.icon}</span>}
              <span>{option.label}</span>
            </DropdownMenuPrimitive.Item>
          ))}
        </DropdownMenuPrimitive.Content>
      </DropdownMenuPrimitive.Portal>
    </DropdownMenuPrimitive.Root>
  );
}
