using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using TerraFusion.API.Configuration;

namespace TerraFusion.API.Services.Gpt;

public interface IGptGroundedAnswerProcessHost
{
    Task<GptGroundedAnswerValidation> ValidateAsync(string exchangeJson, CancellationToken cancellationToken = default);
}
public sealed record GptGroundedAnswerValidation(bool Succeeded, bool Accepted, string? NormalizedExchangeJson, string? FailureCode);

/// <summary>Executes verified in-memory snapshots only, never imports mutable staged paths.</summary>
public sealed class GptGroundedAnswerProcessHost(string sovereignRoot, string nodeExecutable, TimeSpan timeout, bool enabled = true)
    : IGptGroundedAnswerProcessHost, IGptGroundedContextProcessHost
{
    private const int MaxBytes = 1024 * 1024;
    private static readonly SemaphoreSlim Capacity = new(2, 2);

    public async Task<GptGroundedAnswerValidation> ValidateAsync(string exchangeJson, CancellationToken cancellationToken = default)
    {
        var outcome = await ExecuteAsync(exchangeJson, false, cancellationToken);
        return new(outcome is not null, outcome?.Accepted == true,
            outcome?.Accepted == true ? outcome.NormalizedExchangeJson : null,
            outcome is null ? "RUNTIME_UNAVAILABLE" : outcome.Accepted ? null : "ANSWER_REJECTED");
    }

    async Task<GptGroundedContextProcessResult> IGptGroundedContextProcessHost.ValidateAsync(string exchangeJson, CancellationToken cancellationToken)
    {
        var outcome = await ExecuteAsync(exchangeJson, true, cancellationToken);
        return new(outcome is not null, outcome?.Accepted == true,
            outcome?.Violations?.Select(value => new GptGroundedContextViolation(value.Class, value.Message)).ToArray() ?? [],
            outcome?.Accepted == true ? outcome.NormalizedExchangeJson : null,
            outcome is null ? null : GptGroundedAnswerRuntimeOptions.Artifacts[1].Sha256,
            outcome is null ? null : GptGroundedAnswerRuntimeOptions.Artifacts[1].Sha256,
            outcome is null ? null : GptGroundedAnswerRuntimeOptions.Artifacts[2].Sha256,
            outcome is null ? null : GptGroundedAnswerRuntimeOptions.Artifacts[2].Sha256,
            outcome is null ? "RUNTIME_UNAVAILABLE" : null);
    }

    private async Task<Outcome?> ExecuteAsync(string exchangeJson, bool contextOnly, CancellationToken cancellationToken)
    {
        if (!enabled || Encoding.UTF8.GetByteCount(exchangeJson) > MaxBytes || timeout <= TimeSpan.Zero || timeout > TimeSpan.FromSeconds(30)) return null;
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(timeout);
        var acquired = false;
        Process? process = null;
        try
        {
            await Capacity.WaitAsync(deadline.Token);
            acquired = true;
            var snapshots = Snapshot();
            var start = new ProcessStartInfo(nodeExecutable)
            {
                UseShellExecute = false, CreateNoWindow = true,
                RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true,
                StandardInputEncoding = new UTF8Encoding(false), StandardOutputEncoding = new UTF8Encoding(false),
            };
            // Do not inherit NODE_OPTIONS/preloads, provider credentials, proxy, or global runtime configuration.
            start.Environment.Clear();
            if (OperatingSystem.IsWindows()) start.Environment["SystemRoot"] = Environment.GetFolderPath(Environment.SpecialFolder.Windows);
            start.ArgumentList.Add("--max-old-space-size=64");
            start.ArgumentList.Add("--input-type=module");
            start.ArgumentList.Add("--eval");
            start.ArgumentList.Add(Runner);
            process = new Process { StartInfo = start };
            if (!process.Start()) return null;
            var outputTask = ReadBoundedAsync(process.StandardOutput, deadline.Token);
            var errorTask = ReadBoundedAsync(process.StandardError, deadline.Token);
            var payload = JsonSerializer.Serialize(new
            {
                answer = Encoding.UTF8.GetString(snapshots[0]), context = Encoding.UTF8.GetString(snapshots[1]),
                schema = Encoding.UTF8.GetString(snapshots[2]), exchange = exchangeJson, contextOnly,
            });
            await process.StandardInput.WriteAsync(payload.AsMemory(), deadline.Token);
            process.StandardInput.Close();
            await process.WaitForExitAsync(deadline.Token);
            var output = await outputTask;
            var errors = await errorTask;
            if (process.ExitCode != 0 || errors.Length != 0) return null;
            return JsonSerializer.Deserialize<Outcome>(output, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or JsonException
            or InvalidOperationException or OperationCanceledException or System.ComponentModel.Win32Exception
            or CryptographicException or ArgumentException or KeyNotFoundException)
        { return null; }
        finally
        {
            if (process is not null)
            {
                try { if (!process.HasExited) process.Kill(entireProcessTree: true); }
                catch (Exception exception) when (exception is InvalidOperationException or System.ComponentModel.Win32Exception) { }
                process.Dispose();
            }
            if (acquired) Capacity.Release();
        }
    }

    private byte[][] Snapshot()
    {
        var slot = Path.GetFullPath(Path.Combine(sovereignRoot, GptGroundedAnswerRuntimeOptions.ArtifactSlotRelativePath));
        RejectLinks(slot);
        var result = new List<byte[]>();
        foreach (var artifact in GptGroundedAnswerRuntimeOptions.Artifacts)
        {
            var path = Path.Combine(slot, artifact.Path);
            RejectLinks(path);
            var info = new FileInfo(path);
            if (!info.Exists || info.Length != artifact.Length) throw new IOException("Artifact identity unavailable.");
            var bytes = File.ReadAllBytes(path);
            if (bytes.Length != artifact.Length || Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant() != artifact.Sha256)
                throw new IOException("Artifact identity mismatch.");
            result.Add(bytes);
        }
        var receiptPath = Path.Combine(slot, "adoption.json");
        RejectLinks(receiptPath);
        if (new FileInfo(receiptPath).Length > 4096) throw new IOException("Adoption receipt invalid.");
        using var receipt = JsonDocument.Parse(File.ReadAllBytes(receiptPath));
        var root = receipt.RootElement;
        if (root.GetProperty("sourceCommit").GetString() != GptGroundedAnswerRuntimeOptions.ExpectedCommit
            || root.GetProperty("repository").GetString() != GptGroundedAnswerRuntimeOptions.ExpectedRepository
            || root.GetProperty("contract").GetString() != GptGroundedAnswerRuntimeOptions.Contract
            || root.GetProperty("specificationSha256").GetString() != GptGroundedAnswerRuntimeOptions.Artifacts[3].Sha256)
            throw new IOException("Adoption receipt mismatch.");
        return result.ToArray();
    }

    private static void RejectLinks(string path)
    {
        var cursor = Path.GetFullPath(path);
        while (cursor is not null)
        {
            if ((File.Exists(cursor) || Directory.Exists(cursor)) && File.GetAttributes(cursor).HasFlag(FileAttributes.ReparsePoint))
                throw new IOException("Artifact reparse points refused.");
            cursor = Path.GetDirectoryName(cursor);
        }
    }
    private static async Task<string> ReadBoundedAsync(StreamReader reader, CancellationToken cancellation)
    {
        var result = new StringBuilder();
        var buffer = new char[4096];
        int count;
        while ((count = await reader.ReadAsync(buffer, cancellation)) != 0)
        {
            if (result.Length + count > MaxBytes * 2) throw new IOException("Runtime output exceeded limit.");
            result.Append(buffer, 0, count);
        }
        return result.ToString();
    }
    private sealed record Violation(string Class, string Message);
    private sealed record Outcome(bool Accepted, Violation[]? Violations, string? NormalizedExchangeJson);
    private const string Runner = """
        import process from 'node:process';
        let input = ''; for await (const piece of process.stdin) { input += piece; if (input.length > 1200000) process.exit(2); }
        const payload = JSON.parse(input);
        globalThis.fetch = () => { throw new Error('network forbidden'); };
        const data = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64');
        const contextUrl = data(payload.context);
        const context = await import(contextUrl);
        const schema = JSON.parse(payload.schema), exchange = JSON.parse(payload.exchange);
        let result;
        if (payload.contextOnly) {
          const violations = context.validateGptExchange(schema, exchange);
          result = {accepted: violations.length === 0, violations, normalizedExchangeJson: violations.length ? null : context.normalizeJson(exchange)};
        } else {
          const original = "'../grounded-context/project-gpt-grounded-context.mjs'";
          if (payload.answer.split(original).length !== 2) process.exit(3);
          const answer = await import(data(payload.answer.replace(original, JSON.stringify(contextUrl))));
          result = answer.projectGptGroundedAnswer(schema, exchange);
        }
        process.stdout.write(JSON.stringify(result));
        """;
}
