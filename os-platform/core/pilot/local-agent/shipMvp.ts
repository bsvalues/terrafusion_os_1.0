import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { LocalAgentCommandRegistryBuilder } from './commandRegistry.js';
import { LocalAgentControlCenterStateBuilder } from './controlCenter.js';
import { LocalAgentDocsIndexBuilder } from './docsIndex.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import { LocalAgentProductManifestBuilder } from './productManifest.js';
import { LocalAgentReleaseCheckRunner } from './releaseCheck.js';
import { LocalAgentReleaseNotesBuilder } from './releaseNotes.js';

export interface LocalAgentShipStep {
  name: string;
  ok: boolean;
  message: string;
  artifacts: string[];
}

export interface LocalAgentShipMvpReport {
  createdAt: number;
  ok: boolean;
  outputDir: string;
  steps: LocalAgentShipStep[];
  includeReleaseNotes: boolean;
  includeDocsIndex: boolean;
  notes: string[];
}

export class LocalAgentShipMvpRunner {
  constructor(private readonly repoRoot: string) {}

  run(
    outputDir: string,
    overwrite = false,
    includeReleaseNotes = true,
    includeDocsIndex = true,
  ): LocalAgentShipMvpReport {
    const releaseDir = resolve(this.repoRoot, outputDir);
    if (existsSync(releaseDir) && overwrite) {
      rmSync(releaseDir, { recursive: true, force: true });
    }
    mkdirSync(releaseDir, { recursive: true });

    const steps: LocalAgentShipStep[] = [
      this.writeCommandRegistry(),
      this.writeControlCenterState(),
      this.writeProductManifest(),
    ];

    if (includeReleaseNotes) {
      steps.push(this.writeReleaseNotes());
    }
    steps.push(this.writeReleaseCheck());
    if (includeDocsIndex) {
      steps.push(this.writeDocsIndex());
    }
    steps.push(this.writeReleaseBundle(releaseDir));

    const report: LocalAgentShipMvpReport = {
      createdAt: Math.floor(Date.now() / 1000),
      ok: steps.every(step => step.ok),
      outputDir,
      steps,
      includeReleaseNotes,
      includeDocsIndex,
      notes: [
        'Ship MVP writes evidence only.',
        'Ship MVP does not approve, tag, or push releases.',
        'Humans remain release authority.',
      ],
    };

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, 'ship-report.json'), JSON.stringify(report, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'ship-report.md'), renderLocalAgentShipMvpReport(report), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'ship_mvp_completed', {
      ok: report.ok,
      outputDir: report.outputDir,
      stepCount: report.steps.length,
      includeReleaseNotes,
      includeDocsIndex,
    });

    return report;
  }

  private writeCommandRegistry(): LocalAgentShipStep {
    new LocalAgentCommandRegistryBuilder(this.repoRoot).build();
    return step('Command Registry', true, 'Command registry written.', ['.terrafusion/command-registry.json', '.terrafusion/command-registry.md']);
  }

  private writeControlCenterState(): LocalAgentShipStep {
    new LocalAgentControlCenterStateBuilder(this.repoRoot).build();
    return step('Control Center State', true, 'Control center state written.', ['.terrafusion/control-center-state.json', '.terrafusion/control-center-state.md']);
  }

  private writeProductManifest(): LocalAgentShipStep {
    const manifest = new LocalAgentProductManifestBuilder(this.repoRoot).build();
    return step('Product Manifest', true, `Product manifest written for ${manifest.version}.`, ['.terrafusion/product-manifest.json', '.terrafusion/product-manifest.md']);
  }

  private writeReleaseNotes(): LocalAgentShipStep {
    const notes = new LocalAgentReleaseNotesBuilder(this.repoRoot).build();
    return step('Release Notes', true, `Release notes written for version ${notes.version}.`, ['CHANGELOG.md', '.terrafusion/release-notes-0.1.0.json', '.terrafusion/release-notes-0.1.0.md']);
  }

  private writeDocsIndex(): LocalAgentShipStep {
    const index = new LocalAgentDocsIndexBuilder(this.repoRoot).build();
    return step('Docs Index', index.missingRequired.length === 0, index.missingRequired.length === 0 ? 'Docs index written.' : 'Docs index written with missing required artifacts.', ['.terrafusion/docs-index.json', '.terrafusion/docs-index.md']);
  }

  private writeReleaseCheck(): LocalAgentShipStep {
    const report = new LocalAgentReleaseCheckRunner(this.repoRoot).run();
    return step('Release Check', report.ok, report.ok ? 'Release check passed.' : 'Release check failed.', ['.terrafusion/release-check-report.json', '.terrafusion/release-check-report.md']);
  }

  private writeReleaseBundle(releaseDir: string): LocalAgentShipStep {
    const artifactPaths = [
      '.terrafusion/command-registry.json',
      '.terrafusion/command-registry.md',
      '.terrafusion/control-center-state.json',
      '.terrafusion/control-center-state.md',
      '.terrafusion/doctor-report.json',
      '.terrafusion/model-runtime-status.json',
      '.terrafusion/product-manifest.json',
      '.terrafusion/product-manifest.md',
      '.terrafusion/release-check-report.json',
      '.terrafusion/release-check-report.md',
      '.terrafusion/release-freeze-card.json',
      '.terrafusion/release-freeze-card.md',
      '.terrafusion/release-notes-0.1.0.json',
      '.terrafusion/release-notes-0.1.0.md',
      '.terrafusion/docs-index.json',
      '.terrafusion/docs-index.md',
      'CHANGELOG.md',
    ].filter(path => existsSync(resolvePath(this.repoRoot, path)));

    const manifest = {
      createdAt: Math.floor(Date.now() / 1000),
      artifacts: artifactPaths,
    };
    writeFileSync(resolve(releaseDir, 'release-manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

    const checksumLines = artifactPaths.map(path => `${sha256(readFileSync(resolvePath(this.repoRoot, path), 'utf8'))}  ${path}`);
    writeFileSync(resolve(releaseDir, 'checksums.sha256'), `${checksumLines.join('\n')}\n`, 'utf8');

    return step('Release Bundle', true, 'Release evidence bundle written.', ['release/release-manifest.json', 'release/checksums.sha256']);
  }
}

export function renderLocalAgentShipMvpReport(report: LocalAgentShipMvpReport): string {
  return [
    '# TerraFusion Local Agent Ship MVP Report',
    '',
    `- Overall: ${report.ok ? 'PASS' : 'FAIL'}`,
    `- Output Directory: ${report.outputDir}`,
    `- Include Release Notes: ${report.includeReleaseNotes}`,
    `- Include Docs Index: ${report.includeDocsIndex}`,
    '',
    '## Steps',
    '',
    ...report.steps.flatMap(item => [
      `### ${item.name}`,
      '',
      `- OK: ${item.ok}`,
      `- Message: ${item.message}`,
      `- Artifacts: ${item.artifacts.join(', ')}`,
      '',
    ]),
    '## Notes',
    '',
    bulletList(report.notes),
    '',
    '## Authority Boundary',
    '',
    '- Ship MVP runs the evidence spine only.',
    '- Ship MVP does not auto-approve, auto-tag, or auto-push.',
    '',
  ].join('\n');
}

function step(name: string, ok: boolean, message: string, artifacts: string[]): LocalAgentShipStep {
  return { name, ok, message, artifacts };
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}

function resolvePath(repoRoot: string, path: string): string {
  return path.startsWith('.terrafusion/') ? terrafusionPath(repoRoot, path.slice('.terrafusion/'.length)) : resolve(repoRoot, path);
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}