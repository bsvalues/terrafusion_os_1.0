using Microsoft.AspNetCore.SignalR;
using System.Threading.Channels;

namespace TerraFusion.API.Hubs
{
    public class TerminalHub : Hub
    {
        private readonly ILogger<TerminalHub> _logger;

        public TerminalHub(ILogger<TerminalHub> logger)
        {
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"Terminal client connected: {Context.ConnectionId}");
            await Clients.Caller.SendAsync("ReceiveOutput", "Connected to TerraFusion OS Terminal (Simulated)\r\n");
            await Clients.Caller.SendAsync("ReceiveOutput", "Type 'help' for available commands.\r\n$ ");
            await base.OnConnectedAsync();
        }

        public async Task SendCommand(string command)
        {
            _logger.LogInformation($"Received command: {command}");

            // Echo the command
            // await Clients.Caller.SendAsync("ReceiveOutput", $"{command}\r\n");

            // Simple simulated response
            string response = string.Empty;
            switch (command.Trim().ToLower())
            {
                case "help":
                    response = "Available commands: help, status, clear, version\r\n";
                    break;
                case "status":
                    response = "System Status: OPERATIONAL\r\nQuantum Core: ONLINE\r\n";
                    break;
                case "version":
                    response = "TerraFusion OS v1.0.0\r\n";
                    break;
                case "clear":
                    // Client side usually handles this, but we can send a signal if needed
                    response = "";
                    break;
                default:
                    response = $"Command not found: {command}\r\n";
                    break;
            }

            if (!string.IsNullOrEmpty(response))
            {
                await Clients.Caller.SendAsync("ReceiveOutput", response);
            }

            await Clients.Caller.SendAsync("ReceiveOutput", "$ ");
        }
    }
}
