// BIV-021 — Schedules periodic data refreshes
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync
{
    /// <summary>
    /// Status of a scheduled refresh job.
    /// </summary>
    public enum RefreshJobStatus
    {
        Scheduled,
        Running,
        Completed,
        Failed,
        Cancelled,
        Paused
    }

    /// <summary>
    /// Defines a periodic data refresh job.
    /// </summary>
    public sealed class RefreshJob
    {
        public string JobId { get; init; } = Guid.NewGuid().ToString("N");
        public string Name { get; init; } = string.Empty;
        public string ConnectorName { get; init; } = string.Empty;

        /// <summary>Cron-like schedule expression (simplified: interval-based).</summary>
        public string Schedule { get; init; } = string.Empty;

        /// <summary>Data category: "market", "property", "gis", "sales", etc.</summary>
        public string DataCategory { get; init; } = string.Empty;

        public RefreshJobStatus Status { get; set; } = RefreshJobStatus.Scheduled;
        public DateTime? LastRunUtc { get; set; }
        public DateTime? NextRunUtc { get; set; }
        public TimeSpan? LastDuration { get; set; }
        public int ConsecutiveFailures { get; set; }
        public string? LastError { get; set; }
        public bool Enabled { get; set; } = true;
    }

    /// <summary>
    /// Interface for scheduling and managing periodic data refresh jobs.
    /// </summary>
    public interface IDataRefreshScheduler
    {
        /// <summary>Registers a new refresh job.</summary>
        string ScheduleJob(RefreshJob job);

        /// <summary>Removes a scheduled job.</summary>
        bool CancelJob(string jobId);

        /// <summary>Pauses a job without removing it.</summary>
        bool PauseJob(string jobId);

        /// <summary>Resumes a paused job.</summary>
        bool ResumeJob(string jobId);

        /// <summary>Returns all registered jobs.</summary>
        IReadOnlyList<RefreshJob> ListJobs();

        /// <summary>Returns jobs due for execution.</summary>
        IReadOnlyList<RefreshJob> GetDueJobs(DateTime asOfUtc);

        /// <summary>Marks a job as started.</summary>
        void MarkRunning(string jobId);

        /// <summary>Marks a job as completed and calculates next run.</summary>
        void MarkCompleted(string jobId, TimeSpan duration);

        /// <summary>Marks a job as failed.</summary>
        void MarkFailed(string jobId, string error);
    }

    /// <summary>
    /// Manages refresh job scheduling with cron-like intervals.
    /// Tracks job lifecycle (scheduled, running, completed, failed, paused)
    /// for market data, property data, GIS layers, and other data categories.
    /// </summary>
    public class DataRefreshScheduler : IDataRefreshScheduler
    {
        private readonly ConcurrentDictionary<string, RefreshJob> _jobs = new();

        /// <summary>
        /// Well-known schedule constants.
        /// </summary>
        public static class Schedules
        {
            public const string Hourly = "0 * * * *";
            public const string Daily = "0 0 * * *";
            public const string Weekly = "0 0 * * 0";
            public const string Monthly = "0 0 1 * *";
        }

        /// <inheritdoc />
        public string ScheduleJob(RefreshJob job)
        {
            job.NextRunUtc ??= CalculateNextRun(job.Schedule, DateTime.UtcNow);
            _jobs.TryAdd(job.JobId, job);
            return job.JobId;
        }

        /// <inheritdoc />
        public bool CancelJob(string jobId) =>
            _jobs.TryRemove(jobId, out _);

        /// <inheritdoc />
        public bool PauseJob(string jobId)
        {
            if (_jobs.TryGetValue(jobId, out var job))
            {
                job.Status = RefreshJobStatus.Paused;
                return true;
            }
            return false;
        }

        /// <inheritdoc />
        public bool ResumeJob(string jobId)
        {
            if (_jobs.TryGetValue(jobId, out var job) && job.Status == RefreshJobStatus.Paused)
            {
                job.Status = RefreshJobStatus.Scheduled;
                job.NextRunUtc = CalculateNextRun(job.Schedule, DateTime.UtcNow);
                return true;
            }
            return false;
        }

        /// <inheritdoc />
        public IReadOnlyList<RefreshJob> ListJobs() =>
            _jobs.Values.ToList();

        /// <inheritdoc />
        public IReadOnlyList<RefreshJob> GetDueJobs(DateTime asOfUtc) =>
            _jobs.Values
                .Where(j => j.Enabled && j.Status == RefreshJobStatus.Scheduled &&
                            j.NextRunUtc.HasValue && j.NextRunUtc.Value <= asOfUtc)
                .ToList();

        /// <inheritdoc />
        public void MarkRunning(string jobId)
        {
            if (_jobs.TryGetValue(jobId, out var job))
            {
                job.Status = RefreshJobStatus.Running;
                job.LastRunUtc = DateTime.UtcNow;
            }
        }

        /// <inheritdoc />
        public void MarkCompleted(string jobId, TimeSpan duration)
        {
            if (_jobs.TryGetValue(jobId, out var job))
            {
                job.Status = RefreshJobStatus.Scheduled;
                job.LastDuration = duration;
                job.ConsecutiveFailures = 0;
                job.LastError = null;
                job.NextRunUtc = CalculateNextRun(job.Schedule, DateTime.UtcNow);
            }
        }

        /// <inheritdoc />
        public void MarkFailed(string jobId, string error)
        {
            if (_jobs.TryGetValue(jobId, out var job))
            {
                job.Status = RefreshJobStatus.Failed;
                job.ConsecutiveFailures++;
                job.LastError = error;
                // Back off: next run delayed by failures * base interval
                var baseNext = CalculateNextRun(job.Schedule, DateTime.UtcNow);
                if (baseNext.HasValue)
                    job.NextRunUtc = baseNext.Value.AddMinutes(job.ConsecutiveFailures * 5);
            }
        }

        /// <summary>
        /// Simplified schedule parser. Supports well-known cron patterns and interval shorthand.
        /// </summary>
        private static DateTime? CalculateNextRun(string schedule, DateTime from)
        {
            return schedule switch
            {
                Schedules.Hourly or "hourly" => from.AddHours(1),
                Schedules.Daily or "daily" => from.Date.AddDays(1),
                Schedules.Weekly or "weekly" => from.Date.AddDays(7),
                Schedules.Monthly or "monthly" => from.Date.AddMonths(1),
                _ when schedule.EndsWith("m") && int.TryParse(schedule.TrimEnd('m'), out var mins)
                    => from.AddMinutes(mins),
                _ when schedule.EndsWith("h") && int.TryParse(schedule.TrimEnd('h'), out var hrs)
                    => from.AddHours(hrs),
                _ => from.AddHours(24) // default: daily
            };
        }
    }
}
