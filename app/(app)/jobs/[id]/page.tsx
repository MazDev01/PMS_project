import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  MapPin,
  CalendarClock,
  Link2,
  Wallet,
  Download,
  FileText,
  ShieldCheck,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge, SyncBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import {
  TableWrap,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { ResyncButton } from "@/components/coordinator/resync-button";
import { getJob, getCustomer, getContractor, schedule } from "@/lib/data";
import { STATUS_META } from "@/lib/status";
import { formatBaht, formatThaiDate } from "@/lib/utils";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = getJob(id);
  if (!job) notFound();
  const customer = getCustomer(job.customerId);
  const contractor = getContractor(job.contractorId);
  const entry = schedule.find(
    (s) => s.jobId === job.id && s.contractorId === job.contractorId,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon" className="mt-0.5">
            <Link href="/jobs" aria-label="กลับ">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {job.code}
              </span>
              <StatusBadge status={job.status} />
            </div>
            <h2 className="mt-0.5 text-lg font-bold">{job.title}</h2>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/links">
              <Link2 className="size-4" />
              สร้างลิงก์
            </Link>
          </Button>
          <Button asChild>
            <Link href="/closing">
              <Wallet className="size-4" />
              ไปหน้าปิดงาน
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>สถานะงาน (Job Lifecycle)</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l border-border pl-6">
                {job.timeline.map((ev, i) => {
                  const meta = STATUS_META[ev.status];
                  const current =
                    ev.done &&
                    (i === job.timeline.length - 1 || !job.timeline[i + 1].done);
                  return (
                    <li key={i} className="relative">
                      <span
                        className={`absolute -left-[27px] top-0.5 grid size-4 place-items-center rounded-full border-2 ${
                          ev.done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card"
                        }`}
                      >
                        {ev.done && <Check className="size-2.5" strokeWidth={3} />}
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-medium ${
                            ev.done ? "" : "text-muted-foreground"
                          }`}
                        >
                          {meta.label}
                        </span>
                        {current && <Badge tone="warning">ปัจจุบัน</Badge>}
                        <span className="text-[0.72rem] text-muted-foreground">
                          {formatThaiDate(ev.at)}
                        </span>
                      </div>
                      {ev.note && (
                        <p className="text-[0.75rem] text-muted-foreground">
                          {ev.note}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>

          {/* Quotation items */}
          {job.items.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>รายการใบเสนอราคา</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TableWrap className="rounded-none border-0">
                  <Table>
                    <THead>
                      <TR>
                        <TH>รายการ</TH>
                        <TH className="text-center">จำนวน</TH>
                        <TH className="text-right">ราคา/หน่วย</TH>
                        <TH className="text-center">รับประกัน</TH>
                        <TH className="text-right">รวม</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {job.items.map((it) => (
                        <TR key={it.id}>
                          <TD className="text-[0.85rem]">{it.description}</TD>
                          <TD className="text-center">{it.qty}</TD>
                          <TD className="text-right">
                            {formatBaht(it.unitPrice)}
                          </TD>
                          <TD className="text-center">
                            <Badge tone="secondary">
                              {it.warrantyMonths} เดือน
                            </Badge>
                          </TD>
                          <TD className="text-right font-medium">
                            {formatBaht(it.qty * it.unitPrice)}
                          </TD>
                        </TR>
                      ))}
                      <TR>
                        <TD colSpan={4} className="text-right font-semibold">
                          ยอดรวมทั้งสิ้น
                        </TD>
                        <TD className="text-right text-base font-bold text-primary">
                          {formatBaht(job.total)}
                        </TD>
                      </TR>
                    </TBody>
                  </Table>
                </TableWrap>
              </CardContent>
            </Card>
          )}

          {/* Documents & sync */}
          <Card>
            <CardHeader>
              <CardTitle>เอกสาร & การซิงค์ Mango</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {job.documents.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  ยังไม่มีเอกสารในงานนี้
                </p>
              )}
              {job.documents.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
                >
                  <div className="grid size-9 place-items-center rounded-lg bg-accent text-primary">
                    <FileText className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{d.label}</div>
                    <div className="text-[0.72rem] text-muted-foreground">
                      {formatThaiDate(d.date)}
                    </div>
                  </div>
                  <SyncBadge state={d.sync} />
                  {d.sync === "failed" ? (
                    <ResyncButton />
                  ) : (
                    <Button variant="ghost" size="icon" aria-label="ดาวน์โหลด">
                      <Download className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ลูกค้า</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[0.85rem]">
              <div className="font-medium">{customer?.name}</div>
              <div className="text-muted-foreground">{customer?.contactName}</div>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-muted-foreground" />
                {customer?.phone}
              </div>
              {customer?.room && (
                <Badge tone="secondary">{customer.room}</Badge>
              )}
              <div className="flex items-start gap-2 pt-1 text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                <span>{customer?.address}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ทีมงาน / ผู้รับเหมา</CardTitle>
            </CardHeader>
            <CardContent>
              {contractor ? (
                <div className="flex items-center gap-3">
                  <Avatar
                    name={contractor.name}
                    color={contractor.avatarColor}
                    size="lg"
                  />
                  <div className="text-[0.85rem]">
                    <div className="font-medium">{contractor.name}</div>
                    <div className="text-muted-foreground">
                      {contractor.skill} · {contractor.phone}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-[0.85rem] text-muted-foreground">
                  ยังไม่ได้จัดทีม —{" "}
                  <Link href="/schedule" className="text-primary">
                    ไปจัดแผนงาน
                  </Link>
                </div>
              )}
              {entry && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-[0.8rem]">
                  <CalendarClock className="size-4 text-muted-foreground" />
                  {formatThaiDate(entry.date)} · {entry.start}–{entry.end} น.
                  {entry.confirmed ? (
                    <Badge tone="success" className="ml-auto">
                      ยืนยันแล้ว
                    </Badge>
                  ) : (
                    <Badge tone="warning" className="ml-auto">
                      รอยืนยัน
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {job.warranty !== "none" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  การรับประกัน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-[0.85rem]">
                <Badge tone={job.warranty === "active" ? "success" : "destructive"}>
                  {job.warranty === "active" ? "อยู่ในประกัน" : "หมดประกัน"}
                </Badge>
                {job.warrantyEndsAt && (
                  <div className="text-muted-foreground">
                    ครบกำหนด {formatThaiDate(job.warrantyEndsAt)}
                  </div>
                )}
                {job.paidAt && (
                  <div className="text-muted-foreground">
                    เริ่มนับจากวันรับเงิน {formatThaiDate(job.paidAt)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
