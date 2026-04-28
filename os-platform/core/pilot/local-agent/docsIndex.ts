import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';

export interface LocalAgentDocsEntry {
  id: string;
  title: string;
  path: string;
  category: string;
  audience: string[];
  required: boolean;
  summary: string;
  exists: boolean;
}

export interface LocalAgentDocsReadingPath {
  id: string;
  title: string;
  audience: string;
  entries: string[];
  nextCommand: string;
}

export interface LocalAgentDocsIndex {
  createdAt: number;
  version: string;
  entries: LocalAgentDocsEntry[];
  readingPaths: LocalAgentDocsReadingPath[];
  missingRequired: string[];
}

export class LocalAgentDocsIndexBuilder {
  constructor(private readonly repoRoot: string) {}

  build(): LocalAgentDocsIndex {
    const entries = this.entries();
    const readingPaths = this.readingPaths();
    const missingRequired = entries.filter(entry => entry.required && !entry.exists).map(entry => entry.path);

    const index: LocalAgentDocsIndex = {
      createdAt: Math.floor(Date.now() / 1000),
      version: '0.1.0',
      entries,
      readingPaths,
      missingRequired,
    };

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, 'docs-index.json'), JSON.stringify(index, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'docs-index.md'), renderLocalAgentDocsIndex(index), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'docs_index_written', {
      version: index.version,
      entryCount: index.entries.length,
      readingPathCount: index.readingPaths.length,
      missingRequired: index.missingRequired,
    });

    return index;
  }

  private entries(): LocalAgentDocsEntry[] {
    const definitions: Array<[string, string, string, string, string[], boolean, string]> = [
      ['command-registry', 'Command Registry', '.terrafusion/command-registry.md', 'Operations', ['founder', 'county-it'], true, 'Machine-readable command registry for future UI consumers.'],
      ['control-center-state', 'Control Center State', '.terrafusion/control-center-state.md', 'Operations', ['founder', 'county-it'], true, 'Read-only state contract for terminal and future desktop control centers.'],
      ['doctor-report', 'Doctor Report', '.terrafusion/doctor-report.json', 'Operations', ['founder', 'county-it'], false, 'Founder-safe runtime diagnostics summarizing local readiness, patch count, and evidence posture.'],
      ['model-runtime-status', 'Model Runtime Status', '.terrafusion/model-runtime-status.json', 'Operations', ['founder', 'county-it'], false, 'Loopback-only model gateway health and model inventory status for local operational review.'],
      ['product-manifest', 'Product Manifest', '.terrafusion/product-manifest.md', 'Release', ['founder', 'county-it'], true, 'Runtime shipping contract, county-safe posture, and Prometheus naming decision.'],
      ['release-check', 'Release Check Report', '.terrafusion/release-check-report.md', 'Release', ['founder'], true, 'Release evidence gate before ship and tag steps.'],
      ['release-notes', '0.1.0 Release Notes', '.terrafusion/release-notes-0.1.0.md', 'Release', ['founder', 'county-it'], true, 'Release notes documenting the Prometheus codename, capabilities, county-safe posture, known limitations, and manual tag posture.'],
      ['release-freeze', 'Release Freeze Card', '.terrafusion/release-freeze-card.md', 'Release', ['founder'], false, 'Founder launch freeze snapshot with guarded artifact fingerprints, canonical closeout, and rerun gates.'],
      ['tag-gate', 'Tag Gate Report', '.terrafusion/tag-gate-report.md', 'Release', ['founder'], false, 'Validates release-tag readiness without creating the git tag.'],
      ['release-approval', 'Release Approval', '.terrafusion/release-approval.md', 'Release', ['founder'], false, 'Records human release owner approval after Tag Gate passes.'],
      ['tag-command', 'Tag Command Report', '.terrafusion/tag-command-report.md', 'Release', ['founder'], false, 'Prints the final manual git tag command and verification commands without executing them.'],
      ['release-runbook', 'Final Release Runbook', '.terrafusion/release-runbook-0.1.0.md', 'Release', ['founder', 'county-it'], false, 'Human-readable final release runbook with manual tag, verification, and rollback instructions.'],
      ['ship-report', 'Ship Report', '.terrafusion/ship-report.md', 'Release', ['founder'], false, 'Release evidence bundle report without tag execution.'],
    ];

    return definitions.map(([id, title, path, category, audience, required, summary]) => ({
      id,
      title,
      path,
      category,
      audience,
      required,
      summary,
      exists: existsSync(resolvePath(this.repoRoot, path)),
    }));
  }

  private readingPaths(): LocalAgentDocsReadingPath[] {
    return [
      {
        id: 'release-review',
        title: 'MVP Release Review Path',
        audience: 'Founder / technical reviewer',
        entries: [
          'product-manifest',
          'command-registry',
          'control-center-state',
          'doctor-report',
          'model-runtime-status',
          'release-check',
          'release-notes',
          'release-freeze',
          'tag-gate',
          'release-approval',
          'tag-command',
          'release-runbook',
        ],
        nextCommand: 'pnpm run tf:local-agent -- release-freeze',
      },
    ];
  }
}

export function renderLocalAgentDocsIndex(index: LocalAgentDocsIndex): string {
  return [
    '# TerraFusion Local Agent Docs Index',
    '',
    `- Version: ${index.version}`,
    `- Entry Count: ${index.entries.length}`,
    '',
    '## Entries',
    '',
    ...index.entries.flatMap(entry => [
      `### ${entry.title}`,
      '',
      `- ID: ${entry.id}`,
      `- Path: ${entry.path}`,
      `- Category: ${entry.category}`,
      `- Audience: ${entry.audience.join(', ')}`,
      `- Required: ${entry.required}`,
      `- Exists: ${entry.exists}`,
      `- Summary: ${entry.summary}`,
      '',
    ]),
    '## Reading Paths',
    '',
    ...index.readingPaths.flatMap(path => [
      `### ${path.title}`,
      '',
      `- ID: ${path.id}`,
      `- Audience: ${path.audience}`,
      `- Entries: ${path.entries.join(', ')}`,
      `- Next Command: ${path.nextCommand}`,
      '',
    ]),
    '## Missing Required',
    '',
    bulletList(index.missingRequired),
    '',
    '## Authority Boundary',
    '',
    '- The docs index is a reading map only.',
    '- It does not approve, tag, or push releases.',
    '- Humans remain the final release authority.',
    '',
  ].join('\n');
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}

function resolvePath(repoRoot: string, path: string): string {
  return path.startsWith('.terrafusion/') ? terrafusionPath(repoRoot, path.slice('.terrafusion/'.length)) : `${repoRoot}/${path}`;
}