// WORKBENCH-V0.3 SLICE-K — PackValidatorRunnerService contract tests.
//
// Validates:
//   1. Returns RunningNow=true (409 guard) when a run is already in progress.
//   2. Returns ExitCode=0 when the process exits 0 (PASS stdout).
//   3. Returns ExitCode=0 with WARN stdout (stdout governs verdict, not exit code).
//   4. Propagates exception when the process throws (psql not found).
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

file sealed class FakePackProcessRunner : IProcessRunner
{
    private readonly Func<Task<ProcessRunOutcome>> _factory;

    public FakePackProcessRunner(Func<Task<ProcessRunOutcome>> factory)
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

file static class PackServiceFactory
{
    private static IConfiguration EmptyConfig()
        => new ConfigurationBuilder().Build();

    public static PackValidatorRunnerService Create(IProcessRunner runner)
        => new(runner, EmptyConfig(), repoRoot: "/repo");
}

// ── Test suite ───────────────────────────────────────────────────────────────

public sealed class PackValidatorRunnerServiceTests
{
    // ── Test 1: 409 guard ────────────────────────────────────────────────────

    [Fact]
    public async Task PackValidatorRunnerService_Returns409_WhenAlreadyRunning()
    {
        // Arrange: a runner that blocks indefinitely so the first call keeps _running=1.
        var tcs = new TaskCompletionSource<ProcessRunOutcome>();
        var runner = new FakePackProcessRunner(() => tcs.Task);
        var service = PackServiceFactory.Create(runner);

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

    // ── Test 2: exit code 0 (PASS stdout) ────────────────────────────────────

    [Fact]
    public async Task PackValidatorRunnerService_ReturnsExitCode0_ForPassStdout()
    {
        // Arrange.
        const string passStdout = "table_presence|chk|YES|YES|PASS|CRITICAL|\nOVERALL: PASS|fail=0|warn=0|pass=65|info=1";
        var runner = new FakePackProcessRunner(() => Task.FromResult(new ProcessRunOutcome
        {
            ExitCode  = 0,
            Stdout    = passStdout,
            Stderr    = "",
            DurationMs = 3200,
        }));
        var service = PackServiceFactory.Create(runner);

        // Act.
        var result = await service.RunAsync(CancellationToken.None);

        // Assert.
        result.RunningNow.Should().BeFalse();
        result.ExitCode.Should().Be(0);
        result.Stdout.Should().Contain("PASS");
        result.DurationMs.Should().Be(3200);
    }

    // ── Test 3: exit code 0 with WARN stdout ─────────────────────────────────

    [Fact]
    public async Task PackValidatorRunnerService_ReturnsExitCode0_ForWarnStdout()
    {
        // Arrange: psql exits 0 but SQL emits a WARN row.
        // The backend is a transparent bridge — frontend parses the WARN verdict from stdout.
        const string warnStdout = "column_structure|col|null|not_null|WARN|WARN|\nOVERALL: WARN|fail=0|warn=1|pass=64|info=1";
        var runner = new FakePackProcessRunner(() => Task.FromResult(new ProcessRunOutcome
        {
            ExitCode  = 0,
            Stdout    = warnStdout,
            Stderr    = "",
            DurationMs = 2800,
        }));
        var service = PackServiceFactory.Create(runner);

        // Act.
        var result = await service.RunAsync(CancellationToken.None);

        // Assert.
        result.ExitCode.Should().Be(0);
        result.Stdout.Should().Contain("WARN");
        result.RunningNow.Should().BeFalse();
    }

    // ── Test 4: process throws (psql not found) ───────────────────────────────

    [Fact]
    public async Task PackValidatorRunnerService_PropagatesException_WhenPsqlNotFound()
    {
        // Arrange: runner throws to simulate "psql: command not found".
        var runner = new FakePackProcessRunner(() => Task.FromException<ProcessRunOutcome>(
            new InvalidOperationException("psql: command not found")));
        var service = PackServiceFactory.Create(runner);

        // Act.
        var act = () => service.RunAsync(CancellationToken.None);

        // Assert: exception propagates — controller wraps it in 500.
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*psql: command not found*");
    }

    // ── Test 5: controller returns 200 OK ─────────────────────────────────────

    [Fact]
    public async Task WorkbenchSourcePackController_Returns200_WithRunResult()
    {
        // Arrange.
        const string passStdout = "OVERALL: PASS|fail=0|warn=0|pass=65|info=1";
        var runner = new FakePackProcessRunner(() => Task.FromResult(new ProcessRunOutcome
        {
            ExitCode  = 0,
            Stdout    = passStdout,
            Stderr    = "",
            DurationMs = 1500,
        }));
        var service = PackServiceFactory.Create(runner);
        var controller = new WorkbenchSourcePackController(service);

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
    public async Task WorkbenchSourcePackController_Returns409_WhenConcurrentRun()
    {
        // Arrange: runner that never completes.
        var tcs = new TaskCompletionSource<ProcessRunOutcome>();
        var runner = new FakePackProcessRunner(() => tcs.Task);
        var service = PackServiceFactory.Create(runner);
        var controller = new WorkbenchSourcePackController(service);

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
