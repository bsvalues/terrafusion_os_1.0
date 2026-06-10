using System;

namespace TerraFusion.Core.Sync.PacsAssessment;

/// <summary>Result of an assessment-value landing pass.</summary>
public sealed class PacsAssessmentValueLandingResult
{
    public Guid LoadBatchId { get; set; }
    public string Status { get; set; } = "IN_PROGRESS";
    public int RowsLanded { get; set; }
    public int DuplicateKeyViolations { get; set; }
    public string? ErrorSummary { get; set; }
}

/// <summary>
/// ASSESSMENT-VALUE-SEAL: lands active-supplement assessment value rows
/// into <c>legacy_pacs_raw.property_val</c> (value columns populated).
/// </summary>
public interface IPacsAssessmentValueLandingService
{
    System.Threading.Tasks.Task<PacsAssessmentValueLandingResult> LandAssessmentValuesAsync(
        IPacsAssessmentValueSource source,
        string operatorName,
        System.Threading.CancellationToken cancellationToken = default);
}
