import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';

export class LocalAgentTagCommandError extends Error {}

export interface LocalAgentTagCommandReport {
  createdAt: number;
  version: string;
  productName: string;
  internalCodename: string;
  approverName: string;
  tagCommand: string;
  verificationCommands: string[];
  releaseApprovalPath: string;
  currentBranch: string;
  currentHead: string;
  notes: string[];
}

export class LocalAgentTagCommandRunner {
  constructor(private readonly repoRoot: string) {}

  build(version: string): LocalAgentTagCommandReport {
    const cleanVersion = validateVersion(version);
    const approval = this.loadReleaseApproval(cleanVersion);
    const report: LocalAgentTagCommandReport = {
      createdAt: Math.floor(Date.now() / 1000),
      version: cleanVersion,
      productName: 'TerraFusion Local Agent Runtime',
      internalCodename: 'Prometheus',
      approverName: String(approval.approverName),
      tagCommand: typeof approval.tagCommand === 'string' ? approval.tagCommand : `git tag -a v${cleanVersion} -m "TerraFusion Local Agent Runtime v${cleanVersion}"`,
      verificationCommands: [
        `git tag --list v${cleanVersion}`,
        `git show --stat v${cleanVersion}`,
        'git status --short',
        `pnpm run tf:local-agent -- tag-gate ${cleanVersion}`,
        'pnpm run tf:local-agent -- release-check',
        'pnpm run tf:local-agent -- product-manifest',
      ],
      releaseApprovalPath: '.terrafusion/release-approval.json',
      currentBranch: git(this.repoRoot, ['rev-parse', '--abbrev-ref', 'HEAD']) || 'unknown',
      currentHead: git(this.repoRoot, ['rev-parse', 'HEAD']) || 'unknown',
      notes: [
        'Release approval was present and matched the requested version.',
        'Public product name remains TerraFusion Local Agent Runtime while Prometheus stays internal.',
        'Git tag command was not executed.',
        'Git push command was not generated or executed.',
        'Run verification commands after manually creating the tag.',
      ],
    };

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, 'tag-command-report.json'), JSON.stringify(report, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'tag-command-report.md'), renderLocalAgentTagCommand(report), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'tag_command_report_written', {
      version: report.version,
      approverName: report.approverName,
      tagCommand: report.tagCommand,
      currentBranch: report.currentBranch,
      currentHead: report.currentHead,
    });

    return report;
  }

  private loadReleaseApproval(version: string): Record<string, unknown> {
    const path = terrafusionPath(this.repoRoot, 'release-approval.json');
    if (!existsSync(path)) {
      throw new LocalAgentTagCommandError(`Release approval is required. Run: pnpm run tf:local-agent -- release-approve ${version} --name "Founder"`);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    } catch {
      throw new LocalAgentTagCommandError('release-approval.json is corrupted.');
    }

    const actualVersion = typeof payload.version === 'string' ? payload.version.replace(/^v/, '') : '';
    if (actualVersion !== version) {
      throw new LocalAgentTagCommandError(`Release approval version mismatch. Expected ${version}, found ${actualVersion || 'unknown'}.`);
    }
    if (typeof payload.approverName !== 'string' || !payload.approverName.trim()) {
      throw new LocalAgentTagCommandError('release-approval.json is missing approverName.');
    }

    return payload;
  }
}

export function renderLocalAgentTagCommand(report: LocalAgentTagCommandReport): string {
  return [
    '# TerraFusion Local Agent Tag Command Report',
    '',
    `- Version: ${report.version}`,
    `- Product Name: ${report.productName}`,
    `- Internal Codename: ${report.internalCodename}`,
    `- Approver: ${report.approverName}`,
    `- Release Approval: ${report.releaseApprovalPath}`,
    `- Current Branch: ${report.currentBranch}`,
    `- Current HEAD: ${report.currentHead}`,
    '',
    '## Manual Tag Command',
    '',
    '```bash',
    report.tagCommand,
    '```',
    '',
    '## Verification Commands',
    '',
    ...report.verificationCommands.flatMap(command => ['```bash', command, '```', '']),
    '## Notes',
    '',
    bulletList(report.notes),
    '',
    '## Authority Boundary',
    '',
    '- Tag Command prints release commands only.',
    '- Tag Command does not create git tags.',
    '- Tag Command does not push tags.',
    '- Human approval and manual execution remain required.',
    '',
  ].join('\n');
}

function validateVersion(version: string): string {
  const clean = version.trim().replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+$/.test(clean)) {
    throw new LocalAgentTagCommandError('Version must use semver format like 0.1.0 or v0.1.0.');
  }
  return clean;
}

function git(repoRoot: string, args: string[]): string {
  const result = spawnSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 5000,
    windowsHide: true,
  });
  return result.status === 0 ? result.stdout.trim() : '';
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}