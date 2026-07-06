"use client";

import { useState } from "react";
import Modal from "@/app/components/Modal";
import DataTable from "@/app/components/DataTable";
import { IconPlus, IconEdit, IconUsers } from "@/app/components/icons";
import { useTableRows, TableToolbar } from "@/app/components/TableControls";
import { roleLabel } from "@/app/lib/mockData";
import { useStaffUsers, useStore } from "@/app/lib/store";
import { formatDateTimeTH } from "@/app/lib/format";

function initialsOf(name) {
  const trimmed = (name || "").trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return parts[0][0] + parts[1][0];
  return trimmed.slice(0, 2);
}

function genTempPassword() {
  const a = Math.random().toString(36).slice(-4);
  const b = Math.random().toString(36).slice(-4).toUpperCase();
  return `${b}${a}`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useStaffUsers();
  const { addAuditLog } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetMessage, setResetMessage] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  const roleFiltered = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);
  const { search, setSearch, sortBy, setSortBy, rows: filteredUsers, resultCount, isFiltered } = useTableRows(roleFiltered, {
    searchFields: (u) => [u.name, u.email, u.phone],
    sortOptions: [
      { key: "default", label: "เรียงตามลำดับเดิม" },
      { key: "name", label: "เรียงตามชื่อ", compare: (a, b) => a.name.localeCompare(b.name, "th") },
      { key: "role", label: "เรียงตาม Role", compare: (a, b) => a.role.localeCompare(b.role) },
      { key: "lastLogin", label: "เรียงตามเข้าสู่ระบบล่าสุด", compare: (a, b) => b.lastLogin.localeCompare(a.lastLogin) },
    ],
  });

  function toggleStatus(id) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === "active" ? "disabled" : "active" } : u))
    );
  }

  function openNew() {
    setEditingUser(null);
    setResetMessage(null);
    setModalOpen(true);
  }

  function openEdit(u) {
    setEditingUser(u);
    setResetMessage(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingUser(null);
    setResetMessage(null);
  }

  function handleResetPassword() {
    setResetMessage(`ตั้งรหัสผ่านชั่วคราวใหม่แล้ว: ${genTempPassword()} (ระบบส่งให้ผู้ใช้งานทางอีเมลอัตโนมัติ)`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const role = form.role.value;

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { ...u, name: name || u.name, email: email || u.email, phone: phone || u.phone, role }
            : u
        )
      );
    } else {
      const nums = users.map((u) => parseInt(u.id.split("-").pop(), 10)).filter((n) => !Number.isNaN(n));
      const nextNum = (nums.length ? Math.max(...nums) : 0) + 1;
      const newUser = {
        id: `U-${String(nextNum).padStart(2, "0")}`,
        name: name || "ผู้ใช้งานใหม่",
        role,
        email: email || "-",
        phone: phone || "-",
        status: "active",
        lastLogin: new Date().toISOString(),
      };
      setUsers((prev) => [newUser, ...prev]);
      addAuditLog({ actor: "ปุสิทธิ์ นันทวงศ์", role: "admin", action: "เพิ่มผู้ใช้งานใหม่", target: `${newUser.id} ${newUser.name}` });
    }
    closeModal();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>จัดการผู้ใช้งาน</h2>
          <p>สร้างบัญชี กำหนดสิทธิ์ และควบคุมสถานะการใช้งานของพนักงานทุกคนในระบบ</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-md btn-default" onClick={openNew}>
            <IconPlus size={16} />
            เพิ่มผู้ใช้งานใหม่
          </button>
        </div>
      </div>

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        placeholder="ค้นหา ชื่อ / อีเมล / เบอร์โทร"
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={[
          { key: "default", label: "เรียงตามลำดับเดิม" },
          { key: "name", label: "เรียงตามชื่อ" },
          { key: "role", label: "เรียงตาม Role" },
          { key: "lastLogin", label: "เรียงตามเข้าสู่ระบบล่าสุด" },
        ]}
      >
        <select className="ds-input" style={{ flex: "0 1 190px" }} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="all">ทุก Role</option>
          <option value="coordinator">{roleLabel("coordinator")}</option>
          <option value="contractor">{roleLabel("contractor")}</option>
          <option value="admin">{roleLabel("admin")}</option>
          <option value="executive">{roleLabel("executive")}</option>
        </select>
      </TableToolbar>
      {isFiltered && <p className="text-xs text-muted" style={{ marginTop: "-0.4rem", marginBottom: "0.75rem" }}>แสดง {resultCount} รายการ</p>}

      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <IconUsers size={40} />
          <div>ไม่พบผู้ใช้งานที่ตรงกับเงื่อนไขการค้นหา</div>
        </div>
      ) : (
        <DataTable
          columns={[
            {
              key: "name",
              label: "ชื่อ-นามสกุล",
              render: (r) => (
                <div className="flex-row">
                  <div className="avatar avatar-sm">{initialsOf(r.name)}</div>
                  {r.name}
                </div>
              ),
            },
            {
              key: "role",
              label: "Role",
              render: (r) => <span className="badge badge-secondary">{roleLabel(r.role)}</span>,
            },
            { key: "email", label: "อีเมล" },
            { key: "phone", label: "เบอร์โทร" },
            { key: "lastLogin", label: "เข้าสู่ระบบล่าสุด", render: (r) => formatDateTimeTH(r.lastLogin) },
            {
              key: "status",
              label: "สถานะ",
              render: (r) => (
                <div
                  className={`ds-switch ${r.status === "active" ? "on" : ""}`}
                  onClick={() => toggleStatus(r.id)}
                  title={r.status === "active" ? "Active — คลิกเพื่อปิดบัญชี" : "ปิดใช้งาน — คลิกเพื่อเปิดใช้งาน"}
                />
              ),
            },
            {
              key: "actions",
              label: "",
              render: (r) => (
                <button type="button" className="btn btn-icon btn-ghost" title="แก้ไข/รีเซ็ตรหัสผ่าน" onClick={() => openEdit(r)}>
                  <IconEdit size={15} />
                </button>
              ),
            },
          ]}
          rows={filteredUsers}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingUser ? `แก้ไขผู้ใช้งาน — ${editingUser.name}` : "เพิ่มผู้ใช้งานใหม่"}
        description={editingUser ? "แก้ไขข้อมูลบัญชีหรือรีเซ็ตรหัสผ่านให้ผู้ใช้งานนี้" : "กรอกข้อมูลและเลือก Role เพื่อสร้างบัญชีใหม่ในระบบ"}
        footer={
          <>
            <button type="button" className="btn btn-md btn-secondary" onClick={closeModal}>ยกเลิก</button>
            <button type="submit" form="user-form" className="btn btn-md btn-default">{editingUser ? "บันทึกการแก้ไข" : "สร้างบัญชี"}</button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="ds-label">ชื่อ-นามสกุล</label>
            <input className="ds-input" type="text" name="name" defaultValue={editingUser?.name || ""} placeholder="เช่น สมชาย ใจดี" />
          </div>
          <div className="form-group">
            <label className="ds-label">อีเมล</label>
            <input className="ds-input" type="email" name="email" defaultValue={editingUser?.email || ""} placeholder="name@maccalight.co.th" />
          </div>
          <div className="form-group">
            <label className="ds-label">เบอร์โทร</label>
            <input className="ds-input" type="text" name="phone" defaultValue={editingUser?.phone || ""} placeholder="08X-XXX-XXXX" />
          </div>
          <div className="form-group">
            <label className="ds-label">เลือก Role</label>
            <select className="ds-select" name="role" defaultValue={editingUser?.role || "coordinator"}>
              <option value="coordinator">{roleLabel("coordinator")}</option>
              <option value="contractor">{roleLabel("contractor")}</option>
              <option value="admin">{roleLabel("admin")}</option>
              <option value="executive">{roleLabel("executive")}</option>
            </select>
          </div>
        </form>

        {editingUser && (
          <>
            <div className="ds-separator" />
            <div className="flex-row" style={{ justifyContent: "space-between" }}>
              <div>
                <div className="text-sm" style={{ fontWeight: 600 }}>รีเซ็ตรหัสผ่าน</div>
                <div className="text-xs text-muted">สร้างรหัสผ่านชั่วคราวใหม่และส่งให้ผู้ใช้งานทางอีเมล</div>
              </div>
              <button type="button" className="btn btn-sm btn-outline" onClick={handleResetPassword}>รีเซ็ตรหัสผ่าน</button>
            </div>
            {resetMessage && (
              <div className="ds-alert ds-alert-success" style={{ marginTop: "0.75rem" }}>
                <div>{resetMessage}</div>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
}
