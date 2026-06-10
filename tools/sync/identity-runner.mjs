#!/usr/bin/env node
// ============================================================================
// TerraFusion Sync — Identity-Drift Runner wrapper
// ----------------------------------------------------------------------------
// Runs identity-drift-detector.sql via psql and writes the raw pipe-
// delimited output to stdout.  Used by the Workbench server to serve
// POST /api/identity-drift/run.
//
// Output (two SQL statements, both with -t -A):
//   Statement 1 — per-table rows (6 columns, pipe-delimited):
//     lane_table|total|live|dangling|null_ref|verdict
//   Statement 2 — overall verdict (single column, no pipe):
//     OVERALL: PASS — no identity drift
//     OVERALL: FAIL — identity drift detected
//
// Exit codes:
//   0  — output written to stdout
//   2  — psql not found or query error
//
// Optional env overrides:
//   PG_HOST, PG_PORT, PG_DB, PG_USER, PGPASSWORD
// ============================================================================

import { execFile }         from 'child_process';
import { promisify }        from 'util';
import { resolve, dirname } from 'path';
import { fileURLToPath }    from 'url';

const runFile = promisify(execFile);
const TOOLS   = dirname(fileURLToPath(import.meta.url));

// ── DB config — same defaults as tf-sync-doctor.mjs ──────────────────────────
const PG_HOST     = process.env.PG_HOST    ?? '127.0.0.1';
const PG_PORT     = process.env.PG_PORT    ?? '5432';
const PG_DB       = process.env.PG_DB      ?? 'terrafusion';
const PG_USER     = process.env.PG_USER    ?? 'postgres';
const PG_PASSWORD = process.env.PGPASSWORD ?? 'devpassword123';
const CONN = `host=${PG_HOST} port=${PG_PORT} dbname=${PG_DB} user=${PG_USER}`;

const PSQL_CANDIDATES = [
  'C:/Program Files/PostgreSQL/17/bin/psql.exe',
  'C:/Program Files/PostgreSQL/16/bin/psql.exe',
  'C:/Program Files/PostgreSQL/15/bin/psql.exe',
  '/usr/bin/psql',
  '/usr/local/bin/psql',
  'psql',
];

async function findPsql() {
  for (const candidate of PSQL_CANDIDATES) {
    try {
      await runFile(candidate, ['--version'], {
        env:     { ...process.env, PGPASSWORD: PG_PASSWORD },
        timeout: 5_000,
      });
      return candidate;
    } catch { /* try next */ }
  }
  throw new Error(
    'psql not found. Add PostgreSQL bin directory to PATH, or set PG_* env vars.'
  );
}

async function main() {
  const psql = await findPsql();
  const { stdout } = await runFile(
    psql,
    [CONN, '-f', resolve(TOOLS, 'identity-drift-detector.sql'), '-t', '-A'],
    {
      env:     { ...process.env, PGPASSWORD: PG_PASSWORD },
      timeout: 300_000,
    }
  );
  process.stdout.write(stdout);
}

main().catch(e => {
  process.stderr.write('Fatal: ' + e.message + '\n');
  process.exit(2);
});
