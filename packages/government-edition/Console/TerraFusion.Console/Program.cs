using System;
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace TerraFusion.ConsoleApp
{
    class Program
    {
        static async Task Main(string[] args)
        {
            System.Console.WriteLine("╔══════════════════════════════════════════════╗");
            System.Console.WriteLine("║     TerraFusion Government Edition          ║");
            System.Console.WriteLine("║         Cross-Platform Launcher              ║");
            System.Console.WriteLine("╚══════════════════════════════════════════════╝");
            System.Console.WriteLine();

            var services = new ServiceCollection();
            services.AddLogging(builder => builder.AddConsole());
            
            var serviceProvider = services.BuildServiceProvider();
            var logger = serviceProvider.GetRequiredService<ILogger<Program>>();

            logger.LogInformation("Starting TerraFusion API Server...");
            
            // Start API server in background
            var apiProcess = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "dotnet",
                    Arguments = "run --project ../../API/TerraFusion.API/TerraFusion.API.csproj",
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };
            
            apiProcess.Start();
            logger.LogInformation($"API Server started with PID: {apiProcess.Id}");
            
            System.Console.WriteLine("\n✅ TerraFusion is running!");
            System.Console.WriteLine("📍 API: http://localhost:${TF_STATIC_PORT:-8080}");
            System.Console.WriteLine("📍 PWA: http://localhost:${TF_STATIC_PORT:-8080}");
            System.Console.WriteLine("\nPress Ctrl+C to exit...");
            
            // Keep running until interrupted
            await Task.Delay(-1);
        }
    }
}
