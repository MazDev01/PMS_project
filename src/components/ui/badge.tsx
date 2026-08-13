import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 h-5 px-2 rounded-full text-[0.7rem] font-medium whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      tone: {
        default: "bg-primary text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground border border-border",
        outline: "bg-transparent text-foreground border border-border",
        ghost: "bg-muted text-muted-foreground",
        success: "bg-success/15 text-success-foreground border border-success/40",
        warning: "bg-warning/15 text-warning-foreground border border-warning/40",
        info: "bg-info/15 text-info-foreground border border-info/40",
        destructive:
          "bg-destructive/15 text-destructive border border-destructive/40",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
