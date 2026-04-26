import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';

export class LocalAgentReleaseRunbookError extends Error {}

export interface LocalAgentRunbookArtifact {
  name: string;
  path: string;
  required: boolean;
  exists: boolean;
  ok: boolean;
  summary: string;
}

export interface LocalAgentReleaseRunbook {
  createdAt: number;
  version: string;
  productName: string;
  internalCodename: string;
  releaseStatus: string;
  tagCommand: string;
  verificationCommands: string[];
  rollbackCommands: string[];
  artifacts: LocalAgentRunbookArtifact[];
  finalManualSteps: string[];
  notes: string[];
}

export class LocalAgentReleaseRunbookBuilder {
  constructor(private readonly repoRoot: string) {}

  build(version: string): LocalAgentReleaseRunbook {
    const cleanVersion = validateVersion(version);
    const artifacts = this.artifacts(cleanVersion);
    const failed = artifacts.filter(artifact => artifact.required && !artifact.ok);
    if (failed.length > 0) {
      throw new LocalAgentReleaseRunbookError(`Required release artifacts are missing or invalid: ${failed.map(artifact => artifact.name).join(', ')}`);
    }

    const tagCommandPayload = readJson(terrafusionPath(this.repoRoot, 'tag-command-report.json'));
    const tagCommand = typeof tagCommandPayload?.tagCommand === 'string'
      ? tagCommandPayload.tagCommand
      : `git tag -a v${cleanVersion} -m "TerraFusion Local Agent Runtime v${cleanVersion}"`;
    const verificationCommands = Array.isArray(tagCommandPayload?.verificationCommands) && tagCommandPayload.verificationCommands.length > 0
      ? tagCommandPayload.verificationCommands.map((command: unknown) => String(command))
      : [`git tag --list v${cleanVersion}`, `git show --stat v${cleanVersion}`, 'git status --short'];

    const runbook: LocalAgentReleaseRunbook = {
      createdAt: Math.floor(Date.now() / 1000),
      version: cleanVersion,
      productName: 'TerraFusion Local Agent Runtime',
      internalCodename: 'Prometheus',
      releaseStatus: 'ready-for-human-tag',
      tagCommand,
      verificationCommands,
      rollbackCommands: [`git tag -d v${cleanVersion}`, `git push --delete origin v${cleanVersion}`, `pnpm run tf:local-agent -- tag-gate ${cleanVersion}`, 'pnpm run tf:local-agent -- release-check'],
      artifacts,
      finalManualSteps: [
        'Review CHANGELOG.md.',
        'Review .terrafusion/release-notes-0.1.0.md.',
        'Review .terrafusion/release-freeze-card.md if a founder launch freeze was captured.',
        'Review .terrafusion/tag-gate-report.md.',
        'Review .terrafusion/release-approval.md.',
        'Review .terrafusion/tag-command-report.md.',
        'Run the final manual tag command only after release owner approval.',
        'Run the verification commands.',
        'Push the tag only after verification passes.',
      ],
      notes: [
        'Runbook generated locally.',
        'Public product name remains TerraFusion Local Agent Runtime while Prometheus stays internal.',
        'No git tag was created by this command.',
        'No git push was executed by this command.',
        'Release owner remains the final authority.',
      ],
    };

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, `release-runbook-${cleanVersion}.json`), JSON.stringify(runbook, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, `release-runbook-${cleanVersion}.md`), renderLocalAgentReleaseRunbook(runbook), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'release_runbook_written', {
      version: runbook.version,
      releaseStatus: runbook.releaseStatus,
      tagCommand: runbook.tagCommand,
      artifactCount: runbook.artifacts.length,
    });

    return runbook;
  }

  private artifacts(version: string): LocalAgentRunbookArtifact[] {
    const definitions: Array<[string, string, boolean]> = [
      ['Changelog', 'CHANGELOG.md', true],
      ['Release Notes Markdown', `.terrafusion/release-notes-${version}.md`, true],
      ['Release Notes JSON', `.terrafusion/release-notes-${version}.json`, true],
      ['Tag Gate Report', '.terrafusion/tag-gate-report.json', true],
      ['Release Approval', '.terrafusion/release-approval.json', true],
      ['Tag Command Report', '.terrafusion/tag-command-report.json', true],
      ['Product Manifest', '.terrafusion/product-manifest.json', true],
      ['Release Check Report', '.terrafusion/release-check-report.json', true],
      ['Release Freeze Card', '.terrafusion/release-freeze-card.json', false],
      ['Ship Report', '.terrafusion/ship-report.json', true],
      ['Docs Index', '.terrafusion/docs-index.json', true],
      ['Doctor Report', '.terrafusion/doctor-report.json', false],
      ['Model Runtime Status', '.terrafusion/model-runtime-status.json', false],
      ['Release Bundle Manifest', 'release/release-manifest.json', false],
      ['Release Bundle Checksums', 'release/checksums.sha256', false],
    ];

    return definitions.map(([name, path, required]) => this.artifact(name, path, required, version));
  }

  private artifact(name: string, path: string, required: boolean, version: string): LocalAgentRunbookArtifact {
    const fullPath = resolvePath(this.repoRoot, path);
    const exists = existsSync(fullPath);
    if (!exists) {
      return { name, path, required, exists: false, ok: false, summary: 'Artifact missing.' };
    }
    if (!path.endsWith('.json')) {
      return { name, path, required, exists: true, ok: true, summary: 'Artifact exists.' };
    }
    const payload = readJson(fullPath);
    if (!payload) {
      return { name, path, required, exists: true, ok: false, summary: 'Artifact JSON is corrupted.' };
    }
    if (name === 'Tag Gate Report') {
      const ok = payload.ok === true && payload.version === version;
      return { name, path, required, exists: true, ok, summary: ok ? 'Tag gate passed.' : 'Tag gate did not pass or version mismatched.' };
    }
    if (name === 'Release Approval') {
      const ok = payload.version === version && Boolean(payload.approverName);
      return { name, path, required, exists: true, ok, summary: ok ? 'Release approval matches version.' : 'Approval missing or version mismatched.' };
    }
    if (name === 'Tag Command Report') {
      const ok = payload.version === version && Boolean(payload.tagCommand);
      return { name, path, required, exists: true, ok, summary: ok ? 'Tag command report matches version.' : 'Tag command report missing command or version mismatched.' };
    }
    if (name === 'Release Notes JSON') {
      const ok = payload.version === version;
      return { name, path, required, exists: true, ok, summary: ok ? 'Release notes version matches.' : 'Release notes version mismatched.' };
    }
    if (name === 'Docs Index') {
      const ok = Array.isArray(payload.missingRequired) ? payload.missingRequired.length === 0 : true;
      return { name, path, required, exists: true, ok, summary: ok ? 'Docs index has no missing required artifacts.' : 'Docs index reports missing required artifacts.' };
    }
    return { name, path, required, exists: true, ok: true, summary: 'JSON artifact is readable.' };
  }
}

