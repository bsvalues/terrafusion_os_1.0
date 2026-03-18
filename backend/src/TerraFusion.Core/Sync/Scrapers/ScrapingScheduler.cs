// TFR-091: Manages scraping job scheduling with rate limiting and retry
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync.Scrapers
{
    /// <summary>
    /// Priority levels for scraping jobs.
    /// </summary>
    public enum ScrapingPriority
    {
        /// <summary>Low priority; processed after all higher-priority jobs.</summary>
        Low = 0,
        /// <summary>Normal priority.</summary>
        Normal = 1,
        /// <summary>High priority; processed before normal and low.</summary>
        High = 2,
        /// <summary>Critical; processed immediately.</summary>
        Critical = 3,
    }

    /// <summary>
    /// Status of a scraping job.
    /// </summary>
    public enum ScrapingJobStatus
    {
        /// <summary>Job is queued and waiting.</summary>
        Queued,
        /// <summary>Job is currently running.</summary>
        Running,
        /// <summary>Job completed successfully.</summary>
        Completed,
        /// <summary>Job failed and may be retried.</summary>
        Failed,
        /// <summary>Job was cancelled.</summary>
        Cancelled,
        /// <summary>Job exceeded max retries.</summary>
        Exhausted,
    }

    /// <summary>
    /// Represents a single scraping job in the queue.
    /// </summary>
    public class ScrapingJob
    {
        /// <summary>Unique job identifier.</summary>
        public string JobId { get; set; } = Guid.NewGuid().ToString("N");

        /// <summary>Target domain to scrape.</summary>
        public string Domain { get; set; } = string.Empty;

        /// <summary>Target URL or parcel identifier.</summary>
        public string Target { get; set; } = string.Empty;

        /// <summary>Job priority.</summary>
        public ScrapingPriority Priority { get; set; } = ScrapingPriority.Normal;

        /// <summary>Current job status.</summary>
        public ScrapingJobStatus Status { get; set; } = ScrapingJobStatus.Queued;

        /// <summary>Number of retry attempts so far.</summary>
        public int RetryCount { get; set; }

        /// <summary>Maximum number of retry attempts.</summary>
        public int MaxRetries { get; set; } = 3;

        /// <summary>UTC timestamp when the job was created.</summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>UTC timestamp when the job started running.</summary>
        public DateTime? StartedAt { get; set; }

        /// <summary>UTC timestamp when the job completed or failed.</summary>
        public DateTime? CompletedAt { get; set; }

        /// <summary>Earliest time this job should be executed (for retry backoff).</summary>
        public DateTime EarliestExecution { get; set; } = DateTime.UtcNow;

        /// <summary>Error message from the last failure.</summary>
        public string? LastError { get; set; }

        /// <summary>Result of the scraping operation (populated on completion).</summary>
        public ScrapeResult? Result { get; set; }

        /// <summary>Async callback to execute for this job.</summary>
        public Func<CancellationToken, Task<ScrapeResult>>? ExecuteAsync { get; set; }
    }

    /// <summary>
    /// Interface for scraping job scheduling with rate limiting and retry.
    /// </summary>
    public interface IScrapingScheduler
    {
        /// <summary>
        /// Enqueues a scraping job.
        /// </summary>
        /// <param name="job">The job to enqueue.</param>
        /// <returns>The job ID.</returns>
        string Enqueue(ScrapingJob job);

        /// <summary>
        /// Gets the status of a job by ID.
        /// </summary>
        /// <param name="jobId">Job identifier.</param>
        /// <returns>The job, or null if not found.</returns>
        ScrapingJob? GetJob(string jobId);

        /// <summary>
        /// Cancels a queued job.
        /// </summary>
        /// <param name="jobId">Job identifier.</param>
        /// <returns>True if the job was cancelled.</returns>
        bool Cancel(string jobId);

        /// <summary>
        /// Gets all jobs with the given status.
        /// </summary>
        /// <param name="status">Status to filter by.</param>
        /// <returns>List of matching jobs.</returns>
        IReadOnlyList<ScrapingJob> GetJobsByStatus(ScrapingJobStatus status);

        /// <summary>
        /// Gets the current queue depth.
        /// </summary>
        int QueueDepth { get; }

        /// <summary>
        /// Starts the scheduler processing loop.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token to stop the scheduler.</param>
        Task StartAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Stops the scheduler gracefully.
        /// </summary>
        Task StopAsync();
    }

    /// <summary>
    /// Manages scraping job scheduling with per-domain rate limiting,
    /// exponential backoff retry, and priority-based job queue.
    /// </summary>
    public class ScrapingScheduler : IScrapingScheduler
    {
        private readonly ConcurrentDictionary<string, ScrapingJob> _allJobs = new();
        private readonly ConcurrentDictionary<string, DateTime> _domainLastRequest = new();
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _domainSemaphores = new();
        private CancellationTokenSource? _cts;
        private Task? _processingTask;

        /// <summary>
        /// Minimum delay between requests to the same domain.
        /// </summary>
        public TimeSpan MinDomainInterval { get; set; } = TimeSpan.FromSeconds(2);

        /// <summary>
        /// Maximum concurrent jobs per domain.
        /// </summary>
        public int MaxConcurrencyPerDomain { get; set; } = 2;

        /// <summary>
        /// Base delay for exponential backoff on retry (multiplied by 2^retryCount).
        /// </summary>
        public TimeSpan RetryBaseDelay { get; set; } = TimeSpan.FromSeconds(5);

        /// <summary>
        /// How often the scheduler checks for ready jobs.
        /// </summary>
        public TimeSpan PollInterval { get; set; } = TimeSpan.FromMilliseconds(500);

        /// <inheritdoc />
        public int QueueDepth => _allJobs.Values.Count(j => j.Status == ScrapingJobStatus.Queued);

        /// <inheritdoc />
        public string Enqueue(ScrapingJob job)
        {
            if (job == null) throw new ArgumentNullException(nameof(job));
            if (string.IsNullOrWhiteSpace(job.Domain)) throw new ArgumentException("Job must have a domain.", nameof(job));

            _allJobs[job.JobId] = job;
            return job.JobId;
        }

        /// <inheritdoc />
        public ScrapingJob? GetJob(string jobId)
        {
            return _allJobs.TryGetValue(jobId, out var job) ? job : null;
        }

        /// <inheritdoc />
        public bool Cancel(string jobId)
        {
            if (!_allJobs.TryGetValue(jobId, out var job))
                return false;

            if (job.Status != ScrapingJobStatus.Queued)
                return false;

            job.Status = ScrapingJobStatus.Cancelled;
            job.CompletedAt = DateTime.UtcNow;
            return true;
        }

        /// <inheritdoc />
        public IReadOnlyList<ScrapingJob> GetJobsByStatus(ScrapingJobStatus status)
        {
            return _allJobs.Values
                .Where(j => j.Status == status)
                .OrderByDescending(j => j.Priority)
                .ThenBy(j => j.CreatedAt)
                .ToList();
        }

        /// <inheritdoc />
        public async Task StartAsync(CancellationToken cancellationToken = default)
        {
            _cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            _processingTask = ProcessQueueAsync(_cts.Token);
            await Task.CompletedTask;
        }

        /// <inheritdoc />
        public async Task StopAsync()
        {
            _cts?.Cancel();
            if (_processingTask != null)
            {
                try { await _processingTask; }
                catch (OperationCanceledException) { }
            }
        }

        /// <summary>
        /// Main processing loop that dequeues and executes jobs.
        /// </summary>
        private async Task ProcessQueueAsync(CancellationToken ct)
        {
            while (!ct.IsCancellationRequested)
            {
                var readyJobs = _allJobs.Values
                    .Where(j => j.Status == ScrapingJobStatus.Queued && j.EarliestExecution <= DateTime.UtcNow)
                    .OrderByDescending(j => j.Priority)
                    .ThenBy(j => j.CreatedAt)
                    .ToList();

                foreach (var job in readyJobs)
                {
                    if (ct.IsCancellationRequested) break;

                    var semaphore = _domainSemaphores.GetOrAdd(job.Domain,
                        _ => new SemaphoreSlim(MaxConcurrencyPerDomain, MaxConcurrencyPerDomain));

                    if (semaphore.CurrentCount > 0)
                    {
                        _ = ExecuteJobAsync(job, semaphore, ct);
                    }
                }

                try { await Task.Delay(PollInterval, ct); }
                catch (OperationCanceledException) { break; }
            }
        }

        /// <summary>
        /// Executes a single job with domain rate limiting and error handling.
        /// </summary>
        private async Task ExecuteJobAsync(ScrapingJob job, SemaphoreSlim semaphore, CancellationToken ct)
        {
            await semaphore.WaitAsync(ct);
            try
            {
                // Enforce per-domain rate limiting
                if (_domainLastRequest.TryGetValue(job.Domain, out var lastRequest))
                {
                    var elapsed = DateTime.UtcNow - lastRequest;
                    if (elapsed < MinDomainInterval)
                    {
                        await Task.Delay(MinDomainInterval - elapsed, ct);
                    }
                }

                job.Status = ScrapingJobStatus.Running;
                job.StartedAt = DateTime.UtcNow;

                if (job.ExecuteAsync != null)
                {
                    job.Result = await job.ExecuteAsync(ct);
                    job.Status = job.Result.Success ? ScrapingJobStatus.Completed : ScrapingJobStatus.Failed;
                    if (!job.Result.Success)
                        job.LastError = job.Result.ErrorMessage;
                }
                else
                {
                    job.Status = ScrapingJobStatus.Failed;
                    job.LastError = "No execute callback provided.";
                }

                _domainLastRequest[job.Domain] = DateTime.UtcNow;
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                job.Status = ScrapingJobStatus.Failed;
                job.LastError = ex.Message;
            }
            finally
            {
                job.CompletedAt = DateTime.UtcNow;

                // Handle retry with exponential backoff
                if (job.Status == ScrapingJobStatus.Failed && job.RetryCount < job.MaxRetries)
                {
                    job.RetryCount++;
                    job.Status = ScrapingJobStatus.Queued;
                    job.CompletedAt = null;
                    job.EarliestExecution = DateTime.UtcNow + TimeSpan.FromSeconds(
                        RetryBaseDelay.TotalSeconds * Math.Pow(2, job.RetryCount - 1));
                }
                else if (job.Status == ScrapingJobStatus.Failed)
                {
                    job.Status = ScrapingJobStatus.Exhausted;
                }

                semaphore.Release();
            }
        }
    }
}
