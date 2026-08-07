using FluentAssertions;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Atlas;
using TerraFusion.Core.DTOs.GisTf;
using TerraFusion.Core.GIS.ArcGisRest;
using Xunit;

namespace TerraFusion.Unit.Tests.Atlas;

public sealed class AtlasProjectionConsumerTests
{
    private static readonly Guid CountyA = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB = Guid.Parse("20200020-2020-2020-2020-202020202020");
    private static readonly Guid ParcelId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    [Fact]
    public void Options_AreDefaultDisabled_AndHashPinned()
    {
        var options = new AtlasProjectionOptions();

        options.Mode.Should().Be(AtlasProjectionMode.Disabled);
        AtlasProjectionOptions.ExpectedModuleSha256.Should().Be(
            "3ef3d5cfc666f8a27a17510572a376b71d33fa29e796ff79b70abe7e7752ae46");
    }

    [Fact]
    public async Task ProjectAsync_UsesCanonicalPolygonAdapter_AndExactModuleHash()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry(CountyA)));
        var host = new StubHost(CreatePolygonResult());
        var consumer = CreateConsumer(reader, host);

        var result = await consumer.ProjectAsync(CountyA, ParcelId);

        result.Outcome.Should().Be(AtlasProjectionConsumerOutcome.Polygon);
        result.CountyId.Should().Be(CountyA.ToString("D"));
        result.ParcelId.Should().Be(ParcelId.ToString("D"));
        result.EvidenceState.Should().Be("canonical");
        host.CallCount.Should().Be(1);
        Path.IsPathFullyQualified(host.ModulePath!).Should().BeTrue();
        host.ExpectedHash.Should().Be(AtlasProjectionOptions.ExpectedModuleSha256);
        host.ExchangeJson.Should().Contain("\"geometryState\":\"polygon\"");
        host.ExchangeJson.Should().Contain("\"outerRing\"");
    }

    [Fact]
    public async Task ProjectAsync_ReturnsTruthfulUnavailable_WhenCanonicalGeometryIsAbsent()
    {
        var reader = new StubReader(ParcelGeometryLookup.NoGeometry(CountyA));
        var host = new StubHost(CreatePolygonResult());
        var consumer = CreateConsumer(reader, host);

        var result = await consumer.ProjectAsync(CountyA, ParcelId);

        result.Outcome.Should().Be(AtlasProjectionConsumerOutcome.Unavailable);
        result.NormalizedFeatureJson.Should().Be("null");
        result.CountyId.Should().Be(CountyA.ToString("D"));
        result.ParcelId.Should().Be(ParcelId.ToString("D"));
        result.EvidenceState.Should().Be("unavailable");
        host.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task ProjectAsync_HidesCrossCountyExistence_WithoutInvokingHost()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry(CountyA)));
        var host = new StubHost(CreatePolygonResult());
        var consumer = CreateConsumer(reader, host, new StubCountyScopeVerifier(false));

        var result = await consumer.ProjectAsync(CountyB, ParcelId);

        result.Outcome.Should().Be(AtlasProjectionConsumerOutcome.NotFound);
        result.CountyId.Should().BeNull();
        result.ParcelId.Should().BeNull();
        reader.CallCount.Should().Be(0);
        host.CallCount.Should().Be(0);
    }

    [Fact]
    public async Task ProjectAsync_FailsClosed_WhenHostFails()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry(CountyA)));
        var host = new StubHost(new AtlasProjectionProcessResult(
            AtlasProjectionOutcome.Failed,
            AtlasProjectionFailure.SourceHashMismatch,
            null,
            null,
            null,
            null,
            null,
            null,
            "hash mismatch"));
        var consumer = CreateConsumer(reader, host);

        var action = () => consumer.ProjectAsync(CountyA, ParcelId);

        await action.Should().ThrowAsync<AtlasProjectionConsumerException>();
    }

    [Fact]
    public async Task ProjectAsync_FailsClosed_WhenReturnedIdentityDoesNotMatch()
    {
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, CreateGeometry(CountyA)));
        var mismatched = CreatePolygonResult() with { ParcelId = Guid.NewGuid().ToString("D") };
        var consumer = CreateConsumer(reader, new StubHost(mismatched));

        var action = () => consumer.ProjectAsync(CountyA, ParcelId);

        await action.Should().ThrowAsync<AtlasProjectionConsumerException>();
    }

    [Fact]
    public async Task ProjectAsync_FailsClosed_WhenCanonicalWktViolatesFrozenAdapterContract()
    {
        var invalid = CreateGeometry(CountyA) with { GeomWkt = "MULTIPOLYGON EMPTY" };
        var reader = new StubReader(ParcelGeometryLookup.Found(CountyA, invalid));
        var host = new StubHost(CreatePolygonResult());
        var consumer = CreateConsumer(reader, host);

        var action = () => consumer.ProjectAsync(CountyA, ParcelId);

        await action.Should().ThrowAsync<AtlasProjectionConsumerException>();
        host.CallCount.Should().Be(0);
    }

    private static AtlasProjectionConsumer CreateConsumer(
        IParcelGeometryReader reader,
        IAtlasProjectionProcessHost host,
        IAtlasParcelCountyScopeVerifier? countyScopeVerifier = null)
    {
        var modulePath = Path.GetFullPath(Path.Combine(Path.GetTempPath(), "project-atlas-feature.mjs"));
        return new AtlasProjectionConsumer(
            reader,
            countyScopeVerifier ?? new StubCountyScopeVerifier(true),
            host,
            Options.Create(new AtlasProjectionOptions
            {
                Mode = AtlasProjectionMode.LocalExact,
                ModulePath = modulePath,
            }));
    }

    private static ParcelGeometryResponse CreateGeometry(Guid countyId) => new()
    {
        TfParcelId = ParcelId,
        CountyId = countyId,
        GeomWkt = "POLYGON((-119.3 46.2, -119.2 46.2, -119.2 46.3, -119.3 46.3, -119.3 46.2))",
        CentroidLat = 46.25,
        CentroidLon = -119.25,
        AreaSqFt = 50_000.5,
        LastSyncedAt = new DateTime(2026, 5, 2, 12, 0, 0, DateTimeKind.Utc),
        SourceServiceUrl = "https://example.invalid/FeatureServer/0",
        IsActive = true,
    };

    private static AtlasProjectionProcessResult CreatePolygonResult() => new(
        AtlasProjectionOutcome.Polygon,
        AtlasProjectionFailure.None,
        $"{{\"type\":\"Feature\",\"geometry\":{{\"type\":\"Polygon\",\"coordinates\":[]}},\"properties\":{{\"countyId\":\"{CountyA:D}\",\"parcelId\":\"{ParcelId:D}\",\"evidenceState\":\"canonical\"}}}}",
        CountyA.ToString("D"),
        ParcelId.ToString("D"),
        "canonical",
        AtlasProjectionOptions.ExpectedModuleSha256,
        AtlasProjectionOptions.ExpectedModuleSha256,
        null);

    private sealed class StubReader(ParcelGeometryLookup lookup) : IParcelGeometryReader
    {
        public int CallCount { get; private set; }

        public Task<ParcelGeometryLookup> GetGeometryAsync(
            Guid tfParcelId,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            return Task.FromResult(lookup);
        }

        public Task<ParcelNeighborLookup> GetNeighborsAsync(
            Guid tfParcelId,
            double radiusFeet,
            int maxResults,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }

    private sealed class StubCountyScopeVerifier(bool exists) : IAtlasParcelCountyScopeVerifier
    {
        public Task<bool> ExistsInCountyAsync(
            Guid countyId,
            Guid tfParcelId,
            CancellationToken cancellationToken = default) => Task.FromResult(exists);
    }

    private sealed class StubHost(AtlasProjectionProcessResult result) : IAtlasProjectionProcessHost
    {
        public int CallCount { get; private set; }
        public string? ModulePath { get; private set; }
        public string? ExpectedHash { get; private set; }
        public string? ExchangeJson { get; private set; }

        public Task<AtlasProjectionProcessResult> ProjectAsync(
            string modulePath,
            string expectedModuleSha256,
            string spatialReadExchangeJson,
            CancellationToken cancellationToken = default)
        {
            CallCount++;
            ModulePath = modulePath;
            ExpectedHash = expectedModuleSha256;
            ExchangeJson = spatialReadExchangeJson;
            return Task.FromResult(result);
        }
    }
}
