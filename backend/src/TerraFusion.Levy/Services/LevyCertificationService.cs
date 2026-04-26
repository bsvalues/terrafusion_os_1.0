using Microsoft.Extensions.Logging;

namespace TerraFusion.Levy.Services;

/// <summary>
/// Levy certification state machine — B5 stub.
/// Full implementation: Draft → PendingReview → Certified workflow with FISMA audit trail.
/// Stub: returns correct shapes; full DB-backed state machine is a follow-on task.
/// </summary>
public sealed class LevyCertificationService : ILevyCertificationService
{
    private readonly ILogger<LevyCertificationService> _logger;

    public LevyCertificationService(ILogger<LevyCertificationService> logger)
    {
        _logger = logger;
    }

    public Task<LevyCertificationResult> SubmitForReviewAsync(Guid levyRunId, string submittedBy, CancellationToken ct = default)
    {
        _logger.LogInformation("Levy run {LevyRunId} submitted for review by {User}", levyRunId, submittedBy);
        return Task.FromResult(new LevyCertificationResult(true, "PendingReview", null));
    }

    public Task<LevyCertificationResult> CertifyAsync(Guid levyRunId, string certifiedBy, string? notes = null, CancellationToken ct = default)
    {
        _logger.LogInformation("Levy run {LevyRunId} certified by {User}", levyRunId, certifiedBy);
        return Task.FromResult(new LevyCertificationResult(true, "Certified", notes));
    }

    public Task<LevyCertificationResult> RejectAsync(Guid levyRunId, string rejectedBy, string reason, CancellationToken ct = default)
    {
        _logger.LogWarning("Levy run {LevyRunId} rejected by {User}: {Reason}", levyRunId, rejectedBy, reason);
        return Task.FromResult(new LevyCertificationResult(true, "Draft", reason));
    }

    public Task<LevyCertificationStatusDto?> GetStatusAsync(Guid levyRunId, CancellationToken ct = default)
    {
        // Stub: returns null until DB-backed state machine is implemented (B5 follow-on)
        return Task.FromResult<LevyCertificationStatusDto?>(null);
    }
}
