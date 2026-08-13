"use client";

import * as React from "react";
import { Search, Lock, Cpu, UserRound } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TableWrap,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@/components/ui/table";
import { logs, ROLE_LABEL } from "@/lib/admin";
import { formatThaiDateTime } from "@/lib/utils";

export default function AdminLogsPage() {
  const [query, setQuery] = React.useState("");
  const [role, setRole] = React.useState("all");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const rows = logs.filter((l) => {
    if (role !== "all" && l.role !== role) return false;
    if (query) {
      const hay = `${l.actor} ${l.action}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    const day = l.at.slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label>ช่วงวันที่ (จาก)</Label>
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label>ถึง</Label>
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label>บทบาท</Label>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-44"
            >
              <option value="all">ทุกบทบาท</option>
              <option value="coordinator">ผู้ประสานงาน</option>
              <option value="contractor">ทีมช่าง / ผู้รับเหมา</option>
              <option value="admin">ผู้ดูแลระบบ</option>
            </Select>
          </div>
          <div className="min-w-[200px] flex-1 space-y-1.5">
            <Label>ค้นหา (ID / ชื่อ / กิจกรรม)</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์คำค้น…"
                className="h-8 w-full rounded-lg border border-input bg-transparent pl-8 pr-3 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Read-only note */}
      <div className="flex items-center gap-2 text-[0.8rem] text-muted-foreground">
        <Lock className="size-3.5" />
        ประวัติถูกล็อกป้องกันการแก้ไข (read-only) เพื่อการตรวจสอบย้อนหลัง ·
        พบ {rows.length} รายการ
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <TableWrap className="rounded-none border-0">
            <Table>
              <THead>
                <TR>
                  <TH>เวลา</TH>
                  <TH>ผู้ทำรายการ</TH>
                  <TH>บทบาท</TH>
                  <TH>กิจกรรม</TH>
                  <TH className="text-center">ประเภท</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((l) => (
                  <TR key={l.id}>
                    <TD className="whitespace-nowrap text-[0.8rem] text-muted-foreground">
                      {formatThaiDateTime(l.at)}
                    </TD>
                    <TD className="text-[0.85rem] font-medium">{l.actor}</TD>
                    <TD>
                      <Badge tone="secondary">{ROLE_LABEL[l.role]}</Badge>
                    </TD>
                    <TD className="text-[0.85rem]">{l.action}</TD>
                    <TD className="text-center">
                      {l.auto ? (
                        <Badge tone="info">
                          <Cpu className="size-3" /> อัตโนมัติ
                        </Badge>
                      ) : (
                        <Badge tone="ghost">
                          <UserRound className="size-3" /> ผู้ใช้
                        </Badge>
                      )}
                    </TD>
                  </TR>
                ))}
                {rows.length === 0 && (
                  <TR>
                    <TD
                      colSpan={5}
                      className="py-10 text-center text-muted-foreground"
                    >
                      ไม่พบประวัติตามเงื่อนไข
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
