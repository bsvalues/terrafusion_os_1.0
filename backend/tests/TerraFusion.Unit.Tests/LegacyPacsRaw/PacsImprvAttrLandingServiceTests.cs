using System.Runtime.CompilerServices;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsImprvAttr;
using TerraFusion.Data;
using TerraFusion.Data.Services.LegacyPacsRaw;
using Xunit;

namespace TerraFusion.Unit.Tests.LegacyPacsRaw;

/// <summary>
/// Slice C1-C acceptance tests. Proves the five C1-C promotion gates
/// and the doctrine invariants — including the dictionary-cross-check
/// quarantine path that's unique to this slice.
/// </summary>
public sealed class PacsImprvAttrLandingServiceTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public PacsImprvAttrLandingServiceTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"c1c-{Guid.NewGuid():N}")
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

    private PacsImprvAttrLandingService BuildService(IImprvAttrDictionary? dictionary = null)
        => new(
            _db,
            dictionary ?? StandardDictionary(),
            NullLogger<PacsImprvAttrLandingService>.Instance);

    private static IImprvAttrDictionary StandardDictionary()
        => new InMemoryImprvAttrDictionary(new[]
        {
            "EXT-WALL-WOOD",
            "EXT-WALL-BRICK",
            "ROOF-COMP",
            "ROOF-METAL",
            "FOUNDATION-CONCRETE",
            "HEAT-CENTRAL",
            "STORIES-1",
            "STORIES-2",
        });

    private static FakeSource Source(params PacsSourceImprvAttr[] rows) => new(rows);

    private static PacsSourceImprvAttr Attr(
        long imprvDetId, long iAttrValId,
        string code = "ROOF-COMP",
        string? text = null, decimal? num = null,
        int propId = 100, long imprvId = 1,
        short year = 2026, short sup = 0)
        => new(year, sup, propId, imprvId, imprvDetId, iAttrValId, code, text, num);

    [Fact]
    public async Task HappyPath_AllCodesInDictionary_LandsAllRows_NoQuarantine()
    {
        var src = Source(
            Attr(imprvDetId: 10, iAttrValId: 1, code: "ROOF-COMP"),
            Attr(imprvDetId: 10, iAttrValId: 2, code: "EXT-WALL-WOOD"),
            Attr(imprvDetId: 10, iAttrValId: 3, code: "FOUNDATION-CONCRETE"),
            Attr(imprvDetId: 10, iAttrValId: 4, code: "HEAT-CENTRAL"));

        var result = await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        result.Status.Should().Be("COMPLETED");
        result.RowsConsidered.Should().Be(4);
        result.RowsLanded.Should().Be(4);
        result.RowsQuarantined.Should().Be(0);

        (await _db.LegacyPacsRawImprvAttrs.CountAsync()).Should().Be(4);
        (await _db.LegacyTfUnprovenImprvAttrs.CountAsync()).Should().Be(0);

        var dictGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-attr-dictionary-coverage");
        dictGate.Status.Should().Be("PASS",
            "all codes in dictionary → coverage gate PASSes");
    }

    [Fact]
    public async Task UnknownCode_QuarantinesToLegacyTfUnproven_DictionaryGateWARNs()
    {
        var src = Source(
            Attr(imprvDetId: 10, iAttrValId: 1, code: "ROOF-COMP"),         // known
            Attr(imprvDetId: 10, iAttrValId: 2, code: "MADE-UP-CODE-XYZ")); // unknown

        var result = await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        result.RowsConsidered.Should().Be(2);
        result.RowsLanded.Should().Be(1);
        result.RowsQuarantined.Should().Be(1);

        // Validation: each row went to exactly one destination.
        (await _db.LegacyPacsRawImprvAttrs.CountAsync()).Should().Be(1);
        var quarantine = await _db.LegacyTfUnprovenImprvAttrs.SingleAsync();
        quarantine.IAttrValCd.Should().Be("MADE-UP-CODE-XYZ");
        quarantine.QuarantineReason.Should().Be("UNKNOWN_I_ATTR_VAL_CD");

        var dictGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-attr-dictionary-coverage");
        dictGate.Status.Should().Be("WARN",
            "any quarantined row → coverage gate WARNs (visibility, not failure)");
        dictGate.Detail.Should().Contain("dictionary drift");
    }

    [Fact]
    public async Task EveryLandedRow_HasLoadBatchId_AndSourceQueryHash()
    {
        var src = Source(
            Attr(10, 1, "ROOF-COMP"),
            Attr(10, 2, "EXT-WALL-BRICK"),
            Attr(10, 3, "STORIES-2"));

        var result = await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        var rows = await _db.LegacyPacsRawImprvAttrs.ToListAsync();
        rows.Should().HaveCount(3);
        rows.Should().OnlyContain(r => r.LoadBatchId == result.LoadBatchId);
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceQueryHash));
        rows.Should().OnlyContain(r => !string.IsNullOrEmpty(r.SourceRowHash));
    }

    [Fact]
    public async Task QuarantinedRow_AlsoCarries_LandingLoadBatchId()
    {
        var src = Source(Attr(10, 1, "UNKNOWN"));
        var result = await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        var quarantine = await _db.LegacyTfUnprovenImprvAttrs.SingleAsync();
        quarantine.LandingLoadBatchId.Should().Be(result.LoadBatchId);
    }

    [Fact]
    public async Task DuplicateSixKey_TripsUniquenessGate_AcrossLandedAndQuarantined()
    {
        var src = Source(
            Attr(imprvDetId: 10, iAttrValId: 1, code: "ROOF-COMP"),       // landed
            Attr(imprvDetId: 10, iAttrValId: 1, code: "BAD-CODE"),         // quarantined, same key
            Attr(imprvDetId: 11, iAttrValId: 2, code: "EXT-WALL-WOOD"));

        var result = await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        // The 6-key counter spans both destinations; same (PropId,
        // Year, Sup, ImprvId, ImprvDetId, IAttrValId) → duplicate.
        result.DuplicateKeyViolations.Should().Be(1);

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-attr-key-uniqueness");
        gate.Status.Should().Be("FAIL");
    }

    [Fact]
    public async Task DistributionGate_RecordsBothKnownAndUnknownHistograms()
    {
        var src = Source(
            Attr(10, 1, "ROOF-COMP"),
            Attr(10, 2, "ROOF-COMP"),
            Attr(10, 3, "EXT-WALL-WOOD"),
            Attr(10, 4, "MADE-UP-1"),
            Attr(10, 5, "MADE-UP-2"));

        await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-attr-distribution");
        gate.Status.Should().Be("PASS");
        gate.Detail.Should().Contain("known/ROOF-COMP=2");
        gate.Detail.Should().Contain("known/EXT-WALL-WOOD=1");
        gate.Detail.Should().Contain("unknown/MADE-UP-1=1");
        gate.Detail.Should().Contain("unknown/MADE-UP-2=1");
    }

    [Fact]
    public async Task AggregateGate_ReportsConsideredVsLandedVsQuarantined()
    {
        var src = Source(
            Attr(10, 1, "ROOF-COMP"),
            Attr(10, 2, "BAD-CODE"),
            Attr(10, 3, "EXT-WALL-BRICK"));

        await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        var gate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-attr-aggregate");
        gate.Detail.Should().Contain("considered=3");
        gate.Detail.Should().Contain("landed=2");
        gate.Detail.Should().Contain("quarantined=1");
    }

    [Fact]
    public async Task EmptyDictionary_AllRowsQuarantine()
    {
        var emptyDict = new InMemoryImprvAttrDictionary(Array.Empty<string>());
        var src = Source(
            Attr(10, 1, "ROOF-COMP"),
            Attr(10, 2, "EXT-WALL-WOOD"));

        var result = await BuildService(emptyDict).LandImprvAttrsAsync(src, "c1c-test");

        result.RowsLanded.Should().Be(0);
        result.RowsQuarantined.Should().Be(2);
        (await _db.LegacyPacsRawImprvAttrs.CountAsync()).Should().Be(0);
        (await _db.LegacyTfUnprovenImprvAttrs.CountAsync()).Should().Be(2);
    }

    [Fact]
    public async Task DictionaryCheck_IsCaseSensitive()
    {
        // PACS dictionary is case-sensitive; the doctrine treats
        // "ROOF-COMP" as distinct from "roof-comp". This test pins
        // that contract.
        var src = Source(Attr(10, 1, "roof-comp")); // lowercase

        var result = await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        result.RowsLanded.Should().Be(0);
        result.RowsQuarantined.Should().Be(1);
    }

    [Fact]
    public async Task EmptySource_StillOpensAndClosesBatch_WithFiveGates()
    {
        var src = Source();
        var result = await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        result.RowsConsidered.Should().Be(0);
        result.Status.Should().Be("COMPLETED");

        var gates = await _db.SyncBridgePromotionGateResults.ToListAsync();
        gates.Should().HaveCount(5);
        gates.Should().OnlyContain(g => g.Status != "FAIL");
    }

    [Fact]
    public async Task FailingSource_MarksLoadBatchFailed_NoPartialWrite()
    {
        var src = new ThrowingSource(new InvalidOperationException("simulated"));
        var result = await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        result.Status.Should().Be("FAILED");
        var batch = await _db.SyncBridgeLoadBatches.SingleAsync();
        batch.Status.Should().Be("FAILED");

        (await _db.LegacyPacsRawImprvAttrs.CountAsync()).Should().Be(0);
        (await _db.LegacyTfUnprovenImprvAttrs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task SourceQueryHash_IsStable_ForIdenticalQueryText()
    {
        var src1 = Source(Attr(10, 1, "ROOF-COMP"));
        var src2 = Source(Attr(11, 1, "EXT-WALL-WOOD"));

        var r1 = await BuildService().LandImprvAttrsAsync(src1, "c1c-test");
        var r2 = await BuildService().LandImprvAttrsAsync(src2, "c1c-test");

        var b1 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r1.LoadBatchId);
        var b2 = await _db.SyncBridgeLoadBatches.FirstAsync(b => b.LoadBatchId == r2.LoadBatchId);
        b1.SourceQueryHash.Should().Be(b2.SourceQueryHash);
    }

    [Fact]
    public async Task DoctrineRejection_NoCanonicalPromotion_OccursInC1C()
    {
        var src = Source(Attr(10, 1, "ROOF-COMP"));
        await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        // C1-C is raw landing only.
        (await _db.TfParcels.CountAsync()).Should().Be(0);
        (await _db.SyncBridgeSourceXrefs.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task AttrValueText_AndNumeric_RoundTripVerbatim()
    {
        var src = Source(new PacsSourceImprvAttr(
            PropValYr: 2026, SupNum: 0, PropId: 100, ImprvId: 1, ImprvDetId: 10,
            IAttrValId: 99,
            IAttrValCd: "ROOF-COMP",
            AttrValueText: "Composition asphalt shingle, 30-year warranty",
            AttrValueNumeric: 1500.5m));

        await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        var row = await _db.LegacyPacsRawImprvAttrs.SingleAsync();
        row.AttrValueText.Should().Be("Composition asphalt shingle, 30-year warranty");
        row.AttrValueNumeric.Should().Be(1500.5m);
    }

    [Fact]
    public async Task DictionaryCount_IsReportedInPassingCoverageGateDetail()
    {
        var src = Source(Attr(10, 1, "ROOF-COMP"));
        await BuildService().LandImprvAttrsAsync(src, "c1c-test");

        var dictGate = await _db.SyncBridgePromotionGateResults
            .SingleAsync(g => g.GateName == "imprv-attr-dictionary-coverage");
        dictGate.Status.Should().Be("PASS");
        dictGate.Detail.Should().Contain("8 codes",
            "the standard test dictionary has 8 codes; the gate detail surfaces the size");
    }

    // ── Test doubles ────────────────────────────────────────────────

    private sealed class FakeSource : IPacsImprvAttrSource
    {
        private readonly IReadOnlyList<PacsSourceImprvAttr> _rows;
        public FakeSource(IEnumerable<PacsSourceImprvAttr> rows) => _rows = rows.ToList();

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText =>
            "SELECT prop_val_yr, sup_num, prop_id, imprv_id, imprv_det_id, i_attr_val_id, i_attr_val_cd, attr_value_text, attr_value_numeric FROM dbo.imprv_attr";

        public async IAsyncEnumerable<PacsSourceImprvAttr> StreamImprvAttrsAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            foreach (var r in _rows)
            {
                cancellationToken.ThrowIfCancellationRequested();
                yield return r;
                await Task.Yield();
            }
        }
    }

    private sealed class ThrowingSource : IPacsImprvAttrSource
    {
        private readonly Exception _ex;
        public ThrowingSource(Exception ex) => _ex = ex;

        public string SourceSystem => "JCHARRISPACS";
        public string SourceFileOrDatabase => "pacs_oltp";
        public string SourceQueryText => "SELECT 1";

        public async IAsyncEnumerable<PacsSourceImprvAttr> StreamImprvAttrsAsync(
            [EnumeratorCancellation] CancellationToken cancellationToken)
        {
            await Task.Yield();
            throw _ex;
#pragma warning disable CS0162
            yield break;
#pragma warning restore CS0162
        }
    }
}
