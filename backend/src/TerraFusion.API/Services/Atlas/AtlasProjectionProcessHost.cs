using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace TerraFusion.API.Services.Atlas;

/// <summary>
/// Executes one hash-pinned local Atlas projection module in a disposable, constrained Node process.
/// This host is intentionally unwired and must be manually instantiated.
/// </summary>
public sealed class AtlasProjectionProcessHost : IAtlasProjectionProcessHost
{
    internal const int MaximumInputBytes = 1024 * 1024;
    internal const int MaximumStandardOutputBytes = 1024 * 1024;
    internal const int MaximumStandardErrorBytes = 64 * 1024;
    private static readonly Encoding Utf8WithoutBom = new UTF8Encoding(false, true);
    private static readonly Encoding ProcessUtf8 = new UTF8Encoding(false, false);
    private static readonly StringComparison PathComparison = OperatingSystem.IsWindows()
        ? StringComparison.OrdinalIgnoreCase
        : StringComparison.Ordinal;
    private static readonly HashSet<string> TopLevelFields = new(StringComparer.Ordinal)
    {
        "type", "geometry", "properties",
    };
    private static readonly HashSet<string> PropertyFields = new(StringComparer.Ordinal)
    {
        "countyId", "parcelId", "evidenceState",
    };

    private static readonly string RunnerSource = $$"""
        import dgram from 'node:dgram';
        import dns from 'node:dns';
        import http from 'node:http';
        import https from 'node:https';
        import net from 'node:net';
        import tls from 'node:tls';
        import { syncBuiltinESMExports } from 'node:module';
        import { pathToFileURL } from 'node:url';

        const denyNetwork = () => {
          throw new Error('Network access is denied by the Atlas projection host.');
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
          if (inputBytes > {{MaximumInputBytes}}) throw new Error('Atlas exchange exceeds 1 MiB.');
          input += chunk;
        }
        const exchange = JSON.parse(input);
        const projection = await import(pathToFileURL(process.argv[2]).href);
        const result = await projection.projectAtlasFeature(exchange);
        process.stdout.write(JSON.stringify(result));
        """;

    private readonly string _nodeExecutablePath;
    private readonly string _permissionFlag;
    private readonly TimeSpan _timeout;
    private readonly string _temporaryRoot;
    private readonly Func<string, CancellationToken, Task>? _afterModuleCopied;

    public AtlasProjectionProcessHost(
        string nodeExecutablePath,
        TimeSpan? timeout = null,
        string? temporaryRoot = null)
        : this(nodeExecutablePath, timeout, temporaryRoot, afterModuleCopied: null)
    {
    }

    internal AtlasProjectionProcessHost(
        string nodeExecutablePath,
        TimeSpan? timeout,
        string? temporaryRoot,
        Func<string, CancellationToken, Task>? afterModuleCopied)
    {
        _nodeExecutablePath = RequireExecutable(nodeExecutablePath);
        _permissionFlag = ResolvePermissionFlag(_nodeExecutablePath);
        _timeout = timeout ?? TimeSpan.FromSeconds(30);
        if (_timeout <= TimeSpan.Zero || _timeout > TimeSpan.FromSeconds(30))
        {
            throw new ArgumentOutOfRangeException(
                nameof(timeout),
                "Atlas projection timeout must be greater than zero and no more than 30 seconds.");
        }

        _temporaryRoot = Path.GetFullPath(temporaryRoot ?? Path.GetTempPath());
        _afterModuleCopied = afterModuleCopied;
    }

