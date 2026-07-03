"use client";

import * as React from "react";
import { XCircle, CheckCircle2 } from "lucide-react";
import {
  GuestShell,
  ActionLock,
  GuestInvalid,
} from "@/components/guest/guest-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SignaturePad } from "@/components/ui/signature-pad";
import {
  TableWrap,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { getJobByToken, getCustomer } from "@/lib/data";
import { formatBaht } from "@/lib/utils";

export default function GuestQuotation({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = React.use(params);
  const found = getJobByToken(token);
  const [signed, setSigned] = React.useState(false);
  const [approved, setApproved] = React.useState(false);

  if (!found?.job) return <GuestInvalid />;
  const { job, link } = found;
  const customer = getCustomer(job.customerId);

  return (
    <GuestShell title="ใบเสนอราคา" code={job.code} expiresAt={link.expiresAt}>
      <div className="space-y-4">
        {approved ? (
          <ActionLock message="อนุมัติใบเสนอราคาเรียบร้อย" />
        ) : (
          <>
            {/* Document */}
            <Card>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-[0.72rem] text-muted-foreground">
                      เรียน
                    </div>
                    <div className="font-semibold">{customer?.name}</div>
                    <div className="text-[0.8rem] text-muted-foreground">
                      {customer?.contactName} · {customer?.room}
                    </div>
                  </div>
                  <Badge tone="secondary">{job.code}</Badge>
                </div>
                <div className="text-sm font-medium">{job.title}</div>

                <TableWrap>
                  <Table>
                    <THead>
                      <TR>
                        <TH>รายการ</TH>
                        <TH className="text-center">จำนวน</TH>
                        <TH className="text-right">ราคา/หน่วย</TH>
                        <TH className="text-center">ประกัน</TH>
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
                              {it.warrantyMonths} ด.
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

            {/* Signature */}
            <Card>
              <CardContent className="space-y-4">
                <SignaturePad
                  onSignedChange={setSigned}
                  label="เซ็นชื่อเพื่ออนุมัติใบเสนอราคา"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    size="lg"
                    className="flex-1"
                    disabled={!signed}
                    onClick={() => setApproved(true)}
                  >
                    <CheckCircle2 className="size-4" />
                    ยืนยันการเซ็นอนุมัติ
                  </Button>
                  <Button size="lg" variant="outline" className="flex-1">
                    <XCircle className="size-4" />
                    ปฏิเสธ / ส่งกลับเพื่อแก้ไข
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </GuestShell>
  );
}
