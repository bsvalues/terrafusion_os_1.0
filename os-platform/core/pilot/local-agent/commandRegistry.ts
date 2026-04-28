import { mkdirSync, writeFileSync } from 'node:fs';

import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';

export interface LocalAgentCommandDefinition {
  name: string;
  summary: string;
  example: string;
  group: 'Guidance' | 'Planning' | 'Patch Control' | 'Validation' | 'Handoff' | 'Release' | 'Advanced';
  beginnerSafe: boolean;
  mutatesState: boolean;
  requiresLockedCard: boolean;
}

export interface LocalAgentGlobalOptionDefinition {
  name: string;
  summary: string;
  example: string;
}

export interface LocalAgentCommandRegistry {
  createdAt: number;
  commandCount: number;
  groups: string[];
  globalOptions: LocalAgentGlobalOptionDefinition[];
  commands: LocalAgentCommandDefinition[];
}

function getDefaultModelEndpointExample(): string {
  const port = process.env.TF_LOCAL_MODEL_PORT?.trim() || '11434';
  return `http://127.0.0.1:${port}/v1`;
}

const LOCAL_AGENT_GLOBAL_OPTIONS: LocalAgentGlobalOptionDefinition[] = [
  {
    name: '--repo-root',
    summary: 'Run local-agent commands against a different repo root than the current working directory.',
    example: 'pnpm run tf:local-agent -- --repo-root C:/temp/tf-repro start',
  },
];

