export type HookEvent =
  | 'BeforeTaskCreate'
  | 'AfterCanonLoad'
  | 'BeforeFileRead'
  | 'BeforeFileEdit'
  | 'BeforeCommandRun'
  | 'AfterDiffCreated'
  | 'BeforeGateRun'
  | 'AfterGateRun'
  | 'BeforeCommit'
  | 'BeforePRCreate'
  | 'AfterTraceSeal';

export interface HookContext {
  taskId: string;
  event: HookEvent;
  actor?: string;
  filePath?: string;
  command?: string;
  metadata?: Record<string, unknown>;
}

export interface HookDecision {
  event: HookEvent;
  status: 'allow' | 'block' | 'require-approval' | 'warn';
  reason?: string;
}

export type HookHandler = (context: HookContext) => Promise<HookDecision> | HookDecision;

export class HookRegistry {
  private handlers = new Map<HookEvent, HookHandler[]>();

  register(event: HookEvent, handler: HookHandler): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  async run(event: HookEvent, context: Omit<HookContext, 'event'>): Promise<HookDecision[]> {
    const handlers = this.handlers.get(event) ?? [];
    const decisions = [];
    for (const handler of handlers) {
      decisions.push(await handler({ ...context, event }));
    }
    return decisions;
  }

  static failClosed(decisions: HookDecision[]): void {
    const block = decisions.find((decision) => decision.status === 'block');
    if (block) throw new Error(block.reason ?? 'Blocked by Canon hook.');
  }
}
