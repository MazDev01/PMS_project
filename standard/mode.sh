#!/usr/bin/env bash
#
# สลับโหมดสำหรับการวัดผล (ดู standard/baseline.md)
#
#   bash standard/mode.sh before   ปิดมาตรฐาน — สภาพเดิมของโปรเจกต์ (ไม่มี CLAUDE.md)
#   bash standard/mode.sh after    เปิดมาตรฐาน
#   bash standard/mode.sh status   ดูว่าตอนนี้อยู่โหมดไหน
#
# ทำไมต้องเป็นสคริปต์ ไม่ใช่ก๊อปไฟล์:
#   โปรเจกต์นี้ "สภาพก่อน" คือ **ไม่มี CLAUDE.md เลย** ไม่ใช่มีไฟล์เปล่า ๆ
#   ถ้าใช้ไฟล์ stub จะไม่ใช่สภาพเดิมจริง และตัวเลขที่วัดได้ก็ไม่ใช่ของจริง
#
#   และที่สำคัญกว่า: ต้องรู้ได้เสมอว่าตอนนี้อยู่โหมดไหน
#   ถ้าเผลอวัดโหมดผิดโดยไม่รู้ตัว ตัวเลขทั้งชุดใช้ไม่ได้แล้วก็ไม่มีทางรู้

set -euo pipefail
cd "$(dirname "$0")/.."

OFF="standard/CLAUDE.md.off"

case "${1:-status}" in
  before)
    if [[ -f CLAUDE.md ]]; then
      mv CLAUDE.md "$OFF"
      echo "→ โหมด: ก่อน (ปิดมาตรฐานแล้ว)"
      echo ""
      echo "  ⚠ ตอนสั่งงาน ห้ามบอกให้ AI ใช้ scope.mjs หรือ gate.sh"
      echo "    ไม่งั้นได้ครึ่ง ๆ กลาง ๆ เทียบกับโหมด 'หลัง' ไม่ได้"
    else
      echo "→ โหมด: ก่อน (อยู่โหมดนี้อยู่แล้ว)"
    fi
    ;;
  after)
    if [[ -f "$OFF" ]]; then
      mv "$OFF" CLAUDE.md
      echo "→ โหมด: หลัง (เปิดมาตรฐานแล้ว)"
    elif [[ -f CLAUDE.md ]]; then
      echo "→ โหมด: หลัง (อยู่โหมดนี้อยู่แล้ว)"
    else
      echo "✗ หา CLAUDE.md ไม่เจอทั้งสองที่ — กู้ด้วย: git checkout -- CLAUDE.md"
      exit 1
    fi
    ;;
  status)
    if [[ -f CLAUDE.md ]]; then
      echo "โหมดปัจจุบัน: หลัง (มาตรฐานเปิดอยู่)"
    elif [[ -f "$OFF" ]]; then
      echo "โหมดปัจจุบัน: ก่อน (มาตรฐานปิดอยู่)"
    else
      echo "✗ ไม่พบ CLAUDE.md ทั้งสองที่ — สถานะไม่ชัดเจน"
      exit 1
    fi
    ;;
  *)
    echo "ใช้: bash standard/mode.sh [before|after|status]"
    exit 2
    ;;
esac
