using TerraFusion.Core.Counties;
using TerraFusion.Core.Entities.Import;

namespace TerraFusion.Core.Import;

public enum CountyCsvUploadAdmissionDisposition
{
  FirstSeen = 1,
  Duplicate = 2,
  Denied = 3,
}

public enum CountyCsvUploadAdmissionDenialCode
{
  None = 0,
  InvalidApiContract = 1,
  InvalidCountyContext = 2,
  InvalidActor = 3,
  NonCanonicalCounty = 4,
  CountyMismatch = 5,
  InvalidReceipt = 6,
  UnsupportedDataset = 7,
  InvalidBindingPosture = 8,
  InvalidDeclaration = 9,
  InvalidContentEvidence = 10,
  InvalidDocumentEvidence = 11,
  InvalidIdentity = 12,
  IdempotencyKeyMismatch = 13,
  KeyCollision = 14,
  InvalidRowSchema = 15,
}

/// <summary>
/// Receipt-shaped evidence accepted by the durable ledger. Every predecessor value is revalidated;
/// supplying this request grants no authority and does not prove that a predecessor issued it.
/// </summary>
public sealed record CountyCsvUploadAdmissionRequest(
    string ApiAdmissionContractId,
    AuthenticatedCanonicalCountyContextResult? CountyContext,
    CountyCsvCountyBoundIntakeReceipt? IntakeReceipt,
    ReadOnlyMemory<byte> AdmittedContent,
    CountyCsvIntakeIdempotencyIdentity? Identity);

public sealed record CountyCsvUploadAdmissionResult(
    string ContractId,
    CountyCsvUploadAdmissionDisposition Disposition,
    CountyCsvUploadAdmissionDenialCode DenialCode,
    CountyCsvUploadBatch? Batch,
    CountyCsvUploadRowStagingSummary? RowStaging = null);

/// <summary>
/// Durable upload-only contract <c>wal.county-upload.durable-admission-ledger.v1</c>. Implementations
/// must atomically converge the same idempotency identity on one immutable persisted batch.
/// </summary>
public interface ICountyCsvUploadAdmissionLedger
{
  public const string ContractId = "wal.county-upload.durable-admission-ledger.v1";

  public const string AuthenticatedCsvApiAdmissionContractId =
      "wal.county-upload.authenticated-csv-api-admission.v1";

  // The protected predecessor API admits at most 10 MiB. Receipt-shaped values reconstructed
  // outside that boundary must not be able to widen its authority at the durable ledger.
  public const long MaximumAuthenticatedCsvUploadBytes = 10L * 1024L * 1024L;

  Task<CountyCsvUploadAdmissionResult> AdmitAsync(
      CountyCsvUploadAdmissionRequest? request,
      CancellationToken cancellationToken = default);
}

/// <summary>
/// County-scoped, metadata-only view of a durable upload admission. The source bytes and row
/// values are intentionally absent; this surface does not imply staging or promotion.
/// </summary>
public sealed record CountyCsvUploadBatchSummary(
    Guid BatchId,
    Guid CountyId,
    string Dataset,
    string SourceFileName,
    string ContentSha256,
    long ContentByteLength,
    int AcceptedRowCount,
    string Status,
    DateTimeOffset ReceivedAtUtc,
    CountyCsvUploadRowStagingSummary? RowStaging = null);

/// <summary>
/// Reads recent durable admissions only for the authenticated county ID supplied by the protected
/// API boundary. Implementations must never return another county's batches.
/// </summary>
public interface ICountyCsvUploadHistoryReader
{
  Task<IReadOnlyList<CountyCsvUploadBatchSummary>> ListRecentAsync(
      Guid countyId,
      int limit,
      CancellationToken cancellationToken = default);
}
