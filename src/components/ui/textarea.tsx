import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-2 text-sm bg-transparent border border-input rounded-lg outline-none resize-y transition-shadow",
        "placeholder:text-muted-foreground",
        "focus:border-ring focus:ring-[3px] focus:ring-ring/20",
        "disabled:opacity-50 disabled:pointer-events-none",
        className,
      )}
      {...props}
    />
  );
}
