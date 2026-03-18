// TMR-024: PACMLS ETL plugin
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using TerraFusion.DataMining.Connectors;

namespace TerraFusion.DataMining.ETL
{
    /// <summary>
    /// ETL plugin that extracts MLS listing data from PACMLS (Pacific Regional MLS),
    /// transforms it into normalized property records, and loads for downstream use.
    /// </summary>
    public class PacmlsEtlPlugin : BaseEtlJob<PacmlsListing, PropertySyncRecord>, IEtlPlugin
    {
        private readonly PacmlsConnector _connector;

        /// <inheritdoc/>
        public override string JobName => "PACMLS_ETL";

        /// <summary>Plugin identifier.</summary>
        public string PluginId => "pacmls-etl";

        /// <summary>Plugin display name.</summary>
        public string PluginName => "PACMLS MLS Data ETL";

        /// <summary>Plugin description.</summary>
        public string Description => "Extracts MLS listing data from PACMLS and normalizes into property records.";

        /// <summary>Plugin version.</summary>
        public string Version => "1.0.0";

        /// <summary>County to sync from. Default is Benton County.</summary>
        public string TargetCounty { get; set; } = "Benton";

        /// <summary>Number of days back to fetch for incremental sync.</summary>
        public int DaysBack { get; set; } = 30;

        /// <summary>
        /// Initializes the PACMLS ETL plugin.
        /// </summary>
        /// <param name="connector">PACMLS connector instance.</param>
        /// <param name="logger">Logger instance.</param>
        public PacmlsEtlPlugin(PacmlsConnector connector, ILogger<PacmlsEtlPlugin> logger)
            : base(logger)
        {
            _connector = connector ?? throw new ArgumentNullException(nameof(connector));
        }

        /// <summary>
        /// Extracts recent MLS listings from PACMLS for the target county.
        /// </summary>
        protected override async Task<IReadOnlyList<PacmlsListing>> ExtractAsync(
            CancellationToken cancellationToken)
        {
            Logger.LogInformation("Extracting PACMLS listings for {County} County, last {Days} days",
                TargetCounty, DaysBack);

            var listings = await _connector.GetRecentSalesAsync(TargetCounty, DaysBack, cancellationToken);

            // Also get active listings
            var active = await _connector.SearchListingsAsync(
                county: TargetCounty, status: "Active", cancellationToken: cancellationToken);

            var combined = new List<PacmlsListing>(listings);
            combined.AddRange(active);
            return combined.AsReadOnly();
        }

        /// <summary>
        /// Transforms MLS listings into normalized property records.
        /// </summary>
        protected override Task<IReadOnlyList<PropertySyncRecord>> TransformAsync(
            IReadOnlyList<PacmlsListing> rawRecords, CancellationToken cancellationToken)
        {
            var transformed = rawRecords
                .Where(l => !string.IsNullOrWhiteSpace(l.Address))
                .Select(l => new PropertySyncRecord
                {
                    SourceSystem = "PACMLS",
                    SourceId = $"pacmls-{l.ListingId}",
                    Address = l.Address?.Trim(),
                    City = l.City?.Trim(),
                    State = l.State?.Trim() ?? "WA",
                    ZipCode = l.ZipCode?.Trim(),
                    County = l.County?.Trim(),
                    MarketValue = l.SoldPrice ?? l.ListPrice,
                    LastSalePrice = l.SoldPrice,
                    LastSaleDate = l.CloseDate,
                    PropertyType = l.PropertyType?.Trim(),
                    FetchedAt = DateTime.UtcNow
                })
                .ToList()
                .AsReadOnly();

            return Task.FromResult<IReadOnlyList<PropertySyncRecord>>(transformed);
        }

        /// <summary>
        /// Loads normalized MLS records. Stub implementation.
        /// </summary>
        protected override Task<int> LoadAsync(
            IReadOnlyList<PropertySyncRecord> records, CancellationToken cancellationToken)
        {
            Logger.LogInformation("Loading {Count} PACMLS records (stub)", records.Count);
            return Task.FromResult(records.Count);
        }

        /// <inheritdoc/>
        public Task<EtlJobResult> ExecuteAsync(CancellationToken cancellationToken = default)
        {
            return RunAsync(cancellationToken);
        }
    }
}
