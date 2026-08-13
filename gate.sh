#!/usr/bin/env bash
#
# gate — คำสั่งเดียวที่ทุกโปรเจกต์ในทีมใช้ชื่อเหมือนกัน
#   exit 0 = ผ่าน · ไม่ใช่ 0 = ไม่ผ่าน
#
#   ./gate.sh          ชั้นเร็ว
#   ./gate.sh --full   ชั้นเต็ม — CI และ pre-push เรียกอันนี้
#
# ─── ตัวเลขที่วัดจริงบนโปรเจกต์นี้ (2026-08-13) ────────────────────
#   next build     205 วิ
#   render smoke   วัดแล้วดู standard/v1-track-a.md
#
# ─── ทำไมชั้นเร็วถึงว่างเปล่า ──────────────────────────────────────
#   โปรเจกต์นี้เป็น JavaScript ล้วน ไม่มี TypeScript และไม่มี eslint
#   จึงไม่มีเครื่องมือใดที่ตรวจได้เร็วพอสำหรับ pre-commit (งบ ~15 วิ)
#
#   ชั้นเร็วจึง "ไม่มีอะไรให้ตรวจ" ซึ่งเราประกาศออกมาตรง ๆ
#   ไม่ทำเป็น exit 0 เงียบ ๆ เพราะนั่นคือ gate ที่โกหกว่าตรวจแล้ว
#
#   วิธีทำให้มีชั้นเร็วจริง (ยังไม่ได้ทำ รอตัดสินใจ):
#     npm i -D eslint eslint-config-next   แล้วเพิ่ม eslint เข้ามาในบล็อกข้างล่าง

set -euo pipefail
cd "$(dirname "$0")"

FULL=0
[[ "${1:-}" == "--full" ]] && FULL=1

fail() { echo ""; echo "✗ gate ไม่ผ่าน: $1"; exit 1; }

start=$(date +%s)

if [[ $FULL -eq 0 ]]; then
  echo "⚠ ชั้นเร็ว: โปรเจกต์นี้ยังไม่มีเครื่องมือตรวจที่เร็วพอ (ไม่มี TypeScript / ไม่มี eslint)"
  echo "  ไม่ได้ตรวจอะไรเลย — ใช้ ./gate.sh --full ก่อน push"
  exit 0
fi

# เรียก binary ตรง ๆ ไม่ผ่าน npx — npx กิน overhead หลายวินาที
echo "→ next build"
node node_modules/next/dist/bin/next build || fail "build ไม่ผ่าน"

# --prod บังคับให้ smoke ยิงใส่ next start = ตัวที่เพิ่ง build
# ถ้าไม่ใส่ smoke จะเปิด next dev ขึ้นมาเอง แล้ว build ที่เพิ่งทำก็ถูกโยนทิ้ง
# = gate เขียวโดยไม่เคยทดสอบของที่จะ deploy จริง
echo "→ render smoke (ยิงใส่ production build)"
node scripts/smoke.mjs --prod || fail "หน้าเว็บไม่เรนเดอร์"

echo ""
echo "✓ gate ผ่าน ($(( $(date +%s) - start )) วิ)"
