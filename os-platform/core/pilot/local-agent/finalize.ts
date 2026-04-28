import { readFileSync, writeFileSync } from 'node:fs';

import { LocalAgentCardLockStore } from './cardLock.js';
import { runProcess } from './command.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import type { LocalAgentWorkCard } from './workCard.js';

export interface LocalAgentFinalizeGitSnapshot {
  branch: string;
  statusShort: string;
  changedFiles: string[];
}

export interface LocalAgentFinalizeProofSnapshot {
  ok: boolean;
  workCardId: string;
  resultCount: number;
  failedCommands: string[];
  blockedCommands: string[];
  proofGates: string[];
}

export interface LocalAgentFinalReport {
  ok: boolean;
  createdAt: number;
  workCardId: string;
  task: string;
  branch: string;
  changedFiles: string[];
  proofGates: string[];
  remainingRisks: string[];
  commitMessage: string;
  saveStatePath: string;
  proofResultsPath: string;
}

export class LocalAgentFinalizeRunner {
  private readonly cardStore: LocalAgentCardLockStore;

  constructor(private readonly repoRoot: string) {
    this.cardStore = new LocalAgentCardLockStore(repoRoot);
  }

  finalize(): LocalAgentFinalReport {
    const card = this.loadRequiredCard();
    const proof = this.loadRequiredProof(card);
    this.requireSaveState();

    const git = this.readGitSnapshot();
    const report: LocalAgentFinalReport = {
      ok: true,
      createdAt: Math.floor(Date.now() / 1000),
      workCardId: card.id,
      task: card.task,
      branch: git.branch,
      changedFiles: git.changedFiles,
      proofGates: proof.proofGates,
      remainingRisks: card.risks,
      commitMessage: this.buildCommitMessage(card),
      saveStatePath: '.terrafusion/save-state.md',
      proofResultsPath: '.terrafusion/proof-results.json',
    };

    writeFileSync(terrafusionPath(this.repoRoot, 'final-report.json'), JSON.stringify(report, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'final-report.md'), renderLocalAgentFinalReport(report), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'finalize_completed', {
      ok: report.ok,
      workCardId: report.workCardId,
      changedFiles: report.changedFiles,
      commitMessage: report.commitMessage,
    });

    return report;
  }

  private loadRequiredCard(): LocalAgentWorkCard {
    try {
      return this.cardStore.requireLockedCard();
    } catch (error) {
      appendLocalAgentEvent(this.repoRoot, 'finalize_blocked', {
        reason: (error as Error).message,
      });
      throw new Error(`Locked work card required: ${(error as Error).message}`);
    }
  }

  private loadRequiredProof(card: LocalAgentWorkCard): LocalAgentFinalizeProofSnapshot {
    const proofPath = terrafusionPath(this.repoRoot, 'proof-results.json');
    let payload: {
      ok: boolean;
      workCardId?: string;
      results?: Array<{ command?: string; ok?: boolean; skipped?: boolean }>;
    };

    try {
      payload = JSON.parse(readFileSync(proofPath, 'utf8')) as typeof payload;
    } catch {
      appendLocalAgentEvent(this.repoRoot, 'finalize_blocked', {
        reason: 'missing or corrupted proof-results.json',
      });
      throw new Error('Proof results are required before finalizing.');
    }

    if (payload.workCardId !== card.id) {
      appendLocalAgentEvent(this.repoRoot, 'finalize_blocked', {
        reason: 'proof work card mismatch',
        proofCard: payload.workCardId ?? null,
        lockedCard: card.id,
      });
      throw new Error('Proof results do not match the locked work card.');
    }

    const results = payload.results ?? [];
    const failedCommands = results.filter(result => !result.skipped && !result.ok).map(result => result.command ?? 'unknown command');
    const blockedCommands = results.filter(result => Boolean(result.skipped)).map(result => result.command ?? 'unknown command');
    const proofGates = results.map(result => result.command ?? 'unknown command');

    if (!payload.ok) {
      appendLocalAgentEvent(this.repoRoot, 'finalize_blocked', {
        reason: 'proof failed',
        failedCommands,
        blockedCommands,
      });
      throw new Error('Proof did not pass. Finalize blocked.');
    }

    return {
      ok: true,
      workCardId: payload.workCardId,
      resultCount: results.length,
      failedCommands,
      blockedCommands,
      proofGates,
    };
  }

  private requireSaveState(): void {
    try {
      readFileSync(terrafusionPath(this.repoRoot, 'save-state.md'), 'utf8');
    } catch {
      appendLocalAgentEvent(this.repoRoot, 'finalize_blocked', {
        reason: 'missing save-state.md',
      });
      throw new Error('Save State is required before finalizing.');
    }
  }

  private readGitSnapshot(): LocalAgentFinalizeGitSnapshot {
    const branch = runProcess(this.repoRoot, 'git rev-parse --abbrev-ref HEAD', 10);
    const status = runProcess(this.repoRoot, 'git status --short', 10);
    const changed = runProcess(this.repoRoot, 'git diff --name-only', 10);
    const staged = runProcess(this.repoRoot, 'git diff --cached --name-only', 10);
    const untracked = (status.output || '')
      .split(/\r?\n/)
      .filter(line => line.startsWith('?? '))
      .map(line => line.slice(3).trim());

    const changedFiles = Array.from(
      new Set(
        [...changed.output.split(/\r?\n/), ...staged.output.split(/\r?\n/), ...untracked]
          .map(line => line.trim())
          .filter(Boolean),
      ),
    ).sort();

    return {
      branch: branch.exitCode === 0 ? branch.output.trim() : 'unknown',
      statusShort: status.exitCode === 0 ? status.output.trim() : '',
      changedFiles,
    };
  }

  private buildCommitMessage(card: LocalAgentWorkCard): string {
    const prefix = this.commitPrefix(card.id);
    const subject = card.task.trim().replace(/\.$/, '');
    const trimmed = subject.length > 72 ? `${subject.slice(0, 69).trimEnd()}...` : subject;
    return `${prefix}: ${trimmed}. The harness checked the receipts.`;
  }

  private commitPrefix(cardId: string): string {
    const mapping: Record<string, string> = {
      'local-agent-runtime': 'feat(ai)',
      'shell-integrity': 'fix(shell)',
      'county-deployment': 'feat(deploy)',
    };

    return mapping[cardId] ?? 'chore(agent)';
  }
}

export function renderLocalAgentFinalReport(report: LocalAgentFinalReport): string {
  return [
    '# TerraFusion Final Report',
    '',
    '## Result',
    '',
    report.ok ? 'PASS' : 'FAIL',
    '',
    '## Work Card',
    '',
    `- ID: ${report.workCardId}`,
    `- Task: ${report.task}`,
    '',
    '## Git',
    '',
    `- Branch: ${report.branch}`,
    '',
    '### Changed Files',
    '',
    bulletList(report.changedFiles),
    '',
    '## Proof Gates',
    '',
    bulletList(report.proofGates),
    '',
    '## Remaining Risks',
    '',
    bulletList(report.remainingRisks),
    '',
    '## Commit Message',
    '',
    '```bash',
    `git commit -m "${report.commitMessage}"`,
    '```',
    '',
    '## Evidence',
    '',
    `- Save State: ${report.saveStatePath}`,
    `- Proof Results: ${report.proofResultsPath}`,
    '',
  ].join('\n');
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}