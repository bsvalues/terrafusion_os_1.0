// TMR-170: PACMLS ETL Tests
using System;
using System.Collections.Generic;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using TerraFusion.DataMining.Scripts;
using TerraFusion.DataMining.Seeds;

namespace TerraFusion.DataMining.Tests
{
    /// <summary>
    /// Tests for PACMLS ETL configuration validation and credential setup.
    /// </summary>
    public class PacmlsEtlTests
    {
        private IConfiguration BuildConfig(Dictionary<string, string?> values)
        {
            return new ConfigurationBuilder()
                .AddInMemoryCollection(values)
                .Build();
        }

        [Fact]
        public void Validate_AllKeysMissing_ReturnsInvalid()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var setup = new PacmlsCredSetup(NullLogger<PacmlsCredSetup>.Instance, config);

            var result = setup.Validate();

            Assert.False(result.IsValid);
            Assert.Equal(3, result.MissingKeys.Count);
            Assert.Empty(result.ConfiguredKeys);
        }

        [Fact]
        public void Validate_AllKeysPresent_ReturnsValid()
        {
            var config = BuildConfig(new Dictionary<string, string?>
            {
                { "DataSources:pacmls:Endpoint", "https://pacmls.example.com" },
                { "DataSources:pacmls:ApiKey", "test-key" },
                { "DataSources:pacmls:MemberId", "member-123" },
            });
            var setup = new PacmlsCredSetup(NullLogger<PacmlsCredSetup>.Instance, config);

            var result = setup.Validate();

            Assert.True(result.IsValid);
            Assert.Empty(result.MissingKeys);
            Assert.Equal(3, result.ConfiguredKeys.Count);
        }

        [Fact]
        public void Validate_PartialKeys_ReturnsInvalid()
        {
            var config = BuildConfig(new Dictionary<string, string?>
            {
                { "DataSources:pacmls:Endpoint", "https://pacmls.example.com" },
            });
            var setup = new PacmlsCredSetup(NullLogger<PacmlsCredSetup>.Instance, config);

            var result = setup.Validate();

            Assert.False(result.IsValid);
            Assert.Equal(2, result.MissingKeys.Count);
            Assert.Single(result.ConfiguredKeys);
        }

        [Fact]
        public void GetSetupInstructions_Valid_ReturnsNoAction()
        {
            var config = BuildConfig(new Dictionary<string, string?>
            {
                { "DataSources:pacmls:Endpoint", "url" },
                { "DataSources:pacmls:ApiKey", "key" },
                { "DataSources:pacmls:MemberId", "id" },
            });
            var setup = new PacmlsCredSetup(NullLogger<PacmlsCredSetup>.Instance, config);
            var validation = setup.Validate();

            var instructions = setup.GetSetupInstructions(validation);

            Assert.Contains("No action needed", instructions);
        }

        [Fact]
        public void GetSetupInstructions_Invalid_ListsMissingKeys()
        {
            var config = BuildConfig(new Dictionary<string, string?>());
            var setup = new PacmlsCredSetup(NullLogger<PacmlsCredSetup>.Instance, config);
            var validation = setup.Validate();

            var instructions = setup.GetSetupInstructions(validation);

            Assert.Contains("DataSources:pacmls:Endpoint", instructions);
            Assert.Contains("DataSources:pacmls:ApiKey", instructions);
        }

        [Fact]
        public void DataSourceSeeder_IncludesPacmls()
        {
            var seeder = new DataSourceSeeder(NullLogger<DataSourceSeeder>.Instance);
            var sources = seeder.GetDefaultDataSources();

            Assert.Contains(sources, s => s.Id == "pacmls" && s.Type == "MLS");
        }
    }
}
