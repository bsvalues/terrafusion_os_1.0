import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';

export interface LocalAgentReleaseCommand {
  title: string;
  command: string;
  purpose: string;
}

export interface LocalAgentReleaseArtifact {
  title: string;
  path: string;
  required: boolean;
  exists: boolean;
  purpose: string;
}

export interface LocalAgentReleaseNotes {
  createdAt: number;
  version: string;
  productName: string;
  internalCodename: string;
  productSentence: string;
  status: string;
  operatingFaces: string[];
  highlights: string[];
  capabilities: string[];
  countySafePosture: string[];
  installCommands: LocalAgentReleaseCommand[];
  dailyCommands: LocalAgentReleaseCommand[];
  releaseArtifacts: LocalAgentReleaseArtifact[];
  knownLimitations: string[];
  shimDeprecationPolicy: string[];
  upgradeNotes: string[];
  architectureSummary: string[];
}

export class LocalAgentReleaseNotesBuilder {
  constructor(private readonly repoRoot: string) {}

  build(): LocalAgentReleaseNotes {
    const notes: LocalAgentReleaseNotes = {
      createdAt: Math.floor(Date.now() / 1000),
      version: '0.1.0',
      productName: 'TerraFusion Local Agent Runtime',
      internalCodename: 'Prometheus',
      productSentence:
        'Prometheus is the county-safe local agent runtime that gives TerraFusion a Claude Code / Codex-class engineering and operations copilot without requiring external AI access.',
      status: 'Governed local-agent release candidate for founder-safe and county-safe runtime flows.',
      operatingFaces: [
        'Founder Builder: helps build TerraFusion from minute one.',
        'County Operations Assistant: helps county IT diagnose, report, install, verify, and operate locally.',
        'TerraPilot Dev Mode: future OS-native surface inside TerraFusion.',
      ],
      highlights: [
        'Defines Prometheus as the internal codename while keeping TerraFusion Local Agent Runtime as the public product name.',
        'Adds founder-safe doctor, model gateway diagnostics, and read-only explain/review reporting to the governed runtime surface.',
        'Adds release governance flow: tag gate, release owner approval, tag command report, and final release runbook.',
        'Adds a release-freeze card that fingerprints the founder launch evidence bundle and names the rerun gates before unfreezing.',
        'Preserves local-first execution with no automatic cloud fallback.',
        'Keeps command registry, control-center state, and terminal preview as read-only evidence surfaces.',
        'Makes release readiness auditable through JSON, Markdown, and event artifacts.',
      ],
      capabilities: [
        'Prometheus is the local-first harness, policy layer, evidence system, and runtime contract for the TerraFusion Local Agent Runtime.',
        'Locked work cards, patch preview, proof gates, save state, and finalize stay as the governed delivery spine.',
        'Doctor writes local runtime and model status artifacts for future UI and county-safe operational review.',
        'Model Health, List Models, and Model Chat keep local model access loopback-only and advisory-only.',
        'Explain and Review provide read-only reporting over locked cards, proof state, pending patches, and finalize blockers.',
        'Command registry and control-center state remain machine-readable UI contracts.',
        'Tag Gate validates release readiness without creating a Git tag.',
        'Release Approval records human owner approval after Tag Gate passes.',
        'Tag Command prints exact manual tag and verification commands without executing Git.',
        'Release Runbook generates final human release instructions, rollback notes, and evidence links.',
        'Release Freeze records the canonical closeout, guarded artifact hashes, and the proof wall that must rerun before another freeze.',
      ],
      countySafePosture: [
        'This runtime is OS/platform infrastructure, not a Forge, Atlas, Dais, or Dossier write lane.',
        'All authority stays inside the governed harness.',
        'Model participation remains advisory-only and is not required for release evidence.',
        'Prometheus is model-agnostic; OpenMythos is only one optional local model backend.',
        'Release evidence is local, auditable, and does not touch county production data.',
        'Git tags are suggested, never created automatically by the runtime.',
        'Git pushes are never executed by the runtime.',
      ],
      installCommands: [
        command('Build generated JS', 'pnpm run build:core-js', 'Refresh generated JS companions for local-agent TS modules.'),
        command('Focused local-agent tests', 'pnpm run test:local-agent', 'Run the local-agent proof wall.'),
        command('Governance spine check', 'node --test os-platform/core/tests/phase83-tools.test.mjs', 'Verify core pilot tooling contracts remain intact.'),
      ],
      dailyCommands: [
        command('Write release notes', 'pnpm run tf:local-agent -- release-notes', 'Write CHANGELOG.md and release note artifacts.'),
        command('Write docs index', 'pnpm run tf:local-agent -- docs-index', 'Write the release reading path and required artifact index.'),
        command('Write product manifest', 'pnpm run tf:local-agent -- product-manifest', 'Write the runtime shipping contract and release governance posture.'),
        command('Run release check', 'pnpm run tf:local-agent -- release-check', 'Validate release evidence artifacts before shipping.'),
        command('Write release freeze card', 'pnpm run tf:local-agent -- release-freeze', 'Fingerprint the founder launch evidence bundle and record rerun gates before unfreezing.'),
        command('Ship MVP bundle', 'pnpm run tf:local-agent -- ship-mvp release --overwrite', 'Write the release evidence bundle without approving, tagging, or pushing.'),
        command('Tag gate', 'pnpm run tf:local-agent -- tag-gate 0.1.0', 'Validate release-tag readiness without creating a tag.'),
        command('Release approval', 'pnpm run tf:local-agent -- release-approve 0.1.0 --name "Founder"', 'Record human release owner approval.'),
        command('Tag command report', 'pnpm run tf:local-agent -- tag-command 0.1.0', 'Print final manual tag and verification commands.'),
        command('Final release runbook', 'pnpm run tf:local-agent -- release-runbook 0.1.0', 'Write the final human release runbook.'),
      ],
      releaseArtifacts: this.releaseArtifacts(),
      knownLimitations: [
        'The runtime intentionally does not create or push Git tags; humans execute release Git commands manually.',
        'There is no graphical release dashboard in 0.1.0; release surfaces are JSON, Markdown, and terminal outputs.',
        'Prometheus is not yet a TerraPilot Dev Mode GUI; the codename currently maps to the CLI and evidence runtime.',
        'Release evidence covers local-agent runtime infrastructure only, not broader product suites.',
        'The runtime does not weaken policy for county contexts during release operations.',
      ],
      shimDeprecationPolicy: [
        'The local-agent CLI contract is stable through the 0.1.x line.',
        'New release commands extend the contract without replacing existing planning, patch, proof, or finalize commands.',
        'Future compatibility work must preserve the governed harness boundary.',
      ],
      upgradeNotes: [
        'Use TerraFusion Local Agent Runtime as the public product name and Prometheus as the internal codename.',
        'Run release evidence commands locally and review their Markdown outputs before any human tagging step.',
        'Capture the release freeze card after release-check if you need to preserve a known-good founder launch state.',
        'Use the release-review docs path to audit evidence in order.',
        'Do not treat release artifacts as authority; human approval remains the release gate.',
      ],
      architectureSummary: [
        'Layer 1: CLI + future Control Center - help-me, next, start, control-center-state, control-center-preview.',
        'Layer 2: Governance Harness - active policy, permission engine, locked work cards, audit log, proof gates.',
        'Layer 3: Agent Workflow - plan, preview-patch, apply-patch, proof, explain, review, save-state, finalize.',
        'Layer 4: Local Diagnostics - doctor, model-health, list-models, model-chat.',
        'Layer 5: Release Evidence - product-manifest, release-check, release-freeze, docs-index, ship-mvp, release-notes, tag-gate, release-approve, tag-command, release-runbook.',
        'Layer 6: Model Backend - local/private model endpoints such as OpenMythos, Qwen Coder, DeepSeek Coder, Llama, LM Studio, Ollama, vLLM, or other county-approved local models.',
      ],
    };

    this.write(notes);
    appendLocalAgentEvent(this.repoRoot, 'release_notes_written', {
      version: notes.version,
      artifactCount: notes.releaseArtifacts.length,
      capabilityCount: notes.capabilities.length,
    });

    return notes;
  }

