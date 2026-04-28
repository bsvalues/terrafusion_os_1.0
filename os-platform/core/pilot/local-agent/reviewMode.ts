import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { LocalAgentCardLockStore } from './cardLock.js';
import { runProcess } from './command.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import { LocalAgentModelGateway } from './modelGateway.js';
import { matchesGlob } from './policy.js';

interface LocalAgentProofGateSnapshot {
  command: string;
  ok: boolean;
  skipped: boolean;
}

interface LocalAgentProofSnapshotFile {
  ok: boolean;
  workCardId: string;
  task: string;
  results: LocalAgentProofGateSnapshot[];
}

interface LocalAgentSaveStateFile {
  summary: string;
  nextExactStep: string;
  notes?: string[];
  git?: {
    branch?: string;
    changedFiles?: string[];
  };
}

interface LocalAgentEventRecord {
  ts?: number;
  type?: string;
}

interface StoredPatchProposal {
  proposal?: {
    id?: string;
    path?: string;
    createdAt?: number;
    diff?: string;
  };
}

export interface LocalAgentReviewModeOptions {
  assistModel?: boolean;
  modelEndpoint?: string | null;
  modelName?: string | null;
  modelTimeoutMs?: number;
}

export interface LocalAgentReviewArtifactSummary {
  available: boolean;
  title: string;
  lines: string[];
}

export interface LocalAgentReviewGitSummary {
  branch: string;
  changedFiles: string[];
  stagedFiles: string[];
  untrackedFiles: string[];
}

export interface LocalAgentReviewPatchSummary {
  id: string;
  path: string;
  createdAt: number | null;
  diffChars: number;
}

export interface LocalAgentReviewEventHistory {
  available: boolean;
  title: string;
  lines: string[];
}

export interface LocalAgentReviewRiskSummary {
  scopeRisks: string[];
  proofGaps: string[];
  failedProofGates: string[];
  pendingPatchRisks: string[];
  forbiddenPathRisks: string[];
  missingSaveStateRisk: string[];
  finalizeBlocked: boolean;
  finalizeBlockers: string[];
}

export interface LocalAgentReviewModelAssistance {
  requested: boolean;
  used: boolean;
  status: string;
  model: string | null;
  endpoint: string | null;
  toolCallsDetected: boolean;
  advisoryText: string | null;
}

export interface LocalAgentReviewReport {
  mode: 'Review';
  writesDisabled: true;
  lockedCard: LocalAgentReviewArtifactSummary;
  gitDiff: LocalAgentReviewArtifactSummary;
  pendingPatches: LocalAgentReviewPatchSummary[];
  proofResults: LocalAgentReviewArtifactSummary;
  saveState: LocalAgentReviewArtifactSummary;
  eventHistory: LocalAgentReviewEventHistory;
  risks: LocalAgentReviewRiskSummary;
  deterministicSummary: string;
  modelAssistance: LocalAgentReviewModelAssistance;
}

export class LocalAgentReviewMode {
  private readonly cardStore: LocalAgentCardLockStore;

  constructor(private readonly repoRoot: string) {
    this.cardStore = new LocalAgentCardLockStore(repoRoot);
  }

  async review(options: LocalAgentReviewModeOptions = {}): Promise<LocalAgentReviewReport> {
    try {
      const lockedCard = this.readLockedCard();
      const git = this.readGitSummary();
      const gitDiff = this.buildGitArtifact(git);
      const pendingPatches = this.readPendingPatches();
      const proofResults = this.readProofResults();
      const saveState = this.readSaveState();
      const eventHistory = this.readEventHistory();
      const risks = this.buildRisks(lockedCard, pendingPatches, proofResults, saveState);
      const deterministicSummary = buildDeterministicSummary(lockedCard, gitDiff, pendingPatches, proofResults, saveState, risks);
      const modelAssistance = await this.buildModelAssistance(options, lockedCard, gitDiff, pendingPatches, proofResults, saveState, eventHistory, risks, deterministicSummary);

      const report: LocalAgentReviewReport = {
        mode: 'Review',
        writesDisabled: true,
        lockedCard,
        gitDiff,
        pendingPatches,
        proofResults,
        saveState,
        eventHistory,
        risks,
        deterministicSummary,
        modelAssistance,
      };

      appendLocalAgentEvent(this.repoRoot, 'review_mode_completed', {
        requested: modelAssistance.requested,
        used: modelAssistance.used,
        status: redactText(modelAssistance.status),
        model: modelAssistance.model,
        toolCallsDetected: modelAssistance.toolCallsDetected,
        lockedCardAvailable: lockedCard.available,
        proofAvailable: proofResults.available,
        saveStateAvailable: saveState.available,
        pendingPatchCount: pendingPatches.length,
        riskCount: countRiskLines(risks),
        finalizeBlocked: risks.finalizeBlocked,
      });

      return report;
    } catch (error) {
      appendLocalAgentEvent(this.repoRoot, 'review_mode_failed', {
        requested: Boolean(options.assistModel),
        reason: redactText((error as Error).message),
      });
      throw error;
    }
  }

