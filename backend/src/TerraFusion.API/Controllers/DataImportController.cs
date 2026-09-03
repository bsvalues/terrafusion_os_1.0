using System.Buffers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Import;
using TerraFusion.Core.Interfaces;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// Authenticated durable CSV admission and county-scoped normalized row validation/staging.
    /// Promotion, rollback, and PACS synchronization remain later work.
    /// </summary>
    [ApiController]
    [Produces("application/json")]
    public class DataImportController : ControllerBase
    {
        public const string UploadContractId =
            "wal.county-upload.authenticated-row-staging-api.v1";

        public const long MaximumUploadBytes = 10L * 1024L * 1024L;
        public const long MaximumMultipartBodyBytes = MaximumUploadBytes + (64L * 1024L);

        private const int MaximumDataRows = 100_000;
        private const int MaximumFieldsPerRow = 512;
        private const int MaximumCharactersPerField = 65_536;
        private readonly ILogger<DataImportController> _logger;
        private readonly AuthenticatedCanonicalCountyContextProvider _countyContextProvider;
        private readonly CountyCsvCountyBoundIntake _countyBoundIntake;
        private readonly ICountyCsvUploadAdmissionLedger _admissionLedger;
        private readonly ICountyCsvUploadHistoryReader _historyReader;
        private readonly ICountyCsvUploadRowStager _rowStager;

        public DataImportController(
            ILogger<DataImportController> logger,
            AuthenticatedCanonicalCountyContextProvider countyContextProvider,
            ICountyCsvUploadAdmissionLedger admissionLedger,
            ICountyCsvUploadHistoryReader historyReader,
            ICountyCsvUploadRowStager rowStager)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _countyContextProvider = countyContextProvider
                ?? throw new ArgumentNullException(nameof(countyContextProvider));
            _admissionLedger = admissionLedger
                ?? throw new ArgumentNullException(nameof(admissionLedger));
            _historyReader = historyReader
                ?? throw new ArgumentNullException(nameof(historyReader));
            _rowStager = rowStager ?? throw new ArgumentNullException(nameof(rowStager));

            _countyBoundIntake = new CountyCsvCountyBoundIntake(
                new CountyCsvParserOptions
                {
                    Delimiter = ',',
                    MaxInputBytes = MaximumUploadBytes,
                    MaxDataRows = MaximumDataRows,
                    MaxFieldsPerRow = MaximumFieldsPerRow,
                    MaxCharactersPerField = MaximumCharactersPerField,
                });
        }

        /// <summary>GET /api/files — list uploaded import files.</summary>
        [HttpGet("api/files")]
        [AllowAnonymous]
        public IActionResult GetFiles()
        {
            return Ok(new { files = Array.Empty<object>(), total = 0 });
        }

        /// <summary>DELETE /api/files/{fileId} — delete an uploaded file.</summary>
        [HttpDelete("api/files/{fileId}")]
        [AllowAnonymous]
        public IActionResult DeleteFile(string fileId)
        {
            return Ok(new { deleted = true, fileId });
        }

        /// <summary>GET /api/import-history — list completed imports.</summary>
        [HttpGet("api/import-history")]
        [AllowAnonymous]
        public IActionResult GetImportHistory()
        {
            return Ok(new { history = Array.Empty<object>(), total = 0 });
        }

        /// <summary>POST /api/upload — durably admit one assessor-authorized county CSV.</summary>
        [HttpPost("api/upload")]
        [Authorize(Policy = "RequireAssessor")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(MaximumMultipartBodyBytes)]
        [RequestFormLimits(MultipartBodyLengthLimit = MaximumMultipartBodyBytes)]
        public async Task<IActionResult> UploadFile(
            [FromForm] IFormFile? file,
            [FromForm] string? dataset,
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();

            var countyContext = await _countyContextProvider
                .GetCurrentAsync(cancellationToken)
                .ConfigureAwait(false);
            if (countyContext.Decision != AuthenticatedCanonicalCountyContextDecision.Established
                || countyContext.County is null
                || countyContext.CountyId is null)
            {
                return Forbid();
            }

            if (Request.HasFormContentType)
            {
                IFormCollection form;
                try
                {
                    form = await Request
                        .ReadFormAsync(cancellationToken)
                        .ConfigureAwait(false);
                }
                catch (OperationCanceledException)
                {
                    throw;
                }
                catch (Exception exception) when (exception is InvalidDataException or IOException)
                {
                    _logger.LogWarning(
                        "County CSV admission refused malformed multipart input at {Boundary}.",
                        exception.GetType().Name);
                    return AdmissionDenied(
                        StatusCodes.Status400BadRequest,
                        "CSV_MULTIPART_SHAPE_INVALID");
                }

                if (form.Files.Count != 1
                    || form["dataset"].Count != 1
                    || !ReferenceEquals(form.Files[0], file)
                    || !string.Equals(form["dataset"][0], dataset, StringComparison.Ordinal))
                {
                    return AdmissionDenied(
                        StatusCodes.Status400BadRequest,
                        "CSV_MULTIPART_SHAPE_INVALID");
                }
            }

            if (!TryParseDataset(dataset, out var countyDataset))
            {
                return AdmissionDenied(
                    StatusCodes.Status400BadRequest,
                    "CSV_DATASET_UNSUPPORTED");
            }

            if (file is null || file.Length <= 0)
            {
                return AdmissionDenied(
                    StatusCodes.Status400BadRequest,
                    "CSV_FILE_REQUIRED");
            }

            if (file.Length > MaximumUploadBytes)
            {
                return AdmissionDenied(
                    StatusCodes.Status413PayloadTooLarge,
                    "CSV_UPLOAD_TOO_LARGE");
            }

            try
            {
                var content = await ReadBoundedAsync(file, cancellationToken)
                    .ConfigureAwait(false);
                var intakeReceipt = await _countyBoundIntake
                    .AdmitAsync(
                        new CountyCsvCountyBoundIntakeRequest(
                            countyContext.County,
                            countyContext.County,
                            countyDataset,
                            new CountyCsvIntakeDeclaration
                            {
                                FileName = file.FileName,
                                Format = "csv",
                                MediaType = file.ContentType,
                            },
                            content),
                        cancellationToken)
                    .ConfigureAwait(false);
                var identity = CountyCsvIntakeIdempotency.Create(intakeReceipt);
                var durableAdmission = await _admissionLedger
                    .AdmitAsync(
                        new CountyCsvUploadAdmissionRequest(
                            ICountyCsvUploadAdmissionLedger.AuthenticatedCsvApiAdmissionContractId,
                            countyContext,
                            intakeReceipt,
                            content,
                            identity),
                        cancellationToken)
                    .ConfigureAwait(false);

                if (durableAdmission.Disposition == CountyCsvUploadAdmissionDisposition.Denied
                    || durableAdmission.Batch is null)
                {
                    _logger.LogWarning(
                        "County CSV durable admission denied with code {DenialCode}.",
                        durableAdmission.DenialCode);
                    return AdmissionDenied(
                        StatusCodes.Status409Conflict,
                        "CSV_DURABLE_ADMISSION_DENIED");
                }

                var batch = durableAdmission.Batch;
                var staging = await _rowStager.StageAsync(
                        new CountyCsvUploadRowStagingRequest(
                            countyContext,
                            batch,
                            intakeReceipt.IntakeReceipt.Document),
                        cancellationToken)
                    .ConfigureAwait(false);
                return Ok(
                    new CountyCsvApiAdmissionReceipt(
                        UploadContractId,
                        durableAdmission.ContractId,
                        batch.BatchId,
                        batch.CountyId,
                        countyContext.County.Key,
                        countyContext.County.Name,
                        batch.Dataset,
                        batch.ContentSha256,
                        batch.ContentByteLength,
                        batch.AcceptedRowCount,
                        durableAdmission.Disposition.ToString(),
                        staging.ContractId,
                        staging.SchemaVersion,
                        staging.StagedRowCount,
                        staging.QuarantinedRowCount,
                        staging.ReasonCounts));
            }
            catch (OperationCanceledException)
            {
                throw;
            }
            catch (Exception exception) when (IsRefusedInput(exception))
            {
                _logger.LogWarning(
                    "County CSV admission refused by {Boundary}.",
                    exception.GetType().Name);
                return AdmissionDenied(
                    StatusCodes.Status400BadRequest,
                    "CSV_ADMISSION_DENIED");
            }
        }

        /// <summary>
        /// GET /api/upload/history — list metadata for this authenticated county's durable
        /// admissions and validation summaries. Staged rows are not represented as promoted,
        /// published, or usable in TerraForge.
        /// </summary>
        [HttpGet("api/upload/history")]
        [Authorize(Policy = "RequireAssessor")]
        public async Task<IActionResult> GetCountyUploadHistory(
            CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var countyContext = await _countyContextProvider
                .GetCurrentAsync(cancellationToken)
                .ConfigureAwait(false);
            if (countyContext.Decision != AuthenticatedCanonicalCountyContextDecision.Established
                || countyContext.County is null
                || countyContext.CountyId is null)
            {
                return Forbid();
            }

            var batches = await _historyReader
                .ListRecentAsync(countyContext.CountyId.Value, 25, cancellationToken)
                .ConfigureAwait(false);

            return Ok(new CountyCsvUploadHistoryReceipt(
                UploadContractId,
                countyContext.CountyId.Value,
                countyContext.County.Key,
                countyContext.County.Name,
                "row-validation-staging-not-promoted",
                batches));
        }

        /// <summary>GET /api/preview-import/{fileId} — preview import rows.</summary>
        [HttpGet("api/preview-import/{fileId}")]
        [AllowAnonymous]
        public IActionResult PreviewImport(string fileId)
        {
            return Ok(new { fileId, rows = Array.Empty<object>(), count = 0 });
        }

        /// <summary>POST /api/import — run import from uploaded file.</summary>
        [HttpPost("api/import")]
        [AllowAnonymous]
        public IActionResult RunImport([FromBody] object? request)
        {
            return Ok(new { status = "queued", message = "PACS sync wiring is Post-R1; import queued." });
        }

        private static bool TryParseDataset(
            string? value,
            out CountyCsvDataset dataset)
        {
            dataset = value switch
            {
                nameof(CountyCsvDataset.Parcels) => CountyCsvDataset.Parcels,
                nameof(CountyCsvDataset.Sales) => CountyCsvDataset.Sales,
                _ => CountyCsvDataset.Unspecified,
            };

            return dataset != CountyCsvDataset.Unspecified;
        }

        private static async Task<ReadOnlyMemory<byte>> ReadBoundedAsync(
            IFormFile file,
            CancellationToken cancellationToken)
        {
            await using var input = file.OpenReadStream();
            using var output = new MemoryStream((int)file.Length);
            var buffer = ArrayPool<byte>.Shared.Rent(81_920);
            long totalBytes = 0;

            try
            {
                while (true)
                {
                    var bytesRead = await input
                        .ReadAsync(buffer.AsMemory(0, buffer.Length), cancellationToken)
                        .ConfigureAwait(false);
                    if (bytesRead == 0)
                    {
                        break;
                    }

                    totalBytes += bytesRead;
                    if (totalBytes > MaximumUploadBytes)
                    {
                        throw new CountyCsvParseException(
                            CountyCsvErrorCode.InputTooLarge,
                            "CSV upload exceeds the protected byte limit.");
                    }

                    await output
                        .WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken)
                        .ConfigureAwait(false);
                }
            }
            finally
            {
                ArrayPool<byte>.Shared.Return(buffer, clearArray: true);
            }

            if (totalBytes <= 0 || totalBytes != file.Length)
            {
                throw new InvalidDataException(
                    "CSV upload length does not match the multipart declaration.");
            }

            return output.ToArray();
        }

        private static bool IsRefusedInput(Exception exception) =>
            exception is CountyCsvParseException
                or CountyCsvIntakeException
                or CountyCsvCountyBoundIntakeException
                or CountyCsvIntakeIdempotencyException
                or InvalidDataException
                or IOException;

        private static ObjectResult AdmissionDenied(int statusCode, string code)
        {
            var problem = new ProblemDetails
            {
                Status = statusCode,
                Title = "County CSV admission denied.",
                Detail = "The request did not satisfy the authenticated county CSV admission contract.",
            };
            problem.Extensions["code"] = code;

            return new ObjectResult(problem)
            {
                StatusCode = statusCode,
            };
        }
    }

    public sealed record CountyCsvApiAdmissionReceipt(
        string ContractId,
        string LedgerContractId,
        Guid BatchId,
        Guid CountyId,
        string CountyKey,
        string CountyName,
        string Dataset,
        string ContentSha256,
        long ContentLength,
        int AcceptedRowCount,
        string DuplicateDisposition,
        string RowStagingContractId,
        string ValidationSchemaVersion,
        int StagedRowCount,
        int QuarantinedRowCount,
        IReadOnlyList<CountyCsvQuarantineReasonCount> QuarantineReasonCounts);

    public sealed record CountyCsvUploadHistoryReceipt(
        string ContractId,
        Guid CountyId,
        string CountyKey,
        string CountyName,
        string Availability,
        IReadOnlyList<CountyCsvUploadBatchSummary> Batches);
}
