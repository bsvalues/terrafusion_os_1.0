import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const APPS_DIRS = [path.join(ROOT, 'applications'), path.join(ROOT, 'apps')];
const IS_WIN = /^win/.test(process.platform);

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeCmd(cmd) {
  if (!IS_WIN) return cmd;
  if (cmd === 'pnpm') return 'pnpm.cmd';
  if (cmd === 'deno') return 'deno.exe';
  return cmd;
}

function resolveTemplate(value) {
  if (typeof value !== 'string') return value;

  return value.replace(/\$\{([A-Z0-9_]+)(?::-(.*?)|)\}/g, (_, key, fallback) => {
    const envValue = process.env[key];
    if (envValue && envValue.length > 0) return envValue;
    if (fallback !== undefined) return fallback;
    return '';
  });
}

function resolveLaunch(appDir, mf) {
  if (!mf?.start?.cmd) return null;

  const cmd = normalizeCmd(resolveTemplate(mf.start.cmd));
  const args = Array.isArray(mf.start.args) ? mf.start.args.map(resolveTemplate) : [];
  const cwdValue = mf.start.cwd ? resolveTemplate(mf.start.cwd) : null;
  const cwd = cwdValue ? path.resolve(appDir, cwdValue) : appDir;
  const runtime = mf.runtime || 'Custom';

  return { cmd, args, cwd, runtime };
}

function scanAutostartApps() {
  const found = [];

  for (const baseDir of APPS_DIRS) {
    if (!exists(baseDir)) continue;

    for (const folder of fs.readdirSync(baseDir)) {
      const appDir = path.join(baseDir, folder);
      const manifestPath = path.join(appDir, 'terrafusion.app.json');

      if (!isDir(appDir) || !exists(manifestPath)) continue;

      const mf = readJson(manifestPath);
      if (!mf) {
        console.log(`⚠️  Invalid JSON manifest: ${path.relative(ROOT, manifestPath)}`);
        continue;
      }

      if (!mf.autostart) continue;

      const launch = resolveLaunch(appDir, mf);
      if (!launch) {
        console.log(`   ↳ SKIP ${mf.id}: autostart but no start command`);
        continue;
      }

      const resolvedEntryUrl =
        mf.entry?.type === 'url' ? resolveTemplate(mf.entry.url) : null;

      found.push({ id: mf.id || folder, dir: appDir, entryUrl: resolvedEntryUrl, ...launch });
    }
  }

  return found;
}

console.log('🔍 Scanning for autostart TerraFusion modules (manifest-driven)...');
const appsToStart = scanAutostartApps();

console.log(`🚀 Igniting ${appsToStart.length} autostart module(s)...`);
appsToStart.forEach((app) => {
  const entrySuffix = app.entryUrl ? ` -> ${app.entryUrl}` : '';
  console.log(`   ► Starting ${app.id} (${app.runtime})${entrySuffix}...`);
  spawn(app.cmd, app.args, {
    cwd: app.cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });
});

setInterval(() => {}, 1000);
