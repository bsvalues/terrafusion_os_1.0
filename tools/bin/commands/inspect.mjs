/**
 * tf inspect – agent-first discovery command
 *
 * Subcommands:
 *   scripts   List all npm scripts as JSON
 *   ports     Show port allocation and usage
 *   modules   List all terrafusion.app.json manifests
 *   tools     List all tools/* entry points
 *
 * All output follows the standard agent envelope format.
 */

import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { createEnvelope, writeEnvelope } from "../lib/agent-envelope.mjs";

const SUBS = {
  scripts: { desc: "List all npm scripts", fn: inspectScripts },
  ports:   { desc: "Show port allocation and usage", fn: inspectPorts },
  modules: { desc: "List terrafusion.app.json manifests", fn: inspectModules },
  tools:   { desc: "List tools/* entry points", fn: inspectTools },
};

function printHelp() {
  const lines = [
    "",
    "tf inspect – agent-first discovery",
    "",
    "Usage:  tf inspect <subcommand> [--json]",
    "",
    "Subcommands:",
  ];
  for (const [name, sub] of Object.entries(SUBS)) {
    lines.push(`  ${name.padEnd(12)} ${sub.desc}`);
  }
  lines.push("");
  process.stdout.write(lines.join("\n") + "\n");
}

export default async function inspect({ root, flags, rest }) {
  if (flags.help || !rest[0]) { printHelp(); return 0; }

  const sub = rest[0];
  const entry = SUBS[sub];
  if (!entry) {
    process.stderr.write(`Unknown inspect subcommand: ${sub}\n`);
    printHelp();
    return 1;
  }

  return entry.fn(root, flags);
}

// ── scripts ─────────────────────────────────────────────────

function inspectScripts(root, flags) {
  const env = createEnvelope("tf-inspect-scripts");
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const scripts = pkg.scripts ?? {};
    const entries = Object.entries(scripts).map(([name, cmd]) => ({ name, cmd }));
    const envelope = env.finish(true, { count: entries.length, scripts: entries });

    if (flags.json) {
      return writeEnvelope(envelope);
    }
    process.stdout.write(`${entries.length} npm scripts found:\n`);
    for (const s of entries) {
      process.stdout.write(`  ${s.name}\n`);
    }
    return 0;
  } catch (err) {
    return writeEnvelope(env.fail(err));
  }
}

// ── ports ───────────────────────────────────────────────────

const KNOWN_PORTS = [
  { port: 3000, service: "Frontend (Vite)" },
  { port: 3002, service: "Gateway (Shell)" },
  { port: 3004, service: "Consciousness" },
  { port: 5000, service: "API (Kernel)" },
  { port: 5432, service: "PostgreSQL" },
  { port: 6379, service: "Redis" },
  { port: 8500, service: "Consul" },
];

function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve({ port, available: false }));
    server.once("listening", () => {
      server.close(() => resolve({ port, available: true }));
    });
    server.listen(port, "127.0.0.1");
  });
}

async function inspectPorts(root, flags) {
  const env = createEnvelope("tf-inspect-ports");
  try {
    const results = await Promise.all(
      KNOWN_PORTS.map(async (p) => {
        const check = await checkPort(p.port);
        return { ...p, available: check.available, status: check.available ? "free" : "in-use" };
      })
    );
    const envelope = env.finish(true, { ports: results });

    if (flags.json) {
      return writeEnvelope(envelope);
    }
    process.stdout.write("Port allocation:\n");
    for (const r of results) {
      const icon = r.available ? "  " : "* ";
      process.stdout.write(`  ${icon}${String(r.port).padEnd(6)} ${r.service.padEnd(22)} ${r.status}\n`);
    }
    return 0;
  } catch (err) {
    return writeEnvelope(env.fail(err));
  }
}

// ── modules ─────────────────────────────────────────────────

function findFiles(dir, name, maxDepth = 5, depth = 0) {
  const results = [];
  if (depth > maxDepth) return results;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return results; }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git") continue;
    const full = path.join(dir, e.name);
    if (e.isFile() && e.name === name) results.push(full);
    else if (e.isDirectory()) results.push(...findFiles(full, name, maxDepth, depth + 1));
  }
  return results;
}

function inspectModules(root, flags) {
  const env = createEnvelope("tf-inspect-modules");
  try {
    const manifests = findFiles(root, "terrafusion.app.json");
    const modules = manifests.map((fp) => {
      try {
        const data = JSON.parse(fs.readFileSync(fp, "utf8"));
        return {
          path: path.relative(root, fp).replace(/\\/g, "/"),
          name: data.name ?? path.basename(path.dirname(fp)),
          runtime: data.runtime ?? null,
          autostart: data.autostart ?? false,
          pinned: data.pinned ?? false,
        };
      } catch {
        return { path: path.relative(root, fp).replace(/\\/g, "/"), name: "unknown", error: "parse-failed" };
      }
    });
    const envelope = env.finish(true, { count: modules.length, modules });

    if (flags.json) {
      return writeEnvelope(envelope);
    }
    process.stdout.write(`${modules.length} module manifests found:\n`);
    for (const m of modules) {
      const auto = m.autostart ? " [autostart]" : "";
      process.stdout.write(`  ${m.name.padEnd(30)} ${m.path}${auto}\n`);
    }
    return 0;
  } catch (err) {
    return writeEnvelope(env.fail(err));
  }
}

// ── tools ───────────────────────────────────────────────────

function inspectTools(root, flags) {
  const env = createEnvelope("tf-inspect-tools");
  try {
    const toolsDir = path.join(root, "tools");
    const allFiles = findFiles(toolsDir, null);
    // findFiles with null name won't match — use a different approach
    const entries = [];
    collectToolEntries(toolsDir, entries, root, 0);

    const envelope = env.finish(true, { count: entries.length, tools: entries });

    if (flags.json) {
      return writeEnvelope(envelope);
    }
    process.stdout.write(`${entries.length} tool entry points found:\n`);
    for (const t of entries) {
      process.stdout.write(`  ${t.path}\n`);
    }
    return 0;
  } catch (err) {
    return writeEnvelope(env.fail(err));
  }
}

function collectToolEntries(dir, results, root, depth) {
  if (depth > 3) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === "tests" || e.name === ".git") continue;
    const full = path.join(dir, e.name);
    if (e.isFile() && (e.name.endsWith(".mjs") || e.name.endsWith(".js"))) {
      results.push({ path: path.relative(root, full).replace(/\\/g, "/"), name: e.name });
    } else if (e.isDirectory()) {
      collectToolEntries(full, results, root, depth + 1);
    }
  }
}