    public async Task<AtlasProjectionProcessResult> ProjectAsync(
        string modulePath,
        string expectedModuleSha256,
        string spatialReadExchangeJson,
        CancellationToken cancellationToken = default)
    {
        string? invocationDirectory = null;
        AtlasProjectionProcessResult? result = null;
        var cleanupSucceeded = true;

        try
        {
            var canonicalModulePath = ValidateModulePath(modulePath);
            var expectedHash = ValidateExpectedHash(expectedModuleSha256);
            var exchange = ValidateExchange(spatialReadExchangeJson);
            var sourceHash = ComputeFileSha256(canonicalModulePath);
            if (!string.Equals(sourceHash, expectedHash, StringComparison.Ordinal))
            {
                throw Fail(
                    AtlasProjectionFailure.SourceHashMismatch,
                    $"Atlas source module hash mismatch: expected {expectedHash}, found {sourceHash}.");
            }

            invocationDirectory = Path.Combine(
                _temporaryRoot,
                "terrafusion-atlas-projection-host",
                Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(invocationDirectory);
            var copiedModulePath = Path.Combine(invocationDirectory, "project-atlas-feature.mjs");
            var runnerPath = Path.Combine(invocationDirectory, "atlas-projection-runner.mjs");
            File.Copy(canonicalModulePath, copiedModulePath, overwrite: false);
            if (_afterModuleCopied is not null)
            {
                await _afterModuleCopied(copiedModulePath, cancellationToken).ConfigureAwait(false);
            }

            var copiedHash = ComputeFileSha256(copiedModulePath);
            if (!string.Equals(copiedHash, expectedHash, StringComparison.Ordinal))
            {
                throw Fail(
                    AtlasProjectionFailure.CopiedModuleHashMismatch,
                    $"Disposable Atlas module hash mismatch: expected {expectedHash}, found {copiedHash}.");
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
                    spatialReadExchangeJson,
                    exchange,
                    sourceHash,
                    copiedHash,
                    cancellationToken)
                .ConfigureAwait(false);
        }
        catch (HostFailureException ex)
        {
            result = Failure(ex.Failure, ex.Message);
        }
        catch (OperationCanceledException)
        {
            result = Failure(AtlasProjectionFailure.Cancelled, "Atlas projection was cancelled.");
        }
        catch (Exception ex) when (
            ex is IOException or UnauthorizedAccessException or CryptographicException)
        {
            result = Failure(
                AtlasProjectionFailure.ProcessStartFailed,
                $"Atlas projection preparation failed closed: {ex.Message}");
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
                AtlasProjectionFailure.CleanupFailed,
                $"Atlas invocation cleanup failed: {invocationDirectory}",
                result?.SourceModuleSha256,
                result?.CopiedModuleSha256);
        }

        return result!;
    }

