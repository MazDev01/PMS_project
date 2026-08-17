#!/usr/bin/env bash
#
# สลับโหมดสำหรับการวัดผล (ดู standard/baseline.md)
#
#   bash standard/mode.sh clean     ปิดทั้งกฎและเครื่องมือ = "ไม่มีมาตรฐานเลย"
#   bash standard/mode.sh off       ปิดเฉพาะกฎ เครื่องมือยังอยู่
#   bash standard/mode.sh restore   คืนทุกอย่าง = เปิดมาตรฐานเต็ม
#   bash standard/mode.sh status    ดูว่าตอนนี้อยู่โหมดไหน
#   bash standard/mode.sh reset     บอกวิธีล้าง tree ให้สะอาดก่อนเริ่มงานใหม่
#
# สามโหมด ไม่ใช่สอง — เพราะการวัดรอบแรกสับสนตรงนี้:
#
#   clean    ซ่อน CLAUDE.md + gate.sh + scripts/*  → AI ไม่มีทั้งกฎและเครื่องมือ
#   off      ซ่อนแค่ CLAUDE.md                      → AI ไม่มีกฎ แต่ยังหาเครื่องมือเจอเอง
#   restore  คืนหมด                                 → มาตรฐานเต็ม
#
#   รอบแรกวัดด้วย off แล้วเรียกมันว่า "ไม่มีมาตรฐาน" ซึ่งไม่จริง
#   AI หา scope.mjs กับ gate.sh เจอเองแล้วเรียกใช้ ทั้งที่ไม่มีใครบอก
#   ถ้าจะเทียบกับ "ไม่มีมาตรฐานเลย" ต้องใช้ clean
#
# ⚠ เคยใช้ชื่อ before/after แล้วมีคนเข้าใจผิดว่า "after" = ปิดมาตรฐาน
#   (ตีความว่า "หลังปิด") แล้ววัดผลผิดทั้งชุดโดยไม่รู้ตัว
#   ชื่อเก่ายังใช้ได้แต่จะเตือน · on = restore
#
# ทำไมต้องเป็นสคริปต์ ไม่ใช่ก๊อปไฟล์:
#   สภาพ "ก่อน" คือ **ไม่มีไฟล์เลย** ไม่ใช่มีไฟล์เปล่า
#   ถ้าใช้ไฟล์ stub จะไม่ใช่สภาพเดิมจริง ตัวเลขที่วัดได้ก็ไม่ใช่ของจริง

set -euo pipefail
cd "$(dirname "$0")/.."

OFFDIR="standard/.mode-off"
OFF_LEGACY="standard/CLAUDE.md.off"   # ที่ซ่อนของเวอร์ชันก่อน ยังคืนให้ได้

# ไฟล์ที่ถือว่าเป็น "มาตรฐาน" ทั้งหมด — clean ซ่อนทั้งหมดนี้
ALL=(CLAUDE.md gate.sh scripts/scope.mjs scripts/ratchet.mjs scripts/smoke.mjs)
RULES=(CLAUDE.md)

hide() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  mkdir -p "$OFFDIR/$(dirname "$f")"
  mv "$f" "$OFFDIR/$f"
}

unhide_all() {
  if [[ -f "$OFF_LEGACY" && ! -f CLAUDE.md ]]; then
    mv "$OFF_LEGACY" CLAUDE.md
  fi
  [[ -d "$OFFDIR" ]] || return 0
  local f
  for f in "${ALL[@]}"; do
    if [[ -f "$OFFDIR/$f" ]]; then
      mkdir -p "$(dirname "$f")"
      mv "$OFFDIR/$f" "$f"
    fi
  done
  find "$OFFDIR" -type d -empty -delete 2>/dev/null || true
}

# ไฟล์ที่ถูกซ่อนอยู่ตอนนี้ — ใช้ทั้งบอกสถานะและกรองคำเตือน
hidden_list() {
  [[ -f "$OFF_LEGACY" ]] && echo "CLAUDE.md"
  if [[ -d "$OFFDIR" ]]; then
    local f
    for f in "${ALL[@]}"; do
      [[ -f "$OFFDIR/$f" ]] && echo "$f"
    done
  fi
  return 0
}

# ไม่ใส่ขอบขวา — printf %-Ns นับ *ไบต์* ไม่ใช่ตัวอักษร
# ภาษาไทยตัวละ 3 ไบต์ กล่องจะเบี้ยวทุกครั้ง เอาขอบซ้ายอย่างเดียวพอ
box() {
  echo ""
  echo "  ══════════════════════════════════════════"
  echo "   $1"
  echo "   $2"
  echo "  ══════════════════════════════════════════"
  echo ""
}

print_status() {
  local n
  n="$(hidden_list | grep -c . || true)"
  if [[ "$n" == "0" ]]; then
    box "มาตรฐาน: 🟢 เปิดเต็ม" "= กำลังวัดโหมด ON (มีทั้งกฎและเครื่องมือ)"
  elif [[ "$n" == "1" ]] && [[ "$(hidden_list)" == "CLAUDE.md" ]]; then
    box "มาตรฐาน: 🟡 ปิดเฉพาะกฎ" "= AI ยังหาเครื่องมือเจอเอง ไม่ใช่ 'ไม่มีเลย'"
  else
    box "มาตรฐาน: ⚫ ปิดหมด (clean)" "= ไม่มีทั้งกฎและเครื่องมือ ซ่อนไว้ $n ไฟล์"
  fi
}

