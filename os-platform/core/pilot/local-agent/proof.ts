import { readFileSync, writeFileSync } from 'node:fs';

import { LocalAgentCardLockStore } from './cardLock.js';
import { runProcess } from './command.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import { LocalAgentPermissionPolicy, type LocalAgentPermissionDecision, loadFounderLocalAgentPolicy } from './policy.js';

export interface LocalAgentProofGateResult {
  command: string;
  ok: boolean;
  skipped: boolean;
  decision: string;
  exitCode: number | null;
  output: string;
  reason: string;
}

export interface LocalAgentProofReport {
  ok: boolean;
  workCardId: string;
  task: string;
  startedAt: number;
  finishedAt: number;
  results: LocalAgentProofGateResult[];
}

export class LocalAgentProofRunner {
  private readonly policy: LocalAgentPermissionPolicy;
  private readonly cardStore: LocalAgentCardLockStore;
  private gitRepository: boolean | null = null;

  constructor(private readonly repoRoot: string, private readonly timeoutSeconds = 180) {
    this.policy = new LocalAgentPermissionPolicy(loadFounderLocalAgentPolicy(), repoRoot);
    this.cardStore = new LocalAgentCardLockStore(repoRoot);
  }

  run(): LocalAgentProofReport {
    const card = this.cardStore.requireLockedCard();
    if (card.proofGates.length === 0) {
      throw new Error('Locked work card has no proof gates.');
    }

    const startedAt = Math.floor(Date.now() / 1000);
    appendLocalAgentEvent(this.repoRoot, 'proof_started', {
      workCardId: card.id,
      task: card.task,
      proofGates: card.proofGates,
    });

    const results = card.proofGates.map(command => this.runGate(command));
    const report: LocalAgentProofReport = {
      ok: results.every(result => result.ok),
      workCardId: card.id,
      task: card.task,
      startedAt,
      finishedAt: Math.floor(Date.now() / 1000),
      results,
    };

    writeFileSync(terrafusionPath(this.repoRoot, 'proof-results.json'), JSON.stringify(report, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'proof-results.md'), renderLocalAgentProofReport(report), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'proof_completed', {
      workCardId: report.workCardId,
      ok: report.ok,
      resultCount: report.results.length,
    });

    return report;
  }

  load(): LocalAgentProofReport {
    return JSON.parse(readFileSync(terrafusionPath(this.repoRoot, 'proof-results.json'), 'utf8')) as LocalAgentProofReport;
  }

  private runGate(command: string): LocalAgentProofGateResult {
    if (!command.trim()) {
      throw new Error('Proof gate command cannot be empty.');
    }

    const decision = this.policy.decide({
      tool: 'proof_gate',
      action: 'command',
      target: command,
      payload: {},
    });

    const result = decision.decision === 'allow'
      ? this.executeGate(command, decision)
      : {
          command,
          ok: false,
          skipped: true,
          decision: decision.decision,
          exitCode: null,
          output: '',
          reason: `Blocked by permission policy: ${decision.reason}`,
        };

    appendLocalAgentEvent(this.repoRoot, 'proof_gate_completed', {
      command: result.command,
      ok: result.ok,
      skipped: result.skipped,
      decision: result.decision,
      exitCode: result.exitCode,
      reason: result.reason,
      outputChars: result.output.length,
    });

    return result;
  }

  private executeGate(command: string, decision: LocalAgentPermissionDecision): LocalAgentProofGateResult {
    if (isGitCommand(command) && !this.isGitRepository()) {
      return {
        command,
        ok: false,
        skipped: false,
        decision: decision.decision,
        exitCode: 129,
        output: 'Git unavailable: not a git repository at the selected repo root.',
        reason: 'git unavailable: not a git repository',
      };
    }

    const execution = runProcess(this.repoRoot, command, this.timeoutSeconds);
    const normalized = normalizeProofExecution(command, execution.exitCode, execution.output);
    return {
      command,
      ok: execution.exitCode === 0,
      skipped: false,
      decision: decision.decision,
      exitCode: execution.exitCode,
      output: normalized.output,
      reason: execution.exitCode === 0 ? 'command passed' : normalized.reason,
    };
  }

  private isGitRepository(): boolean {
    if (this.gitRepository !== null) {
      return this.gitRepository;
    }

    const probe = runProcess(this.repoRoot, 'git rev-parse --is-inside-work-tree', 10);
    this.gitRepository = probe.exitCode === 0 && probe.output.trim() === 'true';
    return this.gitRepository;
  }
}

function normalizeProofExecution(command: string, exitCode: number, output: string): { output: string; reason: string } {
  if (exitCode === 0) {
    return {
      output,
      reason: 'command passed',
    };
  }

  if (/^git\s+/i.test(command) && /not a git repository/i.test(output)) {
    return {
      output: 'Git unavailable: not a git repository at the selected repo root.',
      reason: 'git unavailable: not a git repository',
    };
  }

  return {
    output,
    reason: exitCode === 127 ? 'command unavailable' : 'command failed',
  };
}

function isGitCommand(command: string): boolean {
  return /^git\s+/i.test(command.trim());
}

export function renderLocalAgentProofReport(report: LocalAgentProofReport): string {
  const lines = [
    '# TerraFusion Proof Results',
    '',
    '## Overall Result',
    '',
    report.ok ? 'PASS' : 'FAIL',
    '',
    '## Work Card',
    '',
    `- ID: ${report.workCardId}`,
    `- Task: ${report.task}`,
    '',
    '## Gates',
    '',
  ];

  for (const result of report.results) {
    const status = result.skipped ? 'BLOCKED' : result.ok ? 'PASS' : 'FAIL';
    lines.push(
      `### ${result.command}`,
      '',
      `- Status: ${status}`,
      `- Decision: ${result.decision}`,
      `- Exit Code: ${result.exitCode}`,
      `- Reason: ${result.reason}`,
      '',
      '```text',
      result.output.slice(-4000),
      '```',
      '',
    );
  }

  return lines.join('\n');
}