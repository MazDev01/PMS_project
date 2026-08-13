import * as React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-6 text-[0.65rem]",
  md: "size-8 text-xs",
  lg: "size-10 text-sm",
  xl: "size-14 text-base",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: keyof typeof sizes;
  color?: string;
}

/** Initials avatar — takes the first 1-2 significant characters of the name. */
export function Avatar({
  name,
  size = "md",
  color,
  className,
  style,
  ...props
}: AvatarProps) {
  const initials = name.replace(/^(ทีม|บจก\.|คุณ)\s*/u, "").trim().slice(0, 2);
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold shrink-0 text-primary-foreground",
        sizes[size],
        className,
      )}
      style={{ background: color ?? "var(--primary)", ...style }}
      {...props}
    >
      {initials}
    </div>
  );
}
