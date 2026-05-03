using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

/// <summary>
/// Invokes a Rust kernel binary as a short-lived subprocess. Stdin: JSON request. Stdout: JSON response.
/// Captures stderr. Enforces timeout. Maps all failure modes to typed <see cref="KernelFailureMode"/>.
/// </summary>
public class RustKernelProcessHost : IRustKernelProcessHost
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
    };

    private readonly IOptions<RustKernelsOptions> _options;
    private readonly ILogger<RustKernelProcessHost> _logger;

    public RustKernelProcessHost(IOptions<RustKernelsOptions> options, ILogger<RustKernelProcessHost> logger)
    {
        _options = options;
        _logger = logger;
    }

    public async Task<KernelInvocationResult<TResp>> InvokeAsync<TReq, TResp>(
        string executablePath,
        string kernelName,
        KernelInvocation<TReq> invocation,
        CancellationToken ct = default)
    {
        var startedAt = DateTimeOffset.UtcNow;
        var sw = Stopwatch.StartNew();

        var requestJson = JsonSerializer.Serialize(invocation, JsonOpts);
        var inputHash = ComputeSha256(requestJson);

        if (!File.Exists(executablePath))
        {
            sw.Stop();
            return Fail<TResp>(KernelFailureMode.ExecutableNotFound,
                $"Kernel executable not found: {executablePath}",
                startedAt, sw, kernelName, inputHash, kernelBinarySha256: null);
        }

        try
        {
            var kernelBinarySha256 = ComputeFileSha256(executablePath);
            var psi = new ProcessStartInfo
            {
                FileName = executablePath,
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };

            using var process = new Process { StartInfo = psi };
            if (!process.Start())
            {
                sw.Stop();
                return Fail<TResp>(KernelFailureMode.ExecutableNotFound,
                    "Process.Start returned false",
                    startedAt, sw, kernelName, inputHash, kernelBinarySha256);
            }

            // Write stdin and close it so the kernel sees EOF and proceeds.
            await process.StandardInput.WriteAsync(requestJson);
            process.StandardInput.Close();

            // Read stdout and stderr concurrently while enforcing timeout.
            var stdoutTask = process.StandardOutput.ReadToEndAsync();
            var stderrTask = process.StandardError.ReadToEndAsync();

            var timeoutMs = _options.Value.TimeoutMs;
            using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
            timeoutCts.CancelAfter(timeoutMs);

            var exitTask = process.WaitForExitAsync(timeoutCts.Token);

            try
            {
                await exitTask;
            }
            catch (OperationCanceledException)
            {
                try { process.Kill(entireProcessTree: true); } catch { /* best effort */ }
                sw.Stop();
                return Fail<TResp>(KernelFailureMode.Timeout,
                    $"Kernel exceeded timeout of {timeoutMs}ms",
                    startedAt, sw, kernelName, inputHash, kernelBinarySha256);
            }

            var stdout = await stdoutTask;
            var stderr = await stderrTask;
            sw.Stop();

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("Kernel {KernelName} exited with code {ExitCode}. stderr: {Stderr}",
                    kernelName, process.ExitCode, stderr);
                return Fail<TResp>(KernelFailureMode.NonZeroExit,
                    $"Exit code {process.ExitCode}. stderr: {stderr}",
                    startedAt, sw, kernelName, inputHash, kernelBinarySha256);
            }

            KernelResponse<TResp>? parsed;
            try
            {
                parsed = JsonSerializer.Deserialize<KernelResponse<TResp>>(stdout, JsonOpts);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Kernel {KernelName} returned non-JSON stdout: {Stdout}", kernelName, stdout);
                return Fail<TResp>(KernelFailureMode.InvalidJsonResponse,
                    $"JSON parse failed: {ex.Message}. stdout: {stdout}",
                    startedAt, sw, kernelName, inputHash, kernelBinarySha256);
            }

            if (parsed == null)
            {
                return Fail<TResp>(KernelFailureMode.InvalidJsonResponse,
                    "Null response after deserialization",
                    startedAt, sw, kernelName, inputHash, kernelBinarySha256);
            }

            if (!parsed.Success)
            {
                return Fail<TResp>(KernelFailureMode.KernelReportedError,
                    parsed.Error ?? "Kernel reported failure with no error message",
                    startedAt, sw, kernelName, inputHash, kernelBinarySha256);
            }

            var warnings = string.IsNullOrWhiteSpace(stderr)
                ? Array.Empty<string>()
                : new[] { stderr };

            return new KernelInvocationResult<TResp>(
                Success: true,
                KernelName: kernelName,
                KernelVersion: parsed.AuditEvent?.Hash,
                InputHash: inputHash,
                StartedAt: startedAt,
                CompletedAt: startedAt.AddMilliseconds(sw.ElapsedMilliseconds),
                DurationMs: (int)sw.ElapsedMilliseconds,
                Data: parsed.Data,
                AuditEvent: parsed.AuditEvent,
                Warnings: warnings,
                FailureMode: null,
                ErrorMessage: null,
                KernelBinarySha256: kernelBinarySha256);
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex, "Unexpected error invoking kernel {KernelName}", kernelName);
            return Fail<TResp>(KernelFailureMode.NonZeroExit,
                $"Unexpected: {ex.Message}",
                startedAt, sw, kernelName, inputHash, kernelBinarySha256: null);
        }
    }

    private static KernelInvocationResult<TResp> Fail<TResp>(
        KernelFailureMode mode, string msg,
        DateTimeOffset startedAt, Stopwatch sw, string kernelName, string inputHash,
        string? kernelBinarySha256)
    {
        return new KernelInvocationResult<TResp>(
            Success: false,
            KernelName: kernelName,
            KernelVersion: null,
            InputHash: inputHash,
            StartedAt: startedAt,
            CompletedAt: startedAt.AddMilliseconds(sw.ElapsedMilliseconds),
            DurationMs: (int)sw.ElapsedMilliseconds,
            Data: default,
            AuditEvent: null,
            Warnings: Array.Empty<string>(),
            FailureMode: mode,
            ErrorMessage: msg,
            KernelBinarySha256: kernelBinarySha256);
    }

    private static string ComputeSha256(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
        var sb = new StringBuilder(64);
        foreach (var b in hash) sb.Append(b.ToString("x2"));
        return sb.ToString();
    }

    private static string ComputeFileSha256(string path)
    {
        using var stream = File.OpenRead(path);
        var hash = SHA256.HashData(stream);
        var sb = new StringBuilder(64);
        foreach (var b in hash) sb.Append(b.ToString("x2"));
        return sb.ToString();
    }
}
