"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, Check, Clock, ShieldCheck, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { jobTypes as seedTypes, type JobTypeRow } from "@/lib/admin";
import { contractors as seedTeams } from "@/lib/data";
import type { Contractor } from "@/lib/types";

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export default function MasterDataPage() {
  const [tab, setTab] = React.useState("types");
  const [types, setTypes] = React.useState<JobTypeRow[]>(seedTypes);
  const [teams, setTeams] = React.useState<Contractor[]>(seedTeams);
  const [dialog, setDialog] = React.useState<"type" | "team" | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);

  const [typeForm, setTypeForm] = React.useState({ name: "", warranty: 12 });
  const [teamForm, setTeamForm] = React.useState({
    name: "",
    skill: "",
    phone: "",
  });

  // link settings
  const [expiryHours, setExpiryHours] = React.useState(72);
  const [defaultRestricted, setDefaultRestricted] = React.useState(true);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  return (
    <div className="space-y-4">
      {toast && <Alert tone="success" title={toast} />}

      <Tabs
        value={tab}
        onValueChange={setTab}
        variant="line"
        items={[
          { value: "types", label: "ประเภทงาน" },
          { value: "teams", label: "รายชื่อทีมช่าง" },
          { value: "links", label: "ตั้งค่าลิงก์" },
        ]}
      />

      {/* Job types */}
      {tab === "types" && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <p className="text-[0.85rem] text-muted-foreground">
                ประเภทงานตั้งต้นที่ระบบนำไปใช้ ({types.length} รายการ)
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setTypeForm({ name: "", warranty: 12 });
                  setDialog("type");
                }}
              >
                <Plus className="size-4" />
                เพิ่มประเภทงาน
              </Button>
            </div>
            <TableWrap className="rounded-none border-0 border-t border-border">
              <Table>
                <THead>
                  <TR>
                    <TH>ชื่อประเภทงาน</TH>
                    <TH className="text-center">ประกันตั้งต้น</TH>
                    <TH className="text-center">จำนวนงาน</TH>
                    <TH className="text-right">จัดการ</TH>
                  </TR>
                </THead>
                <TBody>
                  {types.map((t) => (
                    <TR key={t.id}>
                      <TD className="font-medium">{t.name}</TD>
                      <TD className="text-center">
                        <Badge tone="secondary">{t.defaultWarranty} เดือน</Badge>
                      </TD>
                      <TD className="text-center text-muted-foreground">
                        {t.jobs}
                      </TD>
                      <TD>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="แก้ไข">
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="ลบ"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setTypes((l) => l.filter((x) => x.id !== t.id))
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </CardContent>
        </Card>
      )}

      {/* Teams */}
      {tab === "teams" && (
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4">
              <p className="text-[0.85rem] text-muted-foreground">
                คลังรายชื่อทีมช่าง / ผู้รับเหมา ({teams.length} ทีม)
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setTeamForm({ name: "", skill: "", phone: "" });
                  setDialog("team");
                }}
              >
                <Plus className="size-4" />
                เพิ่มทีมช่าง
              </Button>
            </div>
            <TableWrap className="rounded-none border-0 border-t border-border">
              <Table>
                <THead>
                  <TR>
                    <TH>ทีม</TH>
                    <TH>ความชำนาญ</TH>
                    <TH>เบอร์ติดต่อ</TH>
                    <TH className="text-right">จัดการ</TH>
                  </TR>
                </THead>
                <TBody>
                  {teams.map((t) => (
                    <TR key={t.id}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={t.name} size="sm" color={t.avatarColor} />
                          <span className="text-[0.9rem] font-medium">
                            {t.name}
                          </span>
                        </div>
                      </TD>
                      <TD className="text-[0.85rem]">{t.skill}</TD>
                      <TD className="text-[0.85rem] text-muted-foreground">
                        {t.phone}
                      </TD>
                      <TD>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label="แก้ไข">
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="ลบ"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              setTeams((l) => l.filter((x) => x.id !== t.id))
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </CardContent>
        </Card>
      )}

      {/* Link settings */}
      {tab === "links" && (
        <Card className="max-w-xl">
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Clock className="size-4 text-primary" />
                เวลาที่ลิงก์จะหมดอายุ (ค่าตั้งต้น)
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">
                  ชั่วโมง นับจากเวลาที่สร้างลิงก์
                </span>
              </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-border p-3.5">
              <span className="flex items-center gap-2 text-[0.9rem]">
                <ShieldCheck className="size-4 text-primary" />
                จำกัดสิทธิ์คนเข้าถึงลิงก์ (ค่าตั้งต้น)
              </span>
              <Switch
                checked={defaultRestricted}
                onCheckedChange={setDefaultRestricted}
              />
            </label>

            <div className="flex justify-end">
              <Button onClick={() => flash("บันทึกการตั้งค่าลิงก์เรียบร้อย")}>
                <Save className="size-4" />
                บันทึกการตั้งค่า
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add type dialog */}
      <Dialog
        open={dialog === "type"}
        onClose={() => setDialog(null)}
        title="เพิ่มประเภทงานใหม่"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialog(null)}>
              ยกเลิก
            </Button>
            <Button
              disabled={!typeForm.name}
              onClick={() => {
                setTypes((l) => [
                  {
                    id: `jt${l.length + 1}`,
                    name: typeForm.name,
                    defaultWarranty: typeForm.warranty,
                    jobs: 0,
                  },
                  ...l,
                ]);
                setDialog(null);
                flash(`เพิ่มประเภทงาน "${typeForm.name}" แล้ว`);
              }}
            >
              <Check className="size-4" />
              บันทึก
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>ชื่อประเภทงาน</Label>
            <Input
              value={typeForm.name}
              onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
              placeholder="เช่น งานเชื่อมโลหะ"
            />
          </div>
          <div className="space-y-1.5">
            <Label>ระยะประกันตั้งต้น</Label>
            <Select
              value={String(typeForm.warranty)}
              onChange={(e) =>
                setTypeForm({ ...typeForm, warranty: Number(e.target.value) })
              }
            >
              <option value="2">2 เดือน</option>
              <option value="6">6 เดือน</option>
              <option value="12">12 เดือน</option>
              <option value="24">24 เดือน</option>
            </Select>
          </div>
        </div>
      </Dialog>

      {/* Add team dialog */}
      <Dialog
        open={dialog === "team"}
        onClose={() => setDialog(null)}
        title="เพิ่มทีมช่างใหม่"
        footer={
          <>
            <Button variant="outline" onClick={() => setDialog(null)}>
              ยกเลิก
            </Button>
            <Button
              disabled={!teamForm.name}
              onClick={() => {
                setTeams((l) => [
                  {
                    id: `t${l.length + 1}`,
                    name: teamForm.name,
                    skill: teamForm.skill || "งานทั่วไป",
                    phone: teamForm.phone || "-",
                    avatarColor: COLORS[l.length % COLORS.length],
                  },
                  ...l,
                ]);
                setDialog(null);
                flash(`เพิ่มทีม "${teamForm.name}" แล้ว`);
              }}
            >
              <Check className="size-4" />
              บันทึก
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>ชื่อทีม</Label>
            <Input
              value={teamForm.name}
              onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
              placeholder="เช่น ทีมช่างดี"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>ความชำนาญ</Label>
              <Input
                value={teamForm.skill}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, skill: e.target.value })
                }
                placeholder="เช่น งานแอร์"
              />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์ติดต่อ</Label>
              <Input
                value={teamForm.phone}
                onChange={(e) =>
                  setTeamForm({ ...teamForm, phone: e.target.value })
                }
                placeholder="08x-xxx-xxxx"
              />
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
