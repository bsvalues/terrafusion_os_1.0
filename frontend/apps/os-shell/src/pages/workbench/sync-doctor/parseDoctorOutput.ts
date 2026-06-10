// WORKBENCH-V0.3 SLICE-J: TypeScript port of parseDoctor() from
// tools/sync/workbench/panel/app.js.  The proven output-parsing logic lives
// here so the OS shell and the local cockpit share the same semantics.
//
// The .NET backend returns raw stdout; this module converts it into a
// typed structure for the SyncDoctorPage to render.
//
// Stdout structure (from tf-sync-doctor.mjs):
//   Exactly 4 BAR lines (═{10,}).
//   bars 1–2 : header
//   body     : DB line, step #0–#3 sections
//   bar 3    : opens OVERALL section
//   bar 4    : closes OVERALL section
//
// Step header regex: /^\s+#(\d)\s+(.+?)\s*\.{3}/

// ── Types ─────────────────────────────────────────────────────────────────────

export type StepVerdict = 'PASS' | 'WARN' | 'FAIL';

export interface StepDetailLine {
  sym: StepVerdict | null;
  text: string;
}

export interface DoctorStep {
  idx: number;
  name: string;
  verdict: StepVerdict | null;
  details: StepDetailLine[];
}

export interface ParsedDoctorOutput {
  /** Short DB identifier line from the doctor header, e.g. "127.0.0.1:5432/terrafusion" */
  dbInfo: string | null;
  /** Overall verdict derived from the OVERALL section between bars 3–4. */
  overall: StepVerdict | null;
  /** Supporting messages from the OVERALL section (not including the OVERALL: line itself). */
  overMsgs: string[];
  /** Parsed step sections, in order (#0–#3). */
  steps: DoctorStep[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VERDICT_RANK: Record<StepVerdict, number> = { PASS: 0, WARN: 1, FAIL: 2 };

/** Detect the verdict symbol in a line of text. */
function detectSym(text: string): StepVerdict | null {
  if (text.includes('✓')) return 'PASS';
  if (text.includes('⚠')) return 'WARN';
  if (text.includes('✗')) return 'FAIL';
  if (/\berror\b/i.test(text)) return 'FAIL';
  return null;
}

/** Return the more-severe verdict of a and b. */
function worstOf(a: StepVerdict | null, b: StepVerdict | null): StepVerdict | null {
  if (a == null) return b;
  if (b == null) return a;
  return (VERDICT_RANK[a] ?? 0) >= (VERDICT_RANK[b] ?? 0) ? a : b;
}

// ── Main parser ───────────────────────────────────────────────────────────────

/**
 * Parse the raw stdout of tf-sync-doctor.mjs into a structured object.
 *
 * Returns `{ dbInfo: null, overall: null, overMsgs: [], steps: [] }` if
 * the stdout is empty or unparseable — callers should check `steps.length`.
 */
export function parseDoctorOutput(stdout: string): ParsedDoctorOutput {
  const lines = stdout.split('\n');

  let dbInfo: string | null = null;
  let overall: StepVerdict | null = null;
  const overMsgs: string[] = [];
  const steps: DoctorStep[] = [];
  let cur: DoctorStep | null = null;
  let barCount = 0;
  let inOverall = false;

  for (const line of lines) {
    const t = line.trim();

    // ── BAR line (10+ ═ characters) ──────────────────────────────────────────
    if (/^═{10,}/.test(t)) {
      if (cur) {
        steps.push(cur);
        cur = null;
      }
      barCount++;
      inOverall = barCount === 3;
      if (barCount >= 4) inOverall = false;
      continue;
    }

    if (!t) continue;

    // ── DB info line ──────────────────────────────────────────────────────────
    if (t.startsWith('DB:')) {
      dbInfo = t.slice(3).trim();
      continue;
    }

    // ── OVERALL section (between bars 3 and 4) ────────────────────────────────
    if (inOverall) {
      const sym = detectSym(t);
      if (sym !== null && t.includes('OVERALL:')) overall = sym;
      const msg = t
        .replace(/^[✓⚠✗]\s+/, '')
        .replace(/^OVERALL:\s*\S+\s*[—–-]\s*/, '')
        .trim();
      if (msg) overMsgs.push(msg);
      continue;
    }

    // ── Step header: "  #N  Name of step ..." ────────────────────────────────
    const sm = line.match(/^\s+#(\d)\s+(.+?)\s*\.{3}/);
    if (sm) {
      if (cur) steps.push(cur);
      cur = {
        idx: parseInt(sm[1], 10),
        name: sm[2].trim(),
        verdict: null,
        details: [],
      };
      continue;
    }

    // ── Step detail line ──────────────────────────────────────────────────────
    if (cur !== null) {
      const sym = detectSym(t);
      const text = t.replace(/^[✓⚠✗]\s{1,2}/, '').trim();
      if (sym !== null) cur.verdict = worstOf(cur.verdict, sym);
      if (text) cur.details.push({ sym, text });
    }
  }

  if (cur) steps.push(cur);

  return { dbInfo, overall, overMsgs, steps };
}
