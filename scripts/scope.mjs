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

/**
 * typescript v7+ เป็นตัวเขียนใหม่ (native) ที่ถอด compiler API ออกเกือบหมด
 * เหลือ export แค่ 2 ตัว ทำให้ทุกอย่างข้างล่างพัง
 *
 * ถ้าไม่ดัก จะได้ error ว่า "Cannot read properties of undefined (reading 'fileExists')"
 * ซึ่งอ่านแล้วไม่มีทางเดาถูกว่าต้องแก้อะไร
 *
 * นี่คือตาข่ายคู่กับการ pin "typescript": "^5" ใน package.json
 */
if (typeof ts.createLanguageService !== "function") {
  const version = ts.version ?? "ไม่ทราบ";
  console.error(`
✗ scope.mjs ใช้กับ typescript เวอร์ชันนี้ไม่ได้ (พบ ${version})

  typescript v7 ขึ้นไปเป็นตัวเขียนใหม่ที่ถอด compiler API ออก
  (เหลือ export แค่ ${Object.keys(ts).length} ตัว — ปกติมีหลายร้อย)

  แก้:  npm i -D "typescript@^5"

  หมายเหตุ: \`npm i -D typescript\` เฉย ๆ จะได้ v7 เสมอ ต้องใส่ ^5 ให้ชัด
`);
  process.exit(1);
}

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const query = process.argv[2];

if (!query) {
  console.error("ใช้: node scripts/scope.mjs <ชื่อ symbol>");
  process.exit(2);
}

function loadFileNames() {
  // โปรเจกต์ TS ใช้ tsconfig.json · โปรเจกต์ JS ใช้ jsconfig.json — รองรับทั้งคู่
  const configPath =
    ts.findConfigFile(ROOT, ts.sys.fileExists, "tsconfig.json") ||
    ts.findConfigFile(ROOT, ts.sys.fileExists, "jsconfig.json");
  if (!configPath) throw new Error("หา tsconfig.json / jsconfig.json ไม่เจอ");

  const { config } = ts.readConfigFile(configPath, ts.sys.readFile);

  // ⚠ ต้องใส่ allowJs ลงใน config *ก่อน* parse ไม่ใช่หลัง
  //
  // parseJsonConfigFileContent ใช้ compilerOptions ที่อยู่ในตอนนั้น
  // ตัดสินว่าจะสแกนไฟล์นามสกุลไหน ถ้าไม่มี allowJs มันจะหาแต่ .ts/.tsx
  // โปรเจกต์ JS ที่ jsconfig ไม่ได้เขียน allowJs ไว้จะได้ 0 ไฟล์ แล้วเงียบ ๆ ไม่เจออะไรเลย
  //
  // (วัดจริงบนโปรเจกต์ Next.js + JS: ไม่ใส่ก่อน parse = 0 ไฟล์ · ใส่ก่อน parse = 80 ไฟล์)
  const patched = {
    ...config,
    compilerOptions: {
      ...(config.compilerOptions || {}),
      allowJs: true,
      // checkJs ปิดไว้เพราะเราแค่ไล่ reference ไม่ได้ตรวจ type
      // (ไม่งั้นโปรเจกต์ JS จะแดงเป็นร้อย)
      checkJs: false,
      jsx: config.compilerOptions?.jsx ?? "preserve",
    },
  };

  const parsed = ts.parseJsonConfigFileContent(patched, ts.sys, path.dirname(configPath));

  const options = { ...parsed.options, noEmit: true, skipLibCheck: true };

  // ตัดไฟล์ที่ Next generate ออก — reference ในนั้นไม่ใช่โค้ดที่คนแก้
  const files = parsed.fileNames.filter((f) => !f.replace(/\\/g, "/").includes("/.next/"));

  if (files.length === 0) {
    console.error(`
✗ ไม่พบไฟล์โค้ดเลยจาก ${path.basename(configPath)}

  ตรวจว่า include/files/exclude ในไฟล์นั้นครอบโฟลเดอร์โค้ดจริงไหม
  (ถ้าไม่เช็คตรงนี้ scope จะรายงานว่า "ไม่พบ symbol" ทุกครั้ง ทั้งที่มีอยู่จริง)
`);
    process.exit(1);
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
