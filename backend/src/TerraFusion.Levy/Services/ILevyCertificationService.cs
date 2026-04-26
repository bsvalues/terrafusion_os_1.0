namespace TerraFusion.Levy.Services;

/// <summary>
/// Levy certification state machine (B5): Draft → PendingReview → Certified.
/// Specialist-gated workflow for levy certification approval.
/// </summary>
public interface ILevyCertificationService
{
    /// <summary>Submit a levy run for review (Draft → PendingReview).</summary>
    Task<LevyCertificationResult> SubmitForReviewAsync(Guid levyRunId, string submittedBy, CancellationToken ct = default);

    /// <summary>Approve a levy run under review (PendingReview → Certified).</summary>
    Task<LevyCertificationResult> CertifyAsync(Guid levyRunId, string certifiedBy, string? notes = null, CancellationToken ct = default);

    /// <summary>Reject a levy run under review (PendingReview → Draft).</summary>
    Task<LevyCertificationResult> RejectAsync(Guid levyRunId, string rejectedBy, string reason, CancellationToken ct = default);

    /// <summary>Get current certification status for a levy run.</summary>
    Task<LevyCertificationStatusDto?> GetStatusAsync(Guid levyRunId, CancellationToken ct = default);
}

/// <summary>Outcome of a certification state transition.</summary>
public sealed record LevyCertificationResult(bool Success, string NewStatus, string? Message);

/// <summary>Current certification status of a levy run.</summary>
public sealed record LevyCertificationStatusDto(Guid LevyRunId, string Status, string? LastActionBy, DateTime? LastActionAt, string? Notes);
