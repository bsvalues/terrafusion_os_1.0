import React, { useEffect, useState } from 'react';
import { Panel } from './shared';
import { getCurrentUseWorkflowTasksMock } from '../workflow/currentUseWorkflowApi';
import type { CurrentUseWorkflowTask } from '../workflow/currentUseWorkflowTypes';

export function CurrentUseWorkflowPanel({ parcelId }: { parcelId: string }) {
  const [tasks, setTasks] = useState<CurrentUseWorkflowTask[]>([]);

  useEffect(() => {
    getCurrentUseWorkflowTasksMock(parcelId).then(setTasks);
  }, [parcelId]);

  return (
    <Panel title="Dais Workflow Handoff">
      <div className="space-y-3">
        <p className="text-sm text-slate-600">
          Dais owns workflow state and staff tasks. Forge facts are referenced, not mutated.
        </p>

        {tasks.map((task) => (
          <div key={task.id} className="rounded-xl border p-4">
            <div className="flex justify-between gap-3">
              <div>
                <div className="font-semibold">{task.title}</div>
                <div className="text-sm text-slate-600">
                  {task.workflowType.replaceAll('_', ' ')} · {task.status.replaceAll('_', ' ')}
                </div>
              </div>

              <div className="text-right text-sm">
                <div>{task.priority}</div>
                {task.dueDate && <div className="text-slate-500">Due {task.dueDate}</div>}
              </div>
            </div>

            <p className="mt-2 text-sm text-slate-700">{task.summary}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
