import { spawnSync } from 'node:child_process';

export interface LocalAgentProcessResult {
  exitCode: number;
  output: string;
}

export function splitCommand(command: string): string[] {
  const matches = command.match(/"([^"]*)"|'([^']*)'|[^\s]+/g) ?? [];
  const parts = matches.map(part => part.replace(/^['"]|['"]$/g, ''));

  if (parts.length === 0) {
    throw new Error('Command cannot be empty.');
  }

  return parts;
}

export function runProcess(
  repoRoot: string,
  command: string,
  timeoutSeconds: number,
): LocalAgentProcessResult {
  const argv = splitCommand(command);
  const [program, ...args] = argv;

  try {
    const completed = spawnSync(program, args, {
      cwd: repoRoot,
      encoding: 'utf8',
      shell: false,
      timeout: timeoutSeconds * 1000,
      windowsHide: true,
    });

    if (completed.error) {
      if ((completed.error as NodeJS.ErrnoException).code === 'ENOENT') {
        return {
          exitCode: 127,
          output: `Command not found: ${program}`,
        };
      }

      throw completed.error;
    }

    const output = `${completed.stdout ?? ''}${completed.stderr ?? ''}`;
    return {
      exitCode: completed.status ?? 1,
      output: output.slice(-50_000),
    };
  } catch (error) {
    if (
      error instanceof Error &&
      (/timed out/i.test(error.message) || (error as NodeJS.ErrnoException).code === 'ETIMEDOUT')
    ) {
      return {
        exitCode: 124,
        output: `Command timed out after ${timeoutSeconds}s`,
      };
    }

    throw error;
  }
}