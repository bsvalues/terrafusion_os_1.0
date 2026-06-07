using System;

namespace TerraFusion.Core.Sync.PacsAssessment;

public sealed class PacsAssessmentCanonicalResult
{
    public Guid PromotionLoadBatchId { get; set; }
    public string Status { get; set; } = "IN_PROGRESS";
    public int TruthRowsConsidered { get; set; }
    public int AssessmentsProjected { get; set; }
    public int RowsUnresolved { get; set; }
    public decimal AssessedValProjected { get; set; }
    public int PriorRowsRemoved { get; set; }
    public string? ErrorSummary { get; set; }
}

/// <summary>
/// ASSESSMENT-VALUE-SEAL: projects <c>truth_pacs.assessment_current</c>
/// into <c>canonical_tf.tf_assessment</c>, resolving the parcel via
/// <c>sync_bridge.source_xref</c>. Rows whose parcel cannot be resolved
/// are counted + gated (not projected).
/// </summary>
public interface IPacsAssessmentCanonicalProjector
{
    System.Threading.Tasks.Task<PacsAssessmentCanonicalResult> ProjectAsync(
        Guid truthPromotionLoadBatchId,
        string operatorName,
        System.Threading.CancellationToken cancellationToken = default);
}
