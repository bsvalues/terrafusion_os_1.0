using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TerraFusion.Core.Entities.Workbench;
using TerraFusion.Core.Sync.Corpus;

namespace TerraFusion.Data.Services.Workbench.Corpus;

/// <summary>
/// SYNC-COMPLETE-2: corpus-scope evidence packet service. Mirrors
/// the SYNC-WORKBENCH-H <c>EvidencePacketService</c> pattern at
/// run-scope: <c>manifest.json</c> + <c>run.csv</c> +
/// <c>lane-results.csv</c> + <c>reconciliation.csv</c> +
/// <c>gate-summaries.json</c>.
///
/// <para>Uses the same <c>Workbench:Evidence:HmacKey</c> config so a
/// single key rotation covers both H (commit) and SYNC-COMPLETE-2
/// (corpus run) artefacts. The signature covers the manifest JSON
/// with <c>signature.hex</c> blanked to <c>""</c>; verifiers re-zero
/// before recomputing.</para>
/// </summary>
public sealed class CorpusEvidencePacketService : ICorpusEvidencePacketService
{
    public const string SchemaVersion = "1.0";
    public const string GeneratorService = "TerraFusion.SyncComplete2";
    public const string GeneratorVersion = "1.0.0";

    private const string HmacKeyConfigPath = "Workbench:Evidence:HmacKey";
    private const string KeyIdConfigPath = "Workbench:Evidence:KeyId";
    private const int MinHmacKeyByteLength = 32;
    private const string HmacAlgorithm = "HMAC-SHA256";
    private const string DefaultKeyId = "default";

    private const string EntryManifest = "manifest.json";
    private const string EntryRunCsv = "run.csv";
    private const string EntryLanesCsv = "lane-results.csv";
    private const string EntryReconciliationCsv = "reconciliation.csv";
    private const string EntryGatesJson = "gate-summaries.json";

    private static readonly JsonSerializerOptions ManifestSerializerOptions = new()
    {
        WriteIndented = true,
    };

    private static readonly DateTime DeterministicZipTimestamp =
        new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly Func<DateTime> _utcNow;

    public CorpusEvidencePacketService(
        TerraFusionDbContext db,
        IConfiguration configuration)
        : this(db, configuration, () => DateTime.UtcNow)
    {
    }

    public CorpusEvidencePacketService(
        TerraFusionDbContext db,
        IConfiguration configuration,
        Func<DateTime> utcNow)
    {
        ArgumentNullException.ThrowIfNull(db);
        ArgumentNullException.ThrowIfNull(configuration);
        ArgumentNullException.ThrowIfNull(utcNow);
        _db = db;
        _configuration = configuration;
        _utcNow = utcNow;
    }

    public async Task<CorpusEvidencePacketResult> BuildAsync(
        Guid runId,
        CancellationToken cancellationToken)
    {
        if (runId == Guid.Empty)
            return Failure(CorpusEvidencePacketOutcome.NotFound, $"Run '{runId}' not found.");

        var keyResult = TryReadHmacKey();
        if (!keyResult.Ok)
            return Failure(CorpusEvidencePacketOutcome.ConfigurationError, keyResult.Error!);

        var run = await _db.FullCorpusRuns
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.RunId == runId, cancellationToken)
            .ConfigureAwait(false);
        if (run is null)
            return Failure(CorpusEvidencePacketOutcome.NotFound, $"Run '{runId}' not found.");

        var lanes = await _db.FullCorpusLaneResults
            .AsNoTracking()
            .Where(l => l.RunId == runId)
            .OrderBy(l => l.Lane)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var reconciliations = await _db.FullCorpusReconciliations
            .AsNoTracking()
            .Where(r => r.RunId == runId)
            .OrderBy(r => r.Lane)
            .ToListAsync(cancellationToken).ConfigureAwait(false);

        var runCsv = BuildRunCsv(run);
        var lanesCsv = BuildLanesCsv(lanes);
        var reconCsv = BuildReconciliationCsv(reconciliations);
        var gatesJson = BuildGateSummariesJson(lanes);

