using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace TerraFusion.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TerminalController : ControllerBase
{
    private readonly ILogger<TerminalController> _logger;

    public TerminalController(ILogger<TerminalController> logger)
    {
        _logger = logger;
    }

    [HttpGet("ws")]
    public async Task HandleWebSocket()
    {
        if (HttpContext.WebSockets.IsWebSocketRequest)
        {
            using var webSocket = await HttpContext.WebSockets.AcceptWebSocketAsync();
            await HandleTerminalSession(webSocket);
        }
        else
        {
            HttpContext.Response.StatusCode = 400;
        }
    }

    private async Task HandleTerminalSession(WebSocket webSocket)
    {
        var buffer = new byte[1024 * 4];

        try
        {
            // Send welcome message
            await SendMessage(webSocket, "Terminal connected. Type commands...");

            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(
                    new ArraySegment<byte>(buffer),
                    CancellationToken.None
                );

                if (result.MessageType == WebSocketMessageType.Text)
                {
                    var json = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    var request = JsonSerializer.Deserialize<TerminalRequest>(json);

                    if (request?.Command != null)
                    {
                        await ExecuteCommand(webSocket, request.Command);
                    }
                }
                else if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(
                        WebSocketCloseStatus.NormalClosure,
                        "Closing",
                        CancellationToken.None
                    );
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Terminal session error");
            await SendMessage(webSocket, $"Error: {ex.Message}");
        }
    }

    private async Task ExecuteCommand(WebSocket webSocket, string command)
    {
        try
        {
            var processInfo = new ProcessStartInfo
            {
                FileName = IsWindows() ? "powershell.exe" : "/bin/bash",
                Arguments = IsWindows() ? $"-Command \"{command}\"" : $"-c \"{command}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = Process.Start(processInfo);
            if (process == null)
            {
                await SendMessage(webSocket, "Failed to start process");
                return;
            }

            // Read output asynchronously
            var outputTask = Task.Run(async () =>
            {
                while (!process.StandardOutput.EndOfStream)
                {
                    var line = await process.StandardOutput.ReadLineAsync();
                    if (line != null)
                    {
                        await SendMessage(webSocket, line);
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
                        await SendMessage(webSocket, $"ERROR: {line}");
                    }
                }
            });

            await Task.WhenAll(outputTask, errorTask);
            await process.WaitForExitAsync();

            await SendMessage(webSocket, $"Process exited with code {process.ExitCode}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Command execution error: {Command}", command);
            await SendMessage(webSocket, $"Error executing command: {ex.Message}");
        }
    }

    private async Task SendMessage(WebSocket webSocket, string message)
    {
        if (webSocket.State == WebSocketState.Open)
        {
            var bytes = Encoding.UTF8.GetBytes(message);
            await webSocket.SendAsync(
                new ArraySegment<byte>(bytes),
                WebSocketMessageType.Text,
                true,
                CancellationToken.None
            );
        }
    }

    private bool IsWindows()
    {
        return Environment.OSVersion.Platform == PlatformID.Win32NT;
    }
}

public class TerminalRequest
{
    public string Command { get; set; } = string.Empty;
}
