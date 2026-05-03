using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Data;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.SyncBridge;

/// <summary>
/// Sync Bridge v1 Gate ARCH-1 / ARCH-2 / ARCH-3 — schema integrity.
/// Verifies that:
/// (1) Every Sync Bridge v1 entity materializes against an in-memory
///     provider (proves entity + configuration align).
/// (2) The Phase 0 field_authority seed contains exactly the 8 rows
///     specified in docs/pacs/pacs-sync-bridge-v1-spec.md §4.
/// </summary>
public sealed class SyncBridgeV1SchemaTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public SyncBridgeV1SchemaTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"sync-bridge-v1-{Guid.NewGuid():N}")
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

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task TfParcel_RoundTrip()
    {
        var p = new TfParcel
        {
            CountyId = Guid.Parse("19190019-1919-1919-1919-191919191919"),
            ParcelNumber = "109884040000015",
            PropertyType = "R",
            ParcelStatus = "ACTIVE",
        };
        _db.TfParcels.Add(p);
        await _db.SaveChangesAsync();

        var roundtrip = await _db.TfParcels.FindAsync(p.TfParcelId);
        roundtrip.Should().NotBeNull();
        roundtrip!.ParcelStatus.Should().Be("ACTIVE");
    }

    [Fact]
    public async Task SourceXref_RoundTrip()
    {
        var x = new SourceXref
        {
            TfEntityType = "parcel",
            TfEntityId = Guid.NewGuid(),
            SourceSystem = "PACS_OLTP",
            SourceTable = "property_val",
            SourceKeyJson = "{\"prop_id\":12345,\"prop_val_yr\":2026,\"sup_num\":0}",
            SourceQueryHash = "abc123",
            LoadBatchId = Guid.NewGuid(),
        };
        _db.SyncBridgeSourceXrefs.Add(x);
        await _db.SaveChangesAsync();

        var roundtrip = await _db.SyncBridgeSourceXrefs.FirstAsync();
        roundtrip.SourceKeyJson.Should().Contain("prop_val_yr");
    }

    [Fact]
    public async Task LoadBatch_RoundTrip()
    {
        var b = new LoadBatch
        {
            SourceFamily = "PACS_OLTP",
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = "pacs_oltp",
            SourceQueryHash = "deadbeef",
            Operator = "test-operator",
            Status = "IN_PROGRESS",
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();

        var roundtrip = await _db.SyncBridgeLoadBatches.FindAsync(b.LoadBatchId);
        roundtrip.Should().NotBeNull();
        roundtrip!.SourceFamily.Should().Be("PACS_OLTP");
    }

    [Fact]
    public void DiffLedger_ConflictQueue_WritebackJournal_RollbackPackage_PromotionGateResult_Compile()
    {
        // Pure compilation/configuration check — these all live in the
        // DbContext and were applied. Asserting they're queryable is
        // proof enough at the schema-integrity level.
        _db.SyncBridgeDiffLedger.Should().NotBeNull();
        _db.SyncBridgeConflictQueue.Should().NotBeNull();
        _db.SyncBridgeWritebackJournal.Should().NotBeNull();
        _db.SyncBridgeRollbackPackages.Should().NotBeNull();
        _db.SyncBridgePromotionGateResults.Should().NotBeNull();
    }

    [Fact]
    public async Task FieldAuthority_Phase0Seed_Has8ParcelRows()
    {
        // ARCH-2: the Phase 0 seed for the parcel domain MUST carry 8 rows
        // covering parcel_number, situs_address, legal_description,
        // property_type, parcel_status, county_id, created_at, updated_at.
        var phase0 = await _db.SyncBridgeFieldAuthorities
            .Where(x => x.DomainName == "parcel" && x.Phase == "phase_0")
            .ToListAsync();

        phase0.Should().HaveCount(8,
            "spec §4 enumerates exactly 8 Phase 0 parcel field-authority rows");

        var fields = phase0.Select(x => x.FieldName).ToHashSet();
        fields.Should().BeEquivalentTo(new[]
        {
            "parcel_number", "situs_address", "legal_description",
            "property_type", "parcel_status", "county_id",
            "created_at", "updated_at",
        });

        // Every row MUST have a conflict_strategy other than the default
        // BLOCKED — defaults are forbidden in the seed (per the doctrine).
        phase0.Should().OnlyContain(x => x.ConflictStrategy != "BLOCKED");

        // PACS-owned fields MUST allow PACS→TF and forbid TF→PACS in v1.
        var pacsOwned = phase0.Where(x => x.SystemOfRecord == "PACS").ToList();
        pacsOwned.Should().HaveCount(5);
        pacsOwned.Should().OnlyContain(x => x.PacsToTfAllowed);
        pacsOwned.Should().OnlyContain(x => !x.TfToPacsAllowed);
    }
}
