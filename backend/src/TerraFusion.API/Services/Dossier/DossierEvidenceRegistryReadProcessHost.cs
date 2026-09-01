using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TerraFusion.API.Services.Dossier;

/// <summary>
/// Executes one hash-pinned Dossier evidence-registry-read module and schema in a disposable,
/// constrained Node process. Runtime registration must additionally verify the
/// canonical staged manifest before every invocation.
/// </summary>
public sealed class DossierEvidenceRegistryReadProcessHost : IDossierEvidenceRegistryReadProcessHost
{
    internal const int MaximumInputBytes = 1024 * 1024;
    internal const int MaximumStandardOutputBytes = 1024 * 1024;
    internal const int MaximumStandardErrorBytes = 64 * 1024;
    internal const int MaximumViolations = 256;
    private const int MaximumViolationClassLength = 128;
    private const int MaximumViolationMessageLength = 4096;
    private static readonly Encoding Utf8WithoutBom = new UTF8Encoding(false, true);
    private static readonly Encoding ProcessUtf8 = new UTF8Encoding(false, false);
    private static readonly StringComparison PathComparison = OperatingSystem.IsWindows()
        ? StringComparison.OrdinalIgnoreCase
        : StringComparison.Ordinal;
    private static readonly HashSet<string> OutputFields = new(StringComparer.Ordinal)
    {
        "accepted",
        "violations",
        "normalizedExchangeJson",
        "requestCountyId",
        "resultCountyId",
    };
    private static readonly HashSet<string> ViolationFields = new(StringComparer.Ordinal)
    {
        "class",
        "message",
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
          throw new Error('Network access is denied by the Dossier evidence-registry-read host.');
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
            throw new Error('Dossier evidence-registry-read exchange exceeds 1 MiB.');
          }
          input += chunk;
        }

        const exchange = JSON.parse(input);
        const schema = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
        const workflow = await import(pathToFileURL(process.argv[2]).href);
        if (typeof workflow.validateDossierExchange !== 'function' ||
            typeof workflow.normalizeJson !== 'function') {
          throw new Error('Dossier module does not expose the required exact functions.');
        }
        const violations = await workflow.validateDossierExchange(schema, exchange);
        if (!Array.isArray(violations)) {
          throw new Error('Dossier validation did not return a violation array.');
        }
        const accepted = violations.length === 0;
        process.stdout.write(JSON.stringify({
          accepted,
          violations,
          normalizedExchangeJson: accepted ? workflow.normalizeJson(exchange) : null,
          requestCountyId: exchange?.request?.countyId ?? null,
          resultCountyId: exchange?.result?.countyId ?? null,
        }));
        """;

    private readonly string _nodeExecutablePath;
    private readonly long _nodeExecutableLength;
    private readonly string _nodeExecutableSha256;
    private readonly string _permissionFlag;
    private readonly TimeSpan _timeout;
    private readonly string _temporaryRoot;
    private readonly Func<string, CancellationToken, Task>? _afterModuleCopied;
    private readonly Func<string, CancellationToken, Task>? _afterSchemaCopied;
    private readonly Func<string, int, Exception?>? _cleanupFailureFactory;

    public DossierEvidenceRegistryReadProcessHost(
        string nodeExecutablePath,
        TimeSpan? timeout = null,
        string? temporaryRoot = null)
        : this(
            nodeExecutablePath,
            timeout,
            temporaryRoot,
            afterModuleCopied: null,
            afterSchemaCopied: null,
            cleanupFailureFactory: null)
    {
    }

    internal DossierEvidenceRegistryReadProcessHost(
        string nodeExecutablePath,
        TimeSpan? timeout,
        string? temporaryRoot,
        Func<string, CancellationToken, Task>? afterModuleCopied,
        Func<string, CancellationToken, Task>? afterSchemaCopied,
        Func<string, int, Exception?>? cleanupFailureFactory = null)
    {
        _nodeExecutablePath = RequireExecutable(nodeExecutablePath);
        (_nodeExecutableLength, _nodeExecutableSha256) = CaptureExecutableIdentity(
            _nodeExecutablePath);
        _permissionFlag = ResolvePermissionFlag(
            _nodeExecutablePath,
            _nodeExecutableLength,
            _nodeExecutableSha256);
        _timeout = timeout ?? TimeSpan.FromSeconds(30);
        if (_timeout <= TimeSpan.Zero || _timeout > TimeSpan.FromSeconds(30))
        {
            throw new ArgumentOutOfRangeException(
                nameof(timeout),
                "Dossier evidence-registry-read timeout must be greater than zero and no more than 30 seconds.");
        }

        _temporaryRoot = Path.GetFullPath(temporaryRoot ?? Path.GetTempPath());
        _afterModuleCopied = afterModuleCopied;
        _afterSchemaCopied = afterSchemaCopied;
        _cleanupFailureFactory = cleanupFailureFactory;
    }

    public async Task<DossierEvidenceRegistryReadProcessResult> ValidateAsync(
        string modulePath,
        string expectedModuleSha256,
        string schemaPath,
        string expectedSchemaSha256,
        string evidenceRegistryExchangeJson,
        CancellationToken cancellationToken = default)
    {
        string? invocationDirectory = null;
        DossierEvidenceRegistryReadProcessResult? result = null;
        var cleanupSucceeded = true;

        try
        {
            var canonicalModulePath = ValidateArtifactPath(
                modulePath,
                ".mjs",
                DossierEvidenceRegistryReadFailure.InvalidModulePath,
                DossierEvidenceRegistryReadFailure.ModuleNotFound,
                DossierEvidenceRegistryReadFailure.UnsupportedModuleType,
                "module");
            var canonicalSchemaPath = ValidateArtifactPath(
                schemaPath,
                ".json",
                DossierEvidenceRegistryReadFailure.InvalidSchemaPath,
                DossierEvidenceRegistryReadFailure.SchemaNotFound,
                DossierEvidenceRegistryReadFailure.UnsupportedSchemaType,
                "schema");
            var expectedModuleHash = ValidateExpectedHash(expectedModuleSha256, "module");
            var expectedSchemaHash = ValidateExpectedHash(expectedSchemaSha256, "schema");
            var exchange = ValidateExchange(evidenceRegistryExchangeJson);
            var sourceModuleHash = ComputeFileSha256(canonicalModulePath);
            if (!string.Equals(sourceModuleHash, expectedModuleHash, StringComparison.Ordinal))
            {
                throw Fail(
                    DossierEvidenceRegistryReadFailure.SourceModuleHashMismatch,
                    $"Dossier source module hash mismatch: expected {expectedModuleHash}, found {sourceModuleHash}.");
            }
            var sourceSchemaHash = ComputeFileSha256(canonicalSchemaPath);
            if (!string.Equals(sourceSchemaHash, expectedSchemaHash, StringComparison.Ordinal))
            {
                throw Fail(
                    DossierEvidenceRegistryReadFailure.SourceSchemaHashMismatch,
                    $"Dossier source schema hash mismatch: expected {expectedSchemaHash}, found {sourceSchemaHash}.");
            }

            invocationDirectory = Path.Combine(
                _temporaryRoot,
                "terrafusion-dossier-evidence-registry-read-host",
                Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(invocationDirectory);
            var copiedModulePath = Path.Combine(invocationDirectory, "project-dossier-evidence-registry-read.mjs");
            var copiedSchemaPath = Path.Combine(invocationDirectory, "dossier.evidence-registry-read.v1.schema.json");
            var runnerPath = Path.Combine(invocationDirectory, "dossier-evidence-registry-read-runner.mjs");

            File.Copy(canonicalModulePath, copiedModulePath, overwrite: false);
            if (_afterModuleCopied is not null)
            {
                await _afterModuleCopied(copiedModulePath, cancellationToken).ConfigureAwait(false);
            }
            var copiedModuleHash = ComputeFileSha256(copiedModulePath);
            if (!string.Equals(copiedModuleHash, expectedModuleHash, StringComparison.Ordinal))
            {
                throw Fail(
                    DossierEvidenceRegistryReadFailure.CopiedModuleHashMismatch,
                    $"Disposable Dossier module hash mismatch: expected {expectedModuleHash}, found {copiedModuleHash}.");
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
                    DossierEvidenceRegistryReadFailure.CopiedSchemaHashMismatch,
                    $"Disposable Dossier schema hash mismatch: expected {expectedSchemaHash}, found {copiedSchemaHash}.");
            }

            await File.WriteAllTextAsync(
                    runnerPath,
                    RunnerSource,
                    Utf8WithoutBom,
                    cancellationToken)
                .ConfigureAwait(false);

            result = await InvokeNodeAsync(
                    invocationDirectory,
                    runnerPath,
                    copiedModulePath,
                    copiedSchemaPath,
                    evidenceRegistryExchangeJson,
                    exchange,
                    sourceModuleHash,
                    copiedModuleHash,
                    sourceSchemaHash,
                    copiedSchemaHash,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (HostFailureException ex)
        {
            result = Failure(ex.Failure, ex.Message);
        }
        catch (OperationCanceledException)
        {
            result = Failure(DossierEvidenceRegistryReadFailure.Cancelled, "Dossier validation was cancelled.");
        }
        catch (Exception ex) when (
            ex is IOException or UnauthorizedAccessException or CryptographicException)
        {
            result = Failure(
                DossierEvidenceRegistryReadFailure.ProcessStartFailed,
                $"Dossier validation preparation failed closed: {ex.Message}");
        }
        finally
        {
            if (invocationDirectory is not null)
            {
                cleanupSucceeded = await DeleteInvocationDirectoryAsync(invocationDirectory)
                    .ConfigureAwait(false);
            }
        }

        if (!cleanupSucceeded)
        {
            return Failure(
                DossierEvidenceRegistryReadFailure.CleanupFailed,
                $"Dossier invocation cleanup failed: {invocationDirectory}",
                result?.SourceModuleSha256,
                result?.CopiedModuleSha256,
                result?.SourceSchemaSha256,
                result?.CopiedSchemaSha256);
        }

        return result!;
    }

    private async Task<DossierEvidenceRegistryReadProcessResult> InvokeNodeAsync(
        string invocationDirectory,
        string runnerPath,
        string copiedModulePath,
        string copiedSchemaPath,
        string exchangeJson,
        ExchangeIdentity exchange,
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
                    DossierEvidenceRegistryReadFailure.ProcessStartFailed,
                    "Node Process.Start returned false.");
            }
        }
        catch (Exception ex) when (ex is InvalidOperationException or System.ComponentModel.Win32Exception)
        {
            throw Fail(
                DossierEvidenceRegistryReadFailure.ProcessStartFailed,
                $"Unable to start the explicit Node executable: {ex.Message}");
        }

        using var timeoutCts = new CancellationTokenSource(_timeout);
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken,
            timeoutCts.Token);
        Task<string>? stdoutTask = null;
        Task<string>? stderrTask = null;
        Task? exitTask = null;
        try
        {
            stdoutTask = ReadBoundedAsync(
                process.StandardOutput,
                MaximumStandardOutputBytes,
                DossierEvidenceRegistryReadFailure.StandardOutputTooLarge,
                linkedCts.Token);
            stderrTask = ReadBoundedAsync(
                process.StandardError,
                MaximumStandardErrorBytes,
                DossierEvidenceRegistryReadFailure.StandardErrorTooLarge,
                linkedCts.Token);
            exitTask = process.WaitForExitAsync(linkedCts.Token);

            await process.StandardInput.WriteAsync(exchangeJson.AsMemory(), linkedCts.Token)
                .ConfigureAwait(false);
            process.StandardInput.Close();

            try
            {
                await AwaitProcessAndStreamsFailFastAsync(exitTask, stdoutTask, stderrTask)
                    .ConfigureAwait(false);
            }
            catch
            {
                await KillProcessTreeAsync(process).ConfigureAwait(false);
                await ObserveTasksAsync(exitTask, stdoutTask, stderrTask).ConfigureAwait(false);
                throw;
            }

            var stdout = await stdoutTask.ConfigureAwait(false);
            var stderr = await stderrTask.ConfigureAwait(false);
            if (process.ExitCode != 0)
            {
                throw Fail(
                    DossierEvidenceRegistryReadFailure.NonZeroExit,
                    $"Dossier validation exited with code {process.ExitCode}: {BoundMessage(stderr)}");
            }
            if (string.IsNullOrWhiteSpace(stdout))
            {
                throw Fail(DossierEvidenceRegistryReadFailure.MissingOutput, "Dossier validation produced no output.");
            }

            return ValidateOutput(
                stdout,
                exchange,
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
                    ? DossierEvidenceRegistryReadFailure.Cancelled
                    : DossierEvidenceRegistryReadFailure.Timeout,
                cancellationToken.IsCancellationRequested
                    ? "Dossier validation was cancelled."
                    : $"Dossier validation exceeded the {_timeout.TotalSeconds.ToString(CultureInfo.InvariantCulture)}-second limit.");
        }
        finally
        {
            if (!process.HasExited)
            {
                await KillProcessTreeAsync(process).ConfigureAwait(false);
            }
            await ObserveTasksAsync(exitTask, stdoutTask, stderrTask).ConfigureAwait(false);
        }
    }

    private static DossierEvidenceRegistryReadProcessResult ValidateOutput(
        string stdout,
        ExchangeIdentity exchange,
        string sourceModuleHash,
        string copiedModuleHash,
        string sourceSchemaHash,
        string copiedSchemaHash)
    {
        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(stdout);
        }
        catch (JsonException ex)
        {
            throw Fail(
                DossierEvidenceRegistryReadFailure.InvalidOutput,
                $"Invalid Dossier JSON output: {ex.Message}");
        }

        using (document)
        {
            var root = document.RootElement;
            RequireExactObjectFields(root, OutputFields, "host output");
            if (root.GetProperty("accepted").ValueKind is not (JsonValueKind.True or JsonValueKind.False))
            {
                throw Fail(DossierEvidenceRegistryReadFailure.InvalidOutput, "accepted must be a boolean.");
            }
            var accepted = root.GetProperty("accepted").GetBoolean();
            var requestCountyId = RequireString(root, "requestCountyId");
            var resultCountyId = RequireString(root, "resultCountyId");
            if (!string.Equals(requestCountyId, exchange.RequestCountyId, StringComparison.Ordinal) ||
                !string.Equals(resultCountyId, exchange.ResultCountyId, StringComparison.Ordinal))
            {
                throw Fail(
                    DossierEvidenceRegistryReadFailure.IdentityMismatch,
                    "Dossier output county identities must match the submitted exchange.");
            }

            var violationsElement = root.GetProperty("violations");
            if (violationsElement.ValueKind != JsonValueKind.Array ||
                violationsElement.GetArrayLength() > MaximumViolations)
            {
                throw Fail(
                    DossierEvidenceRegistryReadFailure.InvalidOutput,
                    $"violations must be an array containing no more than {MaximumViolations} entries.");
            }
            var violations = new List<DossierEvidenceRegistryReadViolation>();
            foreach (var violation in violationsElement.EnumerateArray())
            {
                RequireExactObjectFields(violation, ViolationFields, "violation");
                var violationClass = RequireBoundedString(
                    violation,
                    "class",
                    MaximumViolationClassLength);
                var message = RequireBoundedString(
                    violation,
                    "message",
                    MaximumViolationMessageLength);
                violations.Add(new DossierEvidenceRegistryReadViolation(violationClass, message));
            }

            var normalizedElement = root.GetProperty("normalizedExchangeJson");
            if (accepted)
            {
                if (violations.Count != 0 || normalizedElement.ValueKind != JsonValueKind.String)
                {
                    throw Fail(
                        DossierEvidenceRegistryReadFailure.InvalidOutput,
                        "Accepted Dossier output requires no violations and normalized exchange JSON.");
                }
                var normalized = normalizedElement.GetString();
                if (string.IsNullOrWhiteSpace(normalized) ||
                    !string.Equals(normalized, exchange.CanonicalJson, StringComparison.Ordinal))
                {
                    throw Fail(
                        DossierEvidenceRegistryReadFailure.IdentityMismatch,
                        "Accepted Dossier output must normalize the submitted exchange without mutation.");
                }

                return new DossierEvidenceRegistryReadProcessResult(
                    DossierEvidenceRegistryReadOutcome.Accepted,
                    DossierEvidenceRegistryReadFailure.None,
                    normalized,
                    Array.Empty<DossierEvidenceRegistryReadViolation>(),
                    requestCountyId,
                    resultCountyId,
                    sourceModuleHash,
                    copiedModuleHash,
                    sourceSchemaHash,
                    copiedSchemaHash,
                    null);
            }

            if (violations.Count == 0 || normalizedElement.ValueKind != JsonValueKind.Null)
            {
                throw Fail(
                    DossierEvidenceRegistryReadFailure.InvalidOutput,
                    "Rejected Dossier output requires at least one violation and no normalized exchange.");
            }

            return new DossierEvidenceRegistryReadProcessResult(
                DossierEvidenceRegistryReadOutcome.Rejected,
                DossierEvidenceRegistryReadFailure.None,
                null,
                violations,
                requestCountyId,
                resultCountyId,
                sourceModuleHash,
                copiedModuleHash,
                sourceSchemaHash,
                copiedSchemaHash,
                null);
        }
    }

    private static ExchangeIdentity ValidateExchange(string exchangeJson)
    {
        if (exchangeJson is null)
        {
            throw Fail(DossierEvidenceRegistryReadFailure.InvalidExchange, "Dossier exchange is required.");
        }
        if (Utf8WithoutBom.GetByteCount(exchangeJson) > MaximumInputBytes)
        {
            throw Fail(DossierEvidenceRegistryReadFailure.InputTooLarge, "Dossier exchange exceeds 1 MiB.");
        }

        try
        {
            using var document = JsonDocument.Parse(exchangeJson);
            RejectDuplicateProperties(document.RootElement, "$");
            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                throw new InvalidOperationException("exchange must be an object");
            }
            var request = document.RootElement.GetProperty("request");
            var result = document.RootElement.GetProperty("result");
            if (request.ValueKind != JsonValueKind.Object || result.ValueKind != JsonValueKind.Object)
            {
                throw new InvalidOperationException("request and result must be objects");
            }
            var requestCountyId = RequireString(
                request,
                "countyId",
                DossierEvidenceRegistryReadFailure.InvalidExchange);
            var resultCountyId = RequireString(
                result,
                "countyId",
                DossierEvidenceRegistryReadFailure.InvalidExchange);
            var canonicalJson = NormalizeJson(document.RootElement);
            return new ExchangeIdentity(requestCountyId, resultCountyId, canonicalJson);
        }
        catch (Exception ex) when (
            ex is JsonException or KeyNotFoundException or InvalidOperationException)
        {
            throw Fail(DossierEvidenceRegistryReadFailure.InvalidExchange, $"Invalid Dossier exchange: {ex.Message}");
        }
    }

    private static string NormalizeJson(JsonElement element)
    {
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            WriteNormalized(writer, element);
        }
        return Utf8WithoutBom.GetString(stream.ToArray());
    }

    private static void WriteNormalized(Utf8JsonWriter writer, JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Object:
                writer.WriteStartObject();
                foreach (var property in element.EnumerateObject().OrderBy(property => property.Name, StringComparer.Ordinal))
                {
                    writer.WritePropertyName(property.Name);
                    WriteNormalized(writer, property.Value);
                }
                writer.WriteEndObject();
                break;
            case JsonValueKind.Array:
                writer.WriteStartArray();
                foreach (var item in element.EnumerateArray())
                {
                    WriteNormalized(writer, item);
                }
                writer.WriteEndArray();
                break;
            case JsonValueKind.String:
                writer.WriteStringValue(element.GetString());
                break;
            case JsonValueKind.Number:
                if (element.TryGetInt64(out var integer))
                {
                    writer.WriteNumberValue(integer);
                }
                else if (element.TryGetDecimal(out var decimalValue))
                {
                    writer.WriteNumberValue(decimalValue);
                }
                else if (element.TryGetDouble(out var doubleValue) && double.IsFinite(doubleValue))
                {
                    writer.WriteNumberValue(doubleValue);
                }
                else
                {
                    throw new InvalidOperationException("exchange contains an unsupported number");
                }
                break;
            case JsonValueKind.True:
                writer.WriteBooleanValue(true);
                break;
            case JsonValueKind.False:
                writer.WriteBooleanValue(false);
                break;
            case JsonValueKind.Null:
                writer.WriteNullValue();
                break;
            default:
                throw new InvalidOperationException("exchange contains an unsupported JSON token");
        }
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
                    throw new InvalidOperationException($"duplicate property at {location}.{property.Name}");
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

    private static string ValidateArtifactPath(
        string path,
        string requiredExtension,
        DossierEvidenceRegistryReadFailure invalidPathFailure,
        DossierEvidenceRegistryReadFailure missingFailure,
        DossierEvidenceRegistryReadFailure unsupportedTypeFailure,
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
        if ((File.GetAttributes(canonical) & FileAttributes.ReparsePoint) != 0)
        {
            throw Fail(invalidPathFailure, $"Dossier {artifactName} must not be a link or reparse point.");
        }
        if (!string.Equals(Path.GetExtension(canonical), requiredExtension, StringComparison.OrdinalIgnoreCase))
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
        if (normalized is null || normalized.Length != 64 ||
            normalized.Any(character => !Uri.IsHexDigit(character)))
        {
            throw Fail(
                DossierEvidenceRegistryReadFailure.InvalidExpectedHash,
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
        if (!string.Equals(canonical, path, PathComparison) || !File.Exists(canonical) ||
            (File.GetAttributes(canonical) & FileAttributes.ReparsePoint) != 0)
        {
            throw new ArgumentException(
                "Node executable path must identify an existing canonical non-link file.",
                nameof(path));
        }
        return canonical;
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
            throw Fail(DossierEvidenceRegistryReadFailure.InvalidOutput, $"Dossier {objectName} must be an object.");
        }
        var actual = element.EnumerateObject().Select(property => property.Name).ToArray();
        var distinct = actual.Distinct(StringComparer.Ordinal).ToArray();
        if (actual.Length != distinct.Length || distinct.Length != expected.Count ||
            distinct.Any(field => !expected.Contains(field)))
        {
            throw Fail(
                DossierEvidenceRegistryReadFailure.InvalidOutput,
                $"Dossier {objectName} contains unexpected fields.");
        }
    }

    private static string RequireString(
        JsonElement parent,
        string name,
        DossierEvidenceRegistryReadFailure failure = DossierEvidenceRegistryReadFailure.InvalidOutput)
    {
        if (!parent.TryGetProperty(name, out var value) ||
            value.ValueKind != JsonValueKind.String ||
            string.IsNullOrWhiteSpace(value.GetString()))
        {
            throw Fail(failure, $"{name} must be a nonempty string.");
        }
        return value.GetString()!;
    }

    private static string RequireBoundedString(JsonElement parent, string name, int maximumLength)
    {
        var value = RequireString(parent, name);
        if (value.Length > maximumLength)
        {
            throw Fail(
                DossierEvidenceRegistryReadFailure.InvalidOutput,
                $"{name} exceeds the {maximumLength}-character limit.");
        }
        return value;
    }

    private static async Task AwaitProcessAndStreamsFailFastAsync(params Task[] tasks)
    {
        var pending = tasks.ToList();
        while (pending.Count > 0)
        {
            var completed = await Task.WhenAny(pending).ConfigureAwait(false);
            await completed.ConfigureAwait(false);
            pending.Remove(completed);
        }
        await Task.WhenAll(tasks).ConfigureAwait(false);
    }

    private static async Task ObserveTasksAsync(params Task?[] tasks)
    {
        var started = tasks.Where(task => task is not null).Cast<Task>().ToArray();
        if (started.Length == 0)
        {
            return;
        }
        try
        {
            var all = Task.WhenAll(started);
            if (await Task.WhenAny(all, Task.Delay(TimeSpan.FromSeconds(5))).ConfigureAwait(false) == all)
            {
                await all.ConfigureAwait(false);
            }
        }
        catch
        {
            // The primary invocation path reports the governing failure.
        }
    }

    private static async Task<string> ReadBoundedAsync(
        StreamReader reader,
        int maximumBytes,
        DossierEvidenceRegistryReadFailure overflowFailure,
        CancellationToken cancellationToken)
    {
        var builder = new StringBuilder();
        var buffer = new char[4096];
        var bytesRead = 0;
        while (true)
        {
            var count = await reader.ReadAsync(buffer.AsMemory(), cancellationToken).ConfigureAwait(false);
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
        catch (Exception ex) when (ex is InvalidOperationException or OperationCanceledException)
        {
            // The process exited between the state check and termination.
        }
    }

    private async Task<bool> DeleteInvocationDirectoryAsync(string path)
    {
        for (var attempt = 1; attempt <= 5; attempt++)
        {
            try
            {
                var injectedFailure = _cleanupFailureFactory?.Invoke(path, attempt);
                if (injectedFailure is not null)
                {
                    throw injectedFailure;
                }
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

    private static string BoundMessage(string message) =>
        message.Length <= 4096 ? message : message[..4096];

    private static HostFailureException Fail(DossierEvidenceRegistryReadFailure failure, string message) =>
        new(failure, message);

    private static DossierEvidenceRegistryReadProcessResult Failure(
        DossierEvidenceRegistryReadFailure failure,
        string message,
        string? sourceModuleHash = null,
        string? copiedModuleHash = null,
        string? sourceSchemaHash = null,
        string? copiedSchemaHash = null) =>
        new(
            DossierEvidenceRegistryReadOutcome.Failed,
            failure,
            null,
            null,
            null,
            null,
            sourceModuleHash,
            copiedModuleHash,
            sourceSchemaHash,
            copiedSchemaHash,
            message);

    private sealed record ExchangeIdentity(
        string RequestCountyId,
        string ResultCountyId,
        string CanonicalJson);

    private sealed class HostFailureException : Exception
    {
        public HostFailureException(DossierEvidenceRegistryReadFailure failure, string message)
            : base(message)
        {
            Failure = failure;
        }

        public DossierEvidenceRegistryReadFailure Failure { get; }
    }

    private void RequireBoundExecutableIdentity()
    {
        try
        {
            var canonical = RequireExecutable(_nodeExecutablePath);
            var info = new FileInfo(canonical);
            if (info.Length != _nodeExecutableLength)
            {
                throw new InvalidOperationException(
                    $"Node executable length changed from {_nodeExecutableLength} to {info.Length} bytes.");
            }

            var actualHash = ComputeFileSha256(canonical);
            if (!string.Equals(actualHash, _nodeExecutableSha256, StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    "Node executable SHA-256 changed after runtime construction.");
            }
        }
        catch (Exception exception) when (
            exception is ArgumentException or IOException or UnauthorizedAccessException
                or CryptographicException or InvalidOperationException)
        {
            throw Fail(
                DossierEvidenceRegistryReadFailure.RuntimeIdentityMismatch,
                $"The bound Node executable identity changed before process start: {exception.Message}");
        }
    }

    private static (long Length, string Sha256) CaptureExecutableIdentity(string path)
    {
        try
        {
            var info = new FileInfo(path);
            return (info.Length, ComputeFileSha256(path));
        }
        catch (Exception exception) when (
            exception is IOException or UnauthorizedAccessException or CryptographicException)
        {
            throw new ArgumentException(
                "Unable to bind the Node executable file identity.",
                nameof(path),
                exception);
        }
    }

    private static void RequireBoundExecutableIdentityForConstruction(
        string path,
        long expectedLength,
        string expectedSha256)
    {
        try
        {
            var canonical = RequireExecutable(path);
            var info = new FileInfo(canonical);
            var actualHash = ComputeFileSha256(canonical);
            if (info.Length != expectedLength
                || !string.Equals(actualHash, expectedSha256, StringComparison.Ordinal))
            {
                throw new InvalidOperationException(
                    "Node executable file identity changed during runtime construction.");
            }
        }
        catch (Exception exception) when (
            exception is ArgumentException or IOException or UnauthorizedAccessException
                or CryptographicException or InvalidOperationException)
        {
            throw new ArgumentException(
                "The Node executable identity changed before version resolution.",
                nameof(path),
                exception);
        }
    }

    private static string ResolvePermissionFlag(
        string nodeExecutablePath,
        long nodeExecutableLength,
        string nodeExecutableSha256)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = nodeExecutablePath,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };
        startInfo.ArgumentList.Add("--version");
        ReplaceWithMinimalEnvironment(startInfo.Environment);
        using var process = new Process { StartInfo = startInfo };
        try
        {
            RequireBoundExecutableIdentityForConstruction(
                nodeExecutablePath,
                nodeExecutableLength,
                nodeExecutableSha256);
            if (!process.Start())
            {
                throw new ArgumentException(
                    "Node Process.Start returned false while resolving the permission model.",
                    nameof(nodeExecutablePath));
            }
        }
        catch (Exception exception) when (
            exception is InvalidOperationException or System.ComponentModel.Win32Exception)
        {
            throw new ArgumentException(
                "Unable to start the explicit Node executable while resolving the permission model.",
                nameof(nodeExecutablePath),
                exception);
        }
        if (!process.WaitForExit(milliseconds: 5_000))
        {
            process.Kill(entireProcessTree: true);
            process.WaitForExit();
            throw new ArgumentException(
                "Node version resolution exceeded the five-second limit.",
                nameof(nodeExecutablePath));
        }
        var stdout = process.StandardOutput.ReadToEnd().Trim();
        var stderr = process.StandardError.ReadToEnd().Trim();
        if (process.ExitCode != 0)
        {
            throw new ArgumentException(
                $"Node version resolution exited with code {process.ExitCode}: {BoundMessage(stderr)}",
                nameof(nodeExecutablePath));
        }
        return PermissionFlagForVersion(stdout);
    }

    internal static string PermissionFlagForVersion(string nodeVersion)
    {
        if (string.IsNullOrWhiteSpace(nodeVersion) ||
            !Version.TryParse(nodeVersion.Trim().TrimStart('v'), out var parsed) ||
            parsed.Major < 20)
        {
            throw new ArgumentException(
                "Dossier evidence-registry-read validation requires a supported Node 20 or newer runtime.",
                nameof(nodeVersion));
        }
        if (parsed.Major is 20 or 21 ||
            parsed.Major == 22 && parsed < new Version(22, 13, 0) ||
            parsed.Major == 23 && parsed < new Version(23, 5, 0))
        {
            return "--experimental-permission";
        }
        return "--permission";
    }
}
