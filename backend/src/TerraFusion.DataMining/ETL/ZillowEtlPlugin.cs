// TMR-026: Zillow ETL plugin
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
    /// ETL plugin that extracts property data from Zillow via the connector,
    /// transforms into normalized property records, and loads for downstream use.
    /// </summary>
    public class ZillowEtlPlugin : BaseEtlJob<ZillowPropertyResult, PropertySyncRecord>, IEtlPlugin
    {
        private readonly ZillowConnector _connector;

        /// <inheritdoc/>
        public override string JobName => "Zillow_ETL";

        /// <summary>Plugin identifier.</summary>
        public string PluginId => "zillow-etl";

        /// <summary>Plugin display name.</summary>
        public string PluginName => "Zillow Property Data ETL";

        /// <summary>Plugin description.</summary>
        public string Description => "Extracts property data from Zillow and normalizes into property records.";

        /// <summary>Plugin version.</summary>
        public string Version => "1.0.0";

        /// <summary>Addresses to search for in this ETL run.</summary>
        public List<string> SearchAddresses { get; set; } = new();

        /// <summary>
        /// Initializes the Zillow ETL plugin.
        /// </summary>
        /// <param name="connector">Zillow connector instance.</param>
        /// <param name="logger">Logger instance.</param>
        public ZillowEtlPlugin(ZillowConnector connector, ILogger<ZillowEtlPlugin> logger)
            : base(logger)
        {
            _connector = connector ?? throw new ArgumentNullException(nameof(connector));
        }

        /// <summary>
        /// Extracts property data from Zillow for configured addresses.
        /// </summary>
        protected override async Task<IReadOnlyList<ZillowPropertyResult>> ExtractAsync(
            CancellationToken cancellationToken)
        {
            var results = new List<ZillowPropertyResult>();

            foreach (var address in SearchAddresses)
            {
                if (cancellationToken.IsCancellationRequested) break;

                try
                {
                    var searchResults = await _connector.SearchByAddressAsync(address, cancellationToken);
                    results.AddRange(searchResults);
                }
                catch (Exception ex)
                {
                    Logger.LogWarning(ex, "Failed to search Zillow for address: {Address}", address);
                }
            }

            return results.AsReadOnly();
        }

        /// <summary>
        /// Transforms Zillow results into normalized property records.
        /// </summary>
        protected override Task<IReadOnlyList<PropertySyncRecord>> TransformAsync(
            IReadOnlyList<ZillowPropertyResult> rawRecords, CancellationToken cancellationToken)
        {
            var transformed = rawRecords
                .Where(r => !string.IsNullOrWhiteSpace(r.Address))
                .Select(r => new PropertySyncRecord
                {
                    SourceSystem = "Zillow",
                    SourceId = $"zillow-{r.Zpid}",
                    Address = r.Address?.Trim(),
                    City = r.City?.Trim(),
                    State = r.State?.Trim(),
                    ZipCode = r.ZipCode?.Trim(),
                    MarketValue = r.Zestimate,
                    LastSalePrice = r.LastSoldPrice,
                    LastSaleDate = r.LastSoldDate,
                    PropertyType = r.PropertyType?.Trim(),
                    FetchedAt = DateTime.UtcNow
                })
                .ToList()
                .AsReadOnly();

            return Task.FromResult<IReadOnlyList<PropertySyncRecord>>(transformed);
        }

        /// <summary>
        /// Loads normalized Zillow records. Stub implementation.
        /// </summary>
        protected override Task<int> LoadAsync(
            IReadOnlyList<PropertySyncRecord> records, CancellationToken cancellationToken)
        {
            Logger.LogInformation("Loading {Count} Zillow records (stub)", records.Count);
            return Task.FromResult(records.Count);
        }

        /// <inheritdoc/>
        public Task<EtlJobResult> ExecuteAsync(CancellationToken cancellationToken = default)
        {
            return RunAsync(cancellationToken);
        }
    }
}
