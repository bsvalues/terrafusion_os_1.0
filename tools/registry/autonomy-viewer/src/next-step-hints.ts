/**
 * Phase 4N48 – Next-Step Hints
 * =============================
 *
 * Telemetry-backed next-step hints with blocker prioritization,
 * PII protection, and deterministic output.
 *
 * @module next-step-hints
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Hint {
  readonly id: string;
  readonly priority: 'blocker' | 'warning' | 'info';
  readonly category: 'prerequisite' | 'config' | 'exercise' | 'security' | 'operational';
  readonly message: string;
  readonly action?: string;
  readonly link?: string;
}

export interface HintResult {
  readonly ok: boolean;
  readonly hints: readonly Hint[];
  readonly context: HintContext;
  readonly generatedAt: string;
}

export interface HintContext {
  readonly profile: string;
  readonly lastRunId?: string;
  readonly lastRunStatus?: 'passed' | 'failed' | 'partial';
  readonly lastRunTimestamp?: string;
  readonly exerciseStatuses: Record<string, 'passed' | 'failed' | 'skipped' | 'not-run'>;
}

export interface LastRunSummary {
  readonly drillId: string;
  readonly profile: string;
  readonly overall: 'passed' | 'failed' | 'partial';
  readonly timestamp: string;
  readonly exercisesRun: readonly { name: string; status: 'passed' | 'failed' | 'skipped' }[];
  readonly errors: readonly string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// PII Protection
// ─────────────────────────────────────────────────────────────────────────────

const PII_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i, // Email
  /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, // SSN
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone
  /\b\d{1,5}\s+\w+\s+(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|ct|court)\b/i, // Address
];

/**
 * Check if text contains PII patterns.
 */
export function containsPII(text: string): boolean {
  return PII_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Scrub potential PII from text.
 */
export function scrubPII(text: string): string {
  let scrubbed = text;
  for (const pattern of PII_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, '[REDACTED]');
  }
  return scrubbed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Implementation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate next-step hints based on last drill run.
 *
 * @param lastRun - Summary of last drill run (null if no run available)
 * @returns HintResult with prioritized hints
 */
export function generateHints(lastRun: LastRunSummary | null): HintResult {
  // Contract: fail closed without run context
  if (!lastRun) {
    return {
      ok: false,
      hints: [
        {
          id: 'no-context',
          priority: 'blocker',
          category: 'prerequisite',
          message: 'No drill run context available. Run `tf drills --profile county` first.',
          action: 'tf drills --profile county',
        },
      ],
      context: {
        profile: 'unknown',
        exerciseStatuses: {},
      },
      generatedAt: new Date().toISOString(),
    };
  }

  const hints: Hint[] = [];

  // Build exercise status map
  const exerciseStatuses: Record<string, 'passed' | 'failed' | 'skipped' | 'not-run'> = {};
  for (const ex of lastRun.exercisesRun) {
    exerciseStatuses[ex.name] = ex.status;
  }

  // Check for failures → blockers
  const failures = lastRun.exercisesRun.filter(e => e.status === 'failed');
  for (const failure of failures) {
    hints.push({
      id: `failed-${failure.name}`,
      priority: 'blocker',
      category: 'exercise',
      message: `Exercise ${failure.name} failed. Review the exercise and fix issues.`,
      action: `Open exercises/${failure.name}.md`,
      link: `exercises/${failure.name}.md`,
    });
  }

  // Check for skipped → warnings
  const skipped = lastRun.exercisesRun.filter(e => e.status === 'skipped');
  for (const skip of skipped) {
    hints.push({
      id: `skipped-${skip.name}`,
      priority: 'warning',
      category: 'exercise',
      message: `Exercise ${skip.name} was skipped. Run drills again after fixing blockers.`,
    });
  }

  // If all passed, suggest next steps
  if (lastRun.overall === 'passed') {
    hints.push({
      id: 'all-passed-next',
      priority: 'info',
      category: 'operational',
      message:
        'All exercises passed! Consider running the full drill sequence or reviewing audit settings.',
      action: 'tf drills --profile county --full',
    });
  }

  // Check for stale run
  const runAge = Date.now() - new Date(lastRun.timestamp).getTime();
  if (runAge > ONE_WEEK_MS) {
    hints.push({
      id: 'stale-run',
      priority: 'warning',
      category: 'operational',
      message: `Last drill run was ${Math.floor(runAge / (24 * 60 * 60 * 1000))} days ago. Consider re-running.`,
      action: 'tf drills --profile county',
    });
  }

  // PII scrubbing pass (defense in depth)
  const scrubbedHints = hints.map(hint => ({
    ...hint,
    message: scrubPII(hint.message),
    action: hint.action ? scrubPII(hint.action) : undefined,
  }));

  // Sort by priority: blockers first, then warnings, then info
  const priorityOrder = { blocker: 0, warning: 1, info: 2 };
  scrubbedHints.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return {
    ok: scrubbedHints.filter(h => h.priority === 'blocker').length === 0,
    hints: scrubbedHints,
    context: {
      profile: lastRun.profile,
      lastRunId: lastRun.drillId,
      lastRunStatus: lastRun.overall,
      lastRunTimestamp: lastRun.timestamp,
      exerciseStatuses,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Format hints for terminal output.
 */
export function formatHints(result: HintResult): string {
  const lines: string[] = [];

  lines.push(`\n📋 Next Steps for ${result.context.profile} profile`);
  lines.push(`─────────────────────────────────────────────`);

  if (result.context.lastRunId) {
    lines.push(`Last run: ${result.context.lastRunId}`);
    lines.push(`Status: ${result.context.lastRunStatus}`);
    lines.push(`Time: ${result.context.lastRunTimestamp}`);
    lines.push('');
  }

  if (result.hints.length === 0) {
    lines.push('✅ No pending actions.');
    return lines.join('\n');
  }

  const blockers = result.hints.filter(h => h.priority === 'blocker');
  const warnings = result.hints.filter(h => h.priority === 'warning');
  const infos = result.hints.filter(h => h.priority === 'info');

  if (blockers.length > 0) {
    lines.push('🚨 BLOCKERS:');
    for (const h of blockers) {
      lines.push(`  • ${h.message}`);
      if (h.action) lines.push(`    → ${h.action}`);
    }
    lines.push('');
  }

  if (warnings.length > 0) {
    lines.push('⚠️  WARNINGS:');
    for (const h of warnings) {
      lines.push(`  • ${h.message}`);
      if (h.action) lines.push(`    → ${h.action}`);
    }
    lines.push('');
  }

  if (infos.length > 0) {
    lines.push('ℹ️  INFO:');
    for (const h of infos) {
      lines.push(`  • ${h.message}`);
      if (h.action) lines.push(`    → ${h.action}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export default generateHints;
