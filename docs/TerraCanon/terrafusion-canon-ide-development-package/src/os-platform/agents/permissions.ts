export type AgentPermission =
  | 'read'
  | 'search'
  | 'summarize'
  | 'canon:query'
  | 'risk:estimate'
  | 'edit:approved'
  | 'edit:forbidden'
  | 'command:approved'
  | 'command:write'
  | 'diff'
  | 'comment'
  | 'canon:risk'
  | 'canon:block'
  | 'approval:require'
  | 'trace:seal'
  | 'git:status'
  | 'git:diff'
  | 'git:stage'
  | 'git:commit'
  | 'git:pr-draft'
  | 'git:push-unapproved';

export interface AgentProfile {
  agentId: string;
  role: string;
  permissions: AgentPermission[];
  blockedPermissions?: AgentPermission[];
}

export function hasPermission(agent: AgentProfile, permission: AgentPermission): boolean {
  return agent.permissions.includes(permission) && !(agent.blockedPermissions ?? []).includes(permission);
}

export function requirePermission(agent: AgentProfile, permission: AgentPermission): void {
  if (!hasPermission(agent, permission)) {
    throw new Error(`Agent ${agent.agentId} lacks permission ${permission}`);
  }
}
