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
    string CreatedBy, DateTime CreatedAt, IReadOnlyList<WorkflowArtifact> Artifacts, WorkflowReceipt? Receipt = null);
public sealed record WorkflowReceipt(Guid ReceiptId, string SchemaVersion, string CorrelationId, string RequestId,
    string ActorId, Guid CountyId, int TaxYear, string Operation, string? ReasonCode, JsonElement Inputs,
    WorkflowReceiptOutputs Outputs, DateTime RecordedAt, WorkflowReceiptTiming Timing, WorkflowReceiptSystem System,
    WorkflowExecutionEvidence ExecutionEvidence, WorkflowTraceReference TraceReference);
public sealed record WorkflowReceiptOutputs(Guid RecordId, Guid? StudyId, Guid? DraftId, Guid? PackageRef,
    string? SourceRevision, int ArtifactCount, IReadOnlyList<WorkflowArtifactReference> Artifacts);
public sealed record WorkflowArtifactReference(string Name, string Sha256, string MediaType, string SourceId);
public sealed record WorkflowReceiptTiming(DateTime StartedAt, double ElapsedMs, string Measurement);
public sealed record WorkflowReceiptSystem(string AssemblyVersion, string InformationalVersion, string ModuleVersionId, string Environment);
public sealed record WorkflowExecutionEvidence(string Source, Guid AuditLogId, string PayloadRef);
public sealed record WorkflowTraceReference(string CorrelationId, string PayloadRef, string Provider, string Availability);
// Server-only context; never bound from caller JSON and never included in the idempotency hash.
public sealed record WorkflowExecutionContext(string CorrelationId, DateTime StartedAt, long StartedTimestamp, string Environment);
public sealed class DossierWorkflowException(int statusCode, string code, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string Code { get; } = code;
}
