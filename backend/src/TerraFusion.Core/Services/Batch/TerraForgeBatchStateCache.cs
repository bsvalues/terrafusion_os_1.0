using ValuationPipelineEntity = TerraFusion.Core.Entities.ValuationPipeline;

namespace TerraFusion.Core.Services.Batch;

public interface ITerraForgeBatchStateCache
{
  Task SaveAsync(TerraForgeBatchJobState state, CancellationToken cancellationToken = default);
  Task<TerraForgeBatchJobState?> GetAsync(Guid countyId, string batchJobId, CancellationToken cancellationToken = default);
  Task<bool> TrySetIdempotencyAsync(Guid countyId, string requestId, string batchJobId, CancellationToken cancellationToken = default);
  Task<string?> GetIdempotencyAsync(Guid countyId, string requestId, CancellationToken cancellationToken = default);
  Task<TimeSpan?> GetTimeToLiveAsync(Guid countyId, string batchJobId, CancellationToken cancellationToken = default);
}

public sealed class TerraForgeBatchStateCache : ITerraForgeBatchStateCache
{
  public static readonly TimeSpan DefaultExpiration = TimeSpan.FromHours(6);

  private readonly IRedisCacheService _cache;
  private readonly TimeSpan _expiration;

  public TerraForgeBatchStateCache(IRedisCacheService cache, TimeSpan? expiration = null)
  {
    _cache = cache ?? throw new ArgumentNullException(nameof(cache));
    _expiration = expiration ?? DefaultExpiration;
  }

  public async Task SaveAsync(TerraForgeBatchJobState state, CancellationToken cancellationToken = default)
  {
    ArgumentNullException.ThrowIfNull(state);
    cancellationToken.ThrowIfCancellationRequested();
    state.Validate();

    await _cache.SetAsync(StateKey(state.CountyId, state.BatchJobId), state, _expiration);
  }

  public async Task<TerraForgeBatchJobState?> GetAsync(
    Guid countyId,
    string batchJobId,
    CancellationToken cancellationToken = default)
  {
    cancellationToken.ThrowIfCancellationRequested();
    return await _cache.GetAsync<TerraForgeBatchJobState>(StateKey(countyId, batchJobId));
  }

  public async Task<bool> TrySetIdempotencyAsync(
    Guid countyId,
    string requestId,
    string batchJobId,
    CancellationToken cancellationToken = default)
  {
    cancellationToken.ThrowIfCancellationRequested();
    RequireNonEmpty(batchJobId, nameof(batchJobId));

    return await _cache.SetIfNotExistsAsync(IdempotencyKey(countyId, requestId), batchJobId.Trim(), _expiration);
  }

  public async Task<string?> GetIdempotencyAsync(
    Guid countyId,
    string requestId,
    CancellationToken cancellationToken = default)
  {
    cancellationToken.ThrowIfCancellationRequested();
    return await _cache.GetAsync<string>(IdempotencyKey(countyId, requestId));
  }

  public async Task<TimeSpan?> GetTimeToLiveAsync(
    Guid countyId,
    string batchJobId,
    CancellationToken cancellationToken = default)
  {
    cancellationToken.ThrowIfCancellationRequested();
    return await _cache.GetTimeToLiveAsync(StateKey(countyId, batchJobId));
  }

  public static string StateKey(Guid countyId, string batchJobId)
  {
    RequireCountyId(countyId);
    RequireNonEmpty(batchJobId, nameof(batchJobId));
    return $"terraforge:batch:{countyId:N}:{NormalizeKeyPart(batchJobId)}:state";
  }

  public static string IdempotencyKey(Guid countyId, string requestId)
  {
    RequireCountyId(countyId);
    RequireNonEmpty(requestId, nameof(requestId));
    return $"terraforge:batch:{countyId:N}:request:{NormalizeKeyPart(requestId)}:idempotency";
  }

  private static void RequireCountyId(Guid countyId)
  {
    if (countyId == Guid.Empty)
    {
      throw new ArgumentException("CountyId is required.", nameof(countyId));
    }
  }

  private static string NormalizeKeyPart(string value)
  {
    RequireNonEmpty(value, nameof(value));

    return string.Concat(value.Trim().Select(c =>
      char.IsLetterOrDigit(c) || c is '-' or '_' or ':' or '.'
        ? char.ToLowerInvariant(c)
        : '-'));
  }

  private static void RequireNonEmpty(string value, string paramName)
  {
    if (string.IsNullOrWhiteSpace(value))
    {
      throw new ArgumentException("Value is required.", paramName);
    }
  }
}

public sealed record TerraForgeBatchJobState(
  string BatchJobId,
  string RequestId,
  Guid CountyId,
  string Status,
  int TotalParcels,
  int CompletedParcels,
  int FailedParcels,
  DateTimeOffset UpdatedAt,
  string? Error)
{
  public static TerraForgeBatchJobState FromPipeline(
    ValuationPipelineEntity pipeline,
    string? requestId = null,
    string? error = null)
  {
    ArgumentNullException.ThrowIfNull(pipeline);

    return new TerraForgeBatchJobState(
      pipeline.Id.ToString(),
      string.IsNullOrWhiteSpace(requestId) ? $"pipeline:{pipeline.Id}" : requestId.Trim(),
      pipeline.CountyId,
      pipeline.Status,
      pipeline.TotalParcels,
      pipeline.CompletedParcels,
      pipeline.FailedParcels,
      DateTimeOffset.UtcNow,
      error ?? pipeline.Errors);
  }

  public void Validate()
  {
    if (string.IsNullOrWhiteSpace(BatchJobId))
    {
      throw new ArgumentException("BatchJobId is required.", nameof(BatchJobId));
    }

    if (string.IsNullOrWhiteSpace(RequestId))
    {
      throw new ArgumentException("RequestId is required.", nameof(RequestId));
    }

    if (CountyId == Guid.Empty)
    {
      throw new ArgumentException("CountyId is required.", nameof(CountyId));
    }

    if (string.IsNullOrWhiteSpace(Status))
    {
      throw new ArgumentException("Status is required.", nameof(Status));
    }
  }
}
