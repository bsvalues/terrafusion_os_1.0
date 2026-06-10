using System;

namespace TerraFusion.Core.Sync.PacsAssessment;

public sealed class PacsAssessmentCurrentTruthResult
{
    public Guid PromotionLoadBatchId { get; set; }
    public string Status { get; set; } = "IN_PROGRESS";
    public int Considered { get; set; }
    public int Promoted { get; set; }
    public int PriorRowsRemoved { get; set; }
    public string? ErrorSummary { get; set; }
}

/// <summary>
/// ASSESSMENT-VALUE-SEAL: promotes a landed active-supplement
/// assessment-value batch into <c>truth_pacs.assessment_current</c>,
/// idempotent by natural key (PropId, AssessmentYear).
/// </summary>
public interface IPacsAssessmentCurrentTruthPromoter
{
    System.Threading.Tasks.Task<PacsAssessmentCurrentTruthResult> PromoteAsync(
        Guid assessmentValueLoadBatchId,
        string operatorName,
        System.Threading.CancellationToken cancellationToken = default);
}
