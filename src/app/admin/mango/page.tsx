"use client";

import * as React from "react";
import { Wifi, Plug, Activity, RefreshCw, Save, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { SyncBadge } from "@/components/ui/status-badge";
import { ResyncButton } from "@/components/coordinator/resync-button";
import {
  TableWrap,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { syncRecords } from "@/lib/admin";
import { formatThaiDateTime, cn } from "@/lib/utils";

export default function AdminMangoPage() {
  const [status, setStatus] = React.useState<
    "connected" | "testing" | "disconnected"
  >("connected");

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Connection settings */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="size-4 text-primary" />
            ตั้งค่าเชื่อมต่อ Mango
          </CardTitle>
          <CardDescription>Mango Web Service / REST API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>API Base URL</Label>
            <Input defaultValue="https://api.mango-erp.co.th/v2" />
          </div>
          <div className="space-y-1.5">
            <Label>API Key / Token</Label>
            <Input type="password" defaultValue="mgo_live_8f2a••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label>Webhook (สถานะการเงิน)</Label>
            <Input defaultValue="https://pms.macca/api/webhook/payment" />
          </div>

          {/* Status light */}
          <div
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3",
              status === "connected"
                ? "border-success/40 bg-success/8"
                : status === "disconnected"
                  ? "border-destructive/40 bg-destructive/8"
                  : "border-warning/40 bg-warning/8",
            )}
          >
            <span
              className={cn(
                "size-2.5 rounded-full",
                status === "connected"
                  ? "bg-success"
                  : status === "disconnected"
                    ? "bg-destructive"
                    : "bg-warning animate-pulse",
              )}
            />
            <span className="text-sm font-semibold">
              {status === "connected"
                ? "🟢 Connected"
                : status === "disconnected"
                  ? "🔴 Disconnected"
                  : "กำลังทดสอบ…"}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={status === "testing"}
              onClick={() => {
                setStatus("testing");
                setTimeout(() => setStatus("connected"), 1300);
              }}
            >
              <Wifi
                className={cn(
                  "size-4",
                  status === "testing" && "animate-pulse",
                )}
              />
              ทดสอบสถานะ
            </Button>
            <Button className="flex-1">
              <Save className="size-4" />
              บันทึก
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sync status */}
      <div className="space-y-4 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                <Activity className="size-5" />
              </div>
              <div>
                <div className="text-[0.8rem] text-muted-foreground">
                  Heartbeat (24 ชม.)
                </div>
                <div className="text-sm font-semibold text-success-foreground">
                  ปกติ · uptime 99.9%
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                <Zap className="size-5" />
              </div>
              <div>
                <div className="text-[0.8rem] text-muted-foreground">
                  Retry Mechanism
                </div>
                <div className="text-sm font-semibold">
                  ส่งซ้ำอัตโนมัติเมื่อเน็ตหลุด
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Alert tone="error" title="พบการซิงค์ล้มเหลว 1 รายการ (INV-0143)">
          กดปุ่ม “ส่งข้อมูลใหม่” ในตารางเพื่อส่งไปยัง Mango อีกครั้ง
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="size-4 text-primary" />
              สถานะการรับส่งข้อมูล
            </CardTitle>
            <CardDescription>
              ติดตามสถานะเอกสารที่ซิงค์กับ Mango
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <TableWrap className="rounded-none border-0">
              <Table>
                <THead>
                  <TR>
                    <TH>เอกสาร</TH>
                    <TH>ประเภทข้อมูล</TH>
                    <TH>เวลา</TH>
                    <TH>สถานะ</TH>
                    <TH className="text-right">จัดการ</TH>
                  </TR>
                </THead>
                <TBody>
                  {syncRecords.map((r) => (
                    <TR key={r.id}>
                      <TD className="font-medium">{r.doc}</TD>
                      <TD className="text-[0.85rem]">{r.type}</TD>
                      <TD className="whitespace-nowrap text-[0.8rem] text-muted-foreground">
                        {formatThaiDateTime(r.at)}
                      </TD>
                      <TD>
                        <SyncBadge state={r.state} />
                      </TD>
                      <TD className="text-right">
                        {r.state === "failed" ? (
                          <ResyncButton />
                        ) : (
                          <span className="text-[0.78rem] text-muted-foreground">
                            —
                          </span>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableWrap>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