    private async Task<AtlasProjectionProcessResult> InvokeNodeAsync(
        string invocationDirectory,
        string runnerPath,
        string copiedModulePath,
        string exchangeJson,
        ExchangeIdentity exchange,
        string sourceHash,
        string copiedHash,
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
        startInfo.ArgumentList.Add($"--allow-fs-write={invocationDirectory}");
        startInfo.ArgumentList.Add(runnerPath);
        startInfo.ArgumentList.Add(copiedModulePath);
        ReplaceWithMinimalEnvironment(startInfo.Environment);

        using var process = new Process { StartInfo = startInfo };
        try
        {
            if (!process.Start())
            {
                throw Fail(
                    AtlasProjectionFailure.ProcessStartFailed,
                    "Node Process.Start returned false.");
            }
        }
        catch (Exception ex) when (ex is InvalidOperationException or System.ComponentModel.Win32Exception)
        {
            throw Fail(
                AtlasProjectionFailure.ProcessStartFailed,
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
                AtlasProjectionFailure.StandardOutputTooLarge,
                linkedCts.Token);
            stderrTask = ReadBoundedAsync(
                process.StandardError,
                MaximumStandardErrorBytes,
                AtlasProjectionFailure.StandardErrorTooLarge,
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
                    AtlasProjectionFailure.NonZeroExit,
                    $"Atlas projection exited with code {process.ExitCode}: {BoundMessage(stderr)}");
            }

            if (string.IsNullOrWhiteSpace(stdout))
            {
                throw Fail(AtlasProjectionFailure.MissingOutput, "Atlas projection produced no output.");
            }

            return ValidateOutput(stdout, exchange, sourceHash, copiedHash);
        }
        catch (OperationCanceledException)
        {
            await KillProcessTreeAsync(process).ConfigureAwait(false);
            throw Fail(
                cancellationToken.IsCancellationRequested
                    ? AtlasProjectionFailure.Cancelled
                    : AtlasProjectionFailure.Timeout,
                cancellationToken.IsCancellationRequested
                    ? "Atlas projection was cancelled."
                    : $"Atlas projection exceeded the {_timeout.TotalSeconds.ToString(CultureInfo.InvariantCulture)}-second limit.");
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
        AtlasProjectionFailure overflowFailure,
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

    private static AtlasProjectionProcessResult ValidateOutput(
        string stdout,
        ExchangeIdentity exchange,
        string sourceHash,
        string copiedHash)
    {
        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(stdout);
        }
        catch (JsonException ex)
        {
            throw Fail(AtlasProjectionFailure.InvalidOutput, $"Invalid Atlas JSON output: {ex.Message}");
        }

        using (document)
        {
            var root = document.RootElement;
            if (root.ValueKind == JsonValueKind.Null)
            {
                if (!string.Equals(exchange.GeometryState, "unavailable", StringComparison.Ordinal))
                {
                    throw Fail(
                        AtlasProjectionFailure.InvalidOutput,
                        "Atlas null output requires unavailable exchange geometry.");
                }

                return new AtlasProjectionProcessResult(
                    AtlasProjectionOutcome.Unavailable,
                    AtlasProjectionFailure.None,
                    "null",
                    exchange.CountyId,
                    exchange.ParcelId,
                    exchange.EvidenceState,
                    sourceHash,
                    copiedHash,
                    null);
            }

            RequireExactObjectFields(root, TopLevelFields, "feature");
            if (!string.Equals(RequireString(root, "type"), "Feature", StringComparison.Ordinal))
            {
                throw Fail(AtlasProjectionFailure.InvalidOutput, "Atlas output type must be Feature.");
            }

            var properties = root.GetProperty("properties");
            RequireExactObjectFields(properties, PropertyFields, "properties");
            var countyId = RequireString(properties, "countyId");
            var parcelId = RequireString(properties, "parcelId");
            var evidenceState = RequireString(properties, "evidenceState");
            if (!string.Equals(countyId, exchange.CountyId, StringComparison.Ordinal) ||
                !string.Equals(parcelId, exchange.ParcelId, StringComparison.Ordinal))
            {
                throw Fail(
                    AtlasProjectionFailure.IdentityMismatch,
                    "Atlas output countyId and parcelId must match exchange.result.");
            }

            var geometry = root.GetProperty("geometry");
            RequireExactObjectFields(
                geometry,
                new HashSet<string>(StringComparer.Ordinal) { "type", "coordinates" },
                "geometry");
            var geometryType = RequireString(geometry, "type");
            var coordinates = geometry.GetProperty("coordinates");
            var outcome = geometryType switch
            {
                "Point" => ValidatePoint(coordinates),
                "Polygon" => ValidatePolygon(coordinates),
                _ => throw Fail(
                    AtlasProjectionFailure.InvalidGeometry,
                    "Atlas geometry type must be Point or Polygon."),
            };
            var expectedGeometryState = outcome == AtlasProjectionOutcome.Point
                ? "centroid_only"
                : "polygon";
            if (!string.Equals(exchange.GeometryState, expectedGeometryState, StringComparison.Ordinal))
            {
                throw Fail(
                    AtlasProjectionFailure.InvalidOutput,
                    $"Atlas {geometryType} output does not match exchange geometryState {exchange.GeometryState}.");
            }

            var normalized = NormalizeFeature(
                outcome,
                coordinates,
                countyId,
                parcelId,
                evidenceState);
            return new AtlasProjectionProcessResult(
                outcome,
                AtlasProjectionFailure.None,
                normalized,
                countyId,
                parcelId,
                evidenceState,
                sourceHash,
                copiedHash,
                null);
        }
    }

    private static AtlasProjectionOutcome ValidatePoint(JsonElement coordinates)
    {
        if (coordinates.ValueKind != JsonValueKind.Array || coordinates.GetArrayLength() != 2)
        {
            throw Fail(AtlasProjectionFailure.InvalidGeometry, "Point requires exactly two coordinates.");
        }

        ValidatePosition(coordinates, "Point");
        return AtlasProjectionOutcome.Point;
    }

    private static AtlasProjectionOutcome ValidatePolygon(JsonElement coordinates)
    {
        if (coordinates.ValueKind != JsonValueKind.Array || coordinates.GetArrayLength() != 1)
        {
            throw Fail(AtlasProjectionFailure.InvalidGeometry, "Polygon requires exactly one outer ring.");
        }

        var ring = coordinates[0];
        if (ring.ValueKind != JsonValueKind.Array || ring.GetArrayLength() < 4)
        {
            throw Fail(AtlasProjectionFailure.InvalidGeometry, "Polygon outer ring requires at least four positions.");
        }

        var positions = ring.EnumerateArray()
            .Select(position => ValidatePosition(position, "Polygon"))
            .ToArray();
        if (positions[0] != positions[^1])
        {
            throw Fail(AtlasProjectionFailure.InvalidGeometry, "Polygon outer ring must be closed.");
        }

        if (positions.Take(positions.Length - 1).Distinct().Count() < 3)
        {
            throw Fail(AtlasProjectionFailure.InvalidGeometry, "Polygon outer ring requires three distinct positions.");
        }

        return AtlasProjectionOutcome.Polygon;
    }

    private static (double Longitude, double Latitude) ValidatePosition(
        JsonElement position,
        string geometryType)
    {
        if (position.ValueKind != JsonValueKind.Array || position.GetArrayLength() != 2 ||
            !position[0].TryGetDouble(out var longitude) ||
            !position[1].TryGetDouble(out var latitude) ||
            !double.IsFinite(longitude) ||
            !double.IsFinite(latitude) ||
            longitude is < -180 or > 180 ||
            latitude is < -90 or > 90)
        {
            throw Fail(
                AtlasProjectionFailure.InvalidGeometry,
                $"{geometryType} coordinates must be finite WGS-84 longitude/latitude pairs.");
        }

        return (longitude, latitude);
    }

    private static string NormalizeFeature(
        AtlasProjectionOutcome outcome,
        JsonElement coordinates,
        string countyId,
        string parcelId,
        string evidenceState)
    {
        using var stream = new MemoryStream();
        using (var writer = new Utf8JsonWriter(stream))
        {
            writer.WriteStartObject();
            writer.WriteString("type", "Feature");
            writer.WriteStartObject("geometry");
            writer.WriteString("type", outcome == AtlasProjectionOutcome.Point ? "Point" : "Polygon");
            writer.WritePropertyName("coordinates");
            WriteCoordinates(writer, coordinates);
            writer.WriteEndObject();
            writer.WriteStartObject("properties");
            writer.WriteString("countyId", countyId);
            writer.WriteString("parcelId", parcelId);
            writer.WriteString("evidenceState", evidenceState);
            writer.WriteEndObject();
            writer.WriteEndObject();
        }

        return Utf8WithoutBom.GetString(stream.ToArray());
    }

    private static void WriteCoordinates(Utf8JsonWriter writer, JsonElement element)
    {
        if (element.ValueKind == JsonValueKind.Array)
        {
            writer.WriteStartArray();
            foreach (var item in element.EnumerateArray())
            {
                WriteCoordinates(writer, item);
            }
            writer.WriteEndArray();
            return;
        }

        writer.WriteNumberValue(element.GetDouble());
    }

    private static ExchangeIdentity ValidateExchange(string exchangeJson)
    {
        if (exchangeJson is null)
        {
            throw Fail(AtlasProjectionFailure.InvalidExchange, "Atlas exchange is required.");
        }
        if (Utf8WithoutBom.GetByteCount(exchangeJson) > MaximumInputBytes)
        {
            throw Fail(AtlasProjectionFailure.InputTooLarge, "Atlas exchange exceeds 1 MiB.");
        }

        try
        {
            using var document = JsonDocument.Parse(exchangeJson);
            var result = document.RootElement.GetProperty("result");
            if (result.ValueKind != JsonValueKind.Object)
            {
                throw new InvalidOperationException("result must be an object");
            }

            var boundary = result.GetProperty("boundary");
            if (boundary.ValueKind != JsonValueKind.Object)
            {
                throw new InvalidOperationException("boundary must be an object");
            }

            var geometryState = RequireString(
                boundary,
                "geometryState",
                AtlasProjectionFailure.InvalidExchange);
            if (geometryState is not ("polygon" or "centroid_only" or "unavailable"))
            {
                throw Fail(
                    AtlasProjectionFailure.InvalidExchange,
                    $"Unsupported exchange geometryState: {geometryState}.");
            }

            return new ExchangeIdentity(
                RequireString(result, "countyId", AtlasProjectionFailure.InvalidExchange),
                RequireString(result, "parcelId", AtlasProjectionFailure.InvalidExchange),
                RequireString(result, "evidenceState", AtlasProjectionFailure.InvalidExchange),
                geometryState);
        }
        catch (Exception ex) when (
            ex is JsonException or KeyNotFoundException or InvalidOperationException)
        {
            throw Fail(AtlasProjectionFailure.InvalidExchange, $"Invalid Atlas exchange: {ex.Message}");
        }
    }

