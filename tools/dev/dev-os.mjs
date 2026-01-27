import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "applications");
const IS_WIN = /^win/.test(process.platform);

console.log("🔍 Scanning for Gen2 TerraFusion modules...");
const appsToStart = [];

if (fs.existsSync(APPS_DIR)) {
  const folders = fs.readdirSync(APPS_DIR);
  for (const folder of folders) {
    const appDir = path.join(APPS_DIR, folder);
    const manifestPath = path.join(appDir, "terrafusion.app.json");
    
    if (fs.statSync(appDir).isDirectory() && fs.existsSync(manifestPath)) {
      try {
        const mf = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
        
        // FILTER: Only start explicitly PINNED apps
        if (mf.pinned) {
          // DETECT RUNTIME
          let runtime = null;
          let cmd = null;
          let args = [];

          if (fs.existsSync(path.join(appDir, "deno.json"))) {
            runtime = "Deno";
            cmd = "deno";
            args = ["task", "start"]; // Default Deno task
            // Check if 'dev' task exists instead
            try {
              const denoConfig = JSON.parse(fs.readFileSync(path.join(appDir, "deno.json"), "utf8"));
              if (denoConfig.tasks?.dev) args = ["task", "dev"];
            } catch { /* use default */ }

          } else if (fs.existsSync(path.join(appDir, "package.json"))) {
            runtime = "Node/pnpm";
            cmd = IS_WIN ? "pnpm.cmd" : "pnpm";
            args = ["dev"];
            
            // Check if node_modules exists
            if (!fs.existsSync(path.join(appDir, "node_modules"))) {
              console.log(`   ↳ SKIP ${mf.id}: no node_modules (run pnpm install)`);
              continue;
            }
          } else if (fs.existsSync(path.join(appDir, "Cargo.toml"))) {
            // Rust kernel - skip (not a web server)
            console.log(`   ↳ SKIP ${mf.id}: Rust kernel (not web)`);
            continue;
          }

          if (runtime) {
            appsToStart.push({ id: mf.id, dir: appDir, cmd, args, runtime });
          } else {
            console.log(`   ↳ SKIP ${mf.id}: No known runtime (deno.json/package.json missing)`);
          }
        }
      } catch (e) {
        console.warn(`⚠️ Skipped invalid manifest in ${folder}: ${e.message}`);
      }
    }
  }
}

console.log(`🚀 Igniting ${appsToStart.length} Gen2 modules...`);

appsToStart.forEach(app => {
  console.log(`   ► Starting ${app.id} (${app.runtime})...`);
  spawn(app.cmd, app.args, { 
    cwd: app.dir, 
    stdio: "inherit", 
    shell: true, 
    env: { ...process.env, FORCE_COLOR: "1" } 
  });
});

// Keep alive
setInterval(() => {}, 1000);
