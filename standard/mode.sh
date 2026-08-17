#!/usr/bin/env bash
#
# สลับโหมดสำหรับการวัดผล (ดู standard/baseline.md)
#
#   bash standard/mode.sh off      ปิดมาตรฐาน  = โหมด "ก่อน"
#   bash standard/mode.sh on       เปิดมาตรฐาน = โหมด "หลัง"
#   bash standard/mode.sh status   ดูว่าตอนนี้อยู่โหมดไหน
#   bash standard/mode.sh reset    บอกวิธีล้าง tree ให้สะอาดก่อนเริ่มงานใหม่
#
# ⚠ เคยใช้ชื่อ before/after แล้วมีคนเข้าใจผิดว่า "after" = ปิดมาตรฐาน
#   (ตีความว่า "หลังปิด") แล้ววัดผลผิดทั้งชุดโดยไม่รู้ตัว
#   จึงเปลี่ยนมาใช้ off/on ซึ่งอ่านผิดไม่ได้ · ชื่อเก่ายังใช้ได้แต่จะเตือน
#
# ทำไมต้องเป็นสคริปต์ ไม่ใช่ก๊อปไฟล์:
#   สภาพ "ก่อน" คือ **ไม่มี CLAUDE.md เลย** ไม่ใช่มีไฟล์เปล่า
#   ถ้าใช้ไฟล์ stub จะไม่ใช่สภาพเดิมจริง ตัวเลขที่วัดได้ก็ไม่ใช่ของจริง

set -euo pipefail
cd "$(dirname "$0")/.."

OFF="standard/CLAUDE.md.off"

print_status() {
  echo ""
  if [[ -f CLAUDE.md ]]; then
    echo "  ┌─────────────────────────────────────────┐"
    echo "  │  เทมเพลต: 🟢 เปิดอยู่                    │"
    echo "  │  = กำลังวัดโหมด \"หลัง\" (มีมาตรฐาน)      │"
    echo "  └─────────────────────────────────────────┘"
  elif [[ -f "$OFF" ]]; then
    echo "  ┌─────────────────────────────────────────┐"
    echo "  │  เทมเพลต: ⚫ ปิดอยู่                     │"
    echo "  │  = กำลังวัดโหมด \"ก่อน\" (ไม่มีมาตรฐาน)   │"
    echo "  └─────────────────────────────────────────┘"
  else
    echo "  ✗ ไม่พบ CLAUDE.md ทั้งสองที่ — สถานะไม่ชัดเจน"
    echo "    กู้ด้วย: git checkout -- CLAUDE.md"
    exit 1
  fi
  echo ""
}

# tree ต้องสะอาดก่อนเริ่มวัด ไม่งั้นงานรอบก่อนจะปนเข้ามาในรอบนี้
#
# ⚠ ตอนอยู่โหมด off การ mv CLAUDE.md ทำให้ git status ขึ้น *สองบรรทัด*
#     D CLAUDE.md                 ← ไฟล์หายไปจากที่เดิม
#     ?? standard/CLAUDE.md.off   ← ไปโผล่ที่ใหม่
#   ทั้งคู่เป็นผลของการสลับโหมดเอง ไม่ใช่งานค้าง ต้องกรองทั้งคู่
#   (เดิมกรองแค่บรรทัดล่าง ทำให้ off เตือนตัวเองทุกครั้งแม้ tree สะอาดสนิท)
warn_if_dirty() {
  local out
  out="$(git status --porcelain 2>/dev/null)" || return 0

  if [[ -f "$OFF" ]]; then
    out="$(printf '%s\n' "$out" \
      | grep -v 'standard/CLAUDE\.md\.off' \
      | grep -vE '^[ ]?D[ ]+CLAUDE\.md$' || true)"
  fi
  out="$(printf '%s\n' "$out" | sed '/^[[:space:]]*$/d' || true)"

  local n
  n="$(printf '%s' "$out" | grep -c . || true)"
  [[ -z "$n" || "$n" == "0" ]] && return 0

  echo "  ⚠️  ยังมีไฟล์ค้างอยู่ $n รายการ — ตัวเลขที่วัดจะปนกับงานรอบก่อน"
  echo ""
  printf '%s\n' "$out" | head -8 | sed 's/^/      /'
  [[ "$n" -gt 8 ]] && echo "      ... และอีก $((n - 8))"
  echo ""
  echo "     ล้างให้สะอาดก่อน:  bash standard/mode.sh reset"
  echo ""
}

case "${1:-status}" in
  off|before)
    [[ "${1}" == "before" ]] && echo "  (หมายเหตุ: 'before' เปลี่ยนเป็น 'off' แล้ว — ทำงานเหมือนกัน)"
    if [[ -f CLAUDE.md ]]; then
      mv CLAUDE.md "$OFF"
    fi
    print_status
    echo "  ⚠ ตอนสั่งงาน ห้ามบอกให้ AI ใช้ scope.mjs หรือ gate.sh"
    echo "    ไม่งั้นได้ครึ่ง ๆ กลาง ๆ เทียบกับโหมด \"หลัง\" ไม่ได้"
    echo ""
    warn_if_dirty
    ;;
  on|after)
    [[ "${1}" == "after" ]] && echo "  (หมายเหตุ: 'after' เปลี่ยนเป็น 'on' แล้ว — ทำงานเหมือนกัน)"
    if [[ -f "$OFF" ]]; then
      mv "$OFF" CLAUDE.md
    elif [[ ! -f CLAUDE.md ]]; then
      echo "✗ หา CLAUDE.md ไม่เจอทั้งสองที่ — กู้ด้วย: git checkout -- CLAUDE.md"
      exit 1
    fi
    print_status
    warn_if_dirty
    ;;
  status)
    print_status
    warn_if_dirty
    ;;
  reset)
    echo ""
    echo "  ล้าง tree ให้สะอาดก่อนเริ่มงานวัดรอบใหม่:"
    echo ""
    echo "      git checkout -- .     # คืนไฟล์ที่แก้"
    echo "      git clean -fd         # ลบไฟล์ใหม่ที่ AI สร้าง  ← ข้อนี้คนลืมบ่อย"
    echo ""
    echo "  ⚠️  git checkout อย่างเดียวไม่พอ — ไฟล์ใหม่จะค้างอยู่"
    echo "     แล้วงานรอบถัดไปจะเริ่มจากงานครึ่ง ๆ กลาง ๆ ของรอบก่อน"
    echo ""
    echo "  ⚠️  ปิดแท็บไฟล์ในเอดิเตอร์ก่อนล้าง"
    echo "     ถ้ายังเปิดค้างไว้ auto-save จะเขียนทับของที่ git เพิ่งคืนมา"
    echo "     แล้วไฟล์จะ 'เด้งกลับ' เองภายในไม่กี่วินาที ล้างกี่รอบก็ไม่หาย"
    echo ""
    echo "  ผมไม่รันให้เอง เพราะเป็นการลบงาน — ตรวจก่อนว่าไม่มีของที่อยากเก็บ"
    echo ""
    ;;
  *)
    echo "ใช้: bash standard/mode.sh [off|on|status|reset]"
    exit 2
    ;;
esac
