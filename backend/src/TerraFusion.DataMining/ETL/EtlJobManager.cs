// TMR-014: Coordinates ETL plugin discovery, async job execution, status tracking
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.ETL
{
    /// <summary>
    /// Tracks a registered ETL job and its most recent execution result.
    /// </summary>
    public class EtlJobRegistration
    {
        /// <summary>Unique key for the job.</summary>
        public string JobKey { get; set; } = string.Empty;

        /// <summary>Display name of the job.</summary>
        public string JobName { get; set; } = string.Empty;

        /// <summary>Factory function to create and run the job.</summary>
        public Func<CancellationToken, Task<EtlJobResult>>? ExecuteFunc { get; set; }

        /// <summary>Most recent execution result, if any.</summary>
        public EtlJobResult? LastResult { get; set; }

        /// <summary>Whether the job is currently executing.</summary>
        public bool IsRunning { get; set; }
    }

    /// <summary>
    /// Manages ETL job registration, discovery, execution, and status tracking.
    /// Supports concurrent execution of independent jobs with status monitoring.
    /// </summary>
    public class EtlJobManager
    {
        private readonly ILogger<EtlJobManager> _logger;
        private readonly ConcurrentDictionary<string, EtlJobRegistration> _jobs = new();
        private readonly ConcurrentDictionary<string, CancellationTokenSource> _runningJobs = new();

        /// <summary>
        /// Initializes the ETL job manager.
        /// </summary>
        /// <param name="logger">Logger instance.</param>
        public EtlJobManager(ILogger<EtlJobManager> logger)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Registers an ETL job for management and scheduling.
        /// </summary>
        /// <param name="jobKey">Unique key for the job.</param>
        /// <param name="jobName">Human-readable job name.</param>
        /// <param name="executeFunc">Async function that runs the ETL pipeline.</param>
        public void RegisterJob(string jobKey, string jobName, Func<CancellationToken, Task<EtlJobResult>> executeFunc)
        {
            var registration = new EtlJobRegistration
            {
                JobKey = jobKey,
                JobName = jobName,
                ExecuteFunc = executeFunc
            };

            if (!_jobs.TryAdd(jobKey, registration))
            {
                _logger.LogWarning("Job '{JobKey}' is already registered, updating", jobKey);
                _jobs[jobKey] = registration;
            }

            _logger.LogInformation("Registered ETL job: {JobKey} ({JobName})", jobKey, jobName);
        }

        /// <summary>
        /// Executes a registered job by key. Returns immediately if the job is already running.
        /// </summary>
        /// <param name="jobKey">Key of the job to execute.</param>
        /// <returns>The job result, or null if the job was already running or not found.</returns>
        public async Task<EtlJobResult?> ExecuteJobAsync(string jobKey)
        {
            if (!_jobs.TryGetValue(jobKey, out var registration))
            {
                _logger.LogWarning("Job '{JobKey}' not found", jobKey);
                return null;
            }

            if (registration.IsRunning)
            {
                _logger.LogWarning("Job '{JobKey}' is already running", jobKey);
                return null;
            }

            var cts = new CancellationTokenSource();
            _runningJobs[jobKey] = cts;
            registration.IsRunning = true;

            try
            {
                _logger.LogInformation("Executing job: {JobKey}", jobKey);
                var result = await registration.ExecuteFunc!(cts.Token);
                registration.LastResult = result;
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job '{JobKey}' threw an unhandled exception", jobKey);
                var failedResult = new EtlJobResult
                {
                    JobId = jobKey,
                    Status = EtlJobStatus.Failed,
                    ErrorMessage = ex.Message,
                    CompletedAt = DateTime.UtcNow
                };
                registration.LastResult = failedResult;
                return failedResult;
            }
            finally
            {
                registration.IsRunning = false;
                _runningJobs.TryRemove(jobKey, out _);
                cts.Dispose();
            }
        }

        /// <summary>
        /// Cancels a running job.
        /// </summary>
        /// <param name="jobKey">Key of the job to cancel.</param>
        /// <returns>True if a cancellation was requested; false if the job was not running.</returns>
        public bool CancelJob(string jobKey)
        {
            if (_runningJobs.TryGetValue(jobKey, out var cts))
            {
                cts.Cancel();
                _logger.LogInformation("Cancellation requested for job: {JobKey}", jobKey);
                return true;
            }
            return false;
        }

        /// <summary>
        /// Returns the registration and status of all known jobs.
        /// </summary>
        public IReadOnlyList<EtlJobRegistration> GetAllJobStatuses()
        {
            return _jobs.Values.ToList().AsReadOnly();
        }

        /// <summary>
        /// Returns the registration and status of a specific job.
        /// </summary>
        /// <param name="jobKey">Job key to look up.</param>
        public EtlJobRegistration? GetJobStatus(string jobKey)
        {
            _jobs.TryGetValue(jobKey, out var registration);
            return registration;
        }

        /// <summary>
        /// Returns all registered job keys.
        /// </summary>
        public IReadOnlyList<string> GetRegisteredJobKeys()
        {
            return _jobs.Keys.ToList().AsReadOnly();
        }
    }
}
