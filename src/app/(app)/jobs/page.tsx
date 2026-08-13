"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import {
  TableWrap,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Avatar } from "@/components/ui/avatar";
import { jobs, getCustomer, getContractor } from "@/lib/data";
import { statusCategory, CATEGORY_LABEL } from "@/lib/status";
import type { JobCategory } from "@/lib/types";
import { formatBaht, formatThaiDate } from "@/lib/utils";

const CATS: JobCategory[] = ["all", "in_progress", "done", "repair"];

export default function JobsPage() {
  const [cat, setCat] = React.useState<JobCategory>("all");
  const [query, setQuery] = React.useState("");

  const filtered = jobs.filter((j) => {
    if (cat !== "all" && statusCategory(j.status) !== cat) return false;
    if (query) {
      const hay = `${j.code} ${j.title} ${getCustomer(j.customerId)?.name}`;
      if (!hay.toLowerCase().includes(query.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          value={cat}
          onValueChange={(v) => setCat(v as JobCategory)}
          items={CATS.map((c) => ({
            value: c,
            label: `${CATEGORY_LABEL[c]}${
              c === "all"
                ? ` (${jobs.length})`
                : ` (${jobs.filter((j) => statusCategory(j.status) === c).length})`
            }`,
          }))}
        />
        <Button asChild>
          <Link href="/jobs/new">
            <Plus className="size-4" />
            เปิดงานใหม่
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาด้วยเลขงาน / ชื่องาน / ลูกค้า…"
          className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-ring focus:ring-[3px] focus:ring-ring/20"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <THead>
                <TR>
                  <TH>เลขงาน / รายละเอียด</TH>
                  <TH>ลูกค้า</TH>
                  <TH>ประเภท</TH>
                  <TH>ทีมงาน</TH>
                  <TH>สถานะ</TH>
                  <TH className="text-right">ยอดเงิน</TH>
                  <TH>เปิดงาน</TH>
                  <TH className="text-right">จัดการ</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((j) => {
                  const contractor = getContractor(j.contractorId);
                  return (
                    <TR key={j.id}>
                      <TD>
                        <Link
                          href={`/jobs/${j.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {j.code}
                        </Link>
                        <div className="max-w-[240px] truncate text-[0.75rem] text-muted-foreground">
                          {j.title}
                        </div>
                      </TD>
                      <TD className="text-[0.85rem]">
                        {getCustomer(j.customerId)?.name}
                      </TD>
                      <TD className="text-[0.85rem]">{j.jobType}</TD>
                      <TD>
                        {contractor ? (
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={contractor.name}
                              size="sm"
                              color={contractor.avatarColor}
                            />
                            <span className="text-[0.8rem]">
                              {contractor.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[0.8rem] text-muted-foreground">
                            ยังไม่จัดทีม
                          </span>
                        )}
                      </TD>
                      <TD>
                        <StatusBadge status={j.status} />
                      </TD>
                      <TD className="text-right font-medium">
                        {j.total > 0 ? formatBaht(j.total) : "—"}
                      </TD>
                      <TD className="text-[0.8rem] text-muted-foreground">
                        {formatThaiDate(j.createdAt)}
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/jobs/${j.id}`} aria-label="ดู">
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="แก้ไข">
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="ลบ"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
                {filtered.length === 0 && (
                  <TR>
                    <TD
                      colSpan={8}
                      className="py-10 text-center text-muted-foreground"
                    >
                      ไม่พบงานตามเงื่อนไข
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </TableWrap>
        </CardContent>
      </Card>
    </div>
  );
}
