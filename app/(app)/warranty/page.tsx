"use client";

import * as React from "react";
import { Search, Plus, ShieldCheck, UploadCloud, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import { jobs, customers, getCustomer } from "@/lib/data";
import { formatThaiDate } from "@/lib/utils";

const TODAY = new Date("2026-07-03");

function monthsLeft(endIso?: string) {
  if (!endIso) return 0;
  const end = new Date(endIso);
  return Math.max(
    0,
    Math.round((end.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24 * 30)),
  );
}

const warrantyJobs = jobs.filter((j) => j.warranty !== "none");

export default function WarrantyPage() {
  const [tab, setTab] = React.useState("check");
  const [filter, setFilter] = React.useState("all");
  const [query, setQuery] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [attached, setAttached] = React.useState(false);

  const rows = warrantyJobs.filter((j) => {
    if (filter !== "all" && j.warranty !== filter) return false;
    if (query) {
      const hay = `${j.code} ${getCustomer(j.customerId)?.name}`;
      if (!hay.toLowerCase().includes(query.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <Tabs
        value={tab}
        onValueChange={setTab}
        variant="line"
        items={[
          { value: "check", label: "เช็คประกัน" },
          { value: "claim", label: "แจ้งซ่อม" },
        ]}
      />

      {tab === "check" ? (
        <Card>
          <CardHeader className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle>สถานะการรับประกัน</CardTitle>
              <CardDescription>
                ตรวจสอบระยะเวลาคงเหลือของประกันแต่ละงาน
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาลูกค้า / งาน…"
                  className="h-8 w-48 rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20"
                />
              </div>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="h-8 w-40"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="active">อยู่ในความคุ้มครอง</option>
                <option value="expired">หมดอายุ</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <TableWrap className="rounded-none border-0">
              <Table>
                <THead>
                  <TR>
                    <TH>งาน</TH>
                    <TH>ลูกค้า</TH>
                    <TH>สถานะ</TH>
                    <TH>ครบกำหนด</TH>
                    <TH className="w-48">ระยะเวลาคงเหลือ</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((j) => {
                    const left = monthsLeft(j.warrantyEndsAt);
                    const pct = Math.min(100, (left / 12) * 100);
                    return (
                      <TR key={j.id}>
                        <TD>
                          <div className="font-medium">{j.code}</div>
                          <div className="max-w-[200px] truncate text-[0.72rem] text-muted-foreground">
                            {j.jobType}
                          </div>
                        </TD>
                        <TD className="text-[0.85rem]">
                          {getCustomer(j.customerId)?.name}
                        </TD>
                        <TD>
                          <Badge
                            tone={
                              j.warranty === "active" ? "success" : "destructive"
                            }
                          >
                            {j.warranty === "active"
                              ? "อยู่ในความคุ้มครอง"
                              : "หมดอายุ"}
                          </Badge>
                        </TD>
                        <TD className="text-[0.82rem]">
                          {j.warrantyEndsAt
                            ? formatThaiDate(j.warrantyEndsAt)
                            : "—"}
                        </TD>
                        <TD>
                          <Progress
                            value={pct}
                            tone={left <= 2 ? "warning" : "success"}
                          />
                          <div className="mt-1 text-[0.7rem] text-muted-foreground">
                            เหลืออีก {left} เดือน
                          </div>
                        </TD>
                      </TR>
                    );
                  })}
                </TBody>
              </Table>
            </TableWrap>
          </CardContent>
        </Card>
      ) : (
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              เปิดเคสแจ้งซ่อมใหม่
            </CardTitle>
            <CardDescription>
              บันทึกอาการชำรุด/ปัญหาที่พบหลังจบงาน เพื่อส่งทีมรับเหมา
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {saved && (
              <Alert tone="success" title="บันทึกเคสเรียบร้อย">
                ระบบตรวจแล้วว่ายังอยู่ในระยะประกัน — จัดเป็นเคลมงานซ่อม
                (ไม่มีค่าใช้จ่าย) และแจ้งทีมรับเหมาแล้ว
              </Alert>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>ลูกค้า</Label>
                <Select defaultValue={customers[0].id}>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>งานอ้างอิง (ในประกัน)</Label>
                <Select defaultValue={warrantyJobs[0]?.id}>
                  {warrantyJobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.code} — {j.jobType}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>ระดับความสำคัญ</Label>
                <Select defaultValue="normal">
                  <option value="low">ต่ำ</option>
                  <option value="normal">ปกติ</option>
                  <option value="high">เร่งด่วน</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>วันที่แจ้ง</Label>
                <Input type="date" defaultValue="2026-07-03" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>รายละเอียดอาการชำรุด / ปัญหา</Label>
              <Textarea
                rows={4}
                placeholder="เช่น แอร์ห้อง A-1204 ไม่เย็น มีน้ำหยดจากตัวเครื่อง…"
              />
            </div>
            <div className="space-y-1.5">
              <Label>แนบรูปภาพความเสียหาย</Label>
              <button
                type="button"
                onClick={() => setAttached(true)}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-border py-6 text-muted-foreground transition-colors hover:border-primary hover:bg-accent/40"
              >
                <UploadCloud className="size-6" />
                <span className="text-[0.82rem]">
                  {attached ? "แนบรูปแล้ว (2 ไฟล์)" : "คลิกเพื่ออัปโหลดรูป"}
                </span>
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSaved(false)}>
                ยกเลิก
              </Button>
              <Button onClick={() => setSaved(true)}>
                <Save className="size-4" />
                บันทึกเคส
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
