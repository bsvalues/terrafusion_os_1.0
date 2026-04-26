import { existsSync, readFileSync } from 'node:fs';

import type { LocalAgentControlCenterAction, LocalAgentControlCenterState } from './controlCenter.js';
import { terrafusionPath } from './eventLog.js';

export interface LocalAgentControlCenterPreviewAction {
  id: string;
  label: string;
  command: string;
  group: string;
  enabled: boolean;
  reason: string;
  beginnerSafe: boolean;
  mutatesState: boolean;
}

export interface LocalAgentControlCenterPreviewState {
  policyProfile: string;
  doctorStatus: string;
  modelStatus: string;
  modelEndpoint: string;
  nextCommand: string;
  nextReason: string;
  actions: LocalAgentControlCenterPreviewAction[];
  artifactSummary: Record<string, boolean>;
}

export class LocalAgentControlCenterPreview {
  constructor(private readonly repoRoot: string) {}

  load(): LocalAgentControlCenterPreviewState {
    const statePath = terrafusionPath(this.repoRoot, 'control-center-state.json');
    if (!existsSync(statePath)) {
      throw new Error('control-center-state.json is missing. Run: pnpm run tf:local-agent -- control-center-state');
    }

    let payload: unknown;
    try {
      payload = JSON.parse(readFileSync(statePath, 'utf8'));
    } catch {
      throw new Error('control-center-state.json is corrupted. Re-run: pnpm run tf:local-agent -- control-center-state');
    }

    return parseControlCenterPreviewState(payload);
  }

  render(): string {
    return renderLocalAgentControlCenterPreview(this.load());
  }
}

export function renderLocalAgentControlCenterPreview(state: LocalAgentControlCenterPreviewState): string {
  const enabledCount = state.actions.filter(action => action.enabled).length;
  const disabledCount = state.actions.length - enabledCount;
  const grouped = groupActions(state.actions);

  return [
    'TerraFusion Control Center',
    '==========================',
    '',
    'Status',
    '------',
    `Policy: ${state.policyProfile}`,
    `Doctor: ${state.doctorStatus}`,
    `Model:  ${state.modelStatus}`,
    `Endpoint: ${state.modelEndpoint}`,
    '',
    'Next Recommended Command',
    '------------------------',
    state.nextCommand,
    '',
    state.nextReason,
    '',
    'Actions',
    '-------',
    `Enabled: ${enabledCount} | Disabled: ${disabledCount}`,
    '',
    ...renderGroupedActions(grouped),
    'Artifacts',
    '---------',
    ...Object.entries(state.artifactSummary)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `- ${key}: ${value ? 'yes' : 'no'}`),
    '',
    'Authority Boundary',
    '------------------',
    '- This preview is read-only.',
    '- It does not execute commands.',
    '- It does not change policy.',
    '- It does not patch files.',
    '- Future buttons must still route through the harness.',
    '',
  ].join('\n');
}

function parseControlCenterPreviewState(payload: unknown): LocalAgentControlCenterPreviewState {
  if (!payload || typeof payload !== 'object') {
    throw new Error('control-center-state.json is not a JSON object.');
  }

  const raw = payload as Record<string, unknown>;
  const policy = toRecord(raw.policy);
  const doctor = toRecord(raw.doctor);
  const model = toRecord(raw.model);
  const artifacts = toRecord(raw.artifacts);
  const actionPayload = raw.actions;

  if (!Array.isArray(actionPayload)) {
    throw new Error('control-center-state.json is missing an actions list.');
  }

  const actions = actionPayload.map(parseAction);
  const modelAvailable = Boolean(model.available);
  const modelHealthy = model.healthy;
  const modelStatus = !modelAvailable ? 'not checked' : modelHealthy ? 'healthy' : 'unavailable';

  return {
    policyProfile: asText(policy.profile, 'not available'),
    doctorStatus: asText(doctor.overallStatus, 'not available'),
    modelStatus,
    modelEndpoint: asText(model.endpoint, 'not available'),
    nextCommand: asText(raw.nextCommand, 'pnpm run tf:local-agent -- help-me'),
    nextReason: asText(raw.nextReason, 'No reason provided.'),
    actions,
    artifactSummary: Object.fromEntries(Object.entries(artifacts).map(([key, value]) => [key, Boolean(value)])),
  };
}

function parseAction(raw: unknown): LocalAgentControlCenterPreviewAction {
  if (!raw || typeof raw !== 'object') {
    throw new Error('control-center-state action entry is malformed.');
  }

  const payload = raw as Record<string, unknown>;
  const required = ['id', 'label', 'command', 'group', 'enabled', 'reason', 'beginnerSafe', 'mutatesState'];
  const missing = required.filter(key => !(key in payload));
  if (missing.length > 0) {
    throw new Error(`control-center-state action missing fields: ${missing.join(', ')}`);
  }

  return {
    id: asText(payload.id, ''),
    label: asText(payload.label, ''),
    command: asText(payload.command, ''),
    group: asText(payload.group, ''),
    enabled: Boolean(payload.enabled),
    reason: asText(payload.reason, ''),
    beginnerSafe: Boolean(payload.beginnerSafe),
    mutatesState: Boolean(payload.mutatesState),
  };
}

function groupActions(actions: LocalAgentControlCenterAction[]): Record<string, LocalAgentControlCenterAction[]> {
  return actions.reduce<Record<string, LocalAgentControlCenterAction[]>>((groups, action) => {
    groups[action.group] ??= [];
    groups[action.group].push(action);
    return groups;
  }, {});
}

function renderGroupedActions(groups: Record<string, LocalAgentControlCenterAction[]>): string[] {
  return Object.keys(groups)
    .sort((left, right) => left.localeCompare(right))
    .flatMap(group => {
      const lines = [`[${group}]`];
      for (const action of groups[group]) {
        lines.push(`  [${action.enabled ? 'enabled' : 'disabled'}] ${action.label} — ${action.command}`);
        lines.push(
          `      ${action.reason} (${action.mutatesState ? 'mutates' : 'read-only'}, ${action.beginnerSafe ? 'beginner-safe' : 'advanced'})`,
        );
      }
      lines.push('');
      return lines;
    });
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asText(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}