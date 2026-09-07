using System.Text.Json;

namespace TerraFusion.API.DTOs;

public sealed record AssessmentDraftRequest(string County, Guid StudyId, string RequestId);
public sealed record EqualizationExportRequest(string County, Guid DraftId, string Revision, int TaxYear,
    string RequestId, bool Confirmed, string ReasonCode);
public sealed record AuditBundleRequest(string County, int TaxYear, string BundleScope, string? SubjectId,
    string RequestId, bool Confirmed, string ReasonCode);
public sealed record WorkflowArtifact(string Name, string Sha256, string MediaType, string SourceId, JsonElement Content);
public sealed record WorkflowPayload(Guid CountyId, int TaxYear, string Kind, Guid? StudyId, Guid? DraftId,
    string? SourceRevision, string? BundleScope, string? SubjectId, string? ReasonCode,
    string CreatedBy, DateTime CreatedAt, IReadOnlyList<WorkflowArtifact> Artifacts);
public sealed class DossierWorkflowException(int statusCode, string code, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string Code { get; } = code;
}
