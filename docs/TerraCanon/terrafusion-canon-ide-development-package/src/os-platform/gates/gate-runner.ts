import type { CommandPolicy } from '../agents/command-policy.js';
import { runApprovedCommand } from '../agents/tool-runner.js';
import type { GateContext, GateDefinition, GateResult } from './gate-types.js';

export async function runGate(
  gate: GateDefinition,
  policy: CommandPolicy,
  context: GateContext
): Promise<GateResult> {
  const startedAt = new Date().toISOString();
  const result = await runApprovedCommand(policy, gate.command, context.worktreePath ?? context.repoPath);
  const finishedAt = new Date().toISOString();

  return {
    gateId: gate.gateId,
    status: result.status === 'pass' ? 'pass' : result.status === 'approval-required' ? 'warning' : 'fail',
    command: gate.command,
    summary: result.reason ?? result.stderr.slice(0, 500) ?? result.stdout.slice(0, 500),
    startedAt,
    finishedAt
  };
}

export async function runRequiredGates(
  gates: GateDefinition[],
  requiredGateIds: string[],
  policy: CommandPolicy,
  context: GateContext
): Promise<GateResult[]> {
  const selected = gates.filter((gate) => requiredGateIds.includes(gate.gateId));
  const results: GateResult[] = [];
  for (const gate of selected) {
    results.push(await runGate(gate, policy, context));
  }
  return results;
}
