using TerraFusion.Core.Import;

namespace TerraFusion.Core.Entities.Import;

/// <summary>
/// Immutable durable admission record for one county-scoped CSV artifact. It is an upload ledger
/// only: it contains no bytes, staging rows, mappings, promotion state, or external-system handle.
/// </summary>
public sealed class CountyCsvUploadBatch
{
  public const string AdmittedStatus = "Admitted";

  private CountyCsvUploadBatch()
  {
  }

  public CountyCsvUploadBatch(
      Guid batchId,
      Guid countyId,
      string actorId,
      CountyCsvDataset dataset,
      string sourceFileName,
      string format,
      string mediaType,
      string contentSha256,
      long contentByteLength,
      int acceptedRowCount,
      string idempotencyKey,
      string apiAdmissionContractId,
      string countyContextContractId,
      string countyBoundIntakeContractId,
      string envelopeContractId,
      string parserContractId,
      string idempotencyContractId,
      string ledgerContractId,
      DateTimeOffset receivedAtUtc)
  {
    if (batchId == Guid.Empty)
    {
      throw new ArgumentException("Batch ID must be non-empty.", nameof(batchId));
    }

    if (countyId == Guid.Empty)
    {
      throw new ArgumentException("County ID must be non-empty.", nameof(countyId));
    }

    if (dataset is not CountyCsvDataset.Parcels and not CountyCsvDataset.Sales)
    {
      throw new ArgumentOutOfRangeException(nameof(dataset));
    }

    if (contentByteLength <= 0 || contentByteLength > int.MaxValue)
    {
      throw new ArgumentOutOfRangeException(nameof(contentByteLength));
    }

    if (acceptedRowCount < 0)
    {
      throw new ArgumentOutOfRangeException(nameof(acceptedRowCount));
    }

    if (receivedAtUtc.Offset != TimeSpan.Zero)
    {
      throw new ArgumentException("Received time must be UTC.", nameof(receivedAtUtc));
    }

    BatchId = batchId;
    CountyId = countyId;
    ActorId = Required(actorId, 200, nameof(actorId));
    Dataset = dataset.ToString();
    SourceFileName = Required(sourceFileName, 255, nameof(sourceFileName));
    Format = Required(format, 16, nameof(format));
    MediaType = Required(mediaType, 64, nameof(mediaType));
    ContentSha256 = LowercaseSha256(contentSha256, nameof(contentSha256));
    ContentByteLength = contentByteLength;
    AcceptedRowCount = acceptedRowCount;
    IdempotencyKey = LowercaseSha256(idempotencyKey, nameof(idempotencyKey));
    ApiAdmissionContractId = Required(apiAdmissionContractId, 128, nameof(apiAdmissionContractId));
    CountyContextContractId = Required(countyContextContractId, 128, nameof(countyContextContractId));
    CountyBoundIntakeContractId = Required(
        countyBoundIntakeContractId,
        128,
        nameof(countyBoundIntakeContractId));
    EnvelopeContractId = Required(envelopeContractId, 128, nameof(envelopeContractId));
    ParserContractId = Required(parserContractId, 128, nameof(parserContractId));
    IdempotencyContractId = Required(
        idempotencyContractId,
        128,
        nameof(idempotencyContractId));
    LedgerContractId = Required(ledgerContractId, 128, nameof(ledgerContractId));
    Status = AdmittedStatus;
    ReceivedAtUtc = receivedAtUtc;
  }

  public Guid BatchId { get; private set; }

  public Guid CountyId { get; private set; }

  public string ActorId { get; private set; } = null!;

  public string Dataset { get; private set; } = null!;

  public string SourceFileName { get; private set; } = null!;

  public string Format { get; private set; } = null!;

  public string MediaType { get; private set; } = null!;

  public string ContentSha256 { get; private set; } = null!;

  public long ContentByteLength { get; private set; }

  public int AcceptedRowCount { get; private set; }

  public string IdempotencyKey { get; private set; } = null!;

  public string ApiAdmissionContractId { get; private set; } = null!;

  public string CountyContextContractId { get; private set; } = null!;

  public string CountyBoundIntakeContractId { get; private set; } = null!;

  public string EnvelopeContractId { get; private set; } = null!;

  public string ParserContractId { get; private set; } = null!;

  public string IdempotencyContractId { get; private set; } = null!;

  public string LedgerContractId { get; private set; } = null!;

  public string Status { get; private set; } = null!;

  public DateTimeOffset ReceivedAtUtc { get; private set; }

  private static string Required(string? value, int maximumLength, string parameterName)
  {
    if (string.IsNullOrWhiteSpace(value)
        || value.Length > maximumLength
        || value.Any(char.IsControl)
        || !string.Equals(value, value.Trim(), StringComparison.Ordinal))
    {
      throw new ArgumentException("A bounded non-whitespace value is required.", parameterName);
    }

    return value;
  }

  private static string LowercaseSha256(string? value, string parameterName)
  {
    if (value is not { Length: 64 }
        || value.Any(character =>
          character is not (>= '0' and <= '9' or >= 'a' and <= 'f')))
    {
      throw new ArgumentException("Value must be a lowercase SHA-256 token.", parameterName);
    }

    return value;
  }
}
