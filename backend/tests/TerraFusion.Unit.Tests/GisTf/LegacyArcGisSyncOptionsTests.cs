using System.Collections.Generic;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Configuration;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf;

/// <summary>
/// Slice D3 acceptance tests for
/// <see cref="LegacyArcGisSyncOptions"/>.
///
/// <para>Per Block-D contract v1.8: the legacy
/// <c>TerraFusion.API.Services.ArcGisSyncService</c>
/// BackgroundService must NOT be registered by default. The
/// canonical path is the
/// D1→D2→D3 doctrine pipeline. Legacy can be re-enabled for
/// emergency rollback by explicit operator opt-in via either
/// the <c>LegacyArcGisSync:Enabled</c> config key or the
/// <c>TF_ENABLE_LEGACY_ARCGIS_SYNC</c> environment variable.</para>
///
/// <para>These tests verify the options-class behavior + the
/// configuration-binding contract. The actual DI registration
/// happens in <c>Program.cs</c> (host-level wiring is exercised
/// at runtime, not in unit tests); the contract here ensures
/// that whatever Program.cs reads, the default is <c>false</c>.</para>
/// </summary>
public sealed class LegacyArcGisSyncOptionsTests
{
    [Fact]
    public void Default_Enabled_IsFalse()
    {
        var options = new LegacyArcGisSyncOptions();
        options.Enabled.Should().BeFalse(
            "Block-D contract v1.8 disables the legacy path by default");
    }

    [Fact]
    public void SectionName_IsLegacyArcGisSync()
    {
        // The contract pins the config-section name. Renaming
        // it requires a v2 contract bump.
        LegacyArcGisSyncOptions.SectionName.Should().Be("LegacyArcGisSync");
    }

    [Fact]
    public void Bind_FromConfiguration_ReadsEnabledTrue()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["LegacyArcGisSync:Enabled"] = "true",
            })
            .Build();

        var options = new LegacyArcGisSyncOptions();
        configuration.GetSection(LegacyArcGisSyncOptions.SectionName).Bind(options);

        options.Enabled.Should().BeTrue(
            "explicit operator opt-in via config must flip the flag");
    }

    [Fact]
    public void Bind_FromConfiguration_DefaultsFalseWhenSectionAbsent()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var options = new LegacyArcGisSyncOptions();
        configuration.GetSection(LegacyArcGisSyncOptions.SectionName).Bind(options);

        options.Enabled.Should().BeFalse(
            "absent config section must leave the default-false intact");
    }
}
