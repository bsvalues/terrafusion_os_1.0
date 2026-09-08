using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
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

    private async Task<Guid> SeedTruthBatchAsync(string status = "COMPLETED",
        TerraFusionDbContext? context = null)
    {
        var target = context ?? _db;
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
        target.SyncBridgeLoadBatches.Add(b);
        await target.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task SeedTruthAsync(
        Guid countyId,
        long objectId,
        Guid promotionBatchId,
        string? apn = "100-001",
        double areaSqFt = 1000.0,
        TerraFusionDbContext? context = null)
    {
        var target = context ?? _db;
        target.TruthArcGisParcelGeomCurrents.Add(new TruthArcGisParcelGeomCurrent
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
        await target.SaveChangesAsync();
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

    // Select unmodified application-generated DDL, including every selected index.
    // Unexpected schema/FK closure is a fixture failure, never behavioral RED.
    private static async Task CreateSqliteConsumerSchemaAsync(
        TerraFusionDbContext db, params string[] needed)
    {
        var ddl = db.Database.GenerateCreateScript();
        var tables = Regex.Matches(ddl, "CREATE TABLE \"([^\"]+)\"[\\s\\S]*?;")
            .Cast<Match>().ToArray();
        var indexes = Regex.Matches(ddl,
            "CREATE (?:UNIQUE )?INDEX \"([^\"]+)\" ON \"([^\"]+)\"[^;]+;")
            .Cast<Match>().ToArray();
        foreach (var name in needed)
        {
            var table = Assert.Single(tables.Where(m => m.Groups[1].Value == name));
            foreach (Match foreignKey in Regex.Matches(table.Value, "REFERENCES \"([^\"]+)\""))
                Assert.Contains(foreignKey.Groups[1].Value, needed);
            await db.Database.ExecuteSqlRawAsync(table.Value);
        }
        var selectedIndexes = indexes.Where(m => needed.Contains(m.Groups[2].Value)).ToArray();
        foreach (var index in selectedIndexes)
            await db.Database.ExecuteSqlRawAsync(index.Value);
        foreach (var statement in tables.Where(m => needed.Contains(m.Groups[1].Value)).Concat(selectedIndexes))
        {
            await using var command = db.Database.GetDbConnection().CreateCommand();
            command.CommandText = "SELECT sql FROM sqlite_master WHERE name = $name";
            var parameter = command.CreateParameter();
            parameter.ParameterName = "$name";
            parameter.Value = statement.Groups[1].Value;
            command.Parameters.Add(parameter);
            Assert.Equal(statement.Value.TrimEnd(';'), Assert.IsType<string>(await command.ExecuteScalarAsync()));
        }
        await AssertSqliteForeignKeysAsync(db);
    }

    private static async Task AssertSqliteForeignKeysAsync(TerraFusionDbContext db)
    {
        await using var command = db.Database.GetDbConnection().CreateCommand();
        command.CommandText = "PRAGMA foreign_keys";
        Assert.Equal(1L, Assert.IsType<long>(await command.ExecuteScalarAsync()));
        command.CommandText = "PRAGMA foreign_key_check";
        await using var reader = await command.ExecuteReaderAsync();
        Assert.False(await reader.ReadAsync(), "The generated schema fixture must retain valid foreign keys.");
    }

    private async Task<TfParcel> AddIsolationParcelAsync(Guid countyId, string? sourceFamily,
        TerraFusionDbContext? context = null, string parcelNumber = "0000000001",
        char rawHash = 'a', char provenanceHash = 'b')
    {
        var target = context ?? _db;
        // Synthetic storage prerequisites only; no acquisition/admission/permission proof.
        var parcel = new TfParcel
        {
            CountyId = countyId, ParcelNumber = parcelNumber, ParcelStatus = "UNDER_REVIEW",
        };
        target.TfParcels.Add(parcel);
        if (sourceFamily is not null)
        {
            var isPublicReference = sourceFamily == "SOCRATA_PUBLIC_EXPORT";
            var batch = new LoadBatch
            {
                SourceFamily = sourceFamily, SourceSystem = sourceFamily,
                SourceFileOrDatabase = "synthetic-wal001h",
                SourceQueryName = isPublicReference ? "wal.public-parcel-reference.socrata.v1" : "synthetic-baseline",
                SourceQueryHash = new string('c', 64), Operator = "wal001h-test",
                Status = "COMPLETED", CompletedAt = DateTime.UtcNow, RowsExtracted = 1, RowsPromoted = 1,
            };
            target.SyncBridgeLoadBatches.Add(batch);
            target.SyncBridgeSourceXrefs.Add(new SourceXref
            {
                TfEntityType = "parcel", TfEntityId = parcel.TfParcelId,
                SourceSystem = sourceFamily, SourceTable = isPublicReference ? "4854-i48r" : "synthetic-baseline",
                LoadBatchId = batch.LoadBatchId, SourceQueryHash = batch.SourceQueryHash, IsActive = true,
                SourceKeyJson = isPublicReference ? JsonSerializer.Serialize(new
                {
                    profile_id = "wal.public-parcel-reference.socrata.v1", dataset_id = "4854-i48r",
                    raw_index = 0, parcel_number = parcel.ParcelNumber,
                    raw_sha256 = new string(rawHash, 64), provenance_sha256 = new string(provenanceHash, 64),
                }) : sourceFamily == SourceFamilies.PacsOltp
                    ? "{\"prop_id\":900001,\"prop_val_yr\":2026,\"sup_num\":0}"
                    : "{\"legacy_id\":\"synthetic-wal001h\"}",
            });
        }
        await target.SaveChangesAsync();
        return parcel;
    }

    [Fact]
    public async Task SqlitePublicReference_ProjectorExecutesOwnershipExclusionWithNormalGatesAndAudits()
    {
        await using var connection = new Microsoft.Data.Sqlite.SqliteConnection(
            "Data Source=:memory:;Foreign Keys=True;Pooling=False");
        await connection.OpenAsync();
        await using var db = new TerraFusionDbContext(
            new DbContextOptionsBuilder<TerraFusionDbContext>().UseSqlite(connection).Options,
            new ConfigurationBuilder().Build());
        Assert.Equal("Microsoft.EntityFrameworkCore.Sqlite", db.Database.ProviderName);
        await CreateSqliteConsumerSchemaAsync(db, "AuditLogs", "load_batch", "tf_parcel",
            "source_xref", "tf_parcel_geom", "promotion_gate_result", "parcel_geom_current");
        var countyId = Guid.Parse("19190019-1919-1919-1919-191919191919");
        var foreignCountyId = Guid.Parse("20200020-2020-2020-2020-202020202020");
        var truthBatch = await SeedTruthBatchAsync(context: db);
        for (var i = 1; i <= 6; i++)
            await SeedTruthAsync(countyId, i, truthBatch, apn: $"000000000{i}", context: db);

        // Distinct synthetic public artifacts; no source query, permission or G admission proof.
        await AddIsolationParcelAsync(countyId, "SOCRATA_PUBLIC_EXPORT", db, "0000000001");
        await AddIsolationParcelAsync(countyId, "SOCRATA_PUBLIC_EXPORT", db,
            "0000000002", rawHash: '1', provenanceHash: '2');
        var pacsAfterReference = await AddIsolationParcelAsync(countyId, SourceFamilies.PacsOltp, db, "0000000002");
        var pacsBeforeReference = await AddIsolationParcelAsync(countyId, SourceFamilies.PacsOltp, db, "0000000003");
        await AddIsolationParcelAsync(countyId, "SOCRATA_PUBLIC_EXPORT", db,
            "0000000003", rawHash: '3', provenanceHash: '4');
        var proVal = await AddIsolationParcelAsync(countyId, SourceFamilies.ProVal, db, "0000000004");
        var lineageFree = await AddIsolationParcelAsync(countyId, null, db, "0000000005");
        await AddIsolationParcelAsync(foreignCountyId, SourceFamilies.PacsOltp, db, "0000000006");

        var foreignBatch = await SeedTruthBatchAsync(context: db);
        var foreignGeom = new TfParcelGeom
        {
            CountyId = foreignCountyId, ArcGisObjectId = 1, ArcGisApn = "synthetic-foreign",
            GeomWkt = "POLYGON((0 0,1 0,1 1,0 1,0 0))", CentroidLat = 46.21,
            CentroidLon = -119.13, AreaSqFt = 1000,
            SourceServiceUrl = "https://services.arcgis.com/test/Parcels/FeatureServer/0",
        };
        db.TfParcelGeoms.Add(foreignGeom);
        db.SyncBridgeSourceXrefs.Add(new SourceXref
        {
            TfEntityType = GeomEntityType, TfEntityId = foreignGeom.TfParcelGeomId,
            SourceSystem = "ARCGIS_REST", SourceTable = "parcel_geom",
            SourceKeyJson = JsonSerializer.Serialize(new { county_id = foreignCountyId, arcgis_object_id = 1L }),
            SourceQueryHash = string.Empty, LoadBatchId = foreignBatch, IsActive = true,
        });
        await db.SaveChangesAsync();

        var truthBefore = await db.TruthArcGisParcelGeomCurrents.AsNoTracking().ToListAsync();
        var parcelsBefore = await db.TfParcels.AsNoTracking().ToListAsync();
        var xrefsBefore = await db.SyncBridgeSourceXrefs.AsNoTracking().ToListAsync();
        var batchesBefore = await db.SyncBridgeLoadBatches.AsNoTracking().ToListAsync();
        var gatesBefore = await db.SyncBridgePromotionGateResults.AsNoTracking().ToListAsync();
        var foreignBefore = await db.TfParcelGeoms.AsNoTracking().SingleAsync();
        var auditsBefore = await db.AuditLogs.AsNoTracking().ToListAsync();
        auditsBefore.Should().NotBeEmpty();
        db.ChangeTracker.Clear();

        var result = await new ArcGisCanonicalProjector(db,
            NullLogger<ArcGisCanonicalProjector>.Instance).ProjectCountyAsync(countyId, "wal001h-sqlite-test");

        result.Status.Should().Be("COMPLETED", "consumer failures remain concrete relational-proof failures: {0}",
            result.ErrorSummary);
        result.TruthRowsConsidered.Should().Be(6);
        result.RowsProjected.Should().Be(6);
        result.ApnCrosswalkResolved.Should().Be(4);
        result.ApnCrosswalkUnresolved.Should().Be(2);
        result.PriorCanonicalRowsRemoved.Should().Be(0);
        result.AreaSqFtSum.Should().Be(6000d);
        db.ChangeTracker.HasChanges().Should().BeFalse();
        db.ChangeTracker.Clear();
        var geomsAfter = await db.TfParcelGeoms.AsNoTracking().ToListAsync();
        geomsAfter.Should().HaveCount(7);
        geomsAfter.Single(g => g.CountyId == foreignCountyId).Should().BeEquivalentTo(foreignBefore);
        var projected = geomsAfter.Where(g => g.CountyId == countyId).ToList();
        projected.Should().HaveCount(6);
        projected.Single(g => g.ArcGisObjectId == 1).TfParcelId.Should().BeNull();
        projected.Single(g => g.ArcGisObjectId == 2).TfParcelId.Should().Be(pacsAfterReference.TfParcelId);
        projected.Single(g => g.ArcGisObjectId == 3).TfParcelId.Should().Be(pacsBeforeReference.TfParcelId);
        projected.Single(g => g.ArcGisObjectId == 4).TfParcelId.Should().Be(proVal.TfParcelId);
        projected.Single(g => g.ArcGisObjectId == 5).TfParcelId.Should().Be(lineageFree.TfParcelId);
        projected.Single(g => g.ArcGisObjectId == 6).TfParcelId.Should().BeNull();
        foreach (var truth in truthBefore)
        {
            var geom = projected.Single(g => g.ArcGisObjectId == truth.ArcGisObjectId);
            geom.ArcGisApn.Should().Be(truth.ArcGisApn);
            geom.GeomWkt.Should().Be(truth.GeomWkt);
            geom.CentroidLat.Should().Be(truth.CentroidLat);
            geom.CentroidLon.Should().Be(truth.CentroidLon);
            geom.AreaSqFt.Should().Be(truth.AreaSqFt);
            geom.SourceServiceUrl.Should().Be(truth.SourceServiceUrl);
            geom.IsActive.Should().BeTrue();
        }
        projected.Sum(g => g.AreaSqFt).Should().Be(6000d);
        (await db.TruthArcGisParcelGeomCurrents.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(truthBefore);
        (await db.TfParcels.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(parcelsBefore);
        var batchesAfter = await db.SyncBridgeLoadBatches.AsNoTracking().ToListAsync();
        batchesAfter.Where(b => b.LoadBatchId != result.PromotionLoadBatchId).Should().BeEquivalentTo(batchesBefore);
        var promotion = Assert.Single(batchesAfter.Where(b => b.LoadBatchId == result.PromotionLoadBatchId));
        promotion.Status.Should().Be("COMPLETED");
        promotion.CompletedAt.Should().NotBeNull();
        promotion.RowsExtracted.Should().Be(6);
        promotion.RowsPromoted.Should().Be(6);
        var xrefsAfter = await db.SyncBridgeSourceXrefs.AsNoTracking().ToListAsync();
        xrefsAfter.Where(x => x.LoadBatchId != result.PromotionLoadBatchId).Should().BeEquivalentTo(xrefsBefore);
        var newXrefs = xrefsAfter.Where(x => x.LoadBatchId == result.PromotionLoadBatchId).ToList();
        newXrefs.Should().HaveCount(6);
        newXrefs.Should().OnlyContain(x => x.TfEntityType == GeomEntityType
            && x.SourceSystem == "ARCGIS_REST" && x.SourceTable == "parcel_geom" && x.IsActive);
        newXrefs.Select(x => x.TfEntityId).Should().BeEquivalentTo(projected.Select(g => g.TfParcelGeomId));
        foreach (var xref in newXrefs)
        {
            var geom = projected.Single(g => g.TfParcelGeomId == xref.TfEntityId);
            using var key = JsonDocument.Parse(xref.SourceKeyJson);
            key.RootElement.GetProperty("county_id").GetGuid().Should().Be(countyId);
            key.RootElement.GetProperty("arcgis_object_id").GetInt64().Should().Be(geom.ArcGisObjectId);
        }
        var gatesAfter = await db.SyncBridgePromotionGateResults.AsNoTracking().ToListAsync();
        gatesAfter.Where(g => g.LoadBatchId != result.PromotionLoadBatchId).Should().BeEquivalentTo(gatesBefore);
        var gates = gatesAfter.Where(g => g.LoadBatchId == result.PromotionLoadBatchId).ToList();
        gates.Should().HaveCount(5);
        gates.Should().OnlyContain(g => g.GateStage == "TRUTH_TO_CANONICAL" && g.Status == "PASS");
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "canonical-geom-source-batch-completed", "canonical-geom-source-xref-coverage",
            "canonical-geom-county-isolation", "canonical-geom-apn-crosswalk-coverage", "canonical-geom-aggregate",
        });
        var coverage = gates.Single(g => g.GateName == "canonical-geom-apn-crosswalk-coverage");
        coverage.Expected.Should().Be("informational");
        coverage.Actual.Should().Be("4");
        coverage.Detail.Should().Be("projected=6 apnResolved=4 apnUnresolved=2");
        var aggregate = gates.Single(g => g.GateName == "canonical-geom-aggregate");
        aggregate.Expected.Should().Be("informational");
        aggregate.Actual.Should().Be("6");
        aggregate.Detail.Should().Be("truthConsidered=6 projected=6 areaSqFtSum=6000.00");
        var auditsAfter = await db.AuditLogs.AsNoTracking().ToListAsync();
        var seedAuditIds = auditsBefore.Select(a => a.Id).ToHashSet();
        auditsAfter.Where(a => seedAuditIds.Contains(a.Id)).Should().BeEquivalentTo(auditsBefore);
        var newAudits = auditsAfter.Where(a => !seedAuditIds.Contains(a.Id)).ToList();
        newAudits.Should().HaveCount(19);
        newAudits.Should().OnlyContain(a => a.Source == "EntityFramework");
        newAudits.Select(a => a.Type).Should().BeEquivalentTo(
            new[] { "LoadBatch_Added", "LoadBatch_Modified" }
                .Concat(Enumerable.Repeat("TfParcelGeom_Added", 6))
                .Concat(Enumerable.Repeat("SourceXref_Added", 6))
                .Concat(Enumerable.Repeat("PromotionGateResult_Added", 5)));
        await AssertSqliteForeignKeysAsync(db);
    }

    [Fact]
    public async Task PublicReference_OnlyMatch_ProjectsPendingWithoutChangingInformationalGate()
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        await SeedTruthAsync(countyId, 1, truthBatch, apn: "0000000001");
        await AddIsolationParcelAsync(countyId, "SOCRATA_PUBLIC_EXPORT");
        var parcelsBefore = await _db.TfParcels.AsNoTracking().ToListAsync();
        var xrefsBefore = await _db.SyncBridgeSourceXrefs.AsNoTracking().ToListAsync();

        var result = await BuildService().ProjectCountyAsync(countyId, "wal001h-test");

        result.Status.Should().Be("COMPLETED", "valid truth geometry can project with a pending crosswalk");
        result.RowsProjected.Should().Be(1);
        var geom = await _db.TfParcelGeoms.AsNoTracking().SingleAsync();
        geom.TfParcelId.Should().BeNull("a public reference must not become a PACS geometry-match target");
        result.ApnCrosswalkResolved.Should().Be(0);
        result.ApnCrosswalkUnresolved.Should().Be(1);
        geom.CountyId.Should().Be(countyId);
        geom.GeomWkt.Should().Be("POLYGON((0 0,1 0,1 1,0 1,0 0))");
        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId).ToListAsync();
        gates.Should().HaveCount(5);
        gates.Should().OnlyContain(g => g.GateStage == "TRUTH_TO_CANONICAL" && g.Status == "PASS");
        var coverage = gates.Single(g => g.GateName == "canonical-geom-apn-crosswalk-coverage");
        coverage.Expected.Should().Be("informational");
        coverage.Actual.Should().Be("0");
        coverage.Detail.Should().Be("projected=1 apnResolved=0 apnUnresolved=1");
        (await _db.SyncBridgeSourceXrefs.SingleAsync(x => x.TfEntityType == GeomEntityType))
            .TfEntityId.Should().Be(geom.TfParcelGeomId);
        (await _db.TfParcels.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(parcelsBefore);
        (await _db.SyncBridgeSourceXrefs.AsNoTracking().Where(x => x.TfEntityType == "parcel").ToListAsync())
            .Should().BeEquivalentTo(xrefsBefore);
    }

    [Theory]
    [InlineData(true, null)]
    [InlineData(false, null)]
    [InlineData(true, SourceFamilies.PacsOltp)]
    [InlineData(false, SourceFamilies.PacsOltp)]
    [InlineData(true, SourceFamilies.ProVal)]
    [InlineData(false, SourceFamilies.ProVal)]
    public async Task PublicReference_SameApn_SelectsNonGUnderReviewTargetInEitherInsertionOrder(
        bool referenceFirst, string? baselineFamily)
    {
        var countyId = Guid.NewGuid();
        var truthBatch = await SeedTruthBatchAsync();
        await SeedTruthAsync(countyId, 1, truthBatch, apn: "0000000001");
        if (referenceFirst) await AddIsolationParcelAsync(countyId, "SOCRATA_PUBLIC_EXPORT");
        var legitimate = await AddIsolationParcelAsync(countyId, baselineFamily);
        if (!referenceFirst) await AddIsolationParcelAsync(countyId, "SOCRATA_PUBLIC_EXPORT");
        var parcelsBefore = await _db.TfParcels.AsNoTracking().ToListAsync();
        var xrefsBefore = await _db.SyncBridgeSourceXrefs.AsNoTracking().ToListAsync();

        var result = await BuildService().ProjectCountyAsync(countyId, "wal001h-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsProjected.Should().Be(1);
        (await _db.TfParcelGeoms.AsNoTracking().SingleAsync()).TfParcelId.Should().Be(legitimate.TfParcelId,
            "source ownership, not insertion order or UNDER_REVIEW alone, determines G exclusion");
        result.ApnCrosswalkResolved.Should().Be(1);
        result.ApnCrosswalkUnresolved.Should().Be(0);
        (await _db.TfParcels.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(parcelsBefore);
        (await _db.SyncBridgeSourceXrefs.AsNoTracking().Where(x => x.TfEntityType == "parcel").ToListAsync())
            .Should().BeEquivalentTo(xrefsBefore);
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
