#!/usr/bin/env node
/**
 * measure — อ่านโทเคนที่ใช้จริง "แยกรายแชท" จาก log ของ Claude Code
 *
 * ทำไมต้องมี:
 *   /usage บอกยอดรวมของทั้งเครื่องในหน้าต่าง 5 ชั่วโมง — ทุกแชทปนกัน
 *   /context บอกแค่ขนาดบทสนทนา ณ ตอนนั้น ไม่ใช่โทเคนที่จ่าย
 *   แต่ Claude Code เก็บ usage ของทุกรอบไว้ใน log รายแชทอยู่แล้ว
 *   เครื่องมือนี้แค่อ่านมันออกมา → ได้ตัวเลขที่แยกแชทได้จริง ไม่ต้องเงียบระหว่างวัด
 *
 * ใช้:
 *   node standard/measure.mjs              รายการแชทล่าสุดของโปรเจกต์นี้
 *   node standard/measure.mjs <id>         รายละเอียดแชทเดียว
 *   node standard/measure.mjs --all        ทุกโปรเจกต์
 *   node standard/measure.mjs --limit 20   แสดงมากกว่าปกติ
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const PROJECTS = path.join(os.homedir(), ".claude", "projects");

const args = process.argv.slice(2);
const wantAll = args.includes("--all");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) || 10 : 10;
const wantId = args.find((a) => !a.startsWith("--") && a !== String(LIMIT));

if (!fs.existsSync(PROJECTS)) {
  console.error(`✗ ไม่พบโฟลเดอร์ log: ${PROJECTS}`);
  process.exit(1);
}

/** อ่านไฟล์ log หนึ่งแชท แล้วสรุปตัวเลข */
function readSession(file) {
  let lines;
  try {
    lines = fs.readFileSync(file, "utf8").split("\n");
  } catch {
    return null;
  }

  const s = {
    id: path.basename(file, ".jsonl"),
    cwd: null,
    title: null,
    firstUser: null,
    turns: 0,
    input: 0,
    cacheWrite: 0,
    cacheRead: 0,
    output: 0,
    start: null,
    end: null,
  };

  for (const line of lines) {
    if (!line) continue;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }

    if (!s.cwd && o.cwd) s.cwd = o.cwd;
    if (o.timestamp) {
      if (!s.start || o.timestamp < s.start) s.start = o.timestamp;
      if (!s.end || o.timestamp > s.end) s.end = o.timestamp;
    }
    if (o.type === "ai-title" && !s.title) {
      s.title = o.title || o.message || null;
    }
    if (o.type === "user" && !s.firstUser && o.message) {
      const c = o.message.content;
      const text =
        typeof c === "string"
          ? c
          : Array.isArray(c)
            ? c.filter((x) => x?.type === "text").map((x) => x.text).join(" ")
            : "";
      if (text.trim()) s.firstUser = text.trim().replace(/\s+/g, " ").slice(0, 90);
    }

    const u = o?.message?.usage;
    if (u) {
      s.turns++;
      s.input += u.input_tokens || 0;
      s.cacheWrite += u.cache_creation_input_tokens || 0;
      s.cacheRead += u.cache_read_input_tokens || 0;
      s.output += u.output_tokens || 0;
    }
  }

  s.newInput = s.input + s.cacheWrite;
  s.total = s.newInput + s.cacheRead + s.output;

  /**
   * ราคาถ่วงน้ำหนัก — "รวมทั้งหมด" ใช้เทียบราคาตรง ๆ ไม่ได้
   *
   * cache read คือบริบทเดิมที่ถูกส่งซ้ำทุกรอบ ราคาถูกกว่า input ใหม่ราว 10 เท่า
   * ส่วน output แพงกว่า input ราว 5 เท่า
   * ถ้าใช้ยอดรวมดิบ งานที่คุยหลายรอบจะดูแพงเกินจริงมาก เพราะ cache read พองขึ้น
   *
   * ⚠ ตัวคูณเป็นค่าประมาณตามโครงสร้างราคาทั่วไป ไม่ใช่ราคาจริงของแผนคุณ
   *   ใช้เทียบสองรอบด้วยกันได้ อย่าเอาไปคิดเป็นเงิน
   */
  s.weighted = s.newInput + s.cacheRead * 0.1 + s.output * 5;
  return s;
}

function listFiles() {
  const out = [];
  for (const dir of fs.readdirSync(PROJECTS)) {
    const p = path.join(PROJECTS, dir);
    if (!fs.statSync(p).isDirectory()) continue;
    for (const f of fs.readdirSync(p)) {
      if (f.endsWith(".jsonl")) out.push(path.join(p, f));
    }
  }
  return out;
}

const fmt = (n) =>
  n >= 1_000_000
    ? (n / 1_000_000).toFixed(2) + "M"
    : n >= 1000
      ? (n / 1000).toFixed(1) + "k"
      : String(n);

const when = (iso) => (iso ? new Date(iso).toLocaleString("th-TH") : "-");

// ── รายละเอียดแชทเดียว ────────────────────────────────────────────────
if (wantId) {
  const file = listFiles().find((f) => path.basename(f).startsWith(wantId));
  if (!file) {
    console.error(`✗ ไม่พบแชทที่ขึ้นต้นด้วย "${wantId}"`);
    process.exit(1);
  }
  const s = readSession(file);
  console.log(`
แชท ${s.id}
  งาน       ${s.title || s.firstUser || "(ไม่มีชื่อ)"}
  โฟลเดอร์  ${s.cwd || "-"}
  เริ่ม      ${when(s.start)}
  จบ        ${when(s.end)}
  จำนวนรอบ  ${s.turns}

  โทเคน
    input ใหม่        ${fmt(s.newInput).padStart(8)}   (input ${fmt(s.input)} + cache write ${fmt(s.cacheWrite)})
    cache read        ${fmt(s.cacheRead).padStart(8)}   ← บริบทที่ส่งซ้ำทุกรอบ ราคาถูกกว่ามาก
    output            ${fmt(s.output).padStart(8)}
    ─────────────────────────────
    รวมดิบ            ${fmt(s.total).padStart(8)}
    ─────────────────────────────
    ราคาถ่วงน้ำหนัก   ${fmt(s.weighted).padStart(8)}   ← ใช้ตัวนี้เทียบราคา

  ℹ ถ่วงน้ำหนัก = input ใหม่ + (cache read × 0.1) + (output × 5)
    cache read ราคาถูกกว่ามาก ถ้าใช้ยอดรวมดิบ งานที่คุยหลายรอบจะดูแพงเกินจริง
    ตัวคูณเป็นค่าประมาณ ใช้เทียบสองรอบด้วยกัน อย่าเอาไปคิดเป็นเงิน
`);
  process.exit(0);
}

// ── รายการแชท ────────────────────────────────────────────────────────
const sessions = listFiles()
  .map(readSession)
  .filter(Boolean)
  .filter((s) => s.turns > 0)
  .filter((s) => wantAll || (s.cwd && ROOT.startsWith(s.cwd)) || (s.cwd && s.cwd.startsWith(ROOT)))
  .sort((a, b) => String(b.end).localeCompare(String(a.end)))
  .slice(0, LIMIT);

if (sessions.length === 0) {
  console.log(`
ไม่พบแชทของโฟลเดอร์นี้ (${ROOT})
ลอง: node standard/measure.mjs --all
`);
  process.exit(0);
}

console.log(`\nแชทล่าสุด ${sessions.length} รายการ${wantAll ? " (ทุกโปรเจกต์)" : ""}\n`);
console.log(
  "  " +
    "id".padEnd(10) +
    "รอบ".padStart(5) +
    "input ใหม่".padStart(12) +
    "output".padStart(9) +
    "ถ่วงราคา".padStart(10) +
    "รวมดิบ".padStart(9) +
    "  งาน",
);
console.log("  " + "─".repeat(88));
for (const s of sessions) {
  console.log(
    "  " +
      s.id.slice(0, 8).padEnd(10) +
      String(s.turns).padStart(5) +
      fmt(s.newInput).padStart(12) +
      fmt(s.output).padStart(9) +
      fmt(s.weighted).padStart(10) +
      fmt(s.total).padStart(9) +
      "  " +
      (s.title || s.firstUser || "").slice(0, 46),
  );
}
console.log(`
  ดูรายละเอียด:  node standard/measure.mjs <id 8 ตัวแรก>
`);
