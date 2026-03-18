// TMR-173: PACS Connection Tests
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using TerraFusion.DataMining.Scripts;
using TerraFusion.DataMining.Seeds;

namespace TerraFusion.DataMining.Tests
{
    /// <summary>
    /// Tests for PACS server connection validation and configuration.
    /// </summary>
    public class PacsConnectionTests
    {
        private IConfiguration BuildConfig(Dictionary<string, string?> values)
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(values)
                .Build();
        }

        [Fact]
        public void IsConfigured_NoEndpoint_ReturnsFalse()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var runner = new PacsServerRunner(NullLogger<PacsServerRunner>.Instance, config);

            Assert.False(runner.IsConfigured());
        }

        [Fact]
        public void IsConfigured_WithEndpoint_ReturnsTrue()
        {
            var config = BuildConfig(new Dictionary<string, string?>
            {
                { "DataSources:pacs:Endpoint", "https://pacs.example.com" }
            });
            var runner = new PacsServerRunner(NullLogger<PacsServerRunner>.Instance, config);

            Assert.True(runner.IsConfigured());
        }

        [Fact]
        public async Task CheckStatus_NotConfigured_ReturnsError()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var runner = new PacsServerRunner(NullLogger<PacsServerRunner>.Instance, config);

            var status = await runner.CheckStatusAsync();

            Assert.False(status.IsConnected);
            Assert.NotNull(status.ErrorMessage);
            Assert.Contains("not configured", status.ErrorMessage);
        }

        [Fact]
        public async Task CheckStatus_Configured_ReturnsStubResult()
        {
            var config = BuildConfig(new Dictionary<string, string?>
            {
                { "DataSources:pacs:Endpoint", "https://pacs.example.com" }
            });
            var runner = new PacsServerRunner(NullLogger<PacsServerRunner>.Instance, config);

            var status = await runner.CheckStatusAsync();

            // Stub returns not connected but configured
            Assert.False(status.IsConnected);
            Assert.Equal("configured", status.ServerEndpoint);
        }

        [Fact]
        public async Task SyncData_NotConfigured_ReturnsZero()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var runner = new PacsServerRunner(NullLogger<PacsServerRunner>.Instance, config);

            var count = await runner.SyncDataAsync("benton");

            Assert.Equal(0, count);
        }

        [Fact]
        public void DataSourceInit_PacsNotConfigured_ReturnsNotConfigured()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var init = new DataSourceInit(NullLogger<DataSourceInit>.Instance, config);

            var status = init.CheckConfiguration("pacs");

            Assert.False(status.IsConfigured);
            Assert.Equal("pacs", status.SourceId);
        }

        [Fact]
        public void DataSourceSeeder_IncludesPacs()
        {
            var seeder = new DataSourceSeeder(NullLogger<DataSourceSeeder>.Instance);
            var sources = seeder.GetDefaultDataSources();

            Assert.Contains(sources, s => s.Id == "pacs" && s.Name == "Harris PACS");
        }
    }
}