# tree ต้องสะอาดก่อนเริ่มวัด ไม่งั้นงานรอบก่อนจะปนเข้ามาในรอบนี้
#
# ⚠ การซ่อนไฟล์ทำให้ git status ขึ้นสองบรรทัดต่อไฟล์
#     D gate.sh                     ← หายไปจากที่เดิม
#     ?? standard/.mode-off/        ← ไปโผล่ที่ใหม่
#   ทั้งคู่เป็นผลของการสลับโหมดเอง ไม่ใช่งานค้าง ต้องกรองทั้งคู่
#   (เดิมกรองแค่บรรทัดล่าง ทำให้ off เตือนตัวเองทุกครั้งแม้ tree สะอาดสนิท)
warn_if_dirty() {
  local out
  # core.quotePath=false — ไม่งั้น git แปลงชื่อไฟล์ภาษาไทยเป็นเลขฐานแปด
  #   M "\340\270\207\340\270\262\340\270\231.txt"   ← คนอ่านไม่ออกว่าไฟล์ไหน
  # ซึ่งพังพอดีกับกรณีที่ path โปรเจกต์เป็นภาษาไทย
  out="$(git -c core.quotePath=false status --porcelain 2>/dev/null)" || return 0

  out="$(printf '%s\n' "$out" \
    | grep -v 'standard/CLAUDE\.md\.off' \
    | grep -v 'standard/\.mode-off' || true)"

  local f esc
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    esc="$(printf '%s' "$f" | sed 's/[.[\*^$/]/\\&/g')"
    out="$(printf '%s\n' "$out" | grep -vE "^[ ]?D[ ]+$esc\$" || true)"
  done < <(hidden_list)

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
  echo "     ถ้าเพิ่งล้างไปแล้วยังขึ้นอยู่ = แท็บไฟล์เปิดค้างในเอดิเตอร์"
  echo "     auto-save เขียนทับของที่ git คืนมา — ปิดแท็บก่อนแล้วล้างใหม่"
  echo ""
}

case "${1:-status}" in
  clean)
    for f in "${ALL[@]}"; do hide "$f"; done
    print_status
    echo "  ⚠ ห้ามบอก AI ให้ใช้ scope.mjs หรือ gate.sh — มันหาไม่เจออยู่แล้ว"
    echo "    และ **ห้ามตัดสินว่า \"จบ\" จากคำพูดของ AI** เพราะไม่มีเครื่องมือให้มันตรวจ"
    echo "    ต้องคืนของก่อนแล้วรัน gate เอง:  bash standard/mode.sh restore && ./gate.sh --full"
    echo ""
    warn_if_dirty
    ;;
  off|before)
    [[ "${1}" == "before" ]] && echo "  (หมายเหตุ: 'before' เปลี่ยนเป็น 'off' แล้ว — ทำงานเหมือนกัน)"
    for f in "${RULES[@]}"; do hide "$f"; done
    print_status
    echo "  ⚠ โหมดนี้ยังไม่ใช่ \"ไม่มีมาตรฐาน\" — เครื่องมือยังอยู่ AI หาเจอเองได้"
    echo "    ถ้าจะวัดสภาพ \"ไม่มีอะไรเลย\" ใช้:  bash standard/mode.sh clean"
    echo ""
    warn_if_dirty
    ;;
  restore|on|after)
    [[ "${1}" == "after" ]] && echo "  (หมายเหตุ: 'after' เปลี่ยนเป็น 'restore' แล้ว — ทำงานเหมือนกัน)"
    unhide_all
    if [[ ! -f CLAUDE.md ]]; then
      echo "✗ คืน CLAUDE.md ไม่ได้ — หาไม่เจอทั้งใน $OFFDIR และที่เดิม"
      echo "  กู้ด้วย: git checkout -- CLAUDE.md"
      exit 1
    fi
    print_status
    echo "  ต่อไป: รัน ./gate.sh --full ใส่โค้ดที่ AI ทำไว้ เพื่อตัดสินว่ารอบนั้น \"จบ\" ไหม"
    echo "         เขียว = จบ นับเลขโทเคนได้ · แดง = ไม่จบ ทิ้งเลขราคา จดเป็นอัตราไม่จบแทน"
    echo ""
    warn_if_dirty
    ;;
  status)
    print_status
    local_hidden="$(hidden_list)"
    if [[ -n "$local_hidden" ]]; then
      echo "  ซ่อนอยู่:"
      printf '%s\n' "$local_hidden" | sed 's/^/      /'
      echo ""
    fi
    warn_if_dirty
    ;;
  reset)
    echo ""
    echo "  ล้าง tree ให้สะอาดก่อนเริ่มงานวัดรอบใหม่:"
    echo ""
    echo "      bash standard/mode.sh restore   # คืนไฟล์ที่ซ่อนไว้ก่อน ← ทำข้อนี้ก่อนเสมอ"
    echo "      git checkout -- .               # คืนไฟล์ที่แก้"
    echo "      git clean -fd                   # ลบไฟล์ใหม่ที่ AI สร้าง  ← คนลืมบ่อย"
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
    echo "ใช้: bash standard/mode.sh [clean|off|restore|status|reset]"
    exit 2
    ;;
esac
