import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import classNames from "classnames";
import type { ValueOf } from "type-fest";

export const BADGE_VARIANT = {
  NEUTRAL: "neutral",
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger"
} as const;

export type BadgeVariant = ValueOf<typeof BADGE_VARIANT>;

export const BADGE_SIZE = {
  SM: "sm",
  MD: "md"
} as const;

export type BadgeSize = ValueOf<typeof BADGE_SIZE>;

export const BADGE_RIBBON_POSITION = {
  TOP_RIGHT: "top-right",
  TOP_LEFT: "top-left",
  BOTTOM_RIGHT: "bottom-right",
  BOTTOM_LEFT: "bottom-left"
} as const;

export type BadgeRibbonPosition = ValueOf<typeof BADGE_RIBBON_POSITION>;

const variantClassName: Record<BadgeVariant, string> = {
  [BADGE_VARIANT.NEUTRAL]: "border border-slate-200 bg-slate-50 text-slate-600",
  [BADGE_VARIANT.INFO]: "border border-sky-200 bg-sky-50 text-sky-700",
  [BADGE_VARIANT.SUCCESS]: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  [BADGE_VARIANT.WARNING]: "border border-amber-200 bg-amber-50 text-amber-700",
  [BADGE_VARIANT.DANGER]: "border border-rose-200 bg-rose-50 text-rose-700"
};

const sizeClassName: Record<BadgeSize, string> = {
  [BADGE_SIZE.SM]: "gap-1 px-2 py-0.5 text-[11px]",
  [BADGE_SIZE.MD]: "gap-1.5 px-2.5 py-1 text-xs"
};

const dotClassName: Record<BadgeSize, string> = {
  [BADGE_SIZE.SM]: "h-1.5 w-1.5",
  [BADGE_SIZE.MD]: "h-2 w-2"
};

const ribbonPositionClassName: Record<BadgeRibbonPosition, string> = {
  [BADGE_RIBBON_POSITION.TOP_RIGHT]: "absolute -top-px -right-px rounded-bl-lg rounded-tr-lg",
  [BADGE_RIBBON_POSITION.TOP_LEFT]: "absolute -top-px -left-px rounded-br-lg rounded-tl-lg",
  [BADGE_RIBBON_POSITION.BOTTOM_RIGHT]: "absolute -bottom-px -right-px rounded-tl-lg rounded-br-lg",
  [BADGE_RIBBON_POSITION.BOTTOM_LEFT]: "absolute -bottom-px -left-px rounded-tr-lg rounded-bl-lg"
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  leadingIcon?: ReactNode;
}

const BadgeInner = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  { className, variant = BADGE_VARIANT.NEUTRAL, size = BADGE_SIZE.SM, dot = false, leadingIcon, children, ...props },
  ref
) {
  return (
    <span
      ref={ref}
      className={classNames(
        "inline-flex shrink-0 items-center rounded-full font-medium whitespace-nowrap",
        variantClassName[variant],
        sizeClassName[size],
        className
      )}
      {...props}
    >
      {dot ? <span aria-hidden="true" className={classNames("rounded-full bg-current/70", dotClassName[size])} /> : null}
      {leadingIcon}
      {children}
    </span>
  );
});

interface RibbonProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  position?: BadgeRibbonPosition;
}

function Ribbon({
  variant = BADGE_VARIANT.INFO,
  size = BADGE_SIZE.SM,
  position = BADGE_RIBBON_POSITION.TOP_RIGHT,
  className,
  children,
  ...props
}: RibbonProps) {
  return (
    <span
      className={classNames(
        "inline-flex shrink-0 items-center gap-1 font-medium whitespace-nowrap",
        ribbonPositionClassName[position],
        variantClassName[variant],
        sizeClassName[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export const Badge = BadgeInner as typeof BadgeInner & { Ribbon: typeof Ribbon };
Badge.Ribbon = Ribbon;