const LOCAL_AGENT_COMMANDS: LocalAgentCommandDefinition[] = [
  {
    name: 'start',
    summary: 'Open the founder cockpit for guided local-agent flows.',
    example: 'pnpm run tf:local-agent -- start',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'init',
    summary: 'First-run preflight: check node/pnpm/git and write a starter plan-mode work card if none exists.',
    example: 'pnpm run tf:local-agent -- init',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'status',
    summary: 'Read-only daily-glance: card mode, last proof, pending patches, recent events, and recommended next command.',
    example: 'pnpm run tf:local-agent -- status',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'events',
    summary: 'Read-only audit-log tail (default 20 newest). Optional --tail N (1–200) and --type T filter.',
    example: 'pnpm run tf:local-agent -- events --tail 10 --type local_agent_init',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'release',
    summary: 'Read-only release plan: surveys release artifacts and prints the next exact command.',
    example: 'pnpm run tf:local-agent -- release',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'doc-truth',
    summary: 'Verify founder-facing docs reference real CLI verbs. Exits non-zero on any unknown verb.',
    example: 'pnpm run tf:local-agent -- doc-truth',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'daemon',
    summary: 'Manage the local-agent daemon (path-based IPC only, never TCP). Subcommands: start | stop | status.',
    example: 'pnpm run tf:local-agent -- daemon status',
    group: 'Advanced',
    beginnerSafe: false,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'help-me',
    summary: 'Show beginner-safe workflows and reminders.',
    example: 'pnpm run tf:local-agent -- help-me',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'next',
    summary: 'Recommend one safe next command from local state.',
    example: 'pnpm run tf:local-agent -- next',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'explain-commands',
    summary: 'Explain the command map in plain English.',
    example: 'pnpm run tf:local-agent -- explain-commands',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'command-registry',
    summary: 'Write the machine-readable command registry for future UI consumers.',
    example: 'pnpm run tf:local-agent -- command-registry',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'doctor',
    summary: 'Write doctor-report and model-runtime-status artifacts from current local state and local model health.',
    example: `pnpm run tf:local-agent -- doctor --model-endpoint ${getDefaultModelEndpointExample()} --model-name local-coder`,
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'model-health',
    summary: 'Check whether the configured local model gateway is reachable without granting tool authority.',
    example: `pnpm run tf:local-agent -- model-health --model-endpoint ${getDefaultModelEndpointExample()} --model-name local-coder`,
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'list-models',
    summary: 'List models exposed by the configured local loopback gateway.',
    example: `pnpm run tf:local-agent -- list-models --model-endpoint ${getDefaultModelEndpointExample()}`,
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'model-chat',
    summary: 'Send a zero-authority advisory chat prompt to the configured local loopback model gateway.',
    example: `pnpm run tf:local-agent -- model-chat --model-endpoint ${getDefaultModelEndpointExample()} --message "Summarize the locked card risks"`,
    group: 'Guidance',
    beginnerSafe: false,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'control-center-state',
    summary: 'Write the read-only control-center contract for future UI layers.',
    example: 'pnpm run tf:local-agent -- control-center-state',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'control-center-preview',
    summary: 'Render the read-only terminal preview from the control-center state contract.',
    example: 'pnpm run tf:local-agent -- control-center-preview',
    group: 'Guidance',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'release-notes',
    summary: 'Write CHANGELOG.md and 0.1.0 release note artifacts.',
    example: 'pnpm run tf:local-agent -- release-notes',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'docs-index',
    summary: 'Write the release reading path and required artifact index.',
    example: 'pnpm run tf:local-agent -- docs-index',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'product-manifest',
    summary: 'Write the runtime shipping contract and release governance posture.',
    example: 'pnpm run tf:local-agent -- product-manifest',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'release-check',
    summary: 'Validate release evidence artifacts before shipping.',
    example: 'pnpm run tf:local-agent -- release-check',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'release-freeze',
    summary: 'Fingerprint the current release evidence bundle and record the rerun gates for the frozen founder launch state.',
    example: 'pnpm run tf:local-agent -- release-freeze',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'ship-mvp',
    summary: 'Run the MVP release evidence spine and create a release evidence bundle; does not approve, tag, or push.',
    example: 'pnpm run tf:local-agent -- ship-mvp release --overwrite',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'tag-gate',
    summary: 'Validate release-tag readiness without creating the git tag.',
    example: 'pnpm run tf:local-agent -- tag-gate 0.1.0',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'release-approve',
    summary: 'Record human release owner approval after Tag Gate passes, without creating a git tag.',
    example: 'pnpm run tf:local-agent -- release-approve 0.1.0 --name "Founder"',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'tag-command',
    summary: 'Print the final manual git tag command after release approval, without executing it.',
    example: 'pnpm run tf:local-agent -- tag-command 0.1.0',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'release-runbook',
    summary: 'Write the final human release runbook after tag gate, approval, and tag command reports.',
    example: 'pnpm run tf:local-agent -- release-runbook 0.1.0',
    group: 'Release',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'plan',
    summary: 'Create a bounded work card without mutating repository state.',
    example: 'pnpm run tf:local-agent -- plan "Describe your task here"',
    group: 'Planning',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'lock-card',
    summary: 'Lock a bounded work card before patching.',
    example: 'pnpm run tf:local-agent -- lock-card "Describe your task here"',
    group: 'Planning',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: false,
  },
  {
    name: 'current-card',
    summary: 'Show the currently locked work card.',
    example: 'pnpm run tf:local-agent -- current-card',
    group: 'Planning',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: true,
  },
  {
    name: 'clear-card',
    summary: 'Clear the currently locked work card.',
    example: 'pnpm run tf:local-agent -- clear-card',
    group: 'Planning',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: true,
  },
  {
    name: 'preview-patch',
    summary: 'Create a patch preview under the locked-card boundary.',
    example: 'pnpm run tf:local-agent -- preview-patch <path> --content-file <file>',
    group: 'Patch Control',
    beginnerSafe: false,
    mutatesState: true,
    requiresLockedCard: true,
  },
  {
    name: 'show-patch',
    summary: 'Display a previously created patch preview.',
    example: 'pnpm run tf:local-agent -- show-patch <patchId>',
    group: 'Patch Control',
    beginnerSafe: false,
    mutatesState: false,
    requiresLockedCard: true,
  },
  {
    name: 'apply-patch',
    summary: 'Apply a previewed patch only with explicit approval.',
    example: 'pnpm run tf:local-agent -- apply-patch <patchId> --approve',
    group: 'Patch Control',
    beginnerSafe: false,
    mutatesState: true,
    requiresLockedCard: true,
  },
  {
    name: 'proof',
    summary: 'Run proof gates for the locked work card.',
    example: 'pnpm run tf:local-agent -- proof',
    group: 'Validation',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: true,
  },
  {
    name: 'explain',
    summary: 'Render a read-only explanation from locked-card, proof, save-state, and local-agent artifact context.',
    example: 'pnpm run tf:local-agent -- explain --include-proof --include-save-state',
    group: 'Validation',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'review',
    summary: 'Render a read-only review of risks, pending patches, proof posture, and finalize blockers.',
    example: 'pnpm run tf:local-agent -- review --include-events --include-pending-patches',
    group: 'Validation',
    beginnerSafe: true,
    mutatesState: false,
    requiresLockedCard: false,
  },
  {
    name: 'save-state',
    summary: 'Write founder handoff state for the current run.',
    example: 'pnpm run tf:local-agent -- save-state "Summarize what happened" --next-step "Write the next exact action"',
    group: 'Handoff',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: true,
  },
  {
    name: 'finalize',
    summary: 'Declare completion only after locked card, proof, and save state exist.',
    example: 'pnpm run tf:local-agent -- finalize',
    group: 'Handoff',
    beginnerSafe: true,
    mutatesState: true,
    requiresLockedCard: true,
  },
  {
    name: 'tool',
    summary: 'Run advanced governed tool commands under the founder policy.',
    example: 'pnpm run tf:local-agent -- tool read-file <path>',
    group: 'Advanced',
    beginnerSafe: false,
    mutatesState: false,
    requiresLockedCard: false,
  },
];

