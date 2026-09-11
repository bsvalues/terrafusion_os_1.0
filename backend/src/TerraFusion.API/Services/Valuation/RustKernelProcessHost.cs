using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using TerraFusion.API.Configuration;
using TerraFusion.API.Services.Valuation.KernelContracts;

namespace TerraFusion.API.Services.Valuation;

/// <summary>Runs a manifest-verified kernel with bounded, sanitized process evidence.</summary>
public class RustKernelProcessHost : IRustKernelProcessHost
{
    private const string ForgeRepository = "bsvalues/terrafusion-forge";
    private const string ForgeAuthorityRepository = "bsvalues/terrafusion_os_1.0";
    private const string ForgeAuthorityFreezeCommit = "e6cbbe8aa05687a1d187531d63bef3cec8e57134";
    private const string ForgeContractDigestAlgorithm = "sha256(sorted path:sha256 newline)";
    private static readonly IReadOnlyDictionary<string, string> ForgeSourceSha256 =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["kernels/terraforge.kernel.valuation/Cargo.toml"] =
                "c27750c78f2ddf77e5cfca3fc6a020bd2bf5ddecb97fa10e44d2e20d2c5e2358",
            ["kernels/terraforge.kernel.valuation/Cargo.lock"] =
                "087367b4a37c7a55700b4f9bec1ac073d5c6e8cc3932f1a4220a9abbba0b48bd",
            ["kernels/terraforge.kernel.valuation/build.rs"] =
                "9220a3d4c6011d835c4fd45ef07cf34a109fe434527926d4e12848ebbae921f6",
            ["kernels/terraforge.kernel.valuation/src/main.rs"] =
                "3dbad9a2c89c061fccdfc2a0d05d7074a6b397bc05da6ee5e9a23844d209f4ae",
        };
    private static readonly IReadOnlyDictionary<string, string> ForgeContractSha256 =
        new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["crosscut.audit@1.0.0"] =
                "3a098f290ed21fb1b713ae4879b407d045c26f73ac88d7b009a2496266b3b86c",
            ["forge.valuation@1.0.0"] =
                "0e7db3fa3e01db4ba446ae67dbd8266384834e31cbe5ee6e699e7a44ca6c75cc",
        };

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
        var options = _options.Value;
        var requestJson = JsonSerializer.Serialize(invocation, JsonOpts);
        var requestBytes = Encoding.UTF8.GetBytes(requestJson);
        var inputHash = ComputeSha256(requestBytes);

        if (requestBytes.Length > options.MaxStdinBytes)
            return Fail<TResp>(KernelFailureMode.InputLimitExceeded, "Kernel input exceeded its byte limit.",
                startedAt, sw, kernelName, inputHash, null, invocation.RequestId);
        if (!File.Exists(executablePath))
            return Fail<TResp>(KernelFailureMode.ExecutableNotFound, "Kernel executable was not found.",
                startedAt, sw, kernelName, inputHash, null, invocation.RequestId);

        string? binarySha256 = null;
        if (string.Equals(kernelName, "terraforge.kernel.valuation", StringComparison.Ordinal))
        {
            var provenanceFailure = invocation.Action is "cost" or "income"
                ? ValidateCostIncomeKernelProvenance(executablePath)
                : ValidateValuationKernelProvenance(executablePath);
            if (provenanceFailure != null)
                return Fail<TResp>(KernelFailureMode.ProvenanceFailure, provenanceFailure.Value.Message,
                    startedAt, sw, kernelName, inputHash, provenanceFailure.Value.BinarySha256,
                    invocation.RequestId);
            binarySha256 = ComputeFileSha256(executablePath);
        }

        Process? process = null;
        try
        {
            binarySha256 ??= ComputeFileSha256(executablePath);
            var psi = CreateProcessStartInfo(executablePath);
            process = new Process { StartInfo = psi };
            if (!process.Start())
                return Fail<TResp>(KernelFailureMode.ProcessStartFailure, "Kernel process did not start.",
                    startedAt, sw, kernelName, inputHash, binarySha256, invocation.RequestId);
            if (options.TimeoutMs <= 0)
            {
                await KillAndAwaitAsync(process);
                return Fail<TResp>(KernelFailureMode.Timeout, "Kernel timeout must be positive.",
                    startedAt, sw, kernelName, inputHash, binarySha256, invocation.RequestId);
            }

            using var ioCts = new CancellationTokenSource();
            var outputLimit = new TaskCompletionSource(
                TaskCreationOptions.RunContinuationsAsynchronously);
            var stdoutTask = ReadBoundedAsync(
                "stdout", process.StandardOutput.BaseStream, options.MaxStdoutBytes, outputLimit, ioCts.Token);
            var stderrTask = ReadBoundedAsync(
                "stderr", process.StandardError.BaseStream, options.MaxStderrBytes, outputLimit, ioCts.Token);
            var outputTask = Task.WhenAll(stdoutTask, stderrTask);

            using var timeoutCts = new CancellationTokenSource(options.TimeoutMs);
            using var waitCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);
            try
            {
                await process.StandardInput.BaseStream.WriteAsync(requestBytes, waitCts.Token);
                await process.StandardInput.BaseStream.FlushAsync(waitCts.Token);
                process.StandardInput.Close();

                var exitTask = process.WaitForExitAsync(waitCts.Token);
                var completed = await Task.WhenAny(exitTask, outputLimit.Task);
                if (completed == outputLimit.Task)
                    await outputLimit.Task;
                await exitTask;
                await WaitForOutputDrainAsync(outputTask, waitCts.Token);
            }
            catch (OperationCanceledException)
            {
                ioCts.Cancel();
                await KillAndAwaitAsync(process);
                var mode = ct.IsCancellationRequested
                    ? KernelFailureMode.Cancellation
                    : KernelFailureMode.Timeout;
                var message = mode == KernelFailureMode.Cancellation
                    ? "Kernel invocation was cancelled."
                    : $"Kernel exceeded timeout of {options.TimeoutMs}ms.";
                return Fail<TResp>(mode, message, startedAt, sw, kernelName, inputHash,
                    binarySha256, invocation.RequestId);
            }
            catch (OutputLimitExceededException exception)
            {
                ioCts.Cancel();
                await KillAndAwaitAsync(process);
                try { await outputTask; } catch (Exception) { }
                return Fail<TResp>(KernelFailureMode.OutputLimitExceeded,
                    $"Kernel {exception.StreamName} exceeded its byte limit.",
                    startedAt, sw, kernelName, inputHash, binarySha256, invocation.RequestId,
                    exception.StreamName == "stdout" ? exception.ByteCount : 0,
                    exception.StreamName == "stdout" ? exception.Sha256 : null,
                    exception.StreamName == "stderr" ? exception.ByteCount : 0,
                    exception.StreamName == "stderr" ? exception.Sha256 : null);
            }

            BoundedBytes stdout;
            BoundedBytes stderr;
            try
            {
                stdout = await stdoutTask;
                stderr = await stderrTask;
            }
            catch (OutputLimitExceededException exception)
            {
                ioCts.Cancel();
                await KillAndAwaitAsync(process);
                return Fail<TResp>(KernelFailureMode.OutputLimitExceeded,
                    $"Kernel {exception.StreamName} exceeded its byte limit.",
                    startedAt, sw, kernelName, inputHash, binarySha256, invocation.RequestId,
                    exception.StreamName == "stdout" ? exception.ByteCount : 0,
                    exception.StreamName == "stdout" ? exception.Sha256 : null,
                    exception.StreamName == "stderr" ? exception.ByteCount : 0,
                    exception.StreamName == "stderr" ? exception.Sha256 : null);
            }

            if (process.ExitCode != 0)
            {
                _logger.LogWarning(
                    "Kernel {KernelName} exited with code {ExitCode}; stdout bytes {StdoutBytes}, stderr bytes {StderrBytes}.",
                    kernelName, process.ExitCode, stdout.ByteCount, stderr.ByteCount);
                return Fail<TResp>(KernelFailureMode.NonZeroExit,
                    $"Kernel exited with code {process.ExitCode}.",
                    startedAt, sw, kernelName, inputHash, binarySha256, invocation.RequestId,
                    stdout.ByteCount, stdout.Sha256, stderr.ByteCount, stderr.Sha256);
            }

            KernelResponse<TResp>? parsed;
            try
            {
                parsed = JsonSerializer.Deserialize<KernelResponse<TResp>>(
                    DecodeUtf8Strict(stdout.Bytes), JsonOpts);
            }
            catch (Exception exception) when (exception is JsonException or DecoderFallbackException)
            {
                _logger.LogWarning(
                    "Kernel {KernelName} returned invalid JSON; stdout bytes {StdoutBytes}, sha256 {StdoutSha256}.",
                    kernelName, stdout.ByteCount, stdout.Sha256);
                return Fail<TResp>(KernelFailureMode.InvalidJsonResponse,
                    "Kernel returned invalid JSON.", startedAt, sw, kernelName, inputHash, binarySha256,
                    invocation.RequestId,
                    stdout.ByteCount, stdout.Sha256, stderr.ByteCount, stderr.Sha256);
            }

            if (parsed is null)
                return Fail<TResp>(KernelFailureMode.InvalidJsonResponse, "Kernel returned a null response.",
                    startedAt, sw, kernelName, inputHash, binarySha256,
                    invocation.RequestId,
                    stdout.ByteCount, stdout.Sha256, stderr.ByteCount, stderr.Sha256);
            if (!parsed.Success)
                return Fail<TResp>(KernelFailureMode.KernelReportedError, "Kernel reported failure.",
                    startedAt, sw, kernelName, inputHash, binarySha256,
                    invocation.RequestId,
                    stdout.ByteCount, stdout.Sha256, stderr.ByteCount, stderr.Sha256, parsed.Validation);

            sw.Stop();
            return new KernelInvocationResult<TResp>(
                true, kernelName, parsed.AuditEvent?.Hash, inputHash, startedAt,
                startedAt.AddMilliseconds(sw.ElapsedMilliseconds), (int)sw.ElapsedMilliseconds,
                parsed.Data, parsed.AuditEvent, Array.Empty<string>(), null, null, binarySha256,
                stdout.ByteCount, stdout.Sha256, stderr.ByteCount, stderr.Sha256,
                invocation.RequestId);
        }
        catch (OperationCanceledException) when (ct.IsCancellationRequested)
        {
            if (process is not null)
                await KillAndAwaitAsync(process);
            return Fail<TResp>(KernelFailureMode.Cancellation, "Kernel invocation was cancelled.",
                startedAt, sw, kernelName, inputHash, binarySha256, invocation.RequestId);
        }
        catch (Exception exception)
        {
            if (process is not null)
                await KillAndAwaitAsync(process);
            _logger.LogError(
                "Kernel {KernelName} process failure ({ExceptionType}).",
                kernelName, exception.GetType().Name);
            return Fail<TResp>(KernelFailureMode.ProcessStartFailure, "Kernel process failed.",
                startedAt, sw, kernelName, inputHash, binarySha256, invocation.RequestId);
        }
        finally
        {
            process?.Dispose();
        }
    }

    private static ProcessStartInfo CreateProcessStartInfo(string executablePath)
    {
        var psi = new ProcessStartInfo
        {
            FileName = executablePath,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        var preserved = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var name in new[] { "SystemRoot", "WINDIR", "COMSPEC", "PATHEXT", "TEMP", "TMP", "HOME", "TMPDIR" })
            preserved[name] = Environment.GetEnvironmentVariable(name);
        psi.Environment.Clear();
        foreach (var pair in preserved.Where(pair => !string.IsNullOrWhiteSpace(pair.Value)))
            psi.Environment[pair.Key] = pair.Value!;
        return psi;
    }

    private static async Task<BoundedBytes> ReadBoundedAsync(
        string streamName,
        Stream stream,
        int maxBytes,
        TaskCompletionSource outputLimit,
        CancellationToken ct)
    {
        var buffer = new byte[4096];
        using var content = new MemoryStream();
        using var hash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
        var byteCount = 0;
        while (true)
        {
            var read = await stream.ReadAsync(buffer.AsMemory(), ct);
            if (read == 0)
                break;
            hash.AppendData(buffer, 0, read);
            byteCount += read;
            if (byteCount > maxBytes)
            {
                var exception = new OutputLimitExceededException(
                    streamName,
                    byteCount,
                    Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant());
                outputLimit.TrySetException(exception);
                throw exception;
            }
            content.Write(buffer, 0, read);
        }
        return new BoundedBytes(
            content.ToArray(), byteCount,
            Convert.ToHexString(hash.GetHashAndReset()).ToLowerInvariant());
    }

    private static async Task KillAndAwaitAsync(Process process)
    {
        try
        {
            if (!process.HasExited)
                process.Kill(entireProcessTree: true);
        }
        catch (InvalidOperationException) { }
        catch (System.ComponentModel.Win32Exception) { }

        try
        {
            using var exitCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
            await process.WaitForExitAsync(exitCts.Token);
        }
        catch (InvalidOperationException) { }
        catch (OperationCanceledException) { }
    }

    private static Task WaitForOutputDrainAsync(Task outputTask, CancellationToken ct) =>
        outputTask.WaitAsync(ct);

    private (string Message, string? BinarySha256)? ValidateValuationKernelProvenance(string executablePath)
    {
        var options = _options.Value;
        if (string.IsNullOrWhiteSpace(options.ValuationKernelManifestPath))
            return ("Valuation kernel provenance manifest is not configured.", null);
        if (!string.Equals(options.ValuationKernelArtifactType, RustKernelsOptions.ForgeValuationArtifactType, StringComparison.Ordinal)
            || !string.Equals(options.ValuationKernelProducerCommit, RustKernelsOptions.ForgeValuationProducerCommit, StringComparison.Ordinal)
            || !string.Equals(options.ValuationKernelSourceCommit, RustKernelsOptions.ForgeValuationCanonicalSourceCommit, StringComparison.Ordinal)
            || !string.Equals(options.ValuationKernelProducerManifestSha256, RustKernelsOptions.ForgeValuationProducerManifestSha256, StringComparison.OrdinalIgnoreCase)
            || !string.Equals(options.ValuationKernelExecutableSha256, RustKernelsOptions.ForgeValuationExecutableSha256, StringComparison.OrdinalIgnoreCase))
            return ("Valuation kernel provenance configuration did not match the admitted Forge artifact.", null);

        var manifestPath = ResolveRepositoryRelativePath(options.ValuationKernelManifestPath);
        if (!File.Exists(manifestPath))
            return ("Valuation kernel provenance manifest was not found.", null);

        string binarySha256;
        string manifestSha256;
        try
        {
            binarySha256 = ComputeFileSha256(executablePath);
            manifestSha256 = ComputeFileSha256(manifestPath);
        }
        catch
        {
            return ("Valuation kernel artifact could not be hashed.", null);
        }

        if (!string.Equals(binarySha256, RustKernelsOptions.ForgeValuationExecutableSha256, StringComparison.OrdinalIgnoreCase)
            || !string.Equals(binarySha256, options.ValuationKernelExecutableSha256, StringComparison.OrdinalIgnoreCase)
            || !string.Equals(manifestSha256, RustKernelsOptions.ForgeValuationProducerManifestSha256, StringComparison.OrdinalIgnoreCase)
            || !string.Equals(manifestSha256, options.ValuationKernelProducerManifestSha256, StringComparison.OrdinalIgnoreCase))
            return ("Valuation kernel provenance did not match the admitted Forge artifact.", binarySha256);

        try
        {
            using var manifest = JsonDocument.Parse(File.ReadAllText(manifestPath));
            var root = manifest.RootElement;
            var hashes = root.GetProperty("canonicalSourceIntegrity").GetProperty("files");
            var executable = root.GetProperty("executable");
            var build = root.GetProperty("build");
            if (root.GetProperty("schemaVersion").GetInt32() != 1
                || !string.Equals(root.GetProperty("artifactType").GetString(), RustKernelsOptions.ForgeValuationArtifactType, StringComparison.Ordinal)
                || !string.Equals(root.GetProperty("artifactType").GetString(), options.ValuationKernelArtifactType, StringComparison.Ordinal)
                || !string.Equals(root.GetProperty("repository").GetString(), ForgeRepository, StringComparison.Ordinal)
                || !string.Equals(root.GetProperty("producerCommit").GetString(), RustKernelsOptions.ForgeValuationProducerCommit, StringComparison.Ordinal)
                || !string.Equals(root.GetProperty("producerCommit").GetString(), options.ValuationKernelProducerCommit, StringComparison.Ordinal)
                || !string.Equals(root.GetProperty("canonicalSourceCommit").GetString(), RustKernelsOptions.ForgeValuationCanonicalSourceCommit, StringComparison.Ordinal)
                || !string.Equals(root.GetProperty("canonicalSourceCommit").GetString(), options.ValuationKernelSourceCommit, StringComparison.Ordinal)
                || !string.Equals(build.GetProperty("target").GetString(), "x86_64-unknown-linux-musl", StringComparison.Ordinal)
                || !string.Equals(executable.GetProperty("filename").GetString(), "terraforge-kernel-valuation", StringComparison.Ordinal)
                || !string.Equals(executable.GetProperty("filename").GetString(), Path.GetFileName(executablePath), StringComparison.Ordinal)
                || !string.Equals(executable.GetProperty("sha256").GetString(), binarySha256, StringComparison.OrdinalIgnoreCase)
                || !SourceHashesMatch(hashes)
                || !ContractsMatch(root.GetProperty("contracts")))
                return ("Valuation kernel provenance did not match the admitted Forge artifact.", binarySha256);
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or JsonException
            or KeyNotFoundException or InvalidOperationException or FormatException or OverflowException)
        {
            return ("Valuation kernel provenance manifest was invalid.", binarySha256);
        }
        return null;
    }

    private (string Message, string? BinarySha256)? ValidateCostIncomeKernelProvenance(string executablePath)
    {
        var options = _options.Value;
        var source = RustKernelsOptions.ForgeCostIncomeCanonicalSourceCommit;
        var producer = RustKernelsOptions.ForgeCostIncomeProducerCommit;
        var manifestSha = RustKernelsOptions.ForgeCostIncomeProducerManifestSha256;
        var binarySha = RustKernelsOptions.ForgeCostIncomeExecutableSha256;
        if (!options.Enabled || !IsLowerHex(source, 40) || !IsLowerHex(producer, 40)
            || !IsLowerHex(manifestSha, 64) || !IsLowerHex(binarySha, 64)
            || !IsLowerHex(RustKernelsOptions.ForgeCostIncomeSpecificationSha256, 64)
            || !IsLowerHex(RustKernelsOptions.ForgeCostIncomeSourceClosureSha256, 64)
            || !IsLowerHex(RustKernelsOptions.ForgeCostIncomeDependencyClosureSha256, 64)
            || !IsLowerHex(RustKernelsOptions.ForgeCostIncomeReceiptSha256, 64)
            || !IsLowerHex(RustKernelsOptions.ForgeCostIncomeArchiveSha256, 64)
            || !IsPositiveIdentifier(RustKernelsOptions.ForgeCostIncomeWorkflowRunId)
            || !IsPositiveIdentifier(RustKernelsOptions.ForgeCostIncomeWorkflowRunAttempt)
            || !IsPositiveIdentifier(RustKernelsOptions.ForgeCostIncomeArtifactId)
            || producer != source
            || source == RustKernelsOptions.ForgeValuationCanonicalSourceCommit)
            return ("Cost/Income artifact has not been admitted.", null);
        if (options.CostIncomeKernelSourceCommit != source || options.CostIncomeKernelProducerCommit != producer
            || options.CostIncomeKernelProducerManifestSha256 != manifestSha || options.CostIncomeKernelExecutableSha256 != binarySha
            || string.IsNullOrWhiteSpace(options.CostIncomeKernelPath) || string.IsNullOrWhiteSpace(options.CostIncomeKernelManifestPath)
            || string.IsNullOrWhiteSpace(options.CostIncomeKernelReceiptPath))
            return ("Cost/Income configuration did not match the admitted artifact.", null);
        try
        {
            var target = RustKernelsOptions.ForgeCostIncomeTarget;
            // This admission is specifically the existing native Windows Actions artifact.
            // A separate Linux publication receipt is not Windows execution authority.
            if (!OperatingSystem.IsWindows() || target != "x86_64-pc-windows-msvc")
                return ("Cost/Income artifact target did not match the native process platform.", null);
            var comparison = OperatingSystem.IsWindows() ? StringComparison.OrdinalIgnoreCase : StringComparison.Ordinal;
            if (!string.Equals(Path.GetFullPath(executablePath), ResolveRepositoryRelativePath(options.CostIncomeKernelPath), comparison))
                return ("Cost/Income executable path did not match its explicit configuration.", null);
            var manifestPath = ResolveRepositoryRelativePath(options.CostIncomeKernelManifestPath);
            var receiptPath = ResolveRepositoryRelativePath(options.CostIncomeKernelReceiptPath);
            var file = new FileInfo(manifestPath);
            var receiptFile = new FileInfo(receiptPath);
            if (!file.Exists || file.Length <= 0 || file.Length > 1024 * 1024
                || !receiptFile.Exists || receiptFile.Length <= 0 || receiptFile.Length > 64 * 1024
                || !CostIncomePathIsUnlinked(manifestPath) || !CostIncomePathIsUnlinked(executablePath)
                || !CostIncomePathIsUnlinked(receiptPath))
                return ("Cost/Income manifest or executable was unavailable or invalid.", null);
            var actualBinary = ComputeFileSha256(executablePath);
            if (actualBinary != binarySha || ComputeFileSha256(manifestPath) != manifestSha)
                return ("Cost/Income artifact bytes did not match the admitted identity.", actualBinary);
            using var manifest = JsonDocument.Parse(File.ReadAllBytes(manifestPath));
            if (!CostIncomeManifestMatches(manifest.RootElement, source, producer, binarySha,
                RustKernelsOptions.ForgeCostIncomeSpecificationSha256, RustKernelsOptions.ForgeCostIncomeSourceClosureSha256,
                RustKernelsOptions.ForgeCostIncomeDependencyClosureSha256, target, RustKernelsOptions.ForgeCostIncomeWorkflowRunId))
                return ("Cost/Income manifest did not match its admitted source and dependency closure.", actualBinary);
            var receiptBytes = File.ReadAllBytes(receiptPath);
            if (ComputeSha256(receiptBytes) != RustKernelsOptions.ForgeCostIncomeReceiptSha256)
                return ("Cost/Income producer receipt bytes did not match the admitted identity.", actualBinary);
            // UTF-8 BOM is permitted without changing the exact-byte digest above.
            var receiptJson = Encoding.UTF8.GetString(receiptBytes).TrimStart('\uFEFF');
            using var receipt = JsonDocument.Parse(receiptJson);
            if (!CostIncomeReceiptMatches(receipt.RootElement, source,
                RustKernelsOptions.ForgeCostIncomeWorkflowRunId, RustKernelsOptions.ForgeCostIncomeWorkflowRunAttempt,
                RustKernelsOptions.ForgeCostIncomeArtifactId, RustKernelsOptions.ForgeCostIncomeArchiveSha256, manifestSha, binarySha))
                return ("Cost/Income producer receipt did not match the admitted native artifact.", actualBinary);
            return null;
        }
        catch (Exception exception) when (exception is IOException or UnauthorizedAccessException or JsonException
            or KeyNotFoundException or InvalidOperationException or FormatException or ArgumentException)
        {
            return ("Cost/Income provenance could not be verified.", null);
        }
    }

    private static bool CostIncomePathIsUnlinked(string path)
    {
        for (string? current = Path.GetFullPath(path); current != null; current = Path.GetDirectoryName(current))
            if ((File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0) return false;
        return true;
    }

    private static bool IsPositiveIdentifier(string value) => value.Length is >= 1 and <= 20
        && value[0] != '0' && value.All(c => c is >= '0' and <= '9');

    private static bool CostIncomeReceiptMatches(JsonElement root, string source, string runId, string runAttempt,
        string artifactId, string archiveSha, string manifestSha, string binarySha)
    {
        try
        {
            return root.GetProperty("schemaVersion").GetInt32() == 1
                && root.GetProperty("transport").GetString() == "github-actions-windows-artifact@1"
                && root.GetProperty("repository").GetString() == ForgeRepository
                && root.GetProperty("workflowPath").GetString() == ".github/workflows/suite-ci.yml"
                && root.GetProperty("event").GetString() == "push" && root.GetProperty("branch").GetString() == "main"
                && root.GetProperty("conclusion").GetString() == "success"
                && root.GetProperty("runId").GetString() == runId && root.GetProperty("runAttempt").GetString() == runAttempt
                && root.GetProperty("artifactId").GetString() == artifactId
                && root.GetProperty("artifactName").GetString() == $"terraforge-valuation-kernel-windows-x64-{source}"
                && root.GetProperty("protectedCommit").GetString() == source
                && root.GetProperty("archiveSha256").GetString() == archiveSha
                && root.GetProperty("manifestSha256").GetString() == manifestSha
                && root.GetProperty("executableSha256").GetString() == binarySha;
        }
        catch (Exception exception) when (exception is JsonException or KeyNotFoundException or InvalidOperationException or FormatException)
        {
            return false;
        }
    }

    private static bool CostIncomeManifestMatches(JsonElement root, string source, string producer, string binarySha,
        string specSha, string sourceClosureSha, string dependenciesSha, string target, string workflowRunId)
    {
        const string specPath = "operations/work-orders/EO-TF-FORGE-COST-INCOME-001.md";
        const string crate = "kernels/terraforge.kernel.valuation/";
        try
        {
            if (root.GetProperty("schemaVersion").GetInt32() != 1 || root.GetProperty("repository").GetString() != ForgeRepository
                || root.GetProperty("canonicalSourceCommit").GetString() != source || root.GetProperty("producerCommit").GetString() != producer
                || !ContractsMatch(root.GetProperty("contracts"))) return false;
            var exchanges = root.GetProperty("capabilityExchanges");
            if (exchanges.GetArrayLength() != 2 || exchanges[0].GetString() != "forge.cost@1.0.0"
                || exchanges[1].GetString() != "forge.income@1.0.0") return false;
            var spec = root.GetProperty("specification");
            if (spec.GetProperty("path").GetString() != specPath || spec.GetProperty("sha256").GetString() != specSha
                || spec.GetProperty("sourceCommit").GetString() != source || spec.GetProperty("authorityRepository").GetString() != ForgeAuthorityRepository
                || spec.GetProperty("workOrder").GetString() != "WO-EO-TF-FORGE-COST-INCOME-001") return false;
            var files = root.GetProperty("canonicalSourceIntegrity").GetProperty("files");
            var expectedPaths = new[] { crate + "Cargo.toml", crate + "Cargo.lock", crate + "build.rs",
                crate + "src/main.rs", crate + "src/approaches.rs", crate + "tests/approaches.rs", specPath };
            if (files.EnumerateObject().Count() != expectedPaths.Length || expectedPaths.Any(path =>
                !files.TryGetProperty(path, out var value) || value.ValueKind != JsonValueKind.String || !IsLowerHex(value.GetString(), 64))
                || files.GetProperty(specPath).GetString() != specSha) return false;
            var sourceLines = expectedPaths.Order(StringComparer.Ordinal).Select(path => path + ":" + files.GetProperty(path).GetString());
            if (ComputeSha256(Encoding.UTF8.GetBytes(string.Join("\n", sourceLines) + "\n")) != sourceClosureSha) return false;
            var dependencies = root.GetProperty("dependencyClosure");
            if (dependencies.GetArrayLength() is < 1 or > 512) return false;
            var dependencyLines = new HashSet<string>(StringComparer.Ordinal);
            foreach (var dependency in dependencies.EnumerateArray())
            {
                var name = dependency.GetProperty("name").GetString();
                var version = dependency.GetProperty("version").GetString();
                var registry = dependency.GetProperty("source").GetString();
                var checksum = dependency.GetProperty("checksum").GetString();
                if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(version) || name.Length > 128 || version.Length > 128
                    || name.Any(c => !(char.IsAsciiLetterOrDigit(c) || c is '_' or '-'))
                    || version.Any(c => !(char.IsAsciiLetterOrDigit(c) || c is '.' or '+' or '-'))
                    || registry != "registry+https://github.com/rust-lang/crates.io-index" || !IsLowerHex(checksum, 64)
                    || !dependencyLines.Add($"{name}@{version}|{registry}|{checksum}")) return false;
            }
            if (ComputeSha256(Encoding.UTF8.GetBytes(string.Join("\n", dependencyLines.Order(StringComparer.Ordinal)) + "\n")) != dependenciesSha)
                return false;
            if (target == "x86_64-pc-windows-msvc")
            {
                var legacyFiles = root.GetProperty("kernelSourceHashes");
                return !string.IsNullOrWhiteSpace(workflowRunId) && root.GetProperty("workflowRunId").GetString() == workflowRunId
                    && root.GetProperty("workflow").GetString() == "suite-ci" && root.GetProperty("commit").GetString() == source
                    && root.GetProperty("artifactName").GetString() == $"terraforge-valuation-kernel-windows-x64-{source}"
                    && root.GetProperty("target").GetString() == target && root.GetProperty("executableFilename").GetString() == "terraforge-kernel-valuation.exe"
                    && root.GetProperty("executableSha256").GetString() == binarySha && legacyFiles.EnumerateObject().Count() == expectedPaths.Length
                    && expectedPaths.All(path => legacyFiles.GetProperty(path).GetString() == files.GetProperty(path).GetString());
            }
            return target == "x86_64-unknown-linux-musl" && root.GetProperty("artifactType").GetString() == RustKernelsOptions.ForgeValuationArtifactType
                && root.GetProperty("build").GetProperty("target").GetString() == target
                && root.GetProperty("executable").GetProperty("filename").GetString() == "terraforge-kernel-valuation"
                && root.GetProperty("executable").GetProperty("sha256").GetString() == binarySha;
        }
        catch (Exception exception) when (exception is JsonException or KeyNotFoundException or InvalidOperationException or FormatException)
        {
            return false;
        }
    }

    private static bool IsLowerHex(string? value, int length) => value?.Length == length
        && value.All(c => c is >= 'a' and <= 'f' or >= '0' and <= '9');

    private static bool SourceHashesMatch(JsonElement hashes)
    {
        if (hashes.ValueKind != JsonValueKind.Object || hashes.EnumerateObject().Count() != ForgeSourceSha256.Count)
            return false;
        return ForgeSourceSha256.All(expected => hashes.TryGetProperty(expected.Key, out var actual)
            && actual.ValueKind == JsonValueKind.String
            && string.Equals(actual.GetString(), expected.Value, StringComparison.OrdinalIgnoreCase));
    }

    private static bool ContractsMatch(JsonElement contracts)
    {
        if (contracts.ValueKind != JsonValueKind.Array || contracts.GetArrayLength() != ForgeContractSha256.Count)
            return false;
        var seen = new HashSet<string>(StringComparer.Ordinal);
        foreach (var contract in contracts.EnumerateArray())
        {
            if (!contract.TryGetProperty("id", out var idElement)
                || idElement.ValueKind != JsonValueKind.String
                || idElement.GetString() is not string id
                || !ForgeContractSha256.TryGetValue(id, out var expectedDigest)
                || !seen.Add(id)
                || !contract.TryGetProperty("digest", out var digest)
                || !string.Equals(digest.GetString(), expectedDigest, StringComparison.OrdinalIgnoreCase)
                || !contract.TryGetProperty("authorityRepository", out var authorityRepository)
                || !string.Equals(authorityRepository.GetString(), ForgeAuthorityRepository, StringComparison.Ordinal)
                || !contract.TryGetProperty("authorityFreezeCommit", out var authorityFreezeCommit)
                || !string.Equals(authorityFreezeCommit.GetString(), ForgeAuthorityFreezeCommit, StringComparison.Ordinal)
                || !contract.TryGetProperty("digestAlgorithm", out var digestAlgorithm)
                || !string.Equals(digestAlgorithm.GetString(), ForgeContractDigestAlgorithm, StringComparison.Ordinal))
                return false;
        }
        return seen.Count == ForgeContractSha256.Count;
    }

    private static string ResolveRepositoryRelativePath(string path)
    {
        if (Path.IsPathFullyQualified(path)) return Path.GetFullPath(path);
        for (var directory = new DirectoryInfo(AppContext.BaseDirectory); directory != null; directory = directory.Parent)
        {
            var gitPath = Path.Combine(directory.FullName, ".git");
            if (Directory.Exists(gitPath) || File.Exists(gitPath)
                || File.Exists(Path.Combine(directory.FullName, "terrafusion.app.json")))
                return Path.GetFullPath(Path.Combine(directory.FullName, path));
        }
        return Path.GetFullPath(path);
    }

    private static KernelInvocationResult<T> Fail<T>(
        KernelFailureMode mode, string message, DateTimeOffset startedAt, Stopwatch sw,
        string kernelName, string inputHash, string? binarySha256,
        string? requestId,
        int stdoutBytes = 0, string? stdoutSha256 = null,
        int stderrBytes = 0, string? stderrSha256 = null,
        KernelValidationFailure? validation = null)
    {
        sw.Stop();
        return new(false, kernelName, null, inputHash, startedAt,
            startedAt.AddMilliseconds(sw.ElapsedMilliseconds), (int)sw.ElapsedMilliseconds,
            default, null, Array.Empty<string>(), mode, message, binarySha256,
            stdoutBytes, stdoutSha256, stderrBytes, stderrSha256, requestId,
            mode == KernelFailureMode.KernelReportedError ? BoundedValidation(validation) : null);
    }

    private static KernelValidationFailure? BoundedValidation(KernelValidationFailure? validation)
    {
        // Optional transport detail only. Discard malformed/oversized detail rather than
        // truncating it into a different identifier; generic failure text remains unchanged.
        if (validation is null || string.IsNullOrWhiteSpace(validation.Code) || validation.Code.Length > 64
            || string.IsNullOrWhiteSpace(validation.Field) || validation.Field.Length > 128
            || string.IsNullOrWhiteSpace(validation.Message) || validation.Message.Length > 512
            || !validation.Code.All(c => c is >= 'A' and <= 'Z' or >= '0' and <= '9' or '_')
            || !validation.Field.All(c => c is >= 'A' and <= 'Z' or >= 'a' and <= 'z'
                or >= '0' and <= '9' or '_' or '.' or '[' or ']')
            || validation.Message.Any(char.IsControl))
            return null;
        return validation;
    }

    private static string ComputeSha256(byte[] input)
        => Convert.ToHexString(SHA256.HashData(input)).ToLowerInvariant();

    private static string ComputeFileSha256(string path)
    {
        using var stream = File.OpenRead(path);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }

    private static string DecodeUtf8Strict(byte[] bytes)
        => new UTF8Encoding(false, true).GetString(bytes);

    private sealed record BoundedBytes(byte[] Bytes, int ByteCount, string Sha256);
    private sealed class OutputLimitExceededException(string streamName, int byteCount, string sha256) : Exception
    {
        public string StreamName { get; } = streamName;
        public int ByteCount { get; } = byteCount;
        public string Sha256 { get; } = sha256;
    }
}
