import { runApprovedCommand } from '../agents/tool-runner.js';
import type { CommandPolicy } from '../agents/command-policy.js';

export async function commitApprovedChanges(policy: CommandPolicy, cwd: string, message: string) {
  const safeMessage = message.replace(/"/g, '\"');
  const add = await runApprovedCommand(policy, 'git add .', cwd);
  if (add.status !== 'pass') return add;
  return runApprovedCommand(policy, `git commit -m "${safeMessage}"`, cwd);
}
