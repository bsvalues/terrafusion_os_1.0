using System;
using System.IO;
using System.Security.Claims;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Moq;
using TerraFusion.Abstractions.Interfaces;
using TerraFusion.API.Middleware;
using Xunit;

namespace TerraFusion.API.Tests.Phase4;

public sealed class AuditAccessDeniedTests
{
    [Fact]
    public async Task AccessDenied_EmitsAudit_WithCorrelationId()
    {
        var auditLogger = new Mock<IAuditLogger>(MockBehavior.Strict);
        auditLogger.Setup(x => x.LogApiCallAsync(It.IsAny<string>(), "/api/secure-resource", 403, It.IsAny<double>(), "user-denied"))
            .Returns(Task.CompletedTask);
        auditLogger.Setup(x => x.LogAuthorizationAsync("user-denied", "/api/secure-resource", false))
            .Returns(Task.CompletedTask);
        auditLogger.Setup(x => x.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>(), "user-denied"))
            .Returns(Task.CompletedTask);

        var (middleware, serviceProvider) = BuildMiddleware(auditLogger.Object, statusCode: 403, responseBody: "{\"error\":\"forbidden\"}");
        var context = BuildHttpContext("/api/secure-resource", "user-denied", "corr-test-denied", serviceProvider);

        await middleware.InvokeAsync(context);

        auditLogger.Verify(x => x.LogAuthorizationAsync("user-denied", "/api/secure-resource", false), Times.Once);
    }

    [Fact]
    public async Task AccessDenied_DoesNotLogBearerToken()
    {
        var capturedErrorMessage = string.Empty;

        var auditLogger = new Mock<IAuditLogger>(MockBehavior.Strict);
        auditLogger.Setup(x => x.LogApiCallAsync(It.IsAny<string>(), "/api/secure-resource", 403, It.IsAny<double>(), "user-denied"))
            .Returns(Task.CompletedTask);
        auditLogger.Setup(x => x.LogAuthorizationAsync("user-denied", "/api/secure-resource", false))
            .Returns(Task.CompletedTask);
        auditLogger.Setup(x => x.LogErrorAsync(It.IsAny<string>(), It.IsAny<Exception>(), "user-denied"))
            .Callback<string, Exception, string?>((_, ex, _) => capturedErrorMessage = ex.Message)
            .Returns(Task.CompletedTask);

        var (middleware, serviceProvider) = BuildMiddleware(auditLogger.Object, statusCode: 403, responseBody: "{\"error\":\"forbidden\"}");
        var context = BuildHttpContext("/api/secure-resource", "user-denied", "corr-test-denied", serviceProvider);
        context.Request.Headers.Authorization = "Bearer secret-token-123";

        await middleware.InvokeAsync(context);

        capturedErrorMessage.Should().NotContain("secret-token-123");
    }

    private static (AuditLoggingMiddleware Middleware, IServiceProvider ServiceProvider) BuildMiddleware(
        IAuditLogger auditLogger,
        int statusCode,
        string responseBody)
    {
        var services = new ServiceCollection();
        services.AddSingleton(auditLogger);
        var provider = services.BuildServiceProvider();

        RequestDelegate next = async context =>
        {
            context.Response.StatusCode = statusCode;
            await context.Response.WriteAsync(responseBody);
        };

        return (new AuditLoggingMiddleware(next), provider);
    }

    private static DefaultHttpContext BuildHttpContext(
        string path,
        string userId,
        string correlationId,
        IServiceProvider serviceProvider)
    {
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Get;
        context.Request.Path = path;
        context.TraceIdentifier = correlationId;
        context.Request.Headers["X-Correlation-ID"] = correlationId;
        context.RequestServices = serviceProvider;

        var identity = new ClaimsIdentity(
            new[] { new Claim(ClaimTypes.NameIdentifier, userId) },
            authenticationType: "TestAuth");
        context.User = new ClaimsPrincipal(identity);

        // middleware copies captured response to this stream
        context.Response.Body = new MemoryStream();
        return context;
    }
}
