import { existsSync, readFileSync, statSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';

import { LocalAgentCardLockStore } from './cardLock.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import { LocalAgentModelGateway } from './modelGateway.js';

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

export interface LocalAgentExplainModeOptions {
  assistModel?: boolean;
  modelEndpoint?: string | null;
  modelName?: string | null;
  modelTimeoutMs?: number;
  files?: string[];
}

export interface LocalAgentExplainFileSummary {
  path: string;
  lines: number;
  exports: number;
  asyncFunctions: number;
  classes: number;
  symbolPreview: string[];
}

export interface LocalAgentExplainArtifactSummary {
  available: boolean;
  title: string;
  lines: string[];
}

export interface LocalAgentExplainModelAssistance {
  requested: boolean;
  used: boolean;
  status: string;
  model: string | null;
  endpoint: string | null;
  toolCallsDetected: boolean;
  advisoryText: string | null;
}

export interface LocalAgentExplainReport {
  mode: 'Explain';
  writesDisabled: true;
  lockedCard: LocalAgentExplainArtifactSummary;
  proofResults: LocalAgentExplainArtifactSummary;
  saveState: LocalAgentExplainArtifactSummary;
  selectedFiles: LocalAgentExplainFileSummary[];
  deterministicSummary: string;
  modelAssistance: LocalAgentExplainModelAssistance;
}

export class LocalAgentExplainMode {
  private readonly cardStore: LocalAgentCardLockStore;

  constructor(private readonly repoRoot: string) {
    this.cardStore = new LocalAgentCardLockStore(repoRoot);
  }

  async explain(options: LocalAgentExplainModeOptions = {}): Promise<LocalAgentExplainReport> {
    const normalizedFiles = this.normalizeSelectedFiles(options.files ?? []);

    try {
      const lockedCard = this.readLockedCard();
      const proofResults = this.readProofResults();
      const saveState = this.readSaveState();
      const selectedFiles = normalizedFiles.map(filePath => this.summarizeSelectedFile(filePath));
      const deterministicSummary = buildDeterministicSummary(lockedCard, proofResults, saveState, selectedFiles);
      const modelAssistance = await this.buildModelAssistance(options, lockedCard, proofResults, saveState, selectedFiles, deterministicSummary);

      const report: LocalAgentExplainReport = {
        mode: 'Explain',
        writesDisabled: true,
        lockedCard,
        proofResults,
        saveState,
        selectedFiles,
        deterministicSummary,
        modelAssistance,
      };

      appendLocalAgentEvent(this.repoRoot, 'explain_mode_completed', {
        requested: modelAssistance.requested,
        used: modelAssistance.used,
        status: modelAssistance.status,
        model: modelAssistance.model,
        endpoint: modelAssistance.endpoint,
        toolCallsDetected: modelAssistance.toolCallsDetected,
        lockedCardAvailable: lockedCard.available,
        proofResultsAvailable: proofResults.available,
        saveStateAvailable: saveState.available,
        selectedFiles: selectedFiles.map(file => file.path),
        selectedFileCount: selectedFiles.length,
        deterministicSummaryChars: deterministicSummary.length,
        advisoryChars: modelAssistance.advisoryText?.length ?? 0,
      });

      return report;
    } catch (error) {
      appendLocalAgentEvent(this.repoRoot, 'explain_mode_failed', {
        requested: Boolean(options.assistModel),
        selectedFileCount: options.files?.length ?? 0,
        reason: redactText((error as Error).message),
      });
      throw error;
    }
  }

  private readLockedCard(): LocalAgentExplainArtifactSummary {
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
          `Proof Gates: ${card.proofGates.join(', ') || 'none'}`,
        ],
      };
    } catch {
      return {
        available: false,
        title: 'Locked Card',
        lines: ['No locked work card is available.'],
      };
    }
  }

  private readProofResults(): LocalAgentExplainArtifactSummary {
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
          `Gates: ${proof.results.map(result => result.command).join(', ') || 'none'}`,
          `Failed: ${failed.join(', ') || 'none'}`,
          `Blocked: ${blocked.join(', ') || 'none'}`,
        ],
      };
    } catch {
      return {
        available: false,
        title: 'Proof Results',
        lines: ['No proof results are available.'],
      };
    }
  }

  private readSaveState(): LocalAgentExplainArtifactSummary {
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
        lines: ['No save state is available.'],
      };
    }
  }

  private normalizeSelectedFiles(files: string[]): string[] {
    const uniqueFiles = Array.from(new Set(files.map(file => file.trim()).filter(Boolean)));
    return uniqueFiles.map(file => this.normalizeSelectedFile(file));
  }

  private normalizeSelectedFile(requestedPath: string): string {
    const localAgentRoot = resolve(this.repoRoot, 'os-platform/core/pilot/local-agent');
    const resolvedPath = resolve(this.repoRoot, requestedPath);
    const relativeToLocalAgent = relative(localAgentRoot, resolvedPath);

    if (
      relativeToLocalAgent.startsWith('..') ||
      isAbsolute(relativeToLocalAgent) ||
      requestedPath.includes('..\\') ||
      requestedPath.includes('../')
    ) {
      throw new Error('Explain mode only allows explicit local-agent files under os-platform/core/pilot/local-agent/**.');
    }

    if (!existsSync(resolvedPath) || !statSync(resolvedPath).isFile()) {
      throw new Error(`Selected file does not exist: ${requestedPath}`);
    }

    return relative(this.repoRoot, resolvedPath).replace(/\\/g, '/');
  }

  private summarizeSelectedFile(filePath: string): LocalAgentExplainFileSummary {
    const text = readFileSync(resolve(this.repoRoot, filePath), 'utf8');
    return {
      path: filePath,
      lines: text.split(/\r?\n/).length,
      exports: countMatches(text, /^\s*export\b/gm),
      asyncFunctions: countMatches(text, /\basync\s+function\b|\basync\s*\(/g),
      classes: countMatches(text, /^\s*(?:export\s+)?class\b/gm),
      symbolPreview: collectSymbols(text),
    };
  }

  private async buildModelAssistance(
    options: LocalAgentExplainModeOptions,
    lockedCard: LocalAgentExplainArtifactSummary,
    proofResults: LocalAgentExplainArtifactSummary,
    saveState: LocalAgentExplainArtifactSummary,
    selectedFiles: LocalAgentExplainFileSummary[],
    deterministicSummary: string,
  ): Promise<LocalAgentExplainModelAssistance> {
    if (!options.assistModel) {
      return {
        requested: false,
        used: false,
        status: 'Deterministic explain mode only.',
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
          'Explain only.',
          'You have zero authority.',
          'Do not instruct locking, patching, proof execution, or finalize actions.',
          'Treat all output as advisory explanation only.',
        ].join(' '),
      },
      {
        role: 'user',
        content: JSON.stringify({
          lockedCard: lockedCard.lines,
          proofResults: proofResults.lines,
          saveState: saveState.lines,
          selectedFiles,
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

export function renderLocalAgentExplainReport(report: LocalAgentExplainReport): string {
  const lines = [
    'TerraFusion Local Agent',
    'Mode: Explain',
    'Writes: Disabled (event log only)',
    'Cloud: Blocked by default',
    '',
    '## Explain Context',
    '',
    `- Locked Card: ${report.lockedCard.available ? 'present' : 'missing'}`,
    `- Proof Results: ${report.proofResults.available ? 'present' : 'missing'}`,
    `- Save State: ${report.saveState.available ? 'present' : 'missing'}`,
    `- Selected Files: ${report.selectedFiles.length}`,
    '',
    `## ${report.lockedCard.title}`,
    '',
    ...report.lockedCard.lines,
    '',
    `## ${report.proofResults.title}`,
    '',
    ...report.proofResults.lines,
    '',
    `## ${report.saveState.title}`,
    '',
    ...report.saveState.lines,
    '',
    '## Selected Files',
    '',
  ];

  if (report.selectedFiles.length === 0) {
    lines.push('No explicit local-agent files were selected.', '');
  } else {
    for (const file of report.selectedFiles) {
      lines.push(
        `### ${file.path}`,
        '',
        `- Lines: ${file.lines}`,
        `- Exports: ${file.exports}`,
        `- Async Functions: ${file.asyncFunctions}`,
        `- Classes: ${file.classes}`,
        `- Symbols: ${file.symbolPreview.join(', ') || 'none'}`,
        '',
      );
    }
  }

  lines.push(
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
    '## Advisory Explanation',
    '',
    report.modelAssistance.advisoryText ?? 'No model explanation was used.',
    '',
  );

  return lines.join('\n');
}

function buildDeterministicSummary(
  lockedCard: LocalAgentExplainArtifactSummary,
  proofResults: LocalAgentExplainArtifactSummary,
  saveState: LocalAgentExplainArtifactSummary,
  selectedFiles: LocalAgentExplainFileSummary[],
): string {
  const parts = [
    lockedCard.available
      ? `A locked card is present and describes the current bounded task.`
      : 'No locked card is present, so explain mode is operating from repo state only.',
    proofResults.available
      ? `Proof results are available for review.`
      : 'No proof results are available yet.',
    saveState.available
      ? `A save-state checkpoint exists with the next exact step.`
      : 'No save-state checkpoint is available.',
    selectedFiles.length > 0
      ? `Selected local-agent files were summarized without granting write authority.`
      : 'No explicit local-agent files were selected.',
    'Explain mode remains read-only and cannot lock cards, patch files, run proof gates, or finalize work.',
  ];

  return parts.join(' ');
}

function collectSymbols(text: string): string[] {
  const matches = Array.from(text.matchAll(/(?:export\s+)?(?:async\s+)?(?:function|class|const|let|var|interface|type)\s+([A-Za-z0-9_]+)/g));
  return Array.from(new Set(matches.map(match => match[1]).filter(Boolean))).slice(0, 6);
}

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function redactText(value: string): string {
  return value
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [TOKEN_REDACTED]');
}