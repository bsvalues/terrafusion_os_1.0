import { resolve, relative, sep } from 'node:path';

export const LOCAL_AGENT_DECISIONS = ['allow', 'ask', 'deny'] as const;

export type LocalAgentDecision = (typeof LOCAL_AGENT_DECISIONS)[number];

export interface LocalAgentPermissionDecision {
  decision: LocalAgentDecision;
  reason: string;
  matchedRule?: string;
}

export interface LocalAgentToolRequest {
  tool: string;
  action: 'read' | 'write' | 'command' | 'network';
  target: string;
  payload: Record<string, unknown>;
}

export interface LocalAgentPolicyDocument {
  defaults?: Partial<Record<'read' | 'write' | 'command', LocalAgentDecision>>;
  read?: Partial<Record<LocalAgentDecision, string[]>>;
  write?: Partial<Record<LocalAgentDecision, string[]>>;
  commands?: Partial<Record<LocalAgentDecision, string[]>>;
  network?: {
    default?: LocalAgentDecision;
    allow?: string[];
    ask?: string[];
  };
}

export class LocalAgentPermissionPolicy {
  constructor(
    private readonly policy: LocalAgentPolicyDocument,
    private readonly workspaceRoot: string,
  ) {}

  decide(request: LocalAgentToolRequest): LocalAgentPermissionDecision {
    if (request.action === 'read') {
      return this.decidePath('read', request.target);
    }

    if (request.action === 'write') {
      return this.decidePath('write', request.target);
    }

    if (request.action === 'command') {
      return this.decideCommand(request.target);
    }

    if (request.action === 'network') {
      return this.decideNetwork(request.target);
    }

    return {
      decision: 'deny',
      reason: `Unknown permission action: ${request.action}`,
    };
  }

  resolveWorkspacePath(rawPath: string): string {
    const resolved = normalizeAbsolutePath(rawPath, this.workspaceRoot);

    if (isPathOutsideWorkspace(resolved, this.workspaceRoot)) {
      throw new Error(`Path escapes workspace: ${rawPath}`);
    }

    return resolved;
  }

  private decidePath(section: 'read' | 'write', rawPath: string): LocalAgentPermissionDecision {
    const normalizedPath = this.resolveWorkspacePath(rawPath);
    const rules = this.policy[section] ?? {};

    for (const decision of ['deny', 'ask', 'allow'] as const) {
      for (const pattern of rules[decision] ?? []) {
        if (matchesWorkspacePath(normalizedPath, this.workspaceRoot, pattern)) {
          return {
            decision,
            reason: `${section} ${decision} matched ${pattern}`,
            matchedRule: pattern,
          };
        }
      }
    }

    const fallback = this.policy.defaults?.[section] ?? 'deny';
    return {
      decision: fallback,
      reason: `${section} defaulted to ${fallback}`,
    };
  }

  private decideCommand(command: string): LocalAgentPermissionDecision {
    const normalized = normalizeCommand(command);
    const rules = this.policy.commands ?? {};

    for (const decision of ['deny', 'ask', 'allow'] as const) {
      for (const pattern of rules[decision] ?? []) {
        if (matchesGlob(normalized, pattern)) {
          return {
            decision,
            reason: `command ${decision} matched ${pattern}`,
            matchedRule: pattern,
          };
        }
      }
    }

    const fallback = this.policy.defaults?.command ?? 'ask';
    return {
      decision: fallback,
      reason: `command defaulted to ${fallback}`,
    };
  }

  private decideNetwork(target: string): LocalAgentPermissionDecision {
    const networkPolicy = this.policy.network ?? {};
    const fallback = networkPolicy.default ?? 'deny';

    if (fallback === 'deny' && (networkPolicy.allow?.length ?? 0) === 0 && (networkPolicy.ask?.length ?? 0) === 0) {
      return {
        decision: 'deny',
        reason: 'network default deny',
      };
    }

    for (const pattern of networkPolicy.allow ?? []) {
      if (matchesGlob(target, pattern)) {
        return {
          decision: 'allow',
          reason: `network allow matched ${pattern}`,
          matchedRule: pattern,
        };
      }
    }

    for (const pattern of networkPolicy.ask ?? []) {
      if (matchesGlob(target, pattern)) {
        return {
          decision: 'ask',
          reason: `network ask matched ${pattern}`,
          matchedRule: pattern,
        };
      }
    }

    return {
      decision: fallback,
      reason: `network defaulted to ${fallback}`,
    };
  }
}

export function loadFounderLocalAgentPolicy(): LocalAgentPolicyDocument {
  return {
    defaults: {
      read: 'allow',
      write: 'ask',
      command: 'ask',
    },
    read: {
      deny: ['.env', '.env.*', 'secrets/**', '**/private-keys/**'],
      allow: ['**'],
    },
    write: {
      deny: ['.env', '.env.*', 'secrets/**', 'docs/superpowers/**'],
      ask: ['**'],
    },
    commands: {
      allow: [
        'git status',
        'git diff',
        'git diff --check',
        'rg *',
        'pnpm run type-check',
        'pnpm run test:local-agent',
        'node --test os-platform/core/tests/local-agent*',
      ],
      ask: [
        'pnpm test *',
        'node --test *',
        'pnpm install *',
        'npm install *',
      ],
      deny: ['git push *', 'rm -rf *', 'curl *', 'wget *', 'ssh *'],
    },
    network: {
      default: 'deny',
    },
  };
}

function normalizeAbsolutePath(rawPath: string, workspaceRoot: string): string {
  return resolve(isAbsoluteLike(rawPath) ? rawPath : resolve(workspaceRoot, rawPath));
}

function isPathOutsideWorkspace(candidate: string, workspaceRoot: string): boolean {
  const workspace = resolve(workspaceRoot);
  const diff = relative(workspace, candidate);
  return diff === '' ? false : diff === '..' || diff.startsWith(`..${sep}`) || diff.startsWith('../') || diff.includes(`..${sep}`);
}

function matchesWorkspacePath(absolutePath: string, workspaceRoot: string, pattern: string): boolean {
  const relativePath = relative(resolve(workspaceRoot), absolutePath).split(sep).join('/');
  const normalizedPattern = pattern.replace(/^\.\//, '');
  return matchesGlob(relativePath, normalizedPattern);
}

function normalizeCommand(command: string): string {
  return command.trim().replace(/\s+/g, ' ');
}

function isAbsoluteLike(value: string): boolean {
  return /^[a-zA-Z]:\\/.test(value) || value.startsWith('\\\\') || value.startsWith('/');
}

export function matchesGlob(value: string, pattern: string): boolean {
  let regex = '^';

  for (let index = 0; index < pattern.length; index += 1) {
    const current = pattern[index];
    const next = pattern[index + 1];

    if (current === '*' && next === '*') {
      regex += '.*';
      index += 1;
      continue;
    }

    if (current === '*') {
      regex += '[^/]*';
      continue;
    }

    regex += /[|\\{}()[\]^$+?.]/.test(current) ? `\\${current}` : current;
  }

  regex += '$';
  return new RegExp(regex).test(value);
}