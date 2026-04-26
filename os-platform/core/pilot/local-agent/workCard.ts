import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

import { matchesGlob } from './policy.js';

export interface LocalAgentWorkProfile {
  id: string;
  name: string;
  keywords: string[];
  why: string;
  allowedFiles: string[];
  forbiddenFiles: string[];
  successCriteria: string[];
  risks: string[];
}

export interface LocalAgentWorkCard {
  id: string;
  mode: 'Plan';
  task: string;
  planSummary?: string | null;
  why: string;
  readiness: string;
  truthPosture: string;
  allowedFiles: string[];
  forbiddenFiles: string[];
  proofGates: string[];
  successCriteria: string[];
  risks: string[];
  candidateFiles?: string[];
  confidence: number;
  notes: string[];
  modelAssistance?: LocalAgentPlanAssistance;
}

export interface LocalAgentPlanAssistanceInput {
  requested: boolean;
  available: boolean;
  status: string;
  model: string | null;
  endpoint: string | null;
  taskSummary?: string | null;
  riskNotes?: string[];
  candidateFiles?: string[];
  strippedUnsafeContent?: boolean;
}

export interface LocalAgentPlanAssistance {
  requested: boolean;
  used: boolean;
  source: 'deterministic' | 'model-gateway';
  status: string;
  model: string | null;
  endpoint: string | null;
  acceptedRiskNotes: string[];
  acceptedCandidateFiles: string[];
  rejectedCandidateFiles: string[];
  strippedUnsafeContent: boolean;
}

const GLOBAL_FORBIDDEN = ['.env', '.env.*', 'secrets/**', 'docs/superpowers/**'];
const DEFAULT_SUCCESS = [
  'No forbidden files touched.',
  'Proof gates are identified before patching.',
  'Final response includes changed files, proof gates, remaining risk, and save state.',
];

const PROFILES: LocalAgentWorkProfile[] = [
  {
    id: 'local-agent-runtime',
    name: 'TerraFusion Local Agent Runtime',
    keywords: ['local agent', 'agent', 'permission', 'tool runner', 'save state', 'proof', 'patch', 'work card', 'local runtime'],
    why: 'Build the founder-simple local agent runtime inside the governed pilot surface without crossing into suites or external egress. Prometheus is the internal codename; TerraFusion Local Agent Runtime remains the public name.',
    allowedFiles: [
      'os-platform/core/pilot/local-agent/**',
      'os-platform/core/pilot/index.ts',
      'os-platform/core/tests/local-agent*.test.mjs',
      'tools/registry/build-core-js.mjs',
      'package.json',
    ],
    forbiddenFiles: ['backend/**', 'frontend/**', 'marketplace/**', 'modules/**', 'docs/superpowers/**'],
    successCriteria: [
      'The local agent stays model-agnostic.',
      'The harness owns permissions, proof, and audit state.',
      'The founder workflow remains bounded by locked work cards.',
    ],
    risks: [
      'UI polish before harness safety would create a fake control surface.',
      'Broad command allowlists would undercut county-safe posture.',
    ],
  },
  {
    id: 'shell-integrity',
    name: 'Shell Integrity',
    keywords: ['shell', 'routing', 'workbench', 'desktop', 'dock', 'top bar', 'tier-0'],
    why: 'Preserve launch and workbench behavior without leaking into backend or suite persistence.',
    allowedFiles: ['frontend/apps/os-shell/**'],
    forbiddenFiles: ['backend/**', 'marketplace/**', 'modules/**', 'docs/superpowers/**'],
    successCriteria: ['OS shell remains department-agnostic.', 'Tier-0 workbench routing is preserved.'],
    risks: ['Shell fixes can create interface drift if the launch surface contract is ignored.'],
  },
  {
    id: 'county-deployment',
    name: 'County Deployment',
    keywords: ['county', 'deployment', 'offline bundle', 'installer', 'air-gapped', 'health check'],
    why: 'Support county-safe install and diagnostics with explicit no-egress defaults and auditable outputs.',
    allowedFiles: ['os-platform/core/pilot/local-agent/**', 'tools/registry/**', 'package.json'],
    forbiddenFiles: ['backend/**', 'frontend/**', 'parcel-export/**', 'docs/superpowers/**'],
    successCriteria: ['Cloud egress stays denied by default.', 'Offline posture is auditable and inspectable.'],
    risks: ['Installer drift without checksum verification would break county trust.'],
  },
];

export class LocalAgentWorkCardFactory {
  constructor(private readonly repoRoot: string) {}

