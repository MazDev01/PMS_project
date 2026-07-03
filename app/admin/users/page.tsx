"use client";

import * as React from "react";
import { Plus, Search, Pencil, KeyRound, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import {
  TableWrap,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import {
  users as seedUsers,
  ROLE_LABEL,
  type SystemUser,
  type UserRole,
} from "@/lib/admin";
import { formatThaiDateTime } from "@/lib/utils";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function AdminUsersPage() {
  const [list, setList] = React.useState<SystemUser[]>(seedUsers);
  const [query, setQuery] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("all");
  const [addOpen, setAddOpen] = React.useState(false);
  const [resetUser, setResetUser] = React.useState<SystemUser | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  // add-user form
  const [form, setForm] = React.useState({
    name: "",
    username: "",
    email: "",
    role: "coordinator" as UserRole,
  });

  const filtered = list.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (query) {
      const hay = `${u.name} ${u.username} ${u.email}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  function toggleActive(id: string) {
    setList((l) =>
      l.map((u) => (u.id === id ? { ...u, active: !u.active } : u)),
    );
  }

  function addUser() {
    if (!form.name || !form.username) return;
    setList((l) => [
      {
        id: `u${l.length + 1}`,
        name: form.name,
        username: form.username,
        email: form.email || `${form.username}@macca.co.th`,
        role: form.role,
        active: true,
        lastActive: "2026-07-03T14:25:00",
        avatarColor: COLORS[l.length % COLORS.length],
      },
      ...l,
    ]);
    setAddOpen(false);
    setForm({ name: "", username: "", email: "", role: "coordinator" });
    flash(`เพิ่มบัญชี ${form.name} เรียบร้อย`);
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="space-y-4">
      {toast && (
        <Alert tone="success" title={toast}>
          ระบบบันทึกการเปลี่ยนแปลงแล้ว
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ค้นหาชื่อ / username / อีเมล…"
              className="h-8 w-56 rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-8 w-44"
          >
            <option value="all">ทุกบทบาท</option>
            <option value="admin">ผู้ดูแลระบบ</option>
            <option value="coordinator">ผู้ประสานงาน</option>
            <option value="contractor">ทีมช่าง / ผู้รับเหมา</option>
          </Select>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="size-4" />
          เพิ่มผู้ใช้ใหม่
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <THead>
                <TR>
                  <TH>ผู้ใช้</TH>
                  <TH>บทบาท (Role)</TH>
                  <TH>ใช้งานล่าสุด</TH>
                  <TH className="text-center">เปิด/ปิดบัญชี</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="md" color={u.avatarColor} />
                        <div>
                          <div className="text-[0.9rem] font-medium">
                            {u.name}
                          </div>
                          <div className="text-[0.72rem] text-muted-foreground">
                            @{u.username} · {u.email}
                          </div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <Badge tone={u.role === "admin" ? "default" : "secondary"}>
                        {ROLE_LABEL[u.role]}
                      </Badge>
                    </TD>
                    <TD className="text-[0.8rem] text-muted-foreground">
                      {formatThaiDateTime(u.lastActive)}
                    </TD>
                    <TD>
                      <div className="flex items-center justify-center gap-2">
                        <Switch
                          checked={u.active}
                          onCheckedChange={() => toggleActive(u.id)}
                        />
                        <span
                          className={`text-[0.72rem] ${
                            u.active
                              ? "text-success-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {u.active ? "เปิด" : "ปิด"}
                        </span>
                      </div>
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="แก้ไข">
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="รีเซ็ตรหัสผ่าน"
                          onClick={() => setResetUser(u)}
                        >
                          <KeyRound className="size-4" />
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))}
                {filtered.length === 0 && (
                  <TR>
                    <TD
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      ไม่พบผู้ใช้ตามเงื่อนไข
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </TableWrap>
        </CardContent>
      </Card>

      {/* Add user dialog */}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="เพิ่มผู้ใช้ใหม่"
        description="สร้างบัญชีและกำหนดบทบาทเพื่อควบคุมสิทธิ์การเข้าถึง"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={addUser} disabled={!form.name || !form.username}>
              <Check className="size-4" />
              สร้างบัญชี
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>ชื่อ-นามสกุล</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="เช่น คุณสมชาย"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ชื่อผู้ใช้</Label>
              <Input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                placeholder="username"
              />
            </div>
            <div className="space-y-1.5">
              <Label>บทบาท (Role)</Label>
              <Select
                value={form.role}
                onChange={(e) =>
                  setForm({ ...form, role: e.target.value as UserRole })
                }
              >
                <option value="coordinator">ผู้ประสานงาน</option>
                <option value="contractor">ทีมช่าง / ผู้รับเหมา</option>
                <option value="admin">ผู้ดูแลระบบ</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>อีเมล</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="example@macca.co.th"
            />
          </div>
        </div>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog
        open={resetUser !== null}
        onClose={() => setResetUser(null)}
        title="รีเซ็ตรหัสผ่าน"
        description={resetUser ? `บัญชี @${resetUser.username}` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setResetUser(null)}>
              ยกเลิก
            </Button>
            <Button
              onClick={() => {
                flash(`ส่งลิงก์รีเซ็ตรหัสผ่านให้ ${resetUser?.name} แล้ว`);
                setResetUser(null);
              }}
            >
              <KeyRound className="size-4" />
              ส่งลิงก์รีเซ็ต
            </Button>
          </>
        }
      >
        <p className="text-[0.85rem] text-muted-foreground">
          ระบบจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปยังอีเมล{" "}
          <span className="font-medium text-foreground">
            {resetUser?.email}
          </span>{" "}
          และบังคับให้ตั้งรหัสใหม่เมื่อเข้าสู่ระบบครั้งถัดไป
        </p>
      </Dialog>
    </div>
  );
}
