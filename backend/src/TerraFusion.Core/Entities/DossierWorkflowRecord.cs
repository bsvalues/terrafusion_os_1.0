namespace TerraFusion.Core.Entities;

/// <summary>
/// Immutable Dossier record-metadata JSON. An assessment-draft captures an existing study;
/// equalization and audit rows are durable exports. This is not a Pilot action draft.
/// One county/request key covers all three operations.
/// </summary>
public sealed class DossierWorkflowRecord
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public Guid CountyId { get; init; }
    public string Kind { get; init; } = string.Empty;
    public int TaxYear { get; init; }
    public Guid? StudyId { get; init; }
    public Guid? DraftId { get; init; }
    public string RequestId { get; init; } = string.Empty;
    public string RequestHash { get; init; } = string.Empty;
    public string Revision { get; init; } = string.Empty;
    public string ContentHash { get; init; } = string.Empty;
    public string PayloadJson { get; init; } = string.Empty;
    public string CreatedBy { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
}
