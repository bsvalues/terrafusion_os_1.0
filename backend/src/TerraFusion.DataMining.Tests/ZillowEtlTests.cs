// TMR-171: Zillow ETL Tests
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using TerraFusion.DataMining.Seeds;

namespace TerraFusion.DataMining.Tests
{
    /// <summary>
    /// Tests for Zillow data source ETL configuration and initialization.
    /// </summary>
    public class ZillowEtlTests
    {
        private IConfiguration BuildConfig(Dictionary<string, string?> values)
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(values)
                .Build();
        }

        [Fact]
        public void CheckConfiguration_ZillowNotConfigured_ReturnsNotConfigured()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var init = new DataSourceInit(NullLogger<DataSourceInit>.Instance, config);

            var status = init.CheckConfiguration("zillow");

            Assert.False(status.IsConfigured);
            Assert.Equal("zillow", status.SourceId);
        }

        [Fact]
        public void CheckConfiguration_ZillowConfigured_ReturnsConfigured()
        {
            var config = BuildConfig(new Dictionary<string, string?>
            {
                { "DataSources:zillow:Endpoint", "https://api.zillow.example.com" }
            });
            var init = new DataSourceInit(NullLogger<DataSourceInit>.Instance, config);

            var status = init.CheckConfiguration("zillow");

            Assert.True(status.IsConfigured);
        }

        [Fact]
        public async Task TestConnectivity_NotConfigured_ReturnsFailure()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var init = new DataSourceInit(NullLogger<DataSourceInit>.Instance, config);

            var status = await init.TestConnectivityAsync("zillow");

            Assert.False(status.IsReachable);
        }

        [Fact]
        public async Task ValidateAll_IncludesZillow()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var init = new DataSourceInit(NullLogger<DataSourceInit>.Instance, config);

            var results = await init.ValidateAllAsync();

            Assert.Contains(results, r => r.SourceId == "zillow");
        }

        [Fact]
        public void DataSourceSeeder_IncludesZillow()
        {
            var seeder = new DataSourceSeeder(NullLogger<DataSourceSeeder>.Instance);
            var sources = seeder.GetDefaultDataSources();

            Assert.Contains(sources, s => s.Id == "zillow" && s.Type == "ExternalApi");
        }

        [Fact]
        public void DataSourceSeeder_ZillowDefaultInactive()
        {
            var seeder = new DataSourceSeeder(NullLogger<DataSourceSeeder>.Instance);
            var sources = seeder.GetDefaultDataSources();
            var zillow = sources[sources.Count - 1]; // Get by finding

            var found = false;
            foreach (var s in sources)
            {
                if (s.Id == "zillow")
                {
                    Assert.False(s.IsActive);
                    found = true;
                }
            }
            Assert.True(found);
        }
    }
}
