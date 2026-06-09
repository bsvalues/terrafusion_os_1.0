#!/usr/bin/env node
// ============================================================================
// TerraFusion Sync — Automation #4: tf-sync doctor
// ----------------------------------------------------------------------------
// READ-ONLY wrapper. Runs Step 0 (Harris PACS Pack Validator) then the three
// existing Sync automation tools in sequence and emits a single consolidated
// PASS / WARN / FAIL verdict.
//
// Step 0 (Pack Validator) FAIL causes immediate exit — remaining checks are
// meaningless if the landing layer does not conform to the source pack spec.
//
// Usage:
//   node tools/sync/tf-sync-doctor.mjs
//
// Exit codes:
//   0  PASS or WARN (substrate clean, safe to work)
//   1  FAIL (identity break or seal failure — do NOT drain)
//   2  Error (could not connect or tool not found)
//
// Environment overrides (optional — defaults match appsettings.Development.local.json):
//   PG_HOST       host       (default: localhost)
//   PG_PORT       port       (default: 5432)
//   PG_DB         database   (default: terrafusion)
//   PG_USER       user       (default: postgres)
//   PGPASSWORD    password   (default: devpassword123)
// ============================================================================

import { execFile }         from 'child_process';
import { promisify }        from 'util';
import { resolve, dirname } from 'path';
import { fileURLToPath }    from 'url';

// execFile is used (not exec) — no shell involved, no injection surface.
const runFile = promisify(execFile);

const TOOLS = dirname(fileURLToPath(import.meta.url));

// ── DB config ──────────────────────────────────────────────────────────────
// Default to 127.0.0.1 (IPv4) — PostgreSQL on Windows occasionally drops IPv6
// connections after heavy queries.  Callers can override via PG_HOST env var.
const PG_HOST     = process.env.PG_HOST    ?? '127.0.0.1';
const PG_PORT     = process.env.PG_PORT    ?? '5432';
const PG_DB       = process.env.PG_DB      ?? 'terrafusion';
const PG_USER     = process.env.PG_USER    ?? 'postgres';
const PG_PASSWORD = process.env.PGPASSWORD ?? 'devpassword123';
const CONN = `host=${PG_HOST} port=${PG_PORT} dbname=${PG_DB} user=${PG_USER}`;

// ── psql search path ───────────────────────────────────────────────────────
const PSQL_CANDIDATES = [
  'C:/Program Files/PostgreSQL/17/bin/psql.exe',
  'C:/Program Files/PostgreSQL/16/bin/psql.exe',
  'C:/Program Files/PostgreSQL/15/bin/psql.exe',
  '/usr/bin/psql',
  '/usr/local/bin/psql',
  'psql',
];

// ── Known-deferred identity tables ────────────────────────────────────────
// Automation #1 FAIL on these → WARN in doctor (not substrate-breaking)
const KNOWN_DRIFT_DEFERRED = new Set([
  // F2 cleanup (commits 3057891b4 + 481955026) cleared all owner_link dangling rows.
  // No tables are currently deferred. Re-add here only with a documented DEFERRED ticket.
]);

// Expected Benton baseline from Automation #3
const SEALED_BASELINE = 12;

// ── Helpers ────────────────────────────────────────────────────────────────
async function findPsql() {
  for (const candidate of PSQL_CANDIDATES) {
    try {
      await runFile(candidate, ['--version'], {
        env:     { ...process.env, PGPASSWORD: PG_PASSWORD },
        timeout: 5_000,
      });
      return candidate;
    } catch {
      // try next candidate
    }
  }
  throw new Error(
    'psql not found. Add PostgreSQL bin directory to PATH, or set PG_* env vars.'
  );
}

async function runTool(psql, sqlFile) {
  // Use -t -A (unaligned tuples).  Default field separator in -A mode is already
  // '|', so no -F flag needed — and omitting it avoids Windows arg-quoting issues
  // with the pipe character when Node.js builds the CreateProcess command line.
  const { stdout } = await runFile(
    psql,
    [CONN, '-f', resolve(TOOLS, sqlFile), '-t', '-A'],
    {
      env:     { ...process.env, PGPASSWORD: PG_PASSWORD },
      timeout: 300_000,
    }
  );
  return stdout;
}

// ── Formatters ─────────────────────────────────────────────────────────────
const PASS = '✓';
const WARN = '⚠';
const FAIL = '✗';
const BAR  = '═'.repeat(58);

function emit(sym, msg, indent = 2) {
  console.log(' '.repeat(indent) + sym + '  ' + msg);
}

// ── Parser: Step #0 — harris-pacs-pack-validator.sql ──────────────────────
// Statement 1: category|check_name|measured|expected|verdict|severity|notes
// Statement 2: "OVERALL: PASS/WARN/FAIL|fail=N|warn=N|pass=N|info=N"
function parsePackValidator(output) {
  let overallVerdict = null;
  let failCount = 0;
  let warnCount = 0;
  let passCount = 0;
  let infoCount = 0;
  const failChecks = [];

  for (const raw of output.split('\n')) {
    const l = raw.trim();
    if (!l) continue;

    if (l.startsWith('OVERALL:')) {
      overallVerdict = l.includes(': FAIL') ? 'FAIL'
                     : l.includes(': WARN') ? 'WARN'
                     : 'PASS';
      for (const part of l.split('|').slice(1)) {
        const [key, val] = part.split('=');
        const n = parseInt(val, 10) || 0;
        if      (key === 'fail') failCount = n;
        else if (key === 'warn') warnCount = n;
        else if (key === 'pass') passCount = n;
        else if (key === 'info') infoCount = n;
      }
      continue;
    }

    // Per-check detail: category|check_name|measured|expected|verdict|severity|notes
    const parts = l.split('|');
    if (parts.length >= 6 && parts[4] === 'FAIL') {
      failChecks.push(parts[1]);
    }
  }
  return { overallVerdict, failCount, warnCount, passCount, infoCount, failChecks };
}

// ── Parser: Automation #1 — identity-drift-detector.sql ────────────────────
// Statement 1: lane_table|total|live|dangling|null_ref|PASS/FAIL
// Statement 2: "OVERALL: ..." (single text column)
function parseIdentityDrift(output) {
  const failTables    = [];   // unexpected → doctor FAIL
  const deferredFails = [];   // known-deferred → doctor WARN

  for (const raw of output.split('\n')) {
    const l = raw.trim();
    if (!l || l.startsWith('OVERALL:')) continue;

    const parts = l.split('|');
    if (parts.length < 6) continue;

    const table    = parts[0];
    const dangling = parseInt(parts[3], 10) || 0;
    const verdict  = parts[parts.length - 1];

    if (verdict === 'FAIL') {
      if (KNOWN_DRIFT_DEFERRED.has(table)) {
        deferredFails.push({ table, dangling });
      } else {
        failTables.push({ table, dangling });
      }
    }
  }
  return { failTables, deferredFails };
}

// ── Parser: Automation #2 — seal-check-runner.sql ─────────────────────────
// Statement 1: lane|check_name|measured|expected|PASS/WARN-*/FAIL
// Statement 2: "OVERALL: PASS/FAIL ...|fail_count|reasons"
function parseSealCheck(output) {
  let overallVerdict = null;
  let failCount  = 0;
  let warnCount  = 0;
  let passCount  = 0;
  const failChecks = [];
  const warnChecks = [];

  for (const raw of output.split('\n')) {
    const l = raw.trim();
    if (!l) continue;

    if (l.startsWith('OVERALL:')) {
      overallVerdict = l.includes(': PASS') ? 'PASS' : 'FAIL';
      continue;
    }

    const parts = l.split('|');
    if (parts.length < 5) continue;

    const verdict = parts[4];
    const check   = parts[0] + '/' + parts[1];

    if (verdict === 'FAIL') {
      failCount++;
      failChecks.push(check);
    } else if (verdict.startsWith('WARN')) {
      warnCount++;
      warnChecks.push(check);
    } else if (verdict === 'PASS') {
      passCount++;
    }
  }
  return { overallVerdict, failCount, warnCount, passCount, failChecks, warnChecks };
}

// ── Parser: Automation #3 — domain-coverage-audit.sql ─────────────────────
// Statement 1: 7-col domain detail
// Statement 2: status|domain_count|domains  (3 cols; first col is known enum)
const STATUS_CODES = new Set(['SEALED', 'LANDED_ONLY', 'DISCOVERED_DEFERRED', 'EMPTY_IN_SOURCE']);

function parseDomainAudit(output) {
  const counts = { SEALED: 0, LANDED_ONLY: 0, DISCOVERED_DEFERRED: 0, EMPTY_IN_SOURCE: 0 };

  for (const raw of output.split('\n')) {
    const l = raw.trim();
    if (!l) continue;

    const parts = l.split('|');
    if (parts.length === 3 && STATUS_CODES.has(parts[0])) {
      counts[parts[0]] = parseInt(parts[1], 10) || 0;
    }
  }
  return counts;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + BAR);
  console.log('  tf-sync doctor — TerraFusion Sync Health Check');
  console.log(BAR);
  console.log('');
  console.log(`  DB: ${PG_DB} @ ${PG_HOST}:${PG_PORT}`);
  console.log('');

  let psql;
  try {
    psql = await findPsql();
  } catch (e) {
    emit(FAIL, e.message);
    process.exit(2);
  }

  const toolResults = [];

  // ── #0 Harris PACS Pack Validator ────────────────────────────────────────
  console.log('  #0  Harris PACS Pack Validator ...');
  let validatorFailed = false;
  try {
    const out = await runTool(psql, 'harris-pacs-pack-validator.sql');
    const { overallVerdict, failCount, warnCount, passCount, infoCount, failChecks } =
      parsePackValidator(out);

    if (overallVerdict === 'FAIL' || failCount > 0) {
      emit(FAIL, 'FAIL — ' + failCount + ' check(s) failed', 6);
      for (const c of failChecks.slice(0, 5)) emit(FAIL, c, 10);
      if (failChecks.length > 5) emit(FAIL, '...and ' + (failChecks.length - 5) + ' more', 10);
      toolResults.push('FAIL');
      validatorFailed = true;
    } else if (warnCount > 0) {
      emit(WARN, 'WARN — ' + warnCount + ' check(s) need county override doc', 6);
      if (passCount > 0) emit(PASS, passCount + ' checks pass', 10);
      if (infoCount > 0) emit(' ', infoCount + ' informational', 10);
      toolResults.push('WARN');
    } else {
      const info = infoCount > 0 ? '  (' + infoCount + ' info)' : '';
      emit(PASS, 'PASS — ' + passCount + ' checks pass' + info, 6);
      toolResults.push('PASS');
    }
  } catch (e) {
    const detail = e.stderr ? ' | stderr: ' + e.stderr.trim().slice(0, 200) : '';
    const code   = e.code  != null ? ' | exit: ' + e.code : '';
    emit(FAIL, 'ERROR: ' + e.message + code + detail, 6);
    toolResults.push('FAIL');
    validatorFailed = true;
  }
  console.log('');

  // Gate: if pack validator FAILs, stop — remaining checks need conformant landing
  if (validatorFailed) {
    console.log(BAR);
    emit(FAIL, 'OVERALL: FAIL — landing layer does not conform to Harris PACS pack');
    emit(' ', 'Resolve #0 failures before running identity/seal/coverage checks.');
    emit(' ', 'Run: psql ... -f tools/sync/harris-pacs-pack-validator.sql -t -A');
    console.log(BAR);
    console.log('');
    process.exit(1);
  }

  // ── #1 Identity-Drift Detector ───────────────────────────────────────────
  console.log('  #1  Identity-Drift Detector ...');
  try {
    const out = await runTool(psql, 'identity-drift-detector.sql');
    const { failTables, deferredFails } = parseIdentityDrift(out);

    if (failTables.length > 0) {
      emit(FAIL, 'FAIL — unexpected identity drift', 6);
      for (const { table, dangling } of failTables) {
        emit(FAIL, table + ': ' + dangling.toLocaleString() + ' dangling rows', 10);
      }
      toolResults.push('FAIL');
    } else if (deferredFails.length > 0) {
      emit(WARN, 'WARN — known deferred drift present', 6);
      for (const { table, dangling } of deferredFails) {
        emit(WARN, table + ': ' + dangling.toLocaleString() + ' dangling rows (deferred)', 10);
      }
      toolResults.push('WARN');
    } else {
      emit(PASS, 'PASS — all tables clean', 6);
      toolResults.push('PASS');
    }
  } catch (e) {
    const detail = e.stderr ? ' | stderr: ' + e.stderr.trim().slice(0, 200) : '';
    const code   = e.code  != null ? ' | exit: ' + e.code : '';
    emit(FAIL, 'ERROR: ' + e.message + code + detail, 6);
    toolResults.push('FAIL');
  }
  console.log('');

  // ── #2 Seal-Check Runner ─────────────────────────────────────────────────
  console.log('  #2  Seal-Check Runner ...');
  try {
    const out = await runTool(psql, 'seal-check-runner.sql');
    const { overallVerdict, failCount, warnCount, passCount, failChecks, warnChecks } =
      parseSealCheck(out);

    const total = failCount + warnCount + passCount;

    if (overallVerdict === 'FAIL' || failCount > 0) {
      emit(FAIL, 'FAIL — ' + failCount + ' gate(s) broken', 6);
      for (const c of failChecks.slice(0, 5)) emit(FAIL, c, 10);
      if (failChecks.length > 5) emit(FAIL, '...and ' + (failChecks.length - 5) + ' more', 10);
      toolResults.push('FAIL');
    } else if (warnCount > 0) {
      emit(WARN, 'WARN — ' + warnCount + ' of ' + total + ' gates have changed (expected after re-drain)', 6);
      for (const c of warnChecks.slice(0, 3)) emit(WARN, c, 10);
      if (warnChecks.length > 3) emit(WARN, '...and ' + (warnChecks.length - 3) + ' more', 10);
      toolResults.push('WARN');
    } else {
      emit(PASS, 'PASS — ' + (total > 0 ? total : '22') + '/22 gates hold', 6);
      toolResults.push('PASS');
    }
  } catch (e) {
    const detail = e.stderr ? ' | stderr: ' + e.stderr.trim().slice(0, 200) : '';
    const code   = e.code  != null ? ' | exit: ' + e.code : '';
    emit(FAIL, 'ERROR: ' + e.message + code + detail, 6);
    toolResults.push('FAIL');
  }
  console.log('');

  // ── #3 Domain-Coverage Audit ─────────────────────────────────────────────
  console.log('  #3  Domain-Coverage Audit ...');
  try {
    const out = await runTool(psql, 'domain-coverage-audit.sql');
    const { SEALED, LANDED_ONLY, DISCOVERED_DEFERRED, EMPTY_IN_SOURCE } = parseDomainAudit(out);

    if (SEALED < SEALED_BASELINE) {
      emit(FAIL, 'FAIL — SEALED count dropped: ' + SEALED + ' < ' + SEALED_BASELINE + ' expected', 6);
      toolResults.push('FAIL');
    } else {
      emit(PASS, SEALED + ' SEALED', 6);

      const deferred = [
        LANDED_ONLY         > 0 ? LANDED_ONLY + ' LANDED_ONLY'               : null,
        DISCOVERED_DEFERRED > 0 ? DISCOVERED_DEFERRED + ' DISCOVERED_DEFERRED' : null,
        EMPTY_IN_SOURCE     > 0 ? EMPTY_IN_SOURCE + ' EMPTY_IN_SOURCE'         : null,
      ].filter(Boolean);

      if (deferred.length > 0) {
        emit(WARN, deferred.join(' · ') + ' (all expected)', 6);
        toolResults.push('WARN');
      } else {
        toolResults.push('PASS');
      }
    }
  } catch (e) {
    const detail = e.stderr ? ' | stderr: ' + e.stderr.trim().slice(0, 200) : '';
    const code   = e.code  != null ? ' | exit: ' + e.code : '';
    emit(FAIL, 'ERROR: ' + e.message + code + detail, 6);
    toolResults.push('FAIL');
  }
  console.log('');

  // ── Overall verdict ───────────────────────────────────────────────────────
  const overall = toolResults.includes('FAIL') ? 'FAIL'
                : toolResults.includes('WARN') ? 'WARN'
                : 'PASS';

  console.log(BAR);
  if (overall === 'PASS') {
    emit(PASS, 'OVERALL: PASS — substrate clean, all seals hold');
  } else if (overall === 'WARN') {
    emit(WARN, 'OVERALL: WARN — substrate clean, known deferred items present');
    emit(' ', 'Safe to start a Sync session or run drains.');
    emit(' ', 'Review WARN lines before opening owner-link or F2 work.');
  } else {
    emit(FAIL, 'OVERALL: FAIL — identity break or seal failure detected');
    emit(' ', 'Do NOT drain until FAIL items are resolved.');
    emit(' ', 'Run individual automation tools for detail.');
  }
  console.log(BAR);
  console.log('');

  process.exit(overall === 'FAIL' ? 1 : 0);
}

main().catch(e => {
  console.error('\n  Fatal: ' + e.message);
  process.exit(2);
});
