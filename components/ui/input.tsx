import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-8 w-full px-3 text-sm bg-transparent border border-input rounded-lg outline-none transition-shadow",
        "placeholder:text-muted-foreground",
        "focus:border-ring focus:ring-[3px] focus:ring-ring/20",
        "aria-[invalid=true]:border-destructive",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}
