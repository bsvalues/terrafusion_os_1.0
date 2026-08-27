using TerraFusion.Abstractions.DTOs;

namespace TerraFusion.Core.Services;

/// <summary>
/// Dependency-inversion boundary for Dais-owned appeal creation defaults and lifecycle decisions.
/// The sovereign OS remains responsible for authorization, county isolation, identity, persistence,
/// transactions, audit, HTTP mapping, PII, monetary values, and notes.
/// </summary>
public interface IDaisAppealMutationDecisionPort
{
    Task<DaisAppealCreateDecisionResult> DecideCreateAsync(
        DaisAppealCreateDecisionRequest request,
        CancellationToken cancellationToken = default);

    Task<DaisAppealTransitionDecisionResult> DecideTransitionAsync(
        DaisAppealTransitionDecisionRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class DaisAppealMutationUnavailableException : Exception
{
    public DaisAppealMutationUnavailableException(string message, Exception? innerException = null)
        : base(message, innerException)
    {
    }
}

public sealed class DaisAppealMutationRejectedException : Exception
{
    public DaisAppealMutationRejectedException(
        DaisAppealMutationOperation operation,
        IReadOnlyList<DaisAppealMutationViolation> violations)
        : base($"Dais rejected the {operation} appeal mutation decision.")
    {
        Operation = operation;
        Violations = violations;
    }

    public DaisAppealMutationOperation Operation { get; }

    public IReadOnlyList<DaisAppealMutationViolation> Violations { get; }
}
