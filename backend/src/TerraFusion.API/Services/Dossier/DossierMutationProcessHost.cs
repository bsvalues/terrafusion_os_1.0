using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TerraFusion.API.Services.Dossier;

/// <summary>
/// Executes the exact Dossier mutation-decision module and its suite-owned schema evaluator in a
/// disposable, network-denied Node process. Runtime registration re-verifies the staged manifest
/// before every invocation.
/// </summary>
public sealed class DossierMutationProcessHost : IDossierMutationProcessHost
{
    internal const int MaximumInputBytes = 1024 * 1024;
    internal const int MaximumStandardOutputBytes = 1024 * 1024;
    internal const int MaximumStandardErrorBytes = 64 * 1024;

    private static readonly Encoding StrictUtf8 = new UTF8Encoding(false, true);
    private static readonly Encoding ProcessUtf8 = new UTF8Encoding(false, false);
    private static readonly StringComparison PathComparison = OperatingSystem.IsWindows()
        ? StringComparison.OrdinalIgnoreCase
        : StringComparison.Ordinal;
    private static readonly IReadOnlySet<string> OutputFields = new HashSet<string>(
        StringComparer.Ordinal)
    {
        "schemaErrors",
        "result",
    };

    private static readonly string RunnerSource = $$"""
        import dgram from 'node:dgram';
        import dns from 'node:dns';
        import fs from 'node:fs';
        import http from 'node:http';
        import https from 'node:https';
        import net from 'node:net';
        import tls from 'node:tls';
        import { syncBuiltinESMExports } from 'node:module';
        import { pathToFileURL } from 'node:url';

        const denyNetwork = () => {
          throw new Error('Network access is denied by the Dossier mutation-decision host.');
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
        for (const name of Object.getOwnPropertyNames(dns.Resolver.prototype)) {
          if (name !== 'constructor' && typeof dns.Resolver.prototype[name] === 'function') {
            dns.Resolver.prototype[name] = denyNetwork;
          }
        }
        globalThis.fetch = denyNetwork;
        globalThis.WebSocket = class { constructor() { denyNetwork(); } };
        globalThis.EventSource = class { constructor() { denyNetwork(); } };
        if (typeof process.getBuiltinModule === 'function') {
          Object.defineProperty(process, 'getBuiltinModule', { value: denyNetwork });
        }
        syncBuiltinESMExports();

        let input = '';
        let inputBytes = 0;
        process.stdin.setEncoding('utf8');
        for await (const chunk of process.stdin) {
          inputBytes += Buffer.byteLength(chunk, 'utf8');
          if (inputBytes > {{MaximumInputBytes}}) {
            throw new Error('Dossier mutation-decision request exceeds 1 MiB.');
          }
          input += chunk;
        }

        const request = JSON.parse(input);
        const schema = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
        const mutation = await import(pathToFileURL(process.argv[2]).href);
        if (typeof mutation.decideDossierMutation !== 'function' ||
            typeof mutation.validateDossierMutationSchema !== 'function') {
          throw new Error('Dossier mutation module does not expose the required exact functions.');
        }
        const result = mutation.decideDossierMutation(request);
        const exchange = { request, result };
        const schemaErrors = mutation.validateDossierMutationSchema(
          schema,
          schema,
          exchange
        );
        if (!Array.isArray(schemaErrors)) {
          throw new Error('Dossier schema evaluation did not return an error array.');
        }
        process.stdout.write(JSON.stringify({ schemaErrors, result }));
        """;

    private readonly string _nodeExecutablePath;
    private readonly long _nodeExecutableLength;
    private readonly string _nodeExecutableSha256;
    private readonly string _permissionFlag;
    private readonly TimeSpan _timeout;
    private readonly string _temporaryRoot;
    private readonly Func<string, CancellationToken, Task>? _afterModuleCopied;
    private readonly Func<string, CancellationToken, Task>? _afterSchemaCopied;

