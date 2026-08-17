#!/usr/bin/env node
/**
 * drift — จับตอนสำเนาของมาตรฐานในโปรเจกต์นี้ถูกแก้เอง
 *
 * ทำไมต้องมี:
 *   มาตรฐานถูกก๊อปไปวางในหลายโปรเจกต์ ไม่ได้ลิงก์กลับมาที่ต้นทาง
 *   ถ้ามีใครแก้สำเนาในโปรเจกต์แทนที่จะแก้ที่ dev-standard สองที่จะแยกกันเงียบ ๆ
 *   แล้วเทสต์ของ dev-standard จะเขียวต่อไปทั้งที่ของที่รันอยู่จริงคนละตัว
 *
 *   นี่เกิดขึ้นแล้วจริง — mode.sh ถูกก๊อปข้ามโปรเจกต์โดยไม่ปรับ
 *   บั๊กถูกเจอโดยผู้ใช้ ไม่ใช่โดยเทสต์ เพราะเทสต์คุมแค่ต้นฉบับ
 *
 * แยกสองประเภท ไม่ใช่ห้ามต่างทั้งหมด:
 *   ENGINE  ต้องเหมือนกันทุกโปรเจกต์ — แก้ที่ต้นทางแล้วติดตั้งใหม่เท่านั้น
 *   CUSTOM  ตั้งใจให้ปรับต่อโปรเจกต์ — ไม่ตรวจ (เช่น gate.sh ของโปรเจกต์ JS ไม่มี tsc)
 *
 * ใช้:
 *   node scripts/drift.mjs            ตรวจ (gate เรียกให้เอง)
 *   node scripts/drift.mjs --update   จดลายเซ็นใหม่ (install.sh เรียกให้เอง)
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

// ไฟล์ที่เป็น "เครื่องยนต์" — ตรรกะเดียวกันทุกโปรเจกต์ ห้ามต่าง
const ENGINE = [
  "scripts/scope.mjs",
  "scripts/ratchet.mjs",
  "scripts/smoke.mjs",
  "scripts/drift.mjs",
  "standard/mode.sh",
  "standard/measure.mjs",
];

// ไฟล์ที่ตั้งใจให้ปรับต่อโปรเจกต์ — จดไว้เพื่ออธิบาย ไม่ได้เอาไปตรวจ
const CUSTOM = ["CLAUDE.md", "gate.sh", "standard/config.json", "standard/baseline.md"];

const MANIFEST = "standard/.installed.json";
const wantUpdate = process.argv.includes("--update");

const sha = (f) =>
  crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex").slice(0, 16);

if (wantUpdate) {
  const engine = {};
  for (const f of ENGINE) {
    if (fs.existsSync(f)) engine[f] = sha(f);
  }
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        _: "ลายเซ็นของไฟล์เครื่องยนต์ตอนติดตั้ง — อย่าแก้มือ ใช้ node scripts/drift.mjs --update",
        version: process.env.STANDARD_VERSION || "unknown",
        engine,
        custom: CUSTOM.filter((f) => fs.existsSync(f)),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`  ✓ จดลายเซ็นไฟล์เครื่องยนต์ ${Object.keys(engine).length} ไฟล์`);
  process.exit(0);
}

if (!fs.existsSync(MANIFEST)) {
  console.log("  ℹ ยังไม่เคยจดลายเซ็น — ข้ามการตรวจ drift");
  console.log("    จดครั้งแรกด้วย:  node scripts/drift.mjs --update");
  process.exit(0);
}

const m = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const changed = [];
const missing = [];

for (const [f, want] of Object.entries(m.engine || {})) {
  if (!fs.existsSync(f)) {
    missing.push(f);
    continue;
  }
  if (sha(f) !== want) changed.push(f);
}

if (changed.length === 0 && missing.length === 0) {
  console.log(`  ✓ drift: ไฟล์เครื่องยนต์ ${Object.keys(m.engine || {}).length} ไฟล์ตรงกับตอนติดตั้ง (${m.version})`);
  process.exit(0);
}

console.error("");
console.error("  ✗ ไฟล์เครื่องยนต์ของมาตรฐานถูกแก้ในโปรเจกต์นี้");
console.error("");
for (const f of changed) console.error(`      แก้แล้ว  ${f}`);
for (const f of missing) console.error(`      หายไป    ${f}`);
console.error("");
console.error("  ไฟล์พวกนี้ต้องเหมือนกันทุกโปรเจกต์ — เทสต์ของ dev-standard คุมเฉพาะต้นฉบับ");
console.error("  ถ้าแก้ที่นี่ ของสองที่จะแยกกันเงียบ ๆ แล้วเทสต์จะเขียวทั้งที่ของจริงคนละตัว");
console.error("");
console.error("  แก้ให้ถูกทาง:");
console.error("    1. ย้ายการแก้ไปที่ dev-standard/files/... แล้วรัน npm test ที่นั่น");
console.error("    2. bash dev-standard/install.sh <โปรเจกต์นี้>");
console.error("");
console.error("  ถ้าตั้งใจแก้เฉพาะที่นี่จริง ๆ (แล้วรับผลเอง):");
console.error("    node scripts/drift.mjs --update");
console.error("");
process.exit(1);
