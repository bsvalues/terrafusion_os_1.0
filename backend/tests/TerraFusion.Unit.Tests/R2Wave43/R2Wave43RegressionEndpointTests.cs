using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services;
using TerraFusion.Core.Entities;
using ComparableSale = TerraFusion.Core.Entities.ComparableSale;
using Xunit;
using DataDbContext = TerraFusion.Data.TerraFusionDbContext;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.Unit.Tests.R2Wave43;

/// <summary>
/// R2Wave43 — OLS regression endpoint in TerraForgeController.
///
/// Invariants under test:
///   WF43-01: regression returns 200 with model when sufficient qualified sales with GLA exist
///   WF43-02: regression beta[0] is intercept, beta[1] is GLA coefficient (positive for SalePrice)
///   WF43-03: regression returns insufficientData=true when fewer than 5 usable observations
///   WF43-04: regression excludes non-qualified sales from the fit
///   WF43-05: regression excludes observations with null/zero GLA from the fit
///   WF43-06: regression residuals array length equals usedForFit
///   WF43-07: regression R² is between 0 and 1 inclusive
///   WF43-08: regression RMSE is non-negative
///   WF43-09: regression hood filter limits fit to matching neighborhood
///   WF43-10: regression returns singularMatrix=true for degenerate predictor matrix
///   WF43-11: regression excludes SuppressOnRatioRptCd="T" sales
///   WF43-12: per-sale residual percentResidual is (residual/salePrice)*100
/// </summary>
[Trait("Category", "R2Wave43")]
[Trait("Category", "RegressionEndpoint")]
public sealed class R2Wave43RegressionEndpointTests
{
    private static readonly Guid BentonCountyId = Guid.Parse("19190019-1919-1919-1919-191919191919");

    private static DataDbContext CreateDbContext(string name)
    {
        var options = new DbContextOptionsBuilder<DataDbContext>()
            .UseInMemoryDatabase(name)
            .Options;
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        return new DataDbContext(options, config);
    }

    // Real OlsRegressionService — pure math, no dependencies.
    private static TerraForgeController CreateController(DataDbContext db)
        => new(db, NullLogger<TerraForgeController>.Instance, new OlsRegressionService());

    private static async Task SeedCountyAsync(DataDbContext db)
    {
        if (!await db.Counties.AnyAsync(c => c.Id == BentonCountyId))
        {
            db.Counties.Add(new County
            {
                Id       = BentonCountyId,
                Name     = "Benton",
                State    = "WA",
                FipsCode = "003"
            });
            await db.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Seeds a qualified ComparableSale with physical characteristics in the 2024 window.
    /// </summary>
    private static async Task<ComparableSale> SeedSaleAsync(
        DataDbContext db,
        decimal salePrice,
        decimal? gla                    = 1500m,
        decimal? lotSqft                = 7000m,
        int?     yearBuilt              = 1995,
        string?  recommendation         = "qualified",
        string?  decision               = null,
        string?  neighborhood           = null,
        string?  suppressOnRatioRptCd   = null,
        bool?    includeNoCalc          = null)
    {
        var sale = new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            ParcelId                    = $"TEST{Guid.NewGuid():N}"[..15],
            SaleDate                    = new DateTime(2024, 6, 1, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            PropertyType                = "residential",
            QualificationRecommendation = recommendation,
            QualificationDecision       = decision,
            SlLivingArea                = gla,
            SlLandSqft                  = lotSqft,
            SlYearBuilt                 = yearBuilt,
            Neighborhood                = neighborhood,
            SuppressOnRatioRptCd        = suppressOnRatioRptCd,
            IncludeNoCalc               = includeNoCalc,
            CountyId                    = BentonCountyId
        };
        db.ComparableSales.Add(sale);
        await db.SaveChangesAsync();
        return sale;
    }

    // Seed 5 qualified sales whose predictors are NOT perfectly collinear.
    // Perfect collinearity (all predictors proportional) makes XᵀX singular.
    // These values are deliberately varied so the matrix is full-rank.
    private static async Task SeedMinimumViablePoolAsync(DataDbContext db)
    {
        await SeedSaleAsync(db, salePrice: 200_000m, gla: 1000m, lotSqft: 5000m, yearBuilt: 1990);
        await SeedSaleAsync(db, salePrice: 260_000m, gla: 1300m, lotSqft: 8500m, yearBuilt: 2002);
        await SeedSaleAsync(db, salePrice: 310_000m, gla: 1550m, lotSqft: 6000m, yearBuilt: 1985);
        await SeedSaleAsync(db, salePrice: 375_000m, gla: 1800m, lotSqft: 9500m, yearBuilt: 2010);
        await SeedSaleAsync(db, salePrice: 420_000m, gla: 2100m, lotSqft: 7200m, yearBuilt: 1998);
    }

    // ── WF43-01 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_01_Regression_Returns200_WithModel_WhenSufficientQualifiedSalesExist()
    {
        await using var db = CreateDbContext(nameof(WF43_01_Regression_Returns200_WithModel_WhenSufficientQualifiedSalesExist));
        await SeedCountyAsync(db);
        await SeedMinimumViablePoolAsync(db);
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((bool)body.insufficientData).Should().BeFalse();
        ((bool)body.singularMatrix).Should().BeFalse();
        ((object)body.model).Should().NotBeNull();
        ((int)body.usedForFit).Should().Be(5);
    }

    // ── WF43-02 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_02_Regression_GlaCoefficient_IsPositive()
    {
        // GLA is positively correlated with SalePrice — larger homes sell for more.
        await using var db = CreateDbContext(nameof(WF43_02_Regression_GlaCoefficient_IsPositive));
        await SeedCountyAsync(db);
        await SeedMinimumViablePoolAsync(db);
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        var beta = (double[])body.model.beta;
        // beta[0]=intercept, beta[1]=GLA coefficient
        beta.Should().HaveCount(4);
        beta[1].Should().BeGreaterThan(0, "GLA coefficient must be positive: larger GLA → higher price");
    }

    // ── WF43-03 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_03_Regression_ReturnsInsufficientData_WhenFewerThan5UsableObservations()
    {
        await using var db = CreateDbContext(nameof(WF43_03_Regression_ReturnsInsufficientData_WhenFewerThan5UsableObservations));
        await SeedCountyAsync(db);
        // Only 4 sales — one short of minimum.
        await SeedSaleAsync(db, 200_000m, gla: 1000m);
        await SeedSaleAsync(db, 250_000m, gla: 1250m);
        await SeedSaleAsync(db, 300_000m, gla: 1500m);
        await SeedSaleAsync(db, 350_000m, gla: 1750m);
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((bool)body.insufficientData).Should().BeTrue();
        ((object?)body.model).Should().BeNull();
    }

    // ── WF43-04 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_04_Regression_ExcludesNonQualifiedSales_FromFit()
    {
        await using var db = CreateDbContext(nameof(WF43_04_Regression_ExcludesNonQualifiedSales_FromFit));
        await SeedCountyAsync(db);
        await SeedMinimumViablePoolAsync(db);  // 5 qualified
        // Add 3 non-arms-length — must NOT count toward fit.
        await SeedSaleAsync(db, 100_000m, gla: 500m, recommendation: "non-arms-length");
        await SeedSaleAsync(db, 120_000m, gla: 600m, recommendation: "non-arms-length");
        await SeedSaleAsync(db, 80_000m,  gla: 400m, recommendation: "non-arms-length");
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.totalPool).Should().Be(5, "non-qualified sales must not appear in pool count");
        ((int)body.usedForFit).Should().Be(5, "non-qualified sales must be excluded from the fit");
    }

    // ── WF43-05 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_05_Regression_ExcludesObservations_WithMissingGla()
    {
        await using var db = CreateDbContext(nameof(WF43_05_Regression_ExcludesObservations_WithMissingGla));
        await SeedCountyAsync(db);
        await SeedMinimumViablePoolAsync(db);  // 5 with GLA
        // One qualified sale with null GLA — should be excluded from the fit.
        await SeedSaleAsync(db, 300_000m, gla: null);
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.totalPool).Should().Be(6, "null-GLA sale is in the pool");
        ((int)body.usedForFit).Should().Be(5, "null-GLA sale excluded from the fit");
        ((int)body.excludedCount).Should().Be(1);
    }

    // ── WF43-06 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_06_Regression_ResidualCount_EqualsUsedForFit()
    {
        await using var db = CreateDbContext(nameof(WF43_06_Regression_ResidualCount_EqualsUsedForFit));
        await SeedCountyAsync(db);
        await SeedMinimumViablePoolAsync(db);
        // Add 2 more qualified sales with GLA.
        await SeedSaleAsync(db, 320_000m, gla: 1600m, lotSqft: 7500m, yearBuilt: 2002);
        await SeedSaleAsync(db, 370_000m, gla: 1850m, lotSqft: 8500m, yearBuilt: 2007);
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        int usedForFit = (int)body.usedForFit;
        var residuals  = (System.Collections.IEnumerable)body.residuals;
        residuals.Cast<object>().Should().HaveCount(usedForFit,
            "residuals array must have one entry per observation used in the fit");
    }

    // ── WF43-07 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_07_Regression_RSquared_IsBetween0And1()
    {
        await using var db = CreateDbContext(nameof(WF43_07_Regression_RSquared_IsBetween0And1));
        await SeedCountyAsync(db);
        await SeedMinimumViablePoolAsync(db);
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        double rSquared = (double)body.model.rSquared;
        rSquared.Should().BeInRange(0.0, 1.0);
    }

    // ── WF43-08 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_08_Regression_Rmse_IsNonNegative()
    {
        await using var db = CreateDbContext(nameof(WF43_08_Regression_Rmse_IsNonNegative));
        await SeedCountyAsync(db);
        await SeedMinimumViablePoolAsync(db);
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        double rmse = (double)body.model.rmse;
        rmse.Should().BeGreaterThanOrEqualTo(0.0);
    }

    // ── WF43-09 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_09_Regression_HoodFilter_LimitsFitToMatchingNeighborhood()
    {
        await using var db = CreateDbContext(nameof(WF43_09_Regression_HoodFilter_LimitsFitToMatchingNeighborhood));
        await SeedCountyAsync(db);
        // 5 sales in hood "15112" — predictors varied so XᵀX is full-rank
        await SeedSaleAsync(db, 200_000m, gla: 1000m, lotSqft: 5000m, yearBuilt: 1990, neighborhood: "15112");
        await SeedSaleAsync(db, 260_000m, gla: 1300m, lotSqft: 8500m, yearBuilt: 2002, neighborhood: "15112");
        await SeedSaleAsync(db, 310_000m, gla: 1550m, lotSqft: 6000m, yearBuilt: 1985, neighborhood: "15112");
        await SeedSaleAsync(db, 375_000m, gla: 1800m, lotSqft: 9500m, yearBuilt: 2010, neighborhood: "15112");
        await SeedSaleAsync(db, 420_000m, gla: 2100m, lotSqft: 7200m, yearBuilt: 1998, neighborhood: "15112");
        // 3 sales in hood "15200" — excluded when filtering on "15112"
        await SeedSaleAsync(db, 180_000m, gla: 900m,  lotSqft: 4500m, yearBuilt: 1988, neighborhood: "15200");
        await SeedSaleAsync(db, 220_000m, gla: 1100m, lotSqft: 5500m, yearBuilt: 1995, neighborhood: "15200");
        await SeedSaleAsync(db, 260_000m, gla: 1300m, lotSqft: 6500m, yearBuilt: 2001, neighborhood: "15200");
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026, hood: "15112");

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.totalPool).Should().Be(5, "hood filter must exclude sales from other neighborhoods");
        ((int)body.usedForFit).Should().Be(5);
    }

    // ── WF43-10 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_10_Regression_ReturnsSingularMatrix_WhenPredictorsAreCollinear()
    {
        // All sales have identical predictors except SalePrice — XᵀX is singular.
        await using var db = CreateDbContext(nameof(WF43_10_Regression_ReturnsSingularMatrix_WhenPredictorsAreCollinear));
        await SeedCountyAsync(db);
        for (var i = 0; i < 6; i++)
            await SeedSaleAsync(db, 200_000m + i * 10_000m, gla: 1500m, lotSqft: 7000m, yearBuilt: 2000);
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        // GLA, LotSqft, YearBuilt are all identical → XᵀX is singular.
        ((bool)body.singularMatrix).Should().BeTrue();
        ((object?)body.model).Should().BeNull();
    }

    // ── WF43-11 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_11_Regression_ExcludesSuppressedSales()
    {
        await using var db = CreateDbContext(nameof(WF43_11_Regression_ExcludesSuppressedSales));
        await SeedCountyAsync(db);
        await SeedMinimumViablePoolAsync(db);
        // One suppressed sale — SuppressOnRatioRptCd="T"
        await SeedSaleAsync(db, 500_000m, gla: 3000m, suppressOnRatioRptCd: "T");
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;
        ((int)body.totalPool).Should().Be(5, "suppressed sale excluded from pool");
        ((int)body.usedForFit).Should().Be(5);
    }

    // ── WF43-12 ─────────────────────────────────────────────────────────────────

    [Fact]
    public async Task WF43_12_Regression_PercentResidual_IsResidualOverSalePrice_Times100()
    {
        await using var db = CreateDbContext(nameof(WF43_12_Regression_PercentResidual_IsResidualOverSalePrice_Times100));
        await SeedCountyAsync(db);
        await SeedMinimumViablePoolAsync(db);
        var ctrl = CreateController(db);

        var result = await ctrl.GetRegression(taxYear: 2026);

        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        dynamic body = ok.Value!;

        foreach (dynamic r in (System.Collections.IEnumerable)body.residuals)
        {
            double sp      = (double)r.salePrice;
            double resid   = (double)r.residual;
            double pctResid = (double)r.percentResidual;

            if (sp > 0)
            {
                var expected = Math.Round(resid / sp * 100.0, 2);
                pctResid.Should().BeApproximately(expected, precision: 0.01,
                    "percentResidual must equal residual / salePrice * 100");
            }
        }
    }
}
