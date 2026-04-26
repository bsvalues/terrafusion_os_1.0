import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';

export class LocalAgentReleaseApprovalError extends Error {}

export interface LocalAgentReleaseApproval {
  approvedAt: number;
  version: string;
  productName: string;
  internalCodename: string;
  approverName: string;
  tagCommand: string;
  tagGateReport: string;
  notes: string[];
}

export class LocalAgentReleaseApprovalRunner {
  constructor(private readonly repoRoot: string) {}

  approve(version: string, approverName: string, notes: string[] = []): LocalAgentReleaseApproval {
    const cleanVersion = validateVersion(version);
    const cleanName = approverName.trim().replace(/\s+/g, ' ');
    if (!cleanName) {
      throw new LocalAgentReleaseApprovalError('Approver name is required.');
    }

    const tagGate = this.loadPassingTagGate(cleanVersion);
    const approval: LocalAgentReleaseApproval = {
      approvedAt: Math.floor(Date.now() / 1000),
      version: cleanVersion,
      productName: 'TerraFusion Local Agent Runtime',
      internalCodename: 'Prometheus',
      approverName: cleanName,
      tagCommand: typeof tagGate.tagCommand === 'string' ? tagGate.tagCommand : `git tag -a v${cleanVersion} -m "TerraFusion Local Agent Runtime v${cleanVersion}"`,
      tagGateReport: '.terrafusion/tag-gate-report.json',
      notes: notes.length > 0 ? notes : [
        'Release owner approval recorded locally.',
        'Public product name remains TerraFusion Local Agent Runtime while Prometheus stays internal.',
        'Git tag was not created automatically.',
        'Human review is still required before running the suggested tag command.',
      ],
    };

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, 'release-approval.json'), JSON.stringify(approval, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'release-approval.md'), renderLocalAgentReleaseApproval(approval), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'release_approval_recorded', {
      version: approval.version,
      approverName: approval.approverName,
      tagCommand: approval.tagCommand,
    });

    return approval;
  }

  private loadPassingTagGate(version: string): Record<string, unknown> {
    const path = terrafusionPath(this.repoRoot, 'tag-gate-report.json');
    if (!existsSync(path)) {
      throw new LocalAgentReleaseApprovalError(`Tag Gate report is required before release approval. Run: pnpm run tf:local-agent -- tag-gate ${version}`);
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
    } catch {
      throw new LocalAgentReleaseApprovalError('tag-gate-report.json is corrupted.');
    }

    if (!payload.ok) {
      throw new LocalAgentReleaseApprovalError('Tag Gate did not pass. Release approval blocked.');
    }

    const actualVersion = typeof payload.version === 'string' ? payload.version.replace(/^v/, '') : '';
    if (actualVersion !== version) {
      throw new LocalAgentReleaseApprovalError(`Tag Gate version mismatch. Expected ${version}, found ${actualVersion || 'unknown'}.`);
    }

    return payload;
  }
}

export function renderLocalAgentReleaseApproval(approval: LocalAgentReleaseApproval): string {
  return [
    '# TerraFusion Local Agent Release Approval',
    '',
    `- Version: ${approval.version}`,
    `- Product Name: ${approval.productName}`,
    `- Internal Codename: ${approval.internalCodename}`,
    `- Approver: ${approval.approverName}`,
    `- Tag Gate Report: ${approval.tagGateReport}`,
    '',
    '## Suggested Tag Command',
    '',
    '```bash',
    approval.tagCommand,
    '```',
    '',
    '## Notes',
    '',
    bulletList(approval.notes),
    '',
    '## Authority Boundary',
    '',
    '- Release approval records human approval only.',
    '- Release approval does not create git tags.',
    '- Release approval does not push tags.',
    '- Human must run the tag command explicitly after review.',
    '',
  ].join('\n');
}

function validateVersion(version: string): string {
  const clean = version.trim().replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+$/.test(clean)) {
    throw new LocalAgentReleaseApprovalError('Version must use semver format like 0.1.0 or v0.1.0.');
  }
  return clean;
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}