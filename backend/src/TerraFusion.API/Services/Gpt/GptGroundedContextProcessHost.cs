using System.ComponentModel;
using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging.Abstractions;
using TerraFusion.API.Configuration;

namespace TerraFusion.API.Services.Gpt;

/// <summary>
/// Executes an in-memory snapshot of the exact staged TerraGPT module in a network-denied Node
/// process. Artifact identity is reverified before every invocation; executable JavaScript never
/// crosses a mutable temporary-file boundary between measurement and execution.
/// </summary>
public sealed class GptGroundedContextProcessHost : IGptGroundedContextProcessHost
{
    internal const int MaximumInputBytes = 1024 * 1024;
    internal const int MaximumOutputBytes = 1024 * 1024;
    internal const int MaximumErrorBytes = 64 * 1024;
    public const int MaximumConcurrentInvocations = 4;
    private static readonly UTF8Encoding Utf8WithoutBom = new(false, true);
    private static readonly StringComparison PathComparison = OperatingSystem.IsWindows()
        ? StringComparison.OrdinalIgnoreCase
        : StringComparison.Ordinal;
    private static readonly HashSet<string> OutputFields = new(StringComparer.Ordinal)
    {
        "accepted",
        "violations",
        "normalizedExchangeJson",
    };
    private static readonly HashSet<string> ViolationFields = new(StringComparer.Ordinal)
    {
        "class",
        "message",
    };
    private static readonly HashSet<string> ManifestFields = new(StringComparer.Ordinal)
    {
        "schemaVersion",
        "artifactType",
        "contract",
        "repository",
        "sourceBranch",
        "commit",
        "modulePath",
        "moduleFilename",
        "moduleLength",
        "moduleSha256",
        "moduleGitBlob",
        "schemaPath",
        "schemaFilename",
        "schemaLength",
        "schemaSha256",
        "schemaGitBlob",
        "sourceManifestPath",
        "sourceManifestLength",
        "sourceManifestSha256",
        "sourceManifestGitBlob",
        "executionManifestPath",
        "executionManifestLength",
        "executionManifestSha256",
        "executionManifestGitBlob",
        "contractSourceSha",
        "sourceDtoSha256",
        "transport",
    };

    private static readonly string RunnerSource = """
        import dgram from 'node:dgram';
        import dns from 'node:dns';
        import http from 'node:http';
        import https from 'node:https';
        import net from 'node:net';
        import tls from 'node:tls';
        import { syncBuiltinESMExports } from 'node:module';

        const denyNetwork = () => {
          throw new Error('Network access is denied by the GPT grounded-context host.');
        };
        for (const [target, names] of [
          [net, ['connect', 'createConnection', 'createServer']],
          [http, ['get', 'request', 'createServer']],
          [https, ['get', 'request', 'createServer']],
          [tls, ['connect', 'createServer']],
          [dgram, ['createSocket']],
          [dns, ['lookup', 'resolve', 'resolve4', 'resolve6']],
        ]) {
          for (const name of names) target[name] = denyNetwork;
        }
        for (const [prototype, names] of [
          [net.Socket.prototype, ['connect']],
          [dgram.Socket.prototype, ['bind', 'connect', 'send']],
          [tls.TLSSocket.prototype, ['connect']],
          [http.ClientRequest.prototype, ['end', 'write']],
        ]) {
          for (const name of names) {
            if (name in prototype) prototype[name] = denyNetwork;
          }
        }
        for (const name of Object.keys(dns.promises)) {
          if (typeof dns.promises[name] === 'function') dns.promises[name] = denyNetwork;
        }
        globalThis.fetch = denyNetwork;
        globalThis.WebSocket = class { constructor() { denyNetwork(); } };
        globalThis.EventSource = class { constructor() { denyNetwork(); } };
        if (typeof process.getBuiltinModule === 'function') {
          Object.defineProperty(process, 'getBuiltinModule', { value: denyNetwork });
        }
        syncBuiltinESMExports();

        let input = '';
        process.stdin.setEncoding('utf8');
        for await (const chunk of process.stdin) input += chunk;
        const envelope = JSON.parse(input);
        if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope) ||
            Object.keys(envelope).sort().join(',') !== 'exchangeJson,moduleBase64,schemaBase64') {
          throw new Error('GPT host input envelope is invalid.');
        }
        const exchange = JSON.parse(envelope.exchangeJson);
        const schema = JSON.parse(Buffer.from(envelope.schemaBase64, 'base64').toString('utf8'));
        const module = await import(`data:text/javascript;base64,${envelope.moduleBase64}`);
        if (typeof module.validateGptExchange !== 'function' ||
            typeof module.normalizeJson !== 'function') {
          throw new Error('GPT module does not expose the required exact functions.');
        }
        const violations = await module.validateGptExchange(schema, exchange);
        if (!Array.isArray(violations)) {
          throw new Error('GPT validation did not return a violation array.');
        }
        const accepted = violations.length === 0;
        process.stdout.write(JSON.stringify({
          accepted,
          violations,
          normalizedExchangeJson: accepted ? module.normalizeJson(exchange) : null,
        }));
        """;

    private readonly string _sovereignRoot;
    private readonly string _artifactSlot;
    private readonly string _nodeExecutablePath;
    private readonly long _nodeExecutableLength;
    private readonly string _nodeExecutableSha256;
    private readonly string _permissionFlag;
    private readonly TimeSpan _timeout;
    private readonly ILogger<GptGroundedContextProcessHost> _logger;
    private readonly Action? _beforeProcessStart;
    private readonly SemaphoreSlim _invocationGate = new(
        MaximumConcurrentInvocations,
        MaximumConcurrentInvocations);

    public GptGroundedContextProcessHost(
        string sovereignRoot,
        string nodeExecutablePath,
        TimeSpan? timeout = null,
        string? temporaryRoot = null,
        ILogger<GptGroundedContextProcessHost>? logger = null,
        Action? beforeProcessStart = null)
    {
        _sovereignRoot = RequireCanonicalDirectory(sovereignRoot, "sovereign root");
        _artifactSlot = Path.GetFullPath(Path.Combine(
            _sovereignRoot,
            GptGroundedContextRuntimeOptions.ArtifactSlotRelativePath.Replace(
                '/',
                Path.DirectorySeparatorChar)));
        _nodeExecutablePath = RequireCanonicalFile(nodeExecutablePath, "Node executable");
        using var nodeCustody = OpenReadCustody(_nodeExecutablePath);
        (_nodeExecutableLength, _nodeExecutableSha256) = Measure(nodeCustody);
        _permissionFlag = ResolvePermissionFlag(nodeCustody);
        _timeout = timeout ?? TimeSpan.FromSeconds(30);
        if (_timeout <= TimeSpan.Zero || _timeout > TimeSpan.FromSeconds(30))
        {
            throw new ArgumentOutOfRangeException(
                nameof(timeout),
                "GPT grounded-context timeout must be greater than zero and no more than 30 seconds.");
        }
        // Retained for source compatibility with staging tests. Executable material is never
        // written to this directory.
        if (temporaryRoot is not null)
        {
            _ = RequireCanonicalDirectory(Path.GetFullPath(temporaryRoot), "temporary root");
        }
        _logger = logger ?? NullLogger<GptGroundedContextProcessHost>.Instance;
        _beforeProcessStart = beforeProcessStart;

        // Fail startup before DI exposes the runtime.
        VerifyArtifact();
    }

    public async Task<GptGroundedContextProcessResult> ValidateAsync(
        string exchangeJson,
        CancellationToken cancellationToken = default)
    {
        if (exchangeJson is null || Utf8WithoutBom.GetByteCount(exchangeJson) > MaximumInputBytes)
        {
            return Failed("GPT exchange is null or exceeds 1 MiB.");
        }

        if (!await _invocationGate.WaitAsync(TimeSpan.Zero, cancellationToken)
                .ConfigureAwait(false))
        {
            return Failed("Canonical GPT runtime capacity is unavailable.");
        }

        try
        {
            var result = Failed("GPT validation did not complete.");
            try
            {
                using var inputDocument = JsonDocument.Parse(exchangeJson);
                if (inputDocument.RootElement.ValueKind != JsonValueKind.Object)
                {
                    return Failed("GPT exchange must be a JSON object.");
                }

                var artifact = VerifyArtifact();
                result = await InvokeAsync(
                        exchangeJson,
                        artifact,
                        cancellationToken)
                    .ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                result = Failed("GPT validation was cancelled.");
            }
            catch (Exception exception) when (
                exception is IOException
                or UnauthorizedAccessException
                or CryptographicException
                or JsonException
                or InvalidOperationException
                or Win32Exception)
            {
                _logger.LogWarning(exception, "Canonical GPT validation failed closed");
                result = Failed("Canonical GPT runtime is unavailable.");
            }

            return result;
        }
        finally
        {
            _invocationGate.Release();
        }
    }

    private async Task<GptGroundedContextProcessResult> InvokeAsync(
        string exchangeJson,
        VerifiedArtifact artifact,
        CancellationToken cancellationToken)
    {
        _beforeProcessStart?.Invoke();
        using var nodeCustody = OpenReadCustody(_nodeExecutablePath);
        RequireBoundNodeIdentity(nodeCustody);
        var startInfo = new ProcessStartInfo
        {
            FileName = _nodeExecutablePath,
            WorkingDirectory = _sovereignRoot,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardInputEncoding = Utf8WithoutBom,
            StandardOutputEncoding = Utf8WithoutBom,
            StandardErrorEncoding = Utf8WithoutBom,
        };
        startInfo.ArgumentList.Add(_permissionFlag);
        startInfo.ArgumentList.Add("--input-type=module");
        startInfo.ArgumentList.Add("--eval");
        startInfo.ArgumentList.Add(RunnerSource);
        ReplaceWithMinimalEnvironment(startInfo.Environment);

        using var process = new Process { StartInfo = startInfo };
        if (!process.Start())
        {
            throw new InvalidOperationException("Node Process.Start returned false.");
        }

        using var timeout = new CancellationTokenSource(_timeout);
        using var linked = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken,
            timeout.Token);
        try
        {
            var stdoutTask = ReadBoundedAsync(
                process.StandardOutput,
                MaximumOutputBytes,
                process,
                linked.Token);
            var stderrTask = ReadBoundedAsync(
                process.StandardError,
                MaximumErrorBytes,
                process,
                linked.Token);
            var envelopeJson = JsonSerializer.Serialize(new
            {
                exchangeJson,
                moduleBase64 = Convert.ToBase64String(artifact.ModuleBytes),
                schemaBase64 = Convert.ToBase64String(artifact.SchemaBytes),
            });
            await process.StandardInput.WriteAsync(envelopeJson.AsMemory(), linked.Token)
                .ConfigureAwait(false);
            process.StandardInput.Close();
            var waitTask = process.WaitForExitAsync(linked.Token);
            await Task.WhenAll(waitTask, stdoutTask, stderrTask).ConfigureAwait(false);
            var stdout = await stdoutTask.ConfigureAwait(false);
            var stderr = await stderrTask.ConfigureAwait(false);
            if (process.ExitCode != 0)
            {
                _logger.LogWarning(
                    "Canonical GPT validator exited with code {ExitCode}; stderr: {Stderr}",
                    process.ExitCode,
                    Bound(stderr, 4096));
                throw new InvalidOperationException(
                    $"GPT validation exited with code {process.ExitCode}.");
            }

            // A concurrent source-slot mutation cannot affect the in-memory code snapshot, but it
            // still invalidates the governed invocation and therefore fails this request closed.
            var postExecutionArtifact = VerifyArtifact();
            if (!string.Equals(
                    postExecutionArtifact.ModuleSha256,
                    artifact.ModuleSha256,
                    StringComparison.Ordinal)
                || !string.Equals(
                    postExecutionArtifact.SchemaSha256,
                    artifact.SchemaSha256,
                    StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    "The governed GPT artifact changed during execution.");
            }

            return ParseOutput(
                stdout,
                artifact,
                artifact.ModuleSha256,
                artifact.SchemaSha256);
        }
        catch (OperationCanceledException)
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
                await process.WaitForExitAsync(CancellationToken.None).ConfigureAwait(false);
            }
            throw;
        }
        finally
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
                await process.WaitForExitAsync(CancellationToken.None).ConfigureAwait(false);
            }
        }
    }

    private static GptGroundedContextProcessResult ParseOutput(
        string stdout,
        VerifiedArtifact artifact,
        string copiedModuleSha256,
        string copiedSchemaSha256)
    {
        using var document = JsonDocument.Parse(stdout);
        var root = document.RootElement;
        RequireExactFields(root, OutputFields, "host output");
        if (root.GetProperty("accepted").ValueKind is not (JsonValueKind.True or JsonValueKind.False)
            || root.GetProperty("violations").ValueKind != JsonValueKind.Array)
        {
            throw new InvalidOperationException("GPT host output used invalid field types.");
        }

        var violations = root.GetProperty("violations")
            .EnumerateArray()
            .Select(ParseViolation)
            .ToArray();
        if (violations.Length > 256)
        {
            throw new InvalidOperationException("GPT host returned too many violations.");
        }

        var accepted = root.GetProperty("accepted").GetBoolean();
        var normalizedElement = root.GetProperty("normalizedExchangeJson");
        var normalized = normalizedElement.ValueKind == JsonValueKind.Null
            ? null
            : normalizedElement.ValueKind == JsonValueKind.String
                ? normalizedElement.GetString()
                : throw new InvalidOperationException("normalizedExchangeJson used an invalid type.");
        if (accepted != (violations.Length == 0) || accepted != (normalized is not null))
        {
            throw new InvalidOperationException("GPT host output was internally inconsistent.");
        }
        if (normalized is not null)
        {
            using var normalizedDocument = JsonDocument.Parse(normalized);
            if (normalizedDocument.RootElement.ValueKind != JsonValueKind.Object)
            {
                throw new InvalidOperationException("Normalized GPT exchange was not an object.");
            }
        }

        return new GptGroundedContextProcessResult(
            true,
            accepted,
            violations,
            normalized,
            artifact.ModuleSha256,
            copiedModuleSha256,
            artifact.SchemaSha256,
            copiedSchemaSha256,
            null);
    }

    private VerifiedArtifact VerifyArtifact()
    {
        RequirePlainDirectoryChain(_sovereignRoot, _artifactSlot);
        var entries = Directory.EnumerateFileSystemEntries(_artifactSlot)
            .Select(Path.GetFileName)
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToArray();
        var expected = new[]
            {
                "manifest.json",
                GptGroundedContextRuntimeOptions.ExpectedModuleFilename,
                GptGroundedContextRuntimeOptions.ExpectedSchemaFilename,
            }
            .OrderBy(name => name, StringComparer.Ordinal)
            .ToArray();
        if (!entries.SequenceEqual(expected, StringComparer.Ordinal))
        {
            throw new InvalidOperationException(
                "GPT artifact slot must contain exactly the module, schema, and manifest.");
        }

        var modulePath = RequireCanonicalFile(
            Path.Combine(_artifactSlot, GptGroundedContextRuntimeOptions.ExpectedModuleFilename),
            "GPT module");
        var schemaPath = RequireCanonicalFile(
            Path.Combine(_artifactSlot, GptGroundedContextRuntimeOptions.ExpectedSchemaFilename),
            "GPT schema");
        var manifestPath = RequireCanonicalFile(
            Path.Combine(_artifactSlot, "manifest.json"),
            "GPT published manifest");
        var module = ReadAndMeasure(modulePath);
        var schema = ReadAndMeasure(schemaPath);
        var manifest = ReadAndMeasure(manifestPath);
        RequireIdentity(
            "GPT module",
            (module.Hash, module.Length),
            GptGroundedContextRuntimeOptions.ExpectedModuleLength,
            GptGroundedContextRuntimeOptions.ExpectedModuleSha256);
        RequireIdentity(
            "GPT schema",
            (schema.Hash, schema.Length),
            GptGroundedContextRuntimeOptions.ExpectedSchemaLength,
            GptGroundedContextRuntimeOptions.ExpectedSchemaSha256);
        RequireIdentity(
            "GPT published manifest",
            (manifest.Hash, manifest.Length),
            GptGroundedContextRuntimeOptions.ExpectedPublishedManifestLength,
            GptGroundedContextRuntimeOptions.ExpectedPublishedManifestSha256);
        VerifyManifest(manifest.Bytes);
        return new VerifiedArtifact(module.Bytes, schema.Bytes, module.Hash, schema.Hash);
    }

    private static void VerifyManifest(byte[] manifestBytes)
    {
        using var document = JsonDocument.Parse(manifestBytes);
        var root = document.RootElement;
        RequireExactFields(root, ManifestFields, "published manifest");
        RequireInteger(root, "schemaVersion", 1);
        RequireString(root, "artifactType", GptGroundedContextRuntimeOptions.ExpectedArtifactType);
        RequireString(root, "contract", GptGroundedContextRuntimeOptions.ExpectedContract);
        RequireString(root, "repository", GptGroundedContextRuntimeOptions.ExpectedRepository);
        RequireString(root, "sourceBranch", GptGroundedContextRuntimeOptions.ExpectedSourceBranch);
        RequireString(root, "commit", GptGroundedContextRuntimeOptions.ExpectedCommit);
        RequireString(root, "modulePath", GptGroundedContextRuntimeOptions.ExpectedModulePath);
        RequireString(root, "moduleFilename", GptGroundedContextRuntimeOptions.ExpectedModuleFilename);
        RequireInteger(root, "moduleLength", GptGroundedContextRuntimeOptions.ExpectedModuleLength);
        RequireString(root, "moduleSha256", GptGroundedContextRuntimeOptions.ExpectedModuleSha256);
        RequireString(root, "moduleGitBlob", GptGroundedContextRuntimeOptions.ExpectedModuleGitBlob);
        RequireString(root, "schemaPath", GptGroundedContextRuntimeOptions.ExpectedSchemaPath);
        RequireString(root, "schemaFilename", GptGroundedContextRuntimeOptions.ExpectedSchemaFilename);
        RequireInteger(root, "schemaLength", GptGroundedContextRuntimeOptions.ExpectedSchemaLength);
        RequireString(root, "schemaSha256", GptGroundedContextRuntimeOptions.ExpectedSchemaSha256);
        RequireString(root, "schemaGitBlob", GptGroundedContextRuntimeOptions.ExpectedSchemaGitBlob);
        RequireString(root, "sourceManifestPath", GptGroundedContextRuntimeOptions.ExpectedSourceManifestPath);
        RequireInteger(
            root,
            "sourceManifestLength",
            GptGroundedContextRuntimeOptions.ExpectedSourceManifestLength);
        RequireString(root, "sourceManifestSha256", GptGroundedContextRuntimeOptions.ExpectedSourceManifestSha256);
        RequireString(
            root,
            "sourceManifestGitBlob",
            GptGroundedContextRuntimeOptions.ExpectedSourceManifestGitBlob);
        RequireString(
            root,
            "executionManifestPath",
            GptGroundedContextRuntimeOptions.ExpectedExecutionManifestPath);
        RequireInteger(
            root,
            "executionManifestLength",
            GptGroundedContextRuntimeOptions.ExpectedExecutionManifestLength);
        RequireString(
            root,
            "executionManifestSha256",
            GptGroundedContextRuntimeOptions.ExpectedExecutionManifestSha256);
        RequireString(
            root,
            "executionManifestGitBlob",
            GptGroundedContextRuntimeOptions.ExpectedExecutionManifestGitBlob);
        RequireString(root, "contractSourceSha", GptGroundedContextRuntimeOptions.ExpectedContractSourceSha);
        RequireString(root, "sourceDtoSha256", GptGroundedContextRuntimeOptions.ExpectedSourceDtoSha256);
        RequireString(root, "transport", GptGroundedContextRuntimeOptions.ExpectedTransport);
    }

    private string ResolvePermissionFlag(Stream nodeCustody)
    {
        RequireBoundNodeIdentity(nodeCustody);
        var startInfo = new ProcessStartInfo
        {
            FileName = _nodeExecutablePath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        startInfo.ArgumentList.Add("--help");
        ReplaceWithMinimalEnvironment(startInfo.Environment);
        using var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException("Unable to inspect the Node permission model.");
        var stdout = new StringBuilder();
        var stderr = new StringBuilder();
        process.OutputDataReceived += (_, args) => AppendBoundedLine(stdout, args.Data, 64 * 1024);
        process.ErrorDataReceived += (_, args) => AppendBoundedLine(stderr, args.Data, 64 * 1024);
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        if (!process.WaitForExit(milliseconds: 5_000))
        {
            TryKill(process);
            throw new InvalidOperationException(
                "Timed out while inspecting the Node permission model.");
        }
        // The unbounded overload waits for asynchronous output event handlers to drain after
        // the process has exited; it does not introduce a second execution timeout.
        process.WaitForExit();
        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException(
                $"Unable to inspect the Node permission model: {Bound(stderr.ToString(), 1024)}");
        }
        var helpText = stdout.ToString();
        if (helpText.Contains("--permission", StringComparison.Ordinal)) return "--permission";
        if (helpText.Contains("--experimental-permission", StringComparison.Ordinal))
        {
            return "--experimental-permission";
        }
        throw new InvalidOperationException("Node does not expose a supported permission model.");
    }

    private static void AppendBoundedLine(StringBuilder builder, string? line, int maximumCharacters)
    {
        if (line is null || builder.Length >= maximumCharacters) return;

        var remaining = maximumCharacters - builder.Length;
        if (builder.Length > 0 && remaining > 0)
        {
            builder.Append('\n');
            remaining--;
        }
        if (remaining > 0)
        {
            builder.Append(line, 0, Math.Min(line.Length, remaining));
        }
    }

    private void RequireBoundNodeIdentity(Stream executableStream)
    {
        executableStream.Position = 0;
        var currentLength = executableStream.Length;
        var currentHash = Convert.ToHexString(SHA256.HashData(executableStream)).ToLowerInvariant();
        if (currentLength != _nodeExecutableLength
            || !string.Equals(currentHash, _nodeExecutableSha256, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("The bound Node executable identity changed.");
        }
    }

    private static GptGroundedContextViolation ParseViolation(JsonElement value)
    {
        RequireExactFields(value, ViolationFields, "violation");
        var classification = value.GetProperty("class").GetString();
        var message = value.GetProperty("message").GetString();
        if (string.IsNullOrWhiteSpace(classification)
            || classification.Length > 128
            || string.IsNullOrWhiteSpace(message)
            || message.Length > 4096)
        {
            throw new InvalidOperationException("GPT host returned an invalid violation.");
        }
        return new GptGroundedContextViolation(classification, message);
    }

    private static void RequireExactFields(
        JsonElement value,
        IReadOnlySet<string> expected,
        string label)
    {
        if (value.ValueKind != JsonValueKind.Object)
        {
            throw new InvalidOperationException($"GPT {label} must be an object.");
        }
        var fields = value.EnumerateObject().Select(property => property.Name).ToArray();
        if (fields.Length != expected.Count
            || fields.Distinct(StringComparer.Ordinal).Count() != expected.Count
            || fields.Any(field => !expected.Contains(field)))
        {
            throw new InvalidOperationException($"GPT {label} fields did not match exactly.");
        }
    }

    private static void RequireString(JsonElement root, string name, string expected)
    {
        var value = root.GetProperty(name);
        if (value.ValueKind != JsonValueKind.String
            || !string.Equals(value.GetString(), expected, StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"GPT manifest {name} did not match.");
        }
    }

    private static void RequireInteger(JsonElement root, string name, long expected)
    {
        var value = root.GetProperty(name);
        if (value.ValueKind != JsonValueKind.Number
            || !value.TryGetInt64(out var actual)
            || actual != expected
            || !string.Equals(
                value.GetRawText(),
                expected.ToString(System.Globalization.CultureInfo.InvariantCulture),
                StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"GPT manifest {name} did not match.");
        }
    }

    private static void RequireIdentity(
        string label,
        (string Hash, long Length) actual,
        long expectedLength,
        string expectedHash)
    {
        if (actual.Length != expectedLength
            || !string.Equals(actual.Hash, expectedHash, StringComparison.Ordinal))
        {
            throw new InvalidOperationException($"{label} identity did not match the code-pinned value.");
        }
    }

    private static (string Hash, long Length) Measure(string path)
    {
        var info = new FileInfo(path);
        using var stream = File.OpenRead(path);
        return (
            Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant(),
            info.Length);
    }

    private static (long Length, string Hash) Measure(Stream stream)
    {
        stream.Position = 0;
        var length = stream.Length;
        var hash = Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
        return (length, hash);
    }

    private static FileStream OpenReadCustody(string path) => new(
        path,
        FileMode.Open,
        FileAccess.Read,
        FileShare.Read,
        bufferSize: 16 * 1024,
        FileOptions.SequentialScan);

    private static (byte[] Bytes, string Hash, long Length) ReadAndMeasure(string path)
    {
        using var stream = new FileStream(
            path,
            FileMode.Open,
            FileAccess.Read,
            FileShare.Read,
            bufferSize: 16 * 1024,
            FileOptions.SequentialScan);
        if (stream.Length > int.MaxValue)
        {
            throw new InvalidOperationException("GPT artifact exceeded the supported size.");
        }
        var bytes = new byte[checked((int)stream.Length)];
        stream.ReadExactly(bytes);
        return (
            bytes,
            Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant(),
            bytes.LongLength);
    }

    private static async Task<string> ReadBoundedAsync(
        StreamReader reader,
        int maximumBytes,
        Process process,
        CancellationToken cancellationToken)
    {
        var builder = new StringBuilder(Math.Min(maximumBytes, 16 * 1024));
        var buffer = new char[4096];
        var bytesRead = 0;
        while (true)
        {
            var count = await reader.ReadAsync(buffer.AsMemory(), cancellationToken)
                .ConfigureAwait(false);
            if (count == 0) return builder.ToString();
            bytesRead = checked(bytesRead + Utf8WithoutBom.GetByteCount(buffer, 0, count));
            if (bytesRead > maximumBytes)
            {
                TryKill(process);
                throw new InvalidOperationException(
                    "GPT process output exceeded its bounded channel.");
            }
            builder.Append(buffer, 0, count);
        }
    }

    private static void TryKill(Process process)
    {
        try
        {
            if (!process.HasExited) process.Kill(entireProcessTree: true);
        }
        catch (Exception exception) when (
            exception is InvalidOperationException or Win32Exception)
        {
            // The process raced to exit; the original bounded-channel failure remains primary.
        }
    }

    private static string RequireCanonicalDirectory(string path, string label)
    {
        if (string.IsNullOrWhiteSpace(path) || !Path.IsPathFullyQualified(path))
        {
            throw new ArgumentException($"GPT {label} must be absolute.", nameof(path));
        }
        var canonical = Path.GetFullPath(path);
        var info = new DirectoryInfo(canonical);
        if (!string.Equals(canonical, path, PathComparison) || !info.Exists || IsLink(info))
        {
            throw new ArgumentException(
                $"GPT {label} must be an existing canonical non-link directory.",
                nameof(path));
        }
        return canonical;
    }

    private static string RequireCanonicalFile(string path, string label)
    {
        if (string.IsNullOrWhiteSpace(path) || !Path.IsPathFullyQualified(path))
        {
            throw new InvalidOperationException($"GPT {label} path must be absolute.");
        }
        var canonical = Path.GetFullPath(path);
        var info = new FileInfo(canonical);
        if (!string.Equals(canonical, path, PathComparison) || !info.Exists || IsLink(info))
        {
            throw new InvalidOperationException(
                $"GPT {label} must be an existing canonical non-link file.");
        }
        return canonical;
    }

    private static void RequirePlainDirectoryChain(string root, string directory)
    {
        var relative = Path.GetRelativePath(root, directory);
        if (Path.IsPathRooted(relative)
            || string.Equals(relative, "..", StringComparison.Ordinal)
            || relative.StartsWith($"..{Path.DirectorySeparatorChar}", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("GPT artifact slot escaped the sovereign root.");
        }
        var current = root;
        foreach (var component in relative.Split(
                     new[] { Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar },
                     StringSplitOptions.RemoveEmptyEntries))
        {
            current = Path.Combine(current, component);
            var info = new DirectoryInfo(current);
            if (!info.Exists || IsLink(info))
            {
                throw new InvalidOperationException(
                    "GPT artifact path contains a missing directory or link.");
            }
        }
    }

    private static bool IsLink(FileSystemInfo info) =>
        info.Attributes.HasFlag(FileAttributes.ReparsePoint) || info.LinkTarget is not null;

    private static void ReplaceWithMinimalEnvironment(IDictionary<string, string?> environment)
    {
        var systemRoot = Environment.GetEnvironmentVariable("SystemRoot");
        environment.Clear();
        environment["NO_COLOR"] = "1";
        environment["NODE_NO_WARNINGS"] = "1";
        if (OperatingSystem.IsWindows() && !string.IsNullOrWhiteSpace(systemRoot))
        {
            environment["SystemRoot"] = systemRoot;
        }
    }

    private static string Bound(string value, int maximum) =>
        value.Length <= maximum ? value : value[..maximum];

    private static GptGroundedContextProcessResult Failed(string message) => new(
        false,
        false,
        Array.Empty<GptGroundedContextViolation>(),
        null,
        null,
        null,
        null,
        null,
        message);

    private sealed record VerifiedArtifact(
        byte[] ModuleBytes,
        byte[] SchemaBytes,
        string ModuleSha256,
        string SchemaSha256);
}
