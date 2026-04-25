// backend/src/TerraFusion.Core/DTOs/CountyStudyDtos.cs
using TerraFusion.Core.Entities;

// Design note: Response DTOs use string for enum fields (serialization-safe, stable API contract).
// Request DTOs use enum types directly for compile-time validation at the API boundary.

namespace TerraFusion.Core.DTOs;

// ── Study ──────────────────────────────────────────────────────────────

public record CountyStudySessionDto(
    Guid StudyId,
    Guid CountyId,
    string CountyName,
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

// ── Scenario Compare ──────────────────────────────────────────────────────────

public record ScenarioCompareRowDto(
    string MetricLabel,
    decimal Baseline,     // The "before" value (same for both)
    decimal AfterA,       // Scenario A projected result
    decimal AfterB,       // Scenario B projected result
    decimal DeltaAMinusB, // AfterA - AfterB (positive = A has higher value)
    string Winner         // "A" | "B" | "Tie"
);

public record ScenarioCompareDto(
    CountyScenarioDto ScenarioA,
    CountyScenarioDto ScenarioB,
    List<ScenarioCompareRowDto> Rows // one row per metric
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
    DateTime? PublishedAt,
    string? RollbackReason
);

public record PromoteScenarioRequest(
    Guid ScenarioId,
    string EffectiveScope  // JSON: { "cohortId": "<guid>" }
);

public record UpdateAdjustmentApprovalStateRequest(
    string NewState,
    string? RollbackReason = null   // Required for FISMA audit trail when transitioning to RolledBack
);

// ── ExceptionSet ──────────────────────────────────────────────────────────────

public record CountyExceptionSetDto(
    Guid ExceptionSetId,
    Guid StudyId,
    Guid SourceScenarioId,
    string ReasonCode,
    int ParcelCount,
    string Destination,
    string Status,
    string? AssignedTo,
    string? Notes,
    DateTime CreatedAt,
    string CreatedBy
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

public record UpdateExceptionStatusRequest(ExceptionSetStatus NewStatus, string UserId);
public record AssignExceptionRequest(string AssignTo, string UserId);
public record AddExceptionNoteRequest(string NoteText, string UserId);

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

// ── Health Summary (Task C — chief appraiser's Monday-morning screen) ───────

/// <summary>
/// IAAO compliance classification for the county-level health summary. Reported
/// as a string on the DTO for API stability.
///   IaaoCompliant     — median ∈ [0.90,1.10] AND cod ≤ 20 AND prd ∈ [0.98,1.03]
///   MarginalCompliance — median ∈ [0.85,1.15] AND cod ≤ 25 AND prd ∈ [0.95,1.05]
///   NonCompliant       — anything else (metrics present but outside marginal bands)
///   InsufficientData   — ratioCount &lt; 30
/// </summary>
public enum CountyHealthComplianceStatus
{
    IaaoCompliant,
    MarginalCompliance,
    NonCompliant,
    InsufficientData,
}

/// <summary>
/// One segment selected for the top-5 action-item list. Ordered DESC by
/// CompositeRisk with ties broken by ParcelCount DESC. Reasons is a human-
/// readable list of every trigger that contributed to the risk, ordered by
/// contribution size.
/// </summary>
public record HealthAlertDto(
    Guid SegmentId,
    string SegmentName,
    string? NeighborhoodCode,
    string? City,
    int ParcelCount,
    decimal? MedianRatio,
    decimal? Cod,
    decimal? Prd,
    int ExceptionCount,
    decimal CompositeRisk,
    List<string> Reasons
);

/// <summary>
/// County-level health summary built from the study's active CountySegmentSet.
/// Overall metrics are computed from all parcel-level ratios across the active
/// set (parcel-weighted, not segment-weighted). TopAlerts are the 5 segments
/// with the highest composite risk. DerivedAt surfaces the active segment
/// set's UpdatedAt so the UI can say "derived N hours ago".
/// </summary>
public record CountyHealthSummaryDto(
    Guid StudyId,
    Guid CountyId,
    int TaxYear,
    int ParcelCount,
    int RatioCount,
    decimal? MedianRatio,
    decimal? Cod,
    decimal? Prd,
    decimal? StabilityScore,
    decimal? RiskScore,
    int ExceptionCount,
    string ComplianceStatus,
    List<HealthAlertDto> TopAlerts,
    int CriticalCount,
    int WarningCount,
    int HealthyCount,
    DateTime? DerivedAt
);

// ── Inspector (Task D — segment detail + action-context for ObjectInspector) ──

/// <summary>
/// One historical observation for the 5-year sparkline. Years without a matching
/// segment are simply omitted from the list — the frontend must not fabricate
/// filler rows. IsCurrentYear marks the row that corresponds to the segment the
/// Inspector is showing (the other rows are peer segments in prior tax years).
/// </summary>
public record SegmentYearPoint(
    int TaxYear,
    int ParcelCount,
    decimal? MedianRatio,
    decimal? Cod,
    decimal? Prd,
    decimal? Prb,
    int ExceptionCount,
    bool IsCurrentYear
);

/// <summary>
/// Everything the ObjectInspector needs to render the Metrics + Trend tabs in a
/// single round-trip: the segment's persisted IAAO metrics, Benton Method
/// additions (PRB / VEI / classification / composite equity score), a per-year
/// history series, and the same compliance-status / warnings vocabulary as
/// CountyHealthSummaryDto.
/// </summary>
public record CountySegmentDetailDto(
    Guid SegmentId,
    Guid SegmentSetId,
    Guid StudyId,
    Guid CountyId,
    int TaxYear,
    string Name,
    string SegmentType,
    string? City,
    string? NeighborhoodCode,
    int ParcelCount,
    // IAAO core
    decimal? MedianRatio,
    decimal? Cod,
    decimal? Prd,
    decimal? StabilityScore,
    decimal? RiskScore,
    int ExceptionCount,
    // Benton Method
    decimal? Prb,
    decimal? Vei,
    string EquityClassification,            // Fair | Progressive | Regressive | InsufficientData
    decimal? BentonEquityScore,             // 0-100
    // Count of qualified sale-ratio observations the PRB/VEI/classification
    // were computed from. Different from ParcelCount (which is the segment's
    // full parcel count). Used by Task E diagnosis detectors to distinguish
    // "low-sample" from "zero-sales" from "healthy".
    int RatioCount,
    // 5-year history (ascending). Empty list is valid.
    List<SegmentYearPoint> YearHistory,
    // Compliance
    string ComplianceStatus,                // IaaoCompliant | MarginalCompliance | NonCompliant | InsufficientData
    List<string> Warnings,                  // same vocabulary as HealthAlertDto.Reasons
    DateTime? DerivedAt,
    // Top-10 parcel IDs most responsible for this segment's findings.
    // Sorted by |ratio − median| descending (greatest dispersion first).
    // Empty when fewer than 2 qualified sales exist.
    // Populated by CountyStudyInspectorService; used by AiDiagnosisPanel hints.
    List<string> OutlierParcelIds
);

/// <summary>
/// Pre-scoped handoff context for the five correction surfaces. The frontend
/// uses these to render deeplink-capable buttons in the Inspector's Action tab.
/// DeeplinkQuery is null when the target surface does not yet consume URL
/// parameters — the frontend disables that button with an honest tooltip
/// instead of silently opening a page that won't be filtered.
/// </summary>
public record SalesForgeHandoffDto(
    string StratumKey,
    int TaxYear,
    int QualifiedSaleCount,
    string? DeeplinkQuery
);

public record CostForgeHandoffDto(
    string StratumKey,
    int TaxYear,
    string? DeeplinkQuery
);

public record CompsForgeHandoffDto(
    List<string> SampleParcelIds,       // capped at 10
    string? DeeplinkQuery
);

public record DaisHandoffDto(
    string WorkflowTemplate,            // "SegmentReview"
    string? DeeplinkQuery
);

public record DossierHandoffDto(
    string PacketTemplate,              // "SegmentEvidence"
    string? DeeplinkQuery
);

/// <summary>
/// Full handoff bundle for a segment. ParcelIds is capped at 1000 and
/// Truncated is set to true when the cap was hit (TotalParcels carries the
/// true count in that case). Every handoff sub-DTO is always present — UI
/// always renders all five buttons; absence of a deeplink is the disable signal.
/// </summary>
public record SegmentActionContextDto(
    Guid SegmentId,
    Guid StudyId,
    Guid CountyId,
    int TaxYear,
    string SegmentType,
    string? City,
    string? NeighborhoodCode,
    List<string> ParcelIds,
    int TotalParcels,
    bool Truncated,
    SalesForgeHandoffDto SalesForge,
    CostForgeHandoffDto CostForge,
    CompsForgeHandoffDto CompsForge,
    DaisHandoffDto Dais,
    DossierHandoffDto Dossier
);

// ── Evidence Packet (Task H — DOR-defensible export) ─────────────────────────

public record EvidenceExceptionItem(
    Guid ExceptionSetId,
    string ReasonCode,
    int ParcelCount,
    string Destination,
    string Status,
    string? AssignedTo,
    string? Notes,
    DateTime CreatedAt
);

public record EvidenceScenarioSection(
    Guid ScenarioId,
    string AdjustmentType,
    string Parameters,
    string Rationale,
    string Status,
    DateTime CreatedAt,
    string CreatedBy
);

public record EvidenceAiFindingSummary(
    string Code,
    string Category,
    string Summary,
    decimal EvidenceStrength
);

public record EvidenceAiSection(
    string OverallClass,
    decimal OverallConfidence,
    int HealthySegmentCount,
    int ProblemSegmentCount,
    string Narrative,
    List<EvidenceAiFindingSummary> TopFindings
);

public record EvidencePacketDto(
    // ── Header ────────────────────────────────────────────────────────────
    Guid StudyId,
    string CountyName,
    int TaxYear,
    string StudyType,
    string StudyStatus,
    DateTime ExportedAt,
    string ExportedBy,
    // ── IAAO Compliance ───────────────────────────────────────────────────
    decimal? MedianRatio,
    decimal? Cod,
    decimal? Prd,
    string ComplianceStatus,
    int ParcelCount,
    int RatioCount,
    int CriticalSegments,
    int WarningSegments,
    int HealthySegments,
    // ── Scenario Decision ─────────────────────────────────────────────────
    EvidenceScenarioSection? PrimaryScenario,
    // ── AI Diagnosis ──────────────────────────────────────────────────────
    EvidenceAiSection? AiDiagnosis,
    // ── Exception Log ─────────────────────────────────────────────────────
    List<EvidenceExceptionItem> Exceptions
);