  private readLockedCard(): LocalAgentReviewArtifactSummary {
    try {
      const card = this.cardStore.load();
      return {
        available: true,
        title: 'Locked Card',
        lines: [
          `Card: ${card.id}`,
          `Task: ${card.task}`,
          `Mode: ${card.mode}`,
          `Allowed Files: ${card.allowedFiles.join(', ') || 'none'}`,
          `Forbidden Files: ${card.forbiddenFiles.join(', ') || 'none'}`,
          `Proof Gates: ${card.proofGates.join(', ') || 'none'}`,
        ],
      };
    } catch {
      return {
        available: false,
        title: 'Locked Card',
        lines: ['Missing locked card.'],
      };
    }
  }

  private readGitSummary(): LocalAgentReviewGitSummary {
    const branch = runProcess(this.repoRoot, 'git rev-parse --abbrev-ref HEAD', 10);
    const changed = runProcess(this.repoRoot, 'git diff --name-only', 10);
    const staged = runProcess(this.repoRoot, 'git diff --cached --name-only', 10);
    const status = runProcess(this.repoRoot, 'git status --short', 10);
    const statusLines = status.output.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const untrackedFiles = statusLines.filter(line => line.startsWith('?? ')).map(line => line.slice(3).trim());

    return {
      branch: branch.exitCode === 0 ? branch.output.trim() : 'unknown',
      changedFiles: changed.output.split(/\r?\n/).map(line => line.trim()).filter(Boolean),
      stagedFiles: staged.output.split(/\r?\n/).map(line => line.trim()).filter(Boolean),
      untrackedFiles,
    };
  }

  private buildGitArtifact(git: LocalAgentReviewGitSummary): LocalAgentReviewArtifactSummary {
    return {
      available: true,
      title: 'Git Diff Metadata',
      lines: [
        `Branch: ${git.branch}`,
        `Changed Files: ${git.changedFiles.join(', ') || 'none'}`,
        `Staged Files: ${git.stagedFiles.join(', ') || 'none'}`,
        `Untracked Files: ${git.untrackedFiles.join(', ') || 'none'}`,
      ],
    };
  }

  private readPendingPatches(): LocalAgentReviewPatchSummary[] {
    const patchDir = terrafusionPath(this.repoRoot, 'patches');
    if (!existsSync(patchDir)) {
      return [];
    }

    return readdirSync(patchDir)
      .filter(entry => entry.endsWith('.json'))
      .sort()
      .map(entry => {
        const payload = JSON.parse(readFileSync(resolve(patchDir, entry), 'utf8')) as StoredPatchProposal;
        return {
          id: payload.proposal?.id ?? entry.replace(/\.json$/, ''),
          path: payload.proposal?.path ?? 'unknown',
          createdAt: typeof payload.proposal?.createdAt === 'number' ? payload.proposal.createdAt : null,
          diffChars: payload.proposal?.diff?.length ?? 0,
        } satisfies LocalAgentReviewPatchSummary;
      });
  }

