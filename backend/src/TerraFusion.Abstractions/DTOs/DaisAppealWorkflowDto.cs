using System.Text.Json.Serialization;

namespace TerraFusion.Abstractions.DTOs;

public sealed record DaisAppealWorkflowReadRequest
{
  public required string SchemaVersion { get; init; }
  public required string CountyId { get; init; }
  public required DaisAppealSelector Selector { get; init; }
  public string? TraceId { get; init; }
}

public sealed record DaisAppealSelector
{
  public string? AppealId { get; init; }
  public string? ParcelId { get; init; }
  public int? TaxYear { get; init; }
}

public sealed record DaisAppealWorkflowReadResult
{
  public required string SchemaVersion { get; init; }
  public required string CountyId { get; init; }
  public required IReadOnlyList<DaisAppealWorkflowRecord> Appeals { get; init; }
  public string? TraceId { get; init; }
}

public sealed record DaisAppealWorkflowRecord
{
  public required string AppealId { get; init; }
  public required string ParcelId { get; init; }
  public required int TaxYear { get; init; }
  public required DaisAppealGround Ground { get; init; }
  public required DaisAppealStatus Status { get; init; }
  public required DateTimeOffset FiledAt { get; init; }
  public DateTimeOffset? HearingAt { get; init; }
  public DateTimeOffset? DecisionAt { get; init; }
}

[JsonConverter(typeof(JsonStringEnumConverter<DaisAppealGround>))]
public enum DaisAppealGround
{
  MARKET_VALUE,
  UNIFORMITY,
  CLASSIFICATION,
  EXEMPTION_DENIAL,
  CLERICAL_ERROR,
}

[JsonConverter(typeof(JsonStringEnumConverter<DaisAppealStatus>))]
public enum DaisAppealStatus
{
  filed,
  scheduled,
  heard,
  decided,
  withdrawn,
}
