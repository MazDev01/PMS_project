#!/usr/bin/env node
/**
 * scope — ตอบว่า "แก้ตรงนี้แล้วกระทบที่ไหนบ้าง" ด้วยเครื่อง แทนที่จะให้คนหรือ AI อ่านทั้งโปรเจกต์
 *
 * นี่ไม่ใช่ gate — ไม่บล็อกอะไรทั้งนั้น เป็นข้อมูลไว้ตัดสินขอบเขตก่อนลงมือ
 * เพราะฉะนั้นมันช้ากว่า 15 วินาทีได้ และห้ามเอาไปใส่ pre-commit
 *
 * ใช้:
 *   node scripts/scope.mjs <ชื่อ symbol>
 *   node scripts/scope.mjs calculateTotal
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
  const configPath = ts.findConfigFile(ROOT, ts.sys.fileExists, "tsconfig.json");
  if (!configPath) throw new Error("หา tsconfig.json ไม่เจอ");
  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(configPath));
  // ตัดไฟล์ที่ Next generate ออก — reference ในนั้นไม่ใช่โค้ดที่คนแก้
  const files = parsed.fileNames.filter((f) => !f.replace(/\\/g, "/").includes("/.next/"));
  return { files, options: parsed.options };
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

/**
 * จุดที่เป็น "ตัวประกาศ" ตัดสินจากตำแหน่งที่เราหาเจอเอง
 * ไม่ใช้ ref.isDefinition เพราะมันไม่ได้ถูกเซ็ตเสมอไป
 */
const declKeys = new Set();
for (const d of declarations) {
  const sf = program.getSourceFile(d.fileName);
  if (!sf) continue;
  declKeys.add(`${d.fileName}:${sf.getLineAndCharacterOfPosition(d.pos).line}`);
}

/** รวม reference จากทุกจุดประกาศ กันซ้ำด้วย file:line */
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
  ⚠ เครื่องมือนี้เห็นแค่ static reference ที่มี type — ไม่ครอบสิ่งเหล่านี้
     · logic เดียวกันที่ถูกเขียนซ้ำไว้ที่อื่น (สำเนาไม่ใช่ reference)
     · string key — .rpc('...') · feature flag · ชื่อ event · route path
     · coupling ข้ามขอบเขต — DB trigger, external API, service อื่น
       (พวกนี้พิสูจน์ด้วย seam test ไม่ใช่ด้วยการหา reference)

  เขียวที่นี่ ≠ ปลอดภัยครบ · ยังต้องมีคนตรวจ 3 ข้อบน
`);
}
