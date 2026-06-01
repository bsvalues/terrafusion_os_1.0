using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// DataImport Controller — reports import storage/runtime availability.
    /// Import execution is unavailable until a governed import backend is configured.
    /// </summary>
    [ApiController]
    [Authorize]
    [Produces("application/json")]
    public class DataImportController : ControllerBase
    {
        private readonly ILogger<DataImportController> _logger;

        public DataImportController(ILogger<DataImportController> logger)
        {
            _logger = logger;
        }

        /// <summary>GET /api/files — list uploaded import files.</summary>
        [HttpGet("api/files")]
        public IActionResult GetFiles()
        {
            return Ok(new
            {
                files = Array.Empty<object>(),
                total = 0,
                configured = false,
                code = "DATA_IMPORT_STORAGE_UNCONFIGURED",
                generated = false,
            });
        }

        /// <summary>DELETE /api/files/{fileId} — delete an uploaded file.</summary>
        [HttpDelete("api/files/{fileId}")]
        public IActionResult DeleteFile(string fileId)
        {
            return ImportUnavailable("delete-file", fileId);
        }

        /// <summary>GET /api/import-history — list completed imports.</summary>
        [HttpGet("api/import-history")]
        public IActionResult GetImportHistory()
        {
            return Ok(new
            {
                history = Array.Empty<object>(),
                total = 0,
                configured = false,
                code = "DATA_IMPORT_STORAGE_UNCONFIGURED",
                generated = false,
            });
        }

        /// <summary>POST /api/upload — reports import upload availability.</summary>
        [HttpPost("api/upload")]
        public IActionResult UploadFile()
        {
            return ImportUnavailable("upload");
        }

        /// <summary>GET /api/preview-import/{fileId} — preview import rows.</summary>
        [HttpGet("api/preview-import/{fileId}")]
        public IActionResult PreviewImport(string fileId)
        {
            return ImportUnavailable("preview-import", fileId);
        }

        /// <summary>POST /api/import — run import from uploaded file.</summary>
        [HttpPost("api/import")]
        public IActionResult RunImport([FromBody] object? request)
        {
            return ImportUnavailable("run-import");
        }

        private IActionResult ImportUnavailable(string operation, string? fileId = null)
        {
            _logger.LogWarning("Data import operation {Operation} requested, but no governed import backend is configured.", operation);

            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                success = false,
                code = "DATA_IMPORT_UNAVAILABLE",
                message = "Data import is not configured for governed runtime execution in this environment.",
                operation,
                fileId,
                generated = false,
            });
        }
    }
}
