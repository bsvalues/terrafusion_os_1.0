using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text;
using System.Collections.Concurrent;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly ILogger<TasksController> _logger;
    private static readonly ConcurrentDictionary<string, Process> RunningTasks = new();

    public TasksController(ILogger<TasksController> logger)
    {
        _logger = logger;
    }

    [HttpGet("list")]
    public IActionResult ListTasks()
    {
        var tasks = new[]
        {
            new { name = "Build", command = "dotnet build", description = "Build the solution" },
            new { name = "Test", command = "dotnet test", description = "Run unit tests" },
            new { name = "Clean", command = "dotnet clean", description = "Clean build artifacts" },
            new { name = "Restore", command = "dotnet restore", description = "Restore NuGet packages" },
            new { name = "Format", command = "dotnet format", description = "Format code" },
            new { name = "Lint", command = "dotnet format --verify-no-changes", description = "Check code formatting" },
        };

        return Ok(new { tasks });
    }

    [HttpPost("run")]
    public async Task<IActionResult> RunTask([FromBody] RunTaskRequest request)
    {
        try
        {
            var taskCommand = GetTaskCommand(request.Task);
            if (string.IsNullOrEmpty(taskCommand))
            {
                return BadRequest(new { error = "Unknown task" });
            }

            Response.ContentType = "text/event-stream";

            var processInfo = new ProcessStartInfo
            {
                FileName = IsWindows() ? "powershell.exe" : "/bin/bash",
                Arguments = IsWindows() ? $"-Command \"{taskCommand}\"" : $"-c \"{taskCommand}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
                WorkingDirectory = Environment.CurrentDirectory
            };

            using var process = Process.Start(processInfo);
            if (process == null)
            {
                return StatusCode(500, new { error = "Failed to start process" });
            }

            var taskId = Guid.NewGuid().ToString();
            RunningTasks.TryAdd(taskId, process);

            try
            {
                // Stream output
                var outputTask = Task.Run(async () =>
                {
                    while (!process.StandardOutput.EndOfStream)
                    {
                        var line = await process.StandardOutput.ReadLineAsync();
                        if (line != null)
                        {
                            await WriteToStream(line);
                        }
                    }
                });

                var errorTask = Task.Run(async () =>
                {
                    while (!process.StandardError.EndOfStream)
                    {
                        var line = await process.StandardError.ReadLineAsync();
                        if (line != null)
                        {
                            await WriteToStream($"ERROR: {line}");
                        }
                    }
                });

                await Task.WhenAll(outputTask, errorTask);
                await process.WaitForExitAsync();

                await WriteToStream($"Task completed with exit code {process.ExitCode}");
            }
            finally
            {
                RunningTasks.TryRemove(taskId, out _);
            }

            return new EmptyResult();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Task execution error");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    [HttpPost("stop")]
    public IActionResult StopTask([FromBody] StopTaskRequest request)
    {
        if (RunningTasks.TryRemove(request.TaskId, out var process))
        {
            try
            {
                process.Kill(entireProcessTree: true);
                return Ok(new { success = true });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error stopping task: {TaskId}", request.TaskId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        return NotFound(new { error = "Task not found" });
    }

    private string GetTaskCommand(string taskName)
    {
        return taskName.ToLower() switch
        {
            "build" => "dotnet build",
            "test" => "dotnet test --nologo",
            "clean" => "dotnet clean",
            "restore" => "dotnet restore",
            "format" => "dotnet format",
            "lint" => "dotnet format --verify-no-changes",
            "deploy" => "echo Deploy not configured",
            _ => string.Empty
        };
    }

    private async Task WriteToStream(string message)
    {
        var bytes = Encoding.UTF8.GetBytes($"{message}\n");
        await Response.Body.WriteAsync(bytes);
        await Response.Body.FlushAsync();
    }

    private bool IsWindows()
    {
        return Environment.OSVersion.Platform == PlatformID.Win32NT;
    }
}

public class RunTaskRequest
{
    public string Task { get; set; } = string.Empty;
}

public class StopTaskRequest
{
    public string TaskId { get; set; } = string.Empty;
}