  build(task: string, assistanceInput?: LocalAgentPlanAssistanceInput | null): LocalAgentWorkCard {
    const normalizedTask = task.trim().replace(/\s+/g, ' ');
    if (!normalizedTask) {
      throw new Error('Task cannot be empty.');
    }

    const [profile, confidence] = this.selectProfile(normalizedTask);
    const proofGates = this.detectProofGates(profile?.id);
    const gitStatus = this.readGitStatus();

    if (!profile) {
      const card = {
        id: slugify(normalizedTask),
        mode: 'Plan',
        task: normalizedTask,
        planSummary: null,
        why: 'Task did not match a known governed profile. Stay read-only until a human narrows the allowed files.',
        readiness: 'R0 — unknown slice; human must define allowed files.',
        truthPosture: 'read-only; no patching permitted.',
        allowedFiles: ['READ-ONLY until a human selects allowed files.'],
        forbiddenFiles: [...GLOBAL_FORBIDDEN, 'backend/**', 'frontend/**', 'marketplace/**', 'modules/**'],
        proofGates,
        successCriteria: [...DEFAULT_SUCCESS],
        risks: ['Unknown task profile can cause scope creep.', 'Human must define allowed files before Patch Mode.'],
        candidateFiles: [],
        confidence,
        notes: ['No strong profile match.', 'Ask the founder to choose allowed files before edits.'],
      } satisfies LocalAgentWorkCard;

      return applyModelAssistance(card, assistanceInput);
    }

    const risks = [...profile.risks];
    if (gitStatus && gitStatus !== 'clean') {
      risks.push('Repository has uncommitted changes; inspect git diff before patching.');
    }

    const card = {
      id: profile.id,
      mode: 'Plan',
      task: normalizedTask,
      planSummary: null,
      why: profile.why,
      readiness: 'R1 — bounded plan generated; safe for read-only inspection.',
      truthPosture: 'plan-only; no writes; no commands outside proof gates.',
      allowedFiles: [...profile.allowedFiles],
      forbiddenFiles: [...new Set([...GLOBAL_FORBIDDEN, ...profile.forbiddenFiles])],
      proofGates,
      successCriteria: [...new Set([...profile.successCriteria, ...DEFAULT_SUCCESS])],
      risks,
      candidateFiles: [],
      confidence,
      notes: [
        `Matched profile: ${profile.name}`,
        'Prometheus is the internal codename for this runtime slice; do not rename the public product or CLI contract.',
        'Lock this card before switching to Patch Mode.',
      ],
    } satisfies LocalAgentWorkCard;

    return applyModelAssistance(card, assistanceInput);
  }

  private selectProfile(task: string): [LocalAgentWorkProfile | null, number] {
    const lower = task.toLowerCase();
    const scored = PROFILES
      .map(profile => ({
        profile,
        score: profile.keywords.filter(keyword => lower.includes(keyword)).length,
      }))
      .filter(entry => entry.score > 0)
      .sort((left, right) => right.score - left.score);

    if (scored.length === 0) {
      return [null, 0];
    }

    const best = scored[0];
    return [best.profile, Math.min(0.95, 0.35 + best.score * 0.15)];
  }

  private detectProofGates(profileId?: string): string[] {
    const gates = ['git diff --check'];
    if (existsSync(resolve(this.repoRoot, 'package.json'))) {
      gates.push('pnpm run type-check');
    }

    if (
      profileId === 'local-agent-runtime' &&
      existsSync(resolve(this.repoRoot, 'os-platform/core/tests/local-agent-policy.test.mjs')) &&
      existsSync(resolve(this.repoRoot, 'os-platform/core/tests/local-agent-runtime.test.mjs'))
    ) {
      gates.push('pnpm run test:local-agent');
    }

    return gates;
  }

  private readGitStatus(): string {
    const completed = spawnSync('git', ['status', '--short'], {
      cwd: this.repoRoot,
      encoding: 'utf8',
      windowsHide: true,
    });

    if (completed.status !== 0) {
      return '';
    }

    return completed.stdout.trim() || 'clean';
  }
}

export function renderLocalAgentWorkCard(card: LocalAgentWorkCard): string {
  const assistance = card.modelAssistance ?? defaultPlanAssistance();

  return [
    `# Work Card: ${card.id}`,
    '',
    '## Mode',
    '',
    card.mode,
    '',
    '## Task',
    '',
    card.task,
    '',
    '## Plan Summary',
    '',
    card.planSummary ?? 'Deterministic profile summary only.',
    '',
    '## Why',
    '',
    card.why,
    '',
    '## Readiness',
    '',
    card.readiness,
    '',
    '## Truth Posture',
    '',
    card.truthPosture,
    '',
    '## Confidence',
    '',
    card.confidence.toFixed(2),
    '',
    '## Allowed Files',
    '',
    bulletList(card.allowedFiles),
    '',
    '## Forbidden Files',
    '',
    bulletList(card.forbiddenFiles),
    '',
    '## Proof Gates',
    '',
    bulletList(card.proofGates),
    '',
    '## Success Criteria',
    '',
    bulletList(card.successCriteria),
    '',
    '## Risks',
    '',
    bulletList(card.risks),
    '',
    '## Candidate Files',
    '',
    bulletList(card.candidateFiles ?? []),
    '',
    '## Notes',
    '',
    bulletList(card.notes),
    '',
    '## Model Assistance',
    '',
    bulletList([
      `Requested: ${assistance.requested}`,
      `Used: ${assistance.used}`,
      `Source: ${assistance.source}`,
      `Status: ${assistance.status}`,
      `Model: ${assistance.model ?? 'none'}`,
      `Endpoint: ${assistance.endpoint ?? 'none'}`,
      `Accepted Risk Notes: ${assistance.acceptedRiskNotes.length}`,
      `Accepted Candidate Files: ${assistance.acceptedCandidateFiles.length}`,
      `Rejected Candidate Files: ${assistance.rejectedCandidateFiles.length === 0 ? 'none' : assistance.rejectedCandidateFiles.join(', ')}`,
      `Unsafe Tool/Authority Content Stripped: ${assistance.strippedUnsafeContent}`,
    ]),
    '',
  ].join('\n');
}

