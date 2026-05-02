using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsOwnerCanonical;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Slice B3 acceptance tests. Proves the five C-* gates and the
/// doctrine invariants:
///  - truth-pacs source batch must be COMPLETED or projection REFUSED
///  - confidential rows have redacted display + nulled PII at canonical
///  - non-confidential rows have full PII preserved
///  - web-suppression carries through but does NOT redact
///  - parcel-xref-resolved rows project; unresolved rows quarantine
///  - one tf_owner per unique acct_id (within batch)
///  - co-ownership produces multiple links to one tf_owner-per-account
///  - re-running the same truth batch is idempotent
///  - every tf_owner has source_xref + non-empty CountyId
///  - the pii-redaction-policy gate verifies from DB (defense-in-depth)
/// </summary>
public sealed class PacsOwnerCanonicalProjectorTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsOwnerCanonicalProjectorTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"b3-{Guid.NewGuid():N}")
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

    private PacsOwnerCanonicalProjector BuildProjector()
        => new(_db, NullLogger<PacsOwnerCanonicalProjector>.Instance);

    private async Task<Guid> SeedCompletedBatchAsync(string label)
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = label,
            SourceQueryHash = "abc",
            Operator = "test",
            Status = "COMPLETED",
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task<Guid> SeedFailedBatchAsync(string label)
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = label,
            SourceQueryHash = "abc",
            Operator = "test",
            Status = "FAILED",
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
            ErrorSummary = "simulated",
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
    }

    private async Task<TruthPacsOwnerCurrent> SeedTruthOwnerAsync(
        Guid promotionBatchId,
        int propId, long ownerId, long acctId,
        string? fileAs = "Smith, John",
        string? first = "John", string? last = "Smith",
        DateTime? birthDt = null,
        bool confidential = false, bool webSupp = false,
        decimal? pct = 100m,
        short year = 2026, short sup = 0)
    {
        var t = new TruthPacsOwnerCurrent
        {
            PropId = propId,
            OwnerTaxYr = year,
            SupNum = sup,
            OwnerId = ownerId,
            AcctId = acctId,
            FileAsName = fileAs,
            FirstName = first,
            LastName = last,
            BirthDt = birthDt,
            ConfidentialFlag = confidential,
            WebSuppression = webSupp,
            PctOwnership = pct,
            TypeOfOwner = "I",
            SourceOwnerLandedRowId = Guid.NewGuid(),
            SourceAccountLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            OwnerLoadBatchId = Guid.NewGuid(),
            AccountLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
        };
        _db.TruthPacsOwnerCurrents.Add(t);
        await _db.SaveChangesAsync();
        return t;
    }

    private async Task<(Guid TfParcelId, Guid CountyId)> SeedParcelWithXrefAsync(
        int propId, short year = 2026, short sup = 0)
    {
        var countyId = Guid.NewGuid();
        var parcel = new TfParcel
        {
            CountyId = countyId,
            ParcelNumber = $"P{propId}",
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
        };
        _db.TfParcels.Add(parcel);
        await _db.SaveChangesAsync();

        _db.SyncBridgeSourceXrefs.Add(new SourceXref
        {
            TfEntityType = "parcel",
            TfEntityId = parcel.TfParcelId,
            SourceSystem = "PACS_OLTP",
            SourceTable = "property_val",
            SourceKeyJson = JsonSerializer.Serialize(new
            {
                prop_id = propId, prop_val_yr = year, sup_num = sup,
            }),
            SourceQueryHash = "qh",
            LoadBatchId = Guid.NewGuid(),
            IsActive = true,
        });
        await _db.SaveChangesAsync();
        return (parcel.TfParcelId, countyId);
    }

    [Fact]
    public async Task HappyPath_ProjectsToTfOwner_AndLink_AndSourceXref()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        var (parcelId, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.OwnersProjected.Should().Be(1);
        result.LinksProjected.Should().Be(1);
        result.RowsQuarantined.Should().Be(0);

        var owner = await _db.TfOwners.SingleAsync();
        owner.CountyId.Should().Be(countyId);
        owner.AcctId.Should().Be(1);
        owner.DisplayName.Should().Be("Smith, John");
        owner.ConfidentialFlag.Should().BeFalse();

        var link = await _db.TfParcelOwnerLinks.SingleAsync();
        link.TfParcelId.Should().Be(parcelId);
        link.TfOwnerId.Should().Be(owner.TfOwnerId);
        link.IsPrimary.Should().BeTrue();
        link.PctOwnership.Should().Be(100m);

        var xref = await _db.SyncBridgeSourceXrefs.SingleAsync(x => x.TfEntityType == "owner");
        xref.TfEntityId.Should().Be(owner.TfOwnerId);
        xref.SourceKeyJson.Should().Contain("acct_id");
        using var doc = JsonDocument.Parse(xref.SourceKeyJson);
        doc.RootElement.GetProperty("acct_id").GetInt64().Should().Be(1);
    }

    [Fact]
    public async Task ConfidentialOwner_HasRedactedDisplayAndNulledPii()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthOwnerAsync(truthBatch,
            propId: 100, ownerId: 1, acctId: 1,
            fileAs: "Real Name Should Not Appear",
            first: "Real", last: "Name",
            birthDt: new DateTime(1965, 3, 15, 0, 0, 0, DateTimeKind.Utc),
            confidential: true);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var owner = await _db.TfOwners.SingleAsync();
        owner.ConfidentialFlag.Should().BeTrue();
        owner.DisplayName.Should().Be("[Confidential]",
            "the doctrine: confidential rows MUST have redacted display");
        owner.FirstName.Should().BeNull();
        owner.LastName.Should().BeNull();
        owner.BirthDt.Should().BeNull();

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-owner-pii-redaction-policy"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        gate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task NonConfidentialOwner_HasFullPiiPreserved()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        var birth = new DateTime(1980, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        await SeedTruthOwnerAsync(truthBatch,
            propId: 100, ownerId: 1, acctId: 1,
            fileAs: "Doe, Jane",
            first: "Jane", last: "Doe",
            birthDt: birth,
            confidential: false);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var owner = await _db.TfOwners.SingleAsync();
        owner.DisplayName.Should().Be("Doe, Jane");
        owner.FirstName.Should().Be("Jane");
        owner.LastName.Should().Be("Doe");
        owner.BirthDt.Should().Be(birth);
    }

    [Fact]
    public async Task WebSuppression_IsCarried_DoesNotRedactAtCanonical()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthOwnerAsync(truthBatch,
            propId: 100, ownerId: 1, acctId: 1,
            fileAs: "Visible Owner",
            confidential: false, webSupp: true);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var owner = await _db.TfOwners.SingleAsync();
        owner.WebSuppression.Should().BeTrue();
        owner.DisplayName.Should().Be("Visible Owner",
            "web-suppression is a downstream public-display concern, not a canonical-redaction trigger");
        owner.FirstName.Should().NotBeNull();
    }

    [Fact]
    public async Task OwnerWithoutParcelXref_IsQuarantined_NotDiscarded()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        // No parcel for prop_id 999.
        await SeedTruthOwnerAsync(truthBatch, propId: 999, ownerId: 1, acctId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.OwnersProjected.Should().Be(0);
        result.RowsQuarantined.Should().Be(1);
        (await _db.TfOwners.CountAsync()).Should().Be(0);
        (await _db.TfParcelOwnerLinks.CountAsync()).Should().Be(0);

        var quarantine = await _db.LegacyTfUnprovenOwnerCurrents.SingleAsync();
        quarantine.PropId.Should().Be(999);
        quarantine.QuarantineReason.Should().Be("NO_PARCEL_XREF");
    }

    [Fact]
    public async Task SameAcctIdAcrossParcels_OneTfOwner_MultipleLinks()
    {
        // Same person owns two parcels — one TfOwner, two links.
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedParcelWithXrefAsync(propId: 200);

        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 1, pct: 100m);
        await SeedTruthOwnerAsync(truthBatch, propId: 200, ownerId: 1, acctId: 1, pct: 100m);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.OwnersProjected.Should().Be(1, "one acct_id → one tf_owner");
        result.LinksProjected.Should().Be(2, "but two parcel→owner edges");
        (await _db.TfOwners.CountAsync()).Should().Be(1);
        (await _db.TfParcelOwnerLinks.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task CoOwnership_OneParcel_MultipleOwners_MultipleLinks()
    {
        // Two co-owners on one parcel summing to 100.
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);

        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 1,
            fileAs: "Smith, John", pct: 60m);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 2, acctId: 2,
            fileAs: "Smith, Jane", pct: 40m);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.OwnersProjected.Should().Be(2);
        result.LinksProjected.Should().Be(2);

        var links = await _db.TfParcelOwnerLinks.ToListAsync();
        links.Should().HaveCount(2);
        links.Single(l => l.PctOwnership == 60m).IsPrimary.Should().BeTrue();
        links.Single(l => l.PctOwnership == 40m).IsPrimary.Should().BeFalse();
    }

    [Fact]
    public async Task EveryTfOwner_HasSourceXref_AndCountyId()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedParcelWithXrefAsync(propId: 200);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 1);
        await SeedTruthOwnerAsync(truthBatch, propId: 200, ownerId: 2, acctId: 2);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var owners = await _db.TfOwners.ToListAsync();
        owners.Should().HaveCount(2);
        owners.Should().OnlyContain(o => o.CountyId != Guid.Empty);

        foreach (var o in owners)
        {
            var xref = await _db.SyncBridgeSourceXrefs
                .FirstOrDefaultAsync(x => x.TfEntityType == "owner" && x.TfEntityId == o.TfOwnerId);
            xref.Should().NotBeNull(
                $"every tf_owner must have a source_xref (failed: {o.TfOwnerId})");
        }

        var xrefGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-owner-source-xref-coverage"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        xrefGate.Status.Should().Be("PASS");

        var countyGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-owner-county-isolation"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        countyGate.Status.Should().Be("PASS");
    }

    [Fact]
    public async Task FailedTruthBatch_RefusesProjection()
    {
        var truthBatch = await SeedFailedBatchAsync("truth-batch");

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.Status.Should().Be("REFUSED");
        (await _db.TfOwners.CountAsync()).Should().Be(0);
        (await _db.TfParcelOwnerLinks.CountAsync()).Should().Be(0);
        (await _db.LegacyTfUnprovenOwnerCurrents.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task UnknownTruthBatch_RefusesProjection()
    {
        var result = await BuildProjector().ProjectAsync(Guid.NewGuid(), "test-op");

        result.Status.Should().Be("REFUSED");
        var srcGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "canonical-owner-source-batch-completed"
                          && g.LoadBatchId == result.PromotionLoadBatchId);
        srcGate.Status.Should().Be("FAIL");
        srcGate.Detail.Should().Contain("MISSING");
    }

    [Fact]
    public async Task RePromote_Replaces_PriorRowsIdempotently()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 1);

        var first = await BuildProjector().ProjectAsync(truthBatch, "test-op");
        var second = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        first.OwnersProjected.Should().Be(1);
        first.PriorOwnersRemoved.Should().Be(0);
        second.OwnersProjected.Should().Be(1);
        second.PriorOwnersRemoved.Should().Be(1);
        second.PriorLinksRemoved.Should().Be(1);

        // No duplicates.
        (await _db.TfOwners.CountAsync()).Should().Be(1);
        (await _db.TfParcelOwnerLinks.CountAsync()).Should().Be(1);
        (await _db.SyncBridgeSourceXrefs.CountAsync(x => x.TfEntityType == "owner"))
            .Should().Be(1);
    }

    [Fact]
    public async Task RePromote_ClearsPriorQuarantineRows()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        // No parcel for prop_id 999 → both runs should produce one quarantine row.
        await SeedTruthOwnerAsync(truthBatch, propId: 999, ownerId: 1, acctId: 1);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");
        var second = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        second.PriorQuarantineRowsRemoved.Should().Be(1);
        (await _db.LegacyTfUnprovenOwnerCurrents.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task AllFiveCGates_AreRecorded_OnSuccess()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 1);

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Select(g => g.GateName).Should().BeEquivalentTo(new[]
        {
            "canonical-owner-source-batch-completed",
            "canonical-owner-parcel-xref-coverage",
            "canonical-owner-source-xref-coverage",
            "canonical-owner-county-isolation",
            "canonical-owner-pii-redaction-policy",
        });
    }

    [Fact]
    public async Task EmptyTruthBatch_StillCompletesWithCleanGates()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");

        var result = await BuildProjector().ProjectAsync(truthBatch, "test-op");

        result.Status.Should().Be("COMPLETED");
        result.TruthRowsConsidered.Should().Be(0);
        result.OwnersProjected.Should().Be(0);

        var gates = await _db.SyncBridgePromotionGateResults
            .Where(g => g.LoadBatchId == result.PromotionLoadBatchId)
            .ToListAsync();
        gates.Should().HaveCount(5);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
    }

    [Fact]
    public async Task ParcelXrefCounty_DeterminesOwnerCounty()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        var (_, countyA) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 1);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var owner = await _db.TfOwners.SingleAsync();
        owner.CountyId.Should().Be(countyA,
            "tf_owner.CountyId comes from the resolved parcel, not the truth row");
    }

    [Fact]
    public async Task DoctrineRejection_TfSale_Untouched_AtThisLayer()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 1);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");

        // B3 only writes owner-domain canonical rows.
        (await _db.TfSales.CountAsync()).Should().Be(0);
        (await _db.LegacyTfUnprovenSales.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task PrimaryFlag_FollowsFiftyPercentRule()
    {
        var truthBatch = await SeedCompletedBatchAsync("truth-batch");
        await SeedParcelWithXrefAsync(propId: 100);
        // 50% exactly → primary; 49% → not.
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 1, pct: 50m);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 2, acctId: 2, pct: 49m);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 3, acctId: 3, pct: 1m);

        await BuildProjector().ProjectAsync(truthBatch, "test-op");

        var links = await _db.TfParcelOwnerLinks.ToListAsync();
        links.Single(l => l.PctOwnership == 50m).IsPrimary.Should().BeTrue();
        links.Single(l => l.PctOwnership == 49m).IsPrimary.Should().BeFalse();
        links.Single(l => l.PctOwnership == 1m).IsPrimary.Should().BeFalse();
    }
}
