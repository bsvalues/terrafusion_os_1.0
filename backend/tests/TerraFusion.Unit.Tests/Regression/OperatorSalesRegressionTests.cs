using System.Text.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.CanonicalTf;
using TerraFusion.Core.Entities.LegacyPacsRaw;
using TerraFusion.Core.Entities.SyncBridge;
using TerraFusion.Core.Sync.PacsSaleRegression;
using TerraFusion.Data;
using TerraFusion.Data.Services.Regression;
using Xunit;

namespace TerraFusion.Unit.Tests.Regression;

/// <summary>
/// Slice S5 acceptance tests. The doctrine: same fixture, same
/// answer, regardless of whether the operator queries against the
/// raw layer (PACS-flavor) or the canonical layer (TF-flavor).
///
/// <para>For each fixture, both flavors run the three Q1/Q2/Q3
/// queries and the test asserts equality. Any divergence is a
/// doctrine violation in the layer between raw and canonical.</para>
///
/// <para>Reference: <c>docs/sync/operator-sql-regression/sales-ratio-queries.md</c>.</para>
/// </summary>
public sealed class OperatorSalesRegressionTests : IDisposable
{
    private static readonly Guid CountyA =
        Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly Guid CountyB =
        Guid.Parse("20200020-2020-2020-2020-202020202020");

    private static readonly DateTime CutoverUtc =
        new(2018, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;

    public OperatorSalesRegressionTests()
    {
        var options = new DbContextOptionsBuilder<TerraFusionDbContext>()
            .UseInMemoryDatabase(databaseName: $"s5-{Guid.NewGuid():N}")
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

    private OperatorSalesRegressionService BuildService() => new(_db);

    /// <summary>
    /// Seeds a single sale into BOTH the raw layer (with supp pointer
    /// + parcel xref so the PACS flavor's join + county scope find it)
    /// AND the canonical layer (so the canonical flavor finds it).
    /// </summary>
    private async Task SeedFixtureSaleAsync(
        Guid countyId,
        long chgOfOwnerId,
        int propId,
        DateTime? saleDt,
        decimal? price,
        string? code = "100",
        short year = 2026,
        short sup = 0)
    {
        // 1) parcel + parcel xref so the PACS flavor's county scope finds the row.
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

        // 2) raw_pacs.sale + raw_pacs.prop_supp_assoc (active sup = sup)
        _db.LegacyPacsRawSales.Add(new LegacyPacsRawSale
        {
            ChgOfOwnerId = chgOfOwnerId,
            PropId = propId,
            PropValYr = year,
            SupNum = sup,
            SlCountyRatioCd = code,
            WacCd = null,
            SlRatioTypeCd = null,
            SlDt = saleDt,
            SlPrice = price,
            AdjSlPrice = price,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
            SourceRowHash = $"rh-{chgOfOwnerId}",
        });
        _db.LegacyPacsRawPropSuppAssocs.Add(new LegacyPacsRawPropSuppAssoc
        {
            PropValYr = year,
            PropId = propId,
            SupNum = sup,
            LoadBatchId = Guid.NewGuid(),
            SourceQueryHash = "qh",
            SourceRowHash = $"supp-{propId}",
        });

        // 3) canonical_tf.tf_sale (only when the row would actually
        //    survive the doctrine — '100', any sl_dt; the test cases
        //    that simulate stale or pre-cutover rows omit this so we
        //    confirm both layers EXCLUDE them identically).
        var qualifies = code == "100";
        if (qualifies)
        {
            _db.TfSales.Add(new TfSale
            {
                CountyId = countyId,
                TfParcelId = parcel.TfParcelId,
                ChgOfOwnerId = chgOfOwnerId,
                SlDt = saleDt,
                SlPrice = price,
                AdjSlPrice = price,
                SaleQualified = true,
                PromotionLoadBatchId = Guid.NewGuid(),
            });
        }

        await _db.SaveChangesAsync();
    }

    [Fact]
    public async Task Q1_ValidSaleCount_PacsAndCanonical_AreEqual_OnHappyFixture()
    {
        await SeedFixtureSaleAsync(CountyA, 1, propId: 100,
            saleDt: new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 350_000m);
        await SeedFixtureSaleAsync(CountyA, 2, propId: 200,
            saleDt: new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 425_000m);
        await SeedFixtureSaleAsync(CountyA, 3, propId: 300,
            saleDt: new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 295_000m);

        var svc = BuildService();
        var pacs = await svc.ValidSaleCountPacsAsync(CountyA);
        var canonical = await svc.ValidSaleCountCanonicalAsync(CountyA);

        pacs.Should().Be(canonical, "Q1 PACS and canonical counts must match");
        pacs.Should().Be(3);
    }

    [Fact]
    public async Task Q1_ExcludesPreCutoverSales_OnBothFlavors()
    {
        // Pre-cutover row: should be excluded by both flavors.
        await SeedFixtureSaleAsync(CountyA, 1, propId: 100,
            saleDt: new DateTime(2017, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 200_000m);
        // Post-cutover row.
        await SeedFixtureSaleAsync(CountyA, 2, propId: 200,
            saleDt: new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 350_000m);

        var svc = BuildService();
        (await svc.ValidSaleCountPacsAsync(CountyA))
            .Should().Be(await svc.ValidSaleCountCanonicalAsync(CountyA));
        (await svc.ValidSaleCountPacsAsync(CountyA)).Should().Be(1);
    }

    [Fact]
    public async Task Q1_ExcludesNonQualifiedSales_OnBothFlavors()
    {
        // '200' is "Invalid Sale" — neither flavor counts it.
        await SeedFixtureSaleAsync(CountyA, 1, propId: 100,
            saleDt: new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 350_000m, code: "200");
        await SeedFixtureSaleAsync(CountyA, 2, propId: 200,
            saleDt: new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 425_000m, code: "100");

        var svc = BuildService();
        (await svc.ValidSaleCountPacsAsync(CountyA))
            .Should().Be(await svc.ValidSaleCountCanonicalAsync(CountyA));
        (await svc.ValidSaleCountPacsAsync(CountyA)).Should().Be(1);
    }

    [Fact]
    public async Task Q1_ExcludesCrossCountySales_OnBothFlavors()
    {
        await SeedFixtureSaleAsync(CountyA, 1, propId: 100,
            saleDt: new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 350_000m);
        await SeedFixtureSaleAsync(CountyB, 2, propId: 200,
            saleDt: new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 425_000m);

        var svc = BuildService();
        var pacsA = await svc.ValidSaleCountPacsAsync(CountyA);
        var canonA = await svc.ValidSaleCountCanonicalAsync(CountyA);
        var pacsB = await svc.ValidSaleCountPacsAsync(CountyB);
        var canonB = await svc.ValidSaleCountCanonicalAsync(CountyB);

        pacsA.Should().Be(canonA).And.Be(1);
        pacsB.Should().Be(canonB).And.Be(1);
    }

    [Fact]
    public async Task Q2_YearHistogram_PacsAndCanonical_AreEqual()
    {
        await SeedFixtureSaleAsync(CountyA, 1, propId: 100,
            saleDt: new DateTime(2024, 7, 1, 0, 0, 0, DateTimeKind.Utc), price: 200_000m);
        await SeedFixtureSaleAsync(CountyA, 2, propId: 200,
            saleDt: new DateTime(2024, 9, 1, 0, 0, 0, DateTimeKind.Utc), price: 210_000m);
        await SeedFixtureSaleAsync(CountyA, 3, propId: 300,
            saleDt: new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc), price: 300_000m);
        await SeedFixtureSaleAsync(CountyA, 4, propId: 400,
            saleDt: new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc), price: 350_000m);
        await SeedFixtureSaleAsync(CountyA, 5, propId: 500,
            saleDt: new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc), price: 360_000m);

        var svc = BuildService();
        var pacs = await svc.ValidSalesByYearPacsAsync(CountyA);
        var canonical = await svc.ValidSalesByYearCanonicalAsync(CountyA);

        pacs.Should().BeEquivalentTo(canonical);
        pacs.Should().BeEquivalentTo(new Dictionary<int, int>
        {
            [2024] = 2,
            [2025] = 1,
            [2026] = 2,
        });
    }

    [Fact]
    public async Task Q3_PriceAggregate_PacsAndCanonical_AreEqual()
    {
        await SeedFixtureSaleAsync(CountyA, 1, propId: 100,
            saleDt: new DateTime(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 300_000m);
        await SeedFixtureSaleAsync(CountyA, 2, propId: 200,
            saleDt: new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 400_000m);
        // Null price — excluded from aggregate by both flavors.
        await SeedFixtureSaleAsync(CountyA, 3, propId: 300,
            saleDt: new DateTime(2026, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            price: null);

        var svc = BuildService();
        var pacs = await svc.ValidSalePriceAggregatePacsAsync(CountyA);
        var canonical = await svc.ValidSalePriceAggregateCanonicalAsync(CountyA);

        pacs.Count.Should().Be(canonical.Count).And.Be(2);
        pacs.TotalPrice.Should().Be(canonical.TotalPrice).And.Be(700_000m);
        pacs.AveragePrice.Should().Be(canonical.AveragePrice).And.Be(350_000m);
    }

    [Fact]
    public async Task Q3_EmptyResultSet_BothFlavorsReturnNullAggregates()
    {
        // Seed only pre-cutover rows; both flavors should return Count=0.
        await SeedFixtureSaleAsync(CountyA, 1, propId: 100,
            saleDt: new DateTime(2017, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 200_000m);

        var svc = BuildService();
        var pacs = await svc.ValidSalePriceAggregatePacsAsync(CountyA);
        var canonical = await svc.ValidSalePriceAggregateCanonicalAsync(CountyA);

        pacs.Count.Should().Be(canonical.Count).And.Be(0);
        pacs.TotalPrice.Should().BeNull();
        canonical.TotalPrice.Should().BeNull();
    }

    [Fact]
    public async Task AllThree_Queries_AgreeAcrossFullMixedFixture()
    {
        // Mixed fixture exercising every doctrine boundary at once.
        // Qualified post-cutover with price.
        await SeedFixtureSaleAsync(CountyA, 1, propId: 100,
            saleDt: new DateTime(2024, 1, 15, 0, 0, 0, DateTimeKind.Utc),
            price: 250_000m);
        // Qualified post-cutover, no price.
        await SeedFixtureSaleAsync(CountyA, 2, propId: 200,
            saleDt: new DateTime(2025, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            price: null);
        // Pre-cutover, excluded.
        await SeedFixtureSaleAsync(CountyA, 3, propId: 300,
            saleDt: new DateTime(2017, 11, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 195_000m);
        // Non-qualified ('300' = some other code).
        await SeedFixtureSaleAsync(CountyA, 4, propId: 400,
            saleDt: new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 500_000m, code: "300");
        // Different county, excluded by scope.
        await SeedFixtureSaleAsync(CountyB, 5, propId: 500,
            saleDt: new DateTime(2026, 2, 1, 0, 0, 0, DateTimeKind.Utc),
            price: 600_000m);

        var svc = BuildService();

        var q1Pacs = await svc.ValidSaleCountPacsAsync(CountyA);
        var q1Can  = await svc.ValidSaleCountCanonicalAsync(CountyA);
        var q2Pacs = await svc.ValidSalesByYearPacsAsync(CountyA);
        var q2Can  = await svc.ValidSalesByYearCanonicalAsync(CountyA);
        var q3Pacs = await svc.ValidSalePriceAggregatePacsAsync(CountyA);
        var q3Can  = await svc.ValidSalePriceAggregateCanonicalAsync(CountyA);

        q1Pacs.Should().Be(q1Can).And.Be(2,
            "two qualified post-cutover sales in CountyA");
        q2Pacs.Should().BeEquivalentTo(q2Can);
        q2Pacs.Should().BeEquivalentTo(new Dictionary<int, int> { [2024] = 1, [2025] = 1 });
        q3Pacs.Count.Should().Be(q3Can.Count).And.Be(1,
            "one qualified post-cutover sale with a non-null price");
        q3Pacs.TotalPrice.Should().Be(q3Can.TotalPrice).And.Be(250_000m);
    }
}