    public DossierMutationProcessHost(
        string nodeExecutablePath,
        TimeSpan? timeout = null,
        string? temporaryRoot = null)
        : this(
            nodeExecutablePath,
            timeout,
            temporaryRoot,
            afterModuleCopied: null,
            afterSchemaCopied: null)
    {
    }

    internal DossierMutationProcessHost(
        string nodeExecutablePath,
        TimeSpan? timeout,
        string? temporaryRoot,
        Func<string, CancellationToken, Task>? afterModuleCopied,
        Func<string, CancellationToken, Task>? afterSchemaCopied)
    {
        _nodeExecutablePath = RequireExecutable(nodeExecutablePath);
        var identity = CaptureFileIdentity(_nodeExecutablePath);
        _nodeExecutableLength = identity.Length;
        _nodeExecutableSha256 = identity.Sha256;
        _permissionFlag = ResolvePermissionFlag();
        _timeout = timeout ?? TimeSpan.FromSeconds(30);
        if (_timeout <= TimeSpan.Zero || _timeout > TimeSpan.FromSeconds(30))
        {
            throw new ArgumentOutOfRangeException(
                nameof(timeout),
                "Dossier mutation-decision timeout must be greater than zero and no more than 30 seconds.");
        }
        _temporaryRoot = Path.GetFullPath(temporaryRoot ?? Path.GetTempPath());
        _afterModuleCopied = afterModuleCopied;
        _afterSchemaCopied = afterSchemaCopied;
    }

    public async Task<DossierMutationProcessResult> DecideAsync(
        string modulePath,
        string expectedModuleSha256,
        string schemaPath,
        string expectedSchemaSha256,
        string requestJson,
        CancellationToken cancellationToken = default)
    {
        string? invocationDirectory = null;
        DossierMutationProcessResult? result = null;
        var cleanupSucceeded = true;
        try
        {
            var canonicalModulePath = ValidateArtifactPath(
                modulePath,
                ".mjs",
                DossierMutationProcessFailure.InvalidModulePath,
                DossierMutationProcessFailure.ModuleNotFound,
                DossierMutationProcessFailure.UnsupportedModuleType,
                "module");
            var canonicalSchemaPath = ValidateArtifactPath(
                schemaPath,
                ".json",
                DossierMutationProcessFailure.InvalidSchemaPath,
                DossierMutationProcessFailure.SchemaNotFound,
                DossierMutationProcessFailure.UnsupportedSchemaType,
                "schema");
            var expectedModuleHash = ValidateExpectedHash(expectedModuleSha256, "module");
            var expectedSchemaHash = ValidateExpectedHash(expectedSchemaSha256, "schema");
            var requestIdentity = ValidateRequest(requestJson);

            var sourceModuleHash = ComputeFileSha256(canonicalModulePath);
            if (!string.Equals(sourceModuleHash, expectedModuleHash, StringComparison.Ordinal))
            {
                throw Fail(
                    DossierMutationProcessFailure.SourceModuleHashMismatch,
                    "Dossier source mutation module hash mismatch.");
            }
            var sourceSchemaHash = ComputeFileSha256(canonicalSchemaPath);
            if (!string.Equals(sourceSchemaHash, expectedSchemaHash, StringComparison.Ordinal))
            {
                throw Fail(
                    DossierMutationProcessFailure.SourceSchemaHashMismatch,
                    "Dossier source mutation schema hash mismatch.");
            }

            invocationDirectory = Path.Combine(
                _temporaryRoot,
                "terrafusion-dossier-mutation-decision-host",
                Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(invocationDirectory);
            var copiedModulePath = Path.Combine(
                invocationDirectory,
                "decide-dossier-mutation-decision.mjs");
            var copiedSchemaPath = Path.Combine(
                invocationDirectory,
                "dossier.mutation-decision.v1.schema.json");
            var runnerPath = Path.Combine(invocationDirectory, "dossier-mutation-decision-runner.mjs");

            File.Copy(canonicalModulePath, copiedModulePath, overwrite: false);
            if (_afterModuleCopied is not null)
            {
                await _afterModuleCopied(copiedModulePath, cancellationToken).ConfigureAwait(false);
            }
            var copiedModuleHash = ComputeFileSha256(copiedModulePath);
            if (!string.Equals(copiedModuleHash, expectedModuleHash, StringComparison.Ordinal))
            {
                throw Fail(
                    DossierMutationProcessFailure.CopiedModuleHashMismatch,
                    "Disposable Dossier mutation module hash mismatch.");
            }

            File.Copy(canonicalSchemaPath, copiedSchemaPath, overwrite: false);
            if (_afterSchemaCopied is not null)
            {
                await _afterSchemaCopied(copiedSchemaPath, cancellationToken).ConfigureAwait(false);
            }
            var copiedSchemaHash = ComputeFileSha256(copiedSchemaPath);
            if (!string.Equals(copiedSchemaHash, expectedSchemaHash, StringComparison.Ordinal))
            {
                throw Fail(
                    DossierMutationProcessFailure.CopiedSchemaHashMismatch,
                    "Disposable Dossier mutation schema hash mismatch.");
            }

            await File.WriteAllTextAsync(
                    runnerPath,
                    RunnerSource,
                    StrictUtf8,
                    cancellationToken)
                .ConfigureAwait(false);

            result = await InvokeNodeAsync(
                    invocationDirectory,
                    runnerPath,
                    copiedModulePath,
                    copiedSchemaPath,
                    requestJson,
                    requestIdentity,
                    sourceModuleHash,
                    copiedModuleHash,
                    sourceSchemaHash,
                    copiedSchemaHash,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (HostFailureException exception)
        {
            result = Failure(exception.Failure, exception.Message);
        }
        catch (OperationCanceledException)
        {
            result = Failure(
                DossierMutationProcessFailure.Cancelled,
                "Dossier mutation-decision invocation was cancelled.");
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException or CryptographicException)
        {
            result = Failure(
                DossierMutationProcessFailure.ProcessStartFailed,
                $"Dossier mutation-decision preparation failed closed: {exception.Message}");
        }
        finally
        {
            if (invocationDirectory is not null)
            {
                cleanupSucceeded = await DeleteInvocationDirectoryAsync(invocationDirectory)
                    .ConfigureAwait(false);
            }
        }

        return cleanupSucceeded
            ? result!
            : Failure(
                DossierMutationProcessFailure.CleanupFailed,
                $"Dossier mutation-decision cleanup failed: {invocationDirectory}",
                result?.SourceModuleSha256,
                result?.CopiedModuleSha256,
                result?.SourceSchemaSha256,
                result?.CopiedSchemaSha256);
    }

    private async Task<DossierMutationProcessResult> InvokeNodeAsync(
        string invocationDirectory,
        string runnerPath,
        string copiedModulePath,
        string copiedSchemaPath,
        string requestJson,
        RequestIdentity requestIdentity,
        string sourceModuleHash,
        string copiedModuleHash,
        string sourceSchemaHash,
        string copiedSchemaHash,
        CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = _nodeExecutablePath,
            WorkingDirectory = invocationDirectory,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
            StandardInputEncoding = ProcessUtf8,
            StandardOutputEncoding = ProcessUtf8,
            StandardErrorEncoding = ProcessUtf8,
        };
        startInfo.ArgumentList.Add(_permissionFlag);
        startInfo.ArgumentList.Add($"--allow-fs-read={invocationDirectory}");
        startInfo.ArgumentList.Add(runnerPath);
        startInfo.ArgumentList.Add(copiedModulePath);
        startInfo.ArgumentList.Add(copiedSchemaPath);
        ReplaceWithMinimalEnvironment(startInfo.Environment);

        using var process = new Process { StartInfo = startInfo };
        try
        {
            RequireBoundExecutableIdentity();
            if (!process.Start())
            {
                throw Fail(
                    DossierMutationProcessFailure.ProcessStartFailed,
                    "Node Process.Start returned false.");
            }
        }
        catch (Exception exception) when (
            exception is InvalidOperationException or System.ComponentModel.Win32Exception)
        {
            throw Fail(
                DossierMutationProcessFailure.ProcessStartFailed,
                $"Unable to start the exact Node executable: {exception.Message}");
        }

        using var timeoutCts = new CancellationTokenSource(_timeout);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken,
            timeoutCts.Token);
        try
        {
            var stdoutTask = ReadBoundedAsync(
                process.StandardOutput,
                MaximumStandardOutputBytes,
                DossierMutationProcessFailure.StandardOutputTooLarge,
                linkedCts.Token);
            var stderrTask = ReadBoundedAsync(
                process.StandardError,
                MaximumStandardErrorBytes,
                DossierMutationProcessFailure.StandardErrorTooLarge,
                linkedCts.Token);
            var exitTask = process.WaitForExitAsync(linkedCts.Token);
            await process.StandardInput.WriteAsync(requestJson.AsMemory(), linkedCts.Token)
                .ConfigureAwait(false);
            process.StandardInput.Close();

            try
            {
                await Task.WhenAll(exitTask, stdoutTask, stderrTask).ConfigureAwait(false);
            }
            catch
            {
                await KillProcessTreeAsync(process).ConfigureAwait(false);
                throw;
            }

            var stdout = await stdoutTask.ConfigureAwait(false);
            var stderr = await stderrTask.ConfigureAwait(false);
            if (process.ExitCode != 0)
            {
                throw Fail(
                    DossierMutationProcessFailure.NonZeroExit,
                    $"Dossier mutation-decision exited with code {process.ExitCode}: {Bound(stderr)}");
            }
            if (string.IsNullOrWhiteSpace(stdout))
            {
                throw Fail(
                    DossierMutationProcessFailure.MissingOutput,
                    "Dossier mutation-decision produced no output.");
            }

            return ValidateOutput(
                stdout,
                requestIdentity,
                sourceModuleHash,
                copiedModuleHash,
                sourceSchemaHash,
                copiedSchemaHash);
        }
        catch (OperationCanceledException)
        {
            await KillProcessTreeAsync(process).ConfigureAwait(false);
            throw Fail(
                cancellationToken.IsCancellationRequested
                    ? DossierMutationProcessFailure.Cancelled
                    : DossierMutationProcessFailure.Timeout,
                cancellationToken.IsCancellationRequested
                    ? "Dossier mutation-decision was cancelled."
                    : $"Dossier mutation-decision exceeded {_timeout.TotalSeconds:0.###} seconds.");
        }
    }

    private static DossierMutationProcessResult ValidateOutput(
        string stdout,
        RequestIdentity expected,
        string sourceModuleHash,
        string copiedModuleHash,
        string sourceSchemaHash,
        string copiedSchemaHash)
    {
        try
        {
            using var document = JsonDocument.Parse(stdout);
            RejectDuplicateProperties(document.RootElement, "$");
            RequireExactObjectFields(document.RootElement, OutputFields, "host output");
            var schemaErrors = document.RootElement.GetProperty("schemaErrors");
            if (schemaErrors.ValueKind != JsonValueKind.Array)
            {
                throw Fail(
                    DossierMutationProcessFailure.InvalidOutput,
                    "Dossier schemaErrors must be an array.");
            }
            if (schemaErrors.GetArrayLength() != 0)
            {
                throw Fail(
                    DossierMutationProcessFailure.SchemaRejected,
                    "The suite-owned schema evaluator rejected the Dossier decision exchange.");
            }

            var result = document.RootElement.GetProperty("result");
            if (result.ValueKind != JsonValueKind.Object)
            {
                throw Fail(
                    DossierMutationProcessFailure.InvalidOutput,
                    "Dossier mutation result must be an object.");
            }
            var operation = RequireString(result, "operation");
            var commandId = RequireString(result, "commandId");
            var countyId = RequireString(result, "countyId");
            var traceId = OptionalString(result, "traceId");
            if (!string.Equals(operation, expected.Operation, StringComparison.Ordinal)
                || !string.Equals(commandId, expected.CommandId, StringComparison.Ordinal)
                || !string.Equals(countyId, expected.CountyId, StringComparison.Ordinal)
                || !string.Equals(traceId, expected.TraceId, StringComparison.Ordinal))
            {
                throw Fail(
                    DossierMutationProcessFailure.IdentityMismatch,
                    "Dossier mutation result identity does not match the submitted request.");
            }

            return new DossierMutationProcessResult(
                DossierMutationProcessFailure.None,
                result.GetRawText(),
                sourceModuleHash,
                copiedModuleHash,
                sourceSchemaHash,
                copiedSchemaHash,
                null);
        }
        catch (HostFailureException)
        {
            throw;
        }
        catch (Exception exception) when (
            exception is JsonException or KeyNotFoundException or InvalidOperationException)
        {
            throw Fail(
                DossierMutationProcessFailure.InvalidOutput,
                $"Invalid exact Dossier mutation output: {exception.Message}");
        }
    }

    private static RequestIdentity ValidateRequest(string requestJson)
    {
        if (requestJson is null)
        {
            throw Fail(
                DossierMutationProcessFailure.InvalidRequest,
                "Dossier mutation request is required.");
        }
        if (StrictUtf8.GetByteCount(requestJson) > MaximumInputBytes)
        {
            throw Fail(
                DossierMutationProcessFailure.InputTooLarge,
                "Dossier mutation request exceeds 1 MiB.");
        }
        try
        {
            using var document = JsonDocument.Parse(requestJson);
            RejectDuplicateProperties(document.RootElement, "$");
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                throw new InvalidOperationException("request must be an object");
            }
            return new RequestIdentity(
                RequireString(document.RootElement, "operation"),
                RequireString(document.RootElement, "commandId"),
                RequireString(document.RootElement, "countyId"),
                OptionalString(document.RootElement, "traceId"));
        }
        catch (Exception exception) when (
            exception is JsonException or KeyNotFoundException or InvalidOperationException)
        {
            throw Fail(
                DossierMutationProcessFailure.InvalidRequest,
                $"Invalid Dossier mutation request: {exception.Message}");
        }
    }

