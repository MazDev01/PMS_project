import { Badge } from "@/components/ui/badge";
import { STATUS_META, SYNC_META } from "@/lib/status";
import type { JobStatus, SyncState } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: JobStatus }) {
  const meta = STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function SyncBadge({ state }: { state: SyncState }) {
  const meta = SYNC_META[state];
  return (
    <Badge tone={meta.tone} className="gap-1.5">
      <span className={cn("size-1.5 rounded-full", meta.dot)} />
      {meta.label}
    </Badge>
  );
}
