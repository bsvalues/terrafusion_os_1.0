// TMR-017: Records execution time, records processed, error rates for ETL jobs
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;

namespace TerraFusion.DataMining.ETL
{
    /// <summary>
    /// A single metrics data point captured from an ETL job execution.
    /// </summary>
    public class EtlMetricsEntry
    {
        /// <summary>Job key that produced this metric.</summary>
        public string JobKey { get; set; } = string.Empty;

        /// <summary>Unique execution identifier.</summary>
        public string ExecutionId { get; set; } = string.Empty;

        /// <summary>Timestamp when the execution started.</summary>
        public DateTime StartedAt { get; set; }

        /// <summary>Timestamp when the execution completed.</summary>
        public DateTime CompletedAt { get; set; }

        /// <summary>Total execution duration.</summary>
        public TimeSpan Duration { get; set; }

        /// <summary>Number of records extracted.</summary>
        public int RecordsExtracted { get; set; }

        /// <summary>Number of records transformed.</summary>
        public int RecordsTransformed { get; set; }

        /// <summary>Number of records loaded.</summary>
        public int RecordsLoaded { get; set; }

        /// <summary>Number of records that failed processing.</summary>
        public int RecordsFailed { get; set; }

        /// <summary>Whether the execution completed successfully.</summary>
        public bool Success { get; set; }

        /// <summary>Error message if the execution failed.</summary>
        public string? ErrorMessage { get; set; }
    }

    /// <summary>
    /// Aggregated metrics summary for a specific job over a time window.
    /// </summary>
    public class EtlMetricsSummary
    {
        /// <summary>Job key these metrics apply to.</summary>
        public string JobKey { get; set; } = string.Empty;

        /// <summary>Total number of executions.</summary>
        public int TotalExecutions { get; set; }

        /// <summary>Number of successful executions.</summary>
        public int SuccessfulExecutions { get; set; }

        /// <summary>Number of failed executions.</summary>
        public int FailedExecutions { get; set; }

        /// <summary>Error rate as a percentage (0-100).</summary>
        public double ErrorRatePercent { get; set; }

        /// <summary>Average execution duration.</summary>
        public TimeSpan AverageDuration { get; set; }

        /// <summary>Total records processed across all executions.</summary>
        public long TotalRecordsProcessed { get; set; }

        /// <summary>Average records per execution.</summary>
        public double AverageRecordsPerExecution { get; set; }

        /// <summary>Timestamp of the last execution.</summary>
        public DateTime? LastExecutionAt { get; set; }
    }

    /// <summary>
    /// Collects and aggregates execution metrics for ETL jobs.
    /// Thread-safe for concurrent recording from multiple job executions.
    /// </summary>
    public class EtlMetricsCollector
    {
        private readonly ConcurrentDictionary<string, ConcurrentQueue<EtlMetricsEntry>> _metrics = new();
        private readonly int _maxEntriesPerJob;

        /// <summary>
        /// Initializes the metrics collector.
        /// </summary>
        /// <param name="maxEntriesPerJob">Maximum history entries to retain per job (default 1000).</param>
        public EtlMetricsCollector(int maxEntriesPerJob = 1000)
        {
            _maxEntriesPerJob = maxEntriesPerJob;
        }

        /// <summary>
        /// Records metrics from an ETL job result.
        /// </summary>
        /// <param name="jobKey">Job identifier.</param>
        /// <param name="result">The job result to record.</param>
        public void Record(string jobKey, EtlJobResult result)
        {
            var entry = new EtlMetricsEntry
            {
                JobKey = jobKey,
                ExecutionId = result.JobId,
                StartedAt = result.StartedAt,
                CompletedAt = result.CompletedAt,
                Duration = result.Duration,
                RecordsExtracted = result.RecordsExtracted,
                RecordsTransformed = result.RecordsTransformed,
                RecordsLoaded = result.RecordsLoaded,
                RecordsFailed = result.RecordsFailed,
                Success = result.Status == EtlJobStatus.Completed,
                ErrorMessage = result.ErrorMessage
            };

            var queue = _metrics.GetOrAdd(jobKey, _ => new ConcurrentQueue<EtlMetricsEntry>());
            queue.Enqueue(entry);

            // Trim old entries
            while (queue.Count > _maxEntriesPerJob)
            {
                queue.TryDequeue(out _);
            }
        }

        /// <summary>
        /// Returns an aggregated summary for a specific job.
        /// </summary>
        /// <param name="jobKey">Job key to summarize.</param>
        /// <param name="since">Only consider entries after this time (null = all).</param>
        public EtlMetricsSummary? GetSummary(string jobKey, DateTime? since = null)
        {
            if (!_metrics.TryGetValue(jobKey, out var queue)) return null;

            var entries = since.HasValue
                ? queue.Where(e => e.StartedAt >= since.Value).ToList()
                : queue.ToList();

            if (entries.Count == 0) return null;

            var successful = entries.Count(e => e.Success);
            var failed = entries.Count - successful;
            var totalRecords = entries.Sum(e => (long)e.RecordsLoaded);

            return new EtlMetricsSummary
            {
                JobKey = jobKey,
                TotalExecutions = entries.Count,
                SuccessfulExecutions = successful,
                FailedExecutions = failed,
                ErrorRatePercent = entries.Count > 0 ? (double)failed / entries.Count * 100 : 0,
                AverageDuration = TimeSpan.FromMilliseconds(entries.Average(e => e.Duration.TotalMilliseconds)),
                TotalRecordsProcessed = totalRecords,
                AverageRecordsPerExecution = entries.Count > 0 ? (double)totalRecords / entries.Count : 0,
                LastExecutionAt = entries.Max(e => e.CompletedAt)
            };
        }

        /// <summary>
        /// Returns summaries for all tracked jobs.
        /// </summary>
        /// <param name="since">Only consider entries after this time (null = all).</param>
        public IReadOnlyList<EtlMetricsSummary> GetAllSummaries(DateTime? since = null)
        {
            return _metrics.Keys
                .Select(k => GetSummary(k, since))
                .Where(s => s != null)
                .Cast<EtlMetricsSummary>()
                .ToList()
                .AsReadOnly();
        }

        /// <summary>
        /// Returns raw metric entries for a specific job.
        /// </summary>
        /// <param name="jobKey">Job key.</param>
        /// <param name="limit">Maximum entries to return.</param>
        public IReadOnlyList<EtlMetricsEntry> GetEntries(string jobKey, int limit = 100)
        {
            if (!_metrics.TryGetValue(jobKey, out var queue)) return Array.Empty<EtlMetricsEntry>();
            return queue.TakeLast(limit).ToList().AsReadOnly();
        }
    }
}
