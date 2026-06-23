export interface CommandRule {
  pattern: string;
  reason?: string;
  scope?: string;
}

export interface CommandPolicy {
  version: string;
  allowed: CommandRule[];
  requiresApproval: CommandRule[];
  blocked: CommandRule[];
  defaults: {
    timeoutSeconds: number;
    captureStdout: boolean;
    captureStderr: boolean;
    redactOutput: boolean;
  };
}

function patternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function matches(command: string, rules: CommandRule[]): CommandRule | undefined {
  return rules.find((rule) => patternToRegExp(rule.pattern).test(command));
}

export type CommandDecision =
  | { status: 'allow'; rule: CommandRule }
  | { status: 'require-approval'; rule: CommandRule }
  | { status: 'block'; rule: CommandRule };

export function evaluateCommand(policy: CommandPolicy, command: string): CommandDecision {
  const blocked = matches(command, policy.blocked);
  if (blocked) return { status: 'block', rule: blocked };

  const approval = matches(command, policy.requiresApproval);
  if (approval) return { status: 'require-approval', rule: approval };

  const allowed = matches(command, policy.allowed);
  if (allowed) return { status: 'allow', rule: allowed };

  return { status: 'require-approval', rule: { pattern: '<implicit>', reason: 'Command not explicitly allowlisted.' } };
}
