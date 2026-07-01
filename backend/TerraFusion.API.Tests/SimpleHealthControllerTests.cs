using System.Text.Json;
using System.Threading;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Controllers;
using Xunit;

namespace TerraFusion.API.Tests;

/// <summary>
/// WO-BACKEND-004 — Health/Readiness Truth.
/// The readiness probe must not contradict itself: a "Ready" response may not
/// also claim the system is still initializing, and while the host has not
/// finished starting the probe must report NotReady (HTTP 503).
/// </summary>
public class SimpleHealthControllerTests
{
    private static SimpleHealthController CreateController(bool started)
    {
        var lifetime = new Mock<IHostApplicationLifetime>();
        // ApplicationStarted fires (token becomes canceled) once the host is up.
        lifetime
            .SetupGet(l => l.ApplicationStarted)
            .Returns(started ? new CancellationToken(canceled: true) : CancellationToken.None);

        return new SimpleHealthController(
            NullLogger<SimpleHealthController>.Instance,
            lifetime.Object);
    }

    [Fact]
    public void Ready_WhenHostStarted_ReturnsReady_WithNonContradictoryMessage()
    {
        var result = CreateController(started: true).Ready();

        var ok = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);

        Assert.Contains("\"Status\":\"Ready\"", json);
        // Truthfulness: a Ready response must NOT claim it is still initializing.
        Assert.DoesNotContain("initializing", json);
    }

    [Fact]
    public void Ready_WhenHostNotStarted_Returns503_NotReady()
    {
        var result = CreateController(started: false).Ready();

        var obj = Assert.IsType<ObjectResult>(result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, obj.StatusCode);

        var json = JsonSerializer.Serialize(obj.Value);
        Assert.Contains("\"Status\":\"NotReady\"", json);
        Assert.Contains("initializing", json);
    }

    [Fact]
    public void Live_AlwaysReportsLive()
    {
        // Liveness is correct as an always-on signal while the process responds.
        var result = CreateController(started: false).Live();

        var ok = Assert.IsType<OkObjectResult>(result);
        var json = JsonSerializer.Serialize(ok.Value);
        Assert.Contains("\"Status\":\"Live\"", json);
    }
}
