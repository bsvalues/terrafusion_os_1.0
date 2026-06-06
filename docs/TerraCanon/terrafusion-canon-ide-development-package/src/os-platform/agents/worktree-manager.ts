import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { runApprovedCommand } from './tool-runner.js';
import type { CommandPolicy } from './command-policy.js';

export interface WorktreeBinding {
  taskId: string;
  branchName: string;
  worktreePath: string;
}

export function taskBranchName(taskId: string): string {
  return `canon/${taskId.replace(/[^a-zA-Z0-9._-]/g, '-')}`;
}

export async function createTaskWorktree(
  policy: CommandPolicy,
  repoPath: string,
  taskId: string,
  worktreesRoot = '.canon-worktrees'
): Promise<WorktreeBinding> {
  const branchName = taskBranchName(taskId);
  const worktreePath = join(repoPath, worktreesRoot, branchName);
  await mkdir(join(repoPath, worktreesRoot), { recursive: true });

  const result = await runApprovedCommand(
    policy,
    `git worktree add ${worktreePath} -b ${branchName}`,
    repoPath
  );

  if (result.status !== 'pass') {
    throw new Error(`Failed to create worktree: ${result.status} ${result.stderr || result.reason || ''}`);
  }

  return { taskId, branchName, worktreePath };
}
