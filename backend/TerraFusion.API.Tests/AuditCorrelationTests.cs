using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Services;
using TerraFusion.Data;
using Xunit;

namespace TerraFusion.API.Tests;

public sealed class AuditCorrelationTests
{
    [Fact]
    public async Task AuthFailure_EmitsAudit_WithCorrelationId()
    {
        var (auditLogger, provider, correlationId) = BuildAuditLogger();

        await auditLogger.LogAuthenticationAsync("user-failure", false, "bad password");

        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var log = await db.AuditLogs
            .OrderByDescending(x => x.Timestamp)
            .FirstOrDefaultAsync(x => x.UserId == "user-failure");

        log.Should().NotBeNull();
        log!.Type.Should().StartWith("Authentication:");
        log.CorrelationId.Should().Be(correlationId);

        using var doc = JsonDocument.Parse(log.Data);
        doc.RootElement.GetProperty("Details").GetString().Should().Contain("failed");
    }

    [Fact]
    public async Task AuthSuccess_EmitsAudit_WithCorrelationId()
    {
        var (auditLogger, provider, correlationId) = BuildAuditLogger();

        await auditLogger.LogAuthenticationAsync("user-success", true);

        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var log = await db.AuditLogs
            .OrderByDescending(x => x.Timestamp)
            .FirstOrDefaultAsync(x => x.UserId == "user-success");

        log.Should().NotBeNull();
        log!.Type.Should().StartWith("Authentication:");
        log.CorrelationId.Should().Be(correlationId);

        using var doc = JsonDocument.Parse(log.Data);
        doc.RootElement.GetProperty("Details").GetString().Should().Contain("successful");
    }

    [Fact]
    public async Task AuthorizationDenied_EmitsAudit_WithCorrelationId()
    {
        var (auditLogger, provider, correlationId) = BuildAuditLogger();

        await auditLogger.LogAuthorizationAsync("user-authz-denied", "api/secure-resource", granted: false);

        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var log = await db.AuditLogs
            .OrderByDescending(x => x.Timestamp)
            .FirstOrDefaultAsync(x => x.UserId == "user-authz-denied");

        log.Should().NotBeNull();
        log!.Type.Should().StartWith("Authorization:");
        log.CorrelationId.Should().Be(correlationId);

        using var doc = JsonDocument.Parse(log.Data);
        doc.RootElement.GetProperty("Details").GetString().Should().Contain("denied");
    }

    [Fact]
    public async Task ConfigurationChange_EmitsAudit_WithCorrelationId()
    {
        var (auditLogger, provider, correlationId) = BuildAuditLogger();

        await auditLogger.LogConfigurationChangeAsync(
            setting: "Privileges:RoleAssignment",
            oldValue: "Assessor",
            newValue: "CountyAdmin",
            userId: "user-config-change");

        using var scope = provider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<TerraFusionDbContext>();
        var log = await db.AuditLogs
            .OrderByDescending(x => x.Timestamp)
            .FirstOrDefaultAsync(x => x.UserId == "user-config-change");

        log.Should().NotBeNull();
        log!.Type.Should().StartWith("ConfigurationChange:");
        log.CorrelationId.Should().Be(correlationId);

        using var doc = JsonDocument.Parse(log.Data);
        doc.RootElement.GetProperty("Details").GetString().Should().Contain("Configuration changed");
        doc.RootElement.GetProperty("OldValue").GetString().Should().Be("Assessor");
        doc.RootElement.GetProperty("NewValue").GetString().Should().Be("CountyAdmin");
    }

    private static (AuditLogger AuditLogger, ServiceProvider Provider, string CorrelationId) BuildAuditLogger()
    {
        var correlationId = $"corr-{Guid.NewGuid():N}";
        var dbName = $"audit-tests-{Guid.NewGuid():N}";

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new[]
            {
                new KeyValuePair<string, string?>("AuditLogging:Enabled", "true"),
                new KeyValuePair<string, string?>("AuditLogging:LogToDatabase", "true"),
                new KeyValuePair<string, string?>("AuditLogging:LogToFile", "false"),
                new KeyValuePair<string, string?>("ConnectionStrings:DefaultConnection", "Data Source=:memory:")
            })
            .Build();

        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddDbContext<TerraFusionDbContext>(opts => opts.UseInMemoryDatabase(dbName));

        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                TraceIdentifier = correlationId
            }
        };
        accessor.HttpContext.Request.Headers["X-Correlation-ID"] = correlationId;

        services.AddSingleton<IHttpContextAccessor>(accessor);
        services.AddLogging();

        var provider = services.BuildServiceProvider();

        var logger = NullLogger<AuditLogger>.Instance;
        var auditLogger = new AuditLogger(logger, config, accessor, provider);

        return (auditLogger, provider, correlationId);
    }
}