  private readProofResults(): LocalAgentReviewArtifactSummary {
    try {
      const proof = JSON.parse(readFileSync(terrafusionPath(this.repoRoot, 'proof-results.json'), 'utf8')) as LocalAgentProofSnapshotFile;
      const failed = proof.results.filter(result => !result.skipped && !result.ok).map(result => result.command);
      const blocked = proof.results.filter(result => result.skipped).map(result => result.command);
      return {
        available: true,
        title: 'Proof Results',
        lines: [
          `Overall: ${proof.ok ? 'PASS' : 'FAIL'}`,
          `Work Card: ${proof.workCardId}`,
          `Task: ${proof.task}`,
          `Failed Proof Gates: ${failed.join(', ') || 'none'}`,
          `Blocked Gates: ${blocked.join(', ') || 'none'}`,
        ],
      };
    } catch {
      return {
        available: false,
        title: 'Proof Results',
        lines: ['Missing proof results.'],
      };
    }
  }

  private readSaveState(): LocalAgentReviewArtifactSummary {
    try {
      const saveState = JSON.parse(readFileSync(terrafusionPath(this.repoRoot, 'save-state.json'), 'utf8')) as LocalAgentSaveStateFile;
      return {
        available: true,
        title: 'Save State',
        lines: [
          `Summary: ${saveState.summary}`,
          `Next Exact Step: ${saveState.nextExactStep}`,
          `Branch: ${saveState.git?.branch ?? 'unknown'}`,
          `Changed Files: ${saveState.git?.changedFiles?.join(', ') || 'none'}`,
          `Notes: ${saveState.notes?.join(', ') || 'none'}`,
        ],
      };
    } catch {
      return {
        available: false,
        title: 'Save State',
        lines: ['Missing save state.'],
      };
    }
  }

  private readEventHistory(): LocalAgentReviewEventHistory {
    const eventsPath = terrafusionPath(this.repoRoot, 'agent-events.jsonl');
    if (!existsSync(eventsPath)) {
      return {
        available: false,
        title: 'Event History',
        lines: ['No local-agent event history is available.'],
      };
    }

    const events = readFileSync(eventsPath, 'utf8')
      .split(/\r?\n/)
      .filter(Boolean)
      .map(line => JSON.parse(line) as LocalAgentEventRecord);
    const counts = new Map<string, number>();
    for (const event of events) {
      const type = event.type ?? 'unknown';
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }

    const recent = events.slice(-5).map(event => `${event.type ?? 'unknown'}@${event.ts ?? 0}`);
    return {
      available: true,
      title: 'Event History',
      lines: [
        `Total Events: ${events.length}`,
        `Event Types: ${Array.from(counts.entries()).map(([type, count]) => `${type}(${count})`).join(', ') || 'none'}`,
        `Recent Events: ${recent.join(', ') || 'none'}`,
      ],
    };
  }

  private buildRisks(
    lockedCard: LocalAgentReviewArtifactSummary,
    pendingPatches: LocalAgentReviewPatchSummary[],
    proofResults: LocalAgentReviewArtifactSummary,
    saveState: LocalAgentReviewArtifactSummary,
  ): LocalAgentReviewRiskSummary {
    const scopeRisks: string[] = [];
    const proofGaps: string[] = [];
    const failedProofGates: string[] = [];
    const pendingPatchRisks: string[] = [];
    const forbiddenPathRisks: string[] = [];
    const missingSaveStateRisk: string[] = [];
    const finalizeBlockers: string[] = [];

    if (!lockedCard.available) {
      scopeRisks.push('Missing locked card means review cannot confirm the bounded file scope.');
      finalizeBlockers.push('Locked work card is required before finalize.');
    }

    if (!proofResults.available) {
      proofGaps.push('Missing proof results.');
      finalizeBlockers.push('Proof results are required before finalize.');
    } else {
      const proofLine = proofResults.lines.find(line => line.startsWith('Overall: '));
      if (proofLine?.includes('FAIL')) {
        proofGaps.push('Proof did not pass.');
        finalizeBlockers.push('Proof did not pass. Finalize blocked.');
      }

      const failedLine = proofResults.lines.find(line => line.startsWith('Failed Proof Gates: '));
      const failed = failedLine ? failedLine.replace('Failed Proof Gates: ', '').split(', ').filter(value => value && value !== 'none') : [];
      failedProofGates.push(...failed);
    }

    if (!saveState.available || !existsSync(terrafusionPath(this.repoRoot, 'save-state.md'))) {
      missingSaveStateRisk.push('Missing save state.');
      finalizeBlockers.push('Save State is required before finalizing.');
    }

    const card = this.tryLoadCard();
    for (const patch of pendingPatches) {
      pendingPatchRisks.push(`Pending patch ${patch.id} targets ${patch.path}.`);
      if (card) {
        const normalizedPath = patch.path.replace(/\\/g, '/');
        const hitsForbidden = card.forbiddenFiles.some(rule => matchesGlob(normalizedPath, rule));
        const hitsAllowed = card.allowedFiles.some(rule => matchesGlob(normalizedPath, rule));
        if (hitsForbidden || !hitsAllowed) {
          forbiddenPathRisks.push(`Pending patch path is outside locked scope: ${patch.path}`);
        }
      }
    }

    return {
      scopeRisks,
      proofGaps,
      failedProofGates,
      pendingPatchRisks,
      forbiddenPathRisks,
      missingSaveStateRisk,
      finalizeBlocked: finalizeBlockers.length > 0,
      finalizeBlockers: Array.from(new Set(finalizeBlockers)),
    };
  }

