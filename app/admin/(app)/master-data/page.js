"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import DataTable from "@/app/components/DataTable";
import Tabs from "@/app/components/Tabs";
import { IconPlus, IconEdit, IconTrash, IconDatabase, IconShield, IconPhone, IconSearch, IconMapPin } from "@/app/components/icons";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import ThaiAddressFields from "@/app/components/ThaiAddressFields";
import { useJobTypes, useTeams, usePersonnel, useCustomers, useRoles, useStore } from "@/app/lib/store";
import { permissionModules, permissionOps, buildPermissions, specialties, teamCoverage, specialtyShort } from "@/app/lib/mockData";
import { EMPTY_ADDRESS, formatAddress } from "@/app/lib/thaiAddress";

function JobTypesPanel() {
  const [jobTypes, setJobTypes] = useJobTypes();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  function handleDelete(id) {
    setJobTypes((prev) => prev.filter((jt) => jt.id !== id));
  }

  function openNew() {
    setEditingType(null);
    setModalOpen(true);
  }

  function openEdit(jt) {
    setEditingType(jt);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingType(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    if (name) {
      if (editingType) {
        setJobTypes((prev) => prev.map((jt) => (jt.id === editingType.id ? { ...jt, name } : jt)));
      } else {
        setJobTypes((prev) => [{ id: `jt-new-${Date.now()}`, name, count: 0 }, ...prev]);
      }
    }
    closeModal();
  }

  const { search, setSearch, sortBy, setSortBy, rows, resultCount, isFiltered } = useTableRows(jobTypes, {
    searchFields: (jt) => [jt.name],
    sortOptions: [
      { key: "default", label: "เรียงตามลำดับเดิม" },
      { key: "name", label: "เรียงตามชื่อ", compare: (a, b) => a.name.localeCompare(b.name, "th") },
      { key: "count", label: "เรียงตามจำนวนงาน (มาก→น้อย)", compare: (a, b) => b.count - a.count },
    ],
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.75rem" }}>
        {isFiltered && <span className="text-xs text-muted">แสดง {resultCount} รายการ</span>}
        <button type="button" className="btn btn-md btn-default" style={{ marginLeft: "auto" }} onClick={openNew}>
          <IconPlus size={16} />
          เพิ่มประเภทงานใหม่
        </button>
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหาประเภทงาน"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "default", label: "เรียงตามลำดับเดิม" },
          { key: "name", label: "เรียงตามชื่อ" },
          { key: "count", label: "เรียงตามจำนวนงาน (มาก→น้อย)" },
        ]}
      />

      {rows.length === 0 ? (
        <div className="empty-state">
          <IconDatabase size={40} />
          <div>{isFiltered ? "ไม่พบประเภทงานที่ตรงกับเงื่อนไข" : "ยังไม่มีประเภทงานในระบบ"}</div>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "ชื่อประเภทงาน" },
            { key: "count", label: "จำนวนงานสะสม" },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className="flex-row">
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    title="แก้ไข"
                    onClick={() => openEdit(r)}
                  >
                    <IconEdit size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    title="ลบ"
                    onClick={() => handleDelete(r.id)}
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingType ? "แก้ไขประเภทงาน" : "เพิ่มประเภทงานใหม่"}
        description="กำหนดชื่อประเภทงานสำหรับใช้อ้างอิงในระบบ"
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={closeModal}>ยกเลิก</button>
            <button type="submit" form="jobtype-form" className="btn btn-md btn-default">บันทึก</button>
          </>
        }
      >
        <form id="jobtype-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="ds-label">ชื่อประเภทงาน</label>
            <input className="ds-input" type="text" name="name" defaultValue={editingType?.name || ""} placeholder="เช่น ติดตั้งระบบปรับอากาศ (HVAC)" />
          </div>
        </form>
      </Modal>
    </div>
  );
}

function TeamsPanel() {
  const [teams, setTeams] = useTeams();
  const [personnel, setPersonnel] = usePersonnel();
  const { addAuditLog, addNotification } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [draftMembers, setDraftMembers] = useState([]);

  const log = (action, target) => addAuditLog({ actor: "ปุสิทธิ์ นันทวงศ์", role: "admin", action, target });
  const notify = (detail) => addNotification({ audience: "contractor", title: "อัปเดตทีมช่าง", detail });

  function handleDelete(id) {
    const team = teams.find((t) => t.id === id);
    setTeams((prev) => prev.filter((t) => t.id !== id));
    // freed members become unassigned again
    setPersonnel((prev) => prev.map((p) => (p.teamId === id ? { ...p, teamId: null, lead: false } : p)));
    if (team) { log("ลบทีมช่าง", team.name); notify(`ทีม ${team.name} ถูกยุบ — สมาชิกทั้งหมดถูกปลดออกจากทีม`); }
  }

  function openNew() { setEditingTeam(null); setDraftMembers([]); setModalOpen(true); }
  function openEdit(team) {
    setEditingTeam(team);
    setDraftMembers(personnel.filter((p) => p.teamId === team.id).map((p) => ({ id: p.id, name: p.name, lead: p.lead })));
    setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setEditingTeam(null); }

  // Add-member dropdown: unassigned technicians, plus this team's own members
  // removed within the current draft (so remove-then-re-add works). People in
  // another team are excluded — a person can only be in one team.
  const availablePeople = personnel.filter(
    (p) => (p.teamId === null || (editingTeam && p.teamId === editingTeam.id)) && !draftMembers.some((dm) => dm.id === p.id)
  );

  function addPerson(personId) {
    const person = personnel.find((p) => p.id === personId);
    if (!person) return;
    setDraftMembers((prev) => [...prev, { id: person.id, name: person.name, lead: prev.length === 0 }]);
  }
  function removeMember(id) {
    setDraftMembers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      if (next.length && !next.some((m) => m.lead)) next[0] = { ...next[0], lead: true };
      return next;
    });
  }
  function setDraftLead(id) {
    setDraftMembers((prev) => prev.map((m) => ({ ...m, lead: m.id === id })));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim() || "ทีมช่างใหม่";
    const teamId = editingTeam?.id || `tm-new-${Date.now()}`;

    const members = draftMembers.slice();
    if (members.length && !members.some((m) => m.lead)) members[0] = { ...members[0], lead: true };
    const draftIds = new Set(members.map((m) => m.id));
    const originalMembers = personnel.filter((p) => p.teamId === teamId);
    const originalIds = new Set(originalMembers.map((p) => p.id));

    // 1) team record
    if (editingTeam) {
      setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name } : t)));
      log("แก้ไขทีมช่าง", name);
    } else {
      setTeams((prev) => [{ id: teamId, name, activeJobs: 0, monthlyJobTarget: 4 }, ...prev]);
      log("เพิ่มทีมช่าง", name);
    }

    // 2) personnel assignments — a person can only be in one team
    setPersonnel((prev) =>
      prev.map((p) => {
        if (draftIds.has(p.id)) return { ...p, teamId, lead: !!members.find((m) => m.id === p.id)?.lead };
        if (originalIds.has(p.id)) return { ...p, teamId: null, lead: false }; // removed from this team
        return p;
      })
    );

    // 3) notifications + audit for who joined / left / became lead
    members.forEach((m) => {
      if (!originalIds.has(m.id)) { log("เพิ่มสมาชิกเข้าทีม", `${m.name} → ${name}`); notify(`${m.name} ถูกเพิ่มเข้าทีม ${name}`); }
    });
    originalMembers.forEach((p) => {
      if (!draftIds.has(p.id)) { log("นำสมาชิกออกจากทีม", `${p.name} ออกจาก ${name}`); notify(`${p.name} ถูกนำออกจากทีม ${name}`); }
    });
    const origLead = originalMembers.find((p) => p.lead);
    const newLead = members.find((m) => m.lead);
    if (newLead && origLead?.id !== newLead.id) {
      log("แต่งตั้งหัวหน้าช่าง", `${newLead.name} — ${name}`);
      notify(`${newLead.name} ได้รับแต่งตั้งเป็นหัวหน้าช่างทีม ${name}`);
    }
    closeModal();
  }

  const teamLead = (teamId) => personnel.find((p) => p.teamId === teamId && p.lead);
  const teamCount = (teamId) => personnel.filter((p) => p.teamId === teamId).length;

  // Team contact phone = the current draft lead's phone (single source of truth).
  const draftLeadId = draftMembers.find((m) => m.lead)?.id;
  const draftLeadPhone = draftLeadId ? personnel.find((p) => p.id === draftLeadId)?.phone : null;
  // Team specialty coverage = distinct specialties of the draft members.
  const draftCoverage = [...new Set(draftMembers.map((m) => personnel.find((p) => p.id === m.id)?.specialty).filter(Boolean))];

  const { search, setSearch, sortBy, setSortBy, rows: teamRows, resultCount, isFiltered } = useTableRows(teams, {
    searchFields: (t) => [t.name, teamLead(t.id)?.name, ...teamCoverage(t.id, personnel)],
    sortOptions: [
      { key: "name", label: "เรียงตามชื่อทีม", compare: (a, b) => a.name.localeCompare(b.name, "th") },
      { key: "members", label: "เรียงตามจำนวนสมาชิก (มาก→น้อย)", compare: (a, b) => teamCount(b.id) - teamCount(a.id) },
      { key: "activeJobs", label: "เรียงตามงานที่กำลังทำ (มาก→น้อย)", compare: (a, b) => b.activeJobs - a.activeJobs },
    ],
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.75rem" }}>
        {isFiltered && <span className="text-xs text-muted">แสดง {resultCount} รายการ</span>}
        <button type="button" className="btn btn-md btn-default" style={{ marginLeft: "auto" }} onClick={openNew}>
          <IconPlus size={16} />
          เพิ่มทีมช่างใหม่
        </button>
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหา ชื่อทีม / หัวหน้า / ความเชี่ยวชาญ"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "name", label: "เรียงตามชื่อทีม" },
          { key: "members", label: "เรียงตามจำนวนสมาชิก" },
          { key: "activeJobs", label: "เรียงตามงานที่กำลังทำ" },
        ]}
      />

      {teamRows.length === 0 ? (
        <div className="empty-state">
          <IconDatabase size={40} />
          <div>{isFiltered ? "ไม่พบทีมที่ตรงกับเงื่อนไข" : "ยังไม่มีทีมช่างในระบบ"}</div>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "ชื่อทีม" },
            {
              key: "lead",
              label: "หัวหน้าช่าง",
              render: (r) => {
                const lead = teamLead(r.id);
                return lead ? (
                  <span className="flex-row"><IconShield size={13} style={{ color: "var(--primary)" }} />{lead.name}</span>
                ) : <span className="text-muted">ยังไม่มี</span>;
              },
            },
            {
              key: "coverage",
              label: "ความเชี่ยวชาญ (รวมจากสมาชิก)",
              render: (r) => {
                const cov = teamCoverage(r.id, personnel);
                return cov.length ? (
                  <div className="flex-row" style={{ flexWrap: "wrap", gap: "0.25rem" }}>
                    {cov.map((c) => <span key={c} className="badge badge-secondary" style={{ fontSize: "0.68rem" }}>{specialtyShort[c] || c}</span>)}
                  </div>
                ) : <span className="text-muted">—</span>;
              },
            },
            { key: "memberCount", label: "สมาชิก", render: (r) => `${teamCount(r.id)} คน` },
            { key: "activeJobs", label: "งานที่กำลังทำ" },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className="flex-row">
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    title="แก้ไข"
                    onClick={() => openEdit(r)}
                  >
                    <IconEdit size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    title="ลบ"
                    onClick={() => handleDelete(r.id)}
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={teamRows}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingTeam ? `แก้ไข${editingTeam.name}` : "เพิ่มทีมช่างใหม่"}
        description="กรอกข้อมูลทีม → หยิบช่างที่ว่างเข้าทีม → ตั้งหัวหน้าช่าง 1 คน แล้วบันทึก"
        maxWidth={520}
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={closeModal}>ยกเลิก</button>
            <button type="submit" form="team-form" className="btn btn-md btn-default">บันทึก</button>
          </>
        }
      >
        <form id="team-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="ds-label">ชื่อทีม</label>
            <input className="ds-input" type="text" name="name" defaultValue={editingTeam?.name || ""} placeholder="เช่น ทีมช่างสมชาย" />
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="ds-label">เบอร์ติดต่อทีม</label>
              <div className="ds-input" style={{ display: "flex", alignItems: "center", gap: "0.4rem", background: "var(--muted)", color: draftLeadPhone ? "inherit" : "var(--muted-foreground)" }}>
                <IconPhone size={14} />
                {draftLeadPhone ? `${draftLeadPhone}` : "ตั้งหัวหน้าช่างก่อน"}
              </div>
              <span className="text-xs text-muted">ดึงจากเบอร์หัวหน้าช่างอัตโนมัติ</span>
            </div>
            <div className="form-group">
              <label className="ds-label">ความเชี่ยวชาญของทีม</label>
              <div className="ds-input" style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.25rem", minHeight: "38px", background: "var(--muted)" }}>
                {draftCoverage.length ? (
                  draftCoverage.map((c) => <span key={c} className="badge badge-secondary" style={{ fontSize: "0.68rem" }}>{specialtyShort[c] || c}</span>)
                ) : <span className="text-muted text-sm">เพิ่มสมาชิกเพื่อกำหนดความเชี่ยวชาญ</span>}
              </div>
              <span className="text-xs text-muted">รวมจากสายของสมาชิกอัตโนมัติ</span>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <span className="ds-label">สมาชิกในทีม ({draftMembers.length} คน)</span>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.4rem" }}>
              {draftMembers.map((m) => {
                const sp = personnel.find((p) => p.id === m.id)?.specialty;
                return (
                  <div key={m.id} className="flex-row" style={{ gap: "0.4rem", padding: "0.45rem 0.65rem", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
                    <span className="text-sm" style={{ flex: 1 }}>{m.name}</span>
                    {sp && <span className="badge badge-secondary" style={{ fontSize: "0.64rem", flexShrink: 0 }}>{specialtyShort[sp] || sp}</span>}
                    <button
                      type="button"
                      className={`btn btn-sm ${m.lead ? "btn-default" : "btn-outline"}`}
                      style={{ flexShrink: 0 }}
                      onClick={() => setDraftLead(m.id)}
                      title="ตั้งเป็นหัวหน้าช่าง"
                    >
                      {m.lead ? "หัวหน้า" : "ตั้งหัวหน้า"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-icon btn-ghost"
                      style={{ flexShrink: 0 }}
                      onClick={() => removeMember(m.id)}
                      title="นำออกจากทีม"
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                );
              })}
              {draftMembers.length === 0 && <div className="text-xs text-muted">ยังไม่มีสมาชิก — เลือกช่างที่ว่างด้านล่าง</div>}
            </div>

            <div style={{ marginTop: "0.65rem" }}>
              <select
                className="ds-input"
                value=""
                onChange={(e) => { if (e.target.value) addPerson(e.target.value); e.target.value = ""; }}
                disabled={availablePeople.length === 0}
              >
                <option value="">
                  {availablePeople.length === 0 ? "ไม่มีช่างที่ว่าง — นำออกจากทีมอื่นก่อน" : "+ หยิบช่างที่ว่างเข้าทีม..."}
                </option>
                {availablePeople.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} · {specialtyShort[p.specialty] || p.specialty}</option>
                ))}
              </select>
              <div className="text-xs text-muted" style={{ marginTop: "0.35rem" }}>
                แสดงเฉพาะช่างที่ยังไม่มีทีม · จัดสมาชิกจากแท็บ "รายชื่อช่าง" ก็ได้เช่นกัน
              </div>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

