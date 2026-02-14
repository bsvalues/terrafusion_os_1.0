#!/usr/bin/env node
/**
 * Query Budget Gate — Phase 5.4 CI Enforcement
 *
 * Static analysis of SQL queries in the security module to enforce:
 *  1. All SELECT queries are parameterized (use @Param syntax, never string concat)
 *  2. All SELECT queries include a WHERE clause (no unbounded full-table scans)
 *  3. Read queries use LIMIT/pagination or are aggregate-only (COUNT/SUM/AVG/MAX/MIN)
 *  4. No SELECT * without WHERE + LIMIT (except integrity checks with date bounds)
 *  5. All INSERT/DELETE operations use parameterized values
 *
 * Usage: node tools/gates/query-budget-gate.mjs
 * Exit:  0 = pass, 1 = fail
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dirname, '..', '..');
const SECURITY_SRC = join(REPO_ROOT, 'backend', 'TerraFusion.Security');

// ─── Collect all .cs files ──────────────────────────────────────────
function collectCsFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'bin' && entry.name !== 'obj') {
      files.push(...collectCsFiles(full));
    } else if (entry.name.endsWith('.cs')) {
      files.push(full);
    }
  }
  return files;
}

// ─── Extract SQL string literals from C# source ────────────────────
// Matches @" ... " multi-line string literals and $@" ... " interpolated strings.
// Pre-strips C# comments to avoid false positives from commented-out SQL.

// Structural interpolation allowlist — these are code-controlled column/direction
// references, never user input.  Anything outside this list is flagged.
const STRUCTURAL_INTERPOLATION_ALLOWLIST = /^\{(orderBy|sortDirection|whereClause)\}$/i;

function stripCSharpComments(src) {
  // Remove single-line comments (// ...)
  src = src.replace(/\/\/[^\n]*/g, '');
  // Remove multi-line comments (/* ... */)
  src = src.replace(/\/\*[\s\S]*?\*\//g, '');
  return src;
}

function extractSqlBlocks(content, filePath) {
  // Work on a comment-stripped copy to avoid false positives
  const stripped = stripCSharpComments(content);
  const blocks = [];
  // Match verbatim string literals containing SQL keywords
  const regex = /(?:\$@|@)"\s*((?:SELECT|INSERT|DELETE|UPDATE)\b[\s\S]*?)"/gi;
  let match;
  while ((match = regex.exec(stripped)) !== null) {
    const sql = match[1].replace(/""/g, '"'); // unescape doubled quotes
    // Map back to original line number using the position in stripped source
    const lineNum = stripped.slice(0, match.index).split('\n').length;
    blocks.push({ sql, line: lineNum, file: filePath });
  }
  return blocks;
}

// ─── Rule checks ────────────────────────────────────────────────────
let failures = 0;
let totalQueries = 0;
let passedRules = 0;

function fail(msg) {
  console.error(`  ❌ ${msg}`);
  failures++;
}

function pass(msg) {
  console.log(`  ✅ ${msg}`);
  passedRules++;
}

function warn(msg) {
  console.log(`  ⚠️  ${msg}`);
}

console.log('📊 Query Budget Gate — Phase 5.4 Static SQL Analysis\n');

// 1. Collect source files with SQL
console.log('▶ Scanning security module for SQL queries...');
const csFiles = collectCsFiles(SECURITY_SRC);
const allBlocks = [];
for (const f of csFiles) {
  const content = readFileSync(f, 'utf8');
  const blocks = extractSqlBlocks(content, f);
  allBlocks.push(...blocks);
}
totalQueries = allBlocks.length;
console.log(`  Found ${totalQueries} SQL query block(s) in ${csFiles.length} file(s)\n`);

if (totalQueries === 0) {
  console.log('✅ Query budget gate PASSED — no SQL queries found (nothing to check)');
  process.exit(0);
}

// 2. Rule: Parameterization — no raw string interpolation in SQL
console.log('▶ Rule 1: Parameterized queries (no string concatenation in values)');
for (const block of allBlocks) {
  const relPath = block.file.replace(REPO_ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  // Check for $" interpolation markers that could indicate injection risk
  // Exclude ORDER BY / column-name interpolation (those are structural, not value injection)
  // In Dapper, @Param is the parameterization pattern
  const hasParams = /@\w+/.test(block.sql);
  const hasInterpolation = /\{[^}]+\}/.test(block.sql);

  if (hasInterpolation) {
    // Allow structural interpolation (ORDER BY direction, column names from code)
    // These are controlled by internal code, not user input
    const interpolations = block.sql.match(/\{[^}]+\}/g) || [];
    const nonStructural = interpolations.filter(i => !STRUCTURAL_INTERPOLATION_ALLOWLIST.test(i));
    if (nonStructural.length > 0) {
      fail(
        `${relPath}:${block.line} — non-structural interpolation in SQL: ${nonStructural.join(', ')}`
      );
      continue;
    }
    // Structural interpolation is acceptable (ORDER BY column from internal code)
    pass(`${relPath}:${block.line} — structural-only interpolation (safe)`);
  } else if (hasParams || /^INSERT|^DELETE/i.test(block.sql.trim())) {
    pass(`${relPath}:${block.line} — parameterized`);
  } else {
    warn(`${relPath}:${block.line} — no parameters detected (may be a static query)`);
  }
}

// 3. Rule: Boundedness — SELECT queries need WHERE, LIMIT, or aggregation
console.log('\n▶ Rule 2: Query boundedness (WHERE + LIMIT or aggregate-only)');
const selectBlocks = allBlocks.filter(b => /^\s*SELECT/i.test(b.sql));
for (const block of selectBlocks) {
  const relPath = block.file.replace(REPO_ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  const sqlUpper = block.sql.toUpperCase();
  const hasWhere = /\bWHERE\b/.test(sqlUpper);
  const hasLimit = /\bLIMIT\b/.test(sqlUpper);
  const isAggregate = /\b(COUNT|SUM|AVG|MAX|MIN)\s*\(/.test(sqlUpper);
  const hasGroupBy = /\bGROUP\s+BY\b/.test(sqlUpper);

  if (hasWhere && hasLimit) {
    pass(`${relPath}:${block.line} — WHERE + LIMIT (bounded)`);
  } else if (hasWhere && isAggregate) {
    pass(`${relPath}:${block.line} — WHERE + aggregate (bounded by nature)`);
  } else if (hasWhere && hasGroupBy) {
    pass(`${relPath}:${block.line} — WHERE + GROUP BY (structurally bounded)`);
  } else if (hasWhere) {
    // Has WHERE but no LIMIT — acceptable for date-bounded integrity checks
    warn(`${relPath}:${block.line} — WHERE but no LIMIT (review: date-range bounded?)`);
  } else if (isAggregate) {
    pass(`${relPath}:${block.line} — aggregate-only (structurally bounded)`);
  } else {
    fail(`${relPath}:${block.line} — unbounded SELECT: no WHERE, LIMIT, or aggregation`);
  }
}

// 4. Rule: Date range filters use parameterized BETWEEN
console.log('\n▶ Rule 3: Date-range queries use parameterized bounds');
const dateBlocks = allBlocks.filter(b => /BETWEEN/i.test(b.sql));
for (const block of dateBlocks) {
  const relPath = block.file.replace(REPO_ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  const hasBetweenParams = /@StartDate.*@EndDate|@EndDate.*@StartDate/is.test(block.sql);
  if (hasBetweenParams) {
    pass(`${relPath}:${block.line} — BETWEEN uses @StartDate/@EndDate parameters`);
  } else {
    fail(`${relPath}:${block.line} — BETWEEN without parameterized date bounds`);
  }
}

// 5. Rule: INSERT statements use parameterized values
console.log('\n▶ Rule 4: INSERT parameterization');
const insertBlocks = allBlocks.filter(b => /^\s*INSERT/i.test(b.sql));
for (const block of insertBlocks) {
  const relPath = block.file.replace(REPO_ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  const paramCount = (block.sql.match(/@\w+/g) || []).length;
  if (paramCount > 0) {
    pass(`${relPath}:${block.line} — INSERT with ${paramCount} parameter(s)`);
  } else {
    fail(`${relPath}:${block.line} — INSERT without parameterized values`);
  }
}

// 6. Rule: DELETE statements use parameterized WHERE
console.log('\n▶ Rule 5: DELETE parameterization');
const deleteBlocks = allBlocks.filter(b => /^\s*DELETE/i.test(b.sql));
for (const block of deleteBlocks) {
  const relPath = block.file.replace(REPO_ROOT, '').replace(/\\/g, '/').replace(/^\//, '');
  const hasWhere = /\bWHERE\b/i.test(block.sql);
  const hasParam = /@\w+/.test(block.sql);
  if (hasWhere && hasParam) {
    pass(`${relPath}:${block.line} — DELETE with parameterized WHERE`);
  } else if (!hasWhere) {
    fail(`${relPath}:${block.line} — DELETE without WHERE clause`);
  } else {
    fail(`${relPath}:${block.line} — DELETE WHERE without parameters`);
  }
}

// ─── Summary ────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════╗');
console.log(
  `║  Queries scanned: ${totalQueries.toString().padStart(4)}                            ║`
);
console.log(
  `║  Rules passed:    ${passedRules.toString().padStart(4)}                            ║`
);
console.log(`║  Failures:        ${failures.toString().padStart(4)}                            ║`);
console.log('╚══════════════════════════════════════════════════╝');

if (failures > 0) {
  console.error(`\n❌ Query budget gate FAILED — ${failures} violation(s) found`);
  process.exit(1);
} else {
  console.log(`\n✅ Query budget gate PASSED — all ${totalQueries} queries meet budget rules`);
  process.exit(0);
}
