import * as React from "react";
import { cn } from "@/lib/utils";

export function TableWrap({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-lg border border-border",
        className,
      )}
      {...props}
    />
  );
}

export function Table({
  className,
  ...props
}: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full border-collapse text-sm", className)}
      {...props}
    />
  );
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-muted", className)} {...props} />;
}

export function TBody(
  props: React.HTMLAttributes<HTMLTableSectionElement>,
) {
  return <tbody {...props} />;
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("transition-colors hover:bg-muted/60", className)}
      {...props}
    />
  );
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 text-left font-semibold text-[0.8rem] whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-4 py-3 border-t border-border align-middle", className)}
      {...props}
    />
  );
}
