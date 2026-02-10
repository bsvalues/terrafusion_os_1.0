#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════
// Platform Contract Lint — CI guardrail
// ═══════════════════════════════════════════════════════════════════════════
// Scans .github/workflows/ for violations of platform.json.
// Designed to run inside SEAL gate. Zero dependencies (Node built-ins only).
//
// Exit 0 = clean, Exit 1 = violations found.
// ═══════════════════════════════════════════════════════════════════════════

import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../..');
const CONTRACT_PATH = join(ROOT, 'platform.json');
const WORKFLOWS_DIR = join(ROOT, '.github', 'workflows');

// ── Load contract ──────────────────────────────────────────────────────────

let contract;
try {
  contract = JSON.parse(readFileSync(CONTRACT_PATH, 'utf8'));
} catch (err) {
  console.error(`❌ Cannot read platform.json: ${err.message}`);
  process.exit(1);
}

// ── Gather workflow files ──────────────────────────────────────────────────

let workflowFiles;
try {
  workflowFiles = readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
} catch {
  console.error('❌ Cannot read .github/workflows/');
  process.exit(1);
}

// ── Checks ─────────────────────────────────────────────────────────────────

const violations = [];

function violation(file, line, rule, message) {
  violations.push({ file, line, rule, message });
}

// Build lookup sets from contract
const deprecatedDirs = new Set(contract.deprecated?.outputDirs || []);
const deprecatedPorts = new Set(contract.deprecated?.ports?.values || []);
const canonicalDotnet = contract.sdk.dotnet;
const canonicalNode = contract.sdk.node;

// Workflow intent: only these should have pull_request triggers
const prGateSet = new Set([...(contract.ci.prGates || []), ...(contract.ci.eventReactive || [])]);

for (const file of workflowFiles) {
  const filePath = join(WORKFLOWS_DIR, file);
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    continue; // skip unreadable
  }

  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // ── Rule 1: Deprecated output dirs ──────────────────────────────────
    for (const dir of deprecatedDirs) {
      // Match the dir as a path reference, not in comments
      if (line.trimStart().startsWith('#')) continue;
      // Escape for regex (handle the slash)
      const escaped = dir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const rx = new RegExp(`(?:^|[\\s'"/])${escaped}`, 'i');
      if (rx.test(line)) {
        violation(
          file,
          lineNum,
          'DEPRECATED_OUTPUT_DIR',
          `References deprecated output dir "${dir}" — use "${contract.paths.frontend.buildOutput}" instead`
        );
      }
    }

    // ── Rule 2: Hardcoded deprecated ports ──────────────────────────────
    if (!line.trimStart().startsWith('#')) {
      for (const port of deprecatedPorts) {
        // Match port in URL patterns like localhost:PORT or 127.0.0.1:PORT
        const portRx = new RegExp(`(?:localhost|127\\.0\\.0\\.1)[:.]${port}\\b`);
        if (portRx.test(line)) {
          // Find which env var this port should use
          const portEntry = Object.entries(contract.ports).find(([, v]) => v.default === port);
          const hint = portEntry
            ? `Use \${${portEntry[1].env}:-${portEntry[1].default}}`
            : `Use env var from platform.json ports section`;
          violation(file, lineNum, 'HARDCODED_PORT', `Hardcoded port ${port} — ${hint}`);
        }
      }
    }

    // ── Rule 3: SDK version drift ───────────────────────────────────────
    // Check for dotnet-version that doesn't match contract
    if (!line.trimStart().startsWith('#')) {
      const dotnetMatch = line.match(/dotnet[-_]version\s*[:=]\s*['"]?(\d+\.\S+?)['"]?\s*$/i);
      if (dotnetMatch) {
        const found = dotnetMatch[1];
        if (found !== canonicalDotnet && found !== `'${canonicalDotnet}'`) {
          violation(
            file,
            lineNum,
            'SDK_DRIFT',
            `dotnet version "${found}" differs from contract "${canonicalDotnet}"`
          );
        }
      }

      // node-version that doesn't match (allow variants like 20.x, 20.11.1)
      const nodeMatch = line.match(/node[-_]version\s*[:=]\s*['"]?(\d+\S*?)['"]?\s*$/i);
      if (nodeMatch) {
        const found = nodeMatch[1].replace(/['"]/g, '');
        // Accept if found starts with canonical major (e.g. "20" matches "20", "20.x", "20.11.1")
        if (!found.startsWith(canonicalNode)) {
          violation(
            file,
            lineNum,
            'SDK_DRIFT',
            `Node version "${found}" differs from contract "${canonicalNode}"`
          );
        }
      }
    }

    // ── Rule 4: Trailing whitespace ─────────────────────────────────────
    if (line !== line.trimEnd() && line.trim().length > 0) {
      violation(file, lineNum, 'TRAILING_WHITESPACE', 'Line has trailing whitespace');
    }
  }

  // ── Rule 5: Non-constitutional workflow with pull_request trigger ────
  if (!prGateSet.has(file)) {
    // Normalize for regex matching (CRLF handled above for lines, but content may still have \r)
    const normalizedContent = content.replace(/\r/g, '');
    // Check if this workflow has a pull_request trigger
    const hasPRTrigger = /^\s*pull_request\s*:/m.test(normalizedContent);
    // Also catch pull_request_target but allow it (different use case)
    if (hasPRTrigger && !/pull_request_target/m.test(normalizedContent)) {
      violation(
        file,
        0,
        'PR_TRIGGER_LEAK',
        `Non-constitutional workflow has pull_request trigger — should be push-only or nightly per platform.json`
      );
    }
  }
}

// ── Report ─────────────────────────────────────────────────────────────────

if (violations.length === 0) {
  console.log('✅ Platform contract lint passed (0 violations)');
  process.exit(0);
}

// Group by rule for clarity
const byRule = {};
for (const v of violations) {
  if (!byRule[v.rule]) byRule[v.rule] = [];
  byRule[v.rule].push(v);
}

console.error(`\n❌ Platform contract lint: ${violations.length} violation(s)\n`);

for (const [rule, items] of Object.entries(byRule)) {
  console.error(`── ${rule} (${items.length}) ──`);
  for (const v of items) {
    const loc = v.line > 0 ? `:${v.line}` : '';
    console.error(`  ${v.file}${loc}: ${v.message}`);
  }
  console.error('');
}

// In CI, also emit annotations
if (process.env.CI) {
  for (const v of violations) {
    const loc = v.line > 0 ? `,line=${v.line}` : '';
    console.log(`::warning file=.github/workflows/${v.file}${loc}::${v.rule}: ${v.message}`);
  }
}

// Exit with warning (non-blocking) for now — upgrade to exit(1) once baseline is clean
// TODO: Change to process.exit(1) after initial cleanup
console.log(
  '\n⚠️  Platform lint running in WARNING mode. Will become blocking after baseline cleanup.'
);
process.exit(0);
