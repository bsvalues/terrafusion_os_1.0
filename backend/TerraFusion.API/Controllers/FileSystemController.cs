using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Text.Json;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FileSystemController : ControllerBase
{
    private readonly ILogger<FileSystemController> _logger;
    private readonly string _rootPath;

    public FileSystemController(ILogger<FileSystemController> logger, IConfiguration configuration)
    {
        _logger = logger;
        _rootPath = configuration["FileSystem:RootPath"] ?? Environment.CurrentDirectory;
    }

    [HttpGet("browse")]
    public async Task<IActionResult> BrowseDirectory([FromQuery] string path)
    {
        try
        {
            var fullPath = GetSafePath(path);
            if (!Directory.Exists(fullPath))
            {
                return NotFound(new { error = "Directory not found" });
            }

            var files = new List<object>();

            // Get directories
            var directories = Directory.GetDirectories(fullPath);
            foreach (var dir in directories)
            {
                var dirInfo = new DirectoryInfo(dir);
                files.Add(new
                {
                    name = dirInfo.Name,
                    path = GetRelativePath(dir),
                    type = "directory",
                    size = 0,
                    modified = dirInfo.LastWriteTime
                });
            }

            // Get files
            var fileEntries = Directory.GetFiles(fullPath);
            foreach (var file in fileEntries)
            {
                var fileInfo = new FileInfo(file);
                files.Add(new
                {
                    name = fileInfo.Name,
                    path = GetRelativePath(file),
                    type = "file",
                    size = fileInfo.Length,
                    modified = fileInfo.LastWriteTime
                });
            }

            return Ok(new { files });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error browsing directory: {Path}", path);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpGet("read")]
    public async Task<IActionResult> ReadFile([FromQuery] string path)
    {
        try
        {
            var fullPath = GetSafePath(path);
            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound(new { error = "File not found" });
            }

            var content = await System.IO.File.ReadAllTextAsync(fullPath);
            return Ok(new { content, path = GetRelativePath(fullPath) });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading file: {Path}", path);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("write")]
    public async Task<IActionResult> WriteFile([FromBody] WriteFileRequest request)
    {
        try
        {
            var fullPath = GetSafePath(request.Path);
            var directory = Path.GetDirectoryName(fullPath);

            if (directory != null && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            await System.IO.File.WriteAllTextAsync(fullPath, request.Content);
            return Ok(new { success = true, path = GetRelativePath(fullPath) });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing file: {Path}", request.Path);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpDelete("delete")]
    public IActionResult DeleteFile([FromQuery] string path)
    {
        try
        {
            var fullPath = GetSafePath(path);

            if (System.IO.File.Exists(fullPath))
            {
                System.IO.File.Delete(fullPath);
                return Ok(new { success = true });
            }
            else if (Directory.Exists(fullPath))
            {
                Directory.Delete(fullPath, recursive: true);
                return Ok(new { success = true });
            }

            return NotFound(new { error = "File or directory not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting: {Path}", path);
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private string GetSafePath(string requestPath)
    {
        if (string.IsNullOrWhiteSpace(requestPath))
        {
            return _rootPath;
        }

        var fullPath = Path.GetFullPath(Path.Combine(_rootPath, requestPath));

        // Security: Ensure path is within root
        if (!fullPath.StartsWith(_rootPath, StringComparison.OrdinalIgnoreCase))
        {
            throw new UnauthorizedAccessException("Access denied");
        }

        return fullPath;
    }

    private string GetRelativePath(string fullPath)
    {
        return Path.GetRelativePath(_rootPath, fullPath);
    }
}

public class WriteFileRequest
{
    public string Path { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}
