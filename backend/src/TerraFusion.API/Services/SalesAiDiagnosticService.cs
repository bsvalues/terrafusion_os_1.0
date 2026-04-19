// backend/src/TerraFusion.API/Services/SalesAiDiagnosticService.cs
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Interfaces;
using TerraFusion.Data;

namespace TerraFusion.API.Services;

public sealed class SalesAiDiagnosticService : ISalesAiDiagnosticService
{
    private readonly TerraFusionDbContext _db;
    private readonly ILogger<SalesAiDiagnosticService> _logger;

    public SalesAiDiagnosticService(
        TerraFusionDbContext db,
        ILogger<SalesAiDiagnosticService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // ── Public API ─────────────────────────────────────────────────────────

    public async System.Threading.Tasks.Task<TerraFusion.Core.Entities.SaleAuditDiagnosis> DiagnoseStratumAsync(
        Guid countyId, int taxYear, string stratumKey, CancellationToken ct = default)
    {
        var sales = await LoadStratumSalesAsync(countyId, stratumKey, taxYear, ct);
        var findings = RunRules(sales);
        var diagnosis = BuildDiagnosis(countyId, taxYear, stratumKey, sales, findings);

        // Pre-compute projected stats so the UI can show immediate impact
        if (diagnosis.RecommendedSaleIdsJson is { } saleIdsJson)
        {
            try
            {
                var excludeIds = JsonSerializer.Deserialize<List<Guid>>(saleIdsJson) ?? [];
                if (excludeIds.Count > 0)
                {
                    var projected = await SimulateAsync(countyId, stratumKey, taxYear,
                        excludeSaleIds: excludeIds, ct: ct);
                    diagnosis.SimulationResultJson = JsonSerializer.Serialize(projected);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to pre-compute simulation for stratum {Key}", stratumKey);
            }
        }

        await UpsertDiagnosisAsync(diagnosis, ct);
        return diagnosis;
    }

    public async System.Threading.Tasks.Task<int> DiagnoseCountyAsync(
        Guid countyId, int taxYear, CancellationToken ct = default)
    {
        var stratumKeys = await _db.ComparableSales
            .Where(s => s.CountyId == countyId && s.SaleDate.Year == taxYear)
            .Select(s => s.Neighborhood)
            .Distinct()
            .ToListAsync(ct);

        int count = 0;
        foreach (var key in stratumKeys.Where(k => k != null))
        {
            try
            {
                await DiagnoseStratumAsync(countyId, taxYear, key!, ct);
                count++;
            }
            catch (Exception ex)
            {
                if (ex is OperationCanceledException)
                    throw;
                _logger.LogWarning(ex, "Diagnosis failed for stratum {Key}", key);
            }
        }
        return count;
    }

    public async System.Threading.Tasks.Task<List<StratumDiagnosisSummaryDto>> GetDiagnoseSummariesAsync(
        Guid countyId, int taxYear, CancellationToken ct = default)
    {
        return await _db.Set<TerraFusion.Core.Entities.SaleAuditDiagnosis>()
            .Where(d => d.CountyId == countyId && d.TaxYear == taxYear)
            .Select(d => new StratumDiagnosisSummaryDto(
                d.StratumKey,
                d.PrimaryDiagnosis,
                d.Confidence,
                d.RecommendedAction,
                d.IsStale,
                d.DiagnosedAt))
            .ToListAsync(ct);
    }

    public async System.Threading.Tasks.Task<List<StratumSaleDto>> GetStratumSalesAsync(
        Guid countyId, string stratumKey, int taxYear, CancellationToken ct = default)
    {
        var sales = await LoadStratumSalesAsync(countyId, stratumKey, taxYear, ct);
        var diagnosis = await _db.Set<TerraFusion.Core.Entities.SaleAuditDiagnosis>()
            .FirstOrDefaultAsync(
                d => d.CountyId == countyId && d.TaxYear == taxYear && d.StratumKey == stratumKey,
                ct);

        var flaggedIds = new HashSet<Guid>();
        var flagReasons = new Dictionary<Guid, string>();
        if (diagnosis?.RecommendedSaleIdsJson is { } json)
        {
            try
            {
                var ids = JsonSerializer.Deserialize<List<Guid>>(json) ?? [];
                flaggedIds.UnionWith(ids);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize recommended sale IDs JSON for diagnosis in stratum {Key}", stratumKey);
            }
        }
        if (diagnosis?.FindingsJson is { } fj)
        {
            try
            {
                var findings = JsonSerializer.Deserialize<List<DiagnosisFinding>>(fj) ?? [];
                foreach (var f in findings)
                    foreach (var id in f.AffectedSaleIds)
                        flagReasons[id] = f.Rule;
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Failed to deserialize findings JSON for diagnosis in stratum {Key}", stratumKey);
            }
        }

        var parcelIds = sales.Select(s => s.ParcelId).Distinct().ToList();
        var assessedValues = await _db.Properties
            .Where(p => p.CountyId == countyId && p.TaxYear == taxYear
                     && parcelIds.Contains(p.ParcelId))
            .ToDictionaryAsync(p => p.ParcelId, p => (decimal?)p.AssessedValue, ct);

        return sales.Select(s =>
        {
            var av = assessedValues.GetValueOrDefault(s.ParcelId);
            var ratio = av.HasValue && s.SalePrice > 0
                ? Math.Round(av.Value / s.SalePrice, 4) : (decimal?)null;
            return new StratumSaleDto(
                s.Id, s.ParcelId, s.SaleDate, s.SalePrice,
                av, ratio, s.RawWacCd,
                flaggedIds.Contains(s.Id) ? "AI_FLAGGED" : null,
                flagReasons.GetValueOrDefault(s.Id),
                s.SaleQualification,
                s.QualificationRecommendation,
                s.QualificationDecision);
        }).ToList();
    }

    public async System.Threading.Tasks.Task<SimulationResultDto> SimulateAsync(
        Guid countyId, string stratumKey, int taxYear,
        decimal factor = 1.0m,
        IEnumerable<Guid>? excludeSaleIds = null,
        CancellationToken ct = default)
    {
        var sales = await LoadStratumSalesAsync(countyId, stratumKey, taxYear, ct);
        var exclude = excludeSaleIds?.ToHashSet() ?? [];
        var activeSales = sales.Where(s => !exclude.Contains(s.Id)).ToList();

        var parcelIds = activeSales.Select(s => s.ParcelId).Distinct().ToList();
        var avMap = await _db.Properties
            .Where(p => p.CountyId == countyId && p.TaxYear == taxYear
                     && parcelIds.Contains(p.ParcelId))
            .ToDictionaryAsync(p => p.ParcelId, p => (decimal?)p.AssessedValue, ct);

        var ratios = activeSales
            .Where(s => avMap.ContainsKey(s.ParcelId) && s.SalePrice > 0)
            .Select(s => avMap[s.ParcelId]!.Value * factor / s.SalePrice)
            .OrderBy(r => r)
            .ToList();

        if (ratios.Count == 0)
            return new SimulationResultDto(0, 0, 0, 0);

        var salePrices = activeSales
            .Where(s => avMap.ContainsKey(s.ParcelId) && s.SalePrice > 0)
            .Select(s => s.SalePrice)
            .ToList();

        return ComputeIaaoStats(ratios, salePrices);
    }

    // ── Private helpers ────────────────────────────────────────────────────

    private System.Threading.Tasks.Task<List<TerraFusion.Core.Entities.ComparableSale>> LoadStratumSalesAsync(
        Guid countyId, string stratumKey, int taxYear, CancellationToken ct) =>
        _db.ComparableSales
           .Where(s => s.CountyId == countyId
                    && s.Neighborhood == stratumKey
                    && s.SaleDate.Year == taxYear
                    && s.QualificationDecision != "disqualified")
           .ToListAsync(ct);

    private static List<DiagnosisFinding> RunRules(List<TerraFusion.Core.Entities.ComparableSale> sales)
    {
        var findings = new List<DiagnosisFinding>();
        findings.AddRange(DateClusterRule(sales));
        findings.AddRange(MissingWacRule(sales));
        findings.AddRange(PriceClusterRule(sales));
        return findings;
    }

    private static IEnumerable<DiagnosisFinding> DateClusterRule(
        List<TerraFusion.Core.Entities.ComparableSale> sales)
    {
        var byDate = sales
            .Where(s => s.SaleDate != default)
            .GroupBy(s => s.SaleDate.Date)
            .Where(g => g.Count() >= 2)
            .ToList();

        foreach (var g in byDate)
            yield return new DiagnosisFinding(
                "DateCluster",
                $"{g.Count()} sales share recording date {g.Key:yyyy-MM-dd}",
                g.Select(s => s.Id).ToList());
    }

    private static IEnumerable<DiagnosisFinding> MissingWacRule(
        List<TerraFusion.Core.Entities.ComparableSale> sales)
    {
        var noWac = sales.Where(s => string.IsNullOrWhiteSpace(s.RawWacCd)).ToList();
        if (noWac.Count > 0)
            yield return new DiagnosisFinding(
                "MissingWac",
                $"{noWac.Count} sale(s) have no WAC code on record",
                noWac.Select(s => s.Id).ToList());
    }

    private static IEnumerable<DiagnosisFinding> PriceClusterRule(
        List<TerraFusion.Core.Entities.ComparableSale> sales)
    {
        var sorted = sales.OrderBy(s => s.SalePrice).ToList();
        var clusters = new List<Guid>();
        for (int i = 0; i < sorted.Count - 1; i++)
        {
            if (sorted[i].SalePrice == 0) continue;
            var diff = Math.Abs(sorted[i + 1].SalePrice - sorted[i].SalePrice)
                       / sorted[i].SalePrice;
            // Flag pairs priced within 2% of each other — common indicator of non-arm's-length transactions
            if (diff < 0.02m)
                clusters.AddRange(new[] { sorted[i].Id, sorted[i + 1].Id });
        }
        if (clusters.Distinct().Count() >= 2)
            yield return new DiagnosisFinding(
                "PriceCluster",
                "Multiple sales priced within 2% of each other",
                clusters.Distinct().ToList());
    }

    private static TerraFusion.Core.Entities.SaleAuditDiagnosis BuildDiagnosis(
        Guid countyId, int taxYear, string stratumKey,
        List<TerraFusion.Core.Entities.ComparableSale> sales,
        List<DiagnosisFinding> findings)
    {
        var allFlaggedIds = findings.SelectMany(f => f.AffectedSaleIds).Distinct().ToList();
        string diagnosis;
        string action;
        decimal confidence;

        if (findings.Any(f => f.Rule is "DateCluster" or "MissingWac" or "PriceCluster"))
        {
            diagnosis = "DATA_PROBLEM";
            action = "DISQUALIFY_SALES";
            // Scale flagged-sale proportion (0–1) by 3× — ensures even moderate clusters produce high confidence
            confidence = Math.Min(1.0m, allFlaggedIds.Count / Math.Max(1m, sales.Count) * 3m);
        }
        else
        {
            diagnosis = "FLAG_FOR_REVIEW";
            action = "FLAG_FOR_REVIEW";
            confidence = 0.5m;
        }

        return new TerraFusion.Core.Entities.SaleAuditDiagnosis
        {
            Id = Guid.NewGuid(),
            CountyId = countyId,
            TaxYear = taxYear,
            StratumKey = stratumKey,
            PrimaryDiagnosis = diagnosis,
            Confidence = Math.Round(confidence, 2),
            FindingsJson = JsonSerializer.Serialize(findings),
            RecommendedAction = action,
            RecommendedSaleIdsJson = allFlaggedIds.Count > 0
                ? JsonSerializer.Serialize(allFlaggedIds) : null,
            DiagnosedAt = DateTime.UtcNow,
            IsStale = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            CreatedBy = "system",
            UpdatedBy = "system"
        };
    }

    private async System.Threading.Tasks.Task UpsertDiagnosisAsync(
        TerraFusion.Core.Entities.SaleAuditDiagnosis diagnosis, CancellationToken ct)
    {
        var existing = await _db.Set<TerraFusion.Core.Entities.SaleAuditDiagnosis>()
            .FirstOrDefaultAsync(
                d => d.CountyId == diagnosis.CountyId
                  && d.TaxYear == diagnosis.TaxYear
                  && d.StratumKey == diagnosis.StratumKey, ct);

        if (existing is null)
            _db.Set<TerraFusion.Core.Entities.SaleAuditDiagnosis>().Add(diagnosis);
        else
        {
            existing.PrimaryDiagnosis = diagnosis.PrimaryDiagnosis;
            existing.Confidence = diagnosis.Confidence;
            existing.FindingsJson = diagnosis.FindingsJson;
            existing.SimulationResultJson = diagnosis.SimulationResultJson;
            existing.RecommendedAction = diagnosis.RecommendedAction;
            existing.RecommendedSaleIdsJson = diagnosis.RecommendedSaleIdsJson;
            existing.RecommendedFactor = diagnosis.RecommendedFactor;
            existing.DiagnosedAt = diagnosis.DiagnosedAt;
            existing.IsStale = false;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.UpdatedBy = "system";
        }
        await _db.SaveChangesAsync(ct);
    }

    private static SimulationResultDto ComputeIaaoStats(
        List<decimal> sortedRatios, List<decimal> salePrices)
    {
        int n = sortedRatios.Count;
        decimal median = n % 2 == 0
            ? (sortedRatios[n / 2 - 1] + sortedRatios[n / 2]) / 2
            : sortedRatios[n / 2];

        // COD = average absolute deviation from median, as % of median
        decimal cod = median > 0
            ? sortedRatios.Sum(r => Math.Abs(r - median)) / n / median * 100m
            : 0m;

        // PRD = mean ratio / value-weighted mean ratio
        decimal meanRatio = sortedRatios.Average();
        decimal totalSalePrice = salePrices.Sum();
        decimal weightedMean = totalSalePrice > 0
            ? sortedRatios.Zip(salePrices, (r, p) => r * p).Sum() / totalSalePrice
            : meanRatio;
        decimal prd = weightedMean > 0 ? meanRatio / weightedMean : 1m;

        return new SimulationResultDto(
            Math.Round(cod, 2),
            Math.Round(median, 4),
            Math.Round(prd, 4),
            n);
    }
}
