using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SimpleWorkflow.Models;

namespace SimpleWorkflow.Engine
{
    public class WorkflowEngine
    {
        private readonly ILogger<WorkflowEngine> _logger;
        private readonly Dictionary<Guid, WorkflowTask> _activeTasks = new();

        public WorkflowEngine(ILogger<WorkflowEngine> logger)
        {
            _logger = logger;
        }

        public async Task<WorkflowTask> StartNewWorkflowAsync(string name, string description)
        {
            var task = new WorkflowTask
            {
                Name = name,
                Description = description,
                Status = TaskStatus.Created
            };

            _activeTasks[task.Id] = task;
            return task;
        }

        public async Task<bool> ExecuteTaskAsync(Guid taskId)
        {
            if (!_activeTasks.TryGetValue(taskId, out var task))
            {
                throw new KeyNotFoundException($"Task {taskId} not found");
            }

            task.Status = TaskStatus.InProgress;
            var context = new WorkflowContext
            {
                CurrentTask = task,
                Logger = _logger
            };

            try
            {
                foreach (var activity in task.Activities)
                {
                    activity.Status = ActivityStatus.Running;
                    
                    if (!await activity.ValidateAsync(context))
                    {
                        activity.Status = ActivityStatus.Failed;
                        task.Status = TaskStatus.Failed;
                        return false;
                    }

                    if (!await activity.ExecuteAsync(context))
                    {
                        activity.Status = ActivityStatus.Failed;
                        task.Status = TaskStatus.Failed;
                        return false;
                    }

                    activity.Status = ActivityStatus.Completed;
                }

                task.Status = TaskStatus.Completed;
                task.CompletedDate = DateTime.UtcNow;
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Workflow execution failed for task {taskId}");
                task.Status = TaskStatus.Failed;
                return false;
            }
        }
    }
}
