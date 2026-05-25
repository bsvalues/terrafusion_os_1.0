using System.Text.Json;
using TerraFusion.Modules.CurrentUse.Dto;

namespace TerraFusion.Modules.CurrentUse.Trace;

public interface ICurrentUseTraceService
{
    Task<CurrentUseTraceEventDto> AppendAsync(
        AppendCurrentUseTraceEventDto request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<CurrentUseTraceEventDto>> GetParcelTraceAsync(
        Guid parcelId,
        CancellationToken cancellationToken);

    Task<bool> VerifyChainAsync(
        Guid parcelId,
        CancellationToken cancellationToken);
}

public sealed class CurrentUseTraceService : ICurrentUseTraceService
{
    private static readonly List<CurrentUseTraceEventDto> Events = new();

    public Task<CurrentUseTraceEventDto> AppendAsync(
        AppendCurrentUseTraceEventDto request,
        CancellationToken cancellationToken)
    {
        var previous = Events
            .Where(x => x.CountyId == request.CountyId && x.ParcelId == request.ParcelId)
            .OrderByDescending(x => x.Timestamp)
            .FirstOrDefault();

        var timestamp = DateTimeOffset.UtcNow;
        var previousHash = previous?.Hash;
        var hash = CurrentUseTraceHasher.ComputeHash(request, previousHash, timestamp);

        var dto = new CurrentUseTraceEventDto(
            Guid.NewGuid(),
            request.CountyId,
            request.ParcelId,
            request.ClassificationId,
            request.CorrelationId,
            request.Action.ToString(),
            request.ActorId,
            request.ActorDisplayName,
            timestamp,
            request.CalculationVersion,
            request.DocumentIds ?? Array.Empty<Guid>(),
            request.Summary,
            request.PayloadJson,
            hash,
            previousHash);

        Events.Add(dto);
        return Task.FromResult(dto);
    }

    public Task<IReadOnlyList<CurrentUseTraceEventDto>> GetParcelTraceAsync(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        IReadOnlyList<CurrentUseTraceEventDto> result = Events
            .Where(x => x.ParcelId == parcelId)
            .OrderByDescending(x => x.Timestamp)
            .ToArray();

        return Task.FromResult(result);
    }

    public Task<bool> VerifyChainAsync(
        Guid parcelId,
        CancellationToken cancellationToken)
    {
        var ordered = Events
            .Where(x => x.ParcelId == parcelId)
            .OrderBy(x => x.Timestamp)
            .ToArray();

        string? previousHash = null;

        foreach (var item in ordered)
        {
            if (item.PreviousHash != previousHash)
            {
                return Task.FromResult(false);
            }

            previousHash = item.Hash;
        }

        return Task.FromResult(true);
    }
}
