"use client";

import { useState } from "react";
import DataTable from "@/app/components/DataTable";
import { IconActivity, IconDownload } from "@/app/components/icons";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import { roleLabel, TODAY_ISO } from "@/app/lib/mockData";
import { useAuditLogs } from "@/app/lib/store";
import { formatDateTimeTH } from "@/app/lib/format";
import { exportToCSV } from "@/app/lib/csv";

const ROLE_FILTERS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "coordinator", label: roleLabel("coordinator") },
  { value: "contractor", label: roleLabel("contractor") },
  { value: "admin", label: roleLabel("admin") },
  { value: "guest", label: roleLabel("guest") },
  { value: "system", label: "ระบบ" },
];

export default function AdminAuditPage() {
  const [auditLogs] = useAuditLogs();
  const [roleFilter, setRoleFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const preFiltered = auditLogs.filter((log) => {
    const matchesRole = roleFilter === "all" || log.role === roleFilter;
    const logDate = log.timestamp.slice(0, 10);
    const matchesFrom = !dateFrom || logDate >= dateFrom;
    const matchesTo = !dateTo || logDate <= dateTo;
    return matchesRole && matchesFrom && matchesTo;
  });

  const { search, setSearch, sortBy, setSortBy, rows: filteredLogs, resultCount } = useTableRows(preFiltered, {
    searchFields: (log) => [log.actor, log.id, log.target, log.action],
    sortOptions: [
      { key: "newest", label: "เรียงตามเวลา (ล่าสุดก่อน)", compare: (a, b) => b.timestamp.localeCompare(a.timestamp) },
      { key: "oldest", label: "เรียงตามเวลา (เก่าสุดก่อน)", compare: (a, b) => a.timestamp.localeCompare(b.timestamp) },
      { key: "actor", label: "เรียงตามผู้ใช้งาน", compare: (a, b) => a.actor.localeCompare(b.actor, "th") },
    ],
  });

  function handleExport() {
    exportToCSV(
      `audit-log-${TODAY_ISO}.csv`,
      [
        { label: "เวลา", value: (r) => formatDateTimeTH(r.timestamp) },
        { label: "ผู้ใช้งาน", value: (r) => r.actor },
        { label: "บทบาท", value: (r) => (r.role === "system" ? "ระบบ" : roleLabel(r.role)) },
        { label: "การกระทำ", value: (r) => r.action },
        { label: "เป้าหมาย/อ้างอิง", value: (r) => r.target },
      ],
      filteredLogs
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ประวัติการใช้งานระบบ</h2>
          <p>ตรวจสอบและดูแลความปลอดภัยของระบบ — บันทึกทุกเหตุการณ์แบบล็อกไฟล์ ป้องกันการแก้ไขย้อนหลัง</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-md btn-outline" onClick={handleExport}>
            <IconDownload size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหา ID / ชื่อผู้ใช้งาน / เป้าหมาย"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "newest", label: "ล่าสุดก่อน" },
          { key: "oldest", label: "เก่าสุดก่อน" },
          { key: "actor", label: "เรียงตามผู้ใช้งาน" },
        ]}
      >
        <input
          className="ds-input"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{ maxWidth: 170, flex: "0 1 170px" }}
          aria-label="วันที่เริ่มต้น"
        />
        <input
          className="ds-input"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={{ maxWidth: 170, flex: "0 1 170px" }}
          aria-label="วันที่สิ้นสุด"
        />
        <select className="ds-input" style={{ flex: "0 1 200px" }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          {ROLE_FILTERS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </TableToolbar>

      <p className="text-xs text-muted" style={{ marginBottom: "0.75rem" }}>พบ {resultCount} รายการ</p>

      {filteredLogs.length === 0 ? (
        <div className="empty-state">
          <IconActivity size={40} />
          <div>ไม่พบประวัติการใช้งานที่ตรงกับเงื่อนไข</div>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "timestamp", label: "เวลา", render: (r) => formatDateTimeTH(r.timestamp) },
            { key: "actor", label: "ผู้ใช้งาน" },
            {
              key: "role",
              label: "บทบาท",
              render: (r) => <span className="badge badge-secondary">{r.role === "system" ? "ระบบ" : roleLabel(r.role)}</span>,
            },
            { key: "action", label: "การกระทำ" },
            { key: "target", label: "เป้าหมาย/อ้างอิง" },
          ]}
          rows={filteredLogs}
        />
      )}
    </div>
  );
}
