// Phase 33A.3 — Forge Year-Layer Truth
// Tests for ValuationService.GetAvailableYearsAsync
//
// Verifies:
//   1. Unknown parcel → empty result, no throw
//   2. Known parcel, one base layer → single layer returned, defaultYear set
//   3. Ag parcel (AgUseVal > 0) → CurrentUseAg=true, deferred amounts mapped
//   4. Earliest-known-layer flag → only the minimum-year base layer is flagged
//   5. Multi-year parcel → ordered most-recent first, defaultYear = latest base
//   6. Supplemental layer (SupNum > 0) → LayerType = "supplemental", IsEarliestKnownLayer = false
//   7. Exemption codes → mapped to the correct year layer
//   8. No effectiveTaxYear substitution — year with no data returns empty Layers,
//      not a silently substituted alternative-year result
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.Entities.Pacs;
using Xunit;

namespace TerraFusion.API.Tests.Integration;

/// <summary>
/// Unit tests for ValuationService.GetAvailableYearsAsync (Phase 33A.3).
///
/// Architecture: the year is not a preference — it is the working legal context.
/// These tests assert that year layers are returned exactly as stored in PACS
/// with no silent substitution, fallback renaming, or omission of enrollment flags.
/// </summary>
public sealed class ValuationServiceYearLayerTests : IDisposable
{
    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly ValuationService _sut;

    // Stable test GeoId — mirrors Benton County parcel format
    private const string TestGeoId = "TESTGEO0000001";

    public ValuationServiceYearLayerTests()
    {
        _db = TestDbContextFactory.CreateInMemoryContext();
        _sut = new ValuationService(_db, NullLogger<ValuationService>.Instance);
    }

    public void Dispose() => _db.Dispose();

    // ── Helpers ────────────────────────────────────────────────────────────

    private PacsParcel SeedParcel(string geoId = TestGeoId)
    {
        var parcel = new PacsParcel
        {
            Id = Guid.NewGuid(),
            GeoId = geoId,
            SimpleGeoId = geoId,
            CountyId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            SyncedAt = DateTime.UtcNow,
        };
        _db.PacsParcel.Add(parcel);
        _db.SaveChanges();
        return parcel;
    }

    private PacsValuation SeedValuation(
        Guid parcelId,
        int year,
        int supNum = 0,
        decimal? assessedVal = 100_000,
        decimal? market = 200_000,
        decimal? agUseVal = null,
        decimal? agLoss = null,
        decimal? agLateLoss = null,
        decimal? timberUse = null,
        decimal? timberLoss = null,
        bool hasLockedValues = false,
        string? propState = null)
    {
        var v = new PacsValuation
        {
            Id = Guid.NewGuid(),
            ParcelId = parcelId,
            PacsPropId = 0,
            PropValYear = year,
            SupNum = supNum,
            AssessedVal = assessedVal,
            Market = market,
            AgUseVal = agUseVal,
            AgLoss = agLoss,
            AgLateLoss = agLateLoss,
            TimberUse = timberUse,
            TimberLoss = timberLoss,
            HasLockedValues = hasLockedValues,
            PropState = propState,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        _db.PacsValuations.Add(v);
        _db.SaveChanges();
        return v;
    }

    private void SeedExemption(Guid parcelId, int year, string code)
    {
        _db.PacsExemptions.Add(new PacsExemption
        {
            Id = Guid.NewGuid(),
            ParcelId = parcelId,
            PacsPropId = 0,
            ExemptTaxYear = year,
            ExemptTypeCode = code,
        });
        _db.SaveChanges();
    }

    // ── Tests ──────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetAvailableYears_UnknownParcel_ReturnsEmptyResult()
    {
        var result = await _sut.GetAvailableYearsAsync("NONEXISTENT_GEO", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("NONEXISTENT_GEO", result.ParcelId);
        Assert.Empty(result.Layers);
        Assert.Null(result.DefaultYear);
    }

    [Fact]
    public async Task GetAvailableYears_OneBaseLayer_ReturnsSingleLayer_DefaultYearSet()
    {
        var parcel = SeedParcel();
        SeedValuation(parcel.Id, year: 2015, assessedVal: 256_540, market: 720_770);

        var result = await _sut.GetAvailableYearsAsync(TestGeoId, CancellationToken.None);

        Assert.Single(result.Layers);
        Assert.Equal(2015, result.DefaultYear);

        var layer = result.Layers[0];
        Assert.Equal(2015, layer.Year);
        Assert.Equal(0, layer.SupNum);
        Assert.Equal("base", layer.LayerType);
        Assert.Equal(256_540m, layer.AssessedValue);
        Assert.Equal(720_770m, layer.MarketValue);
    }

    [Fact]
    public async Task GetAvailableYears_AgParcel_CurrentUseAgTrue_DeferredAmountsMapped()
    {
        var parcel = SeedParcel();
        SeedValuation(parcel.Id, year: 2015,
            agUseVal: 150_000,
            agLoss: 464_230,
            agLateLoss: 12_000);

        var result = await _sut.GetAvailableYearsAsync(TestGeoId, CancellationToken.None);

        var layer = Assert.Single(result.Layers);
        Assert.True(layer.Programs.CurrentUseAg, "CurrentUseAg should be true when AgUseVal > 0");
        Assert.Equal(464_230m, layer.Programs.AgLossDeferred);
        Assert.Equal(12_000m, layer.Programs.AgLateLossDeferred);
        Assert.False(layer.Programs.CurrentUseTimber);
    }

    [Fact]
    public async Task GetAvailableYears_TimberParcel_CurrentUseTimberTrue()
    {
        var parcel = SeedParcel();
        SeedValuation(parcel.Id, year: 2020, timberUse: 80_000, timberLoss: 30_000);

        var result = await _sut.GetAvailableYearsAsync(TestGeoId, CancellationToken.None);

        var layer = Assert.Single(result.Layers);
        Assert.True(layer.Programs.CurrentUseTimber);
        Assert.Equal(30_000m, layer.Programs.TimberLossDeferred);
        Assert.False(layer.Programs.CurrentUseAg);
    }

    [Fact]
    public async Task GetAvailableYears_EarliestKnownLayerFlag_OnlyMinYearBase()
    {
        var parcel = SeedParcel();
        SeedValuation(parcel.Id, year: 2015, supNum: 0); // earliest base
        SeedValuation(parcel.Id, year: 2019, supNum: 0);
        SeedValuation(parcel.Id, year: 2021, supNum: 0);

        var result = await _sut.GetAvailableYearsAsync(TestGeoId, CancellationToken.None);

        Assert.Equal(3, result.Layers.Count);

        var earliest = result.Layers.Single(l => l.Year == 2015);
        var others = result.Layers.Where(l => l.Year != 2015);

        Assert.True(earliest.IsEarliestKnownLayer, "Year 2015 should be flagged as earliest known layer");
        Assert.All(others, l => Assert.False(l.IsEarliestKnownLayer,
            $"Year {l.Year} should not be flagged as earliest known layer"));
    }

    [Fact]
    public async Task GetAvailableYears_MultiYear_OrderedMostRecentFirst_DefaultYearIsLatest()
    {
        var parcel = SeedParcel();
        SeedValuation(parcel.Id, year: 2015);
        SeedValuation(parcel.Id, year: 2019);
        SeedValuation(parcel.Id, year: 2023);

        var result = await _sut.GetAvailableYearsAsync(TestGeoId, CancellationToken.None);

        Assert.Equal(3, result.Layers.Count);
        Assert.Equal(2023, result.Layers[0].Year);
        Assert.Equal(2019, result.Layers[1].Year);
        Assert.Equal(2015, result.Layers[2].Year);
        Assert.Equal(2023, result.DefaultYear);
    }

    [Fact]
    public async Task GetAvailableYears_SupplementalLayer_LayerTypeSupplemental_NotEarliest()
    {
        var parcel = SeedParcel();
        SeedValuation(parcel.Id, year: 2015, supNum: 0);  // earliest base
        SeedValuation(parcel.Id, year: 2015, supNum: 1);  // supplemental same year

        var result = await _sut.GetAvailableYearsAsync(TestGeoId, CancellationToken.None);

        Assert.Equal(2, result.Layers.Count);

        var baseLayer = result.Layers.Single(l => l.SupNum == 0);
        var supLayer  = result.Layers.Single(l => l.SupNum == 1);

        Assert.Equal("base", baseLayer.LayerType);
        Assert.True(baseLayer.IsEarliestKnownLayer);

        Assert.Equal("supplemental", supLayer.LayerType);
        Assert.False(supLayer.IsEarliestKnownLayer,
            "Supplemental layer in minimum year should not be flagged as earliest");
    }

    [Fact]
    public async Task GetAvailableYears_ExemptionCodes_MappedToCorrectYear()
    {
        var parcel = SeedParcel();
        SeedValuation(parcel.Id, year: 2015);
        SeedValuation(parcel.Id, year: 2021);
        SeedExemption(parcel.Id, year: 2015, code: "AG");
        SeedExemption(parcel.Id, year: 2021, code: "OV65");
        SeedExemption(parcel.Id, year: 2021, code: "HS");

        var result = await _sut.GetAvailableYearsAsync(TestGeoId, CancellationToken.None);

        var layer2015 = result.Layers.Single(l => l.Year == 2015);
        var layer2021 = result.Layers.Single(l => l.Year == 2021);

        Assert.Equal(new[] { "AG" }, layer2015.Programs.ExemptionCodes);
        Assert.Equal(new[] { "HS", "OV65" }, layer2021.Programs.ExemptionCodes); // sorted
    }

    [Fact]
    public async Task GetAvailableYears_LockedLayer_IsLockedTrue()
    {
        var parcel = SeedParcel();
        SeedValuation(parcel.Id, year: 2022, hasLockedValues: true, propState: "A");

        var result = await _sut.GetAvailableYearsAsync(TestGeoId, CancellationToken.None);

        var layer = Assert.Single(result.Layers);
        Assert.True(layer.IsLocked);
        Assert.Equal("A", layer.PropState);
    }

    /// <summary>
    /// Regression guard: GetAvailableYearsAsync must never silently return data
    /// for a year that doesn't exist in PACS. A parcel with only a 2015 layer
    /// returns exactly one layer (2015). It does NOT populate a 2024 result.
    /// The removed ResolveEffectiveTaxYearAsync behaviour must not reappear.
    /// </summary>
    [Fact]
    public async Task GetAvailableYears_OnlyYearsThatExist_NoSilentSubstitution()
    {
        var parcel = SeedParcel();
        SeedValuation(parcel.Id, year: 2015);
        // Intentionally: no 2024, no 2023, no 2022, no 2021, no other years

        var result = await _sut.GetAvailableYearsAsync(TestGeoId, CancellationToken.None);

        // Exactly one layer must be returned — the one that actually exists
        Assert.Single(result.Layers);
        Assert.Equal(2015, result.Layers[0].Year);
        Assert.Equal(2015, result.DefaultYear);

        // The approach queries will return fallback/no-data for any year != 2015.
        // This test confirms the /years contract truthfully lists only 2015,
        // letting the UI show an exact-year empty state for any other request.
        Assert.DoesNotContain(result.Layers, l => l.Year != 2015);
    }
}
