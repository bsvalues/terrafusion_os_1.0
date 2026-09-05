// PR-3 observability fix #2 — PacsReadinessHealthCheck registration.
//
// Pre-PR-3 the check existed with full IPacsAdapter wiring + PACS_REQUIRED
// gating + unit tests, but PacsHealthCheckExtensions.AddPacsReadiness was
// never called from Program.cs — so /healthz/ready returned 200 even with
// a totally broken PACS connection. These tests exercise the now-registered
// pathway end-to-end at the unit level:
//
//   1. Mock IPacsAdapter so PACS is "unreachable" (ValidateContractAsync
//      returns IsValid=false with ConnectionFailed error).
//   2. Register the check via AddPacsReadiness().
//   3. Drive HealthCheckService.CheckHealthAsync().
//   4. Assert the readiness-tagged result is Unhealthy when PACS_REQUIRED=true
//      and Degraded when PACS_REQUIRED=false.

using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Moq;
using TerraFusion.API.Health;
using TerraFusion.Core.PACS;
using Xunit;

namespace TerraFusion.Unit.Tests.Observability;

public class PacsReadinessHealthCheckRegistrationTests
{
    private static PacsContractProof FailedProof() => new()
    {
        IsValid = false,
        Errors = new[] { "PACS_CONNECTION_FAILED: cannot reach pacs_oltp" },
        DatabaseConnection = new PacsProofItem { Name = "db", Passed = false, Severity = "error" },
        RequiredViews = new PacsProofItem { Name = "views", Passed = false, Severity = "error" },
        HealthCheckExecution = new PacsProofItem { Name = "hc", Passed = false, Severity = "error" },
    };

    private static PacsContractProof OkProof() => new()
    {
        IsValid = true,
        DatabaseConnection = new PacsProofItem { Name = "db", Passed = true },
        RequiredViews = new PacsProofItem { Name = "views", Passed = true },
        HealthCheckExecution = new PacsProofItem { Name = "hc", Passed = true },
    };

    private static IServiceProvider BuildSp(IPacsAdapter adapter, bool pacsRequired)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["PACS:Required"] = pacsRequired.ToString().ToLowerInvariant(),
            })
            .Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddLogging();
        services.AddSingleton(adapter);
        services.AddHealthChecks()
            .AddPacsReadiness("readiness", "pacs");
        return services.BuildServiceProvider();
    }

    [Fact]
    public async Task PACS_required_and_unreachable_returns_Unhealthy_on_readiness_tag()
    {
        var adapter = new Mock<IPacsAdapter>();
        adapter.Setup(a => a.ValidateContractAsync(It.IsAny<CancellationToken>()))
               .ReturnsAsync(FailedProof());

        using var sp = BuildSp(adapter.Object, pacsRequired: true) as ServiceProvider;
        sp.Should().NotBeNull();
        var svc = sp!.GetRequiredService<HealthCheckService>();

        var report = await svc.CheckHealthAsync(reg => reg.Tags.Contains("readiness"));

        report.Status.Should().Be(HealthStatus.Unhealthy);
        report.Entries.Should().ContainKey("pacs-contract");
        report.Entries["pacs-contract"].Status.Should().Be(HealthStatus.Unhealthy);
    }

    [Fact]
    public async Task PACS_not_required_and_unreachable_returns_Degraded_but_not_Unhealthy()
    {
        var adapter = new Mock<IPacsAdapter>();
        adapter.Setup(a => a.ValidateContractAsync(It.IsAny<CancellationToken>()))
               .ReturnsAsync(FailedProof());

        using var sp = BuildSp(adapter.Object, pacsRequired: false) as ServiceProvider;
        sp.Should().NotBeNull();
        var svc = sp!.GetRequiredService<HealthCheckService>();

        var report = await svc.CheckHealthAsync(reg => reg.Tags.Contains("readiness"));

        // Degraded keeps overall 200 — but it is NOT Healthy: the
        // distinction matters because alerting can wire on Degraded.
        report.Status.Should().Be(HealthStatus.Degraded);
        report.Entries["pacs-contract"].Status.Should().Be(HealthStatus.Degraded);
    }

    [Fact]
    public async Task PACS_required_and_reachable_returns_Healthy()
    {
        var adapter = new Mock<IPacsAdapter>();
        adapter.Setup(a => a.ValidateContractAsync(It.IsAny<CancellationToken>()))
               .ReturnsAsync(OkProof());

        using var sp = BuildSp(adapter.Object, pacsRequired: true) as ServiceProvider;
        sp.Should().NotBeNull();
        var svc = sp!.GetRequiredService<HealthCheckService>();

        var report = await svc.CheckHealthAsync(reg => reg.Tags.Contains("readiness"));

        report.Status.Should().Be(HealthStatus.Healthy);
        report.Entries["pacs-contract"].Status.Should().Be(HealthStatus.Healthy);
    }

    [Fact]
    public void AddPacsReadiness_registers_under_pacs_contract_name_with_expected_tags()
    {
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(new ConfigurationBuilder().Build());
        services.AddLogging();
        services.AddSingleton(new Mock<IPacsAdapter>().Object);
        services.AddHealthChecks().AddPacsReadiness("readiness", "pacs");

        using var sp = services.BuildServiceProvider();
        var options = sp.GetRequiredService<
            Microsoft.Extensions.Options.IOptions<HealthCheckServiceOptions>>().Value;

        var reg = options.Registrations.SingleOrDefault(r => r.Name == "pacs-contract");
        reg.Should().NotBeNull("PR-3 fix #2: PacsReadinessHealthCheck must be registered");
        reg!.Tags.Should().Contain("readiness");
        reg.Tags.Should().Contain("pacs");
        reg.FailureStatus.Should().Be(HealthStatus.Unhealthy);
    }
}
