import { existsSync, readFileSync, readdirSync } from 'node:fs';

import { LocalAgentHelpSystem } from './help.js';
import { terrafusionPath } from './eventLog.js';

export interface LocalAgentStatusCardSummary {
  exists: boolean;
  task: string | null;
  mode: string | null;
  lockedAt: number | null;
}

export interface LocalAgentStatusProofSummary {
  exists: boolean;
  ok: boolean | null;
  finishedAt: number | null;
  failingGateCount: number | null;
}

export interface LocalAgentStatusEventSummary {
  ts: number;
  type: string;
}

export interface LocalAgentStatusSummary {
  capturedAt: number;
  card: LocalAgentStatusCardSummary;
  proof: LocalAgentStatusProofSummary;
  pendingPatchCount: number;
  recentEvents: LocalAgentStatusEventSummary[];
  saveStatePresent: boolean;
  finalReportPresent: boolean;
  recommendedNext: string;
  recommendedReason: string;
}

export class LocalAgentStatus {
  constructor(private readonly repoRoot: string) {}

  capture(): LocalAgentStatusSummary {
    return {
      capturedAt: Math.floor(Date.now() / 1000),
      card: this.readCard(),
      proof: this.readProof(),
      pendingPatchCount: this.countPatches(),
      recentEvents: this.readRecentEvents(3),
      saveStatePresent: existsSync(terrafusionPath(this.repoRoot, 'save-state.md')),
      finalReportPresent: existsSync(terrafusionPath(this.repoRoot, 'final-report.json')),
      ...this.recommendNext(),
    };
  }

  private readCard(): LocalAgentStatusCardSummary {
    const jsonPath = terrafusionPath(this.repoRoot, 'current-work-card.json');
    if (!existsSync(jsonPath)) {
      return { exists: false, task: null, mode: null, lockedAt: null };
    }
    try {
      const payload = JSON.parse(readFileSync(jsonPath, 'utf8'));
      return {
        exists: true,
        task: typeof payload?.card?.task === 'string' ? payload.card.task : null,
        mode: typeof payload?.card?.mode === 'string' ? payload.card.mode : null,
        lockedAt: typeof payload?.lockedAt === 'number' ? payload.lockedAt : null,
      };
    } catch {
      return { exists: true, task: null, mode: null, lockedAt: null };
    }
  }

  private readProof(): LocalAgentStatusProofSummary {
    const proofPath = terrafusionPath(this.repoRoot, 'proof-results.json');
    if (!existsSync(proofPath)) {
      return { exists: false, ok: null, finishedAt: null, failingGateCount: null };
    }
    try {
      const payload = JSON.parse(readFileSync(proofPath, 'utf8'));
      const results = Array.isArray(payload?.results) ? payload.results : [];
      const failing = results.filter((r: { ok?: boolean }) => r?.ok === false).length;
      return {
        exists: true,
        ok: typeof payload?.ok === 'boolean' ? payload.ok : null,
        finishedAt: typeof payload?.finishedAt === 'number' ? payload.finishedAt : null,
        failingGateCount: failing,
      };
    } catch {
      return { exists: true, ok: null, finishedAt: null, failingGateCount: null };
    }
  }

  private countPatches(): number {
    const dir = terrafusionPath(this.repoRoot, 'patches');
    if (!existsSync(dir)) return 0;
    try {
      return readdirSync(dir).filter(name => name.endsWith('.json')).length;
    } catch {
      return 0;
    }
  }

  private readRecentEvents(limit: number): LocalAgentStatusEventSummary[] {
    const path = terrafusionPath(this.repoRoot, 'agent-events.jsonl');
    if (!existsSync(path)) return [];
    try {
      // Bounded read: read entire file, but cap parsed lines from the tail.
      const text = readFileSync(path, 'utf8');
      const lines = text.split('\n').filter(Boolean);
      const tail = lines.slice(-limit).reverse();
      const events: LocalAgentStatusEventSummary[] = [];
      for (const line of tail) {
        try {
          const evt = JSON.parse(line);
          if (typeof evt?.ts === 'number' && typeof evt?.type === 'string') {
            events.push({ ts: evt.ts, type: evt.type });
          }
        } catch {
          // Skip malformed line; do not throw on a corrupt audit entry.
        }
      }
      return events;
    } catch {
      return [];
    }
  }

  private recommendNext(): { recommendedNext: string; recommendedReason: string } {
    const rec = new LocalAgentHelpSystem(this.repoRoot).recommendNext();
    return { recommendedNext: rec.command, recommendedReason: rec.reason };
  }
}

export function renderLocalAgentStatus(summary: LocalAgentStatusSummary): string {
  const lines: string[] = [];
  lines.push('TerraFusion Local Agent — status');
  lines.push('');
  lines.push('Card:');
  if (summary.card.exists) {
    lines.push(`  Task: ${summary.card.task ?? '—'}`);
    lines.push(`  Mode: ${summary.card.mode ?? '—'}`);
  } else {
    lines.push('  (none)');
  }
  lines.push('');
  lines.push('Proof:');
  if (summary.proof.exists) {
    const verdict = summary.proof.ok === true ? 'PASS' : summary.proof.ok === false ? 'FAIL' : '—';
    lines.push(`  Last run: ${verdict}`);
    if (summary.proof.failingGateCount !== null && summary.proof.failingGateCount > 0) {
      lines.push(`  Failing gates: ${summary.proof.failingGateCount}`);
    }
  } else {
    lines.push('  (none)');
  }
  lines.push('');
  lines.push(`Pending patches: ${summary.pendingPatchCount}`);
  lines.push(`Save state:      ${summary.saveStatePresent ? 'present' : '—'}`);
  lines.push(`Final report:    ${summary.finalReportPresent ? 'present' : '—'}`);
  lines.push('');
  lines.push('Recent events:');
  if (summary.recentEvents.length === 0) {
    lines.push('  (none)');
  } else {
    for (const evt of summary.recentEvents) {
      lines.push(`  ${evt.type}`);
    }
  }
  lines.push('');
  lines.push('Next:');
  lines.push(`  ${summary.recommendedNext}`);
  lines.push(`  ${summary.recommendedReason}`);
  return lines.join('\n');
}
