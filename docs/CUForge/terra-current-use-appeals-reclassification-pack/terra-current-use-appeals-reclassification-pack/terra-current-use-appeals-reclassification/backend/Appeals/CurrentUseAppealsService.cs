using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Appeals;

public interface ICurrentUseAppealsService
{
    Task<IReadOnlyList<CurrentUseAppealDto>> GetAppealsForParcelAsync(
        Guid parcelId,
        CancellationToken cancellationToken);

    Task<CurrentUseAppealDto> CreateAppealWindowAsync(
        CreateCurrentUseAppealDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseAppealDto> MarkAppealFiledAsync(
        Guid appealId,
        FileCurrentUseAppealDto request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CurrentUseReclassificationOptionDto>> GetReclassificationOptionsForParcelAsync(
        Guid parcelId,
        CancellationToken cancellationToken);

    Task<CurrentUseReclassificationOptionDto> CreateReclassificationOptionAsync(
        CreateCurrentUseReclassificationOptionDto request,
        CancellationToken cancellationToken);

    Task<CurrentUseReclassificationOptionDto> ReceiveReclassificationApplicationAsync(
        Guid reclassificationId,
        ReceiveCurrentUseReclassificationApplicationDto request,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseAppealsService : ICurrentUseAppealsService
{
    private static readonly List<CurrentUseAppealDto> Appeals = new();
    private static readonly List<CurrentUseReclassificationOptionDto> Reclassifications = new();

    public Task<IReadOnlyList<CurrentUseAppealDto>> GetAppealsForParcelAsync(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseAppealDto> result = Appeals
            .Where(x => x.ParcelId == parcelId)
            .OrderByDescending(x => x.CreatedAt)
            .ToArray();

        return Task.FromResult(result);
    }

    public Task<CurrentUseAppealDto> CreateAppealWindowAsync(
        CreateCurrentUseAppealDto request,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var appeal = new CurrentUseAppealDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ParcelId,
            request.ClassificationId,
            request.RemovalId,
            request.RollbackCalculationId,
            CurrentUseAppealStatus.AppealWindowOpen,
            request.NoticeMailDate,
            request.NoticeMailDate.AddDays(request.AppealWindowDays),
            null,
            null,
            null,
            request.Summary,
            Array.Empty<Guid>(),
            now,
            request.CreatedBy,
            now,
            request.CreatedBy);

        Appeals.Add(appeal);
        return Task.FromResult(appeal);
    }

    public Task<CurrentUseAppealDto> MarkAppealFiledAsync(
        Guid appealId,
        FileCurrentUseAppealDto request,
        CancellationToken cancellationToken)
    {
        var existing = Appeals.FirstOrDefault(x => x.AppealId == appealId)
            ?? throw new InvalidOperationException($"Current Use appeal not found: {appealId}");

        var updated = existing with
        {
            Status = CurrentUseAppealStatus.Filed,
            FiledDate = request.FiledDate,
            BoardReferenceNumber = request.BoardReferenceNumber,
            UpdatedAt = DateTimeOffset.UtcNow,
            UpdatedBy = request.UpdatedBy
        };

        Appeals.Remove(existing);
        Appeals.Add(updated);

        return Task.FromResult(updated);
    }

    public Task<IReadOnlyList<CurrentUseReclassificationOptionDto>> GetReclassificationOptionsForParcelAsync(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseReclassificationOptionDto> result = Reclassifications
            .Where(x => x.ParcelId == parcelId)
            .OrderByDescending(x => x.CreatedAt)
            .ToArray();

        return Task.FromResult(result);
    }

    public Task<CurrentUseReclassificationOptionDto> CreateReclassificationOptionAsync(
        CreateCurrentUseReclassificationOptionDto request,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var option = new CurrentUseReclassificationOptionDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ParcelId,
            request.ClassificationId,
            request.FromClassification,
            request.TargetClassification,
            CurrentUseReclassificationStatus.OptionAvailable,
            request.NoticeDate,
            request.NoticeDate.AddDays(request.ApplicationWindowDays),
            null,
            request.Summary,
            now,
            request.CreatedBy,
            now,
            request.CreatedBy);

        Reclassifications.Add(option);
        return Task.FromResult(option);
    }

    public Task<CurrentUseReclassificationOptionDto> ReceiveReclassificationApplicationAsync(
        Guid reclassificationId,
        ReceiveCurrentUseReclassificationApplicationDto request,
        CancellationToken cancellationToken)
    {
        var existing = Reclassifications.FirstOrDefault(x => x.ReclassificationId == reclassificationId)
            ?? throw new InvalidOperationException($"Current Use reclassification option not found: {reclassificationId}");

        var updated = existing with
        {
            Status = CurrentUseReclassificationStatus.ApplicationReceived,
            ApplicationReceivedDate = request.ApplicationReceivedDate,
            TargetClassification = request.TargetClassification ?? existing.TargetClassification,
            UpdatedAt = DateTimeOffset.UtcNow,
            UpdatedBy = request.UpdatedBy
        };

        Reclassifications.Remove(existing);
        Reclassifications.Add(updated);

        return Task.FromResult(updated);
    }
}
