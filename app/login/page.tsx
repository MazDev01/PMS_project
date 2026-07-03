"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = React.useState("coordinator");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [error, setError] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Demo rule: correct password is "macca" — anything else shows the error line.
    if (username.trim() === "coordinator" && password === "macca") {
      router.push("/dashboard");
    } else {
      setError(true);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="grid size-9 place-items-center rounded-lg bg-primary-foreground text-primary text-lg font-bold leading-none">
            M
          </div>
          <span className="font-bold">MACCA Light Engineering</span>
        </div>
        <div>
          <h2 className="text-3xl font-extrabold leading-tight">
            Project
            <br />
            Management System
          </h2>
          <p className="mt-3 max-w-sm text-sm text-primary-foreground/80">
            ระบบบริหารงานบริการแบบครบวงจร — รับงาน เสนอราคา จัดคิว ปฏิบัติงาน
            ส่งมอบ เก็บเงิน และรับประกัน ในที่เดียว
          </p>
        </div>
        <p className="text-[0.8rem] text-primary-foreground/70">
          © 2569 MACCA Light Engineering Co., Ltd.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground text-lg font-bold leading-none">
              M
            </div>
            <span className="font-bold">MACCA PMS</span>
          </div>

          <h1 className="text-2xl font-bold">เข้าสู่ระบบ</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            สำหรับผู้ประสานงาน (Coordinator)
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">ชื่อผู้ใช้</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(false);
                }}
                aria-invalid={error}
                placeholder="กรอกชื่อผู้ใช้"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                  }}
                  aria-invalid={error}
                  placeholder="••••••••"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="แสดง/ซ่อนรหัสผ่าน"
                >
                  {showPw ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[0.8rem] font-medium text-destructive">
                บัญชีหรือรหัสผ่านไม่ถูกต้อง
              </p>
            )}

            <Button type="submit" size="lg" className="w-full">
              <LogIn className="size-4" />
              เข้าสู่ระบบ
            </Button>
          </form>

          <div className="mt-4 rounded-lg border border-border bg-muted px-3 py-2 text-[0.75rem] text-muted-foreground">
            <span className="font-medium text-foreground">ทดลองระบบ:</span>{" "}
            ผู้ใช้ <code className="text-primary">coordinator</code> · รหัสผ่าน{" "}
            <code className="text-primary">macca</code>
          </div>

          <p className="mt-4 text-center text-[0.8rem] text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              ← กลับหน้าหลัก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
