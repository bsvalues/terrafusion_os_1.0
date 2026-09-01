using System.Buffers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using TerraFusion.API.Auth;
using TerraFusion.Core.Counties;
using TerraFusion.Core.Import;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// DataImport Controller — authenticated in-memory CSV admission plus existing import stubs.
    /// Durable staging, promotion, rollback, and PACS synchronization remain later work.
    /// </summary>
    [ApiController]
    [Produces("application/json")]
    public class DataImportController : ControllerBase
    {
        public const string UploadContractId =
            "wal.county-upload.authenticated-csv-api-admission.v1";

        public const long MaximumUploadBytes = 10L * 1024L * 1024L;
        public const long MaximumMultipartBodyBytes = MaximumUploadBytes + (64L * 1024L);

        private const int MaximumDataRows = 100_000;
        private const int MaximumFieldsPerRow = 512;
        private const int MaximumCharactersPerField = 65_536;
        private const int DuplicateDecisionCapacity = 4_096;
        private const string DuplicateDecisionCacheKey =
            "wal.county-upload.authenticated-csv-api-admission.v1/duplicate-decision";

        private readonly ILogger<DataImportController> _logger;
        private readonly AuthenticatedCanonicalCountyContextProvider _countyContextProvider;
        private readonly CountyCsvCountyBoundIntake _countyBoundIntake;
        private readonly CountyCsvIntakeDuplicateDecision _duplicateDecision;

        public DataImportController(
            ILogger<DataImportController> logger,
            AuthenticatedCanonicalCountyContextProvider countyContextProvider,
            IMemoryCache memoryCache)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _countyContextProvider = countyContextProvider
                ?? throw new ArgumentNullException(nameof(countyContextProvider));
            ArgumentNullException.ThrowIfNull(memoryCache);

            _countyBoundIntake = new CountyCsvCountyBoundIntake(
                new CountyCsvParserOptions
                {
                    Delimiter = ',',
                    MaxInputBytes = MaximumUploadBytes,
                    MaxDataRows = MaximumDataRows,
                    MaxFieldsPerRow = MaximumFieldsPerRow,
                    MaxCharactersPerField = MaximumCharactersPerField,
                });
            lock (memoryCache)
            {
                _duplicateDecision = memoryCache.GetOrCreate(
                        DuplicateDecisionCacheKey,
                        entry =>
                        {
                            entry.Priority = CacheItemPriority.NeverRemove;
                            return new CountyCsvIntakeDuplicateDecision(DuplicateDecisionCapacity);
                        })
                    ?? throw new InvalidOperationException(
                        "County CSV duplicate-decision state could not be initialized.");
            }
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

        /// <summary>POST /api/upload — admit one assessor-authorized county CSV in memory.</summary>
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
                var duplicateDecision = _duplicateDecision.Decide(identity);

                if (duplicateDecision.Disposition == CountyCsvIntakeDuplicateDisposition.Denied)
                {
                    _logger.LogWarning(
                        "County CSV admission duplicate decision denied with code {DenialCode}.",
                        duplicateDecision.DenialCode);
                    return AdmissionDenied(
                        StatusCodes.Status409Conflict,
                        "CSV_DUPLICATE_DECISION_DENIED");
                }

                return Ok(
                    new CountyCsvApiAdmissionReceipt(
                        UploadContractId,
                        countyContext.CountyId.Value,
                        countyContext.County.Key,
                        countyContext.County.Name,
                        countyDataset.ToString(),
                        identity.Content.Sha256,
                        identity.Content.ByteLength,
                        intakeReceipt.IntakeReceipt.Document.Rows.Count,
                        duplicateDecision.Disposition.ToString()));
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
        Guid CountyId,
        string CountyKey,
        string CountyName,
        string Dataset,
        string ContentSha256,
        long ContentLength,
        int AcceptedRowCount,
        string DuplicateDisposition);
}
