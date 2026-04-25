using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TerraFusion.API.Controllers
{
    /// <summary>
    /// DataImport Controller — file upload and import history stubs.
    /// Full PACS sync wiring is Post-R1; these endpoints return empty collections
    /// so the DataImportPage renders without errors.
    /// </summary>
    [ApiController]
    [AllowAnonymous]
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
            return Ok(new { files = Array.Empty<object>(), total = 0 });
        }

        /// <summary>DELETE /api/files/{fileId} — delete an uploaded file.</summary>
        [HttpDelete("api/files/{fileId}")]
        public IActionResult DeleteFile(string fileId)
        {
            return Ok(new { deleted = true, fileId });
        }

        /// <summary>GET /api/import-history — list completed imports.</summary>
        [HttpGet("api/import-history")]
        public IActionResult GetImportHistory()
        {
            return Ok(new { history = Array.Empty<object>(), total = 0 });
        }

        /// <summary>POST /api/upload — accept a file upload (stubbed).</summary>
        [HttpPost("api/upload")]
        public IActionResult UploadFile()
        {
            return Ok(new { fileId = Guid.NewGuid(), status = "pending", message = "PACS sync wiring is Post-R1; file queued for future processing." });
        }

        /// <summary>GET /api/preview-import/{fileId} — preview import rows.</summary>
        [HttpGet("api/preview-import/{fileId}")]
        public IActionResult PreviewImport(string fileId)
        {
            return Ok(new { fileId, rows = Array.Empty<object>(), count = 0 });
        }

        /// <summary>POST /api/import — run import from uploaded file.</summary>
        [HttpPost("api/import")]
        public IActionResult RunImport([FromBody] object? request)
        {
            return Ok(new { status = "queued", message = "PACS sync wiring is Post-R1; import queued." });
        }
    }
}
