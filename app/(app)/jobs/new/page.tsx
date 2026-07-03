"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UploadCloud, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { customers } from "@/lib/data";

const JOB_TYPES = [
  "ติดตั้งแอร์",
  "ล้างแอร์",
  "งานระบบไฟฟ้า",
  "งานประปา",
  "งานทั่วไป",
  "เคลมงานซ่อม",
];

export default function NewJobPage() {
  const router = useRouter();
  const [uploaded, setUploaded] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => router.push("/jobs"), 900);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/jobs" aria-label="กลับ">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-lg font-bold">เปิดงานใหม่</h2>
          <p className="text-[0.8rem] text-muted-foreground">
            บันทึกข้อมูลลูกค้าและรายละเอียดงานเพื่อเริ่มต้นในระบบ
          </p>
        </div>
      </div>

      {saved && (
        <Alert tone="success" title="เปิดงานเรียบร้อย">
          กำลังพากลับไปยังรายการงาน…
        </Alert>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Customer */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลลูกค้า</CardTitle>
            <CardDescription>เลือกลูกค้าเดิม หรือกรอกข้อมูลใหม่</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>ลูกค้า</Label>
              <Select defaultValue={customers[0].id}>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="new">+ เพิ่มลูกค้าใหม่…</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>ผู้ติดต่อ</Label>
              <Input defaultValue={customers[0].contactName} />
            </div>
            <div className="space-y-1.5">
              <Label>เบอร์โทร</Label>
              <Input defaultValue={customers[0].phone} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>หมายเลขห้อง / จุดที่รับงาน</Label>
              <Input placeholder="เช่น ห้อง A-1204" defaultValue="ห้อง A-1204" />
            </div>
          </CardContent>
        </Card>

        {/* Job details */}
        <Card>
          <CardHeader>
            <CardTitle>รายละเอียดงาน</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>ประเภทงาน</Label>
              <Select defaultValue={JOB_TYPES[0]}>
                {JOB_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>วันที่รับงาน</Label>
              <Input type="date" defaultValue="2026-07-03" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>ชื่องาน</Label>
              <Input placeholder="เช่น ติดตั้งแอร์ใหม่ 4 เครื่อง ห้อง A-1204" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>รายละเอียด / ปัญหาที่แจ้ง</Label>
              <Textarea rows={4} placeholder="อธิบายความต้องการหรืออาการที่ลูกค้าแจ้ง…" />
            </div>
          </CardContent>
        </Card>

        {/* Attachment */}
        <Card>
          <CardHeader>
            <CardTitle>เอกสารแนบ (PO / ใบเซ็นเสนอราคา)</CardTitle>
            <CardDescription>
              สำรองไว้กรณีต้องการไฟล์แบบ manual — ระบบจะซิงค์กับ Mango อัตโนมัติ
            </CardDescription>
          </CardHeader>
          <CardContent>
            <button
              type="button"
              onClick={() => setUploaded(true)}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground transition-colors hover:border-primary hover:bg-accent/40 cursor-pointer"
            >
              {uploaded ? (
                <>
                  <div className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-primary">
                    <FileText className="size-4" />
                    PO-8842.pdf
                    <Check className="size-4" />
                  </div>
                  <span className="text-[0.8rem]">แนบไฟล์เรียบร้อย — คลิกเพื่อเปลี่ยน</span>
                </>
              ) : (
                <>
                  <UploadCloud className="size-7" />
                  <span className="text-sm font-medium">
                    คลิกเพื่ออัปโหลดไฟล์ PO / ใบเสนอราคา
                  </span>
                  <span className="text-[0.75rem]">รองรับ PDF, PNG, JPG</span>
                </>
              )}
            </button>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button asChild variant="outline">
            <Link href="/jobs">ยกเลิก</Link>
          </Button>
          <Button type="submit">เปิดงาน</Button>
        </div>
      </form>
    </div>
  );
}
