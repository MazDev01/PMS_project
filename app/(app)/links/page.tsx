"use client";

import * as React from "react";
import Link from "next/link";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  Ban,
  ShieldCheck,
  Clock,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  TableWrap,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { guestLinks, jobs, getJob } from "@/lib/data";
import { formatThaiDate } from "@/lib/utils";
import type { BadgeTone } from "@/lib/status";

const KIND_META: Record<
  string,
  { label: string; route: string }
> = {
  quotation: { label: "ใบเสนอราคา", route: "quotation" },
  plan: { label: "ยืนยันวันนัด", route: "confirm" },
  delivery: { label: "ใบส่งมอบงาน", route: "signoff" },
};

const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  used: "info",
  expired: "ghost",
};
const STATUS_LABEL: Record<string, string> = {
  active: "ใช้งานได้",
  used: "ใช้แล้ว",
  expired: "หมดอายุ",
};

function CopyBtn({ url }: { url: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="คัดลอกลิงก์"
      onClick={() => {
        navigator.clipboard?.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? (
        <Check className="size-4 text-success-foreground" />
      ) : (
        <Copy className="size-4" />
      )}
    </Button>
  );
}

export default function LinksPage() {
  const [kind, setKind] = React.useState("quotation");
  const [jobId, setJobId] = React.useState(jobs[0].id);
  const [restricted, setRestricted] = React.useState(true);
  const [generated, setGenerated] = React.useState<string | null>(null);
  const [copiedNew, setCopiedNew] = React.useState(false);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://pms.macca";

  function generate() {
    const token = Math.random().toString(36).slice(2, 8);
    setGenerated(`${origin}/g/${KIND_META[kind].route}/${token}`);
    setCopiedNew(false);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Generator */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-primary" />
            สร้างลิงก์ส่งลูกค้า
          </CardTitle>
          <CardDescription>
            ลิงก์ชั่วคราวให้ลูกค้าเปิดตรวจและเซ็นออนไลน์
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>ประเภทลิงก์</Label>
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              {Object.entries(KIND_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>เลือกงาน</Label>
            <Select value={jobId} onChange={(e) => setJobId(e.target.value)}>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.code} — {j.jobType}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Clock className="size-3.5" /> ลิงก์หมดอายุ
            </Label>
            <Input type="datetime-local" defaultValue="2026-07-10T18:00" />
          </div>
          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <span className="flex items-center gap-2 text-[0.85rem]">
              <ShieldCheck className="size-4 text-primary" />
              จำกัดสิทธิ์คนเข้าถึงลิงก์
            </span>
            <Switch checked={restricted} onCheckedChange={setRestricted} />
          </label>

          <Button className="w-full" onClick={generate}>
            <Link2 className="size-4" />
            สร้างลิงก์
          </Button>

          {generated && (
            <div className="space-y-2 rounded-lg border border-primary/30 bg-accent/40 p-3">
              <div className="text-[0.75rem] font-medium text-primary">
                สร้างลิงก์เรียบร้อย
              </div>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-card px-2 py-1.5 text-[0.72rem]">
                  {generated}
                </code>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label="คัดลอก"
                  onClick={() => {
                    navigator.clipboard?.writeText(generated);
                    setCopiedNew(true);
                    setTimeout(() => setCopiedNew(false), 1500);
                  }}
                >
                  {copiedNew ? (
                    <Check className="size-4 text-success-foreground" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing links */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>ลิงก์ที่สร้างไว้</CardTitle>
          <CardDescription>จัดการและติดตามสถานะลิงก์</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <THead>
                <TR>
                  <TH>ประเภท</TH>
                  <TH>งาน</TH>
                  <TH>สิทธิ์</TH>
                  <TH>หมดอายุ</TH>
                  <TH>สถานะ</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {guestLinks.map((l) => {
                  const meta = KIND_META[l.kind];
                  const url = `/g/${meta.route}/${l.token}`;
                  return (
                    <TR key={l.id}>
                      <TD>
                        <Badge tone="secondary">{meta.label}</Badge>
                      </TD>
                      <TD className="text-[0.82rem]">
                        {getJob(l.jobId)?.code}
                      </TD>
                      <TD>
                        {l.restricted ? (
                          <span className="flex items-center gap-1 text-[0.78rem] text-muted-foreground">
                            <ShieldCheck className="size-3.5" /> จำกัด
                          </span>
                        ) : (
                          <span className="text-[0.78rem] text-muted-foreground">
                            สาธารณะ
                          </span>
                        )}
                      </TD>
                      <TD className="text-[0.8rem] text-muted-foreground">
                        {formatThaiDate(l.expiresAt)}
                      </TD>
                      <TD>
                        <Badge tone={STATUS_TONE[l.status]}>
                          {STATUS_LABEL[l.status]}
                        </Badge>
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          <CopyBtn url={`${origin}${url}`} />
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label="เปิดลิงก์"
                          >
                            <Link href={url} target="_blank">
                              <ExternalLink className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="ปิดการเข้าถึง"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={l.status === "expired"}
                          >
                            <Ban className="size-4" />
                          </Button>
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
    </div>
  );
}