export function renderLocalAgentReleaseRunbook(runbook: LocalAgentReleaseRunbook): string {
  return [
    '# TerraFusion Local Agent Final Release Runbook',
    '',
    `- Version: ${runbook.version}`,
    `- Product Name: ${runbook.productName}`,
    `- Internal Codename: ${runbook.internalCodename}`,
    `- Release Status: ${runbook.releaseStatus}`,
    '',
    '## Final Manual Tag Command',
    '',
    '```bash',
    runbook.tagCommand,
    '```',
    '',
    '## Verification Commands',
    '',
    ...runbook.verificationCommands.flatMap(command => ['```bash', command, '```', '']),
    '## Rollback / Recovery Commands',
    '',
    ...runbook.rollbackCommands.flatMap(command => ['```bash', command, '```', '']),
    '## Required Artifacts',
    '',
    ...runbook.artifacts.flatMap(artifact => [
      `### ${artifact.ok ? 'PASS' : 'FAIL'} ${artifact.name}`,
      '',
      `- Path: ${artifact.path}`,
      `- Required: ${artifact.required}`,
      `- Exists: ${artifact.exists}`,
      `- OK: ${artifact.ok}`,
      `- Summary: ${artifact.summary}`,
      '',
    ]),
    '## Final Manual Steps',
    '',
    bulletList(runbook.finalManualSteps),
    '',
    '## Notes',
    '',
    bulletList(runbook.notes),
    '',
    '## Authority Boundary',
    '',
    '- Runbook is instructional only.',
    '- Runbook does not create git tags.',
    '- Runbook does not push tags.',
    '- Human release owner must execute final tag and push commands manually.',
    '',
  ].join('\n');
}

function validateVersion(version: string): string {
  const clean = version.trim().replace(/^v/, '');
  if (!/^\d+\.\d+\.\d+$/.test(clean)) {
    throw new LocalAgentReleaseRunbookError('Version must use semver format like 0.1.0 or v0.1.0.');
  }
  return clean;
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}

function resolvePath(repoRoot: string, path: string): string {
  return path.startsWith('.terrafusion/') ? terrafusionPath(repoRoot, path.slice('.terrafusion/'.length)) : `${repoRoot}/${path}`;
}

function readJson(path: string): Record<string, any> | null {
  try {
    const payload = JSON.parse(readFileSync(path, 'utf8'));
    return payload && typeof payload === 'object' ? payload : null;
  } catch {
    return null;
  }
}