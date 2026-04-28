import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

import { LocalAgentCommandRegistryBuilder, type LocalAgentCommandDefinition, type LocalAgentCommandRegistry } from './commandRegistry.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import { LocalAgentHelpSystem } from './help.js';

export interface LocalAgentControlCenterPolicyState {
  available: boolean;
  profile: string;
  source: string;
  purpose: string;
  cloudAllowed: boolean;
  privateLanAllowed: boolean;
  modelEndpoint: string | null;
  warning: string | null;
}

export interface LocalAgentControlCenterDoctorState {
  available: boolean;
  overallStatus: string | null;
  criticalFailures: number;
  warnings: number;
  path: string | null;
}

export interface LocalAgentControlCenterModelState {
  available: boolean;
  healthy: boolean | null;
  endpoint: string | null;
  model: string | null;
  startupMode: string | null;
  warnings: string[];
  path: string | null;
}

export interface LocalAgentControlCenterArtifactState {
  activePolicy: boolean;
  commandRegistry: boolean;
  controlCenterState: boolean;
  currentWorkCard: boolean;
  patchPreview: boolean;
  proofResults: boolean;
  saveState: boolean;
  finalReport: boolean;
  doctorReport: boolean;
  modelRuntimeStatus: boolean;
  releaseNotes: boolean;
  docsIndex: boolean;
  productManifest: boolean;
  releaseCheck: boolean;
  releaseFreeze: boolean;
  shipReport: boolean;
  tagGate: boolean;
  releaseApproval: boolean;
  tagCommand: boolean;
  releaseRunbook: boolean;
}

export interface LocalAgentControlCenterAction {
  id: string;
  label: string;
  command: string;
  group: string;
  enabled: boolean;
  reason: string;
  beginnerSafe: boolean;
  mutatesState: boolean;
}

export interface LocalAgentControlCenterIdentityState {
  productName: string;
  internalCodename: string;
  productSentence: string;
  operatingFaces: string[];
  notes: string[];
}

export interface LocalAgentControlCenterState {
  createdAt: number;
  version: string;
  identity: LocalAgentControlCenterIdentityState;
  policy: LocalAgentControlCenterPolicyState;
  doctor: LocalAgentControlCenterDoctorState;
  model: LocalAgentControlCenterModelState;
  artifacts: LocalAgentControlCenterArtifactState;
  nextCommand: string;
  nextReason: string;
  commandCount: number;
  commandGroups: string[];
  commandRegistryPath: string;
  actions: LocalAgentControlCenterAction[];
  notes: string[];
}

export class LocalAgentControlCenterStateBuilder {
  constructor(private readonly repoRoot: string) {}

  build(): LocalAgentControlCenterState {
    const registry = new LocalAgentCommandRegistryBuilder(this.repoRoot).build();
    const policy = this.readPolicyState();
    const doctor = this.readDoctorState();
    const model = this.readModelState();
    const artifacts = this.readArtifacts();
    const recommendation = new LocalAgentHelpSystem(this.repoRoot).recommendNext();
    const actions = this.buildActions(registry, artifacts);
    const identity: LocalAgentControlCenterIdentityState = {
      productName: 'TerraFusion Local Agent Runtime',
      internalCodename: 'Prometheus',
      productSentence:
        'Prometheus is the county-safe local agent runtime harness that gives TerraFusion a Claude Code / Codex-class copilot posture without changing the external product name.',
      operatingFaces: ['Founder Builder', 'County Operations Assistant', 'TerraPilot Dev Mode'],
      notes: [
        'Prometheus is an internal codename.',
        'Prometheus is not a model.',
        'Prometheus is not OpenMythos.',
        'Prometheus is not a GUI.',
      ],
    };

    const state: LocalAgentControlCenterState = {
      createdAt: Math.floor(Date.now() / 1000),
      version: '0.1.0',
      identity,
      policy,
      doctor,
      model,
      artifacts,
      nextCommand: recommendation.command,
      nextReason: recommendation.reason,
      commandCount: registry.commandCount,
      commandGroups: registry.groups,
      commandRegistryPath: '.terrafusion/command-registry.json',
      actions,
      notes: [
        'Control Center state is read-only UI input.',
        'Future buttons must still route through the local-agent CLI.',
        'The harness keeps authority even when a desktop shell renders this contract.',
      ],
    };

    mkdirSync(terrafusionPath(this.repoRoot), { recursive: true });
    writeFileSync(terrafusionPath(this.repoRoot, 'control-center-state.json'), JSON.stringify(state, null, 2), 'utf8');
    writeFileSync(terrafusionPath(this.repoRoot, 'control-center-state.md'), renderLocalAgentControlCenterState(state), 'utf8');

    appendLocalAgentEvent(this.repoRoot, 'control_center_state_written', {
      version: state.version,
      policyProfile: state.policy.profile,
      doctorStatus: state.doctor.overallStatus,
      modelHealthy: state.model.healthy,
      nextCommand: state.nextCommand,
      actionCount: state.actions.length,
    });

    return state;
  }

  private readPolicyState(): LocalAgentControlCenterPolicyState {
    const path = terrafusionPath(this.repoRoot, 'active-policy.json');
    if (!existsSync(path)) {
      return {
        available: true,
        profile: 'founder',
        source: 'founder-default',
        purpose: 'Default local-agent founder policy is active until an exported policy is present.',
        cloudAllowed: false,
        privateLanAllowed: false,
        modelEndpoint: null,
        warning: 'No exported active policy found; summarizing the founder-default local-agent posture.',
      };
    }

    try {
      const payload = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
      const endpointPolicy = this.readEndpointPolicy(payload);
      return {
        available: true,
        profile: asText(payload.name, 'unknown'),
        source: 'active-policy.json',
        purpose: asText(payload.purpose, 'No purpose recorded.'),
        cloudAllowed: endpointPolicy.cloudAllowed,
        privateLanAllowed: endpointPolicy.privateLanAllowed,
        modelEndpoint: endpointPolicy.modelEndpoint,
        warning: null,
      };
    } catch {
      return {
        available: false,
        profile: 'unknown',
        source: 'active-policy.json',
        purpose: 'Policy artifact is corrupted.',
        cloudAllowed: false,
        privateLanAllowed: false,
        modelEndpoint: null,
        warning: 'active-policy.json is corrupted.',
      };
    }
  }

  private readDoctorState(): LocalAgentControlCenterDoctorState {
    const path = terrafusionPath(this.repoRoot, 'doctor-report.json');
    if (!existsSync(path)) {
      return {
        available: false,
        overallStatus: null,
        criticalFailures: 0,
        warnings: 0,
        path: null,
      };
    }

    try {
      const payload = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
      return {
        available: true,
        overallStatus: asText(payload.overallStatus ?? payload.overall_status, 'unknown'),
        criticalFailures: asNumber(payload.criticalFailures ?? payload.critical_failures),
        warnings: asNumber(payload.warnings),
        path: '.terrafusion/doctor-report.json',
      };
    } catch {
      return {
        available: true,
        overallStatus: 'corrupted',
        criticalFailures: 1,
        warnings: 0,
        path: '.terrafusion/doctor-report.json',
      };
    }
  }

  private readModelState(): LocalAgentControlCenterModelState {
    const path = terrafusionPath(this.repoRoot, 'model-runtime-status.json');
    if (!existsSync(path)) {
      return {
        available: false,
        healthy: null,
        endpoint: null,
        model: null,
        startupMode: null,
        warnings: [],
        path: null,
      };
    }

    try {
      const payload = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
      return {
        available: true,
        healthy: Boolean(payload.healthy),
        endpoint: asNullableText(payload.endpoint),
        model: asNullableText(payload.model),
        startupMode: asNullableText(payload.startupMode ?? payload.startup_mode),
        warnings: Array.isArray(payload.warnings) ? payload.warnings.map(item => String(item)) : [],
        path: '.terrafusion/model-runtime-status.json',
      };
    } catch {
      return {
        available: true,
        healthy: false,
        endpoint: null,
        model: null,
        startupMode: 'corrupted',
        warnings: ['model-runtime-status.json is corrupted.'],
        path: '.terrafusion/model-runtime-status.json',
      };
    }
  }

  private readArtifacts(): LocalAgentControlCenterArtifactState {
    const patchesDir = terrafusionPath(this.repoRoot, 'patches');
    return {
      activePolicy: existsSync(terrafusionPath(this.repoRoot, 'active-policy.json')),
      commandRegistry: existsSync(terrafusionPath(this.repoRoot, 'command-registry.json')),
      controlCenterState: existsSync(terrafusionPath(this.repoRoot, 'control-center-state.json')),
      currentWorkCard: existsSync(terrafusionPath(this.repoRoot, 'current-work-card.json')),
      patchPreview: existsSync(patchesDir) && readdirSync(patchesDir).some(entry => entry.endsWith('.json')),
      proofResults: existsSync(terrafusionPath(this.repoRoot, 'proof-results.json')),
      saveState: existsSync(terrafusionPath(this.repoRoot, 'save-state.md')),
      finalReport: existsSync(terrafusionPath(this.repoRoot, 'final-report.json')),
      doctorReport: existsSync(terrafusionPath(this.repoRoot, 'doctor-report.json')),
      modelRuntimeStatus: existsSync(terrafusionPath(this.repoRoot, 'model-runtime-status.json')),
      releaseNotes: existsSync(terrafusionPath(this.repoRoot, 'release-notes-0.1.0.json')),
      docsIndex: existsSync(terrafusionPath(this.repoRoot, 'docs-index.json')),
      productManifest: existsSync(terrafusionPath(this.repoRoot, 'product-manifest.json')),
      releaseCheck: existsSync(terrafusionPath(this.repoRoot, 'release-check-report.json')),
      releaseFreeze: existsSync(terrafusionPath(this.repoRoot, 'release-freeze-card.json')),
      shipReport: existsSync(terrafusionPath(this.repoRoot, 'ship-report.json')),
      tagGate: existsSync(terrafusionPath(this.repoRoot, 'tag-gate-report.json')),
      releaseApproval: existsSync(terrafusionPath(this.repoRoot, 'release-approval.json')),
      tagCommand: existsSync(terrafusionPath(this.repoRoot, 'tag-command-report.json')),
      releaseRunbook: existsSync(terrafusionPath(this.repoRoot, 'release-runbook-0.1.0.json')),
    };
  }

  private buildActions(
    registry: LocalAgentCommandRegistry,
    artifacts: LocalAgentControlCenterArtifactState,
  ): LocalAgentControlCenterAction[] {
    const selected = new Set([
      'start',
      'help-me',
      'next',
      'doctor',
      'plan',
      'lock-card',
      'current-card',
      'clear-card',
      'proof',
      'save-state',
      'finalize',
      'command-registry',
      'control-center-state',
      'control-center-preview',
      'release-notes',
      'docs-index',
      'product-manifest',
      'release-check',
      'release-freeze',
      'ship-mvp',
      'tag-gate',
      'release-approve',
      'tag-command',
      'release-runbook',
    ]);

    return registry.commands
      .filter(command => selected.has(command.name))
      .map(command => {
        const [enabled, reason] = this.isActionEnabled(command, artifacts);
        return {
          id: command.name,
          label: labelForCommand(command.name),
          command: command.example,
          group: command.group,
          enabled,
          reason,
          beginnerSafe: command.beginnerSafe,
          mutatesState: command.mutatesState,
        };
      });
  }

  private isActionEnabled(
    command: LocalAgentCommandDefinition,
    artifacts: LocalAgentControlCenterArtifactState,
  ): [boolean, string] {
    if (command.requiresLockedCard && !artifacts.currentWorkCard) {
      return [false, 'Locked work card required.'];
    }

    if (command.name === 'finalize' && (!artifacts.proofResults || !artifacts.saveState)) {
      return [false, 'Finalize requires proof results and Save State.'];
    }

    if (command.name === 'tag-gate' && (!artifacts.releaseNotes || !artifacts.docsIndex || !artifacts.productManifest || !artifacts.releaseCheck || !artifacts.shipReport)) {
      return [false, 'Tag Gate requires release notes, docs index, product manifest, release check, and ship report.'];
    }

    if (command.name === 'release-freeze' && (!artifacts.releaseNotes || !artifacts.docsIndex || !artifacts.productManifest || !artifacts.releaseCheck)) {
      return [false, 'Release freeze requires release notes, docs index, product manifest, and a passing release check artifact.'];
    }

    if (command.name === 'release-approve' && !artifacts.tagGate) {
      return [false, 'Release approval requires a passing Tag Gate report.'];
    }

    if (command.name === 'tag-command' && !artifacts.releaseApproval) {
      return [false, 'Tag command requires release approval.'];
    }

    if (command.name === 'release-runbook' && (!artifacts.tagGate || !artifacts.releaseApproval || !artifacts.tagCommand)) {
      return [false, 'Release runbook requires tag gate, release approval, and tag command artifacts.'];
    }

    return [true, 'Available under current local state.'];
  }

  private readEndpointPolicy(payload: Record<string, unknown>): {
    cloudAllowed: boolean;
    privateLanAllowed: boolean;
    modelEndpoint: string | null;
  } {
    const candidate = payload.modelEndpoints ?? payload.model_endpoints;
    if (!candidate || typeof candidate !== 'object') {
      return {
        cloudAllowed: false,
        privateLanAllowed: false,
        modelEndpoint: null,
      };
    }

    const modelPolicy = candidate as Record<string, unknown>;
    return {
      cloudAllowed: Boolean(modelPolicy.allowCloud ?? modelPolicy.allow_cloud),
      privateLanAllowed: Boolean(modelPolicy.allowPrivateLan ?? modelPolicy.allow_private_lan),
      modelEndpoint: asNullableText(modelPolicy.defaultEndpoint ?? modelPolicy.default_endpoint),
    };
  }
}

export function renderLocalAgentControlCenterState(state: LocalAgentControlCenterState): string {
  const actionLines = state.actions.flatMap(action => [
    `### ${action.label}`,
    '',
    '```bash',
    action.command,
    '```',
    '',
    `- ID: ${action.id}`,
    `- Group: ${action.group}`,
    `- Enabled: ${action.enabled}`,
    `- Reason: ${action.reason}`,
    `- Beginner Safe: ${action.beginnerSafe}`,
    `- Mutates State: ${action.mutatesState}`,
    '',
  ]);

  return [
    '# TerraFusion Control Center State',
    '',
    `- Version: ${state.version}`,
    `- Product Name: ${state.identity.productName}`,
    `- Internal Codename: ${state.identity.internalCodename}`,
    `- Command Count: ${state.commandCount}`,
    `- Registry Path: ${state.commandRegistryPath}`,
    '',
    '## Product Identity',
    '',
    state.identity.productSentence,
    '',
    '### Operating Faces',
    '',
    bulletList(state.identity.operatingFaces),
    '',
    '### Identity Notes',
    '',
    bulletList(state.identity.notes),
    '',
    '## Active Policy',
    '',
    `- Available: ${state.policy.available}`,
    `- Profile: ${state.policy.profile}`,
    `- Source: ${state.policy.source}`,
    `- Purpose: ${state.policy.purpose}`,
    `- Cloud Allowed: ${state.policy.cloudAllowed}`,
    `- Private LAN Allowed: ${state.policy.privateLanAllowed}`,
    `- Model Endpoint: ${state.policy.modelEndpoint ?? 'none'}`,
    `- Warning: ${state.policy.warning ?? 'none'}`,
    '',
    '## Doctor',
    '',
    `- Available: ${state.doctor.available}`,
    `- Overall Status: ${state.doctor.overallStatus ?? 'not available'}`,
    `- Critical Failures: ${state.doctor.criticalFailures}`,
    `- Warnings: ${state.doctor.warnings}`,
    `- Path: ${state.doctor.path ?? 'none'}`,
    '',
    '## Model Runtime',
    '',
    `- Available: ${state.model.available}`,
    `- Healthy: ${state.model.healthy ?? 'unknown'}`,
    `- Endpoint: ${state.model.endpoint ?? 'none'}`,
    `- Model: ${state.model.model ?? 'none'}`,
    `- Startup Mode: ${state.model.startupMode ?? 'none'}`,
    '',
    '### Model Warnings',
    '',
    bulletList(state.model.warnings),
    '',
    '## Next Recommended Command',
    '',
    '```bash',
    state.nextCommand,
    '```',
    '',
    state.nextReason,
    '',
    '## Artifacts',
    '',
    '```json',
    JSON.stringify(state.artifacts, null, 2),
    '```',
    '',
    '## UI Actions',
    '',
    ...actionLines,
    '## Notes',
    '',
    bulletList(state.notes),
    '',
    '## Authority Boundary',
    '',
    '- This state document is for UI rendering only.',
    '- It does not execute commands.',
    '- Buttons rendered from this contract must still call the harness.',
    '- Active policy and locked-card rules still govern execution.',
    '',
  ].join('\n');
}

function labelForCommand(commandName: string): string {
  const labels: Record<string, string> = {
    start: 'Open Founder Cockpit',
    'help-me': 'Help Me',
    next: 'Recommend Next Step',
    doctor: 'Run Doctor',
    plan: 'Plan Task',
    'lock-card': 'Lock Work Card',
    'current-card': 'Show Current Card',
    'clear-card': 'Clear Current Card',
    proof: 'Run Proof Gates',
    'save-state': 'Save State',
    finalize: 'Finalize',
    'command-registry': 'Write Command Registry',
    'control-center-state': 'Write Control Center State',
    'control-center-preview': 'Preview Control Center',
    'release-notes': 'Write Release Notes',
    'docs-index': 'Write Docs Index',
    'product-manifest': 'Write Product Manifest',
    'release-check': 'Run Release Check',
    'release-freeze': 'Write Release Freeze Card',
    'ship-mvp': 'Ship MVP Evidence',
    'tag-gate': 'Run Tag Gate',
    'release-approve': 'Record Release Approval',
    'tag-command': 'Write Tag Command Report',
    'release-runbook': 'Write Release Runbook',
  };

  return labels[commandName] ?? commandName;
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}

function asText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function asNullableText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asNumber(value: unknown): number {
  return typeof value === 'number' ? value : Number(value ?? 0) || 0;
}