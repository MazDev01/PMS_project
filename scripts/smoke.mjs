#!/usr/bin/env node
/**
 * render smoke — จับ "จอขาว" ที่ tsc และ next build จับไม่ได้
 *
 * ตรวจแต่ละ route: HTTP ไม่ใช่ 4xx/5xx · body มีเนื้อหาจริง · ไม่มี console error
 *
 * ใช้:
 *   node scripts/smoke.mjs                    # เปิด next dev เอง (ตอน dev)
 *   node scripts/smoke.mjs --prod             # เปิด next start = ทดสอบ build ที่จะ deploy จริง
 *   BASE_URL=http://localhost:3000 node scripts/smoke.mjs   # ยิงใส่ที่รันอยู่แล้ว
 *
 * ⚠ CI ต้องใช้ --prod เสมอ
 *   ถ้า build แล้วปล่อยให้ smoke ไปเปิด next dev เอง = ทดสอบคนละตัวกับที่ ship
 *   และ dev ที่คอมไพล์ทีละ route คือต้นเหตุของ timeout ปลอม (warm-up แค่กลบไว้)
 *   production build เสิร์ฟทันที ปัญหานั้นหายไปตั้งแต่ต้นทาง
 *
 * env:
 *   BASE_URL              ถ้าใส่ จะไม่เปิด server เอง
 *   SMOKE_BROWSER_CHANNEL เบราว์เซอร์ที่ใช้ (default: msedge · CI ใช้ chromium)
 */
import fs from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

/** route มาจาก standard/config.json — แก้ที่นั่น ไม่ต้องแก้ไฟล์นี้ */
function loadRoutes() {
  const configPath = fileURLToPath(
    new URL("../standard/config.json", import.meta.url),
  );
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (Array.isArray(cfg.smokeRoutes) && cfg.smokeRoutes.length) {
      return cfg.smokeRoutes;
    }
  } catch {
    /* ไม่มีไฟล์ config ก็ใช้ค่าเริ่มต้น */
  }
  console.log("  (ไม่พบ smokeRoutes ใน standard/config.json — ตรวจแค่ '/')");
  return ["/"];
}

const ROUTES = loadRoutes();

/** ต่ำกว่านี้ถือว่าหน้าว่าง */
const MIN_BODY_TEXT = 40;

/**
 * เครื่อง dev ยืม Edge ที่ Windows มีอยู่แล้ว จะได้ไม่ต้องโหลด Chromium 150MB
 * CI ตั้งเป็นค่าว่าง = ใช้ chromium ที่ playwright ลงให้ (Ubuntu ไม่มี Edge)
 */
const CHANNEL_ENV = process.env.SMOKE_BROWSER_CHANNEL ?? "msedge";
const CHANNEL = CHANNEL_ENV === "" || CHANNEL_ENV === "default" ? null : CHANNEL_ENV;
const PORT = Number(process.env.SMOKE_PORT || 3100);

/** console error ที่ไม่เกี่ยวกับความถูกต้องของหน้า */
const IGNORED_CONSOLE = [
  /favicon/i,
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
];

function isIgnorable(text) {
  return IGNORED_CONSOLE.some((re) => re.test(text));
}

/**
 * รอจน server ตอบ route จริงได้สำเร็จ
 * ห้ามเช็คแค่ "มีการตอบ" — next dev ตอบ 404 ทุก path ระหว่างยังบูตไม่เสร็จ
 * ถ้าเข้าไปยิงตอนนั้นจะได้ 404 ทั้งชุดโดยที่แอปไม่ได้พัง
 */
