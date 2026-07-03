"use client";

import * as React from "react";
import {
  CalendarClock,
  MapPin,
  Users,
  CheckCircle2,
  CalendarX,
} from "lucide-react";
import {
  GuestShell,
  ActionLock,
  GuestInvalid,
} from "@/components/guest/guest-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getJobByToken,
  getCustomer,
  getContractor,
  schedule,
} from "@/lib/data";
import { formatThaiDate } from "@/lib/utils";

export default function GuestConfirm({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = React.use(params);
  const found = getJobByToken(token);
  const [confirmed, setConfirmed] = React.useState(false);
  const [reschedule, setReschedule] = React.useState(false);

  if (!found?.job) return <GuestInvalid />;
  const { job, link } = found;
  const customer = getCustomer(job.customerId);
  const entry = schedule.find((s) => s.jobId === job.id);
  const contractor = getContractor(entry?.contractorId ?? job.contractorId);

  return (
    <GuestShell
      title="ยืนยันวันนัดหมาย"
      code={job.code}
      expiresAt={link.expiresAt}
    >
      {confirmed ? (
        <ActionLock message="ยืนยันวันนัดหมายเรียบร้อย" />
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm font-medium">{job.title}</div>
              <div className="space-y-2.5 text-[0.85rem]">
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-accent text-primary">
                    <CalendarClock className="size-4" />
                  </span>
                  <div>
                    <div className="font-medium">
                      {entry ? formatThaiDate(entry.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "-"}
                    </div>
                    <div className="text-muted-foreground">
                      เวลา {entry?.start}–{entry?.end} น.
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 place-items-center rounded-lg bg-accent text-primary">
                    <Users className="size-4" />
                  </span>
                  <div>
                    <div className="font-medium">{contractor?.name}</div>
                    <div className="text-muted-foreground">
                      {contractor?.skill}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent text-primary">
                    <MapPin className="size-4" />
                  </span>
                  <div className="text-muted-foreground">
                    {customer?.address}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {reschedule && (
            <Card>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label>เลือกวันใหม่ที่สะดวก</Label>
                  <Input type="date" defaultValue="2026-07-05" />
                </div>
                <div className="space-y-1.5">
                  <Label>หมายเหตุถึงทีมงาน</Label>
                  <Textarea rows={3} placeholder="เช่น สะดวกช่วงบ่าย…" />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              size="lg"
              className="flex-1"
              onClick={() => setConfirmed(true)}
            >
              <CheckCircle2 className="size-4" />
              ยืนยันวันนัดหมาย
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => setReschedule((v) => !v)}
            >
              <CalendarX className="size-4" />
              ขอเลื่อนนัด / เลือกวันใหม่
            </Button>
          </div>
        </div>
      )}
    </GuestShell>
  );
}
