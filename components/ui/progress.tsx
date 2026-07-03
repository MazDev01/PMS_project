import * as React from "react";
import { cn } from "@/lib/utils";

const barColor = {
  primary: "bg-primary",
  success: "bg-chart-4",
  warning: "bg-chart-2",
  danger: "bg-destructive",
} as const;

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  tone?: keyof typeof barColor;
}

export function Progress({
  value,
  tone = "primary",
  className,
  ...props
}: ProgressProps) {
  return (
    <div
      className={cn(
        "h-1.5 w-full rounded-full bg-muted overflow-hidden",
        className,
      )}
      {...props}
    >
      <div
        className={cn("h-full rounded-full transition-all", barColor[tone])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
