using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthArcGis;
using TerraFusion.Data;
using TerraFusion.Data.Services.GisTf;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf;

/// <summary>
/// Slice D3 acceptance tests. Proves the five C-* gates + the
/// canonical-projection doctrine invariants for ArcGIS parcel
/// geometry:
///
///  - source-batch-completed: refuse projection when any
///    contributing truth batch is FAILED / IN_PROGRESS
///  - source-xref-coverage: every projected tf_parcel_geom has
///    a sync_bridge.source_xref entry
///    (TfEntityType="geom_parcel")
///  - county-isolation: every projected row has a non-empty
///    CountyId
///  - apn-crosswalk-coverage (informational): records resolved
///    vs unresolved APN matches against tf_parcel.ParcelNumber
///  - aggregate (informational): counts + AreaSqFt sum
///  - idempotent on rerun: prior canonical rows for the
///    county's tuples clear before re-insert
/// </summary>
public sealed class ArcGisCanonicalProjectorTests : IDisposable
{
    private const string GeomEntityType = "geom_parcel";

    private readonly TerraFusionDbContext _db;

    public ArcGisCanonicalProjectorTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"d3-{Guid.NewGuid():N}")
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

    private ArcGisCanonicalProjector BuildService()
        => new(_db, NullLogger<ArcGisCanonicalProjector>.Instance);

    private async Task<Guid> SeedTruthBatchAsync(string status = "COMPLETED")
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "arcgis-truth-promoter",
            SourceFileOrDatabase = "test",
            SourceQueryHash = "qh",
            Operator = "test",
            Status = status,
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = status == "COMPLETED" ? DateTime.UtcNow.AddMinutes(-1) : null,
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task SeedTruthAsync(
        Guid countyId,
        long objectId,
        Guid promotionBatchId,
        string? apn = "100-001",
        double areaSqFt = 1000.0)
    {
        _db.TruthArcGisParcelGeomCurrents.Add(new TruthArcGisParcelGeomCurrent
        {
            CountyId = countyId,
            ArcGisObjectId = objectId,
            ArcGisApn = apn,
            GeomWkt = "POLYGON((0 0,1 0,1 1,0 1,0 0))",
            CentroidLat = 46.21,
            CentroidLon = -119.13,
            AreaSqFt = areaSqFt,
            SourceServiceUrl = "https://services.arcgis.com/test/Parcels/FeatureServer/0",
            SourceLandedRowId = Guid.NewGuid(),
            LandingLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
            PromotedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
    }

    private async Task<Guid> SeedTfParcelAsync(Guid countyId, string parcelNumber)
    {
        var p = new TfParcel
        {
            CountyId = countyId,
            ParcelNumber = parcelNumber,
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
        };
        _db.TfParcels.Add(p);
        await _db.SaveChangesAsync();
        return p.TfParcelId;
    }

    // ─────────────────────────────────────────────────────────────────
    // Acceptance tests
    // ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task HappyPath_ProjectsTruthRows_WithSourceXref()
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        var parcelId = await SeedTfParcelAsync(countyId, "100-001");
        await SeedTruthAsync(countyId, 1, truthBatch, apn: "100-001");

        var result = await BuildService().ProjectCountyAsync(countyId, "d3-test");

        result.Status.Should().Be("COMPLETED");
        result.TruthRowsConsidered.Should().Be(1);
        result.RowsProjected.Should().Be(1);
        result.ApnCrosswalkResolved.Should().Be(1);
        result.ApnCrosswalkUnresolved.Should().Be(0);

        // Canonical row written.
        var geom = await _db.TfParcelGeoms.SingleAsync();
        geom.CountyId.Should().Be(countyId);
        geom.ArcGisObjectId.Should().Be(1);
        geom.ArcGisApn.Should().Be("100-001");
        geom.TfParcelId.Should().Be(parcelId,
            "APN '100-001' resolved against tf_parcel.ParcelNumber");

        // source_xref written with correct TfEntityType + key shape.
        var xref = await _db.SyncBridgeSourceXrefs
            .SingleAsync(x => x.TfEntityType == GeomEntityType);
        xref.TfEntityId.Should().Be(geom.TfParcelGeomId);
        using var doc = JsonDocument.Parse(xref.SourceKeyJson);
        doc.RootElement.GetProperty("county_id").GetString().Should().Be(countyId.ToString());
        doc.RootElement.GetProperty("arcgis_object_id").GetInt64().Should().Be(1);
    }

    [Fact]
    public async Task UnresolvedApn_ProjectsWithNullTfParcelId()
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        // No tf_parcel for "999-XYZ".
        await SeedTruthAsync(countyId, 1, truthBatch, apn: "999-XYZ");

        var result = await BuildService().ProjectCountyAsync(countyId, "d3-test");

        result.RowsProjected.Should().Be(1);
        result.ApnCrosswalkResolved.Should().Be(0);
        result.ApnCrosswalkUnresolved.Should().Be(1);

        var geom = await _db.TfParcelGeoms.SingleAsync();
        geom.TfParcelId.Should().BeNull(
            "TfParcelGeom permits crosswalk-pending state per v1.0 entity schema");

        var coverageGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-geom-apn-crosswalk-coverage");
        coverageGate.Detail.Should().Contain("apnUnresolved=1");
    }

    [Fact]
    public async Task NullApn_ProjectsWithNullTfParcelId()
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        await SeedTruthAsync(countyId, 1, truthBatch, apn: null);

        var result = await BuildService().ProjectCountyAsync(countyId, "d3-test");

        result.RowsProjected.Should().Be(1);
        result.ApnCrosswalkUnresolved.Should().Be(1);

        var geom = await _db.TfParcelGeoms.SingleAsync();
        geom.TfParcelId.Should().BeNull();
        geom.ArcGisApn.Should().BeNull();
    }

    [Fact]
    public async Task FailedTruthBatch_RefusesProjection()
    {
        var countyId = Guid.NewGuid();
        var failedBatch = await SeedTruthBatchAsync("FAILED");
        await SeedTruthAsync(countyId, 1, failedBatch);

        var result = await BuildService().ProjectCountyAsync(countyId, "d3-test");

        result.Status.Should().Be("REFUSED");
        result.RowsProjected.Should().Be(0);
        (await _db.TfParcelGeoms.CountAsync()).Should().Be(0);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-geom-source-batch-completed");
        gate.Status.Should().Be("FAIL");
    }

    [Fact]
    public async Task EveryProjectedGeom_HasSourceXref_AndNonEmptyCountyId()
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        await SeedTruthAsync(countyId, 1, truthBatch);
        await SeedTruthAsync(countyId, 2, truthBatch);
        await SeedTruthAsync(countyId, 3, truthBatch);

        var result = await BuildService().ProjectCountyAsync(countyId, "d3-test");

        result.RowsProjected.Should().Be(3);

        // All canonical rows have CountyId.
        var geoms = await _db.TfParcelGeoms.ToListAsync();
        geoms.Should().AllSatisfy(g => g.CountyId.Should().NotBe(Guid.Empty));

        // All canonical rows have a source_xref.
        var geomIds = geoms.Select(g => g.TfParcelGeomId).ToList();
        var xrefIds = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == GeomEntityType
                        && geomIds.Contains(x.TfEntityId))
            .Select(x => x.TfEntityId)
            .ToListAsync();
        xrefIds.Should().HaveCount(3);
        xrefIds.Should().BeEquivalentTo(geomIds);

        // Source-xref-coverage + county-isolation gates PASS.
        var xrefGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-geom-source-xref-coverage");
        xrefGate.Status.Should().Be("PASS");
        var isolationGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-geom-county-isolation");
        isolationGate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FiveCStarGatesEmitted_OnSuccess()
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        await SeedTruthAsync(countyId, 1, truthBatch);

        var result = await BuildService().ProjectCountyAsync(countyId, "d3-test");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(5);
        gates.Should().AllSatisfy(g => g.GateStage.Should().Be("TRUTH_TO_CANONICAL"));
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "canonical-geom-source-batch-completed",
            "canonical-geom-source-xref-coverage",
            "canonical-geom-county-isolation",
            "canonical-geom-apn-crosswalk-coverage",
            "canonical-geom-aggregate",
        });
    }

    [Fact]
    public async Task RerunSameCounty_ClearsPriorCanonical_AndRePromotes()
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        await SeedTruthAsync(countyId, 1, truthBatch);
        await SeedTruthAsync(countyId, 2, truthBatch);

        var run1 = await BuildService().ProjectCountyAsync(countyId, "d3-run1");
        run1.RowsProjected.Should().Be(2);
        run1.PriorCanonicalRowsRemoved.Should().Be(0);

        var run2 = await BuildService().ProjectCountyAsync(countyId, "d3-run2");
        run2.RowsProjected.Should().Be(2);
        run2.PriorCanonicalRowsRemoved.Should().Be(2,
            "second run cleans up the 2 canonical rows from run 1 before re-inserting");

        // Final state: 2 canonical rows, no duplicates.
        (await _db.TfParcelGeoms.CountAsync()).Should().Be(2);
        (await _db.SyncBridgeSourceXrefs
            .CountAsync(x => x.TfEntityType == GeomEntityType)).Should().Be(2);
    }

    [Fact]
    public async Task CountyIsolation_ProjectingOne_DoesNotTouchOther()
    {
        var benton = Guid.NewGuid();
        var franklin = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        await SeedTruthAsync(benton, 1, truthBatch, apn: "benton-1");
        await SeedTruthAsync(benton, 2, truthBatch, apn: "benton-2");
        await SeedTruthAsync(franklin, 1, truthBatch, apn: "franklin-1");

        var bentonRun = await BuildService().ProjectCountyAsync(benton, "d3-test");
        bentonRun.RowsProjected.Should().Be(2);

        var franklinRun = await BuildService().ProjectCountyAsync(franklin, "d3-test");
        franklinRun.RowsProjected.Should().Be(1);
        franklinRun.PriorCanonicalRowsRemoved.Should().Be(0,
            "projecting Franklin must NOT clear Benton's canonical rows");

        (await _db.TfParcelGeoms.CountAsync()).Should().Be(3);
        (await _db.TfParcelGeoms.CountAsync(g => g.CountyId == benton)).Should().Be(2);
        (await _db.TfParcelGeoms.CountAsync(g => g.CountyId == franklin)).Should().Be(1);
    }

    [Fact]
    public async Task EmptyCounty_ProjectsCleanly_FivePassGates()
    {
        var countyId = Guid.NewGuid();
        // No truth rows for this county.

        var result = await BuildService().ProjectCountyAsync(countyId, "d3-test");

        result.Status.Should().Be("COMPLETED");
        result.TruthRowsConsidered.Should().Be(0);
        result.RowsProjected.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(5);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
    }

    [Fact]
    public async Task AggregateGate_RecordsAreaSum()
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        await SeedTruthAsync(countyId, 1, truthBatch, areaSqFt: 1500.5);
        await SeedTruthAsync(countyId, 2, truthBatch, areaSqFt: 2500.25);
        await SeedTruthAsync(countyId, 3, truthBatch, areaSqFt: 1000.0);

        var result = await BuildService().ProjectCountyAsync(countyId, "d3-test");

        result.AreaSqFtSum.Should().BeApproximately(5000.75, 0.01);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-geom-aggregate");
        gate.Detail.Should().Contain("projected=3");
        gate.Detail.Should().Contain("areaSqFtSum=5000.75");
    }

    [Fact]
    public async Task SourceXref_UsesGeomParcelEntityType_Per_v1_8()
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        await SeedTruthAsync(countyId, 1, truthBatch);

        await BuildService().ProjectCountyAsync(countyId, "d3-test");

        // The v1.8 contract adds "geom_parcel" to the closed
        // TfEntityType vocabulary. Confirm the projector uses it
        // (and only it).
        var xrefs = await _db.SyncBridgeSourceXrefs.ToListAsync();
        xrefs.Should().NotBeEmpty();
        xrefs.Should().OnlyContain(x => x.TfEntityType == "geom_parcel");
    }
}