        var entries = new[]
        {
            new EvidenceEntry(EntryRunCsv, runCsv),
            new EvidenceEntry(EntryLanesCsv, lanesCsv),
            new EvidenceEntry(EntryReconciliationCsv, reconCsv),
            new EvidenceEntry(EntryGatesJson, gatesJson),
        };

        var manifestBytes = BuildSignedManifest(
            run, lanes.Count, reconciliations.Count, entries,
            keyResult.Key!, keyResult.KeyId!,
            out var signatureHex);

        using var zipStream = new MemoryStream();
        using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteZipEntry(archive, EntryManifest, manifestBytes);
            foreach (var entry in entries)
                WriteZipEntry(archive, entry.Name, entry.Content);
        }

        return new CorpusEvidencePacketResult(
            CorpusEvidencePacketOutcome.Ok,
            null,
            BuildFileName(run),
            zipStream.ToArray(),
            signatureHex);
    }

    // ── HMAC + manifest ─────────────────────────────────────────────

    private (bool Ok, byte[]? Key, string? KeyId, string? Error) TryReadHmacKey()
    {
        var raw = _configuration[HmacKeyConfigPath];
        if (string.IsNullOrEmpty(raw))
            return (false, null, null, "workbench evidence HMAC key not configured");
        var bytes = Encoding.UTF8.GetBytes(raw);
        if (bytes.Length < MinHmacKeyByteLength)
            return (false, null, null,
                $"workbench evidence HMAC key must be at least {MinHmacKeyByteLength} bytes (got {bytes.Length})");
        var keyId = _configuration[KeyIdConfigPath];
        if (string.IsNullOrWhiteSpace(keyId)) keyId = DefaultKeyId;
        return (true, bytes, keyId, null);
    }

    private byte[] BuildSignedManifest(
        FullCorpusRun run,
        int laneCount,
        int reconciliationCount,
        IReadOnlyList<EvidenceEntry> entries,
        byte[] key,
        string keyId,
        out string signatureHex)
    {
        const string SignaturePlaceholder = "";

        var placeholderManifest = BuildManifestObject(
            run, laneCount, reconciliationCount, entries, keyId, SignaturePlaceholder);
        var placeholderBytes = JsonSerializer.SerializeToUtf8Bytes(
            placeholderManifest, ManifestSerializerOptions);

        using var hmac = new HMACSHA256(key);
        var sigBytes = hmac.ComputeHash(placeholderBytes);
        signatureHex = Convert.ToHexString(sigBytes).ToLowerInvariant();

        var signed = BuildManifestObject(
            run, laneCount, reconciliationCount, entries, keyId, signatureHex);
        return JsonSerializer.SerializeToUtf8Bytes(signed, ManifestSerializerOptions);
    }

    private ManifestRoot BuildManifestObject(
        FullCorpusRun run,
        int laneCount,
        int reconciliationCount,
        IReadOnlyList<EvidenceEntry> entries,
        string keyId,
        string signatureHex)
    {
        var entrySummaries = new List<ManifestEntrySummary>(entries.Count);
        foreach (var e in entries)
        {
            entrySummaries.Add(new ManifestEntrySummary(
                Name: e.Name,
                Sha256: ComputeSha256Hex(e.Content),
                ByteCount: e.Content.Length));
        }

        return new ManifestRoot(
            SchemaVersion: SchemaVersion,
            RunId: run.RunId,
            OperatorName: run.OperatorName,
            WorkingYear: run.WorkingYear,
            Status: run.Status,
            StartedAtUtc: FormatUtc(run.StartedAt),
            FinishedAtUtc: run.FinishedAt.HasValue ? FormatUtc(run.FinishedAt.Value) : null,
            LaneCount: laneCount,
            ReconciliationCount: reconciliationCount,
            Entries: entrySummaries,
            Signature: new ManifestSignature(HmacAlgorithm, keyId, signatureHex),
            Generator: new ManifestGenerator(
                GeneratorService, GeneratorVersion, FormatUtc(_utcNow())));
    }

    // ── CSV / JSON builders ─────────────────────────────────────────

    private static byte[] BuildRunCsv(FullCorpusRun run)
    {
        var sb = new StringBuilder();
        sb.Append("RunId,OperatorName,WorkingYear,Status,CurrentLane,NextLaneOnResume," +
                  "StartedAt,FinishedAt,ErrorMessage\n");
        sb.Append(CsvEscape(run.RunId.ToString())).Append(',');
        sb.Append(CsvEscape(run.OperatorName)).Append(',');
        sb.Append(run.WorkingYear.ToString(CultureInfo.InvariantCulture)).Append(',');
        sb.Append(CsvEscape(run.Status)).Append(',');
        sb.Append(CsvEscape(run.CurrentLane ?? string.Empty)).Append(',');
        sb.Append(CsvEscape(run.NextLaneOnResume ?? string.Empty)).Append(',');
        sb.Append(CsvEscape(FormatUtc(run.StartedAt))).Append(',');
        sb.Append(CsvEscape(run.FinishedAt.HasValue ? FormatUtc(run.FinishedAt.Value) : string.Empty)).Append(',');
        sb.Append(CsvEscape(run.ErrorMessage ?? string.Empty));
        sb.Append('\n');
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static byte[] BuildLanesCsv(IReadOnlyList<FullCorpusLaneResult> lanes)
    {
        var sb = new StringBuilder();
        sb.Append("LaneResultId,RunId,Lane,Status,StartedAt,FinishedAt," +
                  "BatchIdsJson,CountsJson,QuarantineDeltaJson,ErrorMessage\n");
        foreach (var l in lanes)
        {
            sb.Append(CsvEscape(l.LaneResultId.ToString())).Append(',');
            sb.Append(CsvEscape(l.RunId.ToString())).Append(',');
            sb.Append(CsvEscape(l.Lane)).Append(',');
            sb.Append(CsvEscape(l.Status)).Append(',');
            sb.Append(CsvEscape(l.StartedAt.HasValue ? FormatUtc(l.StartedAt.Value) : string.Empty)).Append(',');
            sb.Append(CsvEscape(l.FinishedAt.HasValue ? FormatUtc(l.FinishedAt.Value) : string.Empty)).Append(',');
            sb.Append(CsvEscape(l.BatchIdsJson ?? string.Empty)).Append(',');
            sb.Append(CsvEscape(l.CountsJson ?? string.Empty)).Append(',');
            sb.Append(CsvEscape(l.QuarantineDeltaJson ?? string.Empty)).Append(',');
            sb.Append(CsvEscape(l.ErrorMessage ?? string.Empty));
            sb.Append('\n');
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static byte[] BuildReconciliationCsv(IReadOnlyList<FullCorpusReconciliation> rows)
    {
        var sb = new StringBuilder();
        sb.Append("ReconciliationId,RunId,Lane,ExpectedBasis," +
                  "PacsSourceCount,TfCanonicalCount,Delta,DeltaPct,TolerancePct," +
                  "ReconciliationStatus,Notes,ComputedAt\n");
        foreach (var r in rows)
        {
            sb.Append(CsvEscape(r.ReconciliationId.ToString())).Append(',');
            sb.Append(CsvEscape(r.RunId.ToString())).Append(',');
            sb.Append(CsvEscape(r.Lane)).Append(',');
            sb.Append(CsvEscape(r.ExpectedBasis)).Append(',');
            sb.Append(r.PacsSourceCount.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append(r.TfCanonicalCount.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append(r.Delta.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append(r.DeltaPct.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append(r.TolerancePct.ToString(CultureInfo.InvariantCulture)).Append(',');
            sb.Append(CsvEscape(r.ReconciliationStatus)).Append(',');
            sb.Append(CsvEscape(r.Notes ?? string.Empty)).Append(',');
            sb.Append(CsvEscape(FormatUtc(r.ComputedAt)));
            sb.Append('\n');
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static byte[] BuildGateSummariesJson(IReadOnlyList<FullCorpusLaneResult> lanes)
    {
        var consolidated = lanes.Select(l => new
        {
            lane = l.Lane,
            status = l.Status,
            gateSummary = SafeParseRaw(l.GateSummaryJson),
        }).ToList();
        return JsonSerializer.SerializeToUtf8Bytes(consolidated, ManifestSerializerOptions);
    }

    private static object? SafeParseRaw(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = JsonDocument.Parse(json);
            return JsonSerializer.Deserialize<JsonElement>(doc.RootElement.GetRawText());
        }
        catch (JsonException)
        {
            return null;
        }
    }

    // ── Encoding utilities ──────────────────────────────────────────

    private static string CsvEscape(string field)
    {
        if (string.IsNullOrEmpty(field)) return string.Empty;
        var needsQuoting = false;
        for (var i = 0; i < field.Length; i++)
        {
            var c = field[i];
            if (c == ',' || c == '"' || c == '\n' || c == '\r') { needsQuoting = true; break; }
        }
        if (!needsQuoting) return field;
        var escaped = field.Replace("\"", "\"\"", StringComparison.Ordinal);
        return $"\"{escaped}\"";
    }

    private static string FormatUtc(DateTime dt)
    {
        var utc = dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        return utc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture);
    }

    private static string ComputeSha256Hex(byte[] content)
    {
        var hash = SHA256.HashData(content);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string BuildFileName(FullCorpusRun run)
    {
        var stamp = (run.StartedAt.Kind == DateTimeKind.Utc
                ? run.StartedAt
                : DateTime.SpecifyKind(run.StartedAt, DateTimeKind.Utc))
            .ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
        return $"terrafusion-corpus-evidence-{run.RunId}-{stamp}.zip";
    }

    private static void WriteZipEntry(ZipArchive archive, string name, byte[] content)
    {
        var entry = archive.CreateEntry(name, CompressionLevel.NoCompression);
        entry.LastWriteTime = DeterministicZipTimestamp;
        using var stream = entry.Open();
        stream.Write(content, 0, content.Length);
    }

    private static CorpusEvidencePacketResult Failure(CorpusEvidencePacketOutcome o, string err) =>
        new(o, err, null, null, null);

    private sealed record EvidenceEntry(string Name, byte[] Content);

    // ── Manifest DTOs ───────────────────────────────────────────────

    private sealed record ManifestRoot(
        [property: System.Text.Json.Serialization.JsonPropertyName("schemaVersion")] string SchemaVersion,
        [property: System.Text.Json.Serialization.JsonPropertyName("runId")] Guid RunId,
        [property: System.Text.Json.Serialization.JsonPropertyName("operatorName")] string OperatorName,
        [property: System.Text.Json.Serialization.JsonPropertyName("workingYear")] short WorkingYear,
        [property: System.Text.Json.Serialization.JsonPropertyName("status")] string Status,
        [property: System.Text.Json.Serialization.JsonPropertyName("startedAtUtc")] string StartedAtUtc,
        [property: System.Text.Json.Serialization.JsonPropertyName("finishedAtUtc")] string? FinishedAtUtc,
        [property: System.Text.Json.Serialization.JsonPropertyName("laneCount")] int LaneCount,
        [property: System.Text.Json.Serialization.JsonPropertyName("reconciliationCount")] int ReconciliationCount,
        [property: System.Text.Json.Serialization.JsonPropertyName("entries")] IReadOnlyList<ManifestEntrySummary> Entries,
        [property: System.Text.Json.Serialization.JsonPropertyName("signature")] ManifestSignature Signature,
        [property: System.Text.Json.Serialization.JsonPropertyName("generator")] ManifestGenerator Generator);

    private sealed record ManifestEntrySummary(
        [property: System.Text.Json.Serialization.JsonPropertyName("name")] string Name,
        [property: System.Text.Json.Serialization.JsonPropertyName("sha256")] string Sha256,
        [property: System.Text.Json.Serialization.JsonPropertyName("byteCount")] int ByteCount);

    private sealed record ManifestSignature(
        [property: System.Text.Json.Serialization.JsonPropertyName("algorithm")] string Algorithm,
        [property: System.Text.Json.Serialization.JsonPropertyName("keyId")] string KeyId,
        [property: System.Text.Json.Serialization.JsonPropertyName("hex")] string Hex);

    private sealed record ManifestGenerator(
        [property: System.Text.Json.Serialization.JsonPropertyName("service")] string Service,
        [property: System.Text.Json.Serialization.JsonPropertyName("version")] string Version,
        [property: System.Text.Json.Serialization.JsonPropertyName("generatedAtUtc")] string GeneratedAtUtc);
}
