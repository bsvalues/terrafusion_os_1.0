import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "applications");

console.log("🔍 Scanning for Gen2 TerraFusion modules...");
const appsToStart = [];

if (fs.existsSync(APPS_DIR)) {
  const folders = fs.readdirSync(APPS_DIR);
  for (const folder of folders) {
    const manifestPath = path.join(APPS_DIR, folder, "terrafusion.app.json");
    if (fs.existsSync(manifestPath)) {
      try {
        const mf = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        // Gen2 Policy: Only start modules where intent=gen2 AND runnable=true AND entry.type=url
        if (mf?.intent === "gen2" && mf?.runnable === true && mf?.entry?.type === "url") {
          appsToStart.push({ id: mf.id, dir: path.join(APPS_DIR, folder) });
        }
      } catch {
        console.warn(`⚠️ Skipped invalid manifest in ${folder}`);
      }
    }
  }
}

console.log(`🚀 Igniting ${appsToStart.length} modules...`);

const isWin = /^win/i.test(process.platform);
const pnpmCmd = isWin ? "pnpm.cmd" : "pnpm";

appsToStart.forEach((app) => {
  console.log(`   ► Starting ${app.id}...`);
  const pkgPath = path.join(app.dir, "package.json");
  if (!fs.existsSync(pkgPath)) {
    console.log(`   ↳ SKIP ${app.id}: no package.json`);
    return;
  }
  const nodeModulesPath = path.join(app.dir, "node_modules");
  if (!fs.existsSync(nodeModulesPath)) {
    console.log(`   ↳ SKIP ${app.id}: no node_modules (run pnpm install)`);
    return;
  }

  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  } catch {
    console.log(`   ↳ SKIP ${app.id}: invalid package.json`);
    return;
  }
  if (!pkg?.scripts?.dev) {
    console.log(`   ↳ SKIP ${app.id}: no dev script`);
    return;
  }

  const spawnCmd = isWin ? "cmd.exe" : pnpmCmd;
  const spawnArgs = isWin ? ["/c", pnpmCmd, "run", "dev"] : ["run", "dev"];

  spawn(spawnCmd, spawnArgs, {
    cwd: app.dir,
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "1" },
    shell: false,
  });
});

setInterval(() => {}, 1000);