function bulletList(values: string[]): string {
  return values.length > 0 ? values.map(value => `- ${value}`).join('\n') : '- none';
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'work-card';
}

function applyModelAssistance(
  card: LocalAgentWorkCard,
  assistanceInput?: LocalAgentPlanAssistanceInput | null,
): LocalAgentWorkCard {
  if (!assistanceInput?.requested) {
    return {
      ...card,
      modelAssistance: defaultPlanAssistance(),
    };
  }

  const acceptedRiskNotes = sanitizeRiskNotes(assistanceInput.riskNotes ?? []);
  const candidateFileDecision = validateCandidateFiles(
    assistanceInput.candidateFiles ?? [],
    card.allowedFiles,
    card.forbiddenFiles,
  );
  const summary = sanitizeSummary(assistanceInput.taskSummary ?? null);
  const used = Boolean(summary) || acceptedRiskNotes.length > 0 || candidateFileDecision.accepted.length > 0;
  const status = used
    ? assistanceInput.status
    : assistanceInput.available
      ? 'Model assistance returned no safe suggestions; deterministic plan retained.'
      : assistanceInput.status;

  return {
    ...card,
    planSummary: summary ?? card.planSummary ?? null,
    risks: [...card.risks, ...acceptedRiskNotes],
    candidateFiles: candidateFileDecision.accepted,
    notes: used
      ? [...card.notes, 'Model suggestions were validated by the harness before inclusion.']
      : [...card.notes, 'Deterministic fallback remained active; no model suggestions were accepted.'],
    modelAssistance: {
      requested: true,
      used,
      source: used ? 'model-gateway' : 'deterministic',
      status,
      model: assistanceInput.model ?? null,
      endpoint: assistanceInput.endpoint ?? null,
      acceptedRiskNotes,
      acceptedCandidateFiles: candidateFileDecision.accepted,
      rejectedCandidateFiles: candidateFileDecision.rejected,
      strippedUnsafeContent: Boolean(assistanceInput.strippedUnsafeContent),
    },
  };
}

function defaultPlanAssistance(): LocalAgentPlanAssistance {
  return {
    requested: false,
    used: false,
    source: 'deterministic',
    status: 'Deterministic work-card factory only.',
    model: null,
    endpoint: null,
    acceptedRiskNotes: [],
    acceptedCandidateFiles: [],
    rejectedCandidateFiles: [],
    strippedUnsafeContent: false,
  };
}

function sanitizeSummary(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, 240) : null;
}

function sanitizeRiskNotes(values: string[]): string[] {
  const unique = new Set<string>();

  for (const value of values) {
    const trimmed = value.trim().replace(/\s+/g, ' ');
    if (!trimmed) {
      continue;
    }

    unique.add(trimmed.slice(0, 180));
    if (unique.size >= 4) {
      break;
    }
  }

  return [...unique];
}

function validateCandidateFiles(
  values: string[],
  allowedFiles: string[],
  forbiddenFiles: string[],
): { accepted: string[]; rejected: string[] } {
  const accepted = new Set<string>();
  const rejected = new Set<string>();

  for (const candidate of values) {
    const normalized = normalizeCandidateFile(candidate);
    if (!normalized) {
      rejected.add(candidate.trim());
      continue;
    }

    const forbidden = forbiddenFiles.some(pattern => matchesGlob(normalized, pattern));
    const allowed = allowedFiles.some(pattern => matchesGlob(normalized, pattern));
    if (allowed && !forbidden) {
      accepted.add(normalized);
    } else {
      rejected.add(normalized);
    }
  }

  return {
    accepted: [...accepted],
    rejected: [...rejected],
  };
}

function normalizeCandidateFile(value: string): string | null {
  const normalized = value.trim().replace(/\\/g, '/');
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('/') || /^[a-zA-Z]:\//.test(normalized)) {
    return null;
  }

  const segments = normalized.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    return null;
  }

  return normalized;
}