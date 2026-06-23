using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.GIS.ArcGisRest;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyArcGisRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyArcGisRaw;

/// <summary>
/// Slice D1 acceptance tests. Proves the four R-* gates and the
/// doctrine invariants for raw ArcGIS landing:
///  - LoadBatch records SourceFamily = ARCGIS_REST
///  - every landed row carries LoadBatchId + SourceQueryHash + SourceRowHash
///  - duplicate (CountyId, ArcGisObjectId) tuples surface via the
///    key-uniqueness gate
///  - empty FeatureService responses still complete cleanly with
///    PASS gates
///  - aggregate gate sums AreaSqFt
///  - a transport failure from the G1-C client closes the batch as
///    FAILED with an error summary, no rows landed
///  - re-running with the same county creates a new LoadBatch
///    (different GUID); old batches are NOT cleared (truth-promotion
///    handles latest-wins)
/// </summary>
public sealed class ArcGisRawLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public ArcGisRawLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"d1-{Guid.NewGuid():N}")
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

    private ArcGisRawLandingService BuildService(IArcGisFeatureServiceClient client)
        => new(_db, client, NullLogger<ArcGisRawLandingService>.Instance);

    private static ArcGisParcelFeature Feature(
        Guid countyId, long objectId,
        string? apn = "1234-001",
        string? geomWkt = null,
        double centroidLat = 46.21,
        double centroidLon = -119.13,
        double areaSqFt = 8500.0,
        string serviceUrl = "https://services.arcgis.com/test/Parcels/FeatureServer/0")
    {
        return new ArcGisParcelFeature
        {
            CountyId = countyId,
            ArcGisObjectId = objectId,
            ArcGisApn = apn,
            GeomWkt = geomWkt ??
                "POLYGON((-119.13 46.21,-119.12 46.21,-119.12 46.22,-119.13 46.22,-119.13 46.21))",
            CentroidLat = centroidLat,
            CentroidLon = centroidLon,
            AreaSqFt = areaSqFt,
            SourceServiceUrl = serviceUrl,
        };
    }

    // ─────────────────────────────────────────────────────────────────
    // Acceptance tests
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HappyPath_LandsAllFeatures_WithFullProvenance()
    {
        var countyId = Guid.NewGuid();
        var client = new FakeClient(
            Feature(countyId, 1, apn: "100-001"),
            Feature(countyId, 2, apn: "100-002"),
            Feature(countyId, 3, apn: "100-003"));

        var result = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        result.Status.Should().Be("COMPLETED");
        result.FeaturesConsidered.Should().Be(3);
        result.FeaturesLanded.Should().Be(3);
        result.DuplicateObjectIds.Should().Be(0);

        var landed = await _db.LegacyArcGisRawParcelGeoms.ToListAsync();
        landed.Should().HaveCount(3);
        landed.Should().AllSatisfy(r =>
        {
            r.LoadBatchId.Should().NotBe(Guid.Empty);
            r.SourceQueryHash.Should().NotBeNullOrEmpty();
            r.SourceRowHash.Should().NotBeNullOrEmpty();
            r.SourceRowHash.Length.Should().Be(16,
                "row hash is SHA-256 truncated to 16 hex chars per D0 spec");
            r.CountyId.Should().Be(countyId);
        });
        landed.Select(r => r.ArcGisObjectId).Should().BeEquivalentTo(new long[] { 1, 2, 3 });
    }

    [Fact]
    public async Task LoadBatch_CarriesArcGisRestSourceFamily()
    {
        var countyId = Guid.NewGuid();
        var client = new FakeClient(Feature(countyId, 1));

        var result = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.LoadBatchId.Should().Be(result.LoadBatchId);
        batch.SourceFamily.Should().Be(SourceFamilies.ArcGisRest,
            "D1 LoadBatch must use SourceFamily = ARCGIS_REST per the v1.0 doctrine");
        batch.Status.Should().Be("COMPLETED");
        SourceFamilies.IsKnown(batch.SourceFamily).Should().BeTrue();
    }

    [Fact]
    public async Task LandedRows_PreserveAllFeatureFields_Verbatim()
    {
        var countyId = Guid.NewGuid();
        var feature = Feature(
            countyId,
            objectId: 42,
            apn: "ABC-001-002",
            geomWkt: "POLYGON((0 0,1 0,1 1,0 1,0 0))",
            centroidLat: 46.5,
            centroidLon: -119.25,
            areaSqFt: 12345.67);
        var client = new FakeClient(feature);

        await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        var landed = await _db.LegacyArcGisRawParcelGeoms.SingleAsync();
        landed.ArcGisObjectId.Should().Be(42);
        landed.ArcGisApn.Should().Be("ABC-001-002");
        landed.GeomWkt.Should().Be("POLYGON((0 0,1 0,1 1,0 1,0 0))");
        landed.CentroidLat.Should().Be(46.5);
        landed.CentroidLon.Should().Be(-119.25);
        landed.AreaSqFt.Should().Be(12345.67);
        landed.SourceServiceUrl.Should()
            .Be("https://services.arcgis.com/test/Parcels/FeatureServer/0");
    }

    [Fact]
    public async Task NullApn_LandsAsNull_NotEmptyString()
    {
        // Some county FeatureServices don't expose an APN attribute.
        // The landing layer must preserve null verbatim (D3 will
        // quarantine the resulting canonical row).
        var countyId = Guid.NewGuid();
        var client = new FakeClient(Feature(countyId, 1, apn: null));

        await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        var landed = await _db.LegacyArcGisRawParcelGeoms.SingleAsync();
        landed.ArcGisApn.Should().BeNull();
    }

    [Fact]
    public async Task DuplicateObjectIds_FailsKeyUniquenessGate()
    {
        // The G1-C client should never emit duplicates within a
        // single response — but if it does, the gate catches it
        // before downstream layers compound the error.
        var countyId = Guid.NewGuid();
        var client = new FakeClient(
            Feature(countyId, 1),
            Feature(countyId, 1, apn: "duplicate-of-1"),
            Feature(countyId, 2));

        var result = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        result.Status.Should().Be("COMPLETED");
        result.FeaturesConsidered.Should().Be(3);
        result.FeaturesLanded.Should().Be(3);
        result.DuplicateObjectIds.Should().Be(1,
            "ObjectId=1 appears twice; one duplicate violation");

        var keyGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "arcgis-raw-key-uniqueness");
        keyGate.Status.Should().Be("FAIL");
        keyGate.Actual.Should().Be("1");
        keyGate.Detail.Should().Contain("appeared more than once");
    }

    [Fact]
    public async Task SameObjectId_DifferentCounties_IsAllowed()
    {
        // ObjectIDs are per-service. Same number in different
        // counties is a different physical feature; the gate must
        // not fire.
        var benton = Guid.NewGuid();
        var franklin = Guid.NewGuid();
        var client = new FakeClient(
            Feature(benton, 1, apn: "benton-1"),
            Feature(franklin, 1, apn: "franklin-1"));

        var result = await BuildService(client).LandParcelGeomsAsync("53005", benton, "d1-test", topN: null);

        result.DuplicateObjectIds.Should().Be(0,
            "(benton,1) and (franklin,1) are distinct natural keys");

        var keyGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "arcgis-raw-key-uniqueness");
        keyGate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task EmptyResponse_LandsZeroRows_AllGatesPass()
    {
        var countyId = Guid.NewGuid();
        var client = new FakeClient(/* no features */);

        var result = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        result.Status.Should().Be("COMPLETED");
        result.FeaturesConsidered.Should().Be(0);
        result.FeaturesLanded.Should().Be(0);

        (await _db.LegacyArcGisRawParcelGeoms.CountAsync()).Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.LoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(4);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "arcgis-raw-source-batch-completed",
            "arcgis-raw-key-uniqueness",
            "arcgis-raw-provenance-coverage",
            "arcgis-raw-aggregate",
        });
    }

    [Fact]
    public async Task AllFourRStarGatesEmitted_OnSuccess()
    {
        var countyId = Guid.NewGuid();
        var client = new FakeClient(
            Feature(countyId, 1, areaSqFt: 1000.0),
            Feature(countyId, 2, areaSqFt: 2000.0));

        var result = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.LoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(4);
        gates.Should().AllSatisfy(g =>
        {
            g.GateStage.Should().Be("SOURCE_TO_RAW");
            g.LoadBatchId.Should().Be(result.LoadBatchId);
        });
    }

    [Fact]
    public async Task AggregateGate_RecordsAreaSqFtSum()
    {
        var countyId = Guid.NewGuid();
        var client = new FakeClient(
            Feature(countyId, 1, areaSqFt: 1500.5),
            Feature(countyId, 2, areaSqFt: 2500.25),
            Feature(countyId, 3, areaSqFt: 1000.0));

        var result = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        result.AreaSqFtSum.Should().BeApproximately(5000.75, 0.01);

        var aggregate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "arcgis-raw-aggregate");
        aggregate.Status.Should().Be("PASS");
        aggregate.Detail.Should().Contain("considered=3");
        aggregate.Detail.Should().Contain("landed=3");
        aggregate.Detail.Should().Contain("areaSqFtSum=5000.75");
    }

    [Fact]
    public async Task ProvenanceCoverageGate_PassesWhenAllRowsHaveAllThreeProvenanceFields()
    {
        var countyId = Guid.NewGuid();
        var client = new FakeClient(
            Feature(countyId, 1),
            Feature(countyId, 2));

        var result = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "arcgis-raw-provenance-coverage");
        gate.Status.Should().Be("PASS");
        gate.Actual.Should().Be("0");
        gate.Detail.Should().Contain("all 2 landed rows");
    }

    [Fact]
    public async Task TransportFailure_ClosesBatchAsFailed_LandsZeroRows()
    {
        var countyId = Guid.NewGuid();
        var client = new FakeClient(throwOnFetch: true);

        var result = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-test", topN: null);

        result.Status.Should().Be("FAILED");
        result.FeaturesConsidered.Should().Be(0);
        result.FeaturesLanded.Should().Be(0);
        result.ErrorSummary.Should().Contain("ArcGisFeatureServiceTransportException");

        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");
        batch.ErrorSummary.Should().NotBeNullOrEmpty();
        (await _db.LegacyArcGisRawParcelGeoms.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task RerunSameCounty_CreatesNewBatch_DoesNotClearOldRows()
    {
        // D1's idempotency model is "new batch every run, old rows
        // stay in place; D2 collapses to latest". Verify both batches
        // produce rows + both batches close cleanly.
        var countyId = Guid.NewGuid();
        var client = new FakeClient(
            Feature(countyId, 1, apn: "100-001"),
            Feature(countyId, 2, apn: "100-002"));

        var run1 = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-run1", topN: null);
        var run2 = await BuildService(client).LandParcelGeomsAsync("53005", countyId, "d1-run2", topN: null);

        run1.LoadBatchId.Should().NotBe(run2.LoadBatchId,
            "every run gets a fresh batch id");

        // Both runs landed 2 rows each → 4 total in raw.
        (await _db.LegacyArcGisRawParcelGeoms.CountAsync()).Should().Be(4);

        // Each (CountyId, ArcGisObjectId, LoadBatchId) is unique
        // (the natural-key invariant), but (CountyId, ArcGisObjectId)
        // appears twice — once per batch.
        var batchCounts = await _db.LegacyArcGisRawParcelGeoms
            .GroupBy(r => r.LoadBatchId)
            .Select(g => g.Count())
            .ToListAsync();
        batchCounts.Should().BeEquivalentTo(new[] { 2, 2 });

        // Both batches closed COMPLETED.
        var statuses = await _db.SyncBridgeLoadBatches
            .Select(b => b.Status)
            .ToListAsync();
        statuses.Should().AllBeEquivalentTo("COMPLETED");
    }

    // ─────────────────────────────────────────────────────────────────
    // Test doubles
    // ─────────────────────────────────────────────────────────────────

    private sealed class FakeClient : IArcGisFeatureServiceClient
    {
        private readonly IReadOnlyList<ArcGisParcelFeature> _features;
        private readonly bool _throwOnFetch;

        public FakeClient(params ArcGisParcelFeature[] features)
        {
            _features = features;
            _throwOnFetch = false;
        }

        public FakeClient(bool throwOnFetch)
        {
            _features = Array.Empty<ArcGisParcelFeature>();
            _throwOnFetch = throwOnFetch;
        }

        public Task<IReadOnlyList<ArcGisParcelFeature>> FetchParcelsAsync(
            string fipsCode,
            Guid countyId,
            int? topN,
            CancellationToken cancellationToken = default)
        {
            if (_throwOnFetch)
            {
                throw new ArcGisFeatureServiceTransportException(
                    "simulated transport failure for D1 acceptance test");
            }
            return Task.FromResult(_features);
        }

        public Task<(IReadOnlyList<ArcGisParcelFeature> Features, bool ExceededLimit)> FetchPageAsync(
            string fipsCode, Guid countyId, int offset, int pageSize, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();

        public Task<int> FetchCountAsync(string fipsCode, CancellationToken cancellationToken = default)
            => throw new NotImplementedException();
    }
}
