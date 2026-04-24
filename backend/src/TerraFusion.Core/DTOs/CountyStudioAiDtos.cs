// backend/src/TerraFusion.Core/DTOs/CountyStudioAiDtos.cs
//
// Task E — CountyStudioAiService DTOs.
//
// Deterministic diagnosis output. Every Narrative string on these records is
// built from Finding.Summary text — which in turn cites real numbers pulled
// from CountySegmentDetailDto / CountyHealthSummaryDto. No decoration beyond
// the detectors' own output. Tests assert byte-for-byte determinism on re-runs.

namespace TerraFusion.Core.DTOs;

/// <summary>
/// Root problem bucket for a segment or a county. The classifier picks the
/// argmax of weighted finding-category scores. Healthy wins only when the
/// segment has zero problem findings — it is seeded explicitly by the
/// HEALTHY_SEGMENT detector so its weight participates in the argmax.
/// </summary>
public enum ProblemClass
{
    Healthy,
    Data,
    Model,
    Workflow,
    Market,
}

/// <summary>
/// One atomic symptom detected on a segment. Findings are ordered by
/// EvidenceStrength descending; the first 1–2 drive the narrative.
///
/// Evidence is a deterministic dictionary of primitive values — every
/// number that any finding-produced sentence cites must appear here so
/// the UI can render it, tests can assert it, and the caller can audit.
///
/// ParcelIdHints carries up to 10 parcel IDs most responsible for the
/// finding. For detectors that do not identify specific parcels the list
/// is empty — never null.
/// </summary>
public record SegmentDiagnosisFinding(
    string Code,
    string Category,
    string Summary,
    decimal EvidenceStrength,
    Dictionary<string, object> Evidence,
    List<string> ParcelIdHints
);

/// <summary>
/// A prioritized corrective action for a segment. Target matches a moduleId
/// in the frontend moduleComponents map ("SalesForge", "CostForge",
/// "CompsForge", "Dais", "Dossier", "PropertyWorkbench", "None").
///
/// PrebuiltContext is passed verbatim as metadata to activateModule() so
/// downstream surfaces receive the same scope-bundle the ObjectInspector's
/// Action tab would hand them.
/// </summary>
public record SegmentRecommendedAction(
    string ActionCode,
    string Target,
    string Summary,
    int Priority,
    string Rationale,
    Dictionary<string, object>? PrebuiltContext
);

/// <summary>
/// Cross-segment pattern found on a county-level diagnosis run. Severity is
/// the fraction of affected segments (0.0–1.0).
/// </summary>
public record CountyPattern(
    string PatternCode,
    string Summary,
    int AffectedSegmentCount,
    List<Guid> SegmentIds,
    decimal Severity
);

/// <summary>
/// Deterministic diagnosis for a single segment. Every sentence in Narrative
/// cites a real number that appears in one of the Findings' Evidence maps.
/// InputFingerprint is the SHA-256 hex of the diagnosis inputs — identical
/// inputs always produce identical output.
/// </summary>
public record SegmentDiagnosisDto(
    Guid SegmentId,
    string SegmentName,
    string? City,
    string? NeighborhoodCode,
    int ParcelCount,
    ProblemClass PrimaryClass,
    decimal PrimaryConfidence,
    List<SegmentDiagnosisFinding> Findings,
    List<SegmentRecommendedAction> RecommendedActions,
    string Narrative,
    string InputFingerprint,
    DateTime GeneratedAt
);

/// <summary>
/// County-level diagnosis — aggregate classification plus the top-5
/// worst-diagnosed segments and cross-segment patterns.
/// </summary>
public record CountyDiagnosisDto(
    Guid StudyId,
    int TaxYear,
    string CountyName,
    ProblemClass OverallClass,
    decimal OverallConfidence,
    int HealthySegmentCount,
    int ProblemSegmentCount,
    List<SegmentDiagnosisDto> TopProblems,
    List<CountyPattern> Patterns,
    string Narrative,
    string InputFingerprint,
    DateTime GeneratedAt
);
