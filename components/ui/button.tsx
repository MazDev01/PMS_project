import * as React from "react";
import { Slot } from "@/components/ui/slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-50 disabled:pointer-events-none [&_svg]:shrink-0 [&_svg]:pointer-events-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-brand-600",
        secondary:
          "bg-secondary text-secondary-foreground border border-border hover:bg-muted",
        outline:
          "bg-transparent text-foreground border border-border hover:bg-muted",
        ghost: "bg-transparent text-foreground hover:bg-muted",
        destructive:
          "bg-destructive text-destructive-foreground hover:opacity-90",
        link: "bg-transparent text-primary underline underline-offset-2 hover:opacity-80",
      },
      size: {
        xs: "h-6 px-2 text-xs rounded-md [&_svg]:size-3",
        sm: "h-7 px-2.5 text-[0.8rem] rounded-md [&_svg]:size-3.5",
        md: "h-8 px-3 text-sm rounded-lg [&_svg]:size-4",
        lg: "h-9 px-4 text-sm rounded-lg [&_svg]:size-4",
        icon: "h-8 w-8 rounded-md [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