  private releaseArtifacts(): LocalAgentReleaseArtifact[] {
    const definitions: Array<[string, string, boolean, string]> = [
      ['Command Registry', '.terrafusion/command-registry.md', true, 'Machine-readable command map for release review.'],
      ['Control Center State', '.terrafusion/control-center-state.md', true, 'Read-only UI state contract for release review.'],
      ['Doctor Report', '.terrafusion/doctor-report.json', false, 'Founder-safe runtime diagnostics and local evidence posture.'],
      ['Model Runtime Status', '.terrafusion/model-runtime-status.json', false, 'Loopback-only model gateway status for local operational review.'],
      ['Product Manifest', '.terrafusion/product-manifest.md', true, 'Runtime shipping contract and county-safe posture.'],
      ['Release Check', '.terrafusion/release-check-report.md', true, 'Release evidence validation report.'],
      ['Docs Index', '.terrafusion/docs-index.md', true, 'Human reading path for release artifacts.'],
      ['Release Freeze Card', '.terrafusion/release-freeze-card.md', false, 'Founder launch freeze snapshot and rerun gate list.'],
      ['Ship Report', '.terrafusion/ship-report.md', false, 'MVP ship evidence report.'],
      ['Tag Gate', '.terrafusion/tag-gate-report.md', false, 'Release-tag readiness report.'],
      ['Release Approval', '.terrafusion/release-approval.md', false, 'Human release approval record.'],
      ['Tag Command', '.terrafusion/tag-command-report.md', false, 'Final manual tag instruction report.'],
      ['Release Runbook', '.terrafusion/release-runbook-0.1.0.md', false, 'Final human release checklist.'],
    ];

    return definitions.map(([title, path, required, purpose]) => ({
      title,
      path,
      required,
      exists: existsSync(resolvePath(this.repoRoot, path)),
      purpose,
    }));
  }