const EMPTY_TECH = { name: "", specialty: specialties[0], phone: "", lineId: "", emergencyName: "", emergencyRelation: "", emergencyPhone: "" };

function TechniciansPanel() {
  const [personnel, setPersonnel] = usePersonnel();
  const [teams] = useTeams();
  const { addAuditLog } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState(null);
  const [draft, setDraft] = useState(EMPTY_TECH);
  const [teamFilter, setTeamFilter] = useState("all");

  const log = (action, target) => addAuditLog({ actor: "ปุสิทธิ์ นันทวงศ์", role: "admin", action, target });
  const teamName = (id) => teams.find((t) => t.id === id)?.name || "";
  const setF = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  // Team & role are read-only here — this tab is the technician directory.
  // Actual team assignment / lead designation happens in the "ตั้งค่ารายชื่อทีมช่าง" tab.

  function openAdd() { setEditingTech(null); setDraft(EMPTY_TECH); setModalOpen(true); }
  function openEdit(person) {
    setEditingTech(person);
    setDraft({
      name: person.name || "", specialty: person.specialty || specialties[0], phone: person.phone || "", lineId: person.lineId || "",
      emergencyName: person.emergencyName || "", emergencyRelation: person.emergencyRelation || "", emergencyPhone: person.emergencyPhone || "",
    });
    setModalOpen(true);
  }

  function saveTech(e) {
    e.preventDefault();
    const data = { ...draft, name: draft.name.trim() };
    if (!data.name) return;
    if (editingTech) {
      setPersonnel((prev) => prev.map((p) => (p.id === editingTech.id ? { ...p, ...data } : p)));
      log("แก้ไขข้อมูลช่าง", data.name);
    } else {
      setPersonnel((prev) => [{ id: `p-new-${Date.now()}`, teamId: null, lead: false, ...data }, ...prev]);
      log("เพิ่มรายชื่อช่าง", data.name);
    }
    setModalOpen(false);
  }

  function removeTechnician(person) {
    setPersonnel((prev) => prev.filter((p) => p.id !== person.id));
    log("ลบรายชื่อช่าง", person.name);
  }

  const unassigned = personnel.filter((p) => !p.teamId).length;
  const roleRank = (p) => (p.lead ? 0 : p.teamId ? 1 : 2);

  const teamFiltered = personnel.filter((p) => {
    if (teamFilter === "none") return !p.teamId;
    if (teamFilter !== "all") return p.teamId === teamFilter;
    return true;
  });

  const { search, setSearch, sortBy, setSortBy, rows, resultCount, isFiltered } = useTableRows(teamFiltered, {
    searchFields: (p) => [p.name, p.phone, p.lineId, p.specialty, teamName(p.teamId)],
    sortOptions: [
      {
        key: "team", label: "เรียงตามทีม",
        compare: (a, b) => {
          if (!a.teamId && b.teamId) return 1;
          if (a.teamId && !b.teamId) return -1;
          if (a.teamId !== b.teamId) return teamName(a.teamId).localeCompare(teamName(b.teamId), "th");
          return (b.lead ? 1 : 0) - (a.lead ? 1 : 0);
        },
      },
      { key: "name", label: "เรียงตามชื่อ", compare: (a, b) => a.name.localeCompare(b.name, "th") },
      { key: "specialty", label: "เรียงตามความเชี่ยวชาญ", compare: (a, b) => (a.specialty || "").localeCompare(b.specialty || "", "th") || a.name.localeCompare(b.name, "th") },
      { key: "role", label: "เรียงตามบทบาท", compare: (a, b) => roleRank(a) - roleRank(b) || a.name.localeCompare(b.name, "th") },
      { key: "phone", label: "เรียงตามเบอร์", compare: (a, b) => (a.phone || "").localeCompare(b.phone || "") },
    ],
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <span className="text-xs text-muted">
          ช่างทั้งหมด {personnel.length} คน · ยังไม่มีทีม {unassigned} คน · จัดทีม/หัวหน้าที่แท็บ "ตั้งค่ารายชื่อทีมช่าง"
          {(isFiltered || teamFilter !== "all") && ` · แสดง ${resultCount} รายการ`}
        </span>
        <button type="button" className="btn btn-md btn-default" onClick={openAdd}>
          <IconPlus size={16} />
          เพิ่มรายชื่อช่าง
        </button>
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหา ชื่อ / ความเชี่ยวชาญ / เบอร์ / ทีม"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "team", label: "เรียงตามทีม" },
          { key: "name", label: "เรียงตามชื่อ" },
          { key: "specialty", label: "เรียงตามความเชี่ยวชาญ" },
          { key: "role", label: "เรียงตามบทบาท" },
          { key: "phone", label: "เรียงตามเบอร์" },
        ]}
      >
        <select className="ds-input" style={{ flex: "0 1 190px" }} value={teamFilter} onChange={(e) => setTeamFilter(e.target.value)}>
          <option value="all">ทุกทีม</option>
          <option value="none">— ยังไม่มีทีม —</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </TableToolbar>

      {rows.length === 0 ? (
        <div className="empty-state">
          <IconSearch size={36} />
          <div>ไม่พบช่างที่ตรงกับเงื่อนไข</div>
        </div>
      ) : (
      <DataTable
        columns={[
          { key: "name", label: "ชื่อช่าง", render: (r) => <span className="text-sm" style={{ fontWeight: 500 }}>{r.name}</span> },
          {
            key: "specialty",
            label: "ความเชี่ยวชาญ",
            render: (r) => (r.specialty ? <span className="badge badge-secondary" style={{ fontSize: "0.68rem" }}>{specialtyShort[r.specialty] || r.specialty}</span> : <span className="text-muted text-sm">—</span>),
          },
          {
            key: "phone",
            label: "เบอร์โทร",
            render: (r) => (r.phone ? <span className="flex-row text-sm" style={{ whiteSpace: "nowrap" }}><IconPhone size={13} />{r.phone}</span> : <span className="text-muted text-sm">—</span>),
          },
          {
            key: "team",
            label: "ทีมที่สังกัด",
            render: (r) => (r.teamId ? <span className="text-sm">{teamName(r.teamId)}</span> : <span className="text-muted text-sm">— ไม่มีทีม —</span>),
          },
          {
            key: "role",
            label: "บทบาท",
            render: (r) =>
              !r.teamId ? (
                <span className="text-muted text-sm">—</span>
              ) : r.lead ? (
                <span className="badge flex-row" style={{ width: "fit-content", background: "oklch(0.95 0.03 255)", color: "var(--primary)" }}>
                  <IconShield size={12} /> หัวหน้าช่าง
                </span>
              ) : (
                <span className="text-sm">สมาชิก</span>
              ),
          },
          {
            key: "actions",
            label: "",
            render: (r) => (
              <div className="flex-row">
                <button
                  type="button"
                  className="btn btn-icon btn-ghost"
                  title="ดู / แก้ไขข้อมูลช่าง"
                  onClick={() => openEdit(r)}
                >
                  <IconEdit size={15} />
                </button>
                <button
                  type="button"
                  className="btn btn-icon btn-ghost"
                  title="ลบรายชื่อช่าง"
                  onClick={() => removeTechnician(r)}
                >
                  <IconTrash size={15} />
                </button>
              </div>
            ),
          },
        ]}
        rows={rows}
      />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTech ? `ข้อมูลช่าง — ${editingTech.name}` : "เพิ่มรายชื่อช่าง"}
        description="ข้อมูลติดต่อและผู้ติดต่อฉุกเฉิน — ใช้ติดตามตัวช่างเมื่อไม่มางานหรือเกิดเหตุฉุกเฉิน"
        maxWidth={500}
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={() => setModalOpen(false)}>ยกเลิก</button>
            <button type="submit" form="tech-form" className="btn btn-md btn-default">บันทึก</button>
          </>
        }
      >
        <form id="tech-form" onSubmit={saveTech}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="ds-label">ชื่อ-นามสกุล</label>
              <input className="ds-input" type="text" value={draft.name} onChange={setF("name")} placeholder="เช่น สมชาย ใจดี" autoFocus />
            </div>
            <div className="form-group">
              <label className="ds-label">ความเชี่ยวชาญ</label>
              <select className="ds-input" value={draft.specialty} onChange={setF("specialty")}>
                {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="ds-label">เบอร์โทรศัพท์</label>
              <input className="ds-input" type="text" value={draft.phone} onChange={setF("phone")} placeholder="08X-XXX-XXXX" />
            </div>
            <div className="form-group">
              <label className="ds-label">Line ID</label>
              <input className="ds-input" type="text" value={draft.lineId} onChange={setF("lineId")} placeholder="ไอดีไลน์ (ถ้ามี)" />
            </div>
          </div>

          <div className="ds-separator" />
          <div className="ds-label" style={{ marginBottom: "0.5rem" }}>ผู้ติดต่อกรณีฉุกเฉิน</div>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="ds-label">ชื่อผู้ติดต่อ</label>
              <input className="ds-input" type="text" value={draft.emergencyName} onChange={setF("emergencyName")} placeholder="ชื่อ-นามสกุล" />
            </div>
            <div className="form-group">
              <label className="ds-label">ความสัมพันธ์</label>
              <input className="ds-input" type="text" value={draft.emergencyRelation} onChange={setF("emergencyRelation")} placeholder="เช่น คู่สมรส / บิดา" />
            </div>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="ds-label">เบอร์ติดต่อฉุกเฉิน</label>
            <input className="ds-input" type="text" value={draft.emergencyPhone} onChange={setF("emergencyPhone")} placeholder="08X-XXX-XXXX" />
          </div>
        </form>
      </Modal>
    </div>
  );
}

