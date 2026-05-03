// backend/src/TerraFusion.Core/Interfaces/ICountyStudioAiService.cs
//
// Task E — County Studio deterministic-diagnosis contract.
//
// This service classifies segments and counties into {Healthy, Data, Model,
// Workflow, Market} buckets using rule-based detectors over the same
// CountySegmentDetailDto the Inspector already renders. Output is byte-for-
// byte deterministic: same inputs always produce the same narrative, findings,
// actions, and InputFingerprint. No LLM calls, no hand-waved prose.
//
// Throws InvalidOperationException:
//   - "not found" substring → controller maps 404.
//   - "no derived metrics" / "active segment set" → controller maps 409.

using TerraFusion.Core.DTOs;

namespace TerraFusion.Core.Interfaces;

public interface ICountyStudioAiService
{
    /// <summary>
    /// Diagnose a single segment. Throws InvalidOperationException with
    /// "not found" when the segment does not exist, or "no derived metrics"
    /// when the segment has neither ratios nor persisted IAAO metrics.
    /// </summary>
    Task<SegmentDiagnosisDto?> DiagnoseSegmentAsync(Guid segmentId, CancellationToken ct = default);

    /// <summary>
    /// Diagnose every segment in a study's active segment set, detect
    /// cross-segment patterns, and return the aggregate classification
    /// plus the 5 worst segments' diagnoses. Throws InvalidOperationException
    /// with "active segment set" when the study has none.
    /// </summary>
    Task<CountyDiagnosisDto?> DiagnoseCountyAsync(Guid studyId, CancellationToken ct = default);
}
