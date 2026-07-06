"use client";

import { useState } from "react";
import DataTable from "@/app/components/DataTable";
import Tabs from "@/app/components/Tabs";
import { IconRefresh } from "@/app/components/icons";
import { useSyncStatus, useStore } from "@/app/lib/store";
import { formatDateTimeTH } from "@/app/lib/format";

function syncStatusLabel(status) {
  return { pending: "กำลังส่งข้อมูล", success: "สำเร็จ", failed: "ล้มเหลว" }[status] || status;
}

function SettingsPanel() {
  const [connection, setConnection] = useState("connected");
  const [checkedAtText, setCheckedAtText] = useState("วันนี้ 09:14 น.");

  function handleTest() {
    setConnection((prev) => (prev === "connected" ? "disconnected" : "connected"));
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setCheckedAtText(`วันนี้ ${hh}:${mm} น.`);
  }

  return (
    <div className="ds-card">
      <div className="ds-card-header">
        <div className="ds-card-title">ตั้งค่าการเชื่อมต่อ Mango Web Service</div>
        <div className="ds-card-desc">กำหนดค่า API สำหรับรับส่งข้อมูลกับระบบ Mango โดยอัตโนมัติ</div>
      </div>
      <div className="ds-card-content">
        <div className="form-group">
          <label className="ds-label">API Endpoint URL</label>
          <input className="ds-input" type="text" defaultValue="https://api.mango.co.th/v2/" />
        </div>
        <div className="form-group">
          <label className="ds-label">API Key / Token</label>
          <input className="ds-input" type="text" defaultValue="••••••••••••3f9a" />
        </div>

        <button type="button" className="btn btn-md btn-default" onClick={handleTest}>
          <IconRefresh size={16} />
          ทดสอบสถานะระบบ
        </button>

        <div className="ds-separator" />

        <span className="status-row">
          <span className={`status-dot ${connection}`} />
          {connection === "connected"
            ? "เชื่อมต่อสำเร็จ — Mango Web Service API"
            : "ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบ API Key"}
        </span>
        <p className="text-xs text-muted" style={{ marginTop: "0.5rem" }}>
          ตรวจสอบล่าสุดเมื่อ {checkedAtText}
        </p>
      </div>
    </div>
  );
}

function SyncPanel() {
  const [rows, setRows] = useSyncStatus();
  const { addAuditLog } = useStore();

  function handleResend(id) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "success" } : r)));
    addAuditLog({ actor: "ระบบ (Mango Sync)", role: "system", action: "ส่งข้อมูลใหม่ด้วยมือสำเร็จ", target: id });
  }

  return (
    <DataTable
      columns={[
        { key: "docType", label: "ประเภทเอกสาร" },
        { key: "customer", label: "ลูกค้า/งาน", render: (r) => <span>{r.customer} — {r.jobId}</span> },
        { key: "direction", label: "ทิศทาง", render: (r) => (r.direction === "push" ? "Push → Mango" : "Pull ← Mango") },
        { key: "timestamp", label: "เวลา", render: (r) => formatDateTimeTH(r.timestamp) },
        {
          key: "status",
          label: "สถานะ",
          render: (r) => (
            <span className="status-row">
              <span className={`status-dot ${r.status}`} />
              {syncStatusLabel(r.status)}
            </span>
          ),
        },
        {
          key: "actions",
          label: "",
          render: (r) =>
            r.status !== "success" ? (
              <button type="button" className="btn btn-sm btn-outline" onClick={() => handleResend(r.id)}>
                <IconRefresh size={14} />
                ส่งข้อมูลใหม่ด้วยมือ
              </button>
            ) : null,
        },
      ]}
      rows={rows}
    />
  );
}

export default function AdminMangoPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>ซิงค์ข้อมูล Mango</h2>
          <p>ตั้งค่าการเชื่อมต่อและติดตามสถานะการรับส่งข้อมูลกับ Mango Web Service</p>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: "settings", label: "ตั้งค่า Mango" },
          { key: "sync", label: "สถานะซิงค์" },
        ]}
        defaultKey="settings"
      >
        {(active) => (active === "settings" ? <SettingsPanel /> : <SyncPanel />)}
      </Tabs>
    </div>
  );
}
