namespace TerraFusion.Abstractions.DTOs;

public sealed record DossierEvidenceRegistryReadRequest
{
  public required string SchemaVersion { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public required int Limit { get; init; }
  public required int Offset { get; init; }
  public string? TraceId { get; init; }
}

public sealed record DossierEvidenceRegistryReadResult
{
  public required string SchemaVersion { get; init; }
  public required string CountyId { get; init; }
  public required string ParcelId { get; init; }
  public required IReadOnlyList<DossierEvidenceRegistryRecord> Results { get; init; }
  public required int Total { get; init; }
  public required bool HasMore { get; init; }
  public required int Limit { get; init; }
  public required int Offset { get; init; }
  public string? TraceId { get; init; }
}

public sealed record DossierEvidenceRegistryRecord
{
  public required string EvidenceId { get; init; }
  public required string EvidenceType { get; init; }
  public required string Integrity { get; init; }
  public required DateTimeOffset CreatedAt { get; init; }
  public string? DocumentId { get; init; }
}
