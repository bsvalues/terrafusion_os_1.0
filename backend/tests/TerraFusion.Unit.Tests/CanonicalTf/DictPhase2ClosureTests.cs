using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.Unit.Tests.CanonicalTf;

/// <summary>
/// Phase 2 closure — round-trip + sovereign-isolation acceptance
/// tests for the remaining six canonical dictionary tables called
/// out in <c>docs/pacs/blocks-d-through-h-design.md</c> §E:
/// <list type="bullet">
///   <item><see cref="DictLandUse"/></item>
///   <item><see cref="DictLandState"/></item>
///   <item><see cref="DictImprvType"/></item>
///   <item><see cref="DictImprvState"/></item>
///   <item><see cref="DictExemptionType"/></item>
///   <item><see cref="DictSitusLegal"/></item>
/// </list>
///
/// <para>Plus a TfParcel.ConversionEra round-trip test that closes
/// the parity gap with the other five canonical_tf entities.</para>
///
/// <para>Note on uniqueness: the (CountyId, &lt;Code&gt;) unique
/// indexes are locked at the EF model level and at the relational
/// provider level via the SyncE1G2DictsAndTfParcelConversionEra
/// migration. The InMemory provider used here does NOT enforce
/// indexes, so we assert via shape on the EF model and via
/// round-trip cross-county insert behavior, never via SaveChanges
/// throw. Mirrors <see cref="DictNeighborhoodTests"/>.</para>
/// </summary>
public sealed class DictPhase2ClosureTests : IDisposable
{
    private readonly TerraFusionDbContext _db;

    public DictPhase2ClosureTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"e1p2-{Guid.NewGuid():N}")
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

    // ──────────────────────────────────────────────────────────
    // dict_land_use
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task DictLandUse_RoundTrip_Persists()
    {
        var countyId = Guid.NewGuid();
        var loadBatchId = Guid.NewGuid();
        _db.DictLandUses.Add(new DictLandUse
        {
            CountyId = countyId,
            LandUseCd = "RES",
            Description = "Residential",
            LoadBatchId = loadBatchId,
            SourceQueryHash = "qh-lu-1",
        });
        await _db.SaveChangesAsync();

        var loaded = await _db.DictLandUses.SingleAsync();
        loaded.DictLandUseId.Should().NotBe(Guid.Empty);
        loaded.CountyId.Should().Be(countyId);
        loaded.LandUseCd.Should().Be("RES");
        loaded.Description.Should().Be("Residential");
        loaded.IsActive.Should().BeTrue("default IsActive is true");
        loaded.LoadBatchId.Should().Be(loadBatchId);
        loaded.SourceQueryHash.Should().Be("qh-lu-1");
    }

    [Fact]
    public async Task DictLandUse_SameCode_AcrossDifferentCounties_IsAllowed()
    {
        var bentonId = Guid.NewGuid();
        var franklinId = Guid.NewGuid();
        _db.DictLandUses.AddRange(
            new DictLandUse { CountyId = bentonId, LandUseCd = "AG",
                LoadBatchId = Guid.NewGuid(), SourceQueryHash = "qh" },
            new DictLandUse { CountyId = franklinId, LandUseCd = "AG",
                LoadBatchId = Guid.NewGuid(), SourceQueryHash = "qh" });
        await _db.SaveChangesAsync();

        var both = await _db.DictLandUses.Where(d => d.LandUseCd == "AG").ToListAsync();
        both.Should().HaveCount(2);
    }

    // ──────────────────────────────────────────────────────────
    // dict_land_state
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task DictLandState_RoundTrip_Persists()
    {
        var countyId = Guid.NewGuid();
        _db.DictLandStates.Add(new DictLandState
        {
            CountyId = countyId,
            LandStateCd = "WA",
            Description = "Washington",
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh-ls-1",
        });
        await _db.SaveChangesAsync();

        var loaded = await _db.DictLandStates.SingleAsync();
        loaded.LandStateCd.Should().Be("WA");
        loaded.Description.Should().Be("Washington");
        loaded.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task DictLandState_SoftRetire_KeepsRowQueryable()
    {
        var countyId = Guid.NewGuid();
        _db.DictLandStates.AddRange(
            new DictLandState { CountyId = countyId, LandStateCd = "ACT",
                LoadBatchId = Guid.NewGuid(), SourceQueryHash = "qh" },
            new DictLandState { CountyId = countyId, LandStateCd = "RET",
                LoadBatchId = Guid.NewGuid(), SourceQueryHash = "qh" });
        await _db.SaveChangesAsync();

        var retired = await _db.DictLandStates.SingleAsync(d => d.LandStateCd == "RET");
        retired.IsActive = false;
        await _db.SaveChangesAsync();

        (await _db.DictLandStates.CountAsync(d => d.CountyId == countyId))
            .Should().Be(2, "soft-retire never hard-deletes");
        (await _db.DictLandStates.CountAsync(d => d.CountyId == countyId && d.IsActive))
            .Should().Be(1);
    }

    // ──────────────────────────────────────────────────────────
    // dict_imprv_type
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task DictImprvType_RoundTrip_Persists()
    {
        var countyId = Guid.NewGuid();
        _db.DictImprvTypes.Add(new DictImprvType
        {
            CountyId = countyId,
            ImprvTypeCd = "ATTGAR",
            Description = "Attached garage",
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh-it-1",
        });
        await _db.SaveChangesAsync();

        var loaded = await _db.DictImprvTypes.SingleAsync();
        loaded.ImprvTypeCd.Should().Be("ATTGAR");
        loaded.Description.Should().Be("Attached garage");
    }

    [Fact]
    public async Task DictImprvType_SameCode_AcrossDifferentCounties_IsAllowed()
    {
        var c1 = Guid.NewGuid();
        var c2 = Guid.NewGuid();
        _db.DictImprvTypes.AddRange(
            new DictImprvType { CountyId = c1, ImprvTypeCd = "MA",
                LoadBatchId = Guid.NewGuid(), SourceQueryHash = "qh" },
            new DictImprvType { CountyId = c2, ImprvTypeCd = "MA",
                LoadBatchId = Guid.NewGuid(), SourceQueryHash = "qh" });
        await _db.SaveChangesAsync();
        (await _db.DictImprvTypes.CountAsync()).Should().Be(2);
    }

    // ──────────────────────────────────────────────────────────
    // dict_imprv_state
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task DictImprvState_RoundTrip_Persists()
    {
        var countyId = Guid.NewGuid();
        _db.DictImprvStates.Add(new DictImprvState
        {
            CountyId = countyId,
            ImprvStateCd = "WA",
            Description = "Washington",
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh-is-1",
        });
        await _db.SaveChangesAsync();

        var loaded = await _db.DictImprvStates.SingleAsync();
        loaded.ImprvStateCd.Should().Be("WA");
        loaded.IsActive.Should().BeTrue();
    }

    // ──────────────────────────────────────────────────────────
    // dict_exemption_type
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task DictExemptionType_RoundTrip_Persists()
    {
        var countyId = Guid.NewGuid();
        _db.DictExemptionTypes.Add(new DictExemptionType
        {
            CountyId = countyId,
            ExemptionTypeCd = "SR",
            Description = "Senior exemption",
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh-ex-1",
        });
        await _db.SaveChangesAsync();

        var loaded = await _db.DictExemptionTypes.SingleAsync();
        loaded.ExemptionTypeCd.Should().Be("SR");
        loaded.Description.Should().Be("Senior exemption");
    }

    [Fact]
    public async Task DictExemptionType_Provenance_RoundTrips()
    {
        var countyId = Guid.NewGuid();
        var batch1 = Guid.NewGuid();
        var batch2 = Guid.NewGuid();
        _db.DictExemptionTypes.AddRange(
            new DictExemptionType { CountyId = countyId, ExemptionTypeCd = "X1",
                LoadBatchId = batch1, SourceQueryHash = "h1" },
            new DictExemptionType { CountyId = countyId, ExemptionTypeCd = "X2",
                LoadBatchId = batch2, SourceQueryHash = "h2" });
        await _db.SaveChangesAsync();

        var b1Rows = await _db.DictExemptionTypes
            .Where(d => d.LoadBatchId == batch1).ToListAsync();
        b1Rows.Should().HaveCount(1);
        b1Rows[0].SourceQueryHash.Should().Be("h1");
    }

    // ──────────────────────────────────────────────────────────
    // dict_situs_legal
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task DictSitusLegal_RoundTrip_Persists()
    {
        var countyId = Guid.NewGuid();
        _db.DictSitusLegals.Add(new DictSitusLegal
        {
            CountyId = countyId,
            SitusLegalCd = "PRIM",
            Description = "Primary situs",
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh-sl-1",
        });
        await _db.SaveChangesAsync();

        var loaded = await _db.DictSitusLegals.SingleAsync();
        loaded.SitusLegalCd.Should().Be("PRIM");
        loaded.IsActive.Should().BeTrue();
    }

    // ──────────────────────────────────────────────────────────
    // EF model shape: every Dict* exposes a unique (CountyId, code)
    // index per the sovereign-county isolation invariant
    // ──────────────────────────────────────────────────────────

    [Fact]
    public void DictLandUse_HasUniqueCountyCodeIndex()
        => AssertHasUniqueCountyCodeIndex<DictLandUse>("CountyId", "LandUseCd");

    [Fact]
    public void DictLandState_HasUniqueCountyCodeIndex()
        => AssertHasUniqueCountyCodeIndex<DictLandState>("CountyId", "LandStateCd");

    [Fact]
    public void DictImprvType_HasUniqueCountyCodeIndex()
        => AssertHasUniqueCountyCodeIndex<DictImprvType>("CountyId", "ImprvTypeCd");

    [Fact]
    public void DictImprvState_HasUniqueCountyCodeIndex()
        => AssertHasUniqueCountyCodeIndex<DictImprvState>("CountyId", "ImprvStateCd");

    [Fact]
    public void DictExemptionType_HasUniqueCountyCodeIndex()
        => AssertHasUniqueCountyCodeIndex<DictExemptionType>("CountyId", "ExemptionTypeCd");

    [Fact]
    public void DictSitusLegal_HasUniqueCountyCodeIndex()
        => AssertHasUniqueCountyCodeIndex<DictSitusLegal>("CountyId", "SitusLegalCd");

    private void AssertHasUniqueCountyCodeIndex<T>(string countyProp, string codeProp)
        where T : class
    {
        var et = _db.Model.FindEntityType(typeof(T));
        et.Should().NotBeNull($"{typeof(T).Name} must be mapped");
        var indexes = et!.GetIndexes().ToList();
        indexes.Should().Contain(idx =>
            idx.IsUnique
            && idx.Properties.Count == 2
            && idx.Properties[0].Name == countyProp
            && idx.Properties[1].Name == codeProp,
            $"{typeof(T).Name} must have a unique ({countyProp}, {codeProp}) index per sovereign-county isolation");
    }

    // ──────────────────────────────────────────────────────────
    // TfParcel.ConversionEra (G2 closure)
    // ──────────────────────────────────────────────────────────

    [Fact]
    public async Task TfParcel_ConversionEra_RoundTrips()
    {
        var parcel = new TfParcel
        {
            CountyId = Guid.NewGuid(),
            ParcelNumber = "1-2345-6789",
            ParcelStatus = "ACTIVE",
            PropertyType = "R",
            ConversionEra = "POST_CONVERSION",
        };
        _db.TfParcels.Add(parcel);
        await _db.SaveChangesAsync();

        var loaded = await _db.TfParcels.SingleAsync();
        loaded.ConversionEra.Should().Be("POST_CONVERSION",
            "G2 parity: TfParcel.ConversionEra must persist alongside the other canonical_tf entities");
    }

    [Fact]
    public async Task TfParcel_ConversionEra_NullablePersists()
    {
        // Back-compat: rows projected before this slice carry NULL.
        var parcel = new TfParcel
        {
            CountyId = Guid.NewGuid(),
            ParcelNumber = "1-2345-6789",
            ParcelStatus = "ACTIVE",
            ConversionEra = null,
        };
        _db.TfParcels.Add(parcel);
        await _db.SaveChangesAsync();

        var loaded = await _db.TfParcels.SingleAsync();
        loaded.ConversionEra.Should().BeNull();
    }

    [Fact]
    public void TfParcel_ConversionEra_IsNullable_AndMaxLength20()
    {
        var et = _db.Model.FindEntityType(typeof(TfParcel));
        et.Should().NotBeNull();
        var era = et!.FindProperty(nameof(TfParcel.ConversionEra));
        era.Should().NotBeNull("G2 parity: TfParcel must carry ConversionEra");
        era!.IsNullable.Should().BeTrue(
            "G2 parity: ConversionEra is nullable for back-compat");
        era.GetMaxLength().Should().Be(20,
            "G2 parity: ConversionEra max length matches the other canonical_tf entities");
        era.ClrType.Should().Be(typeof(string));
    }
}
