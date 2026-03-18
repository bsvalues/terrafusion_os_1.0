// TMR-012: Abstract base class for ETL jobs
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.ETL
{
    /// <summary>
    /// Represents the current status of an ETL job execution.
    /// </summary>
    public enum EtlJobStatus
    {
        Pending,
        Extracting,
        Transforming,
        Loading,
        Completed,
        Failed,
        Cancelled
    }

    /// <summary>
    /// Result of an ETL job execution containing metrics and status.
    /// </summary>
    public class EtlJobResult
    {
        /// <summary>Job identifier.</summary>
        public string JobId { get; set; } = string.Empty;

        /// <summary>Final status of the job.</summary>
        public EtlJobStatus Status { get; set; }

        /// <summary>Total records extracted from source.</summary>
        public int RecordsExtracted { get; set; }

        /// <summary>Total records successfully transformed.</summary>
        public int RecordsTransformed { get; set; }

        /// <summary>Total records loaded to destination.</summary>
        public int RecordsLoaded { get; set; }

        /// <summary>Number of records that failed processing.</summary>
        public int RecordsFailed { get; set; }

        /// <summary>Total wall-clock duration of the job.</summary>
        public TimeSpan Duration { get; set; }

        /// <summary>Error message if the job failed.</summary>
        public string? ErrorMessage { get; set; }

        /// <summary>Timestamp when the job started.</summary>
        public DateTime StartedAt { get; set; }

        /// <summary>Timestamp when the job completed.</summary>
        public DateTime CompletedAt { get; set; }
    }

    /// <summary>
    /// Abstract base class for all ETL jobs in TerraFusion DataMining.
    /// Subclasses implement Extract, Transform, and Load phases independently.
    /// </summary>
    /// <typeparam name="TRaw">Type of raw extracted data.</typeparam>
    /// <typeparam name="TTransformed">Type of transformed data ready for loading.</typeparam>
    public abstract class BaseEtlJob<TRaw, TTransformed>
    {
        /// <summary>Logger instance for the derived job.</summary>
        protected readonly ILogger Logger;

        /// <summary>Unique name identifying this ETL job type.</summary>
        public abstract string JobName { get; }

        /// <summary>Current execution status.</summary>
        public EtlJobStatus Status { get; protected set; } = EtlJobStatus.Pending;

        /// <summary>
        /// Initializes a new instance of the ETL job base class.
        /// </summary>
        /// <param name="logger">Logger for diagnostics.</param>
        protected BaseEtlJob(ILogger logger)
        {
            Logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Extracts raw data from the source system.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Collection of raw data records.</returns>
        protected abstract Task<IReadOnlyList<TRaw>> ExtractAsync(CancellationToken cancellationToken);

        /// <summary>
        /// Transforms raw data into the target schema.
        /// </summary>
        /// <param name="rawRecords">Raw records from extraction.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Collection of transformed records.</returns>
        protected abstract Task<IReadOnlyList<TTransformed>> TransformAsync(
            IReadOnlyList<TRaw> rawRecords, CancellationToken cancellationToken);

        /// <summary>
        /// Loads transformed data into the destination system.
        /// </summary>
        /// <param name="records">Transformed records to load.</param>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Number of records successfully loaded.</returns>
        protected abstract Task<int> LoadAsync(
            IReadOnlyList<TTransformed> records, CancellationToken cancellationToken);

        /// <summary>
        /// Executes the full Extract-Transform-Load pipeline.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Result containing metrics and status.</returns>
        public virtual async Task<EtlJobResult> RunAsync(CancellationToken cancellationToken = default)
        {
            var result = new EtlJobResult
            {
                JobId = $"{JobName}_{DateTime.UtcNow:yyyyMMddHHmmss}",
                StartedAt = DateTime.UtcNow
            };

            try
            {
                // Extract phase
                Status = EtlJobStatus.Extracting;
                Logger.LogInformation("[{Job}] Starting extraction", JobName);
                var rawRecords = await ExtractAsync(cancellationToken);
                result.RecordsExtracted = rawRecords.Count;
                Logger.LogInformation("[{Job}] Extracted {Count} records", JobName, rawRecords.Count);

                // Transform phase
                Status = EtlJobStatus.Transforming;
                Logger.LogInformation("[{Job}] Starting transformation", JobName);
                var transformed = await TransformAsync(rawRecords, cancellationToken);
                result.RecordsTransformed = transformed.Count;
                result.RecordsFailed = rawRecords.Count - transformed.Count;
                Logger.LogInformation("[{Job}] Transformed {Count} records", JobName, transformed.Count);

                // Load phase
                Status = EtlJobStatus.Loading;
                Logger.LogInformation("[{Job}] Starting load", JobName);
                result.RecordsLoaded = await LoadAsync(transformed, cancellationToken);
                Logger.LogInformation("[{Job}] Loaded {Count} records", JobName, result.RecordsLoaded);

                Status = EtlJobStatus.Completed;
                result.Status = EtlJobStatus.Completed;
            }
            catch (OperationCanceledException)
            {
                Status = EtlJobStatus.Cancelled;
                result.Status = EtlJobStatus.Cancelled;
                Logger.LogWarning("[{Job}] Job cancelled", JobName);
            }
            catch (Exception ex)
            {
                Status = EtlJobStatus.Failed;
                result.Status = EtlJobStatus.Failed;
                result.ErrorMessage = ex.Message;
                Logger.LogError(ex, "[{Job}] Job failed", JobName);
            }
            finally
            {
                result.CompletedAt = DateTime.UtcNow;
                result.Duration = result.CompletedAt - result.StartedAt;
            }

            return result;
        }
    }
}
