#!/usr/bin/env node
/**
 * Naming Governance Lint (read-only)
 * - Config-driven product label scanner.
 * - Phase C rename sweep is deferred; this PR only detects banned placeholders.
 *
 * Exit codes:
 *  - 0: ok
 *  - 1: violations found OR invalid config
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import readline from "node:readline";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const args = argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith("--")));
  const get = (name, fallback) => {
    const i = args.indexOf(name);
    if (i === -1) return fallback;
    const v = args[i + 1];
    return v ?? fallback;
  };
  return {
    json: flags.has("--json"),
    verbose: flags.has("--verbose"),
    configPath: get("--config", "tools/naming/naming-lint.config.json"),
    root: get("--root", undefined),
  };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function validateConfig(cfg) {
  const errors = [];
  if (!cfg || typeof cfg !== "object") errors.push("Config must be an object.");
  if (typeof cfg.version !== "number") errors.push("Config.version must be a number.");

  if (!Array.isArray(cfg.bannedPhrases) || cfg.bannedPhrases.length === 0) {
    errors.push("Config.bannedPhrases must be a non-empty array.");
  } else {
    for (const [i, r] of cfg.bannedPhrases.entries()) {
      if (!r || typeof r !== "object") errors.push(`bannedPhrases[${i}] must be an object.`);
      if (typeof r.phrase !== "string" || r.phrase.trim() === "") {
        errors.push(`bannedPhrases[${i}].phrase must be a non-empty string.`);
      }
      if (typeof r.message !== "string" || r.message.trim() === "") {
        errors.push(`bannedPhrases[${i}].message must be a non-empty string.`);
      }
    }
  }

  if (!Array.isArray(cfg.extensions) || cfg.extensions.length === 0) {
    errors.push("Config.extensions must be a non-empty array.");
  }
  if (!Array.isArray(cfg.excludeDirs)) errors.push("Config.excludeDirs must be an array.");
  if (!Array.isArray(cfg.excludeFiles)) errors.push("Config.excludeFiles must be an array.");
  if (typeof cfg.maxFileBytes !== "number" || cfg.maxFileBytes <= 0) {
    errors.push("Config.maxFileBytes must be a positive number.");
  }
  if (!Array.isArray(cfg.required)) errors.push("Config.required must be an array.");

  return errors;
}

function statSafe(p) {
  try {
    return fs.statSync(p);
  } catch {
    return null;
  }
}

function hasAllowedExtension(filePath, cfg) {
  return cfg.extensions.includes(path.extname(filePath));
}

function shouldSkipDir(name, cfg) {
  return cfg.excludeDirs.includes(name);
}

function shouldSkipFile(name, cfg) {
  return cfg.excludeFiles.includes(name);
}

export function walkDir(rootDir, cfg) {
  const out = [];
  const stack = [rootDir];

  while (stack.length) {
    const current = stack.pop();
    if (!current) continue;
    const st = statSafe(current);
    if (!st) continue;

    if (st.isDirectory()) {
      const base = path.basename(current);
      if (shouldSkipDir(base, cfg)) continue;

      const entries = fs
        .readdirSync(current, { withFileTypes: true })
        .map((e) => e.name)
        .sort((a, b) => a.localeCompare(b));

      for (let i = entries.length - 1; i >= 0; i -= 1) {
        stack.push(path.join(current, entries[i]));
      }
    } else if (st.isFile()) {
      const base = path.basename(current);
      if (shouldSkipFile(base, cfg)) continue;
      if (!hasAllowedExtension(current, cfg)) continue;
      if (st.size > cfg.maxFileBytes) continue;
      out.push(current);
    }
  }

  return out.sort((a, b) => a.localeCompare(b));
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function scanFileForPhrases(filePath, rules) {
  const hits = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
  for await (const line of rl) {
    lineNo += 1;
    for (const rule of rules) {
      const re = new RegExp(escapeRegExp(rule.phrase), "g");
      let m;
      while ((m = re.exec(line)) !== null) {
        hits.push({
          file: filePath,
          line: lineNo,
          col: m.index + 1,
          phrase: rule.phrase,
          message: rule.message,
          excerpt: line.length > 240 ? `${line.slice(0, 240)}...` : line,
        });
      }
    }
  }

  return hits;
}

export async function runNamingLint({
  argv = process.argv,
  cwd = process.cwd(),
  stdout = process.stdout,
  stderr = process.stderr,
} = {}) {
  const args = parseArgs(argv);

  const configAbs = path.isAbsolute(args.configPath)
    ? args.configPath
    : path.resolve(cwd, args.configPath);

  let cfg;
  try {
    cfg = readJson(configAbs);
  } catch (e) {
    stderr.write(`Failed to read config: ${configAbs}\n${e?.message ?? String(e)}\n`);
    return 1;
  }

  const errors = validateConfig(cfg);
  if (errors.length) {
    stderr.write("Invalid naming-lint config:\n");
    for (const e of errors) stderr.write(` - ${e}\n`);
    return 1;
  }

  const root = args.root ? path.resolve(cwd, args.root) : path.resolve(cwd, cfg.root ?? ".");

  const missingRequired = (cfg.required || []).filter((rel) => !fs.existsSync(path.resolve(root, rel)));

  const files = walkDir(root, cfg);
  const hits = [];
  for (const f of files) {
    try {
      hits.push(...(await scanFileForPhrases(f, cfg.bannedPhrases)));
    } catch (e) {
      if (args.verbose) {
        stderr.write(`Skipped unreadable file: ${path.relative(root, f)} (${e?.message ?? e})\n`);
      }
    }
  }

  const result = {
    tool: "naming-lint",
    version: 1,
    config: path.relative(cwd, configAbs),
    root: path.relative(cwd, root),
    filesScanned: files.length,
    requiredMissing: missingRequired,
    violations: hits.map((h) => ({ ...h, file: path.relative(root, h.file) })),
    ok: hits.length === 0 && missingRequired.length === 0,
  };

  if (args.json) {
    stdout.write(JSON.stringify(result, null, 2) + "\n");
  } else {
    stdout.write("=== Naming Governance Report ===\n");
    stdout.write(`Root: ${result.root}\n`);
    stdout.write(`Files scanned: ${result.filesScanned}\n`);

    if (missingRequired.length) {
      stdout.write("\nMissing required files:\n");
      for (const m of missingRequired) stdout.write(` - ${m}\n`);
    }

    if (!result.violations.length) {
      stdout.write("\nNo banned product labels found.\n");
    } else {
      stdout.write(`\nFound ${result.violations.length} violation(s):\n\n`);
      for (const v of result.violations) {
        stdout.write(
          ` - ${v.file}:${v.line}:${v.col} - "${v.phrase}"\n   -> ${v.message}\n   -> ${v.excerpt}\n`,
        );
      }
    }

    stdout.write(`\n${result.ok ? "PASS" : "FAIL"}\n`);
  }

  return result.ok ? 0 : 1;
}

async function main() {
  process.exitCode = await runNamingLint();
}

const invokedAsScript = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) {
  void main();
}
