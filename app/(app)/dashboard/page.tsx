"use client";

import * as React from "react";
import Link from "next/link";
import {
  ClipboardList,
  Loader2,
  Wallet,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  TableWrap,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { StatusBadge, SyncBadge } from "@/components/ui/status-badge";
import { BarChart, DonutChart } from "@/components/charts/charts";
import { InteractiveAreaChart } from "@/components/charts/area-chart-interactive";
import { MiniCalendar } from "@/components/dashboard/mini-calendar";
import { jobs, customers, getCustomer, getContractor } from "@/lib/data";
import { statusCategory } from "@/lib/status";
import { formatBaht, formatThaiDate } from "@/lib/utils";

// ── Aggregates ──────────────────────────────────────────────────────────
const totalJobs = jobs.length;
const inProgress = jobs.filter(
  (j) => statusCategory(j.status) === "in_progress",
).length;
const receivable = jobs
  .filter((j) => j.status === "billing")
  .reduce((s, j) => s + j.total, 0);
const warrantyActive = jobs.filter((j) => j.warranty === "active").length;
const repairs = jobs.filter((j) => j.status === "repair").length;

const byType = Object.entries(
  jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.jobType] = (acc[j.jobType] ?? 0) + 1;
    return acc;
  }, {}),
).map(([label, value]) => ({ label, value }));
const maxType = Math.max(...byType.map((d) => d.value));
const typeData = byType.map((d) => ({ ...d, highlight: d.value === maxType }));

const donutData = [
  {
    label: "กำลังดำเนินการ",
    value: jobs.filter((j) => statusCategory(j.status) === "in_progress").length,
    color: "var(--chart-1)",
  },
  {
    label: "เสร็จสิ้นแล้ว",
    value: jobs.filter((j) => statusCategory(j.status) === "done").length,
    color: "var(--chart-4)",
  },
  {
    label: "แจ้งซ่อม",
    value: jobs.filter((j) => statusCategory(j.status) === "repair").length,
    color: "var(--chart-2)",
  },
];

const revenue = [
  { label: "ก.พ.", value: 118000 },
  { label: "มี.ค.", value: 96000 },
  { label: "เม.ย.", value: 150000 },
  { label: "พ.ค.", value: 132000 },
  { label: "มิ.ย.", value: 174000 },
  { label: "ก.ค.", value: 84500 },
];

const STATS = [
  {
    label: "งานทั้งหมด",
    value: String(totalJobs),
    icon: ClipboardList,
    delta: "+3 เดือนนี้",
    tone: "success" as const,
  },
  {
    label: "กำลังดำเนินการ",
    value: String(inProgress),
    icon: Loader2,
    delta: "ต้องติดตาม",
    tone: "warning" as const,
  },
  {
    label: "ลูกหนี้ค้างรับ",
    value: formatBaht(receivable),
    icon: Wallet,
    delta: "รอเก็บเงิน 1 งาน",
    tone: "warning" as const,
  },
  {
    label: "อยู่ในประกัน",
    value: String(warrantyActive),
    icon: ShieldCheck,
    delta: `แจ้งซ่อม ${repairs} เคส`,
    tone: "info" as const,
  },
];

// Action items derived from the pipeline
const actionItems = [
  ...jobs
    .filter((j) => j.status === "awaiting_approval")
    .map((j) => ({
      job: j,
      text: "รอลูกค้าอนุมัติใบเสนอราคา",
      tone: "warning" as const,
    })),
  ...jobs
    .filter((j) => j.status === "billing")
    .map((j) => ({ job: j, text: "วางบิลแล้ว — ติดตามเก็บเงิน", tone: "warning" as const })),
  ...jobs
    .filter((j) => j.status === "repair")
    .map((j) => ({ job: j, text: "งานแจ้งซ่อมรอจัดคิวช่าง", tone: "destructive" as const })),
  ...jobs
    .filter((j) => j.documents.some((d) => d.sync === "failed"))
    .map((j) => ({ job: j, text: "ซิงค์เอกสารไป Mango ล้มเหลว", tone: "destructive" as const })),
];

function docSync(job: (typeof jobs)[number]) {
  if (job.documents.some((d) => d.sync === "failed")) return "failed" as const;
  if (job.documents.some((d) => d.sync === "pending")) return "pending" as const;
  if (job.documents.length === 0) return "idle" as const;
  return "success" as const;
}

