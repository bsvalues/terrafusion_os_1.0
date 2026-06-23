import type { CanonTask } from '../canon/types.js';
import { assertTransition, type TaskState } from './task-state-machine.js';

export interface TaskEvent {
  taskId: string;
  from: TaskState;
  to: TaskState;
  at: string;
  reason?: string;
}

export class CanonTaskRunner {
  public events: TaskEvent[] = [];

  transition(task: CanonTask, to: TaskState, reason?: string): CanonTask {
    const from = task.state as TaskState;
    assertTransition(from, to);
    this.events.push({ taskId: task.taskId, from, to, at: new Date().toISOString(), reason });
    return { ...task, state: to };
  }
}
