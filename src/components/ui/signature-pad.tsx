"use client";

import * as React from "react";
import { Eraser, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onSignedChange?: (signed: boolean) => void;
  className?: string;
  label?: string;
}

/** Lightweight canvas signature pad — supports mouse + touch, with a clear action. */
export function SignaturePad({
  onSignedChange,
  className,
  label = "เซ็นลายมือชื่อดิจิทัลในกรอบด้านล่าง",
}: SignaturePadProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const [signed, setSigned] = React.useState(false);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // scale for crisp lines on hi-dpi
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1a1a1a";
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    drawing.current = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current!.setPointerCapture(e.pointerId);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = pos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    if (!signed) {
      setSigned(true);
      onSignedChange?.(true);
    }
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
    onSignedChange?.(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[0.8rem] text-muted-foreground flex items-center gap-1.5">
          <PenLine className="size-3.5" />
          {label}
        </span>
        <button
          type="button"
          onClick={clear}
          className="text-[0.75rem] text-muted-foreground hover:text-destructive inline-flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Eraser className="size-3.5" />
          ล้างลายเซ็น
        </button>
      </div>
      <div className="relative rounded-lg border border-input bg-card">
        <canvas
          ref={canvasRef}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerLeave={end}
          className="signature-canvas block w-full h-40 rounded-lg"
        />
        {!signed && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground/50">
            ✍️ เซ็นที่นี่
          </span>
        )}
      </div>
    </div>
  );
}