    private static string ValidateModulePath(string modulePath)
    {
        if (string.IsNullOrWhiteSpace(modulePath) || !Path.IsPathFullyQualified(modulePath))
        {
            throw Fail(AtlasProjectionFailure.InvalidModulePath, "Atlas module path must be absolute.");
        }

        var canonical = Path.GetFullPath(modulePath);
        if (!string.Equals(canonical, modulePath, PathComparison))
        {
            throw Fail(AtlasProjectionFailure.InvalidModulePath, "Atlas module path must be canonical.");
        }
        if (Directory.Exists(canonical) || !File.Exists(canonical))
        {
            throw Fail(AtlasProjectionFailure.ModuleNotFound, "Atlas module file does not exist.");
        }
        if (!string.Equals(Path.GetExtension(canonical), ".mjs", StringComparison.OrdinalIgnoreCase))
        {
            throw Fail(AtlasProjectionFailure.UnsupportedModuleType, "Atlas module must use the .mjs extension.");
        }

        return canonical;
    }

    private static string ValidateExpectedHash(string expectedHash)
    {
        var normalized = expectedHash?.Trim().ToLowerInvariant();
        if (normalized is null || normalized.Length != 64 ||
            normalized.Any(character => !Uri.IsHexDigit(character)))
        {
            throw Fail(AtlasProjectionFailure.InvalidExpectedHash, "Expected module SHA-256 must be 64 hexadecimal characters.");
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
        if (!string.Equals(canonical, path, PathComparison) || !File.Exists(canonical))
        {
            throw new ArgumentException("Node executable path must identify an existing canonical file.", nameof(path));
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
            throw Fail(AtlasProjectionFailure.InvalidOutput, $"Atlas {objectName} must be an object.");
        }

        var actual = element.EnumerateObject().Select(property => property.Name).ToArray();
        var distinct = actual.Distinct(StringComparer.Ordinal).ToArray();
        if (actual.Length != distinct.Length || distinct.Length != expected.Count ||
            distinct.Any(field => !expected.Contains(field)))
        {
            throw Fail(AtlasProjectionFailure.InvalidOutput, $"Atlas {objectName} contains unexpected fields.");
        }
    }

    private static string RequireString(
        JsonElement parent,
        string name,
        AtlasProjectionFailure failure = AtlasProjectionFailure.InvalidOutput)
    {
        if (!parent.TryGetProperty(name, out var value))
        {
            throw Fail(failure, $"{name} is required.");
        }
        if (value.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(value.GetString()))
        {
            throw Fail(failure, $"{name} must be a nonempty string.");
        }

        return value.GetString()!;
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
            catch (IOException)
            {
                if (attempt < 5)
                {
                    await Task.Delay(100 * attempt).ConfigureAwait(false);
                }
            }
            catch (UnauthorizedAccessException)
            {
                if (attempt < 5)
                {
                    await Task.Delay(100 * attempt).ConfigureAwait(false);
                }
            }
        }

        return false;
    }

    private static string BoundMessage(string message) =>
        message.Length <= 4096 ? message : message[..4096];

    private static HostFailureException Fail(AtlasProjectionFailure failure, string message) =>
        new(failure, message);

    private static AtlasProjectionProcessResult Failure(
        AtlasProjectionFailure failure,
        string message,
        string? sourceHash = null,
        string? copiedHash = null) =>
        new(
            AtlasProjectionOutcome.Failed,
            failure,
            null,
            null,
            null,
            null,
            sourceHash,
            copiedHash,
            message);

    private sealed record ExchangeIdentity(
        string CountyId,
        string ParcelId,
        string EvidenceState,
        string GeometryState);

    private sealed class HostFailureException : Exception
    {
        public HostFailureException(AtlasProjectionFailure failure, string message)
            : base(message)
        {
            Failure = failure;
        }

        public AtlasProjectionFailure Failure { get; }
    }

    private static string ResolvePermissionFlag(string nodeExecutablePath)
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

        // `node --version` writes one short line, so the pipe buffer cannot fill
        // and block the child before it exits. The streams are therefore drained
        // after the bounded exit rather than concurrently.
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
        if (string.IsNullOrWhiteSpace(nodeVersion)
            || !Version.TryParse(nodeVersion.Trim().TrimStart('v'), out var parsed)
            || parsed.Major < 20)
        {
            throw new ArgumentException(
                "Atlas projection requires a supported Node 20 or newer runtime.",
                nameof(nodeVersion));
        }

        if (parsed.Major is 20 or 21
            || parsed.Major == 22 && parsed < new Version(22, 13, 0)
            || parsed.Major == 23 && parsed < new Version(23, 5, 0))
        {
            return "--experimental-permission";
        }

        return "--permission";
    }
}