  private write(notes: LocalAgentReleaseNotes): void {
    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });

    const jsonPayload = {
      createdAt: notes.createdAt,
      version: notes.version,
      productName: notes.productName,
      internalCodename: notes.internalCodename,
      productSentence: notes.productSentence,
      status: notes.status,
      operatingFaces: notes.operatingFaces,
      highlights: notes.highlights,
      capabilities: notes.capabilities,
      countySafePosture: notes.countySafePosture,
      installCommands: notes.installCommands,
      dailyCommands: notes.dailyCommands,
      releaseArtifacts: notes.releaseArtifacts,
      knownLimitations: notes.knownLimitations,
      shimDeprecationPolicy: notes.shimDeprecationPolicy,
      upgradeNotes: notes.upgradeNotes,
      architectureSummary: notes.architectureSummary,
    };

    writeFileSync(terrafusionPath(this.repoRoot, 'release-notes-0.1.0.json'), JSON.stringify(jsonPayload, null, 2), 'utf8');
    const markdown = renderLocalAgentReleaseNotes(notes);
    writeFileSync(terrafusionPath(this.repoRoot, 'release-notes-0.1.0.md'), markdown, 'utf8');
    writeFileSync(resolvePath(this.repoRoot, 'CHANGELOG.md'), ['# Changelog', '', '## 0.1.0 - TerraFusion Local Agent Runtime MVP', '', markdown, ''].join('\n'), 'utf8');
  }
}

export function renderLocalAgentReleaseNotes(notes: LocalAgentReleaseNotes): string {
  return [
    `# ${notes.productName} ${notes.version} Release Notes`,
    '',
    '## Status',
    '',
    notes.status,
    '',
    '## Naming Decision',
    '',
    `- Public Name: ${notes.productName}`,
    `- Internal Codename: ${notes.internalCodename}`,
    `- Product Sentence: ${notes.productSentence}`,
    '- Prometheus is not a model.',
    '- Prometheus is not OpenMythos.',
    '- Prometheus is not a GUI.',
    '- Prometheus is the local-first harness, policy layer, evidence system, and runtime contract that allows TerraFusion to run coding and operations agents inside county trust boundaries.',
    '',
    '## Operating Faces',
    '',
    bulletList(notes.operatingFaces),
    '',
    '## Highlights',
    '',
    bulletList(notes.highlights),
    '',
    '## Capabilities',
    '',
    bulletList(notes.capabilities),
    '',
    '## County-Safe Posture',
    '',
    bulletList(notes.countySafePosture),
    '',
    '## Install / Validation Commands',
    '',
    ...notes.installCommands.flatMap(renderCommand),
    '## Daily / Release Commands',
    '',
    ...notes.dailyCommands.flatMap(renderCommand),
    '## Release Evidence Artifacts',
    '',
    ...notes.releaseArtifacts.flatMap(renderArtifact),
    '## Known Limitations',
    '',
    bulletList(notes.knownLimitations),
    '',
    '## Root Shim / Compatibility Policy',
    '',
    bulletList(notes.shimDeprecationPolicy),
    '',
    '## Upgrade Notes',
    '',
    bulletList(notes.upgradeNotes),
    '',
    '## Architecture Summary',
    '',
    bulletList(notes.architectureSummary),
    '',
    '## Authority Boundary',
    '',
    '- Release notes are operational memory, not hype.',
    '- Release notes do not execute commands.',
    '- Active policy still governs all runtime authority.',
    '- The runtime remains OS/platform infrastructure rather than a product-suite write lane.',
    '- The runtime intentionally does not create or push Git tags; humans execute release Git commands manually.',
    '',
  ].join('\n');
}

function renderCommand(commandDefinition: LocalAgentReleaseCommand): string[] {
  return [
    `### ${commandDefinition.title}`,
    '',
    commandDefinition.purpose,
    '',
    '```bash',
    commandDefinition.command,
    '```',
    '',
  ];
}

function renderArtifact(artifact: LocalAgentReleaseArtifact): string[] {
  return [
    `### ${artifact.title}`,
    '',
    `- Path: ${artifact.path}`,
    `- Required: ${artifact.required}`,
    `- Exists: ${artifact.exists}`,
    `- Purpose: ${artifact.purpose}`,
    '',
  ];
}

function command(title: string, commandText: string, purpose: string): LocalAgentReleaseCommand {
  return { title, command: commandText, purpose };
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}

function resolvePath(repoRoot: string, path: string): string {
  if (path.startsWith('.terrafusion/')) {
    return terrafusionPath(repoRoot, path.slice('.terrafusion/'.length));
  }

  if (path.includes('/')) {
    return `${repoRoot}/${path}`;
  }

  return `${repoRoot}/${path}`;
}