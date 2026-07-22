namespace TerraFusion.Abstractions.DTOs;

public sealed record GptGroundedContextRequest
{
  public required string SchemaVersion { get; init; }
  public required string CountyId { get; init; }
  public required string DatasetKey { get; init; }
  public required string QueryText { get; init; }
  public required int TopK { get; init; }
  public required decimal ScoreThreshold { get; init; }
  public required string TraceId { get; init; }
}

public sealed record GptGroundedContextResult
{
  public required string SchemaVersion { get; init; }
  public required string CountyId { get; init; }
  public required string DatasetKey { get; init; }
  public required string Status { get; init; }
  public required IReadOnlyList<GptGroundedCitation> Citations { get; init; }
  public required string TraceId { get; init; }
  public string? DenialCode { get; init; }
}

public sealed record GptGroundedCitation
{
  public required string SourceId { get; init; }
  public required string ChunkId { get; init; }
  public required int ChunkIndex { get; init; }
  public required string Excerpt { get; init; }
  public required decimal Score { get; init; }
  public string? SourceTitle { get; init; }
}
