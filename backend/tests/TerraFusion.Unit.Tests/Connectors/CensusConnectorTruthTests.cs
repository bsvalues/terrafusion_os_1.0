using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Data.Connectors;
using Xunit;

namespace TerraFusion.Unit.Tests.Connectors;

/// <summary>
/// WO-WAL-001F — public-source connector truth.
///
/// Proves that the Census ACS connector reports health only from an observed probe, and that it
/// fails closed instead of presenting an unimplemented read as an empty success. Every test here is
/// offline: the unreachable-source case targets a closed loopback port so no external request is made.
/// </summary>
public sealed class CensusConnectorTruthTests
{
    private const string ClosedLoopbackBaseUrl = "http://127.0.0.1:9/data";

    private static CensusConnector BuildConnector(string? apiKey, string? baseUrl)
    {
        var settings = new Dictionary<string, string?>();
        if (apiKey is not null)
        {
            settings["Connectors:Census:ApiKey"] = apiKey;
        }

        if (baseUrl is not null)
        {
            settings["Connectors:Census:BaseUrl"] = baseUrl;
        }

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(settings)
            .Build();

        return new CensusConnector(NullLogger<CensusConnector>.Instance, configuration);
    }

    [Fact]
    public async Task TestConnectionAsync_WithoutApiKey_ReportsSourceUnavailable()
    {
        var connector = BuildConnector(apiKey: null, baseUrl: "https://api.census.gov/data");

        var healthy = await connector.TestConnectionAsync();

        Assert.False(healthy);
    }

    [Fact]
    public async Task ConnectAsync_WithoutApiKey_DoesNotClaimConnected()
    {
        var connector = BuildConnector(apiKey: null, baseUrl: "https://api.census.gov/data");

        await connector.ConnectAsync();

        Assert.False(connector.IsConnected);
    }

    [Fact]
    public async Task TestConnectionAsync_WithUnreachableSource_ReportsSourceUnavailable()
    {
        var connector = BuildConnector(apiKey: "not-a-real-key", baseUrl: ClosedLoopbackBaseUrl);

        var healthy = await connector.TestConnectionAsync();

        Assert.False(healthy);
    }

    [Fact]
    public async Task ConnectAsync_WithUnreachableSource_DoesNotClaimConnected()
    {
        var connector = BuildConnector(apiKey: "not-a-real-key", baseUrl: ClosedLoopbackBaseUrl);

        await connector.ConnectAsync();

        Assert.False(connector.IsConnected);
    }

    [Fact]
    public async Task FetchAsync_FailsClosed_InsteadOfReportingAnEmptySuccess()
    {
        var connector = BuildConnector(apiKey: "not-a-real-key", baseUrl: ClosedLoopbackBaseUrl);

        var query = new ConnectorQuery("Demographics", "state:53");

        await Assert.ThrowsAsync<NotSupportedException>(
            () => connector.FetchAsync(query));
    }

    [Fact]
    public void GetSchemaAsync_KeepsAdvertisedIdentity()
    {
        var connector = BuildConnector(apiKey: null, baseUrl: "https://api.census.gov/data");

        var schema = connector.GetSchemaAsync().GetAwaiter().GetResult();

        Assert.Equal("census-acs", schema.ConnectorName);
        Assert.NotEmpty(schema.Entities);
    }

    [Theory]
    [InlineData("https://api.census.gov/data/invalid_key.html", true)]
    [InlineData("https://api.census.gov/data/missing_key.html", true)]
    [InlineData("https://api.census.gov/data/2023/acs/acs5?get=NAME&for=state:53", false)]
    [InlineData("", false)]
    [InlineData(null, false)]
    public void IsSourceRejectionUri_DetectsCensusKeyRejectionPages(string? uri, bool expected)
    {
        Assert.Equal(expected, CensusConnector.IsSourceRejectionUri(uri));
    }
}
