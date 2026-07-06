"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/lib/auth";
import { personnel, teams } from "@/app/lib/mockData";

// Contractor jobs are now assigned to individual crew members rather than
// whole teams, so a contractor login has to say WHICH technician this is.
// Grouped by their team (unassigned technicians last) so the list reads like
// a real staff directory instead of a flat name dump.
function technicianOptions() {
  const withTeam = personnel.filter((p) => p.teamId);
  const unassigned = personnel.filter((p) => !p.teamId);
  const groups = teams
    .map((t) => ({ team: t, people: withTeam.filter((p) => p.teamId === t.id) }))
    .filter((g) => g.people.length);
  return { groups, unassigned };
}

export default function LoginForm({ title, subtitle, dashboardHref, role, mobile = false }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const { groups, unassigned } = role === "contractor" ? technicianOptions() : { groups: [], unassigned: [] };
  const [personId, setPersonId] = useState(() => groups[0]?.people[0]?.id || unassigned[0]?.id || "");
  const router = useRouter();
  const { login } = useAuth();

  function handleSubmit(e) {
    e.preventDefault();
    setError(false);
    login(role, personId);
    router.push(dashboardHref);
  }

  return (
    <div className="login-page" style={mobile ? { padding: "1.5rem 1rem" } : undefined}>
      <div className="ds-card login-card">
        <div className="login-brand">
          <div className="app-sidebar-mark">M</div>
          <h1>{title}</h1>
          <span>{subtitle}</span>
        </div>

        {error && (
          <div className="ds-alert ds-alert-error" style={{ marginBottom: "1.1rem" }}>
            <div>
              <strong>เข้าสู่ระบบไม่สำเร็จ</strong>
              บัญชีหรือรหัสผ่าน ไม่ถูกต้อง
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {role === "contractor" ? (
            <div className="form-group" style={{ maxWidth: "none" }}>
              <label className="ds-label">คุณคือใคร (เลือกชื่อช่างเพื่อเข้าสู่ระบบ)</label>
              <select className="ds-select" value={personId} onChange={(e) => setPersonId(e.target.value)}>
                {groups.map((g) => (
                  <optgroup key={g.team.id} label={g.team.name}>
                    {g.people.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{p.lead ? " (หัวหน้าทีม)" : ""}</option>
                    ))}
                  </optgroup>
                ))}
                {unassigned.length > 0 && (
                  <optgroup label="ยังไม่มีทีม">
                    {unassigned.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                )}
              </select>
              <span className="text-xs text-muted">งานที่แสดงในแอปจะเป็นงานที่คุณถูกมอบหมาย (หัวหน้างานหรือสมาชิก) เท่านั้น</span>
            </div>
          ) : (
            <div className="form-group" style={{ maxWidth: "none" }}>
              <label className="ds-label">ชื่อผู้ใช้</label>
              <input
                className={`ds-input ${error ? "ds-input-invalid" : ""}`}
                placeholder="กรอกชื่อผู้ใช้ของคุณ"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          )}
          <div className="form-group" style={{ maxWidth: "none" }}>
            <label className="ds-label">รหัสผ่าน</label>
            <input
              type="password"
              className={`ds-input ${error ? "ds-input-invalid" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-default btn-md btn-block" style={{ marginTop: "0.4rem" }}>
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="ds-separator" />
        <p className="text-xs text-muted" style={{ textAlign: "center" }}>
          Demo prototype — กดปุ่ม &quot;เข้าสู่ระบบ&quot; ได้ทันทีโดยไม่ต้องกรอกข้อมูล
        </p>
        {!error && (
          <p style={{ textAlign: "center", marginTop: "0.4rem" }}>
            <button type="button" className="btn btn-link btn-sm" onClick={() => setError(true)}>
              ดูตัวอย่างข้อความแจ้งเตือนผิดพลาด
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
