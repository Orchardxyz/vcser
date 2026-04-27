import type { LucideIcon, LucideProps } from "lucide-react";

interface UiIconProps extends Omit<LucideProps, "size"> {
  icon: LucideIcon;
  size?: number;
  className?: string;
}

export function UiIcon({
  icon: Icon,
  size = 16,
  strokeWidth = 2,
  className,
  ...rest
}: UiIconProps) {
  return (
    <Icon
      size={size}
      strokeWidth={strokeWidth}
      aria-hidden="true"
      className={className}
      {...rest}
    />
  );
}
