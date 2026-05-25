using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Dossier;

public interface ICurrentUseDossierService
{
    Task<CurrentUseEvidencePacketDto> GetEvidencePacketAsync(
        Guid parcelId,
        CancellationToken cancellationToken);

    Task<CurrentUseDossierDocumentDto> LinkDocumentAsync(
        LinkCurrentUseDocumentRequestDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseDossierDocumentDto> UpdateDocumentStatusAsync(
        Guid documentId,
        UpdateCurrentUseDocumentStatusRequestDto request,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseDossierService : ICurrentUseDossierService
{
    private static readonly List<CurrentUseDossierDocumentDto> Documents = new();

    public Task<CurrentUseEvidencePacketDto> GetEvidencePacketAsync(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        var docs = Documents
            .Where(x => x.ParcelId == parcelId)
            .OrderByDescending(x => x.UploadedAt)
            .ToArray();

        var required = new[]
        {
            "FARM_PLAN",
            "LEASE_AGREEMENT",
            "INCOME_PROOF",
            "OWNER_INTENT_RESPONSE"
        };

        var presentTypes = docs.Select(x => x.DocumentType).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var missing = required.Where(x => !presentTypes.Contains(x)).ToArray();

        var status = missing.Length == 0
            ? CurrentUseEvidencePacketStatus.ReadyForReview
            : CurrentUseEvidencePacketStatus.Incomplete;

        var packet = new CurrentUseEvidencePacketDto(
            Guid.NewGuid(),
            docs.FirstOrDefault()?.CountyId ?? Guid.Parse("11111111-1111-1111-1111-111111111111"),
            parcelId,
            docs.FirstOrDefault()?.ClassificationId,
            "CURRENT_USE_REVIEW_PACKET",
            status,
            docs,
            missing,
            DateTimeOffset.UtcNow,
            "system",
            DateTimeOffset.UtcNow,
            "system");

        return Task.FromResult(packet);
    }

    public Task<CurrentUseDossierDocumentDto> LinkDocumentAsync(
        LinkCurrentUseDocumentRequestDto request,
        CancellationToken cancellationToken)
    {
        var doc = new CurrentUseDossierDocumentDto(
            request.DocumentId,
            request.CountyId,
            request.ParcelId,
            request.ClassificationId,
            request.DocumentType,
            request.FileName,
            request.ContentType,
            request.SizeBytes,
            "PendingReview",
            DateTimeOffset.UtcNow,
            request.UploadedBy,
            request.Notes);

        Documents.RemoveAll(x => x.DocumentId == request.DocumentId);
        Documents.Add(doc);

        return Task.FromResult(doc);
    }

    public Task<CurrentUseDossierDocumentDto> UpdateDocumentStatusAsync(
        Guid documentId,
        UpdateCurrentUseDocumentStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        var existing = Documents.FirstOrDefault(x => x.DocumentId == documentId);

        if (existing is null)
        {
            throw new InvalidOperationException($"Linked Current Use document not found: {documentId}");
        }

        var updated = existing with
        {
            LinkStatus = request.LinkStatus,
            Notes = request.Notes ?? existing.Notes
        };

        Documents.Remove(existing);
        Documents.Add(updated);

        return Task.FromResult(updated);
    }
}
