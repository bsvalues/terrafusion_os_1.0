using System.Diagnostics;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using TerraFusion.API.Configuration;
using TerraFusion.API.DTOs;

namespace TerraFusion.API.Services.Dossier;

/// <summary>One bounded process per decision over a verified, isolated protected module closure.</summary>
public sealed class DossierPacketWorkflowProcessHost
{
    private const int MaximumBytes = 4 * 1024 * 1024;
    private static readonly Encoding Utf8 = new UTF8Encoding(false, true);
    private readonly string node, artifacts, invocationRoot, nodeHash;
    private readonly long nodeLength;
    private readonly TimeSpan timeout;
    private static DossierWorkflowException Identity() => new(503, "ARTIFACT_IDENTITY_MISMATCH", "Protected packet workflow file identity failed.");
    private static DossierWorkflowException Unavailable() => new(503, "CANONICAL_UNAVAILABLE", "Canonical packet process did not complete safely.");
    private static string Hash(byte[] bytes) => Convert.ToHexString(SHA256.HashData(bytes)).ToLowerInvariant();

    public DossierPacketWorkflowProcessHost(string nodeExecutablePath, string artifactRoot, string temporaryRoot, TimeSpan? timeout = null)
    {
        node = Path.GetFullPath(nodeExecutablePath); artifacts = Path.GetFullPath(artifactRoot);
        invocationRoot = Path.GetFullPath(temporaryRoot);
        this.timeout = timeout ?? TimeSpan.FromSeconds(30);
        if (this.timeout <= TimeSpan.Zero || this.timeout > TimeSpan.FromSeconds(30)) throw new ArgumentOutOfRangeException(nameof(timeout));
        CheckAncestors(node);
        var bytes = File.ReadAllBytes(node); nodeLength = bytes.LongLength; nodeHash = Hash(bytes);
    }

    public async Task<JsonObject> DecideAsync(JsonObject request, CancellationToken ct)
    {
        var started = Stopwatch.GetTimestamp();
        var outcome = "unavailable";
        var rawCid = request["traceId"]?.GetValue<string>();
        var cid = !string.IsNullOrEmpty(rawCid) && System.Text.RegularExpressions.Regex.IsMatch(rawCid, "^[A-Za-z0-9._-]{1,128}$")
            ? rawCid : "sha256-" + Hash(Utf8.GetBytes(rawCid ?? ""));
        var rawOperation = request["operation"]?.GetValue<string>();
        var operation = rawOperation is "evaluate" or "finalize" or "prepare" or "revise" ? rawOperation : "invalid";
        try
        {
            var result = await DecideCoreAsync(request, ct);
            outcome = result["decision"]!.GetValue<string>();
            return result;
        }
        finally
        {
            var elapsed = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
            var activity = Activity.Current;
            activity?.AddEvent(new ActivityEvent("dossier.packet.canonical", tags: new ActivityTagsCollection {
                { "correlation.id", cid }, { "operation", operation }, { "outcome", outcome }, { "duration_ms", elapsed } }));
            activity?.SetTag("dossier.canonical.outcome", outcome);
            activity?.SetTag("dossier.canonical.duration_ms", elapsed);
        }
    }