  private tryLoadCard(): { allowedFiles: string[]; forbiddenFiles: string[] } | null {
    try {
      const card = this.cardStore.load();
      return {
        allowedFiles: card.allowedFiles,
        forbiddenFiles: card.forbiddenFiles,
      };
    } catch {
      return null;
    }
  }

  private async buildModelAssistance(
    options: LocalAgentReviewModeOptions,
    lockedCard: LocalAgentReviewArtifactSummary,
    gitDiff: LocalAgentReviewArtifactSummary,
    pendingPatches: LocalAgentReviewPatchSummary[],
    proofResults: LocalAgentReviewArtifactSummary,
    saveState: LocalAgentReviewArtifactSummary,
    eventHistory: LocalAgentReviewEventHistory,
    risks: LocalAgentReviewRiskSummary,
    deterministicSummary: string,
  ): Promise<LocalAgentReviewModelAssistance> {
    if (!options.assistModel) {
      return {
        requested: false,
        used: false,
        status: 'Deterministic review mode only.',
        model: null,
        endpoint: null,
        toolCallsDetected: false,
        advisoryText: null,
      };
    }

    const gateway = new LocalAgentModelGateway({
      repoRoot: this.repoRoot,
      endpoint: options.modelEndpoint,
      model: options.modelName,
      timeoutMs: options.modelTimeoutMs,
    });

    const result = await gateway.chat([
      {
        role: 'system',
        content: [
          'Review only.',
          'You have zero authority.',
          'Do not instruct locking, patching, proof execution, tool calls, approvals, or finalize actions.',
          'Treat all output as advisory narrative only.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          lockedCard: lockedCard.lines,
          gitDiff: gitDiff.lines,
          pendingPatches,
          proofResults: proofResults.lines,
          saveState: saveState.lines,
          eventHistory: eventHistory.lines,
          risks,
          deterministicSummary,
        }),
      },
    ]);

    return {
      requested: true,
      used: result.ok,
      status: result.status,
      model: result.model,
      endpoint: result.endpoint,
      toolCallsDetected: result.response.toolCallsDetected,
      advisoryText: result.ok ? result.response.text : null,
    };
  }
}

