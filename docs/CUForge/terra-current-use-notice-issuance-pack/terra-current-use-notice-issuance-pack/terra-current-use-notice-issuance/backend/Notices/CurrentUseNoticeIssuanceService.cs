using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Notices;

public interface ICurrentUseNoticeIssuanceService
{
    Task<CurrentUseIssuedNoticeDto> CreatePendingAsync(
        CreatePendingCurrentUseNoticeDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseIssuedNoticeDto> ApproveAsync(
        Guid noticeId,
        ApproveCurrentUseNoticeDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseIssuedNoticeDto> IssueAsync(
        Guid noticeId,
        IssueCurrentUseNoticeDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseIssuedNoticeDto> VoidAsync(
        Guid noticeId,
        VoidCurrentUseNoticeDto request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CurrentUseIssuedNoticeDto>> GetParcelNoticesAsync(
        Guid parcelId,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseNoticeIssuanceService : ICurrentUseNoticeIssuanceService
{
    private static readonly List<CurrentUseIssuedNoticeDto> Notices = new();

    public Task<CurrentUseIssuedNoticeDto> CreatePendingAsync(
        CreatePendingCurrentUseNoticeDto request,
        CancellationToken cancellationToken)
    {
        var notice = new CurrentUseIssuedNoticeDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ParcelId,
            request.ClassificationId,
            request.RemovalId,
            request.RollbackCalculationId,
            request.NoticeType,
            CurrentUseIssuedNoticeStatus.PendingApproval,
            request.Title,
            request.Body,
            string.Empty,
            null,
            null,
            null,
            null,
            null,
            null,
            null,
            DateTimeOffset.UtcNow,
            request.CreatedBy);

        Notices.Add(notice);

        return Task.FromResult(notice);
    }

    public Task<CurrentUseIssuedNoticeDto> ApproveAsync(
        Guid noticeId,
        ApproveCurrentUseNoticeDto request,
        CancellationToken cancellationToken)
    {
        var existing = FindNotice(noticeId);

        if (existing.Status != CurrentUseIssuedNoticeStatus.PendingApproval)
        {
            throw new InvalidOperationException("Only pending notices can be approved.");
        }

        var updated = existing with
        {
            Status = CurrentUseIssuedNoticeStatus.ApprovedForIssuance,
            ApprovedBy = request.ApprovedBy,
            ApprovedAt = DateTimeOffset.UtcNow
        };

        Replace(existing, updated);
        return Task.FromResult(updated);
    }

    public Task<CurrentUseIssuedNoticeDto> IssueAsync(
        Guid noticeId,
        IssueCurrentUseNoticeDto request,
        CancellationToken cancellationToken)
    {
        var existing = FindNotice(noticeId);

        if (existing.Status != CurrentUseIssuedNoticeStatus.ApprovedForIssuance)
        {
            throw new InvalidOperationException("Notice must be approved before issuance.");
        }

        var updated = existing with
        {
            Status = CurrentUseIssuedNoticeStatus.Issued,
            IssuedBy = request.IssuedBy,
            IssuedAt = DateTimeOffset.UtcNow,
            DeliveryMethod = request.DeliveryMethod,
            DeliveryReference = request.DeliveryReference,
            DossierDocumentId = request.DossierDocumentId
        };

        Replace(existing, updated);
        return Task.FromResult(updated);
    }

    public Task<CurrentUseIssuedNoticeDto> VoidAsync(
        Guid noticeId,
        VoidCurrentUseNoticeDto request,
        CancellationToken cancellationToken)
    {
        var existing = FindNotice(noticeId);

        if (existing.Status == CurrentUseIssuedNoticeStatus.Issued)
        {
            throw new InvalidOperationException("Issued notices cannot be silently voided. Create a superseding correction notice.");
        }

        var updated = existing with
        {
            Status = CurrentUseIssuedNoticeStatus.Voided
        };

        Replace(existing, updated);
        return Task.FromResult(updated);
    }

    public Task<IReadOnlyList<CurrentUseIssuedNoticeDto>> GetParcelNoticesAsync(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseIssuedNoticeDto> result = Notices
            .Where(x => x.ParcelId == parcelId)
            .OrderByDescending(x => x.CreatedAt)
            .ToArray();

        return Task.FromResult(result);
    }

    private static CurrentUseIssuedNoticeDto FindNotice(Guid noticeId)
    {
        return Notices.FirstOrDefault(x => x.NoticeId == noticeId)
            ?? throw new InvalidOperationException($"Notice not found: {noticeId}");
    }

    private static void Replace(CurrentUseIssuedNoticeDto existing, CurrentUseIssuedNoticeDto updated)
    {
        Notices.Remove(existing);
        Notices.Add(updated);
    }
}
