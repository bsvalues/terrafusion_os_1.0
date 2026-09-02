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
}

/// <summary>
/// Receipt-shaped evidence accepted by the durable ledger. Every predecessor value is revalidated;
/// supplying this request grants no authority and does not prove that a predecessor issued it.
/// </summary>
public sealed record CountyCsvUploadAdmissionRequest(
    string ApiAdmissionContractId,
    AuthenticatedCanonicalCountyContextResult? CountyContext,
    CountyCsvCountyBoundIntakeReceipt? IntakeReceipt,
    CountyCsvIntakeIdempotencyIdentity? Identity);

public sealed record CountyCsvUploadAdmissionResult(
    string ContractId,
    CountyCsvUploadAdmissionDisposition Disposition,
    CountyCsvUploadAdmissionDenialCode DenialCode,
    CountyCsvUploadBatch? Batch);

/// <summary>
/// Durable upload-only contract <c>wal.county-upload.durable-admission-ledger.v1</c>. Implementations
/// must atomically converge the same idempotency identity on one immutable persisted batch.
/// </summary>
public interface ICountyCsvUploadAdmissionLedger
{
  public const string ContractId = "wal.county-upload.durable-admission-ledger.v1";

  public const string AuthenticatedCsvApiAdmissionContractId =
      "wal.county-upload.authenticated-csv-api-admission.v1";

  Task<CountyCsvUploadAdmissionResult> AdmitAsync(
      CountyCsvUploadAdmissionRequest? request,
      CancellationToken cancellationToken = default);
}
