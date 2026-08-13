"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabItem {
  value: string;
  label: React.ReactNode;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (v: string) => void;
  variant?: "pill" | "line";
  className?: string;
}

/** Controlled tabs — pill (segmented) or underline variant. */
export function Tabs({
  items,
  value,
  onValueChange,
  variant = "pill",
  className,
}: TabsProps) {
  if (variant === "line") {
    return (
      <div
        className={cn(
          "inline-flex border-b border-border overflow-x-auto",
          className,
        )}
      >
        {items.map((it) => (
          <button
            key={it.value}
            type="button"
            onClick={() => onValueChange(it.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors whitespace-nowrap",
              value === it.value
                ? "text-primary border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground",
            )}
          >
            {it.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex gap-0.5 p-[3px] bg-muted rounded-lg",
        className,
      )}
    >
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onValueChange(it.value)}
          className={cn(
            "px-3.5 py-1.5 rounded-md text-[0.8rem] font-medium transition-colors whitespace-nowrap",
            value === it.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
