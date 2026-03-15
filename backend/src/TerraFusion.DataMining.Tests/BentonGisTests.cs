// TMR-172: Benton GIS Connector Tests
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using TerraFusion.DataMining.Scripts;
using TerraFusion.DataMining.Seeds;
using TerraFusion.DataMining.Utils;

namespace TerraFusion.DataMining.Tests
{
    /// <summary>
    /// Tests for Benton County GIS connector and location processing.
    /// </summary>
    public class BentonGisTests
    {
        [Theory]
        [InlineData(46.3, -119.5, true)]    // Kennewick area
        [InlineData(46.28, -119.28, true)]  // Richland area
        [InlineData(46.6, -119.8, true)]    // Northern Benton County
        [InlineData(47.0, -119.5, false)]   // North of Benton County
        [InlineData(45.5, -119.5, false)]   // South of Benton County
        [InlineData(46.3, -120.0, false)]   // West of Benton County
        [InlineData(46.3, -119.0, false)]   // East of Benton County
        public void IsWithinBentonCounty_ReturnsExpected(double lat, double lon, bool expected)
        {
            var result = LocationProcessing.IsWithinBentonCounty(lat, lon);
            Assert.Equal(expected, result);
        }

        [Fact]
        public void CheckConfiguration_BentonGisNotConfigured_ReturnsNotConfigured()
        {
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>())
                .Build();
            var init = new DataSourceInit(NullLogger<DataSourceInit>.Instance, config);

            var status = init.CheckConfiguration("benton-gis");

            Assert.False(status.IsConfigured);
        }

        [Fact]
        public void CheckConfiguration_BentonGisConfigured_ReturnsConfigured()
        {
            var config = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "DataSources:benton-gis:Endpoint", "https://gis.benton.example.com" }
                })
                .Build();
            var init = new DataSourceInit(NullLogger<DataSourceInit>.Instance, config);

            var status = init.CheckConfiguration("benton-gis");

            Assert.True(status.IsConfigured);
        }

        [Fact]
        public async Task LocationProcessing_EmptyBatch_ReturnsZeroes()
        {
            var locationUtils = new LocationUtils(
                NullLogger<LocationUtils>.Instance,
                new ConfigurationBuilder().Build());
            var processor = new LocationProcessing(
                NullLogger<LocationProcessing>.Instance, locationUtils);

            var result = await processor.ProcessBatchAsync(new List<string>());

            Assert.Equal(0, result.TotalRecords);
            Assert.Equal(0, result.Geocoded);
        }

        [Fact]
        public async Task LocationProcessing_BlankAddresses_AreSkipped()
        {
            var locationUtils = new LocationUtils(
                NullLogger<LocationUtils>.Instance,
                new ConfigurationBuilder().Build());
            var processor = new LocationProcessing(
                NullLogger<LocationProcessing>.Instance, locationUtils);

            var result = await processor.ProcessBatchAsync(new List<string> { "", "  ", null! });

            Assert.Equal(3, result.TotalRecords);
            Assert.Equal(3, result.Skipped);
            Assert.Equal(0, result.Geocoded);
        }

        [Fact]
        public void DataSourceSeeder_IncludesBentonGis()
        {
            var seeder = new DataSourceSeeder(NullLogger<DataSourceSeeder>.Instance);
            var sources = seeder.GetDefaultDataSources();

            Assert.Contains(sources, s => s.Id == "benton-gis" && s.Type == "GIS");
        }
    }
}
