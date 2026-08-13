"use client";

import * as React from "react";
import { CheckCircle2, FileText, ImageIcon } from "lucide-react";
import {
  GuestShell,
  ActionLock,
  GuestInvalid,
} from "@/components/guest/guest-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SignaturePad } from "@/components/ui/signature-pad";
import { getJobByToken, getCustomer, getContractor } from "@/lib/data";

const STAGES = [
  { label: "ก่อนทำ", color: "from-neutral-400 to-neutral-500" },
  { label: "ขณะทำ", color: "from-amber-400 to-orange-400" },
  { label: "หลังทำ", color: "from-emerald-400 to-teal-400" },
];

export default function GuestSignoff({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = React.use(params);
  const found = getJobByToken(token);
  const [signed, setSigned] = React.useState(false);
  const [done, setDone] = React.useState(false);

  if (!found?.job) return <GuestInvalid />;
  const { job, link } = found;
  const customer = getCustomer(job.customerId);
  const contractor = getContractor(job.contractorId);

  return (
    <GuestShell title="ใบส่งมอบงาน" code={job.code} expiresAt={link.expiresAt}>
      {done ? (
        <ActionLock message="เซ็นรับมอบงานเรียบร้อย" />
      ) : (
        <div className="space-y-4">
          {/* Summary */}
          <Card>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-semibold">{job.title}</div>
                  <div className="text-[0.8rem] text-muted-foreground">
                    {customer?.name} · {customer?.room}
                  </div>
                </div>
                <Badge tone="secondary">โดย {contractor?.name}</Badge>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-border p-2.5">
                <div className="grid size-8 place-items-center rounded-lg bg-accent text-primary">
                  <FileText className="size-4" />
                </div>
                <span className="flex-1 text-[0.85rem]">
                  ใบส่งมอบงาน {job.code}.pdf
                </span>
                <Button variant="outline" size="sm">
                  เปิดดู
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Work photos */}
          <Card>
            <CardContent>
              <div className="mb-2 flex items-center gap-1.5 text-[0.85rem] font-medium">
                <ImageIcon className="size-4 text-primary" />
                รูปภาพการปฏิบัติงาน
              </div>
              <div className="grid grid-cols-3 gap-2">
                {STAGES.map((s) => (
                  <div key={s.label}>
                    <div
                      className={`grid aspect-square place-items-center rounded-xl bg-gradient-to-br ${s.color}`}
                    >
                      <ImageIcon className="size-6 text-white/80" />
                    </div>
                    <div className="mt-1 text-center text-[0.72rem] text-muted-foreground">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Signature */}
          <Card>
            <CardContent className="space-y-4">
              <SignaturePad
                onSignedChange={setSigned}
                label="เซ็นชื่อเพื่อยืนยันการรับมอบงาน"
              />
              <Button
                size="lg"
                className="w-full"
                disabled={!signed}
                onClick={() => setDone(true)}
              >
                <CheckCircle2 className="size-4" />
                ยืนยันการเซ็นรับมอบงาน
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </GuestShell>
  );
}
