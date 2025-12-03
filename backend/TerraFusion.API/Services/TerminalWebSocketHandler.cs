using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

namespace TerraFusion.API.Services
{
    public class TerminalWebSocketHandler
    {
        public static async Task HandleConnection(HttpContext context)
        {
            if (context.WebSockets.IsWebSocketRequest)
            {
                using var webSocket = await context.WebSockets.AcceptWebSocketAsync();
                await ProcessWebSocket(webSocket);
            }
            else
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
            }
        }

        private static async Task ProcessWebSocket(WebSocket webSocket)
        {
            var buffer = new byte[1024 * 4];
            var welcomeMsg = Encoding.UTF8.GetBytes("Connected to TerraFusion OS Terminal (Simulated)\r\n$ ");
            await webSocket.SendAsync(new ArraySegment<byte>(welcomeMsg), WebSocketMessageType.Text, true, CancellationToken.None);

            var receiveResult = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

            while (!receiveResult.CloseStatus.HasValue)
            {
                var msg = Encoding.UTF8.GetString(buffer, 0, receiveResult.Count);
                string response = "\r\n";

                try
                {
                    // Try to parse as JSON since frontend sends { command: "..." }
                    using var json = JsonDocument.Parse(msg);
                    if (json.RootElement.TryGetProperty("command", out var cmdProp))
                    {
                        var cmd = cmdProp.GetString();
                        if (!string.IsNullOrWhiteSpace(cmd))
                        {
                            response = ExecuteCommand(cmd);
                        }
                    }
                }
                catch
                {
                    // Fallback if not JSON
                    response = $"\r\nEcho: {msg}\r\n$ ";
                }

                var responseBytes = Encoding.UTF8.GetBytes(response);
                await webSocket.SendAsync(new ArraySegment<byte>(responseBytes), WebSocketMessageType.Text, true, CancellationToken.None);

                receiveResult = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);
            }

            await webSocket.CloseAsync(receiveResult.CloseStatus.Value, receiveResult.CloseStatusDescription, CancellationToken.None);
        }

        private static string ExecuteCommand(string cmd)
        {
            var cleanCmd = cmd.Trim().ToLower();
            var output = "";

            switch (cleanCmd)
            {
                case "help":
                    output = "Available commands: help, status, version, clear, date\r\n";
                    break;
                case "status":
                    output = "System Status: OPERATIONAL\r\nQuantum Core: ONLINE\r\nAgents: 50,000 Active\r\n";
                    break;
                case "version":
                    output = "TerraFusion OS v1.0.0 (Simulated Terminal)\r\n";
                    break;
                case "date":
                    output = $"{DateTime.Now}\r\n";
                    break;
                case "clear":
                    return ""; // Frontend handles clear usually, or we send nothing
                default:
                    output = $"Command not found: {cmd}\r\n";
                    break;
            }

            return $"\r\n{output}$ ";
        }
    }
}
