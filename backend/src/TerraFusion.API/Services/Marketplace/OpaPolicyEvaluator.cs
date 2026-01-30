// =============================================================================
// OpaPolicyEvaluator.cs (PHASE B: MARKETPLACE)
// =============================================================================
// OPA sandbox hook for PluginLock policy evaluation.
// Executes `opa eval` against the generated pluginlock.policy.rego.
// Deterministic, fail-closed by default.
// =============================================================================

using System.Diagnostics;
using System.Text.Json;

namespace TerraFusion.API.Services.Marketplace;

/// <summary>
/// Policy evaluator interface for OPA sandbox integration.
/// </summary>
public interface IPolicyEvaluator
{
    /// <summary>
    /// Evaluate policy against input data.
    /// </summary>
    /// <param name="input">Input data for policy evaluation</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Tuple of (allow, trace) where trace contains evaluation details</returns>
    Task<(bool allow, string trace)> EvaluateAsync(object input, CancellationToken ct);
}

/// <summary>
/// OPA sandbox hook implementation.
/// Executes `opa eval` with the generated PluginLock rego file.
/// Deterministic, fail-closed.
/// </summary>
public sealed class OpaPolicyEvaluator : IPolicyEvaluator
{
    private readonly ILogger<OpaPolicyEvaluator> _log;
    private readonly IConfiguration _cfg;

    public OpaPolicyEvaluator(ILogger<OpaPolicyEvaluator> log, IConfiguration cfg)
    {
        _log = log;
        _cfg = cfg;
    }

    public async Task<(bool allow, string trace)> EvaluateAsync(object input, CancellationToken ct)
    {
        var enabled = string.Equals(_cfg["TF_MARKETPLACE_OPA_ENABLED"], "true", StringComparison.OrdinalIgnoreCase);
        if (!enabled)
        {
            return (true, "OPA disabled (TF_MARKETPLACE_OPA_ENABLED=false)");
        }

        var opa = _cfg["TF_OPA_PATH"] ?? "opa";
        var policy = _cfg["TF_PLUGINLOCK_POLICY_PATH"]
            ?? "docs/spec-lock/locks/pluginlock/pluginlock.v1/generated/pluginlock.policy.rego";

        // Query: data.terrafusion.pluginlock.allow
        var query = _cfg["TF_PLUGINLOCK_OPA_QUERY"] ?? "data.terrafusion.pluginlock.allow";

        var tempInput = Path.Combine(Path.GetTempPath(), $"tf-opa-input-{Guid.NewGuid():N}.json");
        try
        {
            await File.WriteAllTextAsync(
                tempInput,
                JsonSerializer.Serialize(new { input }, new JsonSerializerOptions { WriteIndented = false }),
                ct);

            var psi = new ProcessStartInfo
            {
                FileName = opa,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };
            psi.ArgumentList.Add("eval");
            psi.ArgumentList.Add("--format");
            psi.ArgumentList.Add("json");
            psi.ArgumentList.Add("--data");
            psi.ArgumentList.Add(policy);
            psi.ArgumentList.Add("--input");
            psi.ArgumentList.Add(tempInput);
            psi.ArgumentList.Add(query);

            using var p = Process.Start(psi);
            if (p == null)
            {
                _log.LogWarning("Failed to start OPA process - using fail-closed");
                return (false, "OPA process failed to start (fail-closed)");
            }

            var stdout = await p.StandardOutput.ReadToEndAsync(ct);
            var stderr = await p.StandardError.ReadToEndAsync(ct);
            await p.WaitForExitAsync(ct);

            if (p.ExitCode != 0)
            {
                _log.LogWarning("OPA eval failed (exit {Code}): {Err}", p.ExitCode, stderr);
                return (false, $"OPA eval failed: {stderr}");
            }

            // Parse allow from opa JSON: result[0].expressions[0].value == true
            var doc = JsonDocument.Parse(stdout);
            if (!doc.RootElement.TryGetProperty("result", out var result) ||
                result.GetArrayLength() == 0)
            {
                _log.LogWarning("OPA returned empty result");
                return (false, "OPA returned empty result (fail-closed)");
            }

            var allow = result[0]
                .GetProperty("expressions")[0]
                .GetProperty("value")
                .GetBoolean();

            return (allow, stdout);
        }
        catch (Exception ex)
        {
            _log.LogWarning(ex, "OPA evaluation error - using fail-closed");
            return (false, $"OPA evaluation error: {ex.Message} (fail-closed)");
        }
        finally
        {
            try { if (File.Exists(tempInput)) File.Delete(tempInput); } catch { /* ignore */ }
        }
    }
}

/// <summary>
/// No-op policy evaluator for testing - always allows.
/// </summary>
public sealed class AllowAllPolicyEvaluator : IPolicyEvaluator
{
    public Task<(bool allow, string trace)> EvaluateAsync(object input, CancellationToken ct)
        => Task.FromResult((true, "allow-all (test policy)"));
}

/// <summary>
/// No-op policy evaluator for testing - always denies.
/// </summary>
public sealed class DenyAllPolicyEvaluator : IPolicyEvaluator
{
    public Task<(bool allow, string trace)> EvaluateAsync(object input, CancellationToken ct)
        => Task.FromResult((false, "deny-all (test policy)"));
}