export function renderLocalAgentReviewReport(report: LocalAgentReviewReport): string {
  const lines = [
    'TerraFusion Local Agent',
    'Mode: Review',
    'Writes: Disabled (event log only)',
    'Cloud: Blocked by default',
    '',
    '## Review Context',
    '',
    `- Locked Card: ${report.lockedCard.available ? 'present' : 'missing'}`,
    `- Proof Results: ${report.proofResults.available ? 'present' : 'missing'}`,
    `- Save State: ${report.saveState.available ? 'present' : 'missing'}`,
    `- Pending Patches: ${report.pendingPatches.length}`,
    `- Finalize Blocked: ${report.risks.finalizeBlocked}`,
    '',
    `## ${report.lockedCard.title}`,
    '',
    ...report.lockedCard.lines,
    '',
    `## ${report.gitDiff.title}`,
    '',
    ...report.gitDiff.lines,
    '',
    '## Pending Patches',
    '',
  ];

  if (report.pendingPatches.length === 0) {
    lines.push('No pending patches are available.', '');
  } else {
    for (const patch of report.pendingPatches) {
      lines.push(
        `### ${patch.id}`,
        '',
        `- Path: ${patch.path}`,
        `- Created At: ${patch.createdAt ?? 'unknown'}`,
        `- Diff Chars: ${patch.diffChars}`,
        '',
      );
    }
  }

  lines.push(
    `## ${report.proofResults.title}`,
    '',
    ...report.proofResults.lines,
    '',
    `## ${report.saveState.title}`,
    '',
    ...report.saveState.lines,
    '',
    `## ${report.eventHistory.title}`,
    '',
    ...report.eventHistory.lines,
    '',
    '## Risks',
    '',
    '### Scope Risks',
    '',
    bulletList(report.risks.scopeRisks),
    '',
    '### Proof Gaps',
    '',
    bulletList(report.risks.proofGaps),
    '',
    '### Failed Proof Gates',
    '',
    bulletList(report.risks.failedProofGates),
    '',
    '### Pending Patch Risks',
    '',
    bulletList(report.risks.pendingPatchRisks),
    '',
    '### Forbidden-Path Risks',
    '',
    bulletList(report.risks.forbiddenPathRisks),
    '',
    '### Missing Save-State Risk',
    '',
    bulletList(report.risks.missingSaveStateRisk),
    '',
    '### Finalize Blockers',
    '',
    bulletList(report.risks.finalizeBlockers),
    '',
    '## Deterministic Summary',
    '',
    report.deterministicSummary,
    '',
    '## Model Assistance',
    '',
    `- Requested: ${report.modelAssistance.requested}`,
    `- Used: ${report.modelAssistance.used}`,
    `- Status: ${report.modelAssistance.status}`,
    `- Model: ${report.modelAssistance.model ?? 'none'}`,
    `- Endpoint: ${report.modelAssistance.endpoint ?? 'none'}`,
    `- ToolCallsDetected: ${report.modelAssistance.toolCallsDetected}`,
    '',
    '## Advisory Review',
    '',
    report.modelAssistance.advisoryText ?? 'No model review was used.',
    '',
  );

  return lines.join('\n');
}

function buildDeterministicSummary(
  lockedCard: LocalAgentReviewArtifactSummary,
  gitDiff: LocalAgentReviewArtifactSummary,
  pendingPatches: LocalAgentReviewPatchSummary[],
  proofResults: LocalAgentReviewArtifactSummary,
  saveState: LocalAgentReviewArtifactSummary,
  risks: LocalAgentReviewRiskSummary,
): string {
  const parts = [
    lockedCard.available
      ? 'A locked card is present for scope review.'
      : 'No locked card is present, so scope review is incomplete.',
    gitDiff.lines[1] ? 'Git diff metadata is available for review.' : 'Git diff metadata is limited.',
    pendingPatches.length > 0
      ? `There are ${pendingPatches.length} pending patch proposal(s) to inspect without applying.`
      : 'There are no pending patches.',
    proofResults.available
      ? 'Proof results are available for risk review.'
      : 'Proof results are missing.',
    saveState.available
      ? 'A save-state checkpoint is available.'
      : 'Save state is missing.',
    risks.finalizeBlocked
      ? 'Finalize would currently be blocked.'
      : 'Finalize is not currently blocked by locked-card, proof, or save-state prerequisites.',
    'Review mode remains read-only and cannot lock, patch, prove, or finalize anything.',
  ];

  return parts.join(' ');
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}

function countRiskLines(risks: LocalAgentReviewRiskSummary): number {
  return [
    risks.scopeRisks.length,
    risks.proofGaps.length,
    risks.failedProofGates.length,
    risks.pendingPatchRisks.length,
    risks.forbiddenPathRisks.length,
    risks.missingSaveStateRisk.length,
    risks.finalizeBlockers.length,
  ].reduce((total, count) => total + count, 0);
}

function redactText(value: string): string {
  return value
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [TOKEN_REDACTED]');
}