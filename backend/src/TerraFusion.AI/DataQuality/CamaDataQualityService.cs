/*
 * CamaDataQualityService
 *
 * Implements the 8 Benton-method data-quality checks against canonical
 * entities. Each check surfaces count, severity, description, and up to
 * 5 example parcel IDs so the appraiser can drill in.
 *
 * Check list:
 *   1. Missing quality codes (QualityGrade or ConditionGrade null)
 *   2. Stale effective age (UpdatedAt > 24 months ago)
 *   3. Missing improvement-detail segments (non-exempt non-vacant parcel, no MA segment)
 *   4. Missing sale pairs (hood with no qualified sales in 4 years)
 *   5. IQR ratio outliers (ratio outside Q1−1.5·IQR..Q3+1.5·IQR within hood)
 *   6. Quality/grade cross-field mismatches (POOR+LUXURY etc impossible pairs)
 *   7. Year-built inconsistency (future year, or effective age >> actual age)
 *   8. GLA/land conflicts (living_area > land_area)
 *
 * @version 1.0.0 - Track 4 (CostForge Benton Method v2)
 */

using Microsoft.EntityFrameworkCore;
using TerraFusion.AI.Valuation;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.AI.DataQuality;

public class CamaDataQualityService : ICamaDataQualityService
{
    private readonly TerraFusionDbContext _context;

    public CamaDataQualityService(TerraFusionDbContext context) => _context = context;

    public async Task<DataQualityAssessmentDto> AssessAsync(
        Guid countyId, int taxYear, CancellationToken ct = default)
    {
        var totalParcels = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear)
            .CountAsync(ct);

        var issues = new List<DataQualityIssueDto>();

        // Check 1 — Missing QualityGrade or ConditionGrade
        var missingQual = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                     && (c.QualityGrade == null || c.ConditionGrade == null))
            .Select(c => c.ParcelId)
            .Take(5000)
            .ToListAsync(ct);
        if (missingQual.Count > 0)
            issues.Add(new DataQualityIssueDto(
                "Completeness",
                "QualityGrade/ConditionGrade",
                missingQual.Count,
                "Parcels missing QualityGrade or ConditionGrade — blocks cost-approach accuracy",
                missingQual.Count > totalParcels * 0.05 ? "critical" : "warning",
                missingQual.Take(5).ToList()));

        // Check 2 — Stale CAMA data (UpdatedAt > 24 months old)
        var staleCutoff = DateTime.UtcNow.AddMonths(-24);
        var stale = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                     && c.UpdatedAt < staleCutoff)
            .Select(c => c.ParcelId)
            .Take(5000)
            .ToListAsync(ct);
        if (stale.Count > 0)
            issues.Add(new DataQualityIssueDto(
                "Completeness",
                "UpdatedAt",
                stale.Count,
                "Parcels with CAMA characteristics older than 24 months",
                "warning",
                stale.Take(5).ToList()));

        // Check 3 — Non-exempt non-vacant parcels with no improvement-detail segments
        var parcelsWithDetails = await _context.CamaImprovementDetails
            .Where(d => d.CountyId == countyId && d.TaxYear == taxYear)
            .Select(d => d.ParcelId)
            .Distinct()
            .ToListAsync(ct);
        var parcelsWithDetailsSet = new HashSet<string>(parcelsWithDetails, StringComparer.OrdinalIgnoreCase);

        var expectedImprovement = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                     && c.PropertyUseStratum != "V"
                     && c.PropertyUseStratum != "X")
            .Select(c => c.ParcelId)
            .ToListAsync(ct);
        var missingSegments = expectedImprovement
            .Where(p => !parcelsWithDetailsSet.Contains(p))
            .ToList();
        if (missingSegments.Count > 0)
            issues.Add(new DataQualityIssueDto(
                "Completeness",
                "CamaImprovementDetails",
                missingSegments.Count,
                "Non-vacant non-exempt parcels with no improvement-detail segments (MA, secondary features)",
                missingSegments.Count > totalParcels * 0.10 ? "critical" : "warning",
                missingSegments.Take(5).ToList()));

        // Check 4 — Neighborhoods with no qualified sales in last 4 years
        var fourYearsAgo = DateTime.UtcNow.AddYears(-4);
        var hoodsWithSales = await _context.ComparableSales
            .Where(cs => cs.CountyId == countyId
                      && cs.SaleDate >= fourYearsAgo
                      && cs.Neighborhood != null)
            .Select(cs => cs.Neighborhood!)
            .Distinct()
            .ToListAsync(ct);
        var hoodsWithSalesSet = new HashSet<string>(hoodsWithSales, StringComparer.OrdinalIgnoreCase);

        var hoodsWithParcels = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear && c.NeighborhoodCode != null)
            .Select(c => c.NeighborhoodCode!)
            .Distinct()
            .ToListAsync(ct);
        var noSaleHoods = hoodsWithParcels
            .Where(h => !hoodsWithSalesSet.Contains(h))
            .ToList();
        if (noSaleHoods.Count > 0)
            issues.Add(new DataQualityIssueDto(
                "Completeness",
                "ComparableSales",
                noSaleHoods.Count,
                "Neighborhoods with no qualified sales in the last 4 years — ratio studies blocked",
                "warning",
                noSaleHoods.Take(5).ToList()));

        // Check 5 — IQR ratio outliers
        var ratios = await SaleRatioQueryBuilder.BuildAsync(_context, countyId, taxYear, ct);
        var hoodGroups = ratios
            .Where(r => r.NeighborhoodCode != null)
            .GroupBy(r => r.NeighborhoodCode!);
        var outliers = new List<string>();
        foreach (var g in hoodGroups)
        {
            var sorted = g.OrderBy(r => r.Ratio).ToList();
            if (sorted.Count < 4) continue;
            var q1 = sorted[sorted.Count / 4].Ratio;
            var q3 = sorted[sorted.Count * 3 / 4].Ratio;
            var iqr = q3 - q1;
            var lo = q1 - 1.5m * iqr;
            var hi = q3 + 1.5m * iqr;
            foreach (var r in sorted)
                if (r.Ratio < lo || r.Ratio > hi)
                    outliers.Add(r.ParcelId);
        }
        if (outliers.Count > 0)
            issues.Add(new DataQualityIssueDto(
                "Accuracy",
                "Ratio",
                outliers.Count,
                "Parcels with ratio outside Q1−1.5·IQR..Q3+1.5·IQR within their hood",
                outliers.Count > Math.Max(1, ratios.Count) * 0.05 ? "critical" : "warning",
                outliers.Take(5).ToList()));

        // Check 6 — Impossible quality/grade pairings (POOR + LUXURY/EXCELLENT/GOOD is nonsense)
        var mismatches = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                     && c.ConditionGrade == "POOR"
                     && (c.QualityGrade == "LUXURY" || c.QualityGrade == "EXCELLENT" || c.QualityGrade == "GOOD"))
            .Select(c => c.ParcelId)
            .Take(5000)
            .ToListAsync(ct);
        if (mismatches.Count > 0)
            issues.Add(new DataQualityIssueDto(
                "Consistency",
                "ConditionGrade + QualityGrade",
                mismatches.Count,
                "Impossible pairing: POOR condition with LUXURY/EXCELLENT/GOOD quality",
                "critical",
                mismatches.Take(5).ToList()));

        // Check 7 — Year-built anomalies
        var currentYear = DateTime.UtcNow.Year;
        var yearIssues = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                     && (c.YearBuilt > currentYear
                         || (c.EffectiveAge.HasValue && c.YearBuilt.HasValue
                             && c.EffectiveAge > (currentYear - c.YearBuilt) + 20)))
            .Select(c => c.ParcelId)
            .Take(5000)
            .ToListAsync(ct);
        if (yearIssues.Count > 0)
            issues.Add(new DataQualityIssueDto(
                "Consistency",
                "YearBuilt/EffectiveAge",
                yearIssues.Count,
                "YearBuilt in future or EffectiveAge exceeds actual age by more than 20 years",
                "warning",
                yearIssues.Take(5).ToList()));

        // Check 8 — GLA exceeds land area (impossible for SFR)
        var glaIssues = await _context.CamaCharacteristics
            .Where(c => c.CountyId == countyId && c.TaxYear == taxYear
                     && c.LandAreaSqft != null
                     && c.SquareFeet > c.LandAreaSqft)
            .Select(c => c.ParcelId)
            .Take(5000)
            .ToListAsync(ct);
        if (glaIssues.Count > 0)
            issues.Add(new DataQualityIssueDto(
                "Consistency",
                "SquareFeet/LandAreaSqft",
                glaIssues.Count,
                "Living area (SquareFeet) exceeds LandAreaSqft — impossible for SFR",
                "warning",
                glaIssues.Take(5).ToList()));

        return new DataQualityAssessmentDto(
            countyId, taxYear, totalParcels, issues, DateTime.UtcNow);
    }
}
