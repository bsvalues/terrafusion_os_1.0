// TMR-019: Periodically syncs property data from multiple sources with deduplication
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.ETL
{
    /// <summary>
    /// Represents a normalized property record from any data source.
    /// Used as the common format for deduplication and merging.
    /// </summary>
    public class PropertySyncRecord
    {
        /// <summary>Source system that provided this record.</summary>
        public string SourceSystem { get; set; } = string.Empty;

        /// <summary>Source-specific unique identifier.</summary>
        public string SourceId { get; set; } = string.Empty;

        /// <summary>Parcel number or APN.</summary>
        public string? ParcelNumber { get; set; }

        /// <summary>Full street address.</summary>
        public string? Address { get; set; }

        /// <summary>City.</summary>
        public string? City { get; set; }

        /// <summary>State abbreviation.</summary>
        public string? State { get; set; }

        /// <summary>ZIP code.</summary>
        public string? ZipCode { get; set; }

        /// <summary>County name.</summary>
        public string? County { get; set; }

        /// <summary>Assessed value.</summary>
        public decimal? AssessedValue { get; set; }

        /// <summary>Market value estimate.</summary>
        public decimal? MarketValue { get; set; }

        /// <summary>Last sale price.</summary>
        public decimal? LastSalePrice { get; set; }

        /// <summary>Last sale date.</summary>
        public DateTime? LastSaleDate { get; set; }

        /// <summary>Property type (e.g., Residential, Commercial).</summary>
        public string? PropertyType { get; set; }

        /// <summary>Timestamp when this record was fetched.</summary>
        public DateTime FetchedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Generates a deduplication key based on address or parcel number.
        /// </summary>
        public string GetDeduplicationKey()
        {
            if (!string.IsNullOrWhiteSpace(ParcelNumber))
                return $"PARCEL:{ParcelNumber.Trim().ToUpperInvariant()}";

            var addr = (Address ?? "").Trim().ToUpperInvariant();
            var zip = (ZipCode ?? "").Trim();
            return $"ADDR:{addr}|{zip}";
        }
    }

    /// <summary>
    /// Interface for data source providers that supply property records.
    /// </summary>
    public interface IPropertyDataSource
    {
        /// <summary>Name of the data source.</summary>
        string SourceName { get; }

        /// <summary>Priority for merge conflicts (higher = preferred).</summary>
        int Priority { get; }

        /// <summary>
        /// Fetches property records from this source.
        /// </summary>
        /// <param name="cancellationToken">Cancellation token.</param>
        /// <returns>Collection of property sync records.</returns>
        Task<IReadOnlyList<PropertySyncRecord>> FetchRecordsAsync(CancellationToken cancellationToken);
    }

    /// <summary>
    /// ETL job that periodically syncs property data from multiple sources,
    /// performs deduplication based on parcel number or address, and merges
    /// records using source priority for conflict resolution.
    /// </summary>
    public class DataSyncJob : BaseEtlJob<PropertySyncRecord, PropertySyncRecord>
    {
        private readonly IReadOnlyList<IPropertyDataSource> _dataSources;

        /// <inheritdoc/>
        public override string JobName => "PropertyDataSync";

        /// <summary>
        /// Initializes the data sync job with multiple data sources.
        /// </summary>
        /// <param name="dataSources">Data sources to sync from.</param>
        /// <param name="logger">Logger instance.</param>
        public DataSyncJob(IEnumerable<IPropertyDataSource> dataSources, ILogger<DataSyncJob> logger)
            : base(logger)
        {
            _dataSources = dataSources?.ToList().AsReadOnly()
                ?? throw new ArgumentNullException(nameof(dataSources));
        }

        /// <summary>
        /// Extracts records from all registered data sources.
        /// </summary>
        protected override async Task<IReadOnlyList<PropertySyncRecord>> ExtractAsync(
            CancellationToken cancellationToken)
        {
            var allRecords = new List<PropertySyncRecord>();

            foreach (var source in _dataSources)
            {
                try
                {
                    Logger.LogInformation("Fetching from source: {Source}", source.SourceName);
                    var records = await source.FetchRecordsAsync(cancellationToken);
                    allRecords.AddRange(records);
                    Logger.LogInformation("Fetched {Count} records from {Source}", records.Count, source.SourceName);
                }
                catch (Exception ex)
                {
                    Logger.LogError(ex, "Failed to fetch from source: {Source}", source.SourceName);
                }
            }

            return allRecords.AsReadOnly();
        }

        /// <summary>
        /// Deduplicates records using parcel number or address-based keys.
        /// When duplicates exist, the record from the highest-priority source wins.
        /// </summary>
        protected override Task<IReadOnlyList<PropertySyncRecord>> TransformAsync(
            IReadOnlyList<PropertySyncRecord> rawRecords, CancellationToken cancellationToken)
        {
            var deduplicated = new Dictionary<string, (PropertySyncRecord Record, int Priority)>();

            foreach (var record in rawRecords)
            {
                var key = record.GetDeduplicationKey();
                var sourcePriority = _dataSources
                    .FirstOrDefault(s => s.SourceName == record.SourceSystem)?.Priority ?? 0;

                if (!deduplicated.TryGetValue(key, out var existing) || sourcePriority > existing.Priority)
                {
                    deduplicated[key] = (record, sourcePriority);
                }
            }

            var result = deduplicated.Values
                .Select(v => v.Record)
                .ToList()
                .AsReadOnly();

            Logger.LogInformation("Deduplicated {Input} records to {Output}", rawRecords.Count, result.Count);
            return Task.FromResult<IReadOnlyList<PropertySyncRecord>>(result);
        }

        /// <summary>
        /// Loads deduplicated records to the destination. Stub implementation.
        /// </summary>
        protected override Task<int> LoadAsync(
            IReadOnlyList<PropertySyncRecord> records, CancellationToken cancellationToken)
        {
            // Stub: In production, this would persist to the TerraFusion database
            Logger.LogInformation("Loading {Count} deduplicated property records (stub)", records.Count);
            return Task.FromResult(records.Count);
        }
    }
}
