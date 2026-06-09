// WORKBENCH-V0.3 SLICE-L — IdentityRunnerService contract tests.
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

file sealed class FakeIdentityProcessRunner : IProcessRunner
{
    private readonly Func<Task<ProcessRunOutcome>> _factory;

    public FakeIdentityProcessRunner(Func<Task<ProcessRunOutcome>> factory)
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

file static class IdentityServiceFactory
{
    private static IConfiguration EmptyConfig()
        => new ConfigurationBuilder().Build();

    public static IdentityRunnerService Create(IProcessRunner runner)
        => new(runner, EmptyConfig(), repoRoot: "/repo");
}

// ── Test suite ───────────────────────────────────────────────────────────────

public sealed class IdentityRunnerServiceTests
{
    // ── Test 1: 409 guard ────────────────────────────────────────────────────

    [Fact]
    public async Task IdentityRunnerService_Returns409_WhenAlreadyRunning()
    {
        // Arrange: a runner that blocks indefinitely so the first call keeps _running=1.
        var tcs = new TaskCompletionSource<ProcessRunOutcome>();
        var runner = new FakeIdentityProcessRunner(() => tcs.Task);
        var service = IdentityServiceFactory.Create(runner);

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
    public async Task IdentityRunnerService_ReturnsExitCode0_ForPassStdout()
    {
        // Arrange: 11 table rows all PASS, then OVERALL: PASS.
        const string passStdout =
            "canonical_tf.tf_land|89247|89247|0|0|PASS\n" +
            "canonical_tf.tf_improvement|89247|89247|0|0|PASS\n" +
            "gis_tf.tf_parcel_geom|89247|89247|0|0|PASS\n" +
            "canonical_tf.tf_assessment|89247|89247|0|0|PASS\n" +
            "canonical_tf.tf_parcel_tax_area|89247|89247|0|0|PASS\n" +
            "canonical_tf.tf_exemption|5124|5124|0|0|PASS\n" +
            "canonical_tf.tf_tax_bill_line|1200000|1200000|0|0|PASS\n" +
            "canonical_tf.tf_tax_bill_current|89247|89247|0|0|PASS\n" +
            "canonical_tf.tf_assessment_bill_line|313139|313139|0|0|PASS\n" +
            "canonical_tf.tf_assessment_bill_current|89247|89247|0|0|PASS\n" +
            "canonical_tf.tf_parcel_owner_link|89247|89247|0|0|PASS\n" +
            "OVERALL: PASS — no identity drift";
        var runner = new FakeIdentityProcessRunner(() => Task.FromResult(new ProcessRunOutcome
        {
            ExitCode   = 0,
            Stdout     = passStdout,
            Stderr     = "",
            DurationMs = 47300,
        }));
        var service = IdentityServiceFactory.Create(runner);

        // Act.
        var result = await service.RunAsync(CancellationToken.None);

        // Assert.
        result.RunningNow.Should().BeFalse();
        result.ExitCode.Should().Be(0);
        result.Stdout.Should().Contain("OVERALL: PASS");
        result.DurationMs.Should().Be(47300);
    }

    // ── Test 3: exit code 0 with WARN stdout ─────────────────────────────────

    [Fact]
    public async Task IdentityRunnerService_ReturnsExitCode0_ForWarnStdout()
    {
        // Arrange: owner link has 1,397,252 dangling (deferred lane).
        // SQL emits OVERALL: FAIL because dangling > 0.
        // Backend is a transparent bridge — frontend downgrades to WARN.
        const string warnStdout =
            "canonical_tf.tf_land|89247|89247|0|0|PASS\n" +
            "canonical_tf.tf_parcel_owner_link|3200000|3200000|1397252|0|FAIL\n" +
            "OVERALL: FAIL — identity drift detected";
        var runner = new FakeIdentityProcessRunner(() => Task.FromResult(new ProcessRunOutcome
        {
            ExitCode   = 0,
            Stdout     = warnStdout,
            Stderr     = "",
            DurationMs = 48100,
        }));
        var service = IdentityServiceFactory.Create(runner);

        // Act.
        var result = await service.RunAsync(CancellationToken.None);

        // Assert: backend does NOT interpret the verdict — it returns raw stdout.
        result.ExitCode.Should().Be(0);
        result.Stdout.Should().Contain("FAIL — identity drift detected");
        result.RunningNow.Should().BeFalse();
    }

    // ── Test 4: process throws (psql not found) ───────────────────────────────

    [Fact]
    public async Task IdentityRunnerService_PropagatesException_WhenPsqlNotFound()
    {
        // Arrange: runner throws to simulate "psql: command not found".
        var runner = new FakeIdentityProcessRunner(() => Task.FromException<ProcessRunOutcome>(
            new InvalidOperationException("psql: command not found")));
        var service = IdentityServiceFactory.Create(runner);

        // Act.
        var act = () => service.RunAsync(CancellationToken.None);

        // Assert: exception propagates — controller wraps it in 500.
        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*psql: command not found*");
    }

    // ── Test 5: controller returns 200 OK ─────────────────────────────────────

    [Fact]
    public async Task WorkbenchIdentitySpineController_Returns200_WithRunResult()
    {
        // Arrange.
        const string passStdout =
            "canonical_tf.tf_land|89247|89247|0|0|PASS\n" +
            "OVERALL: PASS — no identity drift";
        var runner = new FakeIdentityProcessRunner(() => Task.FromResult(new ProcessRunOutcome
        {
            ExitCode   = 0,
            Stdout     = passStdout,
            Stderr     = "",
            DurationMs = 47000,
        }));
        var service = IdentityServiceFactory.Create(runner);
        var controller = new WorkbenchIdentitySpineController(service);

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
    public async Task WorkbenchIdentitySpineController_Returns409_WhenConcurrentRun()
    {
        // Arrange: runner that never completes.
        var tcs = new TaskCompletionSource<ProcessRunOutcome>();
        var runner = new FakeIdentityProcessRunner(() => tcs.Task);
        var service = IdentityServiceFactory.Create(runner);
        var controller = new WorkbenchIdentitySpineController(service);

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
