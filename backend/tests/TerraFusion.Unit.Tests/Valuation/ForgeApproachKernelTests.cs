using Microsoft.Extensions.Options;
using System.Text.Json;
using System.Diagnostics;
using System.Reflection;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation;
using TerraFusion.API.Services.Valuation.KernelContracts;
using Xunit;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TerraFusion.API.Controllers;

namespace TerraFusion.Unit.Tests.Valuation;

// Focused tests of the real feature adapter; only the held process boundary is doubled.
// The actual staged executable/controller journey is a separate, still-required acceptance gate.
public sealed class ForgeApproachKernelTests
{
    private static readonly Guid County = Guid.Parse("19190019-1919-1919-1919-191919191919");
    private static readonly string Source = new('a', 40);
    private static readonly string Binary = new('b', 64);
    private static ForgeApproachContext Context => new(County, "SYNTHETIC-001", "forge-request");
    private static ForgeCostPayload Cost => new("1.0.0", "SYNTHETIC-001", 1000, 100, 1.1m, 1.2m, 1, .8m, .9m, 25000);
    private static ForgeCostResult CostData => new("1.0.0", "SYNTHETIC-001", 132, 105.6m, 95.04m, 132000, 26400, -10560, 95040, 25000, 120040);

    private static RustKernelsOptions OptionsForTest() => new()
    {
        CostIncomeKernelPath = "synthetic-kernel.exe",
        CostIncomeKernelSourceCommit = Source,
        CostIncomeKernelExecutableSha256 = Binary,
    };

    private static KernelInvocationResult<ForgeCostResult> Success() => new(
        true, ForgeApproachKernelClient.KernelName, $"git:{Source}", new string('c', 64),
        DateTimeOffset.UnixEpoch, DateTimeOffset.UnixEpoch, 0, CostData,
        new("event", "2026-09-07T00:00:00Z", "system", "cost", "SYNTHETIC-001", ForgeApproachKernelClient.KernelName, $"git:{Source}"),
        Array.Empty<string>(), null, null, Binary, 100, new string('d', 64), 0, new string('e', 64), "forge-request");

    [Fact]
    public async Task Cost_forwards_resolved_inputs_and_returns_unchanged_canonical_data_with_context()
    {
        var host = new Mock<IRustKernelProcessHost>(MockBehavior.Strict);
        host.Setup(h => h.InvokeAsync<ForgeCostPayload, ForgeCostResult>(
            It.IsAny<string>(), ForgeApproachKernelClient.KernelName,
            It.Is<KernelInvocation<ForgeCostPayload>>(i => i.Action == "cost" && i.RequestId == "forge-request"
                && i.ContractPackVersion == "1.0.0" && i.ModuleApiVersion == "1.0.0" && i.Payload == Cost),
            It.IsAny<CancellationToken>())).ReturnsAsync(Success());
        var client = new ForgeApproachKernelClient(host.Object, Options.Create(OptionsForTest()));
        var result = await client.CostAsync(Cost, Context);
        Assert.Equal(CostData, result.Data);
        Assert.Equal(County, result.Provenance.CountyId);
        Assert.Equal("SYNTHETIC-001", result.Provenance.ParcelId);
        Assert.Equal(Source, result.Provenance.SourceCommit);
        Assert.Equal(Binary, result.Provenance.ExecutableSha256);
        host.VerifyAll();
    }

    [Fact]
    public async Task Historical_or_disabled_runtime_never_receives_new_action()
    {
        var host = new Mock<IRustKernelProcessHost>(MockBehavior.Strict);
        foreach (var options in new[] { new RustKernelsOptions(), new RustKernelsOptions { Enabled = false },
            new RustKernelsOptions { ValuationKernelPath = "historical.exe", ValuationKernelSourceCommit = Source,
                ValuationKernelExecutableSha256 = Binary } })
        {
            var client = new ForgeApproachKernelClient(host.Object, Options.Create(options));
            var error = await Assert.ThrowsAsync<ForgeApproachException>(() => client.CostAsync(Cost, Context));
            Assert.Equal("CANONICAL_RUNTIME_UNAVAILABLE", error.Code);
        }
        host.VerifyNoOtherCalls();
    }

    [Fact]
    public void New_artifact_configuration_does_not_repin_legacy_valuate_defaults()
    {
        var options = OptionsForTest();
        Assert.Equal(RustKernelsOptions.ForgeValuationCanonicalSourceCommit, options.ValuationKernelSourceCommit);
        Assert.Equal(RustKernelsOptions.ForgeValuationExecutableSha256, options.ValuationKernelExecutableSha256);
        Assert.Contains("/valuation/", options.ValuationKernelPath);
        Assert.Equal(Source, options.CostIncomeKernelSourceCommit);
        Assert.Equal(Binary, options.CostIncomeKernelExecutableSha256);
    }

    [Fact]
    public async Task Unavailable_process_produces_no_fallback_result()
    {
        var host = new Mock<IRustKernelProcessHost>();
        host.Setup(h => h.InvokeAsync<ForgeCostPayload, ForgeCostResult>(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<KernelInvocation<ForgeCostPayload>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Success() with { Success = false, Data = null, AuditEvent = null, FailureMode = KernelFailureMode.ExecutableNotFound });
        var client = new ForgeApproachKernelClient(host.Object, Options.Create(OptionsForTest()));
        var error = await Assert.ThrowsAsync<ForgeApproachException>(() => client.CostAsync(Cost, Context));
        Assert.Equal("CANONICAL_RUNTIME_UNAVAILABLE", error.Code);
    }

    [Fact]
    public async Task Mismatched_response_identity_fails_closed()
    {
        foreach (var response in new[] {
            Success() with { RequestId = "other-request" },
            Success() with { KernelBinarySha256 = new string('f',64) },
            Success() with { Data = CostData with { ParcelId = "OTHER" } },
            Success() with { AuditEvent = Success().AuditEvent! with { Hash = $"git:{Source}+dirty" } },
            Success() with { AuditEvent = Success().AuditEvent! with { Action = "income" } },
            Success() with { InputHash = "missing" },
        }) {
            var host = new Mock<IRustKernelProcessHost>();
            host.Setup(h => h.InvokeAsync<ForgeCostPayload, ForgeCostResult>(It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<KernelInvocation<ForgeCostPayload>>(), It.IsAny<CancellationToken>())).ReturnsAsync(response);
            var client = new ForgeApproachKernelClient(host.Object, Options.Create(OptionsForTest()));
            var error = await Assert.ThrowsAsync<ForgeApproachException>(() => client.CostAsync(Cost, Context));
            Assert.Equal("CANONICAL_PROVENANCE_MISMATCH", error.Code);
        }
    }

    [Fact]
    public async Task County_or_parcel_context_missing_never_invokes_runtime()
    {
        var host = new Mock<IRustKernelProcessHost>(MockBehavior.Strict);
        var client = new ForgeApproachKernelClient(host.Object, Options.Create(OptionsForTest()));
        await Assert.ThrowsAsync<ForgeApproachException>(() => client.CostAsync(Cost, Context with { CountyId = Guid.Empty }));
        await Assert.ThrowsAsync<ForgeApproachException>(() => client.CostAsync(Cost, Context with { ParcelId = "OTHER" }));
        host.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task Income_forwards_percentage_inputs_and_preserves_canonical_expense_ratio()
    {
        var payload = new ForgeIncomePayload("1.0.0", "SYNTHETIC-001", 120000, 5, 6000,
            new(10000, 5000, 5000, 5000, 3000, 1000, 1000), 6, 1.1m);
        var data = new ForgeIncomeResult("1.0.0", "SYNTHETIC-001", 120000, 6000, 6000,
            120000, 30000, 25, 90000, 6, 1.1m, 1500000, 1650000, 13.75m, 6, "Moderate");
        var response = new KernelInvocationResult<ForgeIncomeResult>(true,
            ForgeApproachKernelClient.KernelName, $"git:{Source}", new string('c', 64),
            DateTimeOffset.UnixEpoch, DateTimeOffset.UnixEpoch, 0, data,
            Success().AuditEvent! with { Action = "income" }, Array.Empty<string>(), null, null,
            Binary, 100, new string('d', 64), 0, new string('e', 64), Context.RequestId);
        var host = new Mock<IRustKernelProcessHost>(MockBehavior.Strict);
        host.Setup(h => h.InvokeAsync<ForgeIncomePayload, ForgeIncomeResult>(It.IsAny<string>(),
            ForgeApproachKernelClient.KernelName,
            It.Is<KernelInvocation<ForgeIncomePayload>>(i => i.Action == "income" && i.Payload == payload
                && i.RequestId == Context.RequestId && i.ContractPackVersion == "1.0.0" && i.ModuleApiVersion == "1.0.0"),
            It.IsAny<CancellationToken>())).ReturnsAsync(response);

        var result = await new ForgeApproachKernelClient(host.Object, Options.Create(OptionsForTest()))
            .IncomeAsync(payload, Context);
        Assert.Same(data, result.Data);
        Assert.Equal(25m, result.Data.ExpenseRatio);
        Assert.Equal(County, result.Provenance.CountyId);
        host.VerifyAll();
    }

    [Fact]
    public void Optional_validation_preserves_legacy_envelopes_and_typed_failure_shape()
    {
        var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var legacy = JsonSerializer.Deserialize<KernelResponse<ForgeCostResult>>(
            """{"success":false,"error":"Unknown action","data":null,"auditEvent":null}""", json)!;
        Assert.False(legacy.Success);
        Assert.Null(legacy.Validation);
        Assert.Null(Success().Validation);

        var typed = JsonSerializer.Deserialize<KernelResponse<ForgeCostResult>>(
            """{"success":false,"error":"Invalid input","data":null,"auditEvent":null,"validation":{"code":"INVALID_INPUT","field":"squareFeet","message":"Must be positive"}}""", json)!;
        Assert.Equal(new KernelValidationFailure("INVALID_INPUT", "squareFeet", "Must be positive"), typed.Validation);
        Assert.Null(typed.Data);
        Assert.Null(typed.AuditEvent);
        var invocation = Success() with { Success = false, Data = null, AuditEvent = null, Validation = typed.Validation };
        Assert.Equal(typed.Validation, JsonSerializer.Deserialize<KernelInvocationResult<ForgeCostResult>>(
            JsonSerializer.Serialize(invocation, json), json)!.Validation);
    }

    [Fact]
    public void Income_result_without_expense_ratio_is_not_a_valid_transport_success()
    {
        var json = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var data = new ForgeIncomeResult("1.0.0", "SYNTHETIC-001", 100, 0, 0,
            100, 25, 25, 75, 5, 1, 1500, 1500, 15, 5, "Moderate");
        var incomplete = JsonSerializer.SerializeToNode(data, json)!.AsObject();
        Assert.True(incomplete.Remove("expenseRatio"));
        Assert.Throws<JsonException>(() => incomplete.Deserialize<ForgeIncomeResult>(json));
    }

    [Fact]
    public async Task Typed_rejection_does_not_expose_process_details_to_feature_callers()
    {
        var host = new Mock<IRustKernelProcessHost>();
        host.Setup(h => h.InvokeAsync<ForgeCostPayload, ForgeCostResult>(It.IsAny<string>(), It.IsAny<string>(),
            It.IsAny<KernelInvocation<ForgeCostPayload>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Success() with { Success = false, Data = null, AuditEvent = null,
                FailureMode = KernelFailureMode.KernelReportedError, ErrorMessage = "private process detail",
                Validation = new("INVALID_INPUT", "squareFeet", "private process detail") });
        var client = new ForgeApproachKernelClient(host.Object, Options.Create(OptionsForTest()));
        var error = await Assert.ThrowsAsync<ForgeApproachException>(() => client.CostAsync(Cost, Context));
        Assert.Equal("CANONICAL_INPUT_REJECTED", error.Code);
        Assert.DoesNotContain("private process detail", error.Message);
    }

    [Fact]
    public void Reported_failure_forwards_bounded_validation_without_success_artifacts()
    {
        var result = MapHostFailure(KernelFailureMode.KernelReportedError,
            new("INVALID_INPUT", "expenses.insurance", "Expected a nonnegative number"));

        Assert.Equal(new KernelValidationFailure("INVALID_INPUT", "expenses.insurance",
            "Expected a nonnegative number"), result.Validation);
        Assert.False(result.Success);
        Assert.Null(result.Data);
        Assert.Null(result.AuditEvent);
        Assert.Null(result.KernelVersion);
        Assert.Equal("Kernel reported failure.", result.ErrorMessage);
        Assert.Empty(result.Warnings);
        Assert.Equal("forge-request", result.RequestId);
    }

    [Fact]
    public void Reported_failure_accepts_transport_limits_without_truncation()
    {
        var result = MapHostFailure(KernelFailureMode.KernelReportedError,
            new(new string('A', 64), new string('a', 128), new string('m', 512)));
        Assert.NotNull(result.Validation);
        Assert.Equal(new string('A', 64), result.Validation.Code);
        Assert.Equal(new string('a', 128), result.Validation.Field);
        Assert.Equal(new string('m', 512), result.Validation.Message);
    }

    public static IEnumerable<object?[]> InvalidTransportValidation()
    {
        yield return new object?[] { null };
        yield return new object?[] { new KernelValidationFailure(null!, "field", "message") };
        yield return new object?[] { new KernelValidationFailure("INVALID_INPUT", null!, "message") };
        yield return new object?[] { new KernelValidationFailure("INVALID_INPUT", "field", null!) };
        yield return new object?[] { new KernelValidationFailure("", "field", "message") };
        yield return new object?[] { new KernelValidationFailure("INVALID_INPUT", "", "message") };
        yield return new object?[] { new KernelValidationFailure("INVALID_INPUT", "field", "   ") };
        yield return new object?[] { new KernelValidationFailure(new string('A', 65), "field", "message") };
        yield return new object?[] { new KernelValidationFailure("INVALID_INPUT", new string('a', 129), "message") };
        yield return new object?[] { new KernelValidationFailure("INVALID_INPUT", "field", new string('m', 513)) };
        yield return new object?[] { new KernelValidationFailure("bad-code", "field", "message") };
        yield return new object?[] { new KernelValidationFailure("INVALID_INPUT", "field\nforged", "message") };
        yield return new object?[] { new KernelValidationFailure("INVALID_INPUT", "field", "message\nforged") };
        yield return new object?[] { new KernelValidationFailure("INVALID_INPUT", "field", "message\0forged") };
    }

    [Theory]
    [MemberData(nameof(InvalidTransportValidation))]
    public void Invalid_or_missing_validation_keeps_generic_failure(KernelValidationFailure? validation)
    {
        var result = MapHostFailure(KernelFailureMode.KernelReportedError, validation);
        Assert.Null(result.Validation);
        Assert.Equal(KernelFailureMode.KernelReportedError, result.FailureMode);
        Assert.Equal("Kernel reported failure.", result.ErrorMessage);
        Assert.Null(result.Data);
        Assert.Null(result.AuditEvent);
    }

    [Fact]
    public void Other_failure_modes_never_forward_validation()
    {
        foreach (var mode in Enum.GetValues<KernelFailureMode>().Where(m => m != KernelFailureMode.KernelReportedError))
        {
            var result = MapHostFailure(mode, new("INVALID_INPUT", "squareFeet", "Must be positive"));
            Assert.Null(result.Validation);
            Assert.Equal(mode, result.FailureMode);
            Assert.Null(result.Data);
            Assert.Null(result.AuditEvent);
        }
    }

    [Fact]
    public async Task Legacy_process_failure_has_no_validation_and_keeps_generic_sanitation()
    {
        // Same local passthrough pattern as RustKernelProcessHostTests. This tests response
        // handling, not an admitted Forge artifact; no manifest or identity pin is overridden.
        var executable = OperatingSystem.IsWindows()
            ? Path.Combine(Environment.SystemDirectory, "more.com") : "/bin/cat";
        Assert.True(File.Exists(executable), "Existing local passthrough fixture must be available.");
        var host = new RustKernelProcessHost(Options.Create(new RustKernelsOptions()),
            NullLogger<RustKernelProcessHost>.Instance);
        var result = await host.InvokeAsync<ForgeCostPayload, ForgeCostResult>(executable,
            "transport-fixture", new("1.0.0", "1.0.0", Context.RequestId, "cost", Cost));
        Assert.Equal(KernelFailureMode.KernelReportedError, result.FailureMode);
        Assert.Equal("Kernel reported failure.", result.ErrorMessage);
        Assert.Null(result.Validation);
        Assert.Null(result.Data);
        Assert.Null(result.AuditEvent);
        Assert.DoesNotContain("SYNTHETIC-001", result.ErrorMessage!);
        Assert.Matches("^[a-f0-9]{64}$", result.StdoutSha256!);
    }

    private static KernelInvocationResult<ForgeCostResult> MapHostFailure(
        KernelFailureMode mode, KernelValidationFailure? validation)
    {
        // Exercise the host's real failure projection, as existing host tests exercise its
        // private transport guards. The old signature remains callable so the RED is missing
        // forwarded data, not a reflection/signature error. Process dispatch still needs its
        // admitted-artifact integration test after publication authority is resolved.
        var method = typeof(RustKernelProcessHost).GetMethod("Fail", BindingFlags.Static | BindingFlags.NonPublic)!
            .MakeGenericMethod(typeof(ForgeCostResult));
        object?[] existing = { mode, "Kernel reported failure.", DateTimeOffset.UnixEpoch,
            Stopwatch.StartNew(), "transport-fixture", new string('c', 64), Binary, Context.RequestId,
            100, new string('d', 64), 0, new string('e', 64) };
        var arguments = method.GetParameters().Length == existing.Length
            ? existing : existing.Concat(new object?[] { validation }).ToArray();
        return Assert.IsType<KernelInvocationResult<ForgeCostResult>>(method.Invoke(null, arguments));
    }

    [Fact]
    public void Native_receipt_binds_successful_main_run_attempt_artifact_and_all_downloaded_bytes()
    {
        var receipt = NativeReceipt();
        Assert.True(ReceiptMatches(receipt));
        foreach (var key in new[] { "repository", "workflowPath", "event", "branch", "conclusion",
            "runId", "runAttempt", "artifactId", "artifactName", "protectedCommit", "archiveSha256",
            "manifestSha256", "executableSha256", "transport" })
        {
            var changed = NativeReceipt();
            changed[key] = "other";
            Assert.False(ReceiptMatches(changed), key);
            changed.Remove(key);
            Assert.False(ReceiptMatches(changed), "missing " + key);
        }
    }

    private static Dictionary<string, object> NativeReceipt() => new()
    {
        ["schemaVersion"] = 1, ["transport"] = "github-actions-windows-artifact@1",
        ["repository"] = "bsvalues/terrafusion-forge", ["workflowPath"] = ".github/workflows/suite-ci.yml",
        ["event"] = "push", ["branch"] = "main", ["conclusion"] = "success",
        ["runId"] = "123", ["runAttempt"] = "2", ["artifactId"] = "456",
        ["artifactName"] = "terraforge-valuation-kernel-windows-x64-" + Source,
        ["protectedCommit"] = Source, ["archiveSha256"] = new string('c', 64),
        ["manifestSha256"] = new string('d', 64), ["executableSha256"] = Binary,
    };

    private static bool ReceiptMatches(Dictionary<string, object> receipt)
    {
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(receipt));
        var method = typeof(RustKernelProcessHost).GetMethod("CostIncomeReceiptMatches", BindingFlags.Static | BindingFlags.NonPublic);
        Assert.NotNull(method);
        return Assert.IsType<bool>(method.Invoke(null, new object[] { document.RootElement, Source,
            "123", "2", "456", new string('c', 64), new string('d', 64), Binary }));
    }

    [Fact]
    public async Task Canonical_failure_keeps_middleware_cid_in_response_audit_and_metric()
    {
        var records = new List<(string Action, string Details, bool Success)>();
        var audit = new Mock<TerraFusion.Abstractions.Interfaces.IAuditLogger>();
        audit.Setup(a => a.LogAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<bool>()))
            .Callback<string, string, bool>((action, details, success) => records.Add((action, details, success)))
            .Returns(Task.CompletedTask);
        var context = new DefaultHttpContext { TraceIdentifier = "different-transport-id" };
        context.Items["CorrelationId"] = "tf-middleware-real-request";
        context.Request.Headers["X-Correlation-ID"] = "rejected-inbound-id";
        var controller = new CostForgeController(null!, null!, null!, audit.Object,
            NullLogger<CostForgeController>.Instance) { ControllerContext = new ControllerContext { HttpContext = context } };
        var begin = typeof(CostForgeController).GetMethod("BeginCanonicalApproach", BindingFlags.Instance | BindingFlags.NonPublic);
        Assert.NotNull(begin);
        begin.Invoke(controller, new object[] { "income" });
        var failure = typeof(CostForgeController).GetMethod("CanonicalFailure", BindingFlags.Instance | BindingFlags.NonPublic)!;
        var result = await Assert.IsAssignableFrom<Task<ObjectResult>>(failure.Invoke(controller,
            new object[] { new ForgeApproachException("CANONICAL_INPUT_REJECTED", "Invalid rate.") }));
        Assert.Equal(422, result.StatusCode);
        Assert.Equal("tf-middleware-real-request", context.TraceIdentifier);
        Assert.Equal(context.TraceIdentifier, context.Request.Headers["X-Correlation-ID"]);
        Assert.Equal(context.TraceIdentifier, context.Response.Headers["X-Correlation-ID"]);
        using var body = JsonDocument.Parse(JsonSerializer.Serialize(result.Value));
        Assert.Equal(context.TraceIdentifier, body.RootElement.GetProperty("correlationId").GetString());
        var record = Assert.Single(records);
        Assert.False(record.Success);
        using var metric = JsonDocument.Parse(record.Details);
        Assert.Equal("income", metric.RootElement.GetProperty("operation").GetString());
        Assert.Equal(context.TraceIdentifier, metric.RootElement.GetProperty("correlationId").GetString());
        Assert.Equal("CANONICAL_INPUT_REJECTED", metric.RootElement.GetProperty("errorCategory").GetString());
        Assert.Equal(1, metric.RootElement.GetProperty("errorCount").GetInt32());
        Assert.True(metric.RootElement.GetProperty("durationMs").GetDouble() >= 0);
    }
}
