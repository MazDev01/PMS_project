"use client";

import * as React from "react";
import { RefreshCw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Demo re-sync control: idle → sending → done. */
export function ResyncButton() {
  const [state, setState] = React.useState<"idle" | "sending" | "done">("idle");

  if (state === "done") {
    return (
      <Button variant="ghost" size="sm" disabled className="text-success-foreground">
        <Check className="size-3.5" />
        ส่งใหม่แล้ว
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={state === "sending"}
      onClick={() => {
        setState("sending");
        setTimeout(() => setState("done"), 1200);
      }}
    >
      <RefreshCw
        className={`size-3.5 ${state === "sending" ? "animate-spin" : ""}`}
      />
      {state === "sending" ? "กำลังส่ง…" : "ส่งข้อมูลใหม่"}
    </Button>
  );
}
