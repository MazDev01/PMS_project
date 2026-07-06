"use client";

// Shared search + sort toolbar for DataTable lists — same UX everywhere
// (search box with icon, optional extra filter slot via children, sort select).
// Filtering/sorting logic itself is applied by the caller with useTableRows()
// so each page controls what fields are searchable/sortable while the UI and
// interaction pattern stay identical across the app.

import { useState } from "react";
import { IconSearch } from "./icons";

// rows: array; searchFields: (row) => array of string values to match against;
// sortOptions: [{ key, label, compare(a,b) }] — first option is the default.
export function useTableRows(rows, { searchFields, sortOptions }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState(sortOptions?.[0]?.key);

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) => searchFields(r).some((v) => (v ?? "").toString().toLowerCase().includes(q)))
    : rows;

  const active = sortOptions?.find((o) => o.key === sortBy);
  const sorted = active?.compare ? [...filtered].sort(active.compare) : filtered;

  return { search, setSearch, sortBy, setSortBy, rows: sorted, resultCount: sorted.length, isFiltered: !!q };
}

export function TableToolbar({ search, onSearchChange, placeholder = "ค้นหา...", sortBy, onSortChange, sortOptions, children }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
      <div style={{ position: "relative", flex: "1 1 220px", maxWidth: "320px" }}>
        <IconSearch size={15} style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", color: "var(--muted-foreground)" }} />
        <input
          className="ds-input"
          style={{ paddingLeft: "2rem" }}
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      {children}
      {sortOptions && sortOptions.length > 0 && (
        <select className="ds-input" style={{ flex: "0 1 170px" }} value={sortBy} onChange={(e) => onSortChange(e.target.value)}>
          {sortOptions.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      )}
    </div>
  );
}
