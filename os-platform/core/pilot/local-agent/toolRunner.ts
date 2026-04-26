import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';

import { runProcess } from './command.js';
import { appendLocalAgentEvent, terrafusionPath } from './eventLog.js';
import {
  type LocalAgentPermissionDecision,
  LocalAgentPermissionPolicy,
  type LocalAgentToolRequest,
} from './policy.js';

export interface LocalAgentToolResult {
  tool: string;
  ok: boolean;
  decision: string;
  message: string;
  data: Record<string, unknown>;
}

export class LocalAgentToolRunner {
  constructor(
    private readonly workspaceRoot: string,
    private readonly policy: LocalAgentPermissionPolicy,
  ) {}

  readFile(targetPath: string, maxBytes = 120_000): LocalAgentToolResult {
    return this.withDecision(
      {
        tool: 'read_file',
        action: 'read',
        target: targetPath,
        payload: { maxBytes },
      },
      decision => {
        const resolved = this.policy.resolveWorkspacePath(targetPath);
        const stats = statSync(resolved, { throwIfNoEntry: false });
        if (!stats) {
          return this.result('read_file', false, decision.decision, `File not found: ${targetPath}`, {});
        }

        if (!stats.isFile()) {
          return this.result('read_file', false, decision.decision, `Path is not a file: ${targetPath}`, {});
        }

        const content = readFileSync(resolved);
        const truncated = content.length > maxBytes;
        const slice = content.subarray(0, maxBytes);

        return this.result('read_file', true, decision.decision, 'file read', {
          path: targetPath,
          bytes: slice.length,
          truncated,
          content: slice.toString('utf8'),
        });
      },
    );
  }

  listFiles(targetPath = '.', maxEntries = 500, includeHidden = false): LocalAgentToolResult {
    return this.withDecision(
      {
        tool: 'list_files',
        action: 'read',
        target: targetPath,
        payload: { maxEntries, includeHidden },
      },
      decision => {
        const resolved = this.policy.resolveWorkspacePath(targetPath);
        const stats = statSync(resolved, { throwIfNoEntry: false });
        if (!stats) {
          return this.result('list_files', false, decision.decision, `Path not found: ${targetPath}`, {});
        }

        const entries: Array<Record<string, unknown>> = [];
        for (const child of readdirSync(resolved, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
          if (!includeHidden && child.name.startsWith('.')) {
            continue;
          }

          const full = resolve(resolved, child.name);
          entries.push({
            path: toRepoRelative(this.workspaceRoot, full),
            type: child.isDirectory() ? 'dir' : 'file',
            size: child.isFile() ? statSync(full).size : null,
          });

          if (entries.length >= maxEntries) {
            break;
          }
        }

        return this.result('list_files', true, decision.decision, 'files listed', {
          path: targetPath,
          entries,
          truncated: entries.length >= maxEntries,
        });
      },
    );
  }

  searchText(pattern: string, targetPath = '.', maxMatches = 100, fileGlob = '*'): LocalAgentToolResult {
    return this.withDecision(
      {
        tool: 'search_text',
        action: 'read',
        target: targetPath,
        payload: { pattern, maxMatches, fileGlob },
      },
      decision => {
        const resolved = this.policy.resolveWorkspacePath(targetPath);
        const stats = statSync(resolved, { throwIfNoEntry: false });
        if (!stats) {
          return this.result('search_text', false, decision.decision, `Path not found: ${targetPath}`, {});
        }

        let regex: RegExp;
        try {
          regex = new RegExp(pattern);
        } catch (error) {
          return this.result(
            'search_text',
            false,
            decision.decision,
            `Invalid regex: ${(error as Error).message}`,
            {},
          );
        }

        const matches: Array<Record<string, unknown>> = [];
        for (const filePath of walkFiles(resolved)) {
          if (!simpleGlob(filePath.split(sep).join('/').split('/').at(-1) ?? '', fileGlob)) {
            continue;
          }

          const relativePath = toRepoRelative(this.workspaceRoot, filePath);
          const fileDecision = this.policy.decide({
            tool: 'search_text',
            action: 'read',
            target: relativePath,
            payload: { pattern },
          });

          if (fileDecision.decision !== 'allow') {
            continue;
          }

          const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
          for (let lineNumber = 0; lineNumber < lines.length; lineNumber += 1) {
            const line = lines[lineNumber];
            if (!regex.test(line)) {
              continue;
            }

            matches.push({
              path: relativePath,
              line: lineNumber + 1,
              text: line.slice(0, 500),
            });

            if (matches.length >= maxMatches) {
              return this.result('search_text', true, decision.decision, 'matches found', {
                matches,
                truncated: true,
              });
            }
          }
        }

        return this.result('search_text', true, decision.decision, 'search complete', {
          matches,
          truncated: false,
        });
      },
    );
  }

  gitDiff(args: string[] = []): LocalAgentToolResult {
    const command = ['git', 'diff', ...args].join(' ').trim();
    return this.runGovernedCommand('git_diff', command, 30);
  }

  runCommand(command: string, timeoutSeconds = 120): LocalAgentToolResult {
    return this.runGovernedCommand('run_command', command, timeoutSeconds);
  }

  writeSaveState(summary: string, nextStep: string, activeFiles: string[] = [], risks: string[] = []): LocalAgentToolResult {
    const savePath = '.terrafusion/save-state.md';
    return this.withDecision(
      {
        tool: 'write_save_state',
        action: 'write',
        target: savePath,
        payload: { summary, nextStep, activeFiles, risks },
      },
      decision => {
        if (!['allow', 'ask'].includes(decision.decision)) {
          return this.blocked('write_save_state', decision, savePath);
        }

        const target = terrafusionPath(this.workspaceRoot, 'save-state.md');
        mkdirSync(resolve(target, '..'), { recursive: true });

        const active = activeFiles.length > 0 ? activeFiles.map(item => `- ${item}`).join('\n') : '- none recorded';
        const riskList = risks.length > 0 ? risks.map(item => `- ${item}`).join('\n') : '- none recorded';
        const content = [
          '# TerraFusion Agent Save State',
          '',
          '## Summary',
          '',
          summary,
          '',
          '## Active Files',
          '',
          active,
          '',
          '## Open Risks',
          '',
          riskList,
          '',
          '## Next Exact Step',
          '',
          nextStep,
          '',
        ].join('\n');

        writeFileSync(target, content, 'utf8');
        return this.result('write_save_state', true, decision.decision, 'save state written', { path: savePath });
      },
    );
  }

  private runGovernedCommand(tool: string, command: string, timeoutSeconds: number): LocalAgentToolResult {
    return this.withDecision(
      {
        tool,
        action: 'command',
        target: command,
        payload: { timeoutSeconds },
      },
      decision => {
        const executed = runProcess(this.workspaceRoot, command, timeoutSeconds);
        return this.result(tool, executed.exitCode === 0, decision.decision, executed.exitCode === 0 ? 'command complete' : 'command failed', {
          command,
          exitCode: executed.exitCode,
          output: executed.output,
        });
      },
    );
  }

  private withDecision(
    request: LocalAgentToolRequest,
    onAllow: (decision: LocalAgentPermissionDecision) => LocalAgentToolResult,
  ): LocalAgentToolResult {
    appendLocalAgentEvent(this.workspaceRoot, 'tool_requested', {
      tool: request.tool,
      target: request.target,
      action: request.action,
    });

    try {
      const decision = this.policy.decide(request);
      appendLocalAgentEvent(this.workspaceRoot, 'permission_decision', {
        tool: request.tool,
        target: request.target,
        action: request.action,
        decision: decision.decision,
        reason: decision.reason,
        matchedRule: decision.matchedRule ?? null,
      });

      if (decision.decision !== 'allow') {
        return this.blocked(request.tool, decision, request.target);
      }

      return onAllow(decision);
    } catch (error) {
      return this.result(request.tool, false, 'deny', (error as Error).message, {});
    }
  }

  private blocked(tool: string, decision: LocalAgentPermissionDecision, target: string): LocalAgentToolResult {
    return this.result(tool, false, decision.decision, `blocked: ${decision.reason}`, {
      target,
      matchedRule: decision.matchedRule ?? null,
    });
  }

  private result(
    tool: string,
    ok: boolean,
    decision: string,
    message: string,
    data: Record<string, unknown>,
  ): LocalAgentToolResult {
    appendLocalAgentEvent(this.workspaceRoot, 'tool_result', {
      tool,
      ok,
      decision,
      message,
      dataSummary: summarizeData(data),
    });

    return {
      tool,
      ok,
      decision,
      message,
      data,
    };
  }
}

function toRepoRelative(repoRoot: string, target: string): string {
  return relative(resolve(repoRoot), resolve(target)).split(sep).join('/');
}

function walkFiles(target: string): string[] {
  const stats = statSync(target);
  if (stats.isFile()) {
    return [target];
  }

  const results: string[] = [];
  for (const entry of readdirSync(target, { withFileTypes: true })) {
    if (['.git', 'node_modules', '.venv', 'bin', 'obj', 'dist'].includes(entry.name)) {
      continue;
    }

    const full = resolve(target, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full));
      continue;
    }

    if (entry.isFile()) {
      results.push(full);
    }
  }

  return results;
}

function simpleGlob(value: string, pattern: string): boolean {
  const escaped = pattern.replace(/[|\\{}()[\]^$+?.]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(value);
}

function summarizeData(data: Record<string, unknown>): Record<string, unknown> {
  const summary: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'content' || key === 'output') {
      summary[key] = `<${key} ${String(value).length} chars>`;
      continue;
    }

    if (key === 'matches' && Array.isArray(value)) {
      summary[key] = `<${value.length} matches>`;
      continue;
    }

    summary[key] = value;
  }

  return summary;
}