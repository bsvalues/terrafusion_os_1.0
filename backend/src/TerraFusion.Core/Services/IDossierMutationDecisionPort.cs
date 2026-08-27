using TerraFusion.Abstractions.DTOs;

namespace TerraFusion.Core.Services;

public interface IDossierMutationDecisionPort
{
    Task<DossierMutationPortResult<DossierCreateNoteMutation>> DecideCreateNoteAsync(DossierCreateNoteDecisionRequest request, CancellationToken cancellationToken = default);
    Task<DossierMutationPortResult<DossierRegisterDocumentMutation>> DecideRegisterDocumentAsync(DossierRegisterDocumentDecisionRequest request, CancellationToken cancellationToken = default);
    Task<DossierMutationPortResult<DossierTransitionDocumentStatusMutation>> DecideTransitionDocumentStatusAsync(DossierTransitionDocumentStatusDecisionRequest request, CancellationToken cancellationToken = default);
    Task<DossierMutationPortResult<DossierRegisterEvidenceMutation>> DecideRegisterEvidenceAsync(DossierRegisterEvidenceDecisionRequest request, CancellationToken cancellationToken = default);
    Task<DossierMutationPortResult<DossierAppendCustodyEventMutation>> DecideAppendCustodyEventAsync(DossierAppendCustodyEventDecisionRequest request, CancellationToken cancellationToken = default);
    Task<DossierMutationPortResult<DossierCreatePacketMutation>> DecideCreatePacketAsync(DossierCreatePacketDecisionRequest request, CancellationToken cancellationToken = default);
}

public sealed record DossierMutationPortResult<TMutation>(
    DossierMutationDecision Decision,
    TMutation? Mutation,
    IReadOnlyList<DossierMutationViolation> Violations)
    where TMutation : DossierAcceptedMutation;

public sealed class DossierMutationUnavailableException : Exception
{
    public DossierMutationUnavailableException(string message, Exception? inner = null) : base(message, inner) { }
}

public sealed class DossierMutationRejectedException : Exception
{
    public DossierMutationRejectedException(
        DossierMutationOperation operation,
        IReadOnlyList<DossierMutationViolation> violations)
        : base($"Dossier rejected the {operation} mutation decision.")
    {
        Operation = operation;
        Violations = violations;
    }

    public DossierMutationOperation Operation { get; }
    public IReadOnlyList<DossierMutationViolation> Violations { get; }
}
