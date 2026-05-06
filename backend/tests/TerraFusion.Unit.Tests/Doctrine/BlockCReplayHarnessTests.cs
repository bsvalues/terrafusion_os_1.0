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
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Entities.TruthPacs;
using TerraFusion.Core.Sync.PacsLandCanonical;
using TerraFusion.Data;
using TerraFusion.Data.Services.CanonicalTf;
using Xunit;

namespace TerraFusion.Unit.Tests.Doctrine;

/// <summary>
/// H3 — Block-C contract v1 replay harness.
///
/// <para>Per <c>docs/pacs/blocks-d-through-h-design.md</c> §H3:
/// given a <c>truthPromotionLoadBatchId</c>, re-running each
/// canonical projector deterministically must produce
/// byte-equivalent canonical state.</para>
///
/// <para>This is the proof-of-idempotency band. Each existing
/// projector test asserts idempotency for its own lane; this
/// harness asserts the property uniformly across all four shipped
/// canonical lanes (S3 sale, B3 owner, B4 wsdor assessment, C3
/// improvement) plus a quarantine-preservation case.</para>
///
/// <para>The replay invariant being proved:
/// <list type="number">
///   <item>Run 1 has <c>Prior*Removed = 0</c> (nothing prior).</item>
///   <item>Run 2 has <c>Prior*Removed</c> equal to the row counts
///   produced by Run 1 (cleanup before re-insert).</item>
///   <item>Final canonical state after Run 2 == final canonical
///   state after Run 1 (no duplicates, no orphans, no drift).</item>
///   <item>source_xref count for the lane is unchanged across
///   runs.</item>
/// </list>
/// </para>
///
/// <para>L3 added 2026-05-03 once the land projector shipped.
/// The harness now covers all five canonical projectors at the
/// pre-E4b shape (S3, B3, B4, C3, L3) plus C3's quarantine
/// preservation case. E4b's i_attr_id resolution is exercised by
/// dedicated tests in <c>PacsImprvCanonicalProjectorTests</c>.</para>
/// </summary>
public sealed class BlockCReplayHarnessTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public BlockCReplayHarnessTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"h3-{Guid.NewGuid():N}")
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

    // ───────────────────────────────────────────────────────────────
    // Replay tests — one per shipped canonical projector
    // ───────────────────────────────────────────────────────────────

    [Fact]
    public async Task Replay_S3_Sale_DeterministicReplay_ProducesIdenticalState()
    {
        var truthBatch = await SeedCompletedBatchAsync("s3-replay");
        var (parcelId, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthSaleAsync(truthBatch, chg: 1, propId: 100);
        await SeedTruthSaleAsync(truthBatch, chg: 2, propId: 100);

        var projector = new PacsSaleCanonicalProjector(
            _db, NullLogger<PacsSaleCanonicalProjector>.Instance);

        // Run 1.
        var run1 = await projector.ProjectAsync(truthBatch, "h3-run1");
        run1.Status.Should().Be("COMPLETED");
        run1.SalesProjected.Should().Be(2);
        run1.PriorCanonicalRowsRemoved.Should().Be(0,
            "first run sees no prior canonical rows");
        run1.PriorQuarantineRowsRemoved.Should().Be(0);

        var snapshot1 = await CaptureSaleSnapshotAsync();

        // Run 2 — same batch, same operator name irrelevant.
        var run2 = await projector.ProjectAsync(truthBatch, "h3-run2");
        run2.Status.Should().Be("COMPLETED");
        run2.SalesProjected.Should().Be(2);
        run2.PriorCanonicalRowsRemoved.Should().Be(2,
            "second run cleans up the 2 sales from run 1 before re-inserting");

        var snapshot2 = await CaptureSaleSnapshotAsync();

        // Final canonical state is byte-equivalent.
        snapshot2.Should().BeEquivalentTo(snapshot1,
            "S3 replay must produce identical tf_sale state");

        // No row count growth.
        (await _db.TfSales.CountAsync()).Should().Be(2);
        (await _db.SyncBridgeSourceXrefs
            .CountAsync(x => x.TfEntityType == "sale")).Should().Be(2);
    }

    [Fact]
    public async Task Replay_B3_Owner_DeterministicReplay_ProducesIdenticalState()
    {
        var truthBatch = await SeedCompletedBatchAsync("b3-replay");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 1, acctId: 11);
        await SeedTruthOwnerAsync(truthBatch, propId: 100, ownerId: 2, acctId: 12);

        var projector = new PacsOwnerCanonicalProjector(
            _db, NullLogger<PacsOwnerCanonicalProjector>.Instance);

        var run1 = await projector.ProjectAsync(truthBatch, "h3-run1");
        run1.Status.Should().Be("COMPLETED");
        run1.OwnersProjected.Should().Be(2);
        run1.LinksProjected.Should().Be(2);
        run1.PriorOwnersRemoved.Should().Be(0);
        run1.PriorLinksRemoved.Should().Be(0);

        var snapshot1 = await CaptureOwnerSnapshotAsync();

        var run2 = await projector.ProjectAsync(truthBatch, "h3-run2");
        run2.Status.Should().Be("COMPLETED");
        run2.OwnersProjected.Should().Be(2);
        run2.LinksProjected.Should().Be(2);
        run2.PriorOwnersRemoved.Should().Be(2,
            "second run removes the 2 owners produced by run 1");
        run2.PriorLinksRemoved.Should().Be(2);

        var snapshot2 = await CaptureOwnerSnapshotAsync();
        snapshot2.Should().BeEquivalentTo(snapshot1,
            "B3 replay must produce identical tf_owner + tf_parcel_owner_link state");

        (await _db.TfOwners.CountAsync()).Should().Be(2);
        (await _db.TfParcelOwnerLinks.CountAsync()).Should().Be(2);
        (await _db.SyncBridgeSourceXrefs
            .CountAsync(x => x.TfEntityType == "owner")).Should().Be(2);
    }

    [Fact]
    public async Task Replay_B4_Wsdor_DeterministicReplay_ProducesIdenticalState()
    {
        var truthBatch = await SeedCompletedBatchAsync("b4-replay");
        var (_, countyId) = await SeedParcelWithXrefAsync(propId: 100);
        await SeedOwnerXrefOnlyAsync(countyId, acctId: 1);
        await SeedOwnerXrefOnlyAsync(countyId, acctId: 2);
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 1, assessed: 250_000m);
        await SeedTruthWpovAsync(truthBatch, propId: 100, ownerId: 2, assessed: 100_000m);

        var projector = new PacsWsdorCanonicalProjector(
            _db, NullLogger<PacsWsdorCanonicalProjector>.Instance);

        var run1 = await projector.ProjectAsync(truthBatch, "h3-run1");
        run1.Status.Should().Be("COMPLETED");
        run1.RowsProjected.Should().Be(2);
        run1.PriorRowsRemoved.Should().Be(0);

        var snapshot1 = await CaptureWsdorSnapshotAsync();

        var run2 = await projector.ProjectAsync(truthBatch, "h3-run2");
        run2.Status.Should().Be("COMPLETED");
        run2.RowsProjected.Should().Be(2);
        run2.PriorRowsRemoved.Should().Be(2,
            "second run removes the 2 assessment rows from run 1");

        var snapshot2 = await CaptureWsdorSnapshotAsync();
        snapshot2.Should().BeEquivalentTo(snapshot1,
            "B4 replay must produce identical tf_assessment_wsdor state");

        (await _db.TfAssessmentWsdors.CountAsync()).Should().Be(2);
        (await _db.SyncBridgeSourceXrefs
            .CountAsync(x => x.TfEntityType == "assessment_wsdor")).Should().Be(2);
    }

    [Fact]
    public async Task Replay_C3_Improvement_DeterministicReplay_ProducesIdenticalState()
    {
        var truthBatch = await SeedCompletedBatchAsync("c3-replay");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);
        await SeedRawDetailAsync(propId: 100, imprvId: 1, imprvDetId: 10, typeCd: "MA");
        await SeedRawDetailAsync(propId: 100, imprvId: 1, imprvDetId: 11, typeCd: "BSMT");

        var projector = new PacsImprvCanonicalProjector(
            _db,
            new NullPerUniverseAttributeDictionary(),
            NullLogger<PacsImprvCanonicalProjector>.Instance);

        var run1 = await projector.ProjectAsync(truthBatch, "h3-run1");
        run1.Status.Should().Be("COMPLETED");
        run1.ImprovementsProjected.Should().Be(1);
        run1.FeaturesProjected.Should().Be(2);
        run1.PriorImprovementsRemoved.Should().Be(0);
        run1.PriorFeaturesRemoved.Should().Be(0);

        var snapshot1 = await CaptureImprovementSnapshotAsync();

        var run2 = await projector.ProjectAsync(truthBatch, "h3-run2");
        run2.Status.Should().Be("COMPLETED");
        run2.ImprovementsProjected.Should().Be(1);
        run2.FeaturesProjected.Should().Be(2);
        run2.PriorImprovementsRemoved.Should().Be(1,
            "second run removes the 1 improvement from run 1");
        run2.PriorFeaturesRemoved.Should().Be(2,
            "second run removes the 2 feature rows from run 1");

        var snapshot2 = await CaptureImprovementSnapshotAsync();
        snapshot2.Should().BeEquivalentTo(snapshot1,
            "C3 replay must produce identical tf_improvement + tf_improvement_feature state");

        (await _db.TfImprovements.CountAsync()).Should().Be(1);
        (await _db.TfImprovementFeatures.CountAsync()).Should().Be(2);
        (await _db.SyncBridgeSourceXrefs
            .CountAsync(x => x.TfEntityType == "improvement")).Should().Be(1);
    }

    [Fact]
    public async Task Replay_C3_QuarantinePath_DeterministicReplay_PreservesQuarantine()
    {
        // Doctrine: quarantine rows are preserved, not discarded.
        // Re-promoting a batch whose only outcome is quarantine must
        // produce a single quarantine row, not duplicates, not
        // orphans.
        var truthBatch = await SeedCompletedBatchAsync("c3-quarantine-replay");
        await SeedTruthImprvAsync(truthBatch, propId: 100, imprvId: 1);
        // No parcel xref for prop 100 → row goes to quarantine.

        var projector = new PacsImprvCanonicalProjector(
            _db,
            new NullPerUniverseAttributeDictionary(),
            NullLogger<PacsImprvCanonicalProjector>.Instance);

        var run1 = await projector.ProjectAsync(truthBatch, "h3-quar-run1");
        run1.ImprovementsProjected.Should().Be(0);
        run1.RowsQuarantined.Should().Be(1);
        run1.PriorQuarantineRowsRemoved.Should().Be(0);

        var run2 = await projector.ProjectAsync(truthBatch, "h3-quar-run2");
        run2.ImprovementsProjected.Should().Be(0);
        run2.RowsQuarantined.Should().Be(1);
        run2.PriorQuarantineRowsRemoved.Should().Be(1,
            "second run cleans up the 1 quarantine row before re-inserting");

        // Final state: exactly one quarantine row, exactly the
        // expected reason, no canonical row.
        (await _db.LegacyTfUnprovenImprvCurrents.CountAsync())
            .Should().Be(1, "quarantine replay must not duplicate");
        (await _db.TfImprovements.CountAsync()).Should().Be(0);

        var quar = await _db.LegacyTfUnprovenImprvCurrents.SingleAsync();
        quar.PropId.Should().Be(100);
        quar.ImprvId.Should().Be(1);
        quar.QuarantineReason.Should().Be("NO_PARCEL_XREF");
    }

    [Fact]
    public async Task Replay_L3_Land_DeterministicReplay_ProducesIdenticalState()
    {
        // L3 added 2026-05-03 once the land canonical projector
        // shipped. Mirrors the C3 pattern; one parcel, multiple
        // land segments (homesite + ag + pasture) to exercise the
        // multiple-rows-per-parcel idempotency path.
        var truthBatch = await SeedCompletedBatchAsync("l3-replay");
        await SeedParcelWithXrefAsync(propId: 100);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 1,
            useCd: "RES", homesite: "Y", acres: 1.0m, marketVal: 60_000m);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 2,
            useCd: "AG", homesite: "N", acres: 80.0m, marketVal: 100_000m);
        await SeedTruthLandAsync(truthBatch, propId: 100, landSegId: 3,
            useCd: "AG", homesite: "N", acres: 40.0m, marketVal: 40_000m);

        var projector = new PacsLandCanonicalProjector(
            _db, NullLogger<PacsLandCanonicalProjector>.Instance);

        var run1 = await projector.ProjectAsync(truthBatch, "h3-l3-run1");
        run1.Status.Should().Be("COMPLETED");
        run1.LandsProjected.Should().Be(3);
        run1.PriorLandsRemoved.Should().Be(0);
        run1.SizeAcresProjected.Should().Be(121.0m);

        var snapshot1 = await CaptureLandSnapshotAsync();

        var run2 = await projector.ProjectAsync(truthBatch, "h3-l3-run2");
        run2.Status.Should().Be("COMPLETED");
        run2.LandsProjected.Should().Be(3);
        run2.PriorLandsRemoved.Should().Be(3,
            "second run removes the 3 lands produced by run 1");
        run2.SizeAcresProjected.Should().Be(121.0m,
            "aggregate sums must be deterministic across replays");

        var snapshot2 = await CaptureLandSnapshotAsync();
        snapshot2.Should().BeEquivalentTo(snapshot1,
            "L3 replay must produce identical tf_land state");

        (await _db.TfLands.CountAsync()).Should().Be(3);
        (await _db.SyncBridgeSourceXrefs
            .CountAsync(x => x.TfEntityType == "land")).Should().Be(3);
    }

    // ───────────────────────────────────────────────────────────────
    // Snapshot helpers — capture the canonical state shape that
    // replay must preserve. Each returns an order-independent
    // collection of value tuples (no GUIDs that vary across runs —
    // canonical IDs DO vary because re-promote inserts new rows;
    // we compare by lineage + value content instead).
    // ───────────────────────────────────────────────────────────────

    private async Task<List<object>> CaptureSaleSnapshotAsync()
    {
        // TfSale carries CountyId + TfParcelId + ChgOfOwnerId; the
        // (prop_val_yr, sup_num) tuple lives only in the source_xref
        // SourceKeyJson, so the year/sup are checked indirectly via
        // the xref serialization compare.
        var sales = await _db.TfSales
            .Select(s => new
            {
                s.CountyId,
                s.TfParcelId,
                s.ChgOfOwnerId,
                s.SaleQualified,
                s.SlPrice,
                s.AdjSlPrice,
            })
            .ToListAsync();

        var xrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == "sale")
            .Select(x => new { x.TfEntityType, x.SourceKeyJson, x.SourceTable })
            .ToListAsync();

        return sales.Cast<object>()
            .Concat(xrefs.Cast<object>())
            .OrderBy(o => JsonSerializer.Serialize(o))
            .ToList();
    }

    private async Task<List<object>> CaptureOwnerSnapshotAsync()
    {
        var owners = await _db.TfOwners
            .Select(o => new
            {
                o.CountyId,
                o.AcctId,
                o.DisplayName,
                o.ConfidentialFlag,
            })
            .ToListAsync();

        var links = await _db.TfParcelOwnerLinks
            .Select(l => new
            {
                l.TfParcelId,
                l.PctOwnership,
                l.IsPrimary,
            })
            .ToListAsync();

        var xrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == "owner")
            .Select(x => new { x.TfEntityType, x.SourceKeyJson })
            .ToListAsync();

        return owners.Cast<object>()
            .Concat(links.Cast<object>())
            .Concat(xrefs.Cast<object>())
            .OrderBy(o => JsonSerializer.Serialize(o))
            .ToList();
    }

    private async Task<List<object>> CaptureWsdorSnapshotAsync()
    {
        var rows = await _db.TfAssessmentWsdors
            .Select(a => new
            {
                a.CountyId,
                a.TfParcelId,
                a.AssessmentYear,
                a.SupNum,
                a.AssessedVal,
                a.MarketVal,
                a.BoeStatus,
            })
            .ToListAsync();

        var xrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == "assessment_wsdor")
            .Select(x => new { x.TfEntityType, x.SourceKeyJson })
            .ToListAsync();

        return rows.Cast<object>()
            .Concat(xrefs.Cast<object>())
            .OrderBy(o => JsonSerializer.Serialize(o))
            .ToList();
    }

    private async Task<List<object>> CaptureLandSnapshotAsync()
    {
        var lands = await _db.TfLands
            .Select(l => new
            {
                l.CountyId,
                l.TfParcelId,
                l.LandSegTypeCd,
                l.LandSegUseCd,
                l.IsHomesite,
                l.SizeAcres,
                l.LandSegMarketVal,
                l.LandSegAgValue,
            })
            .ToListAsync();

        var xrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == "land")
            .Select(x => new { x.TfEntityType, x.SourceKeyJson })
            .ToListAsync();

        return lands.Cast<object>()
            .Concat(xrefs.Cast<object>())
            .OrderBy(o => JsonSerializer.Serialize(o))
            .ToList();
    }

    private async Task<List<object>> CaptureImprovementSnapshotAsync()
    {
        var imprvs = await _db.TfImprovements
            .Select(i => new
            {
                i.CountyId,
                i.TfParcelId,
                i.ImprvTypeCd,
                i.ImprvClassCd,
                i.IsHomesite,
                i.ImprvVal,
                i.YearBuilt,
            })
            .ToListAsync();

        var features = await _db.TfImprovementFeatures
            .Select(f => new
            {
                f.FeatureCode,
                f.MethodCd,
                f.ClassCd,
                f.Area,
                f.Value,
                f.NumUnits,
                f.YrBuilt,
            })
            .ToListAsync();

        var xrefs = await _db.SyncBridgeSourceXrefs
            .Where(x => x.TfEntityType == "improvement")
            .Select(x => new { x.TfEntityType, x.SourceKeyJson })
            .ToListAsync();

        return imprvs.Cast<object>()
            .Concat(features.Cast<object>())
            .Concat(xrefs.Cast<object>())
            .OrderBy(o => JsonSerializer.Serialize(o))
            .ToList();
    }

    // ───────────────────────────────────────────────────────────────
    // Seeders — minimal versions, lifted from the existing
    // per-projector tests. Kept in this file so the harness is
    // self-contained.
    // ───────────────────────────────────────────────────────────────

    private async Task<Guid> SeedCompletedBatchAsync(string label)
    {
        var b = new LoadBatch
        {
            SourceFamily = SourceFamilies.PacsOltp,
            SourceSystem = "JCHARRISPACS",
            SourceFileOrDatabase = label,
            SourceQueryHash = "h3",
            Operator = "h3-test",
            Status = "COMPLETED",
            StartedAt = DateTime.UtcNow.AddMinutes(-5),
            CompletedAt = DateTime.UtcNow.AddMinutes(-1),
        };
        _db.SyncBridgeLoadBatches.Add(b);
        await _db.SaveChangesAsync();
        return b.LoadBatchId;
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
                prop_id = propId,
                prop_val_yr = year,
                sup_num = sup,
            }),
            SourceQueryHash = "qh",
            LoadBatchId = Guid.NewGuid(),
            IsActive = true,
        });
        await _db.SaveChangesAsync();
        return (parcel.TfParcelId, countyId);
    }

    private async Task SeedOwnerXrefOnlyAsync(Guid countyId, long acctId)
    {
        // For B4 replay we need a TfOwner xref but we don't run B3
        // here — just seed the owner row + xref directly so the
        // wsdor projector can resolve owner_id to TfOwnerId.
        var owner = new TfOwner
        {
            CountyId = countyId,
            AcctId = acctId,
            DisplayName = $"Owner-{acctId}",
            PromotionLoadBatchId = Guid.NewGuid(),
        };
        _db.TfOwners.Add(owner);
        await _db.SaveChangesAsync();

        _db.SyncBridgeSourceXrefs.Add(new SourceXref
        {
            TfEntityType = "owner",
            TfEntityId = owner.TfOwnerId,
            SourceSystem = "PACS_OLTP",
            SourceTable = "account",
            SourceKeyJson = JsonSerializer.Serialize(new { acct_id = acctId }),
            SourceQueryHash = "qh",
            LoadBatchId = Guid.NewGuid(),
            IsActive = true,
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedTruthSaleAsync(
        Guid promotionBatchId, long chg, int propId,
        short year = 2026, short sup = 0)
    {
        _db.TruthPacsSales.Add(new TruthPacsSale
        {
            ChgOfOwnerId = chg,
            PropId = propId,
            PropValYr = year,
            SupNum = sup,
            SlCountyRatioCd = "100",
            SlDt = new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            SlPrice = 350_000m,
            AdjSlPrice = 350_000m,
            SourceSaleLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            SaleLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedTruthOwnerAsync(
        Guid promotionBatchId, int propId, long ownerId, long acctId,
        short year = 2026, short sup = 0)
    {
        _db.TruthPacsOwnerCurrents.Add(new TruthPacsOwnerCurrent
        {
            PropId = propId,
            OwnerTaxYr = year,
            SupNum = sup,
            OwnerId = ownerId,
            AcctId = acctId,
            FileAsName = $"Owner-{acctId}",
            FirstName = "First",
            LastName = "Last",
            ConfidentialFlag = false,
            WebSuppression = false,
            PctOwnership = 100m,
            TypeOfOwner = "I",
            SourceOwnerLandedRowId = Guid.NewGuid(),
            SourceAccountLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            OwnerLoadBatchId = Guid.NewGuid(),
            AccountLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedTruthWpovAsync(
        Guid promotionBatchId, int propId, long ownerId,
        decimal? assessed = 250_000m, short year = 2026, short sup = 0)
    {
        _db.TruthPacsWashPropOwnerVals.Add(new TruthPacsWashPropOwnerVal
        {
            PropValYr = year,
            SupNum = sup,
            PropId = propId,
            OwnerId = ownerId,
            AssessedVal = assessed,
            MarketVal = 300_000m,
            AppraisedVal = assessed,
            TaxableClassified = assessed,
            BoeStatus = "F",
            SourceWpovLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            WpovLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedTruthImprvAsync(
        Guid promotionBatchId, int propId, long imprvId,
        short year = 2026, short sup = 0)
    {
        _db.TruthPacsImprvCurrents.Add(new TruthPacsImprvCurrent
        {
            PropValYr = year,
            SupNum = sup,
            PropId = propId,
            ImprvId = imprvId,
            ImprvTypeCd = "R",
            ImprvClassCd = "B",
            ImprvHomesite = "Y",
            ImprvVal = 250_000m,
            ImprvDesc = $"Imprv {imprvId}",
            YearBuilt = 1990,
            EffectiveYearBuilt = 1990,
            ActualYearBuilt = 1990,
            SourceImprvLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            ImprvLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedTruthLandAsync(
        Guid promotionBatchId, int propId, long landSegId,
        string useCd = "RES", string homesite = "Y",
        decimal acres = 1.0m, decimal marketVal = 50_000m,
        short year = 2026, short sup = 0)
    {
        _db.TruthPacsLandCurrents.Add(new TruthPacsLandCurrent
        {
            PropValYr = year,
            SupNum = sup,
            PropId = propId,
            LandSegId = landSegId,
            LandSegTypeCd = "PRIMARY",
            LandSegStateCd = "WA",
            LandSegClassCd = "R",
            LandSegUseCd = useCd,
            LandSegHomesite = homesite,
            SizeAcres = acres,
            SizeSquareFeet = acres * 43560m,
            LandSegMarketVal = marketVal,
            LandSegAssessedVal = marketVal,
            SourceLandLandedRowId = Guid.NewGuid(),
            SourceSuppAssocLandedRowId = Guid.NewGuid(),
            LandLoadBatchId = Guid.NewGuid(),
            SuppAssocLoadBatchId = Guid.NewGuid(),
            PromotionLoadBatchId = promotionBatchId,
        });
        await _db.SaveChangesAsync();
    }

    private async Task SeedRawDetailAsync(
        int propId, long imprvId, long imprvDetId, string typeCd,
        decimal? area = 1500m, decimal? val = 100_000m,
        short year = 2026, short sup = 0)
    {
        _db.LegacyPacsRawImprvDetails.Add(new LegacyPacsRawImprvDetail
        {
            PropValYr = year,
            SupNum = sup,
            PropId = propId,
            ImprvId = imprvId,
            ImprvDetId = imprvDetId,
            ImprvDetTypeCd = typeCd,
            ImprvDetMethCd = "C",
            ImprvDetClassCd = "B",
            ImprvDetArea = area,
            ImprvDetVal = val,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
            SourceRowHash = $"row-{imprvDetId}",
        });
        await _db.SaveChangesAsync();
    }
}