export default function DashboardPage() {
  const [customerFilter, setCustomerFilter] = React.useState("all");
  const [catFilter, setCatFilter] = React.useState("all");

  const filtered = jobs.filter((j) => {
    if (customerFilter !== "all" && j.customerId !== customerFilter)
      return false;
    if (catFilter !== "all" && statusCategory(j.status) !== catFilter)
      return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label}>
              <CardContent className="flex items-start justify-between">
                <div>
                  <div className="text-[0.8rem] text-muted-foreground">
                    {s.label}
                  </div>
                  <div className="mt-1 text-2xl font-bold">{s.value}</div>
                  <Badge tone={s.tone} className="mt-2">
                    {s.delta}
                  </Badge>
                </div>
                <div className="grid size-10 place-items-center rounded-lg bg-accent text-primary">
                  <Icon className="size-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>รายได้รายเดือน</CardTitle>
            <CardDescription>ยอดปิดงาน 6 เดือนล่าสุด (บาท)</CardDescription>
          </CardHeader>
          <CardContent>
            <InteractiveAreaChart data={revenue} valueFormatter={formatBaht} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>งานตามประเภท</CardTitle>
            <CardDescription>จำนวนงานแยกตามหมวดงาน</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={typeData} unit="งาน" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>สัดส่วนสถานะงาน</CardTitle>
            <CardDescription>ภาพรวมทั้งระบบ</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <DonutChart
              data={donutData}
              centerValue={String(totalJobs)}
              centerLabel="งานทั้งหมด"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Overview table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle>ตารางงานภาพรวม</CardTitle>
              <CardDescription>
                ติดตามสถานะงาน การเงิน และการส่งข้อมูล Mango
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="h-8 w-40"
              >
                <option value="all">ลูกค้าทั้งหมด</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
              <Select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="h-8 w-36"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="in_progress">กำลังดำเนินการ</option>
                <option value="done">เสร็จสิ้นแล้ว</option>
                <option value="repair">แจ้งซ่อม</option>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <TableWrap>
              <Table>
                <THead>
                  <TR>
                    <TH>งาน</TH>
                    <TH>ลูกค้า</TH>
                    <TH>สถานะ</TH>
                    <TH className="text-right">ยอดเงิน</TH>
                    <TH>ซิงค์ Mango</TH>
                  </TR>
                </THead>
                <TBody>
                  {filtered.map((j) => (
                    <TR key={j.id}>
                      <TD>
                        <Link
                          href={`/jobs/${j.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {j.code}
                        </Link>
                        <div className="max-w-[200px] truncate text-[0.75rem] text-muted-foreground">
                          {j.title}
                        </div>
                      </TD>
                      <TD className="text-[0.85rem]">
                        {getCustomer(j.customerId)?.contactName}
                      </TD>
                      <TD>
                        <StatusBadge status={j.status} />
                      </TD>
                      <TD className="text-right font-medium">
                        {j.total > 0 ? formatBaht(j.total) : "—"}
                      </TD>
                      <TD>
                        <SyncBadge state={docSync(j)} />
                      </TD>
                    </TR>
                  ))}
                  {filtered.length === 0 && (
                    <TR>
                      <TD colSpan={5} className="py-8 text-center text-muted-foreground">
                        ไม่พบงานตามเงื่อนไขที่เลือก
                      </TD>
                    </TR>
                  )}
                </TBody>
              </Table>
            </TableWrap>
          </CardContent>
        </Card>

        {/* Right column: mini calendar + action items */}
        <div className="space-y-4">
          <MiniCalendar />

          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              ต้องทำทันที
            </CardTitle>
            <CardDescription>รายการงานที่รอการดำเนินการ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {actionItems.map((a, i) => (
              <Link
                key={i}
                href={`/jobs/${a.job.id}`}
                className="flex items-start gap-2.5 rounded-lg border border-border p-2.5 transition-colors hover:bg-muted"
              >
                {a.tone === "destructive" ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                ) : (
                  <RefreshCw className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[0.82rem] font-medium">{a.text}</div>
                  <div className="text-[0.72rem] text-muted-foreground">
                    {a.job.code} · {formatThaiDate(a.job.createdAt)}
                  </div>
                </div>
                <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
