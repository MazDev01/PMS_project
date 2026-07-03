"use client";

import * as React from "react";
import {
  Wallet,
  CheckCircle2,
  FileText,
  CalendarCheck,
  Clock,
  Lock,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import { jobs, getCustomer } from "@/lib/data";
import { formatBaht, formatThaiDate, cn } from "@/lib/utils";

const closable = jobs.filter((j) =>
  ["billing", "paid", "closed"].includes(j.status),
);

export default function ClosingPage() {
  const [selectedId, setSelectedId] = React.useState(
    closable.find((j) => j.status === "paid")?.id ?? closable[0].id,
  );
  const [closed, setClosed] = React.useState(false);
  const job = jobs.find((j) => j.id === selectedId)!;
  const isPaid = job.status === "paid" || job.status === "closed";
  const isClosed = job.status === "closed" || closed;

  React.useEffect(() => setClosed(false), [selectedId]);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Job list */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>งานที่รอปิด</CardTitle>
          <CardDescription>วางบิล / รับเงิน / ปิดงาน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {closable.map((j) => (
            <button
              key={j.id}
              onClick={() => setSelectedId(j.id)}
              className={cn(
                "w-full rounded-lg border p-3 text-left transition-colors",
                j.id === selectedId
                  ? "border-primary bg-accent/40"
                  : "border-border hover:bg-muted",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.82rem] font-medium">{j.code}</span>
                <StatusBadge status={j.status} />
              </div>
              <div className="mt-0.5 truncate text-[0.75rem] text-muted-foreground">
                {getCustomer(j.customerId)?.name}
              </div>
              <div className="mt-1 text-sm font-semibold text-primary">
                {formatBaht(j.total)}
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Detail */}
      <div className="space-y-4 lg:col-span-2">
        {isClosed && (
          <Alert tone="success" title="ปิดงานเรียบร้อยแล้ว">
            รวมเอกสารและส่งเข้า Mango อัตโนมัติแล้ว · บันทึกวันปิดงาน{" "}
            {formatThaiDate("2026-07-03")}
          </Alert>
        )}

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="size-4 text-primary" />
              สถานะการเงิน
              <Badge tone="ghost" className="ml-1">
                <RefreshCw className="size-3" /> ซิงค์จาก Mango
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-muted p-3">
                <div className="text-[0.72rem] text-muted-foreground">
                  ยอดชำระ
                </div>
                <div className="mt-1 text-xl font-bold">
                  {formatBaht(job.total)}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-[0.72rem] text-muted-foreground">
                  สถานะการชำระ
                </div>
                <div className="mt-1.5">
                  {isPaid ? (
                    <Badge tone="success">
                      <CheckCircle2 className="size-3" /> จ่ายเงินแล้ว
                    </Badge>
                  ) : (
                    <Badge tone="warning">
                      <Clock className="size-3" /> รอเก็บเงิน
                    </Badge>
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <div className="text-[0.72rem] text-muted-foreground">
                  วันที่รับเงิน
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                  <CalendarCheck className="size-4 text-muted-foreground" />
                  {job.paidAt ? formatThaiDate(job.paidAt) : "—"}
                </div>
              </div>
            </div>
            {!isPaid && (
              <p className="mt-3 text-[0.8rem] text-warning-foreground">
                ยังไม่ได้รับเงิน — ระบบจะอัปเดตอัตโนมัติผ่าน Webhook
                เมื่อลูกค้าชำระเงินใน Mango
              </p>
            )}
          </CardContent>
        </Card>

        {/* Documents bundle */}
        <Card>
          <CardHeader>
            <CardTitle>ชุดเอกสารปิดงาน</CardTitle>
            <CardDescription>
              รวมใบเสนอราคา ใบส่งมอบ และใบสั่งจ้าง ก่อนส่งเข้า Mango
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {job.documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 rounded-lg border border-border p-2.5"
              >
                <div className="grid size-8 place-items-center rounded-lg bg-accent text-primary">
                  <FileText className="size-4" />
                </div>
                <span className="flex-1 text-[0.85rem]">{d.label}</span>
                <CheckCircle2 className="size-4 text-success-foreground" />
              </div>
            ))}
            {job.documents.length === 0 && (
              <p className="py-2 text-center text-[0.82rem] text-muted-foreground">
                ยังไม่มีเอกสาร
              </p>
            )}
          </CardContent>
        </Card>

        {/* Confirm close */}
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-semibold">ยืนยันการปิดงาน</div>
              <div className="text-[0.8rem] text-muted-foreground">
                {isPaid
                  ? "รวมเอกสารและส่งเข้า Mango อัตโนมัติ พร้อมเริ่มนับประกัน"
                  : "ต้องได้รับเงินก่อนจึงจะปิดงานได้"}
              </div>
            </div>
            <Button
              size="lg"
              disabled={!isPaid || isClosed}
              onClick={() => setClosed(true)}
            >
              <Lock className="size-4" />
              {isClosed ? "ปิดงานแล้ว" : "Confirm ปิดงาน"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
