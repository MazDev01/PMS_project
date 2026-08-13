import * as React from "react";
import { Info, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex gap-3 items-start p-3.5 rounded-lg border text-sm",
  {
    variants: {
      tone: {
        info: "bg-info/8 border-info/30 text-info-foreground",
        success: "bg-success/8 border-success/30 text-success-foreground",
        warning: "bg-warning/8 border-warning/30 text-warning-foreground",
        error: "bg-destructive/8 border-destructive/30 text-destructive",
      },
    },
    defaultVariants: { tone: "info" },
  },
);

const icons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
} as const;

export interface AlertProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title">,
    VariantProps<typeof alertVariants> {
  title?: React.ReactNode;
}

export function Alert({
  className,
  tone = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const Icon = icons[tone ?? "info"];
  return (
    <div className={cn(alertVariants({ tone }), className)} {...props}>
      <Icon className="size-4 shrink-0 mt-0.5" />
      <div>
        {title && <strong className="block font-semibold">{title}</strong>}
        {children && <div className="text-foreground/80">{children}</div>}
      </div>
    </div>
  );
}
