using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthArcGis;
using TerraFusion.Data;
using TerraFusion.Data.Services.GisTf;
using Xunit;

namespace TerraFusion.Unit.Tests.GisTf;

/// <summary>
/// Slice D4: read-model end-to-end verification.
///
/// <para>Per Block-D execution plan §3.4: confirms that a row
/// projected through the v1.8 doctrine pipeline (D3 canonical
/// projector) is reachable via the existing
/// <see cref="ParcelGeometryReader"/> read path. This is the
/// operational closure of Block D — proves that the doctrine
/// pipeline produces canonical state that downstream consumers
/// can actually query.</para>
///
/// <para>The existing
/// <see cref="ParcelGeometryControllerTests"/> covers the
/// controller's contract (200/400/403/404 plus cross-county
/// isolation). D4 adds one integration-shaped test that
/// exercises the full <c>truth_arcgis → D3 → tf_parcel_geom →
/// ParcelGeometryReader</c> path end-to-end, validating that
/// the v1.8 retirement of the legacy BackgroundService doesn't
/// regress the read-model surface.</para>
/// </summary>
public sealed class D4ReadModelEndToEndTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public D4ReadModelEndToEndTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"d4-{Guid.NewGuid():N}")
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

    [Fact]
    public async Task D3Projection_FlowsThroughReader_ToReturnGeometry()
    {
        // ── Arrange: seed a tf_parcel with an APN. ──
        var countyId = Guid.NewGuid();
        var parcel = new TfParcel
        {
            CountyId = countyId,
            ParcelNumber = "100-001",
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
        };
        _db.TfParcels.Add(parcel);
        await _db.SaveChangesAsync();

        // Seed a truth_arcgis row with the matching APN.
        var truthBatch = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "arcgis-truth-promoter",
            SourceFileOrDatabase = "test",
            SourceQueryHash = "qh",
            Operator = "test",
            Status = "COMPLETED",
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
        };
        _db.SyncBridgeLoadBatches.Add(truthBatch);
        await _db.SaveChangesAsync();

        _db.TruthArcGisParcelGeomCurrents.Add(new TruthArcGisParcelGeomCurrent
        {
            CountyId = countyId,
            ArcGisObjectId = 42,
            ArcGisApn = "100-001",
            GeomWkt = "POLYGON((0 0,10 0,10 10,0 10,0 0))",
            CentroidLat = 46.21,
            CentroidLon = -119.13,
            AreaSqFt = 100.0,
            SourceServiceUrl = "https://services.arcgis.com/test/Parcels/FeatureServer/0",
            SourceLandedRowId = Guid.NewGuid(),
            LandingLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = truthBatch.LoadBatchId,
            PromotedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        // ── Act: D3 canonical projection. ──
        var projector = new ArcGisCanonicalProjector(
            _db, NullLogger<ArcGisCanonicalProjector>.Instance);
        var projectionResult = await projector.ProjectCountyAsync(countyId, "d4-test");

        projectionResult.Status.Should().Be("COMPLETED");
        projectionResult.RowsProjected.Should().Be(1);
        projectionResult.ApnCrosswalkResolved.Should().Be(1,
            "the APN '100-001' must crosswalk to tf_parcel via ParcelNumber");

        // ── Assert: the read-model returns the geometry. ──
        var reader = new ParcelGeometryReader(_db);
        var lookup = await reader.GetGeometryAsync(parcel.TfParcelId);

        lookup.Kind.Should().Be(
            TerraFusion.Core.GIS.ArcGisRest.ParcelGeometryLookupKind.Found,
            "D3 projection populated TfParcelId; reader must surface the geometry");
        lookup.CountyId.Should().Be(countyId);
        lookup.Payload.Should().NotBeNull();
        lookup.Payload!.TfParcelId.Should().Be(parcel.TfParcelId);
        lookup.Payload.GeomWkt.Should().Be("POLYGON((0 0,10 0,10 10,0 10,0 0))");
        lookup.Payload.CentroidLat.Should().Be(46.21);
        lookup.Payload.CentroidLon.Should().Be(-119.13);
        lookup.Payload.AreaSqFt.Should().Be(100.0);
        lookup.Payload.IsActive.Should().BeTrue();
        lookup.Payload.SourceServiceUrl.Should()
            .Be("https://services.arcgis.com/test/Parcels/FeatureServer/0");
    }

    [Fact]
    public async Task UnresolvedApn_DoesNotSurface_ViaReader()
    {
        // When D3 projects with TfParcelId = null (APN crosswalk
        // failed), the reader's TfParcelId-keyed lookup must NOT
        // surface those rows. They live in tf_parcel_geom but
        // can only be reached by direct (CountyId, ArcGisObjectId)
        // queries (which are not in the read-model surface today).
        var countyId = Guid.NewGuid();

        // tf_parcel exists for "100-001" but the truth_arcgis row
        // points at "999-XYZ" — no crosswalk match.
        var parcel = new TfParcel
        {
            CountyId = countyId,
            ParcelNumber = "100-001",
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
        };
        _db.TfParcels.Add(parcel);
        await _db.SaveChangesAsync();

        var truthBatch = new LoadBatch
        {
            SourceFamily = SourceFamilies.ArcGisRest,
            SourceSystem = "arcgis-truth-promoter",
            SourceFileOrDatabase = "test",
            SourceQueryHash = "qh",
            Operator = "test",
            Status = "COMPLETED",
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
        };
        _db.SyncBridgeLoadBatches.Add(truthBatch);
        await _db.SaveChangesAsync();

        _db.TruthArcGisParcelGeomCurrents.Add(new TruthArcGisParcelGeomCurrent
        {
            CountyId = countyId,
            ArcGisObjectId = 42,
            ArcGisApn = "999-XYZ", // not in tf_parcel
            GeomWkt = "POLYGON((0 0,1 0,1 1,0 1,0 0))",
            CentroidLat = 46.21,
            CentroidLon = -119.13,
            AreaSqFt = 1.0,
            SourceServiceUrl = "https://services.arcgis.com/test/Parcels/FeatureServer/0",
            SourceLandedRowId = Guid.NewGuid(),
            LandingLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = truthBatch.LoadBatchId,
            PromotedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();

        var projector = new ArcGisCanonicalProjector(
            _db, NullLogger<ArcGisCanonicalProjector>.Instance);
        var projectionResult = await projector.ProjectCountyAsync(countyId, "d4-test");

        projectionResult.RowsProjected.Should().Be(1);
        projectionResult.ApnCrosswalkResolved.Should().Be(0);
        projectionResult.ApnCrosswalkUnresolved.Should().Be(1);

        // Reader for the existing tf_parcel returns NoGeometry —
        // the projected geom row has TfParcelId = null and is not
        // linked to this parcel.
        var reader = new ParcelGeometryReader(_db);
        var lookup = await reader.GetGeometryAsync(parcel.TfParcelId);

        lookup.Kind.Should().Be(
            TerraFusion.Core.GIS.ArcGisRest.ParcelGeometryLookupKind.NoGeometry,
            "unresolved-crosswalk geom rows are NOT exposed via the parcel-keyed read model; " +
            "they're operationally visible only as a coverage-gate metric until a future " +
            "crosswalk-pass slice closes them");
        lookup.CountyId.Should().Be(countyId);
    }
}