async function waitForServer(base, probePath, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(base + probePath, {
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status < 400) return true;
    } catch {
      /* ยังไม่ขึ้น */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

/** บน Windows ต้องฆ่าทั้ง process tree ไม่งั้น dev server ค้างยึดพอร์ต */
function killTree(proc) {
  if (!proc || proc.killed) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/PID", String(proc.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    proc.kill("SIGTERM");
  }
}

async function startServer(mode) {
  const base = `http://localhost:${PORT}`;
  const boot = Number(process.env.SMOKE_BOOT_TIMEOUT || 240_000);
  console.log(`  เปิด next ${mode} ที่ ${base} (รอสูงสุด ${boot / 1000} วิ) ...`);

  // เรียก bin ของ next ด้วย node ตรง ๆ — spawn ไฟล์ .cmd บน Windows ได้ EINVAL
  // และ shell:true จะทำให้ kill ไม่ถึงลูก
  const nextBin = fileURLToPath(
    new URL("../node_modules/next/dist/bin/next", import.meta.url),
  );
  const proc = spawn(
    process.execPath,
    [nextBin, mode, "--port", String(PORT)],
    { stdio: ["ignore", "pipe", "pipe"] },
  );

  let log = "";
  const collect = (buf) => {
    log = (log + buf.toString()).slice(-4000);
  };
  proc.stdout.on("data", collect);
  proc.stderr.on("data", collect);

  const started = Date.now();
  const ok = await waitForServer(base, ROUTES[0], boot);
  if (!ok) {
    killTree(proc);
    console.error(`\n--- next ${mode} output ---\n` + log);
    if (mode === "start") {
      console.error("  (โหมด --prod ต้อง next build ก่อน)");
    }
    throw new Error(`next ${mode} ไม่ขึ้นภายใน ${boot / 1000} วินาที`);
  }
  console.log(`  server พร้อมใน ${((Date.now() - started) / 1000).toFixed(1)} วิ`);
  return { base, stop: () => killTree(proc) };
}

async function checkRoute(browser, base, route) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const problems = [];

  /**
   * เก็บ URL ของ resource ที่โหลดไม่สำเร็จ
   * ข้อความ console ของเบราว์เซอร์เขียนแค่ "Failed to load resource: ... 404 ()"
   * ไม่บอกว่าไฟล์ไหน ทำให้วินิจฉัยไม่ได้เลย ต้องดักที่ response แทน
   */
  const badResponses = [];
  page.on("response", (res) => {
    if (res.status() >= 400) {
      badResponses.push(`${res.status()} ${res.url().replace(base, "")}`);
    }
  });

  page.on("console", (msg) => {
    if (msg.type() === "error" && !isIgnorable(msg.text())) {
      problems.push(`console.error: ${msg.text().slice(0, 200)}`);
    }
  });
  page.on("pageerror", (err) => {
    problems.push(`uncaught: ${String(err).slice(0, 200)}`);
  });

  try {
    const res = await page.goto(base + route, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    const status = res?.status() ?? 0;
    if (status >= 400) problems.push(`HTTP ${status}`);

    const text = ((await page.locator("body").innerText()) || "").trim();
    if (text.length < MIN_BODY_TEXT) {
      problems.push(`หน้าว่าง — body มีข้อความ ${text.length} ตัวอักษร`);
    }
  } catch (err) {
    problems.push(`โหลดไม่สำเร็จ: ${String(err).split("\n")[0]}`);
  } finally {
    await context.close();
  }

  // ต่อท้ายรายชื่อ resource ที่พัง เพื่อให้รู้ว่า 404 คือไฟล์ไหน
  if (problems.length && badResponses.length) {
    problems.push(`resource ที่พัง: ${[...new Set(badResponses)].join(" · ")}`);
  }

  return problems;
}

/**
 * อุ่น route ทุกตัวก่อนตรวจจริง
 * next dev คอมไพล์ทีละ route ตอนถูกเรียกครั้งแรก บาง route ใช้เวลาเกิน 60 วิ
 * ถ้าไม่อุ่นก่อน จะได้ timeout ที่ไม่ใช่ความผิดของโค้ด = gate โกหก
 */
async function warmUp(base) {
  process.stdout.write("  อุ่น route ");
  for (const route of ROUTES) {
    try {
      await fetch(base + route, { signal: AbortSignal.timeout(180_000) });
    } catch {
      /* ปล่อยให้ขั้นตรวจจริงเป็นคนรายงาน */
    }
    process.stdout.write(".");
  }
  console.log(" เสร็จ");
}

async function main() {
  const prod = process.argv.includes("--prod");
  let server = null;
  let base = process.env.BASE_URL;
  if (!base) {
    server = await startServer(prod ? "start" : "dev");
    base = server.base;
  }
  // production build เสิร์ฟทันที ไม่ต้องอุ่น · dev คอมไพล์ทีละ route จึงต้องอุ่นกัน timeout ปลอม
  if (!prod) await warmUp(base);

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      ...(CHANNEL ? { channel: CHANNEL } : {}),
    });
  } catch (err) {
    server?.stop();
    console.error(`\n✗ เปิดเบราว์เซอร์ไม่ได้ (channel=${CHANNEL ?? "ค่าเริ่มต้นของ playwright"})`);
    console.error(`  ${String(err).split("\n")[0]}`);
    console.error(`  แก้: ตั้ง SMOKE_BROWSER_CHANNEL หรือ npx playwright install chromium`);
    process.exit(1);
  }

  const failures = [];
  for (const route of ROUTES) {
    const problems = await checkRoute(browser, base, route);
    if (problems.length === 0) {
      console.log(`  ✓ ${route}`);
    } else {
      console.log(`  ✗ ${route}`);
      for (const p of problems) console.log(`      ${p}`);
      failures.push(route);
    }
  }

  await browser.close();
  server?.stop();

  printLimits();

  if (failures.length) {
    console.error(`\n✗ render smoke: ${failures.length}/${ROUTES.length} route มีปัญหา`);
    process.exit(1);
  }
  console.log(`✓ render smoke: ${ROUTES.length} route ผ่านหมด`);
}

function printLimits() {
  console.log(`
  ⚠ smoke นี้ครอบแค่ ${ROUTES.length} route ที่เข้าได้โดยไม่ต้องล็อกอินและไม่มี param — ไม่ครอบ
     · หน้าที่ต้อง auth (เห็นแค่หน้า login ไม่ได้เห็นหน้าหลังล็อกอิน)
     · หน้าที่ต้องมี param — /jobs/[id], /g/quotation/[token] ฯลฯ
     · ข้อมูลถูกหรือผิด — เช็คแค่ว่า "มีเนื้อหา" ไม่ได้เช็คว่าเนื้อหาถูก
     · ความเร็ว — หน้าโหลด 8 วินาทีก็ยังนับว่าผ่าน

  เขียวที่นี่ = หน้าไม่ขาวและไม่มี error เท่านั้น`);
}

main().catch((err) => {
  console.error("✗ smoke ล้มเหลว:", err);
  process.exit(1);
});
