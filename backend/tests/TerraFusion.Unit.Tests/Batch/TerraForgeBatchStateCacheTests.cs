using FluentAssertions;
using Moq;
using TerraFusion.Core.Services;
using TerraFusion.Core.Services.Batch;
using ValuationPipelineEntity = TerraFusion.Core.Entities.ValuationPipeline;
using Xunit;

namespace TerraFusion.Unit.Tests.Batch;

public sealed class TerraForgeBatchStateCacheTests
{
  [Fact]
  public async Task SaveAsync_WritesCountyScopedBatchStateWithTtl()
  {
    var countyId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    var redis = new Mock<IRedisCacheService>(MockBehavior.Strict);
    string? capturedKey = null;
    TerraForgeBatchJobState? capturedState = null;
    TimeSpan? capturedTtl = null;

    redis
      .Setup(cache => cache.SetAsync(
        It.IsAny<string>(),
        It.IsAny<TerraForgeBatchJobState>(),
        It.IsAny<TimeSpan?>()))
      .Callback<string, TerraForgeBatchJobState, TimeSpan?>((key, state, ttl) =>
      {
        capturedKey = key;
        capturedState = state;
        capturedTtl = ttl;
      })
      .Returns(Task.CompletedTask);

    var service = new TerraForgeBatchStateCache(redis.Object);
    var state = new TerraForgeBatchJobState(
      "42",
      "req-1",
      countyId,
      "running",
      100,
      12,
      1,
      DateTimeOffset.UtcNow,
      null);

    await service.SaveAsync(state);

    capturedKey.Should().Be($"terraforge:batch:{countyId:N}:42:state");
    capturedState.Should().BeEquivalentTo(state);
    capturedTtl.Should().Be(TimeSpan.FromHours(6));
    redis.VerifyAll();
  }

  [Fact]
  public async Task TrySetIdempotencyAsync_WritesCountyAndRequestScopedKeyWithTtl()
  {
    var countyId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    var redis = new Mock<IRedisCacheService>(MockBehavior.Strict);
    string? capturedKey = null;
    string? capturedJobId = null;
    TimeSpan? capturedTtl = null;

    redis
      .Setup(cache => cache.SetIfNotExistsAsync(
        It.IsAny<string>(),
        It.IsAny<string>(),
        It.IsAny<TimeSpan?>()))
      .Callback<string, string, TimeSpan?>((key, jobId, ttl) =>
      {
        capturedKey = key;
        capturedJobId = jobId;
        capturedTtl = ttl;
      })
      .ReturnsAsync(true);

    var service = new TerraForgeBatchStateCache(redis.Object);

    var result = await service.TrySetIdempotencyAsync(countyId, "REQ/ABC 123", "77");

    result.Should().BeTrue();
    capturedKey.Should().Be($"terraforge:batch:{countyId:N}:request:req-abc-123:idempotency");
    capturedJobId.Should().Be("77");
    capturedTtl.Should().Be(TimeSpan.FromHours(6));
    redis.VerifyAll();
  }

  [Fact]
  public async Task RedisAbsentFallback_ReturnsNoStateAndDoesNotThrow()
  {
    var countyId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    var service = new TerraForgeBatchStateCache(new NoOpRedisCacheService());

    var state = new TerraForgeBatchJobState(
      "99",
      "req-99",
      countyId,
      "running",
      10,
      0,
      0,
      DateTimeOffset.UtcNow,
      null);

    await service.SaveAsync(state);
    var cachedState = await service.GetAsync(countyId, "99");
    var idempotencyWritten = await service.TrySetIdempotencyAsync(countyId, "req-99", "99");
    var cachedJobId = await service.GetIdempotencyAsync(countyId, "req-99");

    cachedState.Should().BeNull();
    idempotencyWritten.Should().BeFalse();
    cachedJobId.Should().BeNull();
  }

  [Fact]
  public void FromPipeline_PreservesDbAuthoritativeStatusAndCounts()
  {
    var countyId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    var pipeline = new ValuationPipelineEntity
    {
      Id = 123,
      CountyId = countyId,
      Status = "completed",
      TotalParcels = 500,
      CompletedParcels = 490,
      FailedParcels = 10,
      Errors = "10 parcels missing explicit reval area",
    };

    var state = TerraForgeBatchJobState.FromPipeline(pipeline, "request-123");

    state.BatchJobId.Should().Be("123");
    state.RequestId.Should().Be("request-123");
    state.CountyId.Should().Be(countyId);
    state.Status.Should().Be("completed");
    state.TotalParcels.Should().Be(500);
    state.CompletedParcels.Should().Be(490);
    state.FailedParcels.Should().Be(10);
    state.Error.Should().Be("10 parcels missing explicit reval area");
  }
}
