import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';

export class LocalAgentReleaseFreezeError extends Error {}

export interface LocalAgentReleaseFreezeArtifact {
  name: string;
  path: string;
  required: boolean;
  exists: boolean;
  ok: boolean;
  sha256: string | null;
  summary: string;
}

export interface LocalAgentReleaseFreezeGate {
  command: string;
  purpose: string;
}

export interface LocalAgentReleaseFreezeCard {
  createdAt: number;
  version: string;
  productName: string;
  internalCodename: string;
  freezeStatus: string;
  releaseStatus: string;
  launchVerdict: string;
  canonicalCloseout: string;
  guardedArtifacts: LocalAgentReleaseFreezeArtifact[];
  proofGates: LocalAgentReleaseFreezeGate[];
  disclosures: string[];
  notes: string[];
}

export class LocalAgentReleaseFreezeBuilder {
  constructor(private readonly repoRoot: string) {}

  build(): LocalAgentReleaseFreezeCard {
    const guardedArtifacts = this.guardedArtifacts();
    const missing = guardedArtifacts.filter(artifact => artifact.required && !artifact.ok);
    if (missing.length > 0) {
      throw new LocalAgentReleaseFreezeError(
        `Release freeze requires passing release evidence first: ${missing.map(artifact => artifact.name).join(', ')}`,
      );
    }

    const releaseCheck = readJson(resolvePath(this.repoRoot, '.terrafusion/release-check-report.json'));
    const releaseStatus = typeof releaseCheck?.releaseStatus === 'string' ? releaseCheck.releaseStatus : 'unknown';

    const card: LocalAgentReleaseFreezeCard = {
      createdAt: Math.floor(Date.now() / 1000),
      version: '0.1.0',
      productName: 'TerraFusion Local Agent Runtime',
      internalCodename: 'Prometheus',
      freezeStatus: 'launch-ready-root-dependency-remediation-pending',
      releaseStatus,
      launchVerdict: 'launch-ready',
      canonicalCloseout: 'Local Agent: release-truth complete, source-code security clean, root dependency remediation pending.',
      guardedArtifacts,
      proofGates: [
        gate('node --test os-platform/core/tests/local-agent-launch-smoke.test.mjs', 'Re-run founder launch and runtime smoke before changing the frozen slice.'),
        gate('pnpm run test:local-agent', 'Re-run the local-agent proof wall after any local-agent source change.'),
        gate('pnpm run check:generated', 'Verify generated JS companions still match their TypeScript sources.'),
        gate('node --test os-platform/core/tests/phase83-tools.test.mjs', 'Keep the core pilot tooling contract intact.'),
        gate('pnpm run type-check', 'Re-check the governed TypeScript boundary before unfreezing.'),
      ],
      disclosures: [
        'Founder launch readiness was proven separately by launch smoke and the local-agent proof wall; this card snapshots the release evidence bundle and rerun gates.',
        'Local-agent source-code security is recorded as clean for this slice; root dependency remediation remains pending outside the local-agent source path.',
        'The freeze card is evidence only. It does not approve, tag, or push a release.',
      ],
      notes: [
        'Freeze capture is release-memory, not release authority.',
        'Prometheus remains the internal codename; TerraFusion Local Agent Runtime remains the public product name.',
        'Any future change to the guarded artifacts should trigger the listed proof gates before another freeze capture.',
      ],
    };

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, 'release-freeze-card.json'), JSON.stringify(card, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'release-freeze-card.md'), renderLocalAgentReleaseFreezeCard(card), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'release_freeze_written', {
      version: card.version,
      freezeStatus: card.freezeStatus,
      releaseStatus: card.releaseStatus,
      guardedArtifactCount: card.guardedArtifacts.length,
    });

    return card;
  }

  private guardedArtifacts(): LocalAgentReleaseFreezeArtifact[] {
    const definitions: Array<[string, string, boolean]> = [
      ['Command Registry', '.terrafusion/command-registry.json', true],
      ['Control Center State', '.terrafusion/control-center-state.json', true],
      ['Release Notes', '.terrafusion/release-notes-0.1.0.json', true],
      ['Docs Index', '.terrafusion/docs-index.json', true],
      ['Product Manifest', '.terrafusion/product-manifest.json', true],
      ['Release Check Report', '.terrafusion/release-check-report.json', true],
      ['Doctor Report', '.terrafusion/doctor-report.json', false],
      ['Model Runtime Status', '.terrafusion/model-runtime-status.json', false],
    ];

    return definitions.map(([name, path, required]) => this.artifact(name, path, required));
  }

  private artifact(name: string, path: string, required: boolean): LocalAgentReleaseFreezeArtifact {
    const fullPath = resolvePath(this.repoRoot, path);
    if (!existsSync(fullPath)) {
      return {
        name,
        path,
        required,
        exists: false,
        ok: false,
        sha256: null,
        summary: 'Artifact missing.',
      };
    }

    const raw = readFileSync(fullPath, 'utf8');
    const payload = readJson(fullPath);
    if (!payload) {
      return {
        name,
        path,
        required,
        exists: true,
        ok: false,
        sha256: sha256(raw),
        summary: 'Artifact JSON is corrupted.',
      };
    }

    if (name === 'Release Check Report') {
      const ok = payload.ok === true;
      return {
        name,
        path,
        required,
        exists: true,
        ok,
        sha256: sha256(raw),
        summary: ok ? 'Release check passed and was fingerprinted.' : 'Release check is present but not passing.',
      };
    }

    if (name === 'Docs Index') {
      const ok = Array.isArray(payload.missingRequired) ? payload.missingRequired.length === 0 : false;
      return {
        name,
        path,
        required,
        exists: true,
        ok,
        sha256: sha256(raw),
        summary: ok ? 'Docs index has no missing required artifacts.' : 'Docs index still reports missing required artifacts.',
      };
    }

    return {
      name,
      path,
      required,
      exists: true,
      ok: true,
      sha256: sha256(raw),
      summary: 'Artifact is readable and fingerprinted.',
    };
  }
}

