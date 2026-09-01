using System.Text.Json.Serialization;

namespace TerraFusion.Abstractions.DTOs;

public sealed record DaisAppealCreateDecisionRequest
{
  public required string SchemaVersion { get; init; }
  public required DaisAppealMutationOperation Operation { get; init; }
  public required string CommandId { get; init; }
  public required string CountyId { get; init; }
  public required DateTimeOffset EffectiveAt { get; init; }
  public string? TraceId { get; init; }
  public required DaisAppealCreateDecisionCommand Command { get; init; }
}

public sealed record DaisAppealCreateDecisionCommand
{
  public string? Ground { get; init; }
  public int? TaxYear { get; init; }
}

public sealed record DaisAppealTransitionDecisionRequest
{
  public required string SchemaVersion { get; init; }
  public required DaisAppealMutationOperation Operation { get; init; }
  public required string CommandId { get; init; }
  public required string CountyId { get; init; }
  public required DateTimeOffset EffectiveAt { get; init; }
  public string? TraceId { get; init; }
  public required DaisAppealTransitionDecisionCommand Command { get; init; }
}

public sealed record DaisAppealTransitionDecisionCommand
{
  public required string AppealId { get; init; }
  public required DaisAppealLifecycleSnapshot Current { get; init; }
  public required DaisAppealTransitionRequest Requested { get; init; }
}

public sealed record DaisAppealLifecycleSnapshot
{
  public required string Status { get; init; }
  public required DateTimeOffset FiledAt { get; init; }
  public DateTimeOffset? HearingAt { get; init; }
  public DateTimeOffset? DecisionAt { get; init; }
}

public sealed record DaisAppealTransitionRequest
{
  public required string Status { get; init; }
  public required bool HasDecidedValue { get; init; }
}

public sealed record DaisAppealCreateMutation
{
  public required DaisAppealGround Ground { get; init; }
  public required DaisAppealStatus Status { get; init; }
  public required int TaxYear { get; init; }
  public required DateTimeOffset FiledAt { get; init; }
  public required DateTimeOffset UpdatedAt { get; init; }
}

public sealed record DaisAppealTransitionMutation
{
  public required DaisAppealStatus Status { get; init; }
  public required DateTimeOffset UpdatedAt { get; init; }
  public DateTimeOffset? DecisionAt { get; init; }
}

public sealed record DaisAppealCreateDecisionResult
{
  public required string SchemaVersion { get; init; }
  public required DaisAppealMutationOperation Operation { get; init; }
  public required string CommandId { get; init; }
  public required string CountyId { get; init; }
  public string? TraceId { get; init; }
  public required DaisAppealMutationDecision Decision { get; init; }
  public DaisAppealCreateMutation? Mutation { get; init; }
  public required IReadOnlyList<DaisAppealMutationViolation> Violations { get; init; }
}

public sealed record DaisAppealTransitionDecisionResult
{
  public required string SchemaVersion { get; init; }
  public required DaisAppealMutationOperation Operation { get; init; }
  public required string CommandId { get; init; }
  public required string CountyId { get; init; }
  public string? TraceId { get; init; }
  public required DaisAppealMutationDecision Decision { get; init; }
  public DaisAppealTransitionMutation? Mutation { get; init; }
  public required IReadOnlyList<DaisAppealMutationViolation> Violations { get; init; }
}

public sealed record DaisAppealMutationViolation
{
  public required DaisAppealMutationViolationCode Code { get; init; }
  public required string Message { get; init; }
}

[JsonConverter(typeof(JsonStringEnumConverter<DaisAppealMutationOperation>))]
public enum DaisAppealMutationOperation
{
  create,
  transition,
}

[JsonConverter(typeof(JsonStringEnumConverter<DaisAppealMutationDecision>))]
public enum DaisAppealMutationDecision
{
  accepted,
  rejected,
}

[JsonConverter(typeof(JsonStringEnumConverter<DaisAppealMutationViolationCode>))]
public enum DaisAppealMutationViolationCode
{
  INVALID_GROUND,
  INVALID_TAX_YEAR,
  INVALID_STATUS,
  INVALID_TRANSITION,
  INVALID_LIFECYCLE,
  IDENTITY_MISMATCH,
}
