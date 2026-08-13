#!/usr/bin/env bash
#
# gate — คำสั่งเดียวที่ทุกโปรเจกต์ในทีมใช้ชื่อเหมือนกัน
#   exit 0 = ผ่าน · ไม่ใช่ 0 = ไม่ผ่าน
#
# สองชั้น แบ่งตามเกณฑ์ "ออฟไลน์ได้ + ไม่ต้องใช้ secret"
#   ./gate.sh          ชั้นเร็ว  — pre-push เรียกอันนี้
#   ./gate.sh --full   ชั้นเต็ม  — CI เรียกอันนี้
#
# ตัวเลขที่วัดจริงบน pms-app (2026-08-13):
#   ./gate.sh    12-16 วิ (tsc รายงานเอง 7.3 · ที่เหลือคือ node/bash startup) → pre-push
#   lint ratchet ~57 วิ                                                      → CI
#   next build   ~110 วิ                                                     → CI
#   render smoke ยิงใส่ production build                                      → CI
#
# กติกาเรื่องเวลาผูกกับ *ความถี่* ไม่ใช่ตัวเลขตายตัว:
#   ยิ่งรันบ่อย งบยิ่งต้องแคบ เพราะความน่ารำคาญคือสิ่งเดียวที่ทำให้คนกด --no-verify
#   pre-commit (วันละหลายสิบครั้ง) → งบ ~15 วิ
#   pre-push   (วันละไม่กี่ครั้ง)   → 15-20 วิรับได้
# เกินงบของชั้นนั้นเมื่อไหร่ ให้ย้ายของออก ห้ามขอให้คนอดทน

set -euo pipefail
cd "$(dirname "$0")"

FULL=0
[[ "${1:-}" == "--full" ]] && FULL=1

fail() { echo ""; echo "✗ gate ไม่ผ่าน: $1"; exit 1; }

start=$(date +%s)

# เรียก binary ตรง ๆ ไม่ผ่าน npx — npx กิน overhead 3-6 วิ ซึ่งเยอะเมื่องบมีแค่ 15 วิ
echo "→ tsc --noEmit"
node node_modules/typescript/bin/tsc --noEmit || fail "type ไม่ผ่าน"

if [[ $FULL -eq 1 ]]; then
  echo "→ lint ratchet"
  node scripts/ratchet.mjs || fail "lint แย่ลงกว่าเลขฐาน"

  echo "→ next build"
  node node_modules/next/dist/bin/next build || fail "build ไม่ผ่าน"

  # --prod บังคับให้ smoke ยิงใส่ next start = ตัวที่เพิ่ง build
  # ถ้าไม่ใส่ smoke จะเปิด next dev ขึ้นมาเอง แล้ว build ที่เพิ่งทำก็ถูกโยนทิ้ง
  # = CI เขียวโดยไม่เคยทดสอบของที่จะ deploy จริง
  echo "→ render smoke (ยิงใส่ production build)"
  node scripts/smoke.mjs --prod || fail "หน้าเว็บไม่เรนเดอร์"

  # ยังทำไม่ได้ — รอมี DB (ดู standard/v1.md หัวข้อ 'ครึ่งที่ยังขาด')
  #   → supabase gen types + git diff --exit-code   (type drift)
  #   → node scripts/rls-smoke.mjs                  (anon key + JWT ของ test user)
fi

echo ""
echo "✓ gate ผ่าน ($(( $(date +%s) - start )) วิ)"
