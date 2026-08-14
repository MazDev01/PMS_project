#!/usr/bin/env node
/**
 * scope — ตอบว่า "แก้ตรงนี้แล้วกระทบที่ไหนบ้าง" ด้วยเครื่อง แทนที่จะให้คนหรือ AI อ่านทั้งโปรเจกต์
 *
 * ฉบับนี้ทำงานกับโปรเจกต์ JavaScript ล้วน — ใช้ TypeScript language service
 * วิเคราะห์ไฟล์ .js/.jsx ผ่าน allowJs โดยไม่ต้องแปลงโค้ดเป็น .ts สักไฟล์
 *
 * ⚠ แม่นน้อยกว่าโปรเจกต์ TypeScript เพราะ JS ไม่มี type ให้ยึด
 *   ชื่อที่ซ้ำกันคนละความหมายอาจถูกนับรวม — ดูป้ายท้ายผลลัพธ์
 *
 * นี่ไม่ใช่ gate — ไม่บล็อกอะไรทั้งนั้น เป็นข้อมูลไว้ตัดสินขอบเขตก่อนลงมือ
 *
 * ใช้:
 *   node scripts/scope.mjs <ชื่อ symbol>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const query = process.argv[2];

if (!query) {
  console.error("ใช้: node scripts/scope.mjs <ชื่อ symbol>");
  process.exit(2);
}

function loadFileNames() {
  // โปรเจกต์ JS ใช้ jsconfig.json · โปรเจกต์ TS ใช้ tsconfig.json — รองรับทั้งคู่
  const configPath =
    ts.findConfigFile(ROOT, ts.sys.fileExists, "tsconfig.json") ||
    ts.findConfigFile(ROOT, ts.sys.fileExists, "jsconfig.json");
  if (!configPath) throw new Error("หา tsconfig.json / jsconfig.json ไม่เจอ");

  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    path.dirname(configPath),
  );

  // บังคับให้อ่านไฟล์ JS + รองรับ JSX — jsconfig ไม่ได้ตั้งค่าพวกนี้ไว้
  const options = {
    ...parsed.options,
    allowJs: true,
    checkJs: false, // แค่ไล่ reference ไม่ต้องตรวจ type (ไม่งั้นจะแดงเป็นร้อย)
    jsx: parsed.options.jsx ?? ts.JsxEmit.Preserve,
    noEmit: true,
    skipLibCheck: true,
  };

  // ตัดไฟล์ที่ Next generate ออก — reference ในนั้นไม่ใช่โค้ดที่คนแก้
  let files = parsed.fileNames.filter(
    (f) => !f.replace(/\\/g, "/").includes("/.next/"),
  );

  // ถ้า config ไม่ได้ระบุ include ไว้ อาจได้ไฟล์ไม่ครบ — กวาดเองจากโฟลเดอร์โค้ด
  if (files.length === 0) {
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          if (["node_modules", ".next", ".git", "public"].includes(e.name)) continue;
          walk(p);
        } else if (/\.(js|jsx|mjs|ts|tsx)$/.test(e.name)) {
          files.push(p);
        }
      }
    };
    walk(ROOT);
  }

  return { files, options };
}

const { files, options } = loadFileNames();

const versions = new Map(files.map((f) => [f, 0]));
const host = {
  getScriptFileNames: () => files,
  getScriptVersion: (f) => String(versions.get(f) ?? 0),
  getScriptSnapshot: (f) => {
    if (!fs.existsSync(f)) return undefined;
    return ts.ScriptSnapshot.fromString(fs.readFileSync(f, "utf8"));
  },
  getCurrentDirectory: () => ROOT,
  getCompilationSettings: () => options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};

const service = ts.createLanguageService(host, ts.createDocumentRegistry());
const program = service.getProgram();
if (!program) {
  console.error("สร้าง TypeScript program ไม่สำเร็จ");
  process.exit(1);
}

/** หาทุกจุดที่ประกาศ symbol ชื่อนี้ */
const declarations = [];
for (const sf of program.getSourceFiles()) {
  if (sf.isDeclarationFile) continue;
  if (sf.fileName.replace(/\\/g, "/").includes("/node_modules/")) continue;
  const visit = (node) => {
    const name = node.name;
    if (
      name &&
      ts.isIdentifier(name) &&
      name.text === query &&
      (ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isVariableDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node))
    ) {
      declarations.push({ fileName: sf.fileName, pos: name.getStart(sf) });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

const rel = (f) => path.relative(ROOT, f).replace(/\\/g, "/");

console.log(`\nblast radius: ${query}\n`);

if (declarations.length === 0) {
  console.log(`  ไม่พบการประกาศชื่อ "${query}" ในโปรเจกต์`);
  console.log(`  (พิมพ์ชื่อถูกไหม? หรือมันอาจเป็น string key ซึ่งเครื่องมือนี้มองไม่เห็น)\n`);
  printLimits();
  process.exit(0);
}

if (declarations.length > 1) {
  console.log(`  ⚠ พบการประกาศชื่อนี้ ${declarations.length} จุด — รวมผลทั้งหมด\n`);
}

const declKeys = new Set();
for (const d of declarations) {
  const sf = program.getSourceFile(d.fileName);
  if (!sf) continue;
  declKeys.add(`${d.fileName}:${sf.getLineAndCharacterOfPosition(d.pos).line}`);
}

const hits = new Map();
for (const decl of declarations) {
  const refs = service.getReferencesAtPosition(decl.fileName, decl.pos) || [];
  for (const ref of refs) {
    const sf = program.getSourceFile(ref.fileName);
    if (!sf) continue;
    const { line } = sf.getLineAndCharacterOfPosition(ref.textSpan.start);
    const key = `${ref.fileName}:${line}`;
    if (hits.has(key)) continue;
    hits.set(key, {
      file: rel(ref.fileName),
      line: line + 1,
      isDefinition: declKeys.has(key),
      text: sf.text.split("\n")[line]?.trim().slice(0, 100) ?? "",
    });
  }
}

const all = [...hits.values()].sort(
  (a, b) => a.file.localeCompare(b.file) || a.line - b.line,
);
const defs = all.filter((h) => h.isDefinition);
const uses = all.filter((h) => !h.isDefinition);
const touchedFiles = new Set(all.map((h) => h.file));

console.log(`  จุดประกาศ (${defs.length})`);
for (const d of defs) console.log(`    ${d.file}:${d.line}`);

console.log(`\n  จุดที่ใช้งาน (${uses.length}) ใน ${touchedFiles.size} ไฟล์`);
if (uses.length === 0) {
  console.log(`    ไม่มีใครใช้ — ลบได้ หรือเป็น dead code`);
} else {
  let lastFile = "";
  for (const u of uses) {
    if (u.file !== lastFile) {
      console.log(`    ${u.file}`);
      lastFile = u.file;
    }
    console.log(`      :${u.line}  ${u.text}`);
  }
}

printLimits();

function printLimits() {
  console.log(`
  ⚠ เครื่องมือนี้เห็นแค่ static reference — และโปรเจกต์นี้เป็น JavaScript
     จึงแม่นน้อยกว่าโปรเจกต์ TypeScript เพราะไม่มี type ให้ยึด ไม่ครอบสิ่งเหล่านี้:
     · logic เดียวกันที่ถูกเขียนซ้ำไว้ที่อื่น (สำเนาไม่ใช่ reference)
     · string key — ชื่อ event · feature flag · route path
     · coupling ข้ามขอบเขต — external API, service อื่น
       (พวกนี้พิสูจน์ด้วย seam test ไม่ใช่ด้วยการหา reference)

  เขียวที่นี่ ≠ ปลอดภัยครบ · ยังต้องมีคนตรวจ
`);
}
