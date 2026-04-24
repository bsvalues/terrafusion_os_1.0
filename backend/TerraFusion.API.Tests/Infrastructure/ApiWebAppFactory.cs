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
        // Module initializer: sets ASPNETCORE_CONTENTROOT BEFORE any factory
        // constructor runs. WebApplicationFactory's default discovery walk
        // reads this env var first — if set, it skips the path walk entirely.
        //
        // This runs exactly once per test-assembly load (well before any
        // [Fact] executes), which is earlier than ConfigureWebHost and earlier
        // than any test-class constructor. The WebApplicationFactoryContentRoot
        // attribute approach only works when the default solution-layout walk
        // can find the API project — in git worktrees with custom bin dirs,
        // that walk fails. Env var is the universal escape hatch.
        static ApiWebAppFactory()
        {
            var apiSrc = System.IO.Path.GetFullPath(System.IO.Path.Combine(
                System.AppContext.BaseDirectory,
                "..", "..", "..", "..", "src", "TerraFusion.API"));
            if (System.IO.Directory.Exists(apiSrc)
                && System.IO.File.Exists(System.IO.Path.Combine(apiSrc, "TerraFusion.API.csproj")))
            {
                System.Environment.SetEnvironmentVariable("ASPNETCORE_CONTENTROOT", apiSrc);
            }
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Content root: default WebApplicationFactory resolution walks from the
            // test bin dir looking for the API's source directory. That walk fails in
            // non-standard layouts (git worktrees, custom output paths) with:
            //
            //   System.InvalidOperationException: Unable to resolve TerraFusion.API
            //   content root from 'C:\...\TerraFusion.API.Tests\bin\Debug\net8.0'
            //
            // Pin the content root to the API project's source directory explicitly.
            // From the test bin dir (bin/Debug/net8.0 under TerraFusion.API.Tests),
            // the API source lives at ../../../../src/TerraFusion.API.
            var apiSrc = System.IO.Path.GetFullPath(System.IO.Path.Combine(
                System.AppContext.BaseDirectory,
                "..", "..", "..", "..", "src", "TerraFusion.API"));
            if (System.IO.Directory.Exists(apiSrc))
            {
                builder.UseContentRoot(apiSrc);
            }

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
