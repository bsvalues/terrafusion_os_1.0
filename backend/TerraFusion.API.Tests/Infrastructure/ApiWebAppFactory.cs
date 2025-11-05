using System.Linq;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using TerraFusion.Consciousness.Interfaces;
using StackExchange.Redis;
using Moq;
using AbstractionsPerf = TerraFusion.Abstractions.Interfaces;

namespace TerraFusion.API.Tests.Infrastructure
{
    /// <summary>
    /// Custom WebApplicationFactory that swaps heavy Consciousness services with lightweight test stubs
    /// to prevent DI validation errors during API host startup.
    /// </summary>
    public class ApiWebAppFactory : WebApplicationFactory<TerraFusion.API.Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Ensure a safe web root/content root for tests to avoid static web assets errors
            var tempWebRoot = System.IO.Path.Combine(System.IO.Path.GetTempPath(), "terrafusion-api-wwwroot-test");
            System.IO.Directory.CreateDirectory(tempWebRoot);
            builder.UseSetting(Microsoft.AspNetCore.Hosting.WebHostDefaults.WebRootKey, tempWebRoot);

            builder.ConfigureServices(services =>
            {
                // Remove heavy orchestrator and data service registrations if present
                RemoveService<IQuantumConsciousnessOrchestrator>(services);
                RemoveService<IBentonCountyDataService>(services);
                RemoveService<IHybridConsciousnessManager>(services);
                RemoveService<AbstractionsPerf.IPerformanceMonitor>(services);

                // Add lightweight test stubs
                services.AddSingleton<IQuantumConsciousnessOrchestrator, TestQuantumConsciousnessOrchestrator>();
                services.AddSingleton<IBentonCountyDataService, TestBentonCountyDataService>();
                services.AddSingleton<IHybridConsciousnessManager, TestHybridConsciousnessManager>();
                services.AddSingleton<AbstractionsPerf.IPerformanceMonitor, TestPerformanceMonitor>();

                // Provide a dummy Redis multiplexer so Redis-dependent services can construct
                var mockMux = new Mock<IConnectionMultiplexer>(MockBehavior.Loose);
                services.AddSingleton<IConnectionMultiplexer>(sp => mockMux.Object);
            });
        }

        private static void RemoveService<TService>(IServiceCollection services)
        {
            var descriptors = services.Where(d => d.ServiceType == typeof(TService)).ToList();
            foreach (var d in descriptors)
            {
                services.Remove(d);
            }
        }
    }
}
