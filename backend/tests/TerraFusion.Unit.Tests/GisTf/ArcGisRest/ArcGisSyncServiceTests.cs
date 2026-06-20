using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.GIS.ArcGisRest;
using TerraFusion.Data;
using TerraFusion.Data.Services.GisTf;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf.ArcGisRest;

/// <summary>
/// Slice G1-D-1 acceptance tests. Proves:
///  - first sync inserts geometry rows
///  - second identical sync is idempotent (no duplicate rows, no
///    duplicate source_xref entries)
///  - features absent on a later sync are soft-deleted
///  - LoadBatch is opened with SourceFamily=ARCGIS_REST and closed
///    COMPLETED on success
///  - every active tf_parcel_geom has a source_xref
///  - transport failure marks LoadBatch FAILED with sanitized summary
/// </summary>
public sealed class ArcGisSyncServiceTests : IDisposable
{
    private static readonly Guid BentonId =
        Guid.Parse("19190019-1919-1919-1919-191919191919");

    private readonly TerraFusionDbContext _db;

    public ArcGisSyncServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"gis-tf-sync-{Guid.NewGuid():N}")
            .Options;
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = "InMemory",
            })
            .Build();
        _db = new TerraFusionDbContext(options, configuration);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private ArcGisSyncService BuildService(IArcGisFeatureServiceClient client)
        => new(_db, client, NullLogger<ArcGisSyncService>.Instance);

    private static ArcGisParcelFeature MakeFeature(long objectId, string apn)
        => new()
        {
            CountyId = BentonId,
            ArcGisObjectId = objectId,
            ArcGisApn = apn,
            GeomWkt = "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))",
            CentroidLat = 0.5,
            CentroidLon = 0.5,
            AreaSqFt = 100.0,
            SourceServiceUrl = "https://example.org/FeatureServer/0",
        };

    [Fact]
    public async Task FirstSync_InsertsGeometryRows_AndOpensCompletedLoadBatch()
    {
        var client = new FakeArcGisClient(new[]
        {
            MakeFeature(1, "APN-1"),
            MakeFeature(2, "APN-2"),
        });
        var svc = BuildService(client);

        var result = await svc.SyncCountyAsync("53005", BentonId, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.FeaturesFetched.Should().Be(2);
        result.FeaturesUpserted.Should().Be(2);
        result.FeaturesSoftDeleted.Should().Be(0);

        (await _db.TfParcelGeoms.CountAsync()).Should().Be(2);
        (await _db.TfParcelGeoms.CountAsync(g => g.IsActive)).Should().Be(2);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.SourceFamily.Should().Be(SourceFamilies.ArcGisRest);
        batch.Status.Should().Be("COMPLETED");
        batch.RowsExtracted.Should().Be(2);
        batch.RowsPromoted.Should().Be(2);
        batch.CompletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task SecondIdenticalSync_IsIdempotent()
    {
        var fixedFeatures = new[]
        {
            MakeFeature(1, "APN-1"),
            MakeFeature(2, "APN-2"),
        };
        var client = new FakeArcGisClient(fixedFeatures);
        var svc = BuildService(client);

        await svc.SyncCountyAsync("53005", BentonId, "test-op");
        await svc.SyncCountyAsync("53005", BentonId, "test-op");

        // Two batches; one row-set; one source_xref per geometry.
        (await _db.SyncBridgeLoadBatches.CountAsync()).Should().Be(2);
        (await _db.TfParcelGeoms.CountAsync()).Should().Be(2);

        var xrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == "parcel_geom")
            .ToListAsync();
        xrefs.Should().HaveCount(2,
            "source_xref must be one row per (CountyId, ArcGisObjectId), not per sync run");
    }

    [Fact]
    public async Task FeatureAbsentOnLaterSync_IsSoftDeleted()
    {
        // Run 1: two features.
        var clientA = new FakeArcGisClient(new[]
        {
            MakeFeature(1, "APN-1"),
            MakeFeature(2, "APN-2"),
        });
        await BuildService(clientA).SyncCountyAsync("53005", BentonId, "test-op");

        // Run 2: only feature 1 remains in source.
        var clientB = new FakeArcGisClient(new[]
        {
            MakeFeature(1, "APN-1-renamed"),
        });
        var result = await BuildService(clientB).SyncCountyAsync("53005", BentonId, "test-op");

        result.FeaturesUpserted.Should().Be(1);
        result.FeaturesSoftDeleted.Should().Be(1);

        var rows = await _db.TfParcelGeoms.OrderBy(g => g.ArcGisObjectId).ToListAsync();
        rows.Should().HaveCount(2);
        rows[0].IsActive.Should().BeTrue();
        rows[0].ArcGisApn.Should().Be("APN-1-renamed");
        rows[1].IsActive.Should().BeFalse(); // soft-deleted
    }

    [Fact]
    public async Task EveryActiveGeomRow_HasSourceXref_AfterSync()
    {
        var client = new FakeArcGisClient(new[]
        {
            MakeFeature(10, "X"),
            MakeFeature(20, "Y"),
            MakeFeature(30, "Z"),
        });
        await BuildService(client).SyncCountyAsync("53005", BentonId, "test-op");

        var activeIds = await _db.TfParcelGeoms
            .Where(g => g.IsActive)
            .Select(g => g.TfParcelGeomId)
            .ToListAsync();
        activeIds.Should().HaveCount(3);

        foreach (var id in activeIds)
        {
            var xref = await _db.SyncBridgeSourceXrefs.FirstOrDefaultAsync(
                x => x.TfEntityType == "parcel_geom" && x.TfEntityId == id);
            xref.Should().NotBeNull(
                $"every active tf_parcel_geom row must have a source_xref (failed: {id})");
            xref!.SourceSystem.Should().Be("ARCGIS_REST");
            xref.SourceKeyJson.Should().Contain("arcgis_object_id");
        }

        var coverageGate = await _db.SyncBridgePromotionGateResults
            .FirstAsync(g => g.GateName == "gis-tf:source-xref-coverage");
        coverageGate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task SyncRecordsCompletionGate_OnSuccess()
    {
        var client = new FakeArcGisClient(new[] { MakeFeature(1, "X") });
        await BuildService(client).SyncCountyAsync("53005", BentonId, "test-op");

        var completionGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "gis-tf:arcgis-sync-completion");
        completionGate.Status.Should().Be("PASS");
        completionGate.Detail.Should().Contain("upserted=1");
    }

    [Fact]
    public async Task TransportFailure_MarksLoadBatchFailed_AndRecordsGate()
    {
        var client = new FailingArcGisClient(
            new ArcGisFeatureServiceTransportException("simulated 500"));
        var svc = BuildService(client);

        var result = await svc.SyncCountyAsync("53005", BentonId, "test-op");

        result.Status.Should().Be("FAILED");
        result.ErrorSummary.Should().Contain("simulated 500");

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        batch.ErrorSummary.Should().Contain("ArcGisFeatureServiceTransportException");
        batch.CompletedAt.Should().NotBeNull();

        var failGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "gis-tf:arcgis-sync-completion");
        failGate.Status.Should().Be("FAIL");

        // No geometry rows were written.
        (await _db.TfParcelGeoms.CountAsync()).Should().Be(0);
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task ConfigurationFailure_AlsoMarksLoadBatchFailed()
    {
        var client = new FailingArcGisClient(
            new ArcGisFeatureServiceConfigurationException("no county bound"));
        var svc = BuildService(client);

        var result = await svc.SyncCountyAsync("53005", BentonId, "test-op");

        result.Status.Should().Be("FAILED");
        result.ErrorSummary.Should().Contain("no county bound");

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakeArcGisClient : IArcGisFeatureServiceClient
    {
        private readonly IReadOnlyList<ArcGisParcelFeature> _features;
        public FakeArcGisClient(IEnumerable<ArcGisParcelFeature> features)
            => _features = features.ToList();
        public Task<IReadOnlyList<ArcGisParcelFeature>> FetchParcelsAsync(
            string fipsCode, Guid countyId, int? topN, CancellationToken cancellationToken = default)
            => Task.FromResult(_features);
    }

    private sealed class FailingArcGisClient : IArcGisFeatureServiceClient
    {
        private readonly Exception _ex;
        public FailingArcGisClient(Exception ex) => _ex = ex;
        public Task<IReadOnlyList<ArcGisParcelFeature>> FetchParcelsAsync(
            string fipsCode, Guid countyId, int? topN, CancellationToken cancellationToken = default)
            => Task.FromException<IReadOnlyList<ArcGisParcelFeature>>(_ex);
    }
}