export function renderLocalAgentReleaseFreezeCard(card: LocalAgentReleaseFreezeCard): string {
  return [
    '# TerraFusion Local Agent Release Freeze Card',
    '',
    `- Version: ${card.version}`,
    `- Product Name: ${card.productName}`,
    `- Internal Codename: ${card.internalCodename}`,
    `- Freeze Status: ${card.freezeStatus}`,
    `- Release Status: ${card.releaseStatus}`,
    `- Launch Verdict: ${card.launchVerdict}`,
    '',
    '## Canonical Closeout',
    '',
    card.canonicalCloseout,
    '',
    '## Guarded Artifacts',
    '',
    ...card.guardedArtifacts.flatMap(artifact => [
      `### ${artifact.name}`,
      '',
      `- Path: ${artifact.path}`,
      `- Required: ${artifact.required}`,
      `- Exists: ${artifact.exists}`,
      `- OK: ${artifact.ok}`,
      `- SHA256: ${artifact.sha256 ?? 'n/a'}`,
      `- Summary: ${artifact.summary}`,
      '',
    ]),
    '## Proof Gates To Re-Run Before Unfreezing',
    '',
    ...card.proofGates.flatMap(item => [
      '```bash',
      item.command,
      '```',
      item.purpose,
      '',
    ]),
    '## Disclosures',
    '',
    bulletList(card.disclosures),
    '',
    '## Notes',
    '',
    bulletList(card.notes),
    '',
    '## Authority Boundary',
    '',
    '- Freeze capture is evidence only.',
    '- Freeze capture does not approve, tag, or push releases.',
    '- Humans remain the release authority.',
    '',
  ].join('\n');
}

function gate(command: string, purpose: string): LocalAgentReleaseFreezeGate {
  return { command, purpose };
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

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}