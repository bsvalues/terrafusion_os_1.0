using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using TerraFusion.Core.Configuration;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf;

/// <summary>
/// Slice G1-B: configuration-binding tests for
/// <see cref="ArcGisFeatureServiceOptions"/>. Proves that the
/// per-county dictionary, attribute name overrides, and timeout
/// settings round-trip through standard
/// <c>IConfiguration.GetSection().Bind()</c> wiring.
/// </summary>
public sealed class ArcGisFeatureServiceOptionsTests
{
    [Fact]
    public void Defaults_AreSane_WhenNoConfigurationProvided()
    {
        var options = new CountyArcGisOptions();

        options.ParcelFeatureServiceUrl.Should().BeEmpty();
        options.ApnAttributeName.Should().Be("APN");
        options.ObjectIdAttributeName.Should().Be("OBJECTID");
        options.OutSpatialReferenceEpsg.Should().Be(4326);
        options.RequestTimeoutSeconds.Should().Be(30);
        options.BearerToken.Should().BeNull();
    }

    [Fact]
    public void SectionName_IsArcGisFeatureServices()
    {
        ArcGisFeatureServiceOptions.SectionName.Should().Be("ArcGisFeatureServices");
    }

    [Fact]
    public void Bind_Single_County_FromInMemoryConfiguration()
    {
        var bentonFips = "53005";
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"ArcGisFeatureServices:Counties:{bentonFips}:ParcelFeatureServiceUrl"]
                    = "https://services.arcgis.com/abc123/arcgis/rest/services/BentonParcels/FeatureServer/0",
                [$"ArcGisFeatureServices:Counties:{bentonFips}:ApnAttributeName"] = "ParcelNum",
                [$"ArcGisFeatureServices:Counties:{bentonFips}:RequestTimeoutSeconds"] = "60",
            })
            .Build();

        var services = new ServiceCollection();
        services.Configure<ArcGisFeatureServiceOptions>(
            configuration.GetSection(ArcGisFeatureServiceOptions.SectionName));
        var provider = services.BuildServiceProvider();
        var bound = provider.GetRequiredService<IOptions<ArcGisFeatureServiceOptions>>().Value;

        bound.Counties.Should().HaveCount(1);
        var county = bound.GetForCounty(bentonFips);
        county.Should().NotBeNull();
        county!.ParcelFeatureServiceUrl.Should().Contain("BentonParcels/FeatureServer/0");
        county.ApnAttributeName.Should().Be("ParcelNum");
        county.RequestTimeoutSeconds.Should().Be(60);

        // Untouched defaults survive partial config:
        county.ObjectIdAttributeName.Should().Be("OBJECTID");
        county.OutSpatialReferenceEpsg.Should().Be(4326);
        county.BearerToken.Should().BeNull();
    }

    [Fact]
    public void Bind_Multiple_Counties_AllPresent()
    {
        var countyA = "53005";
        var countyB = "53007";
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"ArcGisFeatureServices:Counties:{countyA}:ParcelFeatureServiceUrl"]
                    = "https://a.example/FeatureServer/0",
                [$"ArcGisFeatureServices:Counties:{countyB}:ParcelFeatureServiceUrl"]
                    = "https://b.example/FeatureServer/0",
                [$"ArcGisFeatureServices:Counties:{countyB}:BearerToken"] = "secret-b",
            })
            .Build();

        var services = new ServiceCollection();
        services.Configure<ArcGisFeatureServiceOptions>(
            configuration.GetSection(ArcGisFeatureServiceOptions.SectionName));
        var provider = services.BuildServiceProvider();
        var bound = provider.GetRequiredService<IOptions<ArcGisFeatureServiceOptions>>().Value;

        bound.Counties.Should().HaveCount(2);
        bound.GetForCounty(countyA)!.BearerToken.Should().BeNull();
        bound.GetForCounty(countyB)!.BearerToken.Should().Be("secret-b");
    }

    [Fact]
    public void GetForCounty_UnknownCounty_ReturnsNull()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArcGisFeatureServices:Counties:19190019-1919-1919-1919-191919191919:ParcelFeatureServiceUrl"]
                    = "https://example/FeatureServer/0",
            })
            .Build();

        var services = new ServiceCollection();
        services.Configure<ArcGisFeatureServiceOptions>(
            configuration.GetSection(ArcGisFeatureServiceOptions.SectionName));
        var provider = services.BuildServiceProvider();
        var bound = provider.GetRequiredService<IOptions<ArcGisFeatureServiceOptions>>().Value;

        bound.GetForCounty("99999").Should().BeNull();
    }

    [Fact]
    public void GetForCounty_IsCaseInsensitive_OnFipsKey()
    {
        // Config key stored in upper-case; lookup may arrive in lower-case.
        // GetForCounty uses OrdinalIgnoreCase so both must match.
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ArcGisFeatureServices:Counties:WA53005:ParcelFeatureServiceUrl"]
                    = "https://example/FeatureServer/0",
            })
            .Build();

        var services = new ServiceCollection();
        services.Configure<ArcGisFeatureServiceOptions>(
            configuration.GetSection(ArcGisFeatureServiceOptions.SectionName));
        var provider = services.BuildServiceProvider();
        var bound = provider.GetRequiredService<IOptions<ArcGisFeatureServiceOptions>>().Value;

        bound.GetForCounty("wa53005").Should().NotBeNull("lookup is case-insensitive");
        bound.GetForCounty("WA53005").Should().NotBeNull("original case also matches");
    }

    [Fact]
    public void Bind_NoSection_YieldsEmptyCountyMap()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();

        var services = new ServiceCollection();
        services.Configure<ArcGisFeatureServiceOptions>(
            configuration.GetSection(ArcGisFeatureServiceOptions.SectionName));
        var provider = services.BuildServiceProvider();
        var bound = provider.GetRequiredService<IOptions<ArcGisFeatureServiceOptions>>().Value;

        bound.Counties.Should().NotBeNull();
        bound.Counties.Should().BeEmpty();
    }
}
