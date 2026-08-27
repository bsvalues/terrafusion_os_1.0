using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.Services;

namespace TerraFusion.Unit.Tests.Dossier;

/// <summary>
/// Strict scripted suite-boundary fixture for legacy controller tests. Every configured callback
/// supplies one typed outcome and validates the exact request observed by that test. An unexpected
/// operation fails the test instead of recreating Dossier's mutable rules in sovereign fixtures.
/// </summary>
internal sealed class ExplicitDossierMutationDecisionPort : IDossierMutationDecisionPort
{
    public Func<DossierCreateNoteDecisionRequest, DossierMutationPortResult<DossierCreateNoteMutation>>? CreateNote { get; init; }
    public Func<DossierRegisterDocumentDecisionRequest, DossierMutationPortResult<DossierRegisterDocumentMutation>>? RegisterDocument { get; init; }
    public Queue<Func<DossierTransitionDocumentStatusDecisionRequest, DossierMutationPortResult<DossierTransitionDocumentStatusMutation>>> TransitionDocumentStatus { get; } = new();
    public Func<DossierRegisterEvidenceDecisionRequest, DossierMutationPortResult<DossierRegisterEvidenceMutation>>? RegisterEvidence { get; init; }
    public Func<DossierAppendCustodyEventDecisionRequest, DossierMutationPortResult<DossierAppendCustodyEventMutation>>? AppendCustodyEvent { get; init; }
    public Func<DossierCreatePacketDecisionRequest, DossierMutationPortResult<DossierCreatePacketMutation>>? CreatePacket { get; init; }

    public Task<DossierMutationPortResult<DossierCreateNoteMutation>> DecideCreateNoteAsync(
        DossierCreateNoteDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Completed(CreateNote, request, DossierMutationOperation.createNote);

    public Task<DossierMutationPortResult<DossierRegisterDocumentMutation>> DecideRegisterDocumentAsync(
        DossierRegisterDocumentDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Completed(RegisterDocument, request, DossierMutationOperation.registerDocument);

    public Task<DossierMutationPortResult<DossierTransitionDocumentStatusMutation>> DecideTransitionDocumentStatusAsync(
        DossierTransitionDocumentStatusDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        if (TransitionDocumentStatus.Count == 0)
            return Unexpected<DossierTransitionDocumentStatusMutation>(DossierMutationOperation.transitionDocumentStatus);

        return Task.FromResult(TransitionDocumentStatus.Dequeue()(request));
    }

    public Task<DossierMutationPortResult<DossierRegisterEvidenceMutation>> DecideRegisterEvidenceAsync(
        DossierRegisterEvidenceDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Completed(RegisterEvidence, request, DossierMutationOperation.registerEvidence);

    public Task<DossierMutationPortResult<DossierAppendCustodyEventMutation>> DecideAppendCustodyEventAsync(
        DossierAppendCustodyEventDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Completed(AppendCustodyEvent, request, DossierMutationOperation.appendCustodyEvent);

    public Task<DossierMutationPortResult<DossierCreatePacketMutation>> DecideCreatePacketAsync(
        DossierCreatePacketDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Completed(CreatePacket, request, DossierMutationOperation.createPacket);

    internal static DossierMutationPortResult<TMutation> Accepted<TMutation>(TMutation mutation)
        where TMutation : DossierAcceptedMutation =>
        new(DossierMutationDecision.accepted, mutation, Array.Empty<DossierMutationViolation>());

    internal static DossierMutationPortResult<TMutation> Rejected<TMutation>(
        DossierMutationViolationCode code,
        string message)
        where TMutation : DossierAcceptedMutation =>
        new(
            DossierMutationDecision.rejected,
            null,
            [new DossierMutationViolation { Code = code, Message = message }]);

    private static Task<DossierMutationPortResult<TMutation>> Completed<TRequest, TMutation>(
        Func<TRequest, DossierMutationPortResult<TMutation>>? script,
        TRequest request,
        DossierMutationOperation operation)
        where TMutation : DossierAcceptedMutation =>
        script is null
            ? Unexpected<TMutation>(operation)
            : Task.FromResult(script(request));

    private static Task<DossierMutationPortResult<TMutation>> Unexpected<TMutation>(
        DossierMutationOperation operation)
        where TMutation : DossierAcceptedMutation =>
        Task.FromException<DossierMutationPortResult<TMutation>>(
            new InvalidOperationException($"Unexpected Dossier mutation operation: {operation}."));
}
