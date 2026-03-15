// TMR-169: ATTOM API ETL Tests
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using TerraFusion.DataMining.Seeds;

namespace TerraFusion.DataMining.Tests
{
    /// <summary>
    /// Tests for ATTOM data source ETL configuration and initialization.
    /// </summary>
    public class AttomEtlTests
    {
        private readonly ILogger<DataSourceInit> _logger = NullLogger<DataSourceInit>.Instance;

        private IConfiguration BuildConfig(Dictionary<string, string?> values)
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(values)
                .Build();
        }

        [Fact]
        public void CheckConfiguration_AttomNotConfigured_ReturnsNotConfigured()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var init = new DataSourceInit(_logger, config);

            var status = init.CheckConfiguration("attom");

            Assert.False(status.IsConfigured);
            Assert.Equal("attom", status.SourceId);
            Assert.NotNull(status.ErrorMessage);
        }

        [Fact]
        public void CheckConfiguration_AttomConfigured_ReturnsConfigured()
        {
            var config = BuildConfig(new Dictionary<string, string?>
            {
                { "DataSources:attom:Endpoint", "https://api.attom.example.com" }
            });
            var init = new DataSourceInit(_logger, config);

            var status = init.CheckConfiguration("attom");

            Assert.True(status.IsConfigured);
            Assert.Null(status.ErrorMessage);
        }

        [Fact]
        public async Task TestConnectivity_NotConfigured_ReturnsUnreachable()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var init = new DataSourceInit(_logger, config);

            var status = await init.TestConnectivityAsync("attom");

            Assert.False(status.IsReachable);
            Assert.False(status.IsConfigured);
        }

        [Fact]
        public async Task TestConnectivity_Configured_ReturnsStubResult()
        {
            var config = BuildConfig(new Dictionary<string, string?>
            {
                { "DataSources:attom:Endpoint", "https://api.attom.example.com" }
            });
            var init = new DataSourceInit(_logger, config);

            var status = await init.TestConnectivityAsync("attom");

            Assert.True(status.IsConfigured);
            // Stub always returns not reachable until production implementation
            Assert.False(status.IsReachable);
        }

        [Fact]
        public void DataSourceSeeder_IncludesAttom()
        {
            var seeder = new DataSourceSeeder(NullLogger<DataSourceSeeder>.Instance);
            var sources = seeder.GetDefaultDataSources();

            Assert.Contains(sources, s => s.Id == "attom" && s.Type == "ExternalApi");
        }
    }
}
