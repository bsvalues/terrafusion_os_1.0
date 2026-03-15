// TMR-016: Background scheduler checking cron expressions for ETL jobs
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.ETL
{
    /// <summary>
    /// Represents a scheduled ETL job entry with cron-like scheduling.
    /// </summary>
    public class ScheduledJob
    {
        /// <summary>The job key matching a registered job in EtlJobManager.</summary>
        public string JobKey { get; set; } = string.Empty;

        /// <summary>Cron expression (simplified: minute hour day-of-month month day-of-week).</summary>
        public string CronExpression { get; set; } = string.Empty;

        /// <summary>Whether this schedule is currently enabled.</summary>
        public bool Enabled { get; set; } = true;

        /// <summary>Last time this job was triggered by the scheduler.</summary>
        public DateTime? LastTriggeredAt { get; set; }

        /// <summary>Next calculated trigger time.</summary>
        public DateTime? NextTriggerAt { get; set; }
    }

    /// <summary>
    /// Background service that periodically evaluates cron expressions and triggers
    /// ETL jobs via the <see cref="EtlJobManager"/>. Uses a simplified cron format.
    /// </summary>
    public class EtlScheduler : BackgroundService
    {
        private readonly ILogger<EtlScheduler> _logger;
        private readonly EtlJobManager _jobManager;
        private readonly ConcurrentDictionary<string, ScheduledJob> _schedules = new();
        private readonly TimeSpan _checkInterval = TimeSpan.FromSeconds(30);

        /// <summary>
        /// Initializes the ETL scheduler.
        /// </summary>
        /// <param name="jobManager">Job manager for triggering jobs.</param>
        /// <param name="logger">Logger instance.</param>
        public EtlScheduler(EtlJobManager jobManager, ILogger<EtlScheduler> logger)
        {
            _jobManager = jobManager ?? throw new ArgumentNullException(nameof(jobManager));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Adds or updates a scheduled job.
        /// </summary>
        /// <param name="jobKey">Job key matching a registered job.</param>
        /// <param name="cronExpression">Simplified cron expression.</param>
        public void ScheduleJob(string jobKey, string cronExpression)
        {
            var scheduled = new ScheduledJob
            {
                JobKey = jobKey,
                CronExpression = cronExpression,
                NextTriggerAt = CalculateNextTrigger(cronExpression, DateTime.UtcNow)
            };

            _schedules[jobKey] = scheduled;
            _logger.LogInformation("Scheduled job '{JobKey}' with cron '{Cron}', next trigger: {Next}",
                jobKey, cronExpression, scheduled.NextTriggerAt);
        }

        /// <summary>
        /// Removes a job from the schedule.
        /// </summary>
        /// <param name="jobKey">Job key to unschedule.</param>
        public bool UnscheduleJob(string jobKey)
        {
            return _schedules.TryRemove(jobKey, out _);
        }

        /// <summary>
        /// Returns all scheduled jobs.
        /// </summary>
        public IReadOnlyList<ScheduledJob> GetScheduledJobs()
        {
            return _schedules.Values.ToList().AsReadOnly();
        }

        /// <inheritdoc/>
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ETL Scheduler started, checking every {Interval}s", _checkInterval.TotalSeconds);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckAndTriggerJobsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in scheduler loop");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("ETL Scheduler stopped");
        }

        private async Task CheckAndTriggerJobsAsync(CancellationToken cancellationToken)
        {
            var now = DateTime.UtcNow;

            foreach (var entry in _schedules)
            {
                var schedule = entry.Value;
                if (!schedule.Enabled || schedule.NextTriggerAt == null) continue;
                if (now < schedule.NextTriggerAt) continue;

                _logger.LogInformation("Triggering scheduled job: {JobKey}", schedule.JobKey);
                schedule.LastTriggeredAt = now;
                schedule.NextTriggerAt = CalculateNextTrigger(schedule.CronExpression, now);

                // Fire and forget - job manager handles execution tracking
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _jobManager.ExecuteJobAsync(schedule.JobKey);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Scheduled job '{JobKey}' failed", schedule.JobKey);
                    }
                }, cancellationToken);
            }
        }

        /// <summary>
        /// Calculates the next trigger time from a simplified cron expression.
        /// Format: "minute hour" (e.g., "0 6" = daily at 06:00 UTC, "*/30 *" = every 30 min).
        /// This is a simplified implementation; production would use a full cron parser.
        /// </summary>
        internal static DateTime? CalculateNextTrigger(string cronExpression, DateTime fromUtc)
        {
            var parts = cronExpression.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length < 2) return null;

            var minutePart = parts[0];
            var hourPart = parts[1];

            // Handle "*/N" interval syntax for minutes
            if (minutePart.StartsWith("*/") &&
                int.TryParse(minutePart[2..], out int intervalMinutes) &&
                intervalMinutes > 0)
            {
                var next = fromUtc.AddMinutes(intervalMinutes - (fromUtc.Minute % intervalMinutes));
                next = new DateTime(next.Year, next.Month, next.Day, next.Hour, next.Minute, 0, DateTimeKind.Utc);
                if (next <= fromUtc) next = next.AddMinutes(intervalMinutes);
                return next;
            }

            // Fixed minute and hour
            if (int.TryParse(minutePart, out int minute) &&
                int.TryParse(hourPart, out int hour))
            {
                var next = new DateTime(fromUtc.Year, fromUtc.Month, fromUtc.Day, hour, minute, 0, DateTimeKind.Utc);
                if (next <= fromUtc) next = next.AddDays(1);
                return next;
            }

            return fromUtc.AddHours(1);
        }
    }
}
