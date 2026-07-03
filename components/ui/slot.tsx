import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Minimal Slot — merges the given props onto its single React element child.
 * Enough for the `asChild` pattern (e.g. Button rendering a <Link>).
 */
export function Slot({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) {
  if (!React.isValidElement(children)) return null;
  const child = children as React.ReactElement<Record<string, unknown>>;
  const childProps = child.props;
  return React.cloneElement(child, {
    ...props,
    ...childProps,
    className: cn(className, childProps.className as string | undefined),
  });
}