    private static string ValidateArtifactPath(
        string path,
        string requiredExtension,
        DossierMutationProcessFailure invalidPathFailure,
        DossierMutationProcessFailure missingFailure,
        DossierMutationProcessFailure unsupportedTypeFailure,
        string artifactName)
    {
        if (string.IsNullOrWhiteSpace(path) || !Path.IsPathFullyQualified(path))
        {
            throw Fail(invalidPathFailure, $"Dossier {artifactName} path must be absolute.");
        }
        var canonical = Path.GetFullPath(path);
        if (!string.Equals(canonical, path, PathComparison))
        {
            throw Fail(invalidPathFailure, $"Dossier {artifactName} path must be canonical.");
        }
        if (Directory.Exists(canonical) || !File.Exists(canonical))
        {
            throw Fail(missingFailure, $"Dossier {artifactName} file does not exist.");
        }
        if (File.GetAttributes(canonical).HasFlag(FileAttributes.ReparsePoint))
        {
            throw Fail(invalidPathFailure, $"Dossier {artifactName} must not be a link.");
        }
        if (!string.Equals(
                Path.GetExtension(canonical),
                requiredExtension,
                StringComparison.OrdinalIgnoreCase))
        {
            throw Fail(
                unsupportedTypeFailure,
                $"Dossier {artifactName} must use the {requiredExtension} extension.");
        }
        return canonical;
    }

    private static string ValidateExpectedHash(string expectedHash, string artifactName)
    {
        var normalized = expectedHash?.Trim().ToLowerInvariant();
        if (normalized is null
            || normalized.Length != 64
            || normalized.Any(character => !Uri.IsHexDigit(character)))
        {
            throw Fail(
                DossierMutationProcessFailure.InvalidExpectedHash,
                $"Expected Dossier {artifactName} SHA-256 must be 64 hexadecimal characters.");
        }
        return normalized;
    }

    private static string RequireExecutable(string path)
    {
        if (string.IsNullOrWhiteSpace(path) || !Path.IsPathFullyQualified(path))
        {
            throw new ArgumentException("Node executable path must be absolute.", nameof(path));
        }
        var canonical = Path.GetFullPath(path);
        if (!string.Equals(canonical, path, PathComparison)
            || !File.Exists(canonical)
            || File.GetAttributes(canonical).HasFlag(FileAttributes.ReparsePoint))
        {
            throw new ArgumentException(
                "Node executable path must identify an existing canonical non-link file.",
                nameof(path));
        }
        return canonical;
    }

    private string ResolvePermissionFlag()
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = _nodeExecutablePath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        startInfo.ArgumentList.Add("--version");
        ReplaceWithMinimalEnvironment(startInfo.Environment);
        using var process = new Process { StartInfo = startInfo };
        RequireBoundExecutableIdentity();
        if (!process.Start())
        {
            throw new ArgumentException("Node Process.Start returned false.", nameof(_nodeExecutablePath));
        }
        if (!process.WaitForExit(5_000))
        {
            process.Kill(entireProcessTree: true);
            process.WaitForExit();
            throw new ArgumentException("Node version resolution timed out.", nameof(_nodeExecutablePath));
        }
        var version = process.StandardOutput.ReadToEnd().Trim();
        var error = process.StandardError.ReadToEnd().Trim();
        if (process.ExitCode != 0)
        {
            throw new ArgumentException(
                $"Node version resolution failed: {Bound(error)}",
                nameof(_nodeExecutablePath));
        }
        return DossierEvidenceRegistryReadProcessHost.PermissionFlagForVersion(version);
    }

    private void RequireBoundExecutableIdentity()
    {
        var canonical = RequireExecutable(_nodeExecutablePath);
        var identity = CaptureFileIdentity(canonical);
        if (identity.Length != _nodeExecutableLength
            || !string.Equals(identity.Sha256, _nodeExecutableSha256, StringComparison.Ordinal))
        {
            throw Fail(
                DossierMutationProcessFailure.RuntimeIdentityMismatch,
                "The bound Node executable identity changed.");
        }
    }

    private static (long Length, string Sha256) CaptureFileIdentity(string path)
    {
        var info = new FileInfo(path);
        return (info.Length, ComputeFileSha256(path));
    }

    private static string ComputeFileSha256(string path)
    {
        using var stream = File.OpenRead(path);
        return Convert.ToHexString(SHA256.HashData(stream)).ToLowerInvariant();
    }

    private static void RequireExactObjectFields(
        JsonElement element,
        IReadOnlySet<string> expected,
        string objectName)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            throw Fail(
                DossierMutationProcessFailure.InvalidOutput,
                $"Dossier {objectName} must be an object.");
        }
        var names = element.EnumerateObject().Select(property => property.Name).ToArray();
        if (names.Length != expected.Count
            || names.Distinct(StringComparer.Ordinal).Count() != names.Length
            || names.Any(name => !expected.Contains(name)))
        {
            throw Fail(
                DossierMutationProcessFailure.InvalidOutput,
                $"Dossier {objectName} contains unexpected fields.");
        }
    }

    private static string RequireString(JsonElement parent, string name)
    {
        if (!parent.TryGetProperty(name, out var value)
            || value.ValueKind != JsonValueKind.String
            || string.IsNullOrWhiteSpace(value.GetString()))
        {
            throw new InvalidOperationException($"{name} must be a nonempty string");
        }
        return value.GetString()!;
    }

    private static string? OptionalString(JsonElement parent, string name)
    {
        if (!parent.TryGetProperty(name, out var value))
        {
            return null;
        }
        if (value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(value.GetString()))
        {
            throw new InvalidOperationException($"{name} must be a nonempty string when present");
        }
        return value.GetString();
    }

    private static void RejectDuplicateProperties(JsonElement element, string location)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            var names = new HashSet<string>(StringComparer.Ordinal);
            foreach (var property in element.EnumerateObject())
            {
                if (!names.Add(property.Name))
                {
                    throw new InvalidOperationException(
                        $"duplicate property at {location}.{property.Name}");
                }
                RejectDuplicateProperties(property.Value, $"{location}.{property.Name}");
            }
        }
        else if (element.ValueKind == JsonValueKind.Array)
        {
            var index = 0;
            foreach (var item in element.EnumerateArray())
            {
                RejectDuplicateProperties(item, $"{location}[{index++}]");
            }
        }
    }

    private static async Task<string> ReadBoundedAsync(
        StreamReader reader,
        int maximumBytes,
        DossierMutationProcessFailure overflowFailure,
        CancellationToken cancellationToken)
    {
        var builder = new StringBuilder();
        var buffer = new char[4096];
        var bytesRead = 0;
        while (true)
        {
            var count = await reader.ReadAsync(buffer.AsMemory(), cancellationToken)
                .ConfigureAwait(false);
            if (count == 0)
            {
                return builder.ToString();
            }
            bytesRead += ProcessUtf8.GetByteCount(buffer, 0, count);
            if (bytesRead > maximumBytes)
            {
                throw Fail(overflowFailure, $"Process stream exceeded {maximumBytes} bytes.");
            }
            builder.Append(buffer, 0, count);
        }
    }

    private static void ReplaceWithMinimalEnvironment(IDictionary<string, string?> environment)
    {
        var inherited = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var key in new[] { "SystemRoot", "WINDIR", "TEMP", "TMP" })
        {
            if (environment.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value))
            {
                inherited[key] = value;
            }
        }
        environment.Clear();
        foreach (var pair in inherited)
        {
            environment[pair.Key] = pair.Value;
        }
    }

    private static async Task KillProcessTreeAsync(Process process)
    {
        try
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
                using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                await process.WaitForExitAsync(timeout.Token).ConfigureAwait(false);
            }
        }
        catch (Exception exception) when (
            exception is InvalidOperationException or OperationCanceledException)
        {
            // The process exited between observation and termination.
        }
    }

    private static async Task<bool> DeleteInvocationDirectoryAsync(string path)
    {
        for (var attempt = 1; attempt <= 5; attempt++)
        {
            try
            {
                if (Directory.Exists(path))
                {
                    Directory.Delete(path, recursive: true);
                }
                return !Directory.Exists(path);
            }
            catch (Exception exception) when (
                exception is IOException or UnauthorizedAccessException)
            {
                if (attempt == 5)
                {
                    return false;
                }
                await Task.Delay(100 * attempt).ConfigureAwait(false);
            }
        }
        return false;
    }

    private static string Bound(string value) =>
        value.Length <= 4096 ? value : value[..4096];

    private static HostFailureException Fail(
        DossierMutationProcessFailure failure,
        string message) => new(failure, message);

    private static DossierMutationProcessResult Failure(
        DossierMutationProcessFailure failure,
        string message,
        string? sourceModuleHash = null,
        string? copiedModuleHash = null,
        string? sourceSchemaHash = null,
        string? copiedSchemaHash = null) => new(
        failure,
        null,
        sourceModuleHash,
        copiedModuleHash,
        sourceSchemaHash,
        copiedSchemaHash,
        message);

    private sealed record RequestIdentity(
        string Operation,
        string CommandId,
        string CountyId,
        string? TraceId);

    private sealed class HostFailureException(
        DossierMutationProcessFailure failure,
        string message) : Exception(message)
    {
        public DossierMutationProcessFailure Failure { get; } = failure;
    }
}