const EMPTY_CUSTOMER = { name: "", phone: "", address: EMPTY_ADDRESS };

function CustomersPanel() {
  const [customers, setCustomers] = useCustomers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [draft, setDraft] = useState(EMPTY_CUSTOMER);

  function handleDelete(id) {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  }

  function openNew() {
    setEditingCustomer(null);
    setDraft(EMPTY_CUSTOMER);
    setModalOpen(true);
  }

  function openEdit(customer) {
    setEditingCustomer(customer);
    setDraft({ name: customer.name, phone: customer.phone, address: { ...EMPTY_ADDRESS, ...customer.address } });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCustomer(null);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const name = draft.name.trim();
    const phone = draft.phone.trim();

    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...c, name: name || c.name, phone: phone || c.phone, address: draft.address } : c))
      );
    } else {
      setCustomers((prev) => [
        { id: `c-new-${Date.now()}`, name: name || "ลูกค้าใหม่", phone: phone || "-", address: draft.address },
        ...prev,
      ]);
    }
    closeModal();
  }

  const { search, setSearch, sortBy, setSortBy, rows, resultCount, isFiltered } = useTableRows(customers, {
    searchFields: (c) => [c.name, c.phone, formatAddress(c.address)],
    sortOptions: [
      { key: "default", label: "เรียงตามลำดับเดิม" },
      { key: "name", label: "เรียงตามชื่อ", compare: (a, b) => a.name.localeCompare(b.name, "th") },
      { key: "province", label: "เรียงตามจังหวัด", compare: (a, b) => (a.address?.province || "").localeCompare(b.address?.province || "", "th") },
    ],
  });

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.75rem" }}>
        {isFiltered && <span className="text-xs text-muted">แสดง {resultCount} รายการ</span>}
        <button type="button" className="btn btn-md btn-default" style={{ marginLeft: "auto" }} onClick={openNew}>
          <IconPlus size={16} />
          เพิ่มลูกค้าใหม่
        </button>
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหา ชื่อ / เบอร์ / ที่อยู่ / จังหวัด"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "default", label: "เรียงตามลำดับเดิม" },
          { key: "name", label: "เรียงตามชื่อ" },
          { key: "province", label: "เรียงตามจังหวัด" },
        ]}
      />

      {rows.length === 0 ? (
        <div className="empty-state">
          <IconDatabase size={40} />
          <div>{isFiltered ? "ไม่พบลูกค้าที่ตรงกับเงื่อนไข" : "ยังไม่มีลูกค้าในระบบ"}</div>
        </div>
      ) : (
        <DataTable
          columns={[
            { key: "name", label: "ชื่อลูกค้า" },
            { key: "phone", label: "เบอร์ติดต่อ" },
            {
              key: "address",
              label: "ที่อยู่",
              render: (r) => (
                <span className="flex-row" style={{ flexWrap: "wrap", gap: "0.4rem" }}>
                  {formatAddress(r.address)}
                  {r.address?.mapUrl && (
                    <a href={r.address.mapUrl} target="_blank" rel="noreferrer" className="flex-row text-xs" style={{ color: "var(--primary)", whiteSpace: "nowrap" }}>
                      <IconMapPin size={12} />เปิดแผนที่
                    </a>
                  )}
                </span>
              ),
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <div className="flex-row">
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    title="แก้ไข"
                    onClick={() => openEdit(r)}
                  >
                    <IconEdit size={15} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    title="ลบ"
                    onClick={() => handleDelete(r.id)}
                  >
                    <IconTrash size={15} />
                  </button>
                </div>
              ),
            },
          ]}
          rows={rows}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingCustomer ? `แก้ไข${editingCustomer.name}` : "เพิ่มลูกค้าใหม่"}
        description="กรอกข้อมูลลูกค้าเพื่อเพิ่มเข้าคลังรายชื่อสำหรับใช้ตอนเปิดงาน"
        maxWidth={540}
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={closeModal}>ยกเลิก</button>
            <button type="submit" form="customer-form" className="btn btn-md btn-default">บันทึก</button>
          </>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="ds-label">ชื่อลูกค้า</label>
              <input className="ds-input" type="text" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="เช่น เทศบาลตำบลบางแก้ว" />
            </div>
            <div className="form-group">
              <label className="ds-label">เบอร์ติดต่อ</label>
              <input className="ds-input" type="text" value={draft.phone} onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))} placeholder="02-XXX-XXXX" />
            </div>
          </div>
          <ThaiAddressFields value={draft.address} onChange={(address) => setDraft((d) => ({ ...d, address }))} />
        </form>
      </Modal>
    </div>
  );
}

