import { runApprovedCommand } from '../agents/tool-runner.js';
import type { CommandPolicy } from '../agents/command-policy.js';

export interface RawDiffResult {
  status: 'pass' | 'fail' | 'blocked' | 'approval-required';
  patch: string;
}

export async function getRawDiff(policy: CommandPolicy, cwd: string): Promise<RawDiffResult> {
  const result = await runApprovedCommand(policy, 'git diff -- .', cwd);
  return {
    status: result.status,
    patch: result.stdout || result.stderr
  };
}
