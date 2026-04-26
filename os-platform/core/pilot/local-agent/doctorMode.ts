import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';

import { runProcess } from './command.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import { LocalAgentModelGateway } from './modelGateway.js';

export interface LocalAgentDoctorModeOptions {
  modelEndpoint?: string | null;
  modelName?: string | null;
  modelTimeoutMs?: number;
}

export interface LocalAgentDoctorReport {
  createdAt: number;
  overallStatus: 'pass' | 'warn' | 'fail';
  criticalFailures: number;
  warnings: number;
  lockedCard: boolean;
  proofResults: boolean;
  saveState: boolean;
  patchPreviewCount: number;
  gitChangedFiles: string[];
  findings: string[];
}

export interface LocalAgentModelRuntimeStatus {
  healthy: boolean;
  endpoint: string | null;
  model: string | null;
  startupMode: string | null;
  warnings: string[];
  status: string;
  modelCount: number;
}

export interface LocalAgentDoctorResult {
  report: LocalAgentDoctorReport;
  modelRuntime: LocalAgentModelRuntimeStatus;
}

export class LocalAgentDoctorMode {
  constructor(private readonly repoRoot: string) {}

  async run(options: LocalAgentDoctorModeOptions = {}): Promise<LocalAgentDoctorResult> {
    const modelGateway = new LocalAgentModelGateway({
      repoRoot: this.repoRoot,
      endpoint: options.modelEndpoint,
      model: options.modelName,
      timeoutMs: options.modelTimeoutMs,
    });

    const [health, models] = await Promise.all([
      modelGateway.checkHealth(),
      modelGateway.listModels(),
    ]);

    const modelWarnings: string[] = [];
    if (!health.ok) {
      modelWarnings.push(health.status);
    }
    if (!models.ok && models.status) {
      modelWarnings.push(models.status);
    }

    const modelRuntime: LocalAgentModelRuntimeStatus = {
      healthy: health.ok,
      endpoint: health.endpoint,
      model: health.model,
      startupMode: options.modelEndpoint ? 'explicit-endpoint' : 'default-local-only',
      warnings: Array.from(new Set(modelWarnings.map(redactText))),
      status: redactText(health.status),
      modelCount: models.models.length,
    };

    const report = this.buildDoctorReport(modelRuntime);
    this.writeArtifacts(report, modelRuntime);

    appendLocalAgentEvent(this.repoRoot, 'doctor_report_written', {
      overallStatus: report.overallStatus,
      criticalFailures: report.criticalFailures,
      warnings: report.warnings,
      lockedCard: report.lockedCard,
      proofResults: report.proofResults,
      saveState: report.saveState,
      patchPreviewCount: report.patchPreviewCount,
      gitChangedFileCount: report.gitChangedFiles.length,
      modelHealthy: modelRuntime.healthy,
      modelWarningCount: modelRuntime.warnings.length,
    });

    return {
      report,
      modelRuntime,
    };
  }

  private buildDoctorReport(modelRuntime: LocalAgentModelRuntimeStatus): LocalAgentDoctorReport {
    const lockedCard = existsSync(terrafusionPath(this.repoRoot, 'current-work-card.json'));
    const proofResults = existsSync(terrafusionPath(this.repoRoot, 'proof-results.json'));
    const saveState = existsSync(terrafusionPath(this.repoRoot, 'save-state.md'));
    const patchDir = terrafusionPath(this.repoRoot, 'patches');
    const patchPreviewCount = existsSync(patchDir)
      ? readdirSync(patchDir).filter(entry => entry.endsWith('.json')).length
      : 0;
    const gitChangedFiles = this.readGitChangedFiles();

    const findings: string[] = [];
    let criticalFailures = 0;
    let warnings = 0;

    if (!lockedCard) {
      warnings += 1;
      findings.push('Missing locked work card.');
    }

    if (!proofResults) {
      warnings += 1;
      findings.push('Missing proof results.');
    }

    if (!saveState) {
      warnings += 1;
      findings.push('Missing save state.');
    }

    if (!modelRuntime.healthy) {
      warnings += 1;
      findings.push(`Model runtime: ${modelRuntime.status}`);
    }

    const overallStatus: 'pass' | 'warn' | 'fail' = criticalFailures > 0
      ? 'fail'
      : warnings > 0
        ? 'warn'
        : 'pass';

    return {
      createdAt: Math.floor(Date.now() / 1000),
      overallStatus,
      criticalFailures,
      warnings,
      lockedCard,
      proofResults,
      saveState,
      patchPreviewCount,
      gitChangedFiles,
      findings,
    };
  }

  private readGitChangedFiles(): string[] {
    const changed = runProcess(this.repoRoot, 'git diff --name-only', 10);
    const staged = runProcess(this.repoRoot, 'git diff --cached --name-only', 10);
    const status = runProcess(this.repoRoot, 'git status --short', 10);
    const untracked = status.output
      .split(/\r?\n/)
      .filter(line => line.startsWith('?? '))
      .map(line => line.slice(3).trim());

    return Array.from(new Set([
      ...changed.output.split(/\r?\n/),
      ...staged.output.split(/\r?\n/),
      ...untracked,
    ].map(line => line.trim()).filter(Boolean))).sort();
  }

  private writeArtifacts(report: LocalAgentDoctorReport, modelRuntime: LocalAgentModelRuntimeStatus): void {
    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, 'doctor-report.json'), JSON.stringify(report, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'model-runtime-status.json'), JSON.stringify(modelRuntime, null, 2), 'utf8');
  }
}

export function renderLocalAgentDoctorResult(result: LocalAgentDoctorResult): string {
  return [
    'TerraFusion Local Agent Doctor',
    '',
    `Overall:      ${result.report.overallStatus.toUpperCase()}`,
    `Locked Card:  ${result.report.lockedCard}`,
    `Proof:        ${result.report.proofResults}`,
    `Save State:   ${result.report.saveState}`,
    `Patch Count:  ${result.report.patchPreviewCount}`,
    `Changed Files:${result.report.gitChangedFiles.length}`,
    `Model Health: ${result.modelRuntime.healthy ? 'PASS' : 'FAIL'}`,
    `Model Status: ${result.modelRuntime.status}`,
    `Model Count:  ${result.modelRuntime.modelCount}`,
    '',
    'Wrote:',
    '  .terrafusion/doctor-report.json',
    '  .terrafusion/model-runtime-status.json',
  ].join('\n');
}

function redactText(value: string): string {
  return value
    .replace(/sk-[a-zA-Z0-9_-]+/g, '[API_KEY_REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [TOKEN_REDACTED]');
}