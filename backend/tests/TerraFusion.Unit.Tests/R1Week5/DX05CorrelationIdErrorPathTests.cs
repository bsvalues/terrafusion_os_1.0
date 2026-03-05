using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using TerraFusion.API.Middleware;
using Xunit;

namespace TerraFusion.Unit.Tests.R1Week5;

/// <summary>
/// DX-05: CorrelationId on denial/error paths — validates that
/// X-Correlation-ID is echoed on ALL response codes (200, 400, 403, 404, 500),
/// not only success paths.
///
/// Found during DX-02 runtime smoke (PR #569, Issue #572).
///
/// Acceptance criteria:
///   AC-1: Middleware echoes inbound X-Correlation-ID on 200 success responses
///   AC-2: Middleware echoes inbound X-Correlation-ID on 404 error responses
///   AC-3: Middleware generates correlation ID when none provided (200)
///   AC-4: Middleware generates correlation ID when none provided (404)
///   AC-5: Middleware rejects invalid/malicious correlation IDs and generates safe replacement
///   AC-6: Middleware does not overwrite header if controller already set it
/// </summary>
public class DX05CorrelationIdErrorPathTests
{
    // ── AC-1: Echoes inbound correlation ID on 200 ─────────────────

    [Fact]
    public async Task AC1_CorrelationId_Echoed_On200_WhenInboundProvided()
    {
        // Arrange
        var context = CreateHttpContext();
        context.Request.Headers["X-Correlation-ID"] = "dx05-test-success-001";

        var middleware = new CorrelationIdMiddleware(next: (ctx) =>
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Headers["X-Correlation-ID"].ToString()
            .Should().Be("dx05-test-success-001",
                "inbound X-Correlation-ID should be echoed on 200 OK");
    }

    // ── AC-2: Echoes inbound correlation ID on 404 ─────────────────

    [Fact]
    public async Task AC2_CorrelationId_Echoed_On404_WhenInboundProvided()
    {
        // Arrange
        var context = CreateHttpContext();
        context.Request.Headers["X-Correlation-ID"] = "dx05-test-notfound-002";

        var middleware = new CorrelationIdMiddleware(next: (ctx) =>
        {
            ctx.Response.StatusCode = 404;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Headers["X-Correlation-ID"].ToString()
            .Should().Be("dx05-test-notfound-002",
                "inbound X-Correlation-ID should be echoed on 404 Not Found (DX-02 Finding #3)");
    }

    // ── AC-3: Generates correlation ID on 200 when none provided ───

    [Fact]
    public async Task AC3_CorrelationId_Generated_On200_WhenNoneProvided()
    {
        // Arrange
        var context = CreateHttpContext();

        var middleware = new CorrelationIdMiddleware(next: (ctx) =>
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var correlationId = context.Response.Headers["X-Correlation-ID"].ToString();
        correlationId.Should().NotBeNullOrWhiteSpace(
            "middleware should generate correlation ID when none provided");
        correlationId.Should().StartWith("tf-",
            "generated correlation ID should use tf- prefix");
    }

    // ── AC-4: Generates correlation ID on 404 when none provided ───

    [Fact]
    public async Task AC4_CorrelationId_Generated_On404_WhenNoneProvided()
    {
        // Arrange
        var context = CreateHttpContext();

        var middleware = new CorrelationIdMiddleware(next: (ctx) =>
        {
            ctx.Response.StatusCode = 404;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var correlationId = context.Response.Headers["X-Correlation-ID"].ToString();
        correlationId.Should().NotBeNullOrWhiteSpace(
            "middleware should generate correlation ID even on 404 error paths");
        correlationId.Should().StartWith("tf-",
            "generated correlation ID should use tf- prefix");
    }

    // ── AC-5: Rejects malicious correlation IDs ────────────────────

    [Theory]
    [InlineData("<script>alert(1)</script>")]
    [InlineData("'; DROP TABLE AuditLogs; --")]
    [InlineData("a]b[c{d}e")]
    [InlineData("")] // empty
    public async Task AC5_CorrelationId_Rejected_WhenMalicious(string maliciousId)
    {
        // Arrange
        var context = CreateHttpContext();
        context.Request.Headers["X-Correlation-ID"] = maliciousId;

        var middleware = new CorrelationIdMiddleware(next: (ctx) =>
        {
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        var correlationId = context.Response.Headers["X-Correlation-ID"].ToString();
        correlationId.Should().NotBe(maliciousId,
            "malicious correlation ID should be replaced with a safe generated ID");
        correlationId.Should().StartWith("tf-",
            "safe replacement should use tf- prefix");
    }

    // ── AC-6: Does not overwrite header set by controller ──────────

    [Fact]
    public async Task AC6_CorrelationId_NotOverwritten_WhenControllerSetsIt()
    {
        // Arrange
        var context = CreateHttpContext();
        context.Request.Headers["X-Correlation-ID"] = "inbound-original";

        var middleware = new CorrelationIdMiddleware(next: (ctx) =>
        {
            // Simulate a controller that sets the header explicitly
            ctx.Response.Headers["X-Correlation-ID"] = "controller-set-value";
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Headers["X-Correlation-ID"].ToString()
            .Should().Be("controller-set-value",
                "middleware should not overwrite header already set by controller");
    }

    // ── AC-extra: Covers 403 and 500 error paths ──────────────────

    [Theory]
    [InlineData(400, "dx05-test-badreq-007")]
    [InlineData(403, "dx05-test-forbid-008")]
    [InlineData(500, "dx05-test-internal-009")]
    public async Task CorrelationId_Echoed_OnAllErrorCodes(int statusCode, string correlationId)
    {
        // Arrange
        var context = CreateHttpContext();
        context.Request.Headers["X-Correlation-ID"] = correlationId;

        var middleware = new CorrelationIdMiddleware(next: (ctx) =>
        {
            ctx.Response.StatusCode = statusCode;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        context.Response.Headers["X-Correlation-ID"].ToString()
            .Should().Be(correlationId,
                $"X-Correlation-ID should be echoed on {statusCode} responses");
    }

    // ── AC-extra: HttpContext.Items contains correlation ID ────────

    [Fact]
    public async Task CorrelationId_StoredInHttpContextItems()
    {
        // Arrange
        var context = CreateHttpContext();
        context.Request.Headers["X-Correlation-ID"] = "dx05-items-check";

        string? capturedItem = null;
        var middleware = new CorrelationIdMiddleware(next: (ctx) =>
        {
            capturedItem = ctx.Items["CorrelationId"] as string;
            ctx.Response.StatusCode = 200;
            return Task.CompletedTask;
        });

        // Act
        await middleware.InvokeAsync(context);

        // Assert
        capturedItem.Should().Be("dx05-items-check",
            "correlation ID should be stored in HttpContext.Items for downstream use");
    }

    // ── Helpers ──────────────────────────────────────────────────────

    private static DefaultHttpContext CreateHttpContext()
    {
        var context = new DefaultHttpContext();
        return context;
    }
}
