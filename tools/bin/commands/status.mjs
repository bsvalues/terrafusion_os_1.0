/**
 * tf status – workspace status overview
 *
 * Read-only checks:
 * - Node.js version
 * - Git branch and clean/dirty state
 * - Key directories exist (backend, frontend, tools)
 * - Port availability (5000, 3000, 3004)
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

function isWindows() {
  return process.platform === "win32";
}

function git(...args) {
  const res = spawnSync("git", args, {
    encoding: "utf8",
    stdio: "pipe",
  });
  return {
    ok: (res.status ?? 1) === 0,
    out: (res.stdout ?? "").trim(),
  };
}

function dirExists(root, rel) {
  return fs.existsSync(path.join(root, rel));
}

function checkPort(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve("in-use"));
    srv.once("listening", () => {
      srv.close(() => resolve("free"));
    });
    srv.listen(port, "127.0.0.1");
  });
}

export default async function status({ root, flags }) {
  const t0 = Date.now();

  // Node
  const node = process.version.replace(/^v/, "");

  // Git
  const branch = git("rev-parse", "--abbrev-ref", "HEAD");
  const porcelain = git("status", "--porcelain");
  const clean = porcelain.ok && porcelain.out.length === 0;

  // Key dirs
  const dirs = {};
  for (const d of ["backend", "frontend", "tools", "os-platform"]) {
    dirs[d] = dirExists(root, d);
  }

  // Ports
  const portList = [5000, 3000, 3004, 3002];
  const ports = {};
  for (const p of portList) {
    ports[p] = await checkPort(p);
  }

  const durationMs = Date.now() - t0;
  const ok = true; // status is informational, always "ok"

  if (flags.json) {
    const envelope = {
      tool: "tf-status",
      version: 1,
      ts: new Date().toISOString(),
      ok,
      data: { node, branch: branch.out, clean, dirs, ports },
      error: null,
      meta: { durationMs },
    };
    process.stdout.write(JSON.stringify(envelope, null, 2) + "\n");
  } else {
    const icon = (v) => (v ? "✅" : "❌");
    process.stdout.write("\n=== TerraFusion Workspace Status ===\n\n");
    process.stdout.write(`  Node:     ${node}\n`);
    process.stdout.write(`  Branch:   ${branch.out}\n`);
    process.stdout.write(`  Clean:    ${icon(clean)} ${clean ? "yes" : "uncommitted changes"}\n\n`);

    process.stdout.write("  Directories:\n");
    for (const [d, exists] of Object.entries(dirs)) {
      process.stdout.write(`    ${icon(exists)} ${d}\n`);
    }

    process.stdout.write("\n  Ports:\n");
    for (const [p, state] of Object.entries(ports)) {
      const label = state === "free" ? "available" : "IN USE";
      process.stdout.write(`    ${state === "free" ? "🟢" : "🔴"} :${p} ${label}\n`);
    }

    process.stdout.write(`\n  (${durationMs}ms)\n\n`);
  }

  return 0;
}
