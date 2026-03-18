// TMR-128: Data Source Seeder - Seeds data source definitions
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TerraFusion.DataMining.Seeds
{
    /// <summary>
    /// Represents a data source definition for the data mining platform.
    /// </summary>
    public class DataSourceDefinition
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    /// <summary>
    /// Seeds the system with known data source definitions.
    /// No credentials are stored; connection details come from IConfiguration at runtime.
    /// </summary>
    public class DataSourceSeeder
    {
        private readonly ILogger<DataSourceSeeder> _logger;

        public DataSourceSeeder(ILogger<DataSourceSeeder> logger)
        {
            _logger = logger;
        }

        /// <summary>
        /// Returns the default set of data source definitions for TerraFusion.
        /// </summary>
        public IReadOnlyList<DataSourceDefinition> GetDefaultDataSources()
        {
            return new List<DataSourceDefinition>
            {
                new() { Id = "pacs", Name = "Harris PACS", Type = "PropertyAssessment", Description = "Harris PACS 9.0 property assessment data", IsActive = true },
                new() { Id = "benton-gis", Name = "Benton County GIS", Type = "GIS", Description = "Benton County GIS spatial data", IsActive = true },
                new() { Id = "attom", Name = "ATTOM Data", Type = "ExternalApi", Description = "ATTOM property and market data API", IsActive = false },
                new() { Id = "pacmls", Name = "PACMLS", Type = "MLS", Description = "Pacific Regional MLS listing data", IsActive = false },
                new() { Id = "zillow", Name = "Zillow", Type = "ExternalApi", Description = "Zillow property estimates API", IsActive = false },
                new() { Id = "census", Name = "US Census", Type = "Government", Description = "US Census Bureau demographic data", IsActive = true },
            };
        }

        /// <summary>
        /// Seeds data source definitions into the data store.
        /// Stub: In production, inserts/updates via DbContext.
        /// </summary>
        public Task<int> SeedAsync()
        {
            var sources = GetDefaultDataSources();
            _logger.LogInformation("Seeding {Count} data source definitions", sources.Count);

            // Stub: In production, upsert each definition into the database
            foreach (var source in sources)
            {
                _logger.LogDebug("Data source: {Id} - {Name} (Active={IsActive})", source.Id, source.Name, source.IsActive);
            }

            return Task.FromResult(sources.Count);
        }
    }
}