    private async Task<JsonObject> DecideCoreAsync(JsonObject request, CancellationToken ct)
    {
        var input = Utf8.GetBytes(request.ToJsonString());
        if (input.Length > MaximumBytes) throw new DossierWorkflowException(400, "INVALID_INPUT", "Packet snapshot exceeds the bounded transport size.");
        var verified = Verify(artifacts);
        CheckAncestors(node);
        var executable = File.ReadAllBytes(node);
        if (executable.LongLength != nodeLength || Hash(executable) != nodeHash) throw Identity();
        Directory.CreateDirectory(invocationRoot); CheckAncestors(invocationRoot);
        var directory = Path.Combine(invocationRoot, Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(directory);
        try
        {
            foreach (var (path, bytes) in verified)
            {
                var destination = Path.Combine(directory, path);
                Directory.CreateDirectory(Path.GetDirectoryName(destination)!);
                await File.WriteAllBytesAsync(destination, bytes, ct);
            }
            Verify(directory);
            var runner = Path.Combine(directory, "runner.mjs");
            await File.WriteAllTextAsync(runner, Runner, Utf8, ct);
            var version = await Run(directory, ["--version"], null, ct, 1024);
            var flag = DossierEvidenceRegistryReadProcessHost.PermissionFlagForVersion(version);
            var output = await Run(directory, [flag, "--allow-fs-read=" + directory, "--disable-proto=throw", runner], input, ct, MaximumBytes);
            JsonObject result;
            try { result = JsonNode.Parse(output)!.AsObject(); }
            catch (Exception ex) when (ex is JsonException or InvalidOperationException or NullReferenceException) { throw Unavailable(); }
            // Transport attestation only. The protected suite owns the meaning of readiness and violations.
            foreach (var key in new[] { "schemaVersion", "contractId", "commandId", "countyId", "taxYear", "parcelId", "traceId" })
                if (!JsonNode.DeepEquals(request[key], result[key])) throw Unavailable();
            if (!JsonNode.DeepEquals(request["packet"]?["packetId"], result["packetId"]) ||
                result["decision"]?.GetValue<string>() is not ("accepted" or "rejected") || result["violations"] is not JsonArray) throw Unavailable();
            if (result["decision"]!.GetValue<string>() == "rejected" && (result.ContainsKey("snapshot") || result.ContainsKey("handoff"))) throw Unavailable();
            return result;
        }
        finally
        {
            // Only this invocation's newly allocated child; never the shared root or another process.
            CheckAncestors(directory);
            if (Directory.Exists(directory)) Directory.Delete(directory, true);
        }
    }

    private static Dictionary<string, byte[]> Verify(string root)
    {
        try
        {
            CheckAncestors(root);
            var paths = new List<string>();
            void Visit(string directory)
            {
                foreach (var entry in Directory.EnumerateFileSystemEntries(directory))
                {
                    if ((File.GetAttributes(entry) & FileAttributes.ReparsePoint) != 0) throw Identity();
                    if (Directory.Exists(entry)) Visit(entry); else paths.Add(Path.GetRelativePath(root, entry).Replace('\\', '/'));
                }
            }
            Visit(root);
            var expected = DossierPacketWorkflowOptions.Files;
            if (paths.Count != expected.Length || paths.Except(expected.Select(x => x.Path), StringComparer.Ordinal).Any()) throw Identity();
            var result = new Dictionary<string, byte[]>(StringComparer.Ordinal);
            foreach (var file in expected)
            {
                var path = Path.Combine(root, file.Path);
                if (new FileInfo(path).Length != file.Length) throw Identity();
                var bytes = File.ReadAllBytes(path);
                if (bytes.LongLength != file.Length || Hash(bytes) != file.Hash) throw Identity();
                result.Add(file.Path, bytes);
            }
            return result;
        }
        catch (Exception ex) when (ex is IOException or UnauthorizedAccessException) { throw Identity(); }
    }

    private static void CheckAncestors(string path)
    {
        for (string? current = Path.GetFullPath(path); current != null; current = Path.GetDirectoryName(current))
            if ((File.Exists(current) || Directory.Exists(current)) && (File.GetAttributes(current) & FileAttributes.ReparsePoint) != 0) throw Identity();
    }

    private async Task<string> Run(string directory, string[] arguments, byte[]? input, CancellationToken ct, int maximumOutput)
    {
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(ct);
        deadline.CancelAfter(timeout);
        var start = new ProcessStartInfo(node) { WorkingDirectory = directory, UseShellExecute = false, CreateNoWindow = true,
            RedirectStandardInput = true, RedirectStandardOutput = true, RedirectStandardError = true };
        start.Environment.Clear();
        foreach (var name in new[] { "SystemRoot", "WINDIR" })
            if (Environment.GetEnvironmentVariable(name) is { } value) start.Environment[name] = value;
        start.Environment["TEMP"] = directory; start.Environment["TMP"] = directory;
        foreach (var argument in arguments) start.ArgumentList.Add(argument);
        using var process = new Process { StartInfo = start };
        var started = false;
        try
        {
            started = process.Start();
            if (!started) throw Unavailable();
            var stdout = ReadBounded(process.StandardOutput.BaseStream, maximumOutput, deadline.Token);
            var stderr = ReadBounded(process.StandardError.BaseStream, 64 * 1024, deadline.Token);
            if (input != null) await process.StandardInput.BaseStream.WriteAsync(input, deadline.Token);
            process.StandardInput.Close();
            await Task.WhenAll(process.WaitForExitAsync(deadline.Token), stdout, stderr).WaitAsync(deadline.Token);
            if (process.ExitCode != 0) throw Unavailable();
            return Utf8.GetString(await stdout);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested) { throw Unavailable(); }
        catch (Exception ex) when (ex is IOException or System.ComponentModel.Win32Exception or DecoderFallbackException) { throw Unavailable(); }
        finally
        {
            if (started && !process.HasExited)
            {
                process.Kill(entireProcessTree: true);
                await process.WaitForExitAsync(CancellationToken.None);
            }
        }
    }

    private static async Task<byte[]> ReadBounded(Stream stream, int maximum, CancellationToken ct)
    {
        using var buffer = new MemoryStream();
        var chunk = new byte[8192];
        while (true)
        {
            var count = await stream.ReadAsync(chunk, ct);
            if (count == 0) break;
            if (buffer.Length + count > maximum) throw Unavailable();
            buffer.Write(chunk, 0, count);
        }
        return buffer.ToArray();
    }

    private const string Runner = """
        import net from 'node:net';
        import http from 'node:http';
        import https from 'node:https';
        import tls from 'node:tls';
        import dgram from 'node:dgram';
        import dns from 'node:dns';
        import { syncBuiltinESMExports } from 'node:module';
        const deny = () => { throw new Error('Dossier packet network access denied'); };
        for (const [target, names] of [
          [net, ['connect','createConnection','createServer']],
          [http, ['get','request','createServer']], [https, ['get','request','createServer']],
          [tls, ['connect','createServer']], [dgram, ['createSocket']],
          [dns, ['lookup','resolve','resolve4','resolve6']]
        ]) for (const name of names) target[name] = deny;
        for (const [prototype, names] of [
          [net.Socket.prototype,['connect']], [dgram.Socket.prototype,['bind','connect','send']],
          [tls.TLSSocket.prototype,['connect']], [http.ClientRequest.prototype,['end','write']]
        ]) for (const name of names) if (name in prototype) prototype[name] = deny;
        for (const name of Object.keys(dns.promises)) if (typeof dns.promises[name] === 'function') dns.promises[name] = deny;
        for (const name of Object.getOwnPropertyNames(dns.Resolver.prototype))
          if (name !== 'constructor' && typeof dns.Resolver.prototype[name] === 'function') dns.Resolver.prototype[name] = deny;
        globalThis.fetch = deny;
        globalThis.WebSocket = class { constructor() { deny(); } };
        globalThis.EventSource = class { constructor() { deny(); } };
        if (typeof process.getBuiltinModule === 'function') Object.defineProperty(process, 'getBuiltinModule', { value: deny });
        syncBuiltinESMExports();
        let input = ''; let size = 0;
        process.stdin.setEncoding('utf8');
        for await (const chunk of process.stdin) {
          size += Buffer.byteLength(chunk, 'utf8');
          if (size > 4194304) throw new Error('Packet input too large');
          input += chunk;
        }
        const request = JSON.parse(input);
        let result;
        if (request.contractId === 'dossier.appeal-handoff') {
          const module = await import('./src/appeal-handoff/decide-dossier-appeal-handoff.mjs');
          result = module.decideDossierAppealHandoff(request);
        } else if (request.contractId === 'dossier.packet-finalization') {
          const module = await import('./src/packet-finalization/decide-dossier-packet-finalization.mjs');
          result = module.decideDossierPacketFinalization(request);
        } else throw new Error('Unknown packet contract');
        process.stdout.write(JSON.stringify(result));
        """;
}
