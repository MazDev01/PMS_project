"use client";

import { IconX } from "./icons";

export default function Modal({ open, onClose, title, description, children, footer, maxWidth = 480, fullscreen = false, contentMaxWidth = 720, bodyOverflow = "auto" }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "oklch(0 0 0 / 0.4)",
        display: "flex", alignItems: fullscreen ? "stretch" : "center", justifyContent: "center",
        padding: fullscreen ? 0 : "1.25rem", zIndex: 500,
      }}
      onClick={onClose}
    >
      <div
        className="ds-card"
        style={
          fullscreen
            ? { width: "100%", height: "100%", maxWidth: "none", maxHeight: "none", borderRadius: 0, display: "flex", flexDirection: "column" }
            : { width: "100%", maxWidth, maxHeight: "88vh", display: "flex", flexDirection: "column" }
        }
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ds-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "1rem", borderBottom: "1px solid var(--border)" }}>
          <div>
            <div className="ds-card-title">{title}</div>
            {description && <div className="ds-card-desc">{description}</div>}
          </div>
          <button className="app-icon-btn" onClick={onClose} aria-label="ปิด">
            <IconX size={15} />
          </button>
        </div>
        <div className="ds-card-content" style={{ overflowY: bodyOverflow, flex: 1 }}>
          {fullscreen ? <div style={{ maxWidth: contentMaxWidth, margin: "0 auto" }}>{children}</div> : children}
        </div>
        {footer && <div className="ds-card-footer" style={{ justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}
