// backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs
using TerraFusion.Core.Entities;

// Design note: Response DTOs use string for enum fields (serialization-safe, stable API contract).
// Request DTOs use enum types directly for compile-time validation at the API boundary.

namespace TerraFusion.Core.DTOs;

// ── Study ──────────────────────────────────────────────────────────────

public record CountyStudySessionDto(
    Guid StudyId,
    Guid CountyId,
    int TaxYear,
    string StudyType,
    string Status,
    string? BaselineVersion,
    Guid? ActiveSegmentSetId,
    DateTime CreatedAt,
    string CreatedBy
);

/// <summary>
/// Request to create a new county study session. CountyId is the canonical county
/// identifier and may be sent as either a Guid string or a human-readable county
/// name ("benton", case-insensitive). The server resolves via ICountyResolver.
/// </summary>
public record CreateStudyRequest(
    string CountyId,
    int TaxYear,
    StudyType StudyType,
    string? BaselineVersion
);

// ── Segment ──────────────────────────────────────────────────────────────

// DerivedFrom deliberately excluded from response — internal lineage tracking
public record CountySegmentSetDto(
    Guid SegmentSetId,
    Guid StudyId,
    string Name,
    string SourceType,
    int Version,
    bool IsBaseline,
    int SegmentCount
);

public record CountySegmentDto(
    Guid SegmentId,
    Guid SegmentSetId,
    string Name,
    string SegmentType,
    string? GeographyRef,
    int ParcelCount,
    decimal? MedianRatio,
    decimal? CoefficientOfDispersion,
    decimal? PriceRelatedDifferential,
    decimal StabilityScore,
    decimal RiskScore,
    int ExceptionCount
);

// ── Cohort ──────────────────────────────────────────────────────────────

public record CountyCohortDto(
    Guid CohortId,
    Guid StudyId,
    string Name,
    string SelectionType,
    string Definition,
    int ParcelCount,
    bool IsHybrid,
    DateTime CreatedAt
);

public record CreateSegmentSetRequest(
    Guid StudyId,
    string Name,
    string SourceType,
    bool IsBaseline = false
);

public record CreateCohortRequest(
    Guid StudyId,
    string Name,
    CohortSelectionType SelectionType,
    string Definition,      // JSON
    int ParcelCount,
    bool IsHybrid
);

// ── Scenario ──────────────────────────────────────────────────────────────

public record CountyScenarioDto(
    Guid ScenarioId,
    Guid StudyId,
    Guid CohortId,
    string AdjustmentType,
    string Parameters,
    string Rationale,
    string Status,
    string? ImpactPreviewJson,
    DateTime CreatedAt,
    string CreatedBy
);

public record CreateScenarioRequest(
    Guid StudyId,
    Guid CohortId,
    ScenarioAdjustmentType AdjustmentType,
    string Parameters,   // JSON: { magnitude: 4.0 }
    string Rationale
);

public record ScenarioImpactPreviewDto(
    Guid ScenarioId,
    decimal MedianRatioBefore,
    decimal MedianRatioAfter,
    decimal CodBefore,
    decimal CodAfter,
    decimal PrdBefore,
    decimal PrdAfter,
    int ExceptionsBefore,
    int ExceptionsAfter,
    int ParcelsAffected,
    List<ScenarioDeltaItem> Deltas
);

public record ScenarioDeltaItem(
    string ParcelId,
    decimal ValueBefore,
    decimal ValueAfter,
    decimal Delta
);

// ── AdjustmentSet ──────────────────────────────────────────────────────────────

// RollbackToken deliberately excluded from response — internal audit use only
public record CountyAdjustmentSetDto(
    Guid AdjustmentSetId,
    Guid StudyId,
    Guid ScenarioId,
    string EffectiveScope,
    string ApprovalState,
    string? ApprovedBy,
    DateTime? PublishedAt
);

public record PromoteScenarioRequest(
    Guid ScenarioId,
    string EffectiveScope  // JSON: { cohortId, segmentIds[], parcelCount }
);

// ── ExceptionSet ──────────────────────────────────────────────────────────────

public record CountyExceptionSetDto(
    Guid ExceptionSetId,
    Guid StudyId,
    Guid SourceScenarioId,
    string ReasonCode,
    int ParcelCount,
    string Destination,
    string Status
);

/// <summary>Body for PATCH api/county-study/studies/{studyId}/status.</summary>
public record UpdateStudyStatusRequest(string Status);

// ParcelIds: service is responsible for JSON-serializing this list into CountyExceptionSet.ParcelIdsJson
public record CreateCountyExceptionSetRequest(
    Guid StudyId,
    Guid SourceScenarioId,
    ExceptionReasonCode ReasonCode,
    List<string> ParcelIds,
    ExceptionDestination Destination
);

// ── Rollups (Task B — County → City → Neighborhood drill lattice) ─────────

/// <summary>
/// IAAO compliance tiering for a rollup row:
///   IaaoCompliant    — median ∈ [0.90, 1.10] AND COD ≤ 20 AND PRD ∈ [0.98, 1.03]
///   MarginalCompliance — one or two fall in a soft-warn band (see controller helper)
///   NonCompliant     — any hard failure against the IAAO thresholds above
/// </summary>
public enum RollupComplianceStatus
{
    IaaoCompliant,
    MarginalCompliance,
    NonCompliant,
}

/// <summary>
/// One row per Benton city on the county rollup. Aggregated from the study's
/// active CountySegmentSet by joining each segment's constituent parcels'
/// CamaCharacteristic.City (normalized via PacsCanonicalizer.NormalizeCity).
/// </summary>
public record CityRollupRowDto(
    string City,
    int SegmentCount,
    int ParcelCount,
    decimal? MedianRatio,
    decimal? Cod,
    decimal? Prd,
    int ExceptionCount,
    decimal ExceptionRate,
    string? WorstSegmentName,
    decimal? WorstSegmentMedianRatio,
    string ComplianceStatus
);

/// <summary>
/// One row per neighborhood on the city/neighborhood rollup. Aggregated from
/// each segment's GeographyRef (neighborhood code) within the resolved city.
/// </summary>
public record NeighborhoodRollupRowDto(
    string NeighborhoodCode,
    string NeighborhoodName,
    string City,
    int SegmentCount,
    int ParcelCount,
    decimal? MedianRatio,
    decimal? Cod,
    decimal? Prd,
    decimal StabilityScore,
    decimal RiskScore,
    int ExceptionCount,
    decimal ExceptionRate,
    string ComplianceStatus
);
