import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import classNames from "classnames";

export const BUTTON_VARIANT = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
  GHOST: "ghost",
} as const;

export type ButtonVariant =
  (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

export const BUTTON_SIZE = {
  SM: "sm",
  MD: "md",
  ICON: "icon",
  ICON_SM: "icon_sm",
  ICON_XS: "icon_xs",
} as const;

export type ButtonSize = (typeof BUTTON_SIZE)[keyof typeof BUTTON_SIZE];

const variantClassName: Record<ButtonVariant, string> = {
  [BUTTON_VARIANT.PRIMARY]:
    "bg-primary text-white shadow-xs hover:bg-blue-600 hover:shadow-sm active:bg-blue-700 active:shadow-[inset_0_1px_0_rgba(0,0,0,0.05)] disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none",
  [BUTTON_VARIANT.SECONDARY]:
    "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400",
  [BUTTON_VARIANT.GHOST]:
    "text-slate-500 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200/70 disabled:text-slate-300",
};

const sizeClassName: Record<ButtonSize, string> = {
  [BUTTON_SIZE.SM]: "h-8 px-3",
  [BUTTON_SIZE.MD]: "h-9 px-4",
  [BUTTON_SIZE.ICON]: "h-9 w-9 p-0",
  [BUTTON_SIZE.ICON_SM]: "h-8 w-8 p-0",
  [BUTTON_SIZE.ICON_XS]: "h-5 w-5 rounded-sm p-0",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant = BUTTON_VARIANT.PRIMARY,
      size = BUTTON_SIZE.MD,
      leadingIcon,
      trailingIcon,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={classNames(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium outline-none transition-[background-color,color,box-shadow,border-color] duration-150 focus-visible:ring-2 focus-visible:ring-slate-950/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:cursor-not-allowed",
          variantClassName[variant],
          sizeClassName[size],
          className,
        )}
        {...props}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </button>
    );
  },
);
