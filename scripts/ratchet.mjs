#!/usr/bin/env node
/**
 * ratchet — ห้ามแย่ลง (ไม่ได้บังคับว่าต้องเป็นศูนย์)
 *
 * โปรเจกต์ที่มีอยู่แล้วมักมีปัญหา lint ค้างอยู่ ถ้าบังคับให้เป็นศูนย์ตั้งแต่วันแรก
 * ทีมจะปิด gate ทิ้ง เลยจดเลขปัจจุบันไว้เป็นฐาน แล้วบล็อกเฉพาะตอน "เพิ่มขึ้น"
 *
 * ใช้:
 *   node scripts/ratchet.mjs            # เทียบกับฐาน
 *   node scripts/ratchet.mjs --update   # เขียนฐานใหม่ (ตอนแก้ปัญหาเก่าได้แล้ว)
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BASELINE = path.join(ROOT, "standard", "lint-baseline.json");
const update = process.argv.includes("--update");

/**
 * รูลที่เฝ้าเป็นพิเศษ — จะแสดงแยกแม้ตอนนี้เป็นศูนย์
 * no-explicit-any คือด่านกัน type หลุด ซึ่งเป็นเงื่อนไขที่ทำให้ blast radius ฝั่ง DB ทำงาน
 *
 * TODO(เมื่อมี Supabase): เพิ่ม @typescript-eslint/no-unsafe-member-access
 *   ต้องเปิด type-aware linting (parserOptions.project) ซึ่งทำให้ lint ช้าลงมาก
 *   → รูลนั้นต้องอยู่ CI เท่านั้น ห้ามลง pre-commit
 */
const WATCHED = [
  "@typescript-eslint/no-explicit-any",
  "@typescript-eslint/no-unused-vars",
];

function runEslint() {
  const bin = path.join(ROOT, "node_modules", "eslint", "bin", "eslint.js");
  const res = spawnSync(process.execPath, [bin, "--format", "json", "src"], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (!res.stdout) {
    console.error("รัน eslint ไม่สำเร็จ:", res.stderr?.slice(0, 500));
    process.exit(1);
  }
  return JSON.parse(res.stdout);
}

function countByRule(results) {
  const counts = {};
  let errors = 0;
  let warnings = 0;
  for (const file of results) {
    for (const m of file.messages) {
      const rule = m.ruleId || "(fatal)";
      counts[rule] = (counts[rule] || 0) + 1;
      if (m.severity === 2) errors++;
      else warnings++;
    }
  }
  for (const rule of WATCHED) if (!(rule in counts)) counts[rule] = 0;
  return { counts, errors, warnings };
}

const current = countByRule(runEslint());

if (update || !fs.existsSync(BASELINE)) {
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
  fs.writeFileSync(
    BASELINE,
    JSON.stringify(
      {
        _comment:
          "เลขฐานของ lint ratchet — gate บล็อกเมื่อจำนวนเพิ่มขึ้นจากนี่ ไม่ได้บังคับให้เป็นศูนย์ แก้ปัญหาเก่าได้แล้วให้รัน: node scripts/ratchet.mjs --update",
        errors: current.errors,
        warnings: current.warnings,
        byRule: current.counts,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `✓ เขียนเลขฐานแล้ว: ${current.errors} error, ${current.warnings} warning`,
  );
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const regressions = [];

for (const [rule, count] of Object.entries(current.counts)) {
  const before = base.byRule?.[rule] ?? 0;
  if (count > before) regressions.push({ rule, before, now: count });
}

if (regressions.length === 0) {
  const improved = current.errors + current.warnings <
    (base.errors ?? 0) + (base.warnings ?? 0);
  console.log(
    `  ✓ ratchet: ${current.errors} error, ${current.warnings} warning ` +
      `(ฐาน ${base.errors}/${base.warnings})` +
      (improved ? " — ดีขึ้น รัน --update เพื่อล็อกระดับใหม่" : ""),
  );
  process.exit(0);
}

console.error(`\n  ✗ ratchet: มีปัญหา lint เพิ่มขึ้น`);
for (const r of regressions) {
  console.error(`      ${r.rule}: ${r.before} → ${r.now}`);
}
console.error(
  `\n  แก้ให้กลับไปเท่าเดิม หรือถ้าตั้งใจรับหนี้นี้จริง ให้รัน:\n` +
    `      node scripts/ratchet.mjs --update  แล้ว commit ไฟล์ฐานไปด้วย\n`,
);
process.exit(1);
