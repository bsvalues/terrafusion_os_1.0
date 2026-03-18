// TMR-129: Data Source Init - External API connection initialization
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Seeds
{
    /// <summary>
    /// Status of an external data source connection.
    /// </summary>
    public class DataSourceConnectionStatus
    {
        public string SourceId { get; set; } = string.Empty;
        public bool IsConfigured { get; set; }
        public bool IsReachable { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Initializes and validates external API connections for data sources.
    /// All credentials and endpoints are read from IConfiguration only.
    /// </summary>
    public class DataSourceInit
    {
        private readonly ILogger<DataSourceInit> _logger;
        private readonly IConfiguration _configuration;

        public DataSourceInit(ILogger<DataSourceInit> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Validates that a data source has required configuration present.
        /// Does NOT store or log credentials.
        /// </summary>
        public DataSourceConnectionStatus CheckConfiguration(string sourceId)
        {
            var section = _configuration.GetSection($"DataSources:{sourceId}");
            var status = new DataSourceConnectionStatus { SourceId = sourceId };

            if (!section.Exists())
            {
                status.IsConfigured = false;
                status.ErrorMessage = $"No configuration found for data source '{sourceId}'";
                _logger.LogWarning("Data source {SourceId} not configured", sourceId);
                return status;
            }

            var endpoint = section["Endpoint"];
            status.IsConfigured = !string.IsNullOrEmpty(endpoint);

            if (!status.IsConfigured)
                status.ErrorMessage = $"Endpoint not configured for data source '{sourceId}'";

            return status;
        }

        /// <summary>
        /// Checks configuration for all known data sources.
        /// </summary>
        public Task<List<DataSourceConnectionStatus>> ValidateAllAsync()
        {
            var sourceIds = new[] { "pacs", "benton-gis", "attom", "pacmls", "zillow", "census" };
            var results = new List<DataSourceConnectionStatus>();

            foreach (var id in sourceIds)
            {
                var status = CheckConfiguration(id);
                results.Add(status);
            }

            var configured = results.FindAll(s => s.IsConfigured).Count;
            _logger.LogInformation("Data source validation: {Configured}/{Total} configured",
                configured, results.Count);

            return Task.FromResult(results);
        }

        /// <summary>
        /// Performs a connectivity test for a configured data source.
        /// Stub: In production, performs HTTP health check against the endpoint.
        /// </summary>
        public Task<DataSourceConnectionStatus> TestConnectivityAsync(string sourceId)
        {
            var status = CheckConfiguration(sourceId);
            if (!status.IsConfigured)
                return Task.FromResult(status);

            // Stub: In production, HTTP GET to the endpoint's health check URL
            status.IsReachable = false;
            status.ErrorMessage = "Connectivity test is a stub; configure and implement for production";
            _logger.LogDebug("Connectivity test for {SourceId}: stub", sourceId);

            return Task.FromResult(status);
        }
    }
}
