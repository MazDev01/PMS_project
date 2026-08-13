"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Info, User, Lock } from "lucide-react";
import { PhoneFrame, Hexagon, CButton, CInput } from "@/components/contractor/kit";

export default function ContractorLoginPage() {
  const router = useRouter();
  const [error, setError] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push("/contractor");
  }

  return (
    <PhoneFrame>
      <div className="relative flex flex-1 flex-col px-7 pb-8 pt-6">
        {/* info icon */}
        <button
          className="ml-auto grid size-9 place-items-center rounded-full bg-white/90 text-[color:var(--ct-purple)] shadow"
          aria-label="ข้อมูล"
          type="button"
        >
          <Info className="size-4" />
        </button>

        {/* brand */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <Hexagon size={58} letter="M" />
          <span className="text-4xl font-extrabold text-white">MACCA</span>
        </div>
        <p className="mt-2 text-center text-sm font-medium text-white/80">
          ทีมช่าง / ผู้รับเหมา · Service Team
        </p>

        {/* form */}
        <form onSubmit={onSubmit} className="mt-12 space-y-4">
          <CInput
            icon={<User className="size-5" />}
            placeholder="ชื่อผู้ใช้"
            defaultValue="ทีมช่างเอก"
            onChange={() => setError(false)}
            aria-label="ชื่อผู้ใช้"
          />
          <CInput
            icon={<Lock className="size-5" />}
            type="password"
            placeholder="รหัสผ่าน"
            onChange={() => setError(false)}
            aria-label="รหัสผ่าน"
          />

          <div className="flex items-center justify-between px-1">
            {error ? (
              <span className="text-[0.8rem] font-medium text-white">
                บัญชีหรือรหัสผ่านไม่ถูกต้อง
              </span>
            ) : (
              <span />
            )}
            <button
              type="button"
              className="text-[0.85rem] font-medium text-white/90 underline underline-offset-2"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>

          <div className="pt-6">
            <CButton type="submit">เข้าสู่ระบบ</CButton>
          </div>
        </form>

        {/* sign up */}
        <p className="mt-auto pt-10 text-center text-sm text-white/85">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/contractor"
            className="font-semibold underline underline-offset-2"
          >
            ติดต่อผู้ดูแลระบบ
          </Link>
        </p>
      </div>
    </PhoneFrame>
  );
}
