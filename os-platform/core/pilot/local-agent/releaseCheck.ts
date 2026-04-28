import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';

export interface LocalAgentReleaseCheckItem {
  name: string;
  ok: boolean;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  path: string;
}

export interface LocalAgentReleaseCheckReport {
  createdAt: number;
  ok: boolean;
  releaseStatus: string;
  criticalFailures: number;
  warnings: number;
  items: LocalAgentReleaseCheckItem[];
}

export class LocalAgentReleaseCheckRunner {
  constructor(private readonly repoRoot: string) {}

  run(): LocalAgentReleaseCheckReport {
    const items: LocalAgentReleaseCheckItem[] = [
      this.requiredMarkdown('Command Registry', '.terrafusion/command-registry.md'),
      this.requiredMarkdown('Control Center State', '.terrafusion/control-center-state.md'),
      this.requiredJson('Product Manifest', '.terrafusion/product-manifest.json'),
      this.requiredJson('Release Notes', '.terrafusion/release-notes-0.1.0.json'),
      this.optionalJson('Doctor Report', '.terrafusion/doctor-report.json', 'Doctor diagnostics are not required for release, but improve review context.'),
      this.optionalJson('Model Runtime Status', '.terrafusion/model-runtime-status.json', 'Model runtime diagnostics are optional release evidence.'),
    ];

    const criticalFailures = items.filter(item => !item.ok && item.severity === 'critical').length;
    const warnings = items.filter(item => !item.ok && item.severity === 'warning').length;
    const report: LocalAgentReleaseCheckReport = {
      createdAt: Math.floor(Date.now() / 1000),
      ok: criticalFailures === 0,
      releaseStatus: criticalFailures === 0 ? 'release-ready-mvp' : 'blocked',
      criticalFailures,
      warnings,
      items,
    };

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, 'release-check-report.json'), JSON.stringify(report, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'release-check-report.md'), renderLocalAgentReleaseCheck(report), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'release_check_completed', {
      ok: report.ok,
      releaseStatus: report.releaseStatus,
      criticalFailures: report.criticalFailures,
      warnings: report.warnings,
    });

    return report;
  }

  private requiredMarkdown(name: string, path: string): LocalAgentReleaseCheckItem {
    return existsSync(resolvePath(this.repoRoot, path))
      ? { name, ok: true, severity: 'info', message: 'Artifact exists.', path }
      : { name, ok: false, severity: 'critical', message: 'Required Markdown artifact is missing.', path };
  }

  private requiredJson(name: string, path: string): LocalAgentReleaseCheckItem {
    const payload = this.readJson(path);
    if (!payload) {
      return { name, ok: false, severity: 'critical', message: 'Required JSON artifact is missing or corrupted.', path };
    }

    return { name, ok: true, severity: 'info', message: 'Artifact JSON is readable.', path };
  }

  private optionalJson(name: string, path: string, missingMessage: string): LocalAgentReleaseCheckItem {
    const payload = this.readJson(path);
    if (!payload) {
      return { name, ok: false, severity: 'warning', message: missingMessage, path };
    }

    return { name, ok: true, severity: 'info', message: 'Optional JSON artifact is readable.', path };
  }

  private readJson(path: string): Record<string, unknown> | null {
    const fullPath = resolvePath(this.repoRoot, path);
    if (!existsSync(fullPath)) {
      return null;
    }

    try {
      const payload = JSON.parse(readFileSync(fullPath, 'utf8'));
      return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
}

export function renderLocalAgentReleaseCheck(report: LocalAgentReleaseCheckReport): string {
  return [
    '# TerraFusion Local Agent Release Check',
    '',
    `- Overall: ${report.ok ? 'PASS' : 'FAIL'}`,
    `- Release Status: ${report.releaseStatus}`,
    `- Critical Failures: ${report.criticalFailures}`,
    `- Warnings: ${report.warnings}`,
    '',
    '## Items',
    '',
    ...report.items.flatMap(item => [
      `### ${item.name}`,
      '',
      `- OK: ${item.ok}`,
      `- Severity: ${item.severity}`,
      `- Path: ${item.path}`,
      `- Message: ${item.message}`,
      '',
    ]),
    '## Authority Boundary',
    '',
    '- Release check validates artifacts only.',
    '- Release check does not approve, tag, or push anything.',
    '',
  ].join('\n');
}

function resolvePath(repoRoot: string, path: string): string {
  return path.startsWith('.terrafusion/') ? terrafusionPath(repoRoot, path.slice('.terrafusion/'.length)) : `${repoRoot}/${path}`;
}