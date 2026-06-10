// WORKBENCH-V0.3 SLICE-K: OS Shell Source Pack Fit Panel — pipe-delimited parser.
//
// Parses stdout from harris-pacs-pack-validator.sql (via pack-validator-runner.mjs).
//
// Output format (psql -t -A, field separator |):
//   Statement 1 — per-check detail:
//     category|check_name|measured|expected|verdict|severity|notes
//     verdict ∈ {PASS, WARN, FAIL, INFO}, severity ∈ {CRITICAL, WARN, INFO}
//     Sorted: FAIL first, then WARN, PASS, INFO.
//
//   Statement 2 — summary:
//     OVERALL: PASS/WARN/FAIL|fail=N|warn=N|pass=N|info=N
//
// Per docs/sync/workbench/SLICE_K_OS_SHELL_SOURCE_PACK_FIT_CONTRACT.md.

export type CheckVerdict = 'PASS' | 'WARN' | 'FAIL' | 'INFO';

export interface PackCheck {
  category: string;   // table_presence | column_structure | dictionary | data_content
  checkName: string;
  measured: string;
  expected: string;
  verdict: CheckVerdict;
  severity: string;   // CRITICAL | WARN | INFO
  notes: string;
}

export interface PackSection {
  category: string;
  checks: PackCheck[];
  verdict: 'PASS' | 'WARN' | 'FAIL'; // worst-of across section checks (INFO ignored)
  failCount: number;
  warnCount: number;
  passCount: number;
  infoCount: number;
}

export interface ParsedPackOutput {
  overall: 'PASS' | 'WARN' | 'FAIL' | null;
  failCount: number;
  warnCount: number;
  passCount: number;
  infoCount: number;
  sections: PackSection[]; // canonical order: table_presence, column_structure, dictionary, data_content
  checks: PackCheck[];     // flat list, SQL output order preserved
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTION_ORDER = [
  'table_presence',
  'column_structure',
  'dictionary',
  'data_content',
] as const;

// Verdict ranks for worst-of calculation (INFO excluded from section verdict).
const VERDICT_RANK: Record<string, number> = {
  FAIL: 2,
  WARN: 1,
  PASS: 0,
  INFO: -1, // does not affect PASS/WARN/FAIL
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function worstOf(a: 'PASS' | 'WARN' | 'FAIL', b: CheckVerdict): 'PASS' | 'WARN' | 'FAIL' {
  if (b === 'INFO') return a;
  const rankB = VERDICT_RANK[b] ?? 0;
  const rankA = VERDICT_RANK[a] ?? 0;
  if (rankB > rankA) return b as 'PASS' | 'WARN' | 'FAIL';
  return a;
}

function parseSummaryLine(line: string): {
  overall: 'PASS' | 'WARN' | 'FAIL';
  failCount: number;
  warnCount: number;
  passCount: number;
  infoCount: number;
} {
  // e.g. "OVERALL: PASS|fail=0|warn=3|pass=62|info=1"
  const parts = line.split('|');
  const overallPart = parts[0] ?? '';
  const overall: 'PASS' | 'WARN' | 'FAIL' = overallPart.includes('FAIL')
    ? 'FAIL'
    : overallPart.includes('WARN')
    ? 'WARN'
    : 'PASS';

  let failCount = 0;
  let warnCount = 0;
  let passCount = 0;
  let infoCount = 0;

  for (const part of parts.slice(1)) {
    const [key, val] = part.split('=');
    const n = parseInt(val ?? '0', 10) || 0;
    if (key === 'fail') failCount = n;
    else if (key === 'warn') warnCount = n;
    else if (key === 'pass') passCount = n;
    else if (key === 'info') infoCount = n;
  }

  return { overall, failCount, warnCount, passCount, infoCount };
}

function parseCheckLine(line: string): PackCheck | null {
  const parts = line.split('|');
  if (parts.length < 7) return null;

  const verdict = parts[4]?.trim();
  if (!verdict) return null;

  return {
    category: parts[0]?.trim() ?? '',
    checkName: parts[1]?.trim() ?? '',
    measured: parts[2]?.trim() ?? '',
    expected: parts[3]?.trim() ?? '',
    verdict: (['PASS', 'WARN', 'FAIL', 'INFO'].includes(verdict)
      ? verdict
      : 'PASS') as CheckVerdict,
    severity: parts[5]?.trim() ?? '',
    notes: parts.slice(6).join('|').trim(), // notes may contain | — join the rest
  };
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parsePackValidatorOutput(stdout: string): ParsedPackOutput {
  const empty: ParsedPackOutput = {
    overall: null,
    failCount: 0,
    warnCount: 0,
    passCount: 0,
    infoCount: 0,
    sections: [],
    checks: [],
  };

  if (!stdout || !stdout.trim()) return empty;

  const checks: PackCheck[] = [];
  let summaryLine: string | null = null;

  for (const rawLine of stdout.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('OVERALL:')) {
      summaryLine = line;
      continue;
    }

    const check = parseCheckLine(line);
    if (check) checks.push(check);
  }

  // Build sections in canonical order.
  const sectionMap = new Map<string, PackCheck[]>();
  for (const cat of SECTION_ORDER) sectionMap.set(cat, []);

  for (const check of checks) {
    const existing = sectionMap.get(check.category);
    if (existing) {
      existing.push(check);
    } else {
      // Unknown category — add to map for completeness.
      sectionMap.set(check.category, [check]);
    }
  }

  const sections: PackSection[] = [];
  for (const [category, catChecks] of sectionMap) {
    if (catChecks.length === 0) continue;

    let verdict: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    let failCount = 0;
    let warnCount = 0;
    let passCount = 0;
    let infoCount = 0;

    for (const c of catChecks) {
      verdict = worstOf(verdict, c.verdict);
      if (c.verdict === 'FAIL') failCount++;
      else if (c.verdict === 'WARN') warnCount++;
      else if (c.verdict === 'PASS') passCount++;
      else if (c.verdict === 'INFO') infoCount++;
    }

    sections.push({ category, checks: catChecks, verdict, failCount, warnCount, passCount, infoCount });
  }

  // Parse or derive summary.
  let overall: 'PASS' | 'WARN' | 'FAIL' | null = null;
  let totalFail = 0;
  let totalWarn = 0;
  let totalPass = 0;
  let totalInfo = 0;

  if (summaryLine) {
    const s = parseSummaryLine(summaryLine);
    overall = s.overall;
    totalFail = s.failCount;
    totalWarn = s.warnCount;
    totalPass = s.passCount;
    totalInfo = s.infoCount;
  } else if (checks.length > 0) {
    // Derive from per-check rows if summary line was absent.
    for (const c of checks) {
      if (c.verdict === 'FAIL') totalFail++;
      else if (c.verdict === 'WARN') totalWarn++;
      else if (c.verdict === 'PASS') totalPass++;
      else if (c.verdict === 'INFO') totalInfo++;
    }
    overall = totalFail > 0 ? 'FAIL' : totalWarn > 0 ? 'WARN' : 'PASS';
  }

  return {
    overall,
    failCount: totalFail,
    warnCount: totalWarn,
    passCount: totalPass,
    infoCount: totalInfo,
    sections,
    checks,
  };
}
