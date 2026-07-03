"use client";

import * as React from "react";
import { Plus, Lock, PackageCheck, CalendarPlus, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { schedule, contractors, getJob } from "@/lib/data";
import { formatThaiDate, cn } from "@/lib/utils";

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const YEAR = 2026;
const MONTH = 6; // July
const TODAY_DAY = 3;

export default function SchedulePage() {
  const [team, setTeam] = React.useState("all");
  const [dialogDay, setDialogDay] = React.useState<number | null>(null);
  const [materialsReady, setMaterialsReady] = React.useState(false);

  const entries = schedule.filter((s) => {
    const [y, mo] = s.date.split("-").map(Number);
    if (y !== YEAR || mo - 1 !== MONTH) return false;
    if (team !== "all" && s.contractorId !== team) return false;
    return true;
  });

  const byDay = new Map<number, typeof entries>();
  for (const e of entries) {
    const d = Number(e.date.slice(8, 10));
    byDay.set(d, [...(byDay.get(d) ?? []), e]);
  }

  const firstWeekday = new Date(YEAR, MONTH, 1).getDay();
  const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const pending = entries.filter((e) => !e.confirmed);
  const confirmed = entries.filter((e) => e.confirmed);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Label className="text-muted-foreground">คิวของทีม:</Label>
          <Select
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            className="h-8 w-52"
          >
            <option value="all">ทุกทีม / ผู้รับเหมา</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => setDialogDay(TODAY_DAY)}>
          <Plus className="size-4" />
          วางแผนงานใหม่
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>ปฏิทินงาน — กรกฎาคม 2569</CardTitle>
            <CardDescription>คลิกวันเพื่อวางแผนงานใหม่ให้ทีม</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[0.72rem] font-medium text-muted-foreground">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const dayEntries = byDay.get(day) ?? [];
                const isToday = day === TODAY_DAY;
                return (
                  <button
                    key={i}
                    onClick={() => setDialogDay(day)}
                    className={cn(
                      "flex min-h-[68px] flex-col rounded-lg border p-1 text-left transition-colors hover:border-primary hover:bg-accent/40",
                      isToday ? "border-primary bg-accent/40" : "border-border",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[0.72rem]",
                        isToday
                          ? "font-bold text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      {day}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayEntries.slice(0, 2).map((e) => {
                        const c = contractors.find(
                          (ct) => ct.id === e.contractorId,
                        );
                        return (
                          <div
                            key={e.id}
                            className="truncate rounded px-1 py-0.5 text-[0.6rem] font-medium text-white"
                            style={{ background: c?.avatarColor }}
                            title={getJob(e.jobId)?.title}
                          >
                            {e.start} {getJob(e.jobId)?.jobType}
                          </div>
                        );
                      })}
                      {dayEntries.length > 2 && (
                        <div className="text-[0.6rem] text-muted-foreground">
                          +{dayEntries.length - 2}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Confirmation lists */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                รอลูกค้ายืนยัน
                <Badge tone="warning">{pending.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending.length === 0 && (
                <p className="text-[0.8rem] text-muted-foreground">
                  ไม่มีคิวที่รอยืนยัน
                </p>
              )}
              {pending.map((e) => {
                const job = getJob(e.jobId);
                const c = contractors.find((ct) => ct.id === e.contractorId);
                return (
                  <div
                    key={e.id}
                    className="rounded-lg border border-border p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar name={c!.name} size="sm" color={c!.avatarColor} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[0.82rem] font-medium">
                          {job?.jobType}
                        </div>
                        <div className="text-[0.7rem] text-muted-foreground">
                          {formatThaiDate(e.date, {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          · {e.start}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      <Lock className="size-3.5" />
                      ล็อคคิวงาน
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                ยืนยันแล้ว
                <Badge tone="success">{confirmed.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {confirmed.map((e) => {
                const job = getJob(e.jobId);
                const c = contractors.find((ct) => ct.id === e.contractorId);
                return (
                  <div
                    key={e.id}
                    className="flex items-center gap-2 rounded-lg border border-border p-2.5"
                  >
                    <Avatar name={c!.name} size="sm" color={c!.avatarColor} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.82rem] font-medium">
                        {job?.jobType}
                      </div>
                      <div className="text-[0.7rem] text-muted-foreground">
                        {formatThaiDate(e.date, {
                          day: "numeric",
                          month: "short",
                        })}{" "}
                        · {e.start}
                      </div>
                    </div>
                    <Badge tone="success">
                      <Lock className="size-3" />
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* New plan dialog */}
      <Dialog
        open={dialogDay !== null}
        onClose={() => setDialogDay(null)}
        title="วางแผนงานใหม่"
        description={
          dialogDay !== null
            ? formatThaiDate(`2026-07-${String(dialogDay).padStart(2, "0")}`)
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setDialogDay(null)}>
              ยกเลิก
            </Button>
            <Button disabled={!materialsReady} onClick={() => setDialogDay(null)}>
              <Lock className="size-4" />
              ล็อคคิวงาน
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>เลือกงาน</Label>
            <Select defaultValue="j1">
              {schedule.map((s) => (
                <option key={s.id} value={s.jobId}>
                  {getJob(s.jobId)?.code} — {getJob(s.jobId)?.jobType}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>มอบหมายทีม</Label>
            <Select defaultValue="t1">
              {contractors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.skill})
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Clock className="size-3.5" /> เวลาเริ่ม
              </Label>
              <Input type="time" defaultValue="09:00" />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1">
                <Clock className="size-3.5" /> เวลาสิ้นสุด
              </Label>
              <Input type="time" defaultValue="16:00" />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border p-3">
            <Checkbox
              checked={materialsReady}
              onCheckedChange={setMaterialsReady}
            />
            <PackageCheck className="size-4 text-primary" />
            <span className="text-[0.85rem]">
              ตรวจสอบแล้วว่า <b>วัสดุพร้อม</b> ก่อนวางคิวช่าง
            </span>
          </label>
          {!materialsReady && (
            <p className="flex items-center gap-1.5 text-[0.78rem] text-warning-foreground">
              <CalendarPlus className="size-3.5" />
              ต้องยืนยันวัสดุพร้อมก่อนจึงจะล็อคคิวได้
            </p>
          )}
        </div>
      </Dialog>
    </div>
  );
}
