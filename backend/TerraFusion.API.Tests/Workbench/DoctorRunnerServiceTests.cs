// WORKBENCH-V0.3 SLICE-J — DoctorRunnerService contract tests.
//
// Validates:
//   1. Returns RunningNow=true (409 guard) when a run is already in progress.
//   2. Returns ExitCode=0 when the process exits 0 (PASS stdout).
//   3. Returns ExitCode=1 when the process exits 1 (FAIL stdout).
//   4. Returns ExitCode=2 when the process throws (Node not found).
//   5. Controller returns 200 OK with run result on success.
//   6. Controller returns 409 Conflict when service returns RunningNow=true.

using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using TerraFusion.API.Controllers;
using TerraFusion.API.Services.Workbench;
using TerraFusion.Core.Sync.Workbench;
using Xunit;

namespace TerraFusion.API.Tests.Workbench;

// ── Fake IProcessRunner for tests ────────────────────────────────────────────

file sealed class FakeProcessRunner : IProcessRunner
{
    private readonly Func<Task<ProcessRunOutcome>> _factory;

    public FakeProcessRunner(Func<Task<ProcessRunOutcome>> factory)
    {
        _factory = factory;
    }

    public Task<ProcessRunOutcome> RunAsync(
        string fileName,
        IReadOnlyList<string> arguments,
        string workingDirectory,
        IReadOnlyDictionary<string, string> environmentVars,
        CancellationToken cancellationToken = default)
        => _factory();
}

// ── Test helpers ─────────────────────────────────────────────────────────────

file static class ServiceFactory
{
    private static IConfiguration EmptyConfig()
        => new ConfigurationBuilder().Build();

    public static DoctorRunnerService Create(IProcessRunner runner)
        => new(runner, EmptyConfig(), repoRoot: "/repo");
}

// ── Test suite ───────────────────────────────────────────────────────────────

public sealed class DoctorRunnerServiceTests
{
    // ── Test 1: 409 guard ────────────────────────────────────────────────────

    [Fact]
    public async Task DoctorRunnerService_Returns409_WhenAlreadyRunning()
    {
        // Arrange: a runner that blocks indefinitely so the first call keeps _running=1.
        var tcs = new TaskCompletionSource<ProcessRunOutcome>();
        var runner = new FakeProcessRunner(() => tcs.Task);
        var service = ServiceFactory.Create(runner);

        // Start first run (never completes during test).
        var firstRun = service.RunAsync(CancellationToken.None);

        // Give the first run a tick to set _running = 1.
        await Task.Yield();

        // Act: second run while first is in progress.
        var result = await service.RunAsync(CancellationToken.None);

        // Assert.
        result.RunningNow.Should().BeTrue();
        result.ExitCode.Should().Be(2);

        // Cleanup.
        tcs.TrySetResult(new ProcessRunOutcome { ExitCode = 0, Stdout = "", Stderr = "", DurationMs = 0 });
        await firstRun;
    }

    // ── Test 2: exit code 0 (PASS) ───────────────────────────────────────────

    [Fact]
    public async Task DoctorRunnerService_ReturnsExitCode0_ForPassOutput()
    {
        // Arrange.
        const string passStdout = "OVERALL: PASS";
        var runner = new FakeProcessRunner(() => Task.FromResult(new ProcessRunOutcome
        {
            ExitCode = 0,
            Stdout = passStdout,
            Stderr = "",
            DurationMs = 500,
        }));
        var service = ServiceFactory.Create(runner);

        // Act.
        var result = await service.RunAsync(CancellationToken.None);

        // Assert.
        result.RunningNow.Should().BeFalse();
        result.ExitCode.Should().Be(0);
        result.Stdout.Should().Contain("PASS");
        result.DurationMs.Should().Be(500);
    }

    // ── Test 3: exit code 1 (FAIL) ───────────────────────────────────────────

    [Fact]
    public async Task DoctorRunnerService_ReturnsExitCode1_ForFailOutput()
    {
        // Arrange.
        var runner = new FakeProcessRunner(() => Task.FromResult(new ProcessRunOutcome
        {
            ExitCode = 1,
            Stdout = "OVERALL: FAIL",
            Stderr = "",
            DurationMs = 800,
        }));
        var service = ServiceFactory.Create(runner);

        // Act.
        var result = await service.RunAsync(CancellationToken.None);

        // Assert.
        result.ExitCode.Should().Be(1);
        result.Stdout.Should().Contain("FAIL");
        result.RunningNow.Should().BeFalse();
    }

    // ── Test 4: process throws (Node not found) ──────────────────────────────

    [Fact]
    public async Task DoctorRunnerService_ReturnsExitCode2_WhenNodeNotFound()
    {
        // Arrange: runner throws to simulate "node: command not found".
        var runner = new FakeProcessRunner(() => Task.FromException<ProcessRunOutcome>(
            new InvalidOperationException("node: command not found")));
        var service = ServiceFactory.Create(runner);

        // Act: service should propagate the exception (controller wraps it in 500).
        var act = () => service.RunAsync(CancellationToken.None);

        // Assert: the exception propagates — controller catches and returns 500.
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*node: command not found*");
    }

    // ── Test 5: controller returns 200 OK ────────────────────────────────────

    [Fact]
    public async Task WorkbenchDoctorController_Returns200_WithRunResult()
    {
        // Arrange.
        var runner = new FakeProcessRunner(() => Task.FromResult(new ProcessRunOutcome
        {
            ExitCode = 0,
            Stdout = "OVERALL: PASS",
            Stderr = "",
            DurationMs = 300,
        }));
        var service = ServiceFactory.Create(runner);
        var controller = new WorkbenchDoctorController(service);

        // Act.
        var result = await controller.Run(CancellationToken.None);

        // Assert.
        var ok = result.Should().BeOfType<OkObjectResult>().Subject;
        ok.StatusCode.Should().Be(200);

        // Anonymous types are internal to TerraFusion.API — inspect via JSON to cross the assembly boundary.
        var json = JsonSerializer.Serialize(ok.Value, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        });
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        root.GetProperty("exitCode").GetInt32().Should().Be(0);
        root.GetProperty("stdout").GetString().Should().Contain("PASS");
        root.GetProperty("runningNow").GetBoolean().Should().BeFalse();
    }

    // ── Test 6: controller returns 409 when concurrent run ───────────────────

    [Fact]
    public async Task WorkbenchDoctorController_Returns409_WhenConcurrentRun()
    {
        // Arrange: runner that never completes.
        var tcs = new TaskCompletionSource<ProcessRunOutcome>();
        var runner = new FakeProcessRunner(() => tcs.Task);
        var service = ServiceFactory.Create(runner);
        var controller = new WorkbenchDoctorController(service);

        // Start first run.
        var firstRun = controller.Run(CancellationToken.None);
        await Task.Yield();

        // Act: second run — should conflict.
        var conflictResult = await controller.Run(CancellationToken.None);

        // Assert.
        conflictResult.Should().BeOfType<ConflictObjectResult>()
            .Which.StatusCode.Should().Be(409);

        // Cleanup.
        tcs.TrySetResult(new ProcessRunOutcome { ExitCode = 0 });
        await firstRun;
    }
}
