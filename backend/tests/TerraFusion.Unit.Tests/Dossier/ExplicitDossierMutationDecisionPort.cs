using TerraFusion.Abstractions.DTOs;
using TerraFusion.Core.Services;

namespace TerraFusion.Unit.Tests.Dossier;

/// <summary>
/// Explicit suite-boundary fixture for legacy controller tests. It returns typed accepted or
/// rejected decisions so those tests exercise persistence and HTTP mapping without bypassing the
/// canonical mutation port.
/// </summary>
internal sealed class ExplicitDossierMutationDecisionPort : IDossierMutationDecisionPort
{
    public Task<DossierMutationPortResult<DossierCreateNoteMutation>> DecideCreateNoteAsync(
        DossierCreateNoteDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Accepted(new DossierCreateNoteMutation
        {
            Version = request.Command.ExpectedVersion + 1,
            NoteId = request.Command.NoteId,
            Content = request.Command.Content.Trim(),
            NoteType = string.IsNullOrWhiteSpace(request.Command.NoteType)
                ? "case_note"
                : request.Command.NoteType.Trim(),
            CreatedBy = request.ActorId,
            CreatedAt = request.EffectiveAt,
        });

    public Task<DossierMutationPortResult<DossierRegisterDocumentMutation>> DecideRegisterDocumentAsync(
        DossierRegisterDocumentDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Accepted(new DossierRegisterDocumentMutation
        {
            Version = request.Command.ExpectedVersion + 1,
            DocumentId = request.Command.DocumentId,
            Name = request.Command.Name.Trim(),
            DocumentType = request.Command.DocumentType.Trim().ToLowerInvariant(),
            Status = DossierDocumentStatus.active,
            MimeType = request.Command.MimeType.Trim(),
            SizeBytes = request.Command.SizeBytes,
            ContentHash = request.Command.ContentHash,
            Description = request.Command.Description?.Trim(),
            RetentionClass = request.Command.RetentionClass?.Trim(),
            StoragePath = request.Command.StoragePath?.Trim(),
            EntersCustodyChain = true,
            UploadedBy = request.ActorId,
            UploadedAt = request.EffectiveAt,
        });

    public Task<DossierMutationPortResult<DossierTransitionDocumentStatusMutation>> DecideTransitionDocumentStatusAsync(
        DossierTransitionDocumentStatusDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        var requested = request.Command.RequestedStatus.Trim().ToLowerInvariant();
        if (!Enum.TryParse<DossierDocumentStatus>(requested, out var status))
            return Rejected<DossierTransitionDocumentStatusMutation>(
                DossierMutationViolationCode.INVALID_STATUS,
                "The requested document status is invalid.");

        var current = request.Command.Current.Status.Trim().ToLowerInvariant();
        var allowed = (current, requested) is ("active", "sealed") or ("sealed", "archived");
        if (!allowed)
            return Rejected<DossierTransitionDocumentStatusMutation>(
                DossierMutationViolationCode.INVALID_TRANSITION,
                "The requested document transition is invalid.");

        return Accepted(new DossierTransitionDocumentStatusMutation
        {
            Version = request.Command.ExpectedVersion + 1,
            DocumentId = request.Command.DocumentId,
            Status = status,
            UpdatedAt = request.EffectiveAt,
        });
    }

    public Task<DossierMutationPortResult<DossierRegisterEvidenceMutation>> DecideRegisterEvidenceAsync(
        DossierRegisterEvidenceDecisionRequest request,
        CancellationToken cancellationToken = default) =>
        Accepted(new DossierRegisterEvidenceMutation
        {
            Version = request.Command.ExpectedVersion + 1,
            EvidenceId = request.Command.EvidenceId,
            Title = request.Command.Title.Trim(),
            EvidenceType = request.Command.EvidenceType.Trim(),
            DocumentId = request.Command.DocumentId,
            Integrity = DossierEvidenceIntegrity.pending,
            CreatedBy = request.ActorId,
            CreatedAt = request.EffectiveAt,
            GenesisEvent = new DossierCustodyEventMutation
            {
                EventId = request.Command.GenesisEventId,
                Action = "created",
                Actor = request.ActorId,
                PreviousEventHash = string.Empty,
                EventHash = request.Command.GenesisHash,
                Timestamp = request.EffectiveAt,
            },
            ChainLength = 1,
        });

    public Task<DossierMutationPortResult<DossierAppendCustodyEventMutation>> DecideAppendCustodyEventAsync(
        DossierAppendCustodyEventDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        var action = request.Command.Action.Trim().ToLowerInvariant();
        var integrity = action switch
        {
            "verified" or "hash-verified" => DossierEvidenceIntegrity.verified,
            "disputed" => DossierEvidenceIntegrity.disputed,
            "created" or "transferred" or "reviewed" or "released" =>
                Enum.Parse<DossierEvidenceIntegrity>(request.Command.Current.Integrity, ignoreCase: true),
            _ => (DossierEvidenceIntegrity?)null,
        };
        if (integrity is null)
            return Rejected<DossierAppendCustodyEventMutation>(
                DossierMutationViolationCode.INVALID_INPUT,
                "The custody action is invalid.");

        return Accepted(new DossierAppendCustodyEventMutation
        {
            Version = request.Command.ExpectedVersion + 1,
            EvidenceId = request.Command.EvidenceId,
            Integrity = integrity.Value,
            Event = new DossierCustodyEventMutation
            {
                EventId = request.Command.EventId,
                Action = action,
                Actor = request.ActorId,
                Notes = request.Command.Notes,
                PreviousEventHash = request.Command.PreviousEventHash,
                EventHash = request.Command.EventHash,
                Timestamp = request.EffectiveAt,
            },
            ChainLength = request.Command.Current.ChainLength + 1,
        });
    }

    public Task<DossierMutationPortResult<DossierCreatePacketMutation>> DecideCreatePacketAsync(
        DossierCreatePacketDecisionRequest request,
        CancellationToken cancellationToken = default)
    {
        var items = request.Command.Template.RequiredDocumentTypes.Select(type =>
        {
            var selected = request.Command.CurrentDocuments
                .Where(document => string.Equals(document.DocumentType, type, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(document.Status, "active", StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(document => document.UploadedAt)
                .ThenBy(document => document.DocumentId, StringComparer.Ordinal)
                .FirstOrDefault();
            return new DossierPacketItemMutation
            {
                DocumentType = type,
                Required = true,
                Satisfied = selected is not null,
                DocumentId = selected?.DocumentId,
                SatisfiedAt = selected?.UploadedAt,
            };
        }).ToArray();
        var satisfied = items.Count(item => item.Satisfied);
        var total = items.Length;
        return Accepted(new DossierCreatePacketMutation
        {
            Version = request.Command.ExpectedVersion + 1,
            PacketId = request.Command.PacketId,
            PacketType = request.Command.Template.PacketType.Trim(),
            Name = request.Command.Template.Name.Trim(),
            Status = total > 0 && satisfied == total
                ? DossierPacketStatus.complete
                : DossierPacketStatus.draft,
            CompletenessPercent = total == 0 ? 100m : decimal.Divide(satisfied * 100m, total),
            SatisfiedCount = satisfied,
            TotalRequired = total,
            CreatedBy = request.ActorId,
            CreatedAt = request.EffectiveAt,
            Items = items,
        });
    }

    private static Task<DossierMutationPortResult<TMutation>> Accepted<TMutation>(TMutation mutation)
        where TMutation : DossierAcceptedMutation =>
        Task.FromResult(new DossierMutationPortResult<TMutation>(
            DossierMutationDecision.accepted,
            mutation,
            Array.Empty<DossierMutationViolation>()));

    private static Task<DossierMutationPortResult<TMutation>> Rejected<TMutation>(
        DossierMutationViolationCode code,
        string message)
        where TMutation : DossierAcceptedMutation =>
        Task.FromResult(new DossierMutationPortResult<TMutation>(
            DossierMutationDecision.rejected,
            null,
            [new DossierMutationViolation { Code = code, Message = message }]));
}
