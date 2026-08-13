import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative inline-flex w-full">
      <select
        className={cn(
          "h-8 w-full appearance-none pl-3 pr-8 text-sm bg-transparent border border-input rounded-lg outline-none transition-shadow cursor-pointer",
          "focus:border-ring focus:ring-[3px] focus:ring-ring/20",
          "disabled:opacity-50 disabled:pointer-events-none",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
    </div>
  );
}
