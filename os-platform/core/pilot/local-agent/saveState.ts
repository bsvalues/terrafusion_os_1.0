import { readFileSync, writeFileSync } from 'node:fs';

import { LocalAgentCardLockStore } from './cardLock.js';
import { runProcess } from './command.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import type { LocalAgentProofReport } from './proof.js';

export interface LocalAgentGitSnapshot {
  branch: string;
  statusShort: string;
  changedFiles: string[];
}

export interface LocalAgentProofSnapshot {
  available: boolean;
  ok: boolean | null;
  workCardId: string | null;
  resultCount: number;
  failedCommands: string[];
  blockedCommands: string[];
}

export interface LocalAgentCardSnapshot {
  available: boolean;
  id: string | null;
  task: string | null;
  mode: string | null;
  allowedFiles: string[];
  forbiddenFiles: string[];
  proofGates: string[];
  risks: string[];
}

export interface LocalAgentSaveStateReport {
  createdAt: number;
  summary: string;
  nextExactStep: string;
  card: LocalAgentCardSnapshot;
  proof: LocalAgentProofSnapshot;
  git: LocalAgentGitSnapshot;
  notes: string[];
}

export class LocalAgentSaveStateWriter {
  private readonly cardStore: LocalAgentCardLockStore;

  constructor(private readonly repoRoot: string) {
    this.cardStore = new LocalAgentCardLockStore(repoRoot);
  }

  write(summary: string, nextExactStep: string, notes: string[] = []): LocalAgentSaveStateReport {
    const normalizedSummary = summary.trim().replace(/\s+/g, ' ');
    const normalizedNextStep = nextExactStep.trim().replace(/\s+/g, ' ');

    if (!normalizedSummary) {
      throw new Error('Summary is required.');
    }

    if (!normalizedNextStep) {
      throw new Error('Next exact step is required.');
    }

    const report: LocalAgentSaveStateReport = {
      createdAt: Math.floor(Date.now() / 1000),
      summary: normalizedSummary,
      nextExactStep: normalizedNextStep,
      card: this.readCardSnapshot(),
      proof: this.readProofSnapshot(),
      git: this.readGitSnapshot(),
      notes,
    };

    writeFileSync(terrafusionPath(this.repoRoot, 'save-state.json'), JSON.stringify(report, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'save-state.md'), renderLocalAgentSaveState(report), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'save_state_written', {
      summary: report.summary,
      nextExactStep: report.nextExactStep,
      cardId: report.card.id,
      proofAvailable: report.proof.available,
      proofOk: report.proof.ok,
      changedFiles: report.git.changedFiles,
    });

    return report;
  }

  private readCardSnapshot(): LocalAgentCardSnapshot {
    try {
      const card = this.cardStore.load();
      return {
        available: true,
        id: card.id,
        task: card.task,
        mode: card.mode,
        allowedFiles: card.allowedFiles,
        forbiddenFiles: card.forbiddenFiles,
        proofGates: card.proofGates,
        risks: card.risks,
      };
    } catch {
      return {
        available: false,
        id: null,
        task: null,
        mode: null,
        allowedFiles: [],
        forbiddenFiles: [],
        proofGates: [],
        risks: [],
      };
    }
  }

  private readProofSnapshot(): LocalAgentProofSnapshot {
    try {
      const proof = JSON.parse(readFileSync(terrafusionPath(this.repoRoot, 'proof-results.json'), 'utf8')) as LocalAgentProofReport;
      return {
        available: true,
        ok: proof.ok,
        workCardId: proof.workCardId,
        resultCount: proof.results.length,
        failedCommands: proof.results.filter(result => !result.skipped && !result.ok).map(result => result.command),
        blockedCommands: proof.results.filter(result => result.skipped).map(result => result.command),
      };
    } catch {
      return {
        available: false,
        ok: null,
        workCardId: null,
        resultCount: 0,
        failedCommands: [],
        blockedCommands: [],
      };
    }
  }

  private readGitSnapshot(): LocalAgentGitSnapshot {
    const gitRoot = runProcess(this.repoRoot, 'git rev-parse --is-inside-work-tree', 10);
    if (gitRoot.exitCode !== 0 || gitRoot.output.trim() !== 'true') {
      return {
        branch: 'git: unavailable',
        statusShort: 'git: unavailable (not a git repo)',
        changedFiles: [],
      };
    }

    const branch = runProcess(this.repoRoot, 'git rev-parse --abbrev-ref HEAD', 10);
    const status = runProcess(this.repoRoot, 'git status --short', 10);
    const changed = runProcess(this.repoRoot, 'git diff --name-only', 10);
    const staged = runProcess(this.repoRoot, 'git diff --cached --name-only', 10);
    const statusOutput = status.exitCode === 0 ? status.output : '';
    const changedOutput = changed.exitCode === 0 ? changed.output : '';
    const stagedOutput = staged.exitCode === 0 ? staged.output : '';
    const untracked = statusOutput
      .split(/\r?\n/)
      .filter(line => line.startsWith('?? '))
      .map(line => line.slice(3).trim());

    const changedFiles = Array.from(
      new Set(
        [...changedOutput.split(/\r?\n/), ...stagedOutput.split(/\r?\n/), ...untracked]
          .map(line => line.trim())
          .filter(Boolean),
      ),
    ).sort();

    return {
      branch: branch.exitCode === 0 ? branch.output.trim() : 'unknown',
      statusShort: statusOutput.trim(),
      changedFiles,
    };
  }
}

export function renderLocalAgentSaveState(report: LocalAgentSaveStateReport): string {
  const proofLabel = report.proof.available ? (report.proof.ok ? 'PASS' : 'FAIL') : 'NOT RUN';

  return [
    '# TerraFusion Agent Save State',
    '',
    '## Summary',
    '',
    report.summary,
    '',
    '## Current Work Card',
    '',
    `- Card: ${report.card.id ?? 'No locked card'}`,
    `- Task: ${report.card.task ?? 'Not available'}`,
    `- Mode: ${report.card.mode ?? 'Not available'}`,
    '',
    '## Proof Status',
    '',
    `- Overall: ${proofLabel}`,
    `- Result Count: ${report.proof.resultCount}`,
    '',
    '### Failed Commands',
    '',
    bulletList(report.proof.failedCommands),
    '',
    '### Blocked Commands',
    '',
    bulletList(report.proof.blockedCommands),
    '',
    '## Git Snapshot',
    '',
    `- Branch: ${report.git.branch}`,
    '',
    '```text',
    report.git.statusShort || 'clean',
    '```',
    '',
    '### Changed Files',
    '',
    bulletList(report.git.changedFiles),
    '',
    '## Allowed Files',
    '',
    bulletList(report.card.allowedFiles),
    '',
    '## Forbidden Files',
    '',
    bulletList(report.card.forbiddenFiles),
    '',
    '## Proof Gates',
    '',
    bulletList(report.card.proofGates),
    '',
    '## Open Risks',
    '',
    bulletList(report.card.risks),
    '',
    '## Notes',
    '',
    bulletList(report.notes),
    '',
    '## Next Exact Step',
    '',
    report.nextExactStep,
    '',
  ].join('\n');
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}