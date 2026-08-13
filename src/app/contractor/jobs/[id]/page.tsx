"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  MapPin,
  Navigation,
  CalendarClock,
  User,
  Camera,
  Plus,
  CheckCircle2,
  Circle,
  MapPinCheck,
  PenLine,
  Send,
  ShieldCheck,
} from "lucide-react";
import {
  PhoneFrame,
  WhiteCard,
  GlassCard,
  CButton,
  CHeader,
} from "@/components/contractor/kit";
import { SignaturePad } from "@/components/ui/signature-pad";
import { getMyJobById } from "@/lib/contractor";
import { formatThaiDate, cn } from "@/lib/utils";

const STAGES = [
  { key: "before", label: "ก่อนทำ" },
  { key: "during", label: "ขณะทำ" },
  { key: "after", label: "หลังทำ" },
] as const;

const HOUSEKEEPING = [
  "เก็บอุปกรณ์และเครื่องมือเรียบร้อย",
  "ทำความสะอาดพื้นที่หน้างาน",
  "ตรวจสอบการทำงานของอุปกรณ์ที่ติดตั้ง",
  "ทิ้งขยะ/เศษวัสดุออกจากพื้นที่",
];

const THUMB_COLORS = [
  "from-purple-400 to-blue-400",
  "from-blue-400 to-cyan-400",
  "from-fuchsia-400 to-purple-400",
  "from-indigo-400 to-blue-400",
];

export default function ContractorJobDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const my = getMyJobById(id);
  if (!my) notFound();
  const { job, customer, entry } = my;

  const [checkedIn, setCheckedIn] = React.useState(job.status === "in_progress");
  const [photos, setPhotos] = React.useState<Record<string, number>>({
    before: 0,
    during: 0,
    after: 0,
  });
  const [checks, setChecks] = React.useState<boolean[]>(
    HOUSEKEEPING.map(() => false),
  );
  const [signed, setSigned] = React.useState(false);
  const [openSign, setOpenSign] = React.useState(false);
  const [done, setDone] = React.useState(job.status !== "in_progress" &&
    ["delivered", "paid", "closed"].includes(job.status));

  const allPhotos = STAGES.every((s) => photos[s.key] > 0);
  const allChecks = checks.every(Boolean);
  const canHandover = checkedIn && allPhotos && allChecks;

  return (
    <PhoneFrame className="pb-28">
      <CHeader
        title={job.jobType}
        subtitle={job.code}
        back="/contractor/jobs"
      />

      <div className="space-y-4 px-5 pt-2">
        {done && (
          <GlassCard className="ct-glass-strong flex items-center gap-3 p-4">
            <CheckCircle2 className="size-6 shrink-0" />
            <div>
              <div className="font-semibold">ส่งมอบงานเรียบร้อยแล้ว</div>
              <div className="text-[0.75rem] text-white/80">
                ลูกค้าเซ็นรับงานเมื่อ {formatThaiDate(entry.date)}
              </div>
            </div>
          </GlassCard>
        )}

        {/* Job info */}
        <WhiteCard className="p-4">
          <h2 className="text-base font-semibold leading-snug text-neutral-800">
            {job.title}
          </h2>
          <div className="mt-3 space-y-2 text-[0.82rem] text-neutral-600">
            <div className="flex items-center gap-2">
              <User className="size-4 text-neutral-400" />
              {customer?.name} · {customer?.contactName}
            </div>
            <div className="flex items-center gap-2">
              <CalendarClock className="size-4 text-neutral-400" />
              {formatThaiDate(entry.date)} · {entry.start}–{entry.end} น.
            </div>
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 size-4 shrink-0 text-neutral-400" />
              <span>{customer?.address}</span>
            </div>
          </div>
          <a
            href="https://maps.google.com"
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[color:var(--ct-purple)]/25 bg-[color:var(--ct-purple-soft)] py-2.5 text-[0.85rem] font-semibold text-[color:var(--ct-purple)]"
          >
            <Navigation className="size-4" />
            เปิดแผนที่นำทาง
          </a>
        </WhiteCard>

        {/* Check-in */}
        <WhiteCard className="p-4">
          <SectionTitle
            icon={<MapPinCheck className="size-4" />}
            step={1}
            title="เช็คอินหน้างาน"
          />
          {checkedIn ? (
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-emerald-50 p-3 text-emerald-700">
              <CheckCircle2 className="size-5" />
              <div className="text-[0.82rem]">
                <div className="font-semibold">เช็คอินแล้ว · 09:04 น.</div>
                <div className="text-emerald-600/80">
                  บันทึกพิกัด GPS: 13.7245, 100.5108
                </div>
              </div>
            </div>
          ) : (
            <CButton
              variant="primary"
              className="mt-3"
              onClick={() => setCheckedIn(true)}
            >
              <MapPinCheck className="size-5" />
              กดเช็คอิน (บันทึกเวลา + พิกัด)
            </CButton>
          )}
        </WhiteCard>

        {/* Photos */}
        <WhiteCard className={cn("p-4", !checkedIn && "opacity-60")}>
          <SectionTitle
            icon={<Camera className="size-4" />}
            step={2}
            title="ถ่ายรูปหลักฐาน 3 ระยะ"
          />
          <div className="mt-3 grid grid-cols-3 gap-2">
            {STAGES.map((s, si) => {
              const count = photos[s.key];
              return (
                <div key={s.key}>
                  <button
                    disabled={!checkedIn}
                    onClick={() =>
                      setPhotos((p) => ({ ...p, [s.key]: p[s.key] + 1 }))
                    }
                    className={cn(
                      "relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors",
                      count > 0
                        ? "border-transparent"
                        : "border-neutral-200 text-neutral-400 hover:border-[color:var(--ct-purple)]/40",
                      !checkedIn && "cursor-not-allowed",
                    )}
                  >
                    {count > 0 ? (
                      <>
                        <span
                          className={cn(
                            "absolute inset-0 bg-gradient-to-br",
                            THUMB_COLORS[si % THUMB_COLORS.length],
                          )}
                        />
                        <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/30 text-[0.65rem] font-bold text-white">
                          {count}
                        </span>
                        <Plus className="relative size-5 text-white/90" />
                      </>
                    ) : (
                      <Camera className="size-5" />
                    )}
                  </button>
                  <div className="mt-1 flex items-center justify-center gap-1 text-[0.7rem] text-neutral-500">
                    {count > 0 && (
                      <CheckCircle2 className="size-3 text-emerald-500" />
                    )}
                    {s.label}
                  </div>
                </div>
              );
            })}
          </div>
        </WhiteCard>

        {/* Housekeeping */}
        <WhiteCard className={cn("p-4", !checkedIn && "opacity-60")}>
          <SectionTitle
            icon={<ShieldCheck className="size-4" />}
            step={3}
            title="ตรวจความเรียบร้อยก่อนออก"
          />
          <ul className="mt-2 space-y-1">
            {HOUSEKEEPING.map((item, i) => (
              <li key={i}>
                <button
                  disabled={!checkedIn}
                  onClick={() =>
                    setChecks((c) =>
                      c.map((v, idx) => (idx === i ? !v : v)),
                    )
                  }
                  className="flex w-full items-center gap-2.5 rounded-lg py-1.5 text-left text-[0.85rem] text-neutral-700 disabled:cursor-not-allowed"
                >
                  {checks[i] ? (
                    <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="size-5 shrink-0 text-neutral-300" />
                  )}
                  <span className={checks[i] ? "text-neutral-800" : ""}>
                    {item}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </WhiteCard>

        {/* Handover / e-sign */}
        <WhiteCard className={cn("p-4", !canHandover && "opacity-60")}>
          <SectionTitle
            icon={<PenLine className="size-4" />}
            step={4}
            title="ส่งมอบงาน + เซ็นรับ"
          />

          {done ? (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-[0.85rem] font-semibold text-emerald-700">
              <CheckCircle2 className="size-5" />
              ลูกค้าเซ็นรับมอบงานเรียบร้อย
            </div>
          ) : !openSign ? (
            <>
              <p className="mt-2 text-[0.8rem] text-neutral-500">
                {canHandover
                  ? "พร้อมส่งมอบ — เปิดใบส่งมอบให้ลูกค้าเซ็นรับหน้างาน"
                  : "ต้องเช็คอิน อัปโหลดรูปครบ 3 ระยะ และตรวจความเรียบร้อยก่อน"}
              </p>
              <div className="mt-3 space-y-2">
                <CButton
                  variant="primary"
                  disabled={!canHandover}
                  onClick={() => setOpenSign(true)}
                >
                  <PenLine className="size-5" />
                  เปิดใบส่งมอบงาน
                </CButton>
                <button
                  disabled={!canHandover}
                  className="w-full rounded-2xl border border-neutral-200 py-2.5 text-[0.85rem] font-semibold text-neutral-600 disabled:opacity-50"
                >
                  ลูกค้าไม่อยู่ — ส่งให้ผู้ประสานงานออกลิงก์
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 space-y-3">
              <SignaturePad
                onSignedChange={setSigned}
                label="ให้ลูกค้าเซ็นรับมอบงานในกรอบด้านล่าง"
              />
              <CButton
                variant="primary"
                disabled={!signed}
                onClick={() => {
                  setDone(true);
                  setOpenSign(false);
                }}
              >
                <Send className="size-5" />
                ยืนยันการเซ็นรับมอบงาน
              </CButton>
            </div>
          )}
        </WhiteCard>

        <Link
          href="/contractor/jobs"
          className="block py-4 text-center text-[0.85rem] font-medium text-white/85"
        >
          ← กลับไปรายการงาน
        </Link>
      </div>
    </PhoneFrame>
  );
}

function SectionTitle({
  icon,
  step,
  title,
}: {
  icon: React.ReactNode;
  step: number;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-6 place-items-center rounded-lg bg-[color:var(--ct-purple-soft)] text-[0.72rem] font-bold text-[color:var(--ct-purple)]">
        {step}
      </span>
      <span className="text-[color:var(--ct-purple)]">{icon}</span>
      <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
    </div>
  );
}
