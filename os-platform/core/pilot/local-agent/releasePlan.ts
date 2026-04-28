import { existsSync } from 'node:fs';

import { terrafusionPath } from './eventLog.js';

export interface LocalAgentReleaseStep {
  name: string;
  artifact: string;
  present: boolean;
  command: string;
  description: string;
}

export interface LocalAgentReleasePlanReport {
  steps: LocalAgentReleaseStep[];
  nextStep: LocalAgentReleaseStep | null;
  allComplete: boolean;
}

const RELEASE_STEPS: ReadonlyArray<Omit<LocalAgentReleaseStep, 'present'>> = [
  {
    name: 'release-notes',
    artifact: 'release-notes-0.1.0.json',
    command: 'pnpm run tf:local-agent -- release-notes',
    description: 'Generate release notes for the current version.',
  },
  {
    name: 'release-check',
    artifact: 'release-check-report.json',
    command: 'pnpm run tf:local-agent -- release-check',
    description: 'Run release readiness checks.',
  },
  {
    name: 'release-freeze',
    artifact: 'release-freeze-card.json',
    command: 'pnpm run tf:local-agent -- release-freeze',
    description: 'Build the release freeze card.',
  },
  {
    name: 'tag-gate',
    artifact: 'tag-gate-report.json',
    command: 'pnpm run tf:local-agent -- tag-gate <version>',
    description: 'Verify all release artifacts before tag.',
  },
  {
    name: 'release-approval',
    artifact: 'release-approval.json',
    command: 'pnpm run tf:local-agent -- release-approve <version> --name <approver>',
    description: 'Record founder release approval.',
  },
  {
    name: 'tag-command',
    artifact: 'tag-command-report.json',
    command: 'pnpm run tf:local-agent -- tag-command <version>',
    description: 'Print the manual tag command (no auto-tag).',
  },
  {
    name: 'release-runbook',
    artifact: 'release-runbook-0.1.0.json',
    command: 'pnpm run tf:local-agent -- release-runbook',
    description: 'Build the release runbook.',
  },
];

export class LocalAgentReleasePlan {
  constructor(private readonly repoRoot: string) {}

  inspect(): LocalAgentReleasePlanReport {
    const steps: LocalAgentReleaseStep[] = RELEASE_STEPS.map(step => ({
      ...step,
      present: existsSync(terrafusionPath(this.repoRoot, step.artifact)),
    }));
    const nextStep = steps.find(s => !s.present) ?? null;
    return {
      steps,
      nextStep,
      allComplete: nextStep === null,
    };
  }
}

export function renderLocalAgentReleasePlan(report: LocalAgentReleasePlanReport): string {
  const lines: string[] = [];
  lines.push('TerraFusion Local Agent — release plan');
  lines.push('');
  lines.push('Sequence:');
  for (const step of report.steps) {
    const mark = step.present ? '[x]' : '[ ]';
    lines.push(`  ${mark} ${step.name}  (${step.artifact})`);
  }
  lines.push('');
  if (report.allComplete) {
    lines.push('Release sequence complete.');
    lines.push('All 7 release artifacts are present. Tag is a manual founder action.');
  } else if (report.nextStep) {
    lines.push('Next:');
    lines.push(`  ${report.nextStep.command}`);
    lines.push(`  ${report.nextStep.description}`);
  }
  return lines.join('\n');
}
