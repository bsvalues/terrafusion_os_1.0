'use client';

import axios from 'axios';
import { Clock, Play, Square } from 'lucide-react';
import React, { useState } from 'react';

interface Task {
  id: string;
  label: string;
  command: string;
  icon: string;
}

const DEFAULT_TASKS: Task[] = [
  { id: 'build', label: '⚙️ Build', command: 'cargo build' },
  { id: 'test', label: '✅ Test', command: 'cargo test' },
  { id: 'lint', label: '🔍 Lint', command: 'cargo clippy' },
  { id: 'format', label: '📝 Format', command: 'cargo fmt' },
  { id: 'deploy', label: '🚀 Deploy', command: './deploy.sh' },
  { id: 'dev', label: '🔧 Dev Server', command: 'npm run dev' },
];

interface TaskRunnerProps {
  onTaskOutput?: (output: string) => void;
}

export const TaskRunner: React.FC<TaskRunnerProps> = ({ onTaskOutput }) => {
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; output: string }>>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const handleRunTask = async (task: Task) => {
    setRunning(task.id);

    try {
      // Make real API call to Rust backend
      const response = await axios.post(`/api/tasks/run`, {
        task_id: task.id,
        module_id: 'default',
        command: task.command,
      });

      const result = {
        success: response.data.status === 'started' || response.data.status === 'success',
        output:
          response.data.output ||
          response.data.execution_id ||
          `Task ${task.label} started successfully`,
      };

      setResults(prev => ({ ...prev, [task.id]: result }));
      onTaskOutput?.(result.output);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to run task';
      setResults(prev => ({ ...prev, [task.id]: { success: false, output: errorMsg } }));
      onTaskOutput?.(errorMsg);
      console.error('Task execution error:', error);
    } finally {
      setRunning(null);
    }
  };

  const handleStopTask = async (taskId: string) => {
    try {
      // Stop task on backend if needed
      setRunning(null);
    } catch (error) {
      console.error('Failed to stop task', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800">
        <h3 className="text-sm font-semibold text-gray-300">⚡ Tasks</h3>
      </div>

      {/* Task Buttons */}
      <div className="p-3 space-y-2 overflow-auto">
        {DEFAULT_TASKS.map(task => {
          const isRunning = running === task.id;
          const result = results[task.id];

          return (
            <div key={task.id} className="space-y-1">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (isRunning) {
                      handleStopTask(task.id);
                    } else {
                      handleRunTask(task);
                    }
                  }}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    isRunning
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-100'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Square className="h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      {task.label}
                    </>
                  )}
                </button>

                {result && (
                  <button
                    onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    className="px-2 py-2 rounded text-sm hover:bg-gray-700"
                  >
                    {result.success ? '✅' : '❌'}
                  </button>
                )}
              </div>

              {/* Task Output */}
              {expandedTask === task.id && result && (
                <div className="p-2 bg-gray-800 rounded border border-gray-700 text-xs">
                  <div className="font-mono text-gray-300 max-h-32 overflow-auto">
                    {result.output
                      .split('\n')
                      .slice(0, 10)
                      .map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    {result.output.split('\n').length > 10 && (
                      <div className="text-gray-500">
                        ... ({result.output.split('\n').length - 10} more lines)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task History */}
      {Object.keys(results).length > 0 && (
        <div className="px-3 py-2 border-t border-gray-700 bg-gray-800 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {Object.values(results).filter(r => r.success).length} succeeded,{' '}
            {Object.values(results).filter(r => !r.success).length} failed
          </div>
        </div>
      )}
    </div>
  );
};
