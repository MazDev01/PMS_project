"use client";

import { useState } from "react";

export default function Tabs({ tabs, defaultKey, children }) {
  const [active, setActive] = useState(defaultKey || tabs[0].key);
  return (
    <div className="ds-tabs">
      <div className="ds-tab-list" style={{ marginBottom: "1.25rem" }}>
        {tabs.map((t) => (
          <button key={t.key} className={`ds-tab ${active === t.key ? "active" : ""}`} onClick={() => setActive(t.key)} type="button">
            {t.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
}