function RolesPanel() {
  const [roles, setRoles] = useRoles();
  const { addAuditLog } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [draftName, setDraftName] = useState("");
  const [draftPerms, setDraftPerms] = useState({});

  function log(action, target) {
    addAuditLog({ actor: "ปุสิทธิ์ นันทวงศ์", role: "admin", action, target });
  }

  function openNew() {
    setEditingRole(null);
    setDraftName("");
    setDraftPerms(buildPermissions());
    setModalOpen(true);
  }
  function openEdit(role) {
    setEditingRole(role);
    setDraftName(role.name);
    // deep copy so editing the draft doesn't mutate the stored role
    const copy = {};
    permissionModules.forEach((m) => {
      copy[m.key] = { ...(role.permissions[m.key] || { view: false, add: false, edit: false, delete: false }) };
    });
    setDraftPerms(copy);
    setModalOpen(true);
  }
  function closeModal() {
    setModalOpen(false);
    setEditingRole(null);
  }
  // ดู (view) is the gate: turning it off clears the others; enabling any
  // action implies view.
  function togglePerm(moduleKey, op) {
    setDraftPerms((p) => {
      const cur = { ...(p[moduleKey] || { view: false, add: false, edit: false, delete: false }) };
      cur[op] = !cur[op];
      if (op === "view" && !cur.view) { cur.add = false; cur.edit = false; cur.delete = false; }
      if (op !== "view" && cur[op]) cur.view = true;
      return { ...p, [moduleKey]: cur };
    });
  }

  function handleSave(e) {
    e.preventDefault();
    const name = draftName.trim();
    if (!name) return;
    if (editingRole) {
      setRoles((prev) => prev.map((r) => (r.id === editingRole.id ? { ...r, name, permissions: draftPerms } : r)));
      log("แก้ไขสิทธิ์บทบาท", name);
    } else {
      setRoles((prev) => [...prev, { id: `role-${Date.now()}`, name, system: false, status: "active", permissions: draftPerms }]);
      log("เพิ่มบทบาทใหม่", name);
    }
    closeModal();
  }

  function handleDelete(role) {
    setRoles((prev) => prev.filter((r) => r.id !== role.id));
    log("ลบบทบาท", role.name);
  }

  function toggleStatus(role) {
    const next = role.status === "active" ? "suspended" : "active";
    setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, status: next } : r)));
    log(next === "suspended" ? "ระงับบทบาท" : "เปิดใช้งานบทบาท", role.name);
  }

  const countPerms = (role) => permissionModules.filter((m) => role.permissions[m.key]?.view).length;

  const { search, setSearch, sortBy, setSortBy, rows, resultCount, isFiltered } = useTableRows(roles, {
    searchFields: (r) => [r.name, r.status === "active" ? "ใช้งาน" : "ระงับ"],
    sortOptions: [
      { key: "default", label: "เรียงตามลำดับเดิม" },
      { key: "name", label: "เรียงตามชื่อ", compare: (a, b) => a.name.localeCompare(b.name, "th") },
      { key: "status", label: "เรียงตามสถานะ", compare: (a, b) => a.status.localeCompare(b.status) },
    ],
  });

  return (
    <div>
      <div className="ds-alert ds-alert-info" style={{ marginBottom: "1.25rem" }}>
        <div className="ds-alert-icon"><IconShield size={16} /></div>
        <div>
          <strong>จัดการบทบาทและสิทธิ์การเข้าถึง</strong>
          เพิ่ม / แก้ไข / ลบ / ระงับ บทบาท และกำหนดสิทธิ์แต่ละโมดูล · ผู้ดูแลระบบ (Owner) มีสิทธิ์เต็มเสมอ ปรับไม่ได้
        </div>
      </div>

      <div className="flex-between" style={{ marginBottom: "0.9rem", flexWrap: "wrap", gap: "0.75rem" }}>
        {isFiltered && <span className="text-xs text-muted">แสดง {resultCount} รายการ</span>}
        <button type="button" className="btn btn-md btn-default" style={{ marginLeft: "auto" }} onClick={openNew}>
          <IconPlus size={16} /> เพิ่มบทบาทใหม่
        </button>
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหาบทบาท"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "default", label: "เรียงตามลำดับเดิม" },
          { key: "name", label: "เรียงตามชื่อ" },
          { key: "status", label: "เรียงตามสถานะ" },
        ]}
      />

      <DataTable
        columns={[
          {
            key: "name",
            label: "บทบาท",
            render: (r) => (
              <span className="flex-row">
                <IconShield size={15} style={{ color: "var(--primary)" }} />
                {r.name}
                {r.system && <span className="badge badge-secondary">ระบบ</span>}
              </span>
            ),
          },
          {
            key: "perms",
            label: "สิทธิ์การเข้าถึง",
            render: (r) => (r.owner ? <span className="badge badge-success">เต็มทุกโมดูล</span> : `${countPerms(r)} / ${permissionModules.length} โมดูล`),
          },
          {
            key: "status",
            label: "สถานะ",
            render: (r) => <span className={`badge ${r.status === "active" ? "badge-success" : "badge-secondary"}`}>{r.status === "active" ? "ใช้งาน" : "ระงับ"}</span>,
          },
          {
            key: "actions",
            label: "",
            render: (r) =>
              r.owner ? (
                <span className="text-xs text-muted">Owner · ปรับไม่ได้</span>
              ) : (
                <div className="flex-row">
                  <button
                    type="button"
                    className="btn btn-icon btn-ghost"
                    title="แก้ไขสิทธิ์"
                    onClick={() => openEdit(r)}
                  >
                    <IconEdit size={15} />
                  </button>
                  <div
                    className={`ds-switch ${r.status === "active" ? "on" : ""}`}
                    onClick={() => toggleStatus(r)}
                    title={r.status === "active" ? "ระงับบทบาท" : "เปิดใช้งาน"}
                  />
                  {!r.system && (
                    <button
                      type="button"
                      className="btn btn-icon btn-ghost"
                      title="ลบบทบาท"
                      onClick={() => handleDelete(r)}
                    >
                      <IconTrash size={15} />
                    </button>
                  )}
                </div>
              ),
          },
        ]}
        rows={rows}
      />

      <p className="text-xs text-muted" style={{ marginTop: "0.9rem" }}>
        หมายเหตุ: เป็นการตั้งค่าสิทธิ์ (บันทึกค่า + ลงประวัติการใช้งานเมื่อแก้ไข) — ในต้นแบบนี้ยังไม่ได้เชื่อมให้ปิดเมนู/บล็อกการเข้าถึงจริงตามค่าที่ตั้ง
      </p>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingRole ? `แก้ไขบทบาท — ${editingRole.name}` : "เพิ่มบทบาทใหม่"}
        description="กำหนดชื่อบทบาท และเลือกสิทธิ์ ดู/เพิ่ม/แก้ไข/ลบ ของแต่ละโมดูล"
        maxWidth={600}
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={closeModal}>ยกเลิก</button>
            <button type="submit" form="role-form" className="btn btn-md btn-default">บันทึก</button>
          </>
        }
      >
        <form id="role-form" onSubmit={handleSave}>
          <div className="form-group">
            <label className="ds-label">ชื่อบทบาท</label>
            <input className="ds-input" type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="เช่น หัวหน้าฝ่ายบัญชี" required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="ds-label">สิทธิ์การเข้าถึงแต่ละโมดูล</label>
            <div className="text-xs text-muted" style={{ marginBottom: "0.4rem" }}>ติ๊ก "ดู" ก่อนจึงจะเปิด เพิ่ม/แก้ไข/ลบ ได้ · เช่น อยากให้เพิ่ม-แก้ไขได้แต่ลบไม่ได้ ให้ติ๊ก ดู+เพิ่ม+แก้ไข เว้น ลบ</div>
            <div className="ds-table-wrap">
              <table className="perm-table">
                <thead>
                  <tr>
                    <th>โมดูล / ฟังก์ชัน</th>
                    {permissionOps.map((op) => <th key={op.key} style={{ textAlign: "center" }}>{op.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {permissionModules.map((m) => {
                    const perm = draftPerms[m.key] || {};
                    return (
                      <tr key={m.key}>
                        <td>{m.label}</td>
                        {permissionOps.map((op) => (
                          <td key={op.key} style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={!!perm[op.key]}
                              disabled={op.key !== "view" && !perm.view}
                              onChange={() => togglePerm(m.key, op.key)}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function AdminMasterDataPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Master Data</h2>
          <p>จัดการข้อมูลตั้งต้นที่ระบบใช้อ้างอิง</p>
        </div>
      </div>

      <Tabs
        tabs={[
          { key: "jobtypes", label: "ตั้งค่าประเภทงาน" },
          { key: "teams", label: "ตั้งค่ารายชื่อทีมช่าง" },
          { key: "technicians", label: "รายชื่อช่าง" },
          { key: "customers", label: "ตั้งค่ารายชื่อลูกค้า" },
          { key: "roles", label: "บทบาท & สิทธิ์" },
        ]}
        defaultKey="jobtypes"
      >
        {(active) => {
          if (active === "jobtypes") return <JobTypesPanel />;
          if (active === "teams") return <TeamsPanel />;
          if (active === "technicians") return <TechniciansPanel />;
          if (active === "customers") return <CustomersPanel />;
          return <RolesPanel />;
        }}
      </Tabs>
    </div>
  );
}
