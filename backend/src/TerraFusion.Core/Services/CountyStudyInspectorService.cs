// backend/src/TerraFusion.Core/Services/CountyStudyInspectorService.cs
//
// Task D — Inspector service.
//
// Loads a single CountySegment, computes Benton Method extras (PRB, VEI,
// classification, composite equity score) from the same parcel-level ratios
// the derivation service uses, assembles a 5-year YoY history by joining
// prior CountySegments on (CountyId, SegmentType, GeographyRef) against
// CountyStudySessions where TaxYear ∈ [current-4, current], and returns the
// same compliance-status vocabulary and warning style as the county health
// summary (via CountyStudyHealthService.ComputeCompositeRisk reasons).
//
// The action-context endpoint returns pre-scoped handoff bundles. Per the
// ui-honesty-pass rule, each DeeplinkQuery is null when the target surface
// does not yet consume the URL parameters; the frontend disables that
// button with an honest tooltip. Right now every downstream module is
// registered but none of them consumes the deeplink params, so all five
// DeeplinkQuery values are null. This is wired so that when a downstream
// surface starts reading its segmentId/stratum/year query params the only
// change required is flipping the corresponding flag in ResolveDeeplinkSupport.

using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using TerraFusion.Core.DTOs;
using TerraFusion.Core.Entities;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.Core.Services;

public class CountyStudyInspectorService : ICountyStudyInspectorService
{
    // Sample-size gates — mirror CountyStudyHealthService so "insufficient" means
    // the same thing everywhere the user sees it.
    private const int MinParcelsForRisk  = 30;
    private const decimal CodIaaoCeiling = 20m;

    // ── Handoff target IDs (must match frontend moduleComponents.tsx entries) ──
    // Changing these without updating the frontend map silently disables the button.
    public const string SalesForgeTarget = "sales-forge";
    public const string CostForgeTarget  = "costforge";
    public const string CompsForgeTarget = "comps-forge";
    public const string DaisTarget       = "suite-dais";
    public const string DossierTarget    = "suite-dossier";

    // ── Parcel cap for action-context. Chief appraisers need ~large lists. ──
    public const int ActionContextParcelCap = 1000;

    // ── Comps sample cap — the number of representative parcels handed to
    //    CompsForge for a side-by-side. Kept small because the CompsForge UI
    //    shows each as a live card.
    public const int CompsSampleCap = 10;

    private readonly ITerraFusionDbContext _db;

    public CountyStudyInspectorService(ITerraFusionDbContext db) => _db = db;

    // ── Endpoint 1: segment detail ────────────────────────────────────────

    public async Task<CountySegmentDetailDto> GetSegmentDetailAsync(
        Guid segmentId, CancellationToken ct = default)
    {
        var segment = await _db.CountySegments
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.SegmentId == segmentId, ct)
            ?? throw new InvalidOperationException($"Segment {segmentId} not found");

        var segmentSet = await _db.CountySegmentSets
            .AsNoTracking()
            .FirstOrDefaultAsync(ss => ss.SegmentSetId == segment.SegmentSetId, ct)
            ?? throw new InvalidOperationException(
                $"SegmentSet {segment.SegmentSetId} missing for segment {segmentId}");

        var study = await _db.CountyStudySessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StudyId == segmentSet.StudyId, ct)
            ?? throw new InvalidOperationException(
                $"Study {segmentSet.StudyId} missing for segment {segmentId}");

        var rule = ParseRule(segment.RuleDefinition);

        // Build the parcel-level ratio set this segment represents. Mirrors
        // derivation's grouping key exactly so PRB/VEI see the same population.
        var ratios = await LoadSegmentRatiosAsync(study, rule, ct);

        // Benton additions — all from the single ratio set above, so any caller
        // re-computing downstream sees identical numbers.
        decimal? prb = BentonEquityMath.ComputePrb(ratios, segment.MedianRatio ?? 0m);
        decimal? vei = BentonEquityMath.ComputeVei(ratios, segment.PriceRelatedDifferential, prb);
        var classification = BentonEquityMath.ClassifyEquity(
            segment.PriceRelatedDifferential, prb, ratios.Count);
        var equityScore = BentonEquityMath.ComputeBentonEquityScore(
            segment.CoefficientOfDispersion, segment.PriceRelatedDifferential,
            prb, vei, ratios.Count);

        // Warnings: reuse the composite-risk reason generator from Task C so
        // the vocabulary matches HealthAlertDto.Reasons byte-for-byte.
        var (_, warnings) = CountyStudyHealthService.ComputeCompositeRisk(
            cod: segment.CoefficientOfDispersion,
            median: segment.MedianRatio,
            prd: segment.PriceRelatedDifferential,
            parcelCount: segment.ParcelCount,
            exceptionCount: segment.ExceptionCount);

        // Compliance classification — same function as the county health summary.
        var compliance = CountyStudyHealthService.ClassifyCompliance(
            median: segment.MedianRatio,
            cod: segment.CoefficientOfDispersion,
            prd: segment.PriceRelatedDifferential,
            ratioCount: ratios.Count);

        // YoY history — prior CountySegment rows in the same county with the
        // same (SegmentType, GeographyRef), bounded to tax-year window.
        var yearHistory = await BuildYearHistoryAsync(study, segment, ct);

        // Modal city for this segment — from the derivation grouping's parcels.
        var city = await ResolveCityAsync(study, rule, ct);

        return new CountySegmentDetailDto(
            SegmentId:            segment.SegmentId,
            SegmentSetId:         segment.SegmentSetId,
            StudyId:              study.StudyId,
            CountyId:             study.CountyId,
            TaxYear:              study.TaxYear,
            Name:                 segment.Name,
            SegmentType:          segment.SegmentType.ToString(),
            City:                 city,
            NeighborhoodCode:     segment.GeographyRef,
            ParcelCount:          segment.ParcelCount,
            MedianRatio:          segment.MedianRatio,
            Cod:                  segment.CoefficientOfDispersion,
            Prd:                  segment.PriceRelatedDifferential,
            StabilityScore:       segment.StabilityScore,
            RiskScore:            segment.RiskScore,
            ExceptionCount:       segment.ExceptionCount,
            Prb:                  prb.HasValue ? Math.Round(prb.Value, 4) : null,
            Vei:                  vei,
            EquityClassification: classification,
            BentonEquityScore:    equityScore,
            YearHistory:          yearHistory,
            ComplianceStatus:     compliance.ToString(),
            Warnings:             warnings,
            DerivedAt:            segmentSet.UpdatedAt);
    }

    // ── Endpoint 2: action context ────────────────────────────────────────

    public async Task<SegmentActionContextDto> GetActionContextAsync(
        Guid segmentId, CancellationToken ct = default)
    {
        var segment = await _db.CountySegments
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.SegmentId == segmentId, ct)
            ?? throw new InvalidOperationException($"Segment {segmentId} not found");

        var segmentSet = await _db.CountySegmentSets
            .AsNoTracking()
            .FirstOrDefaultAsync(ss => ss.SegmentSetId == segment.SegmentSetId, ct)
            ?? throw new InvalidOperationException(
                $"SegmentSet {segment.SegmentSetId} missing for segment {segmentId}");

        var study = await _db.CountyStudySessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StudyId == segmentSet.StudyId, ct)
            ?? throw new InvalidOperationException(
                $"Study {segmentSet.StudyId} missing for segment {segmentId}");

        var rule = ParseRule(segment.RuleDefinition);
        var city = await ResolveCityAsync(study, rule, ct);

        // Load the parcels this segment represents (derivation's grouping key)
        // so the handoff carries the exact set, not a guess.
        var matchingParcelIds = await LoadSegmentParcelIdsAsync(study, rule, ct);
        var totalParcels = matchingParcelIds.Count;
        var truncated    = totalParcels > ActionContextParcelCap;
        var cappedIds    = truncated
            ? matchingParcelIds.Take(ActionContextParcelCap).ToList()
            : matchingParcelIds;

        // Stratum key — derive from building-type rule (canonical) so the
        // handoff matches what SalesForge/CostForge already key off of.
        var stratumKey = DeriveStratumFromRule(rule);

        // Count qualified sales in the current tax year's window for this set.
        var qualifiedSaleCount = await CountQualifiedSalesAsync(
            study.CountyId, study.TaxYear, matchingParcelIds, ct);

        // CompsForge: 10 representative parcels (first N by parcel id — stable
        // across calls without an extra index). CompsForge decides what to do
        // with the sample.
        var compsSample = cappedIds.Take(CompsSampleCap).ToList();

        var support = ResolveDeeplinkSupport();

        string? BuildSalesForgeQuery() => support.SalesForge
            ? $"?stratum={Uri.EscapeDataString(stratumKey)}&year={study.TaxYear}&segmentId={segment.SegmentId}"
            : null;

        string? BuildCostForgeQuery() => support.CostForge
            ? $"?stratum={Uri.EscapeDataString(stratumKey)}&year={study.TaxYear}&segmentId={segment.SegmentId}"
            : null;

        string? BuildCompsForgeQuery() => support.CompsForge
            ? $"?segmentId={segment.SegmentId}&sample={string.Join(",", compsSample)}"
            : null;

        string? BuildDaisQuery() => support.Dais
            ? $"?template=SegmentReview&segmentId={segment.SegmentId}&studyId={study.StudyId}"
            : null;

        string? BuildDossierQuery() => support.Dossier
            ? $"?template=SegmentEvidence&segmentId={segment.SegmentId}&studyId={study.StudyId}"
            : null;

        return new SegmentActionContextDto(
            SegmentId:        segment.SegmentId,
            StudyId:          study.StudyId,
            CountyId:         study.CountyId,
            TaxYear:          study.TaxYear,
            SegmentType:      segment.SegmentType.ToString(),
            City:             city,
            NeighborhoodCode: segment.GeographyRef,
            ParcelIds:        cappedIds,
            TotalParcels:     totalParcels,
            Truncated:        truncated,
            SalesForge:       new SalesForgeHandoffDto(stratumKey, study.TaxYear, qualifiedSaleCount, BuildSalesForgeQuery()),
            CostForge:        new CostForgeHandoffDto(stratumKey, study.TaxYear, BuildCostForgeQuery()),
            CompsForge:       new CompsForgeHandoffDto(compsSample, BuildCompsForgeQuery()),
            Dais:             new DaisHandoffDto("SegmentReview", BuildDaisQuery()),
            Dossier:          new DossierHandoffDto("SegmentEvidence", BuildDossierQuery()));
    }

    /// <summary>
    /// Single source of truth for whether each handoff target currently
    /// accepts URL parameters. A flag is true only when the downstream
    /// module has a mount-time reader that consumes segmentId / stratum /
    /// year / sample parcel ids from window metadata (carrying the
    /// deeplinkQuery). Flipping a flag without wiring the target produces
    /// a handoff that lands on a generic screen — ui-honesty-pass violation.
    ///
    /// Task D2 wave 1:
    ///   SalesForge — wired at SalesForge.tsx useEffect mount hook, consumes
    ///                stratumKey/taxYear/segmentId and selects AI AUDIT tab.
    ///   CostForge  — wired at CostForge.tsx useEffect mount hook, consumes
    ///                stratumKey/taxYear/segmentId and seeds tax-year selector
    ///                + renders Scoped From chip with stratum disclosure.
    /// Task D3:
    ///   CompsForge — wired at CompsForgeModule.tsx useEffect mount hook,
    ///                consumes parcelIds (sample) + segmentId and renders a
    ///                "Preloaded from County Studio" section above the filters
    ///                plus a Scoped From chip.
    ///   Dais       — wired at DaisSuiteHome.tsx useEffect mount hook, consumes
    ///                workflowTemplate + segmentId and creates a session-scoped
    ///                SegmentWorkflowDraft rendered in DaisWorkflowDraftPanel
    ///                above the module launcher grid.
    ///   Dossier    — blocked on receiver code; left false until wired.
    /// </summary>
    public static DeeplinkSupport ResolveDeeplinkSupport() => new(
        SalesForge: true,
        CostForge:  true,
        CompsForge: true,
        Dais:       true,
        Dossier:    false);

    public record DeeplinkSupport(
        bool SalesForge,
        bool CostForge,
        bool CompsForge,
        bool Dais,
        bool Dossier);

    // ── Internal helpers ──────────────────────────────────────────────────

    private record SegmentRule(string Neighborhood, string BuildingType, string QualityGrade);

    private static SegmentRule ParseRule(string? ruleJson)
    {
        if (string.IsNullOrWhiteSpace(ruleJson))
            return new SegmentRule("UNKNOWN", "UNKNOWN", "UNKNOWN");
        try
        {
            var doc = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(ruleJson);
            if (doc is null) return new SegmentRule("UNKNOWN", "UNKNOWN", "UNKNOWN");
            string Get(string key) =>
                doc.TryGetValue(key, out var v) && v.ValueKind == JsonValueKind.String
                    ? (v.GetString() ?? "UNKNOWN") : "UNKNOWN";
            return new SegmentRule(Get("neighborhood"), Get("buildingType"), Get("qualityGrade"));
        }
        catch (JsonException)
        {
            return new SegmentRule("UNKNOWN", "UNKNOWN", "UNKNOWN");
        }
    }

    /// <summary>
    /// Derive the Benton-Method property-use stratum from a segment rule's
    /// building-type code. Matches PacsCanonicalizer.DeriveStratum byte-for-
    /// byte (duplicated here to avoid a Core→API project reference). If the
    /// PacsCanonicalizer code ever moves, update this in lockstep.
    /// </summary>
    private static string DeriveStratumFromRule(SegmentRule rule)
    {
        var bt = rule.BuildingType?.Trim().ToUpperInvariant();
        if (string.IsNullOrEmpty(bt)) return "X";
        if (bt.StartsWith("R")) return "R";
        if (bt.StartsWith("M")) return "M";
        if (bt.StartsWith("A")) return "A";
        if (bt == "V")          return "V";
        if (bt.StartsWith("C") || bt.StartsWith("I") || bt.StartsWith("S")) return "C";
        return "X";
    }

    /// <summary>
    /// Parcel IDs matching the segment's derivation rule for the study's
    /// current tax year. Ordered by ParcelId for determinism.
    /// </summary>
    private async Task<List<string>> LoadSegmentParcelIdsAsync(
        CountyStudySession study, SegmentRule rule, CancellationToken ct)
    {
        var countyId = study.CountyId;
        var taxYear  = study.TaxYear;

        var rows = await (
            from p in _db.Properties.AsNoTracking()
            where p.CountyId == countyId && p.TaxYear == taxYear
            join c in _db.CamaCharacteristics.AsNoTracking()
                on new { p.ParcelId, p.TaxYear } equals new { c.ParcelId, c.TaxYear } into cj
            from c in cj.DefaultIfEmpty()
            select new
            {
                p.ParcelId,
                Neighborhood = p.Neighborhood,
                BuildingType = c != null ? c.BuildingType : null,
                QualityGrade = c != null ? c.QualityGrade : null,
            }).ToListAsync(ct);

        return rows
            .Where(r => Norm(r.Neighborhood)  == rule.Neighborhood
                     && Norm(r.BuildingType) == rule.BuildingType
                     && Norm(r.QualityGrade)  == rule.QualityGrade)
            .Select(r => r.ParcelId)
            .OrderBy(id => id)
            .ToList();
    }

    /// <summary>
    /// Build the full SaleRatio[] for this segment at the study's tax year.
    /// Mirrors CountyStudySegmentDerivationService's join chain so PRB/VEI
    /// see the same population the persisted metrics were derived from.
    /// </summary>
    private async Task<List<SaleRatio>> LoadSegmentRatiosAsync(
        CountyStudySession study, SegmentRule rule, CancellationToken ct)
    {
        var countyId = study.CountyId;
        var taxYear  = study.TaxYear;

        var parcels = await (
            from p in _db.Properties.AsNoTracking()
            where p.CountyId == countyId && p.TaxYear == taxYear
            join c in _db.CamaCharacteristics.AsNoTracking()
                on new { p.ParcelId, p.TaxYear } equals new { c.ParcelId, c.TaxYear } into cj
            from c in cj.DefaultIfEmpty()
            select new
            {
                p.ParcelId,
                p.AssessedValue,
                Neighborhood = p.Neighborhood,
                BuildingType = c != null ? c.BuildingType : null,
                QualityGrade = c != null ? c.QualityGrade : null,
                YearBuilt    = c != null ? c.YearBuilt    : (int?)null,
                City         = c != null ? c.City         : null,
                SitusCity    = p.SitusCity,
            }).ToListAsync(ct);

        var scoped = parcels
            .Where(p => Norm(p.Neighborhood)  == rule.Neighborhood
                     && Norm(p.BuildingType) == rule.BuildingType
                     && Norm(p.QualityGrade)  == rule.QualityGrade)
            .ToList();
        if (scoped.Count == 0) return new();

        var matchedIds = scoped.Select(p => p.ParcelId).ToHashSet();
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);

        var salesRows = await _db.ComparableSales.AsNoTracking()
            .Where(s => s.CountyId == countyId)
            .Where(s => s.SaleDate >= lookbackStart && s.SaleDate <= lookbackEnd)
            .Where(s => s.SalePrice > 0)
            .Where(s => (s.QualificationDecision ?? s.QualificationRecommendation ?? s.SaleQualification) == "qualified")
            .Where(s => matchedIds.Contains(s.ParcelId))
            .Select(s => new { s.ParcelId, Price = s.AdjustedSalePrice ?? s.SalePrice, s.SaleDate })
            .ToListAsync(ct);

        var latestPriceByParcel = salesRows
            .GroupBy(s => s.ParcelId)
            .ToDictionary(g => g.Key,
                          g => g.OrderByDescending(x => x.SaleDate).First());

        var result = new List<SaleRatio>(scoped.Count);
        foreach (var p in scoped)
        {
            if (!latestPriceByParcel.TryGetValue(p.ParcelId, out var sale)) continue;
            if (p.AssessedValue <= 0 || sale.Price <= 0) continue;
            result.Add(new SaleRatio(
                ParcelId:           p.ParcelId,
                AssessedValue:      p.AssessedValue,
                AdjustedSalePrice:  sale.Price,
                Ratio:              p.AssessedValue / sale.Price,
                SaleDate:           sale.SaleDate,
                YearBuilt:          p.YearBuilt,
                NeighborhoodCode:   rule.Neighborhood,
                City:               !string.IsNullOrWhiteSpace(p.City) ? p.City : p.SitusCity,
                PropertyUseStratum: rule.BuildingType,
                ConditionGrade:     null,
                QualityGrade:       rule.QualityGrade));
        }
        return result;
    }

    /// <summary>
    /// Modal city for a segment — matches CountyStudyHealthService's logic.
    /// Falls back to "Unincorporated" when no matching parcel has a city.
    /// </summary>
    private async Task<string?> ResolveCityAsync(
        CountyStudySession study, SegmentRule rule, CancellationToken ct)
    {
        var countyId = study.CountyId;
        var taxYear  = study.TaxYear;

        var rows = await (
            from p in _db.Properties.AsNoTracking()
            where p.CountyId == countyId && p.TaxYear == taxYear
            join c in _db.CamaCharacteristics.AsNoTracking()
                on new { p.ParcelId, p.TaxYear } equals new { c.ParcelId, c.TaxYear } into cj
            from c in cj.DefaultIfEmpty()
            select new
            {
                p.ParcelId,
                Neighborhood = p.Neighborhood,
                BuildingType = c != null ? c.BuildingType : null,
                QualityGrade = c != null ? c.QualityGrade : null,
                City         = c != null ? c.City         : null,
                SitusCity    = p.SitusCity,
            }).ToListAsync(ct);

        var matched = rows
            .Where(r => Norm(r.Neighborhood)  == rule.Neighborhood
                     && Norm(r.BuildingType) == rule.BuildingType
                     && Norm(r.QualityGrade)  == rule.QualityGrade)
            .ToList();
        if (matched.Count == 0) return "Unincorporated";

        var byCity = matched
            .Select(r => NormalizeCity(!string.IsNullOrWhiteSpace(r.City) ? r.City : r.SitusCity))
            .GroupBy(c => c)
            .OrderByDescending(g => g.Count())
            .ThenBy(g => g.Key)
            .First();
        return byCity.Key;
    }

    /// <summary>
    /// Build the 5-year YoY series. For each prior tax year in [current-4, current]
    /// we find a peer CountySegment in the same county matching this segment's
    /// (SegmentType, GeographyRef); we compute PRB from the same canonical
    /// ratio set. Years without a peer segment are simply omitted — no filler.
    /// </summary>
    private async Task<List<SegmentYearPoint>> BuildYearHistoryAsync(
        CountyStudySession study, CountySegment currentSegment, CancellationToken ct)
    {
        var startYear = study.TaxYear - 4;
        var endYear   = study.TaxYear;

        // Sessions for (countyId × taxYear) in window.
        var sessions = await _db.CountyStudySessions.AsNoTracking()
            .Where(s => s.CountyId == study.CountyId)
            .Where(s => s.TaxYear >= startYear && s.TaxYear <= endYear)
            .Where(s => s.ActiveSegmentSetId != null)
            .Select(s => new { s.StudyId, s.TaxYear, s.ActiveSegmentSetId })
            .ToListAsync(ct);
        if (sessions.Count == 0) return new();

        var setIds = sessions.Select(s => s.ActiveSegmentSetId!.Value).ToList();

        // Peer segments — same SegmentType + GeographyRef — scoped to those sets.
        var peers = await _db.CountySegments.AsNoTracking()
            .Where(s => setIds.Contains(s.SegmentSetId))
            .Where(s => s.SegmentType == currentSegment.SegmentType)
            .Where(s => s.GeographyRef == currentSegment.GeographyRef)
            .ToListAsync(ct);

        // Map segmentSetId → taxYear.
        var yearBySet = sessions.ToDictionary(
            s => s.ActiveSegmentSetId!.Value,
            s => (s.TaxYear, s.StudyId));

        // One peer per year (ties — same set — already grouped by the peer join;
        // a segment set can theoretically have multiple segments matching the
        // same type+geo when derivation splits further — pick the one with the
        // highest ParcelCount as the "modal" peer for that year).
        var byYear = peers
            .Where(p => yearBySet.ContainsKey(p.SegmentSetId))
            .GroupBy(p => yearBySet[p.SegmentSetId].TaxYear)
            .Select(g => g.OrderByDescending(p => p.ParcelCount).First())
            .OrderBy(p => yearBySet[p.SegmentSetId].TaxYear)
            .ToList();

        var history = new List<SegmentYearPoint>(byYear.Count);
        foreach (var peer in byYear)
        {
            var (peerYear, peerStudyId) = yearBySet[peer.SegmentSetId];
            var peerStudy = await _db.CountyStudySessions.AsNoTracking()
                .FirstOrDefaultAsync(s => s.StudyId == peerStudyId, ct);
            decimal? peerPrb = null;
            if (peerStudy is not null && peer.MedianRatio.HasValue)
            {
                var peerRule = ParseRule(peer.RuleDefinition);
                var peerRatios = await LoadSegmentRatiosAsync(peerStudy, peerRule, ct);
                peerPrb = BentonEquityMath.ComputePrb(peerRatios, peer.MedianRatio.Value);
            }

            history.Add(new SegmentYearPoint(
                TaxYear:        peerYear,
                ParcelCount:    peer.ParcelCount,
                MedianRatio:    peer.MedianRatio,
                Cod:            peer.CoefficientOfDispersion,
                Prd:            peer.PriceRelatedDifferential,
                Prb:            peerPrb.HasValue ? Math.Round(peerPrb.Value, 4) : null,
                ExceptionCount: peer.ExceptionCount,
                IsCurrentYear:  peer.SegmentId == currentSegment.SegmentId));
        }
        return history;
    }

    private async Task<int> CountQualifiedSalesAsync(
        Guid countyId, int taxYear, IReadOnlyList<string> parcelIds, CancellationToken ct)
    {
        if (parcelIds.Count == 0) return 0;
        var lookbackStart = new DateTime(taxYear - 2, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var lookbackEnd   = new DateTime(taxYear, 12, 31, 23, 59, 59, DateTimeKind.Utc);
        var idSet = parcelIds.ToHashSet();

        var sales = await _db.ComparableSales.AsNoTracking()
            .Where(s => s.CountyId == countyId)
            .Where(s => s.SaleDate >= lookbackStart && s.SaleDate <= lookbackEnd)
            .Where(s => s.SalePrice > 0)
            .Where(s => (s.QualificationDecision ?? s.QualificationRecommendation ?? s.SaleQualification) == "qualified")
            .Where(s => idSet.Contains(s.ParcelId))
            .Select(s => s.ParcelId)
            .ToListAsync(ct);
        return sales.Distinct().Count();
    }

    private static string Norm(string? s) =>
        string.IsNullOrWhiteSpace(s) ? "UNKNOWN" : s!;

    /// <summary>
    /// Canonical Benton city normalization (matches CountyStudyHealthService).
    /// Any city outside the whitelist falls through to "Unincorporated".
    /// </summary>
    private static string NormalizeCity(string? rawCity)
    {
        if (string.IsNullOrWhiteSpace(rawCity)) return "Unincorporated";
        var normalized = rawCity.Trim().ToUpperInvariant();
        return normalized switch
        {
            "KENNEWICK"     => "Kennewick",
            "RICHLAND"      => "Richland",
            "PASCO"         => "Pasco",
            "PROSSER"       => "Prosser",
            "BENTON CITY"   => "Benton City",
            "WEST RICHLAND" => "West Richland",
            "FINLEY"        => "Finley",
            "BASIN CITY"    => "Basin City",
            "BURBANK"       => "Burbank",
            "PATERSON"      => "Paterson",
            _               => "Unincorporated",
        };
    }
}
