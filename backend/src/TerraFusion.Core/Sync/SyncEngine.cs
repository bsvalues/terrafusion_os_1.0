// TFR-017 — Core sync orchestration engine
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Threading;
using System.Threading.Tasks;

namespace TerraFusion.Core.Sync
{
    /// <summary>
    /// Receipt produced after a sync run completes, capturing record counts, duration, and any errors.
    /// </summary>
    public sealed record SyncReceipt
    {
        public string SyncId { get; init; } = Guid.NewGuid().ToString("N");
        public string ConnectorName { get; init; } = string.Empty;
        public SyncMode Mode { get; init; }
        public int RecordsFetched { get; init; }
        public int RecordsIngested { get; init; }
        public int RecordsSkipped { get; init; }
        public int RecordsFailed { get; init; }
        public TimeSpan Duration { get; init; }
        public DateTime StartedAtUtc { get; init; }
        public DateTime CompletedAtUtc { get; init; }
        public bool Success { get; init; }
        public IReadOnlyList<string> Errors { get; init; } = Array.Empty<string>();
    }

    /// <summary>
    /// Sync mode: full (re-extract everything) or incremental (delta since last sync).
    /// </summary>
    public enum SyncMode
    {
        Full,
        Incremental
    }

    /// <summary>
    /// Configuration passed to a sync run.
    /// </summary>
    public sealed record SyncConfig
    {
        public string ConnectorName { get; init; } = string.Empty;
        public SyncMode Mode { get; init; } = SyncMode.Incremental;
        public int BatchSize { get; init; } = 1000;
        public DateTime? DeltaSince { get; init; }
        public string? CountyId { get; init; }
        public Dictionary<string, string> Parameters { get; init; } = new();
    }

    /// <summary>
    /// Core sync orchestration interface. Coordinates connector → validator → ingest pipeline.
    /// </summary>
    public interface ISyncEngine
    {
        /// <summary>
        /// Executes a sync run with the given configuration.
        /// </summary>
        Task<SyncReceipt> RunSyncAsync(SyncConfig config, CancellationToken ct = default);

        /// <summary>
        /// Returns the receipt from the most recent sync for a given connector.
        /// </summary>
        SyncReceipt? GetLastReceipt(string connectorName);
    }

    /// <summary>
    /// Default sync engine implementation. Orchestrates the connector → validator → ingest pipeline.
    /// Supports full sync and incremental (delta) modes.
    /// </summary>
    public class SyncEngine : ISyncEngine
    {
        private readonly ConnectorRegistry _connectorRegistry;
        private readonly IIngestService _ingestService;
        private readonly DataValidator _validator;
        private readonly Dictionary<string, SyncReceipt> _lastReceipts = new();
        private readonly object _receiptLock = new();

        public SyncEngine(
            ConnectorRegistry connectorRegistry,
            IIngestService ingestService,
            DataValidator validator)
        {
            _connectorRegistry = connectorRegistry ?? throw new ArgumentNullException(nameof(connectorRegistry));
            _ingestService = ingestService ?? throw new ArgumentNullException(nameof(ingestService));
            _validator = validator ?? throw new ArgumentNullException(nameof(validator));
        }

        /// <inheritdoc />
        public async Task<SyncReceipt> RunSyncAsync(SyncConfig config, CancellationToken ct = default)
        {
            var errors = new List<string>();
            var sw = Stopwatch.StartNew();
            var startedAt = DateTime.UtcNow;
            int fetched = 0, ingested = 0, skipped = 0, failed = 0;

            try
            {
                // 1. Resolve connector
                var connector = _connectorRegistry.GetConnector(config.ConnectorName);
                if (connector == null)
                {
                    return BuildReceipt(config, startedAt, sw, 0, 0, 0, 0, false,
                        new List<string> { $"Connector '{config.ConnectorName}' not found in registry." });
                }

                // 2. Connect
                await connector.ConnectAsync(ct);

                // 3. Fetch records
                IReadOnlyList<Dictionary<string, object?>> records;
                if (config.Mode == SyncMode.Incremental && config.DeltaSince.HasValue)
                {
                    records = await connector.FetchDeltaAsync(config.DeltaSince.Value, config.BatchSize, ct);
                }
                else
                {
                    records = await connector.FetchRecordsAsync(config.BatchSize, ct);
                }
                fetched = records.Count;

                // 4. Validate
                var validRecords = new List<Dictionary<string, object?>>();
                foreach (var record in records)
                {
                    var report = _validator.Validate(record);
                    if (report.IsValid)
                    {
                        validRecords.Add(record);
                    }
                    else
                    {
                        skipped++;
                        foreach (var issue in report.Issues)
                        {
                            errors.Add($"Validation: {issue}");
                        }
                    }
                }

                // 5. Ingest
                var ingestResult = await _ingestService.IngestAsync(validRecords, config.BatchSize, ct);
                ingested = ingestResult.Ingested;
                failed = ingestResult.Failed;

                // 6. Disconnect
                await connector.DisconnectAsync(ct);
            }
            catch (Exception ex)
            {
                errors.Add($"SyncEngine error: {ex.Message}");
            }

            sw.Stop();
            var receipt = BuildReceipt(config, startedAt, sw, fetched, ingested, skipped, failed,
                errors.Count == 0, errors);

            lock (_receiptLock)
            {
                _lastReceipts[config.ConnectorName] = receipt;
            }

            return receipt;
        }

        /// <inheritdoc />
        public SyncReceipt? GetLastReceipt(string connectorName)
        {
            lock (_receiptLock)
            {
                return _lastReceipts.TryGetValue(connectorName, out var r) ? r : null;
            }
        }

        private static SyncReceipt BuildReceipt(SyncConfig config, DateTime startedAt,
            Stopwatch sw, int fetched, int ingested, int skipped, int failed,
            bool success, IReadOnlyList<string> errors)
        {
            return new SyncReceipt
            {
                ConnectorName = config.ConnectorName,
                Mode = config.Mode,
                RecordsFetched = fetched,
                RecordsIngested = ingested,
                RecordsSkipped = skipped,
                RecordsFailed = failed,
                Duration = sw.Elapsed,
                StartedAtUtc = startedAt,
                CompletedAtUtc = DateTime.UtcNow,
                Success = success,
                Errors = errors
            };
        }
    }
}
