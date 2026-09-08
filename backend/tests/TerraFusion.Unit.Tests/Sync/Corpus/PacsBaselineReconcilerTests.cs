using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.GisTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.Corpus;
using TerraFusion.Data;
using TerraFusion.Data.Services.Workbench.Corpus;
using Xunit;

namespace TerraFusion.Unit.Tests.Sync.Corpus;

/// <summary>
/// SYNC-COMPLETE-2 unit tests for
/// <see cref="PacsBaselineReconciler"/>. We exercise the
/// canonical-count side (against the in-memory db) and the
/// PACS-side unreachable path (no <c>PacsConnection</c> configured).
///
/// <para>The PACS query path isn't exercised in unit tests — it
/// requires a real SQL Server connection and is proven against
/// live PACS in the SYNC-COMPLETE-3 live-replay seal.</para>
/// </summary>
public sealed class PacsBaselineReconcilerTests : IDisposable
{
    private readonly TerraFusionDbContext _db;
    private readonly IConfiguration _emptyConfig;

    public PacsBaselineReconcilerTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"corpus-recon-{Guid.NewGuid():N}")
            .Options;
        _emptyConfig = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        _db = new TerraFusionDbContext(options, _emptyConfig);
        _db.Database.EnsureCreated();
    }

    public void Dispose() => _db.Dispose();

    private PacsBaselineReconciler Build(IConfiguration? config = null) =>
        new(_db, config ?? _emptyConfig,
            NullLogger<PacsBaselineReconciler>.Instance);

    [Fact]
    public async Task QueryAsync_without_PacsConnection_returns_Unreachable()
    {
        var result = await Build().QueryAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None);
        result.Outcome.Should().Be(PacsBaselineOutcome.Unreachable);
        result.Notes.Should().Contain("PacsConnection");
    }

    [Fact]
    public async Task QueryAsync_with_blank_lane_name_returns_UnknownLane()
    {
        // Lane validation happens before the PacsConnection guard.
        var result = await Build().QueryAsync(" ", 2026, CancellationToken.None);
        result.Outcome.Should().Be(PacsBaselineOutcome.UnknownLane);
    }

    [Fact]
    public async Task QueryAsync_geometry_without_ArcGis_url_returns_Unreachable()
    {
        var result = await Build().QueryAsync(
            CorpusReconciliationPolicy.LaneGeometry, 2026, CancellationToken.None);
        result.Outcome.Should().Be(PacsBaselineOutcome.Unreachable);
        result.Notes.Should().Contain("ArcGis");
    }

    [Fact]
    public async Task CountTfCanonicalAsync_parcel_returns_zero_when_empty()
    {
        var count = await Build().CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None);
        count.Should().Be(0L);
    }

    [Fact]
    public async Task CountTfCanonicalAsync_parcel_counts_seeded_rows()
    {
        for (var i = 0; i < 3; i++)
        {
            _db.TfParcels.Add(new TfParcel { TfParcelId = Guid.NewGuid(), CountyId = Guid.NewGuid() });
        }
        await _db.SaveChangesAsync();

        var count = await Build().CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None);
        count.Should().Be(3L);
    }

    [Theory]
    [InlineData("ACTIVE", SourceFamilies.PacsOltp)]
    [InlineData("UNDER_REVIEW", SourceFamilies.PacsOltp)]
    [InlineData("UNDER_REVIEW", SourceFamilies.ProVal)]
    [InlineData("UNDER_REVIEW", null)]
    public async Task PublicReference_DoesNotInflateParcelBaseline_OrRemoveExistingPopulation(
        string baselineStatus, string? baselineFamily)
    {
        // Synthetic consumer fixtures, not source acquisition or G admission proof.
        var countyId = Guid.NewGuid();
        await AddIsolationParcelAsync(countyId, "0000000001", baselineFamily, baselineStatus);
        var service = Build();
        (await service.CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None)).Should().Be(1L,
            "non-G UNDER_REVIEW and lineage-free parcels retain their existing participation");

        await AddIsolationParcelAsync(countyId, "0000000002", "SOCRATA_PUBLIC_EXPORT", "UNDER_REVIEW");
        var parcelsBefore = await _db.TfParcels.AsNoTracking().ToListAsync();
        var xrefsBefore = await _db.SyncBridgeSourceXrefs.AsNoTracking().ToListAsync();
        var batchesBefore = await _db.SyncBridgeLoadBatches.AsNoTracking().ToListAsync();

        var count = await service.CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None);

        count.Should().Be(1L, "the distinct G reference must not mask a PACS baseline deficit");
        (await _db.TfParcels.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(parcelsBefore);
        (await _db.SyncBridgeSourceXrefs.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(xrefsBefore);
        (await _db.SyncBridgeLoadBatches.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(batchesBefore);
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

    private async Task<TfParcel> AddIsolationParcelAsync(
        Guid countyId, string parcelNumber, string? sourceFamily, string status,
        TerraFusionDbContext? context = null)
    {
        var target = context ?? _db;
        var parcel = new TfParcel { CountyId = countyId, ParcelNumber = parcelNumber, ParcelStatus = status };
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
                // Test-only hashes/identities; never reinterpret public lineage as a PACS key.
                SourceKeyJson = isPublicReference ? JsonSerializer.Serialize(new
                {
                    profile_id = "wal.public-parcel-reference.socrata.v1", dataset_id = "4854-i48r",
                    raw_index = 0, parcel_number = parcelNumber,
                    raw_sha256 = new string('a', 64), provenance_sha256 = new string('b', 64),
                }) : sourceFamily == SourceFamilies.PacsOltp
                    ? "{\"prop_id\":900001,\"prop_val_yr\":2026,\"sup_num\":0}"
                    : "{\"legacy_id\":\"synthetic-wal001h\"}",
            });
        }
        await target.SaveChangesAsync();
        return parcel;
    }

    [Fact]
    public async Task SqlitePublicReference_ReconcilerExecutesOwnershipExclusionWithoutWrites()
    {
        await using var connection = new Microsoft.Data.Sqlite.SqliteConnection(
            "Data Source=:memory:;Foreign Keys=True;Pooling=False");
        await connection.OpenAsync();
        await using var db = new TerraFusionDbContext(
            new DbContextOptionsBuilder<TerraFusionDbContext>().UseSqlite(connection).Options,
            new ConfigurationBuilder().Build());
        Assert.Equal("Microsoft.EntityFrameworkCore.Sqlite", db.Database.ProviderName);
        await CreateSqliteConsumerSchemaAsync(db, "AuditLogs", "load_batch", "tf_parcel", "source_xref");
        var consumer = new PacsBaselineReconciler(db, _emptyConfig,
            NullLogger<PacsBaselineReconciler>.Instance);
        (await consumer.CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None)).Should().Be(0L);

        // Synthetic storage only: no source query, admission or permission proof.
        var countyId = Guid.NewGuid();
        await AddIsolationParcelAsync(countyId, "0000000001", SourceFamilies.PacsOltp, "UNDER_REVIEW", db);
        (await consumer.CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None)).Should().Be(1L);
        await AddIsolationParcelAsync(countyId, "0000000002", SourceFamilies.ProVal, "UNDER_REVIEW", db);
        await AddIsolationParcelAsync(countyId, "0000000003", null, "UNDER_REVIEW", db);
        await AddIsolationParcelAsync(countyId, "0000000004", "SOCRATA_PUBLIC_EXPORT", "UNDER_REVIEW", db);
        var parcelsBefore = await db.TfParcels.AsNoTracking().ToListAsync();
        var xrefsBefore = await db.SyncBridgeSourceXrefs.AsNoTracking().ToListAsync();
        var batchesBefore = await db.SyncBridgeLoadBatches.AsNoTracking().ToListAsync();
        var auditsBefore = await db.AuditLogs.AsNoTracking().ToListAsync();
        auditsBefore.Should().NotBeEmpty("normal fixture saves generate genuine audit logs");
        db.ChangeTracker.Clear();

        var count = await consumer.CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneParcel, 2026, CancellationToken.None);

        count.Should().Be(3L);
        db.ChangeTracker.HasChanges().Should().BeFalse();
        db.ChangeTracker.Clear();
        (await db.TfParcels.CountAsync()).Should().Be(4);
        (await db.TfParcels.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(parcelsBefore);
        (await db.SyncBridgeSourceXrefs.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(xrefsBefore);
        (await db.SyncBridgeLoadBatches.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(batchesBefore);
        (await db.AuditLogs.AsNoTracking().ToListAsync()).Should().BeEquivalentTo(auditsBefore);
        await AssertSqliteForeignKeysAsync(db);
    }

    [Fact]
    public async Task CountTfCanonicalAsync_sales_only_counts_qualified_rows()
    {
        _db.TfSales.Add(new TfSale
        {
            TfSaleId = Guid.NewGuid(),
            DorRatioQualified = true,
            CountyRatioQualified = false,
        });
        _db.TfSales.Add(new TfSale
        {
            TfSaleId = Guid.NewGuid(),
            DorRatioQualified = false,
            CountyRatioQualified = true,
        });
        _db.TfSales.Add(new TfSale
        {
            TfSaleId = Guid.NewGuid(),
            DorRatioQualified = false,
            CountyRatioQualified = false,
        });
        await _db.SaveChangesAsync();

        var count = await Build().CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneSales, 2026, CancellationToken.None);
        count.Should().Be(2L);
    }

    [Fact]
    public async Task CountTfCanonicalAsync_owner_wsdor_aggregates_owner_and_wsdor_rows()
    {
        _db.TfOwners.Add(new TfOwner { TfOwnerId = Guid.NewGuid() });
        _db.TfOwners.Add(new TfOwner { TfOwnerId = Guid.NewGuid() });
        _db.TfAssessmentWsdors.Add(new TfAssessmentWsdor
        {
            TfAssessmentWsdorId = Guid.NewGuid(),
            AssessmentYear = 2026,
        });
        _db.TfAssessmentWsdors.Add(new TfAssessmentWsdor
        {
            TfAssessmentWsdorId = Guid.NewGuid(),
            AssessmentYear = 2025,  // wrong year — excluded
        });
        await _db.SaveChangesAsync();

        var count = await Build().CountTfCanonicalAsync(
            CorpusReconciliationPolicy.LaneOwnerWsdor, 2026, CancellationToken.None);
        count.Should().Be(3L);
    }

    [Fact]
    public async Task CountTfCanonicalAsync_unknown_lane_returns_zero()
    {
        var count = await Build().CountTfCanonicalAsync(
            "not-a-lane", 2026, CancellationToken.None);
        count.Should().Be(0L);
    }
}