export class LocalAgentCommandRegistryBuilder {
  constructor(private readonly repoRoot: string) {}

  build(): LocalAgentCommandRegistry {
    const registry: LocalAgentCommandRegistry = {
      createdAt: Math.floor(Date.now() / 1000),
      commandCount: LOCAL_AGENT_COMMANDS.length,
      groups: Array.from(new Set(LOCAL_AGENT_COMMANDS.map(command => command.group))),
      globalOptions: LOCAL_AGENT_GLOBAL_OPTIONS.map(option => ({ ...option })),
      commands: listLocalAgentCommands(),
    };

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, 'command-registry.json'), JSON.stringify(registry, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'command-registry.md'), renderLocalAgentCommandRegistry(registry), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'command_registry_written', {
      commandCount: registry.commandCount,
      groups: registry.groups,
      globalOptionCount: registry.globalOptions.length,
    });

    return registry;
  }
}

export function listLocalAgentCommands(): LocalAgentCommandDefinition[] {
  return LOCAL_AGENT_COMMANDS.map(command => ({ ...command }));
}

export function renderLocalAgentCommandRegistry(registry: LocalAgentCommandRegistry): string {
  const sections = registry.groups.map(group => {
    const commands = registry.commands.filter(command => command.group === group);
    return [
      `## ${group}`,
      '',
      ...commands.flatMap(command => [
        `### ${command.name}`,
        '',
        command.summary,
        '',
        `- Beginner Safe: ${command.beginnerSafe}`,
        `- Mutates State: ${command.mutatesState}`,
        `- Requires Locked Card: ${command.requiresLockedCard}`,
        '',
        '```bash',
        command.example,
        '```',
        '',
      ]),
    ].join('\n');
  });

  return [
    '# TerraFusion Local Agent Command Registry',
    '',
    `- Command Count: ${registry.commandCount}`,
    `- Groups: ${registry.groups.join(', ')}`,
    `- Global Options: ${registry.globalOptions.length}`,
    '',
    '## Global Options',
    '',
    ...registry.globalOptions.flatMap(option => [
      `### ${option.name}`,
      '',
      option.summary,
      '',
      '```bash',
      option.example,
      '```',
      '',
    ]),
    '',
    ...sections,
    '## Authority Boundary',
    '',
    '- This registry documents commands for future UI consumers.',
    '- It does not execute commands.',
    '- The harness still owns enforcement and approval.',
    '',
  ].join('\n');
}