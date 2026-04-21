// backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs
using TerraFusion.Core.Entities;

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

public record CreateStudyRequest(
    Guid CountyId,
    int TaxYear,
    StudyType StudyType,
    string? BaselineVersion
);

// ── Segment ──────────────────────────────────────────────────────────────

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

public record CreateExceptionSetRequest(
    Guid StudyId,
    Guid SourceScenarioId,
    ExceptionReasonCode ReasonCode,
    List<string> ParcelIds,
    ExceptionDestination Destination
);
