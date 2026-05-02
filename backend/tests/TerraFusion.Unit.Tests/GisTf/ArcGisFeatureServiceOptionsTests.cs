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
        var bentonId = "19190019-1919-1919-1919-191919191919";
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"ArcGisFeatureServices:Counties:{bentonId}:ParcelFeatureServiceUrl"]
                    = "https://services.arcgis.com/abc123/arcgis/rest/services/BentonParcels/FeatureServer/0",
                [$"ArcGisFeatureServices:Counties:{bentonId}:ApnAttributeName"] = "ParcelNum",
                [$"ArcGisFeatureServices:Counties:{bentonId}:RequestTimeoutSeconds"] = "60",
            })
            .Build();

        var services = new ServiceCollection();
        services.Configure<ArcGisFeatureServiceOptions>(
            configuration.GetSection(ArcGisFeatureServiceOptions.SectionName));
        var provider = services.BuildServiceProvider();
        var bound = provider.GetRequiredService<IOptions<ArcGisFeatureServiceOptions>>().Value;

        bound.Counties.Should().HaveCount(1);
        var county = bound.GetForCounty(Guid.Parse(bentonId));
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
        var countyA = "19190019-1919-1919-1919-191919191919";
        var countyB = "20200020-2020-2020-2020-202020202020";
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
        bound.GetForCounty(Guid.Parse(countyA))!.BearerToken.Should().BeNull();
        bound.GetForCounty(Guid.Parse(countyB))!.BearerToken.Should().Be("secret-b");
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

        bound.GetForCounty(Guid.NewGuid()).Should().BeNull();
    }

    [Fact]
    public void GetForCounty_IsCaseInsensitive_OnGuidString()
    {
        // Configuration keys may arrive in upper or lower case;
        // GetForCounty must be tolerant.
        var bentonId = Guid.Parse("19190019-1919-1919-1919-191919191919");
        var upperKey = bentonId.ToString().ToUpperInvariant();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                [$"ArcGisFeatureServices:Counties:{upperKey}:ParcelFeatureServiceUrl"]
                    = "https://example/FeatureServer/0",
            })
            .Build();

        var services = new ServiceCollection();
        services.Configure<ArcGisFeatureServiceOptions>(
            configuration.GetSection(ArcGisFeatureServiceOptions.SectionName));
        var provider = services.BuildServiceProvider();
        var bound = provider.GetRequiredService<IOptions<ArcGisFeatureServiceOptions>>().Value;

        bound.GetForCounty(bentonId).Should().NotBeNull();
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
