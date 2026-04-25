// backend/TerraFusion.API.Tests/CountyStudyHealthServiceTests.cs
//
// Task C — Health summary tests. Two surfaces:
//   1. Pure composite-risk formula (ComputeCompositeRisk) across every trigger.
//   2. Service integration with a seeded Benton-shaped fixture driving the
//      endpoint through to 200 / 409 / top-5 ordering / compliance classification.

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using TerraFusion.API.Tests.TestHelpers;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;
using TerraFusion.Core.Services;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace TerraFusion.API.Tests;

public sealed class CountyStudyHealthServiceTests : IDisposable
{
    private static readonly Guid CountyId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private const int TaxYear = 2026;

    private readonly TerraFusion.Data.TerraFusionDbContext _db;
    private readonly CountyStudyHealthService _svc;
    private readonly CountyStudySegmentDerivationService _derive;

    public CountyStudyHealthServiceTests()
    {
        _db     = TestDbContextFactory.CreateInMemoryContext();
        _svc    = new CountyStudyHealthService(_db);
        _derive = new CountyStudySegmentDerivationService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ── Composite-risk formula tests (pure math, no DB) ───────────────────
    //
    // Formula recap (from CountyStudyHealthService):
    //   (cod == null                  ? 10                          : 0)
    // + (cod > 20                     ? (cod - 20) * 2              : 0)
    // + (median outside [0.90, 1.10]  ? |median - 1.0| * 100        : 0)
    // + (prd outside [0.98, 1.03]     ? |prd - 1.0| * 200           : 0)
    // + (exceptionRate > 0.10         ? exceptionRate * 50          : 0)
    // + (parcelCount < 30             ? (30 - parcelCount) * 0.5    : 0)
    // clamped to [0, 100].

    [Fact]
    public void ComputeCompositeRisk_AllGreen_ReturnsZero()
    {
        var (risk, reasons) = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 10m, median: 1.00m, prd: 1.00m, parcelCount: 500, exceptionCount: 0);
        Assert.Equal(0m, risk);
        Assert.Empty(reasons);
    }

    [Fact]
    public void ComputeCompositeRisk_NullCod_Adds10AndFlagsInsufficientData()
    {
        var (risk, reasons) = CountyStudyHealthService.ComputeCompositeRisk(
            cod: null, median: 1.00m, prd: null, parcelCount: 500, exceptionCount: 0);
        Assert.Equal(10m, risk);
        Assert.Contains(reasons, r => r.Contains("insufficient ratio data"));
    }

    [Fact]
    public void ComputeCompositeRisk_CodCeilingBreach_ScoresProportional()
    {
        // cod=27.4 → (27.4 - 20) * 2 = 14.8
        var (risk, reasons) = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 27.4m, median: 1.00m, prd: 1.00m, parcelCount: 500, exceptionCount: 0);
        Assert.Equal(14.8m, risk);
        Assert.Contains(reasons, r => r.Contains("COD 27.4 exceeds IAAO ceiling"));
    }

    [Fact]
    public void ComputeCompositeRisk_MedianLow_ScoresProportional()
    {
        // median=0.83 → |0.83 - 1.0| * 100 = 17
        var (risk, reasons) = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 10m, median: 0.83m, prd: 1.00m, parcelCount: 500, exceptionCount: 0);
        Assert.Equal(17m, risk);
        Assert.Contains(reasons, r => r.Contains("median 0.83 outside fair range"));
    }

    [Fact]
    public void ComputeCompositeRisk_MedianHigh_ScoresProportional()
    {
        // median=1.15 → |1.15 - 1.0| * 100 = 15
        var result = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 10m, median: 1.15m, prd: 1.00m, parcelCount: 500, exceptionCount: 0);
        Assert.Equal(15m, result.Risk);
    }

    [Fact]
    public void ComputeCompositeRisk_PrdLow_ScoresProportional()
    {
        // prd=0.96 → |0.96 - 1.0| * 200 = 8
        var (risk, reasons) = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 10m, median: 1.00m, prd: 0.96m, parcelCount: 500, exceptionCount: 0);
        Assert.Equal(8m, risk);
        Assert.Contains(reasons, r => r.Contains("PRD 0.96 outside vertical-equity"));
    }

    [Fact]
    public void ComputeCompositeRisk_PrdHigh_ScoresProportional()
    {
        // prd=1.06 → |1.06 - 1.0| * 200 = 12
        var result = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 10m, median: 1.00m, prd: 1.06m, parcelCount: 500, exceptionCount: 0);
        Assert.Equal(12m, result.Risk);
    }

    [Fact]
    public void ComputeCompositeRisk_HighExceptionRate_Scores()
    {
        // 100 parcels, 30 exceptions → rate 0.30 → 0.30 * 50 = 15
        var (risk, reasons) = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 10m, median: 1.00m, prd: 1.00m, parcelCount: 100, exceptionCount: 30);
        Assert.Equal(15m, risk);
        Assert.Contains(reasons, r => r.Contains("30 parcels"));
    }

    [Fact]
    public void ComputeCompositeRisk_LowSampleSize_Scores()
    {
        // parcelCount=10 → (30 - 10) * 0.5 = 10
        var (risk, reasons) = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 10m, median: 1.00m, prd: 1.00m, parcelCount: 10, exceptionCount: 0);
        Assert.Equal(10m, risk);
        Assert.Contains(reasons, r => r.Contains("low sample size"));
    }

    [Fact]
    public void ComputeCompositeRisk_MultipleTriggers_AreAdditiveAndOrderedByContribution()
    {
        // cod=30   → (30-20)*2 = 20 (first)
        // median=0.80 → |0.80-1.0|*100 = 20 (second — tied; order unspecified but both present)
        // prd=1.10 → |1.10-1.0|*200 = 20
        // total = 60
        var (risk, reasons) = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 30m, median: 0.80m, prd: 1.10m, parcelCount: 500, exceptionCount: 0);
        Assert.Equal(60m, risk);
        Assert.Equal(3, reasons.Count);
    }

    [Fact]
    public void ComputeCompositeRisk_ClampsAt100()
    {
        // Maximum chaos: cod=80 (60*2=120), median=0.50 (50), prd=1.50 (100),
        // 100 parcels all exceptions (rate 1.0 → 50), parcelCount=1 → 14.5.
        // Raw total >> 100 → must clamp.
        var result = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 80m, median: 0.50m, prd: 1.50m, parcelCount: 1, exceptionCount: 1);
        Assert.Equal(100m, result.Risk);
    }

    [Fact]
    public void ComputeCompositeRisk_Reasons_OrderedByContributionDesc()
    {
        // median wildly bad (|0.50-1|*100 = 50), cod mildly bad ((22-20)*2 = 4).
        // First reason should be the median contribution (larger).
        var result = CountyStudyHealthService.ComputeCompositeRisk(
            cod: 22m, median: 0.50m, prd: 1.00m, parcelCount: 500, exceptionCount: 0);
        Assert.Equal(2, result.Reasons.Count);
        Assert.Contains("median", result.Reasons[0]);
        Assert.Contains("COD", result.Reasons[1]);
    }

    // ── Compliance classification ─────────────────────────────────────────

    [Fact]
    public void ClassifyCompliance_InsufficientSample_ReturnsInsufficientData()
    {
        Assert.Equal(
            CountyHealthComplianceStatus.InsufficientData,
            CountyStudyHealthService.ClassifyCompliance(median: 1.00m, cod: 10m, prd: 1.00m, ratioCount: 15));
    }

    [Fact]
    public void ClassifyCompliance_StrictGreen_IsIaaoCompliant()
    {
        Assert.Equal(
            CountyHealthComplianceStatus.IaaoCompliant,
            CountyStudyHealthService.ClassifyCompliance(median: 1.00m, cod: 10m, prd: 1.00m, ratioCount: 100));
    }

    [Fact]
    public void ClassifyCompliance_JustOutsideStrict_IsMarginal()
    {
        // median 1.12 (outside strict 0.9-1.1 but inside marginal 0.85-1.15),
        // cod 22 (outside strict 20 but inside marginal 25), prd 1.04 (outside
        // 0.98-1.03 but inside 0.95-1.05).
        Assert.Equal(
            CountyHealthComplianceStatus.MarginalCompliance,
            CountyStudyHealthService.ClassifyCompliance(median: 1.12m, cod: 22m, prd: 1.04m, ratioCount: 100));
    }

    [Fact]
    public void ClassifyCompliance_OutsideMarginal_IsNonCompliant()
    {
        Assert.Equal(
            CountyHealthComplianceStatus.NonCompliant,
            CountyStudyHealthService.ClassifyCompliance(median: 0.70m, cod: 40m, prd: 1.20m, ratioCount: 100));
    }

    // ── Integration tests against seeded DB ───────────────────────────────

    private CountyStudySession SeedStudy()
    {
        var study = new CountyStudySession
        {
            StudyId   = Guid.NewGuid(),
            CountyId  = CountyId,
            TaxYear   = TaxYear,
            StudyType = StudyType.RatioStudy,
            Status    = StudyStatus.Draft,
        };
        _db.CountyStudySessions.Add(study);
        _db.SaveChanges();
        return study;
    }

    private void SeedParcelWithSale(
        string parcelId, string neighborhood, string buildingType, string qualityGrade,
        string city, decimal assessedValue, decimal salePrice)
    {
        _db.Properties.Add(new Property
        {
            Id            = Guid.NewGuid(),
            ParcelId      = parcelId,
            ParcelNumber  = parcelId,
            CountyId      = CountyId,
            TaxYear       = TaxYear,
            AssessedValue = assessedValue,
            MarketValue   = assessedValue,
            Neighborhood  = neighborhood,
            SitusCity     = city,
        });
        _db.CamaCharacteristics.Add(new CamaCharacteristic
        {
            Id           = Guid.NewGuid(),
            ParcelId     = parcelId,
            TaxYear      = TaxYear,
            BuildingType = buildingType,
            QualityGrade = qualityGrade,
            City         = city,
            SquareFeet   = 1800m,
            CountyId     = CountyId,
            UpdatedAt    = DateTime.UtcNow,
            UpdatedBy    = "test",
        });
        _db.ComparableSales.Add(new ComparableSale
        {
            Id                          = Guid.NewGuid(),
            CountyId                    = CountyId,
            ParcelId                    = parcelId,
            SaleDate                    = new DateTime(2025, 6, 15, 0, 0, 0, DateTimeKind.Utc),
            SalePrice                   = salePrice,
            SalesYear                   = 2025,
            QualificationRecommendation = "qualified",
        });
        _db.SaveChanges();
    }

    /// <summary>
    /// Builds a Benton-shaped fixture with parity medians (0.95) — same plan
    /// as CountyStudyRollupTests, reused so assertions stay consistent across
    /// rollup + health surfaces.
    /// </summary>
    private async Task<CountyStudySession> SeedBentonFixture()
    {
        var study = SeedStudy();

        var plan = new (string City, string Neighborhood, string Quality)[]
        {
            ("Kennewick", "NBHD-K1", "STANDARD"),
            ("Kennewick", "NBHD-K1", "GOOD"),
            ("Kennewick", "NBHD-K2", "STANDARD"),
            ("Kennewick", "NBHD-K2", "GOOD"),
            ("Kennewick", "NBHD-K3", "STANDARD"),
            ("Kennewick", "NBHD-K3", "GOOD"),
            ("Richland",  "NBHD-R1", "STANDARD"),
            ("Richland",  "NBHD-R1", "GOOD"),
            ("Richland",  "NBHD-R2", "STANDARD"),
            ("Richland",  "NBHD-R2", "GOOD"),
            ("Richland",  "NBHD-R3", "STANDARD"),
            ("Richland",  "NBHD-R3", "GOOD"),
        };

        decimal[] prices = { 316_667m, 306_452m, 300_000m, 293_814m, 285_000m };
        var parcelIdx = 0;
        foreach (var row in plan)
        {
            for (var i = 0; i < 5; i++)
            {
                SeedParcelWithSale(
                    parcelId:     $"HP{parcelIdx++}",
                    neighborhood: row.Neighborhood,
                    buildingType: "R1",
                    qualityGrade: row.Quality,
                    city:         row.City,
                    assessedValue: 285_000m,
                    salePrice:     prices[i]);
            }
        }

        await _derive.DeriveAsync(study.StudyId, "tester");
        return _db.CountyStudySessions.Single(s => s.StudyId == study.StudyId);
    }

    [Fact]
    public async Task GetHealthSummaryAsync_NoActiveSegmentSet_Throws()
    {
        var study = SeedStudy();
        var ex = await Assert.ThrowsAsync<InvalidOperationException>(
            () => _svc.GetHealthSummaryAsync(study.StudyId));
        Assert.Contains("active segment set", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task GetHealthSummaryAsync_StudyMissing_Throws()
    {
        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _svc.GetHealthSummaryAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task GetHealthSummaryAsync_HealthyFixture_ReportsCompliantAndPopulated()
    {
        var study = await SeedBentonFixture();
        var dto = await _svc.GetHealthSummaryAsync(study.StudyId);

        Assert.Equal(study.StudyId, dto.StudyId);
        Assert.Equal(CountyId, dto.CountyId);
        Assert.Equal(TaxYear, dto.TaxYear);
        Assert.Equal(60, dto.ParcelCount);       // 12 segments × 5 parcels
        Assert.Equal(60, dto.RatioCount);        // every parcel has a sale
        Assert.NotNull(dto.MedianRatio);
        Assert.InRange((decimal)dto.MedianRatio!, 0.94m, 0.96m);
        Assert.NotNull(dto.Cod);
        Assert.NotNull(dto.Prd);
        Assert.NotNull(dto.StabilityScore);
        Assert.NotNull(dto.RiskScore);
        Assert.Equal(0, dto.ExceptionCount);     // nothing outside IAAO fence
        Assert.Equal(nameof(CountyHealthComplianceStatus.IaaoCompliant), dto.ComplianceStatus);
        Assert.NotNull(dto.DerivedAt);
    }

    [Fact]
    public async Task GetHealthSummaryAsync_HealthyFixture_TopAlertsCapped5()
    {
        var study = await SeedBentonFixture();
        var dto = await _svc.GetHealthSummaryAsync(study.StudyId);

        Assert.Equal(5, dto.TopAlerts.Count);
        // Non-strictly-increasing composite risk — OrderByDescending stable.
        for (var i = 1; i < dto.TopAlerts.Count; i++)
            Assert.True(dto.TopAlerts[i - 1].CompositeRisk >= dto.TopAlerts[i].CompositeRisk);
    }

    [Fact]
    public async Task GetHealthSummaryAsync_TopAlerts_OrderingIsDeterministic()
    {
        var study = await SeedBentonFixture();
        var first  = await _svc.GetHealthSummaryAsync(study.StudyId);
        var second = await _svc.GetHealthSummaryAsync(study.StudyId);

        // Ordering must be stable across calls on the same data.
        Assert.Equal(first.TopAlerts.Count, second.TopAlerts.Count);
        for (var i = 0; i < first.TopAlerts.Count; i++)
        {
            Assert.Equal(first.TopAlerts[i].SegmentId,     second.TopAlerts[i].SegmentId);
            Assert.Equal(first.TopAlerts[i].CompositeRisk, second.TopAlerts[i].CompositeRisk);
        }
    }

    [Fact]
    public async Task GetHealthSummaryAsync_SeverityCountsSumToSegmentCount()
    {
        var study = await SeedBentonFixture();
        var dto = await _svc.GetHealthSummaryAsync(study.StudyId);

        // 12 segments in fixture.
        Assert.Equal(12, dto.CriticalCount + dto.WarningCount + dto.HealthyCount);
    }
}
