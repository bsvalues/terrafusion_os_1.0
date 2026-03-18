// TMR-114: Scheduled Task Manager - Periodic monitoring, health, and report tasks
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Tasks
{
    /// <summary>
    /// Represents a scheduled task with interval and action.
    /// </summary>
    public class ScheduledTask
    {
        public string Name { get; set; } = string.Empty;
        public TimeSpan Interval { get; set; } = TimeSpan.FromMinutes(5);
        public Func<CancellationToken, Task> Action { get; set; } = _ => Task.CompletedTask;
        public DateTime LastRun { get; set; } = DateTime.MinValue;
        public bool IsEnabled { get; set; } = true;
    }

    /// <summary>
    /// Manages and executes scheduled tasks for monitoring, health checks, and reporting.
    /// </summary>
    public class ScheduledTaskManager : BackgroundService
    {
        private readonly ILogger<ScheduledTaskManager> _logger;
        private readonly List<ScheduledTask> _tasks = new();

        public ScheduledTaskManager(ILogger<ScheduledTaskManager> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Registers a new scheduled task.
        /// </summary>
        public void RegisterTask(ScheduledTask task)
        {
            _tasks.Add(task);
            _logger.LogInformation("Scheduled task registered: {Name} (interval={Interval})", task.Name, task.Interval);
        }

        /// <summary>
        /// Returns all registered tasks.
        /// </summary>
        public IReadOnlyList<ScheduledTask> GetTasks() => _tasks.AsReadOnly();

        /// <summary>
        /// Main loop that checks and runs due tasks every second.
        /// </summary>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ScheduledTaskManager started with {Count} tasks", _tasks.Count);

            while (!stoppingToken.IsCancellationRequested)
            {
                foreach (var task in _tasks)
                {
                    if (!task.IsEnabled) continue;
                    if (DateTime.UtcNow - task.LastRun < task.Interval) continue;

                    try
                    {
                        _logger.LogDebug("Running scheduled task: {Name}", task.Name);
                        await task.Action(stoppingToken);
                        task.LastRun = DateTime.UtcNow;
                    }
                    catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                    {
                        return;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Scheduled task {Name} failed", task.Name);
                    }
                }

                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
            }

            _logger.LogInformation("ScheduledTaskManager stopped");
        }
    }
}
