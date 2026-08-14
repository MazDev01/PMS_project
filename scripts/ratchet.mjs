#!/usr/bin/env node
/**
 * ratchet — ห้ามแย่ลง (ไม่ได้บังคับว่าต้องเป็นศูนย์)
 *
 * โปรเจกต์ที่มีอยู่แล้วมักมีปัญหา lint ค้างอยู่ ถ้าบังคับให้เป็นศูนย์ตั้งแต่วันแรก
 * ทีมจะปิด gate ทิ้ง เลยจดเลขปัจจุบันไว้เป็นฐาน แล้วบล็อกเฉพาะตอน "เพิ่มขึ้น"
 *
 * ใช้:
 *   node scripts/ratchet.mjs            # เทียบกับฐาน
 *   node scripts/ratchet.mjs --update   # เขียนฐานใหม่ (ต้อง commit งานให้หมดก่อน)
 *
 * ⚠ --update จะปฏิเสธถ้ายังมีไฟล์แก้ค้าง เพราะเลขฐานต้องตรงกับสิ่งที่ CI เห็น
 *   ข้ามได้ด้วย --allow-dirty ถ้ารู้ว่ากำลังทำอะไรอยู่
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

/** โฟลเดอร์ที่จะให้ eslint ตรวจ — มาจาก standard/config.json */
function lintPaths() {
  try {
    const cfg = JSON.parse(
      fs.readFileSync(path.join(ROOT, "standard", "config.json"), "utf8"),
    );
    if (Array.isArray(cfg.lintPaths) && cfg.lintPaths.length) return cfg.lintPaths;
  } catch {
    /* ใช้ค่าเริ่มต้น */
  }
  return ["src"];
}

function runEslint() {
  const bin = path.join(ROOT, "node_modules", "eslint", "bin", "eslint.js");
  // --cache ทำให้รอบถัดไปเร็วขึ้นหลายเท่า (วัดจริง: 37 วิ → 11 วิ)
  // เก็บ cache ไว้ใน node_modules ซึ่งถูก ignore อยู่แล้ว จะได้ไม่ต้องแก้ .gitignore
  const cacheFile = path.join(ROOT, "node_modules", ".cache", "eslint-ratchet");
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true });
  const res = spawnSync(
    process.execPath,
    [bin, "--cache", "--cache-location", cacheFile, "--format", "json", ...lintPaths()],
    {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    },
  );
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

/**
 * เลขฐานต้องจดจาก tree ที่ commit หมดแล้วเท่านั้น
 *
 * ถ้าจดตอนยังมีของแก้ค้าง จะได้เลขที่ไม่ตรงกับสิ่งที่ CI เห็น (CI เห็นเฉพาะที่ commit)
 * แล้ววันหนึ่งจะเจอ CI แดงหรือเขียวผิด ๆ โดยไม่รู้สาเหตุ
 *
 * เจอปัญหานี้จริงบน macca-pms-ui: เลขฐานจดตอนมี 11 ไฟล์แก้ค้าง
 * เครื่องนับได้ 14 error แต่ CI นับได้ 13
 */
function assertCleanTree() {
  const res = spawnSync("git", ["status", "--porcelain"], {
    cwd: ROOT,
    encoding: "utf8",
  });
  if (res.status !== 0) return; // ไม่ใช่ git repo — ข้ามการตรวจ

  const dirty = (res.stdout || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    // ไฟล์เลขฐานเองไม่นับ เพราะกำลังจะถูกเขียนใหม่อยู่แล้ว
    .filter((l) => !l.endsWith("standard/lint-baseline.json"));

  if (dirty.length === 0) return;

  console.error(`
✗ ยังมีไฟล์ที่แก้ค้างอยู่ ${dirty.length} รายการ — ยังจดเลขฐานไม่ได้

${dirty.slice(0, 10).map((l) => "    " + l).join("\n")}${dirty.length > 10 ? `\n    ... และอีก ${dirty.length - 10}` : ""}

  เลขฐานต้องจดจากโค้ดที่ commit แล้วเท่านั้น
  ไม่งั้นจะได้เลขที่ไม่ตรงกับที่ CI เห็น แล้วเจอ CI แดง/เขียวผิด ๆ โดยไม่รู้สาเหตุ

  แก้:  commit งานให้เรียบร้อยก่อน แล้วค่อยรัน --update
  ถ้ารู้ตัวว่ากำลังทำอะไรอยู่:  node scripts/ratchet.mjs --update --allow-dirty
`);
  process.exit(1);
}

// ตรวจ tree ก่อนรัน eslint — ถ้าจะปฏิเสธอยู่แล้วก็ไม่ต้องเสียเวลา lint หลายสิบวินาที
if (update && !process.argv.includes("--allow-dirty")) assertCleanTree();

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
