import { spawn } from 'node:child_process';
import type { CommandPolicy } from './command-policy.js';
import { evaluateCommand } from './command-policy.js';

export interface CommandRunResult {
  command: string;
  status: 'pass' | 'fail' | 'blocked' | 'approval-required';
  exitCode?: number | null;
  stdout: string;
  stderr: string;
  reason?: string;
}

export async function runApprovedCommand(policy: CommandPolicy, command: string, cwd: string): Promise<CommandRunResult> {
  const decision = evaluateCommand(policy, command);

  if (decision.status === 'block') {
    return { command, status: 'blocked', stdout: '', stderr: '', reason: decision.rule.reason };
  }

  if (decision.status === 'require-approval') {
    return { command, status: 'approval-required', stdout: '', stderr: '', reason: decision.rule.reason };
  }

  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: process.env
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => { stdout += String(chunk); });
    child.stderr.on('data', (chunk) => { stderr += String(chunk); });

    child.on('close', (exitCode) => {
      resolve({
        command,
        status: exitCode === 0 ? 'pass' : 'fail',
        exitCode,
        stdout,
        stderr
      });
    });
  });
}
