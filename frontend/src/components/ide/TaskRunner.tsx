import { CheckCircle, Clock, List, Play, Square, XCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Task {
  id: string;
  name: string;
  command: string;
  status: 'idle' | 'running' | 'success' | 'failed';
  output: string[];
  startTime?: Date;
  endTime?: Date;
}

interface TaskRunnerProps {
  apiUrl?: string;
}

export const TaskRunner: React.FC<TaskRunnerProps> = ({ apiUrl = '/api/tasks' }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [availableTasks, setAvailableTasks] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableTasks();
  }, []);

  const fetchAvailableTasks = async () => {
    try {
      const response = await fetch(`${apiUrl}/list`);
      const data = await response.json();
      setAvailableTasks(data.tasks || ['Build', 'Test', 'Deploy', 'Lint', 'Format', 'Clean']);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  };

  const runTask = async (taskName: string) => {
    const taskId = `${taskName}-${Date.now()}`;
    const newTask: Task = {
      id: taskId,
      name: taskName,
      command: getTaskCommand(taskName),
      status: 'running',
      output: [`Starting task: ${taskName}...`],
      startTime: new Date(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setSelectedTask(taskId);

    try {
      const response = await fetch(`${apiUrl}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: taskName }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;

        if (value) {
          const chunk = decoder.decode(value);
          updateTaskOutput(taskId, chunk);
        }
      }

      // Task completed successfully
      updateTaskStatus(taskId, 'success');
    } catch (error) {
      updateTaskStatus(taskId, 'failed');
      updateTaskOutput(taskId, `Error: ${error}`);
    }
  };

  const getTaskCommand = (taskName: string): string => {
    const commands: Record<string, string> = {
      Build: 'npm run build',
      Test: 'npm test',
      Deploy: 'npm run deploy',
      Lint: 'npm run lint',
      Format: 'npm run format',
      Clean: 'npm run clean',
    };
    return commands[taskName] || taskName;
  };

  const updateTaskOutput = (taskId: string, output: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, output: [...task.output, output] } : task
      )
    );
  };

  const updateTaskStatus = (taskId: string, status: Task['status']) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === taskId ? { ...task, status, endTime: new Date() } : task))
    );
  };

  const stopTask = async (taskId: string) => {
    try {
      await fetch(`${apiUrl}/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
      updateTaskStatus(taskId, 'failed');
      updateTaskOutput(taskId, 'Task stopped by user');
    } catch (error) {
      console.error('Failed to stop task:', error);
    }
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'running':
        return <Clock size={16} className='text-yellow-500 animate-spin' />;
      case 'success':
        return <CheckCircle size={16} className='text-green-500' />;
      case 'failed':
        return <XCircle size={16} className='text-red-500' />;
      default:
        return <List size={16} className='text-terra-cyan' />;
    }
  };

  const formatDuration = (start?: Date, end?: Date): string => {
    if (!start) return '-';
    const endTime = end || new Date();
    const duration = Math.floor((endTime.getTime() - start.getTime()) / 1000);
    return `${duration}s`;
  };

  const selectedTaskData = tasks.find((t) => t.id === selectedTask);

  return (
    <div className='h-full flex bg-terra-midnight'>
      {/* Task List Panel */}
      <div className='w-64 border-r border-terra-cyan/20 flex flex-col'>
        <div className='p-3 border-b border-terra-cyan/20'>
          <h3 className='text-sm font-semibold text-terra-cyan'>TASK RUNNER</h3>
        </div>

        {/* Available Tasks */}
        <div className='p-2'>
          <p className='text-xs text-terra-cyan/50 mb-2 px-2'>Available Tasks</p>
          <div className='space-y-1'>
            {availableTasks.map((task) => (
              <button
                key={task}
                onClick={() => runTask(task)}
                className='w-full flex items-center space-x-2 px-2 py-1 hover:bg-terra-cyan/20 rounded text-left text-sm text-white'
              >
                <Play size={14} className='text-terra-cyan' />
                <span>{task}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Tasks */}
        <div className='flex-1 overflow-y-auto p-2 border-t border-terra-cyan/20'>
          <p className='text-xs text-terra-cyan/50 mb-2 px-2'>Recent Tasks</p>
          <div className='space-y-1'>
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task.id)}
                className={`w-full flex items-center justify-between px-2 py-1 rounded text-left text-sm ${
                  selectedTask === task.id
                    ? 'bg-terra-cyan/20 border-l-2 border-terra-cyan'
                    : 'hover:bg-terra-cyan/10'
                }`}
              >
                <div className='flex items-center space-x-2 flex-1 min-w-0'>
                  {getStatusIcon(task.status)}
                  <span className='text-white truncate'>{task.name}</span>
                </div>
                <span className='text-xs text-terra-cyan/50'>
                  {formatDuration(task.startTime, task.endTime)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task Output Panel */}
      <div className='flex-1 flex flex-col'>
        {selectedTaskData ? (
          <>
            <div className='flex items-center justify-between px-4 py-2 border-b border-terra-cyan/20'>
              <div className='flex items-center space-x-2'>
                {getStatusIcon(selectedTaskData.status)}
                <span className='text-sm text-white font-semibold'>{selectedTaskData.name}</span>
                <span className='text-xs text-terra-cyan/50'>{selectedTaskData.command}</span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className='text-xs text-terra-cyan/50'>
                  {formatDuration(selectedTaskData.startTime, selectedTaskData.endTime)}
                </span>
                {selectedTaskData.status === 'running' && (
                  <button
                    onClick={() => stopTask(selectedTaskData.id)}
                    className='p-1 hover:bg-terra-cyan/20 rounded text-red-500'
                    title='Stop task'
                  >
                    <Square size={16} />
                  </button>
                )}
              </div>
            </div>

            <div className='flex-1 overflow-y-auto p-4 font-mono text-sm'>
              {selectedTaskData.output.map((line, index) => (
                <div key={index} className='text-white mb-1'>
                  {line}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className='flex items-center justify-center h-full text-terra-cyan/50'>
            <div className='text-center'>
              <List size={48} className='mx-auto mb-4' />
              <p className='text-sm'>Select a task to view output</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskRunner;
