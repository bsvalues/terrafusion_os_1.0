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
using TerraFusion.Core.Sync.Doctrine;
using TerraFusion.Core.Sync.Workbench;

namespace TerraFusion.Data.Services.Workbench;

/// <summary>
/// SYNC-WORKBENCH-H implementation of
/// <see cref="IEvidencePacketService"/>.
///
/// <para>Reads only — no transactions, no mutations. Builds the
/// evidence ZIP entirely in memory using deterministic ordering and
/// stable byte-level encoding so a re-build of the same commit
/// against the same HMAC key produces the same bytes.</para>
///
/// <para>The HMAC signature covers the manifest JSON serialized with
/// <c>signature.hex</c> blanked to <c>""</c>. The final manifest
/// embedded in the ZIP carries the real hex value. Verifiers
/// reproduce by re-zeroing the field before recomputation.</para>
/// </summary>
public sealed class EvidencePacketService : IEvidencePacketService
{
    /// <summary>Manifest schema version. Increment when shape changes.</summary>
    public const string SchemaVersion = "1.0";

    /// <summary>Generator service identifier embedded in manifests.</summary>
    public const string GeneratorService = "TerraFusion.Workbench.H";

    /// <summary>Generator version embedded in manifests.</summary>
    public const string GeneratorVersion = "1.0.0";

    private const string HmacKeyConfigPath = "Workbench:Evidence:HmacKey";
    private const string KeyIdConfigPath = "Workbench:Evidence:KeyId";
    private const int MinHmacKeyByteLength = 32;
    private const string HmacAlgorithm = "HMAC-SHA256";
    private const string DefaultKeyId = "default";

    /// <summary>Canonical universe order for distribution CSV.</summary>
    private static readonly string[] UniverseOrder = new[]
    {
        UniverseCodes.RealResidential,
        UniverseCodes.RealCommercial,
        UniverseCodes.MobileHome,
        UniverseCodes.AgCurrentUse,
        UniverseCodes.PersonalProperty,
        UniverseCodes.ConversionLegacy,
        UniverseCodes.Unknown,
    };

    /// <summary>
    /// Canonical 4-cell ratio distribution order:
    /// (DorQ,CountyQ), (DorQ,CountyN), (DorN,CountyQ), (DorN,CountyN).
    /// </summary>
    private static readonly (bool DorQ, bool CountyQ)[] RatioOrder = new[]
    {
        (true, true),
        (true, false),
        (false, true),
        (false, false),
    };

    private static readonly JsonSerializerOptions ManifestSerializerOptions = new()
    {
        WriteIndented = true,
    };

    private static readonly DateTime DeterministicZipTimestamp =
        new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private readonly TerraFusionDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly Func<DateTime> _utcNow;

    public EvidencePacketService(
        TerraFusionDbContext db,
        IConfiguration configuration)
        : this(db, configuration, () => DateTime.UtcNow)
    {
    }

    /// <summary>Test-only constructor: pin <c>generatedAtUtc</c> for determinism.</summary>
    public EvidencePacketService(
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

    public async Task<EvidencePacketResult> BuildAsync(
        Guid commitId,
        CancellationToken cancellationToken = default)
    {
        var prepared = await PrepareAsync(commitId, cancellationToken).ConfigureAwait(false);
        if (prepared.Outcome != EvidencePacketOutcome.Ok)
            return new EvidencePacketResult(
                prepared.Outcome,
                prepared.ErrorMessage,
                null,
                null,
                null);

        // Build the four CSV entries first (their bytes feed the
        // manifest's entry SHA256s).
        var decisionsCsv = BuildDecisionsCsv(prepared.Decisions!);
        var universeCsv = BuildUniverseCsv(prepared.Commit!.UniverseDistributionJson);
        var ratioCsv = BuildRatioCsv(prepared.Commit.RatioDistributionJson);
        var auditCsv = BuildAuditTrailCsv(prepared.Commit);

        var entries = new[]
        {
            new EvidenceEntry(EvidencePacketEntries.Decisions, decisionsCsv),
            new EvidenceEntry(EvidencePacketEntries.UniverseDistribution, universeCsv),
            new EvidenceEntry(EvidencePacketEntries.RatioDistribution, ratioCsv),
            new EvidenceEntry(EvidencePacketEntries.AuditTrail, auditCsv),
        };

        var manifestBytes = BuildSignedManifest(
            prepared.Commit,
            prepared.Decisions!.Count,
            entries,
            prepared.HmacKey!,
            prepared.KeyId!,
            out var signatureHex);

        // Assemble the ZIP. Order is fixed: manifest first, then the
        // four CSV entries in declared order.
        using var zipStream = new MemoryStream();
        using (var archive = new ZipArchive(zipStream, ZipArchiveMode.Create, leaveOpen: true))
        {
            WriteZipEntry(archive, EvidencePacketEntries.Manifest, manifestBytes);
            foreach (var entry in entries)
                WriteZipEntry(archive, entry.Name, entry.Content);
        }

        var fileName = BuildFileName(prepared.Commit);

        return new EvidencePacketResult(
            EvidencePacketOutcome.Ok,
            null,
            fileName,
            zipStream.ToArray(),
            signatureHex);
    }

    public async Task<EvidenceManifestResult> BuildManifestAsync(
        Guid commitId,
        CancellationToken cancellationToken = default)
    {
        var prepared = await PrepareAsync(commitId, cancellationToken).ConfigureAwait(false);
        if (prepared.Outcome != EvidencePacketOutcome.Ok)
            return new EvidenceManifestResult(
                prepared.Outcome,
                prepared.ErrorMessage,
                null,
                null);

        var decisionsCsv = BuildDecisionsCsv(prepared.Decisions!);
        var universeCsv = BuildUniverseCsv(prepared.Commit!.UniverseDistributionJson);
        var ratioCsv = BuildRatioCsv(prepared.Commit.RatioDistributionJson);
        var auditCsv = BuildAuditTrailCsv(prepared.Commit);

        var entries = new[]
        {
            new EvidenceEntry(EvidencePacketEntries.Decisions, decisionsCsv),
            new EvidenceEntry(EvidencePacketEntries.UniverseDistribution, universeCsv),
            new EvidenceEntry(EvidencePacketEntries.RatioDistribution, ratioCsv),
            new EvidenceEntry(EvidencePacketEntries.AuditTrail, auditCsv),
        };

        var manifestBytes = BuildSignedManifest(
            prepared.Commit,
            prepared.Decisions!.Count,
            entries,
            prepared.HmacKey!,
            prepared.KeyId!,
            out _);

        return new EvidenceManifestResult(
            EvidencePacketOutcome.Ok,
            null,
            BuildFileName(prepared.Commit),
            manifestBytes);
    }

    // ── Pipeline helpers ─────────────────────────────────────────────

    private async Task<PreparedPacket> PrepareAsync(
        Guid commitId,
        CancellationToken cancellationToken)
    {
        if (commitId == Guid.Empty)
            return PreparedPacket.Failure(
                EvidencePacketOutcome.NotFound,
                $"Commit '{commitId}' not found.");

        var keyResult = TryReadHmacKey();
        if (!keyResult.Ok)
            return PreparedPacket.Failure(
                EvidencePacketOutcome.ConfigurationError,
                keyResult.Error!);

        var commit = await _db.WorkbenchCommits
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CommitId == commitId, cancellationToken)
            .ConfigureAwait(false);

        if (commit is null)
            return PreparedPacket.Failure(
                EvidencePacketOutcome.NotFound,
                $"Commit '{commitId}' not found.");

        var decisions = await _db.WorkbenchCommitDecisionLinks
            .AsNoTracking()
            .Where(l => l.CommitId == commitId)
            .OrderBy(l => l.LinkId)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PreparedPacket(
            EvidencePacketOutcome.Ok,
            null,
            commit,
            decisions,
            keyResult.Key,
            keyResult.KeyId);
    }

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
        if (string.IsNullOrWhiteSpace(keyId))
            keyId = DefaultKeyId;

        return (true, bytes, keyId, null);
    }

    // ── Manifest assembly + HMAC ─────────────────────────────────────

    private byte[] BuildSignedManifest(
        WorkbenchCommit commit,
        int decisionCount,
        IReadOnlyList<EvidenceEntry> entries,
        byte[] hmacKey,
        string keyId,
        out string signatureHex)
    {
        // Build the manifest object with the signature placeholder
        // (hex = ""), serialize it deterministically, sign that exact
        // byte sequence, then patch the placeholder string for the
        // emitted manifest bytes. Verifiers reproduce by re-zeroing
        // the signature.hex before HMAC.
        const string SignaturePlaceholder = "";

        var manifest = BuildManifestObject(
            commit,
            decisionCount,
            entries,
            keyId,
            SignaturePlaceholder);

        var placeholderBytes = JsonSerializer.SerializeToUtf8Bytes(
            manifest,
            ManifestSerializerOptions);

        using var hmac = new HMACSHA256(hmacKey);
        var signatureBytes = hmac.ComputeHash(placeholderBytes);
        signatureHex = Convert.ToHexString(signatureBytes).ToLowerInvariant();

        // Replace the placeholder in the manifest with the real hex
        // value. The two hex strings have predictable shape so we
        // patch by rebuilding the object — cheaper to re-serialize
        // than to do a string-replace on the bytes.
        var signedManifest = BuildManifestObject(
            commit,
            decisionCount,
            entries,
            keyId,
            signatureHex);

        return JsonSerializer.SerializeToUtf8Bytes(
            signedManifest,
            ManifestSerializerOptions);
    }

    private ManifestRoot BuildManifestObject(
        WorkbenchCommit commit,
        int decisionCount,
        IReadOnlyList<EvidenceEntry> entries,
        string keyId,
        string signatureHex)
    {
        var entrySummaries = new List<ManifestEntrySummary>(entries.Count);
        foreach (var entry in entries)
        {
            entrySummaries.Add(new ManifestEntrySummary(
                Name: entry.Name,
                Sha256: ComputeSha256Hex(entry.Content),
                ByteCount: entry.Content.Length));
        }

        return new ManifestRoot(
            SchemaVersion: SchemaVersion,
            CommitId: commit.CommitId,
            CommittedAtUtc: FormatUtc(commit.CommittedAt),
            OperatorId: commit.OperatorId,
            IdempotencyKey: commit.IdempotencyKey,
            CommitNote: commit.CommitNote,
            RoutedDecisionsApplied: commit.RoutedDecisionsApplied,
            DismissedDecisionsApplied: commit.DismissedDecisionsApplied,
            DecisionCount: decisionCount,
            Entries: entrySummaries,
            Signature: new ManifestSignature(
                Algorithm: HmacAlgorithm,
                KeyId: keyId,
                Hex: signatureHex),
            Generator: new ManifestGenerator(
                Service: GeneratorService,
                Version: GeneratorVersion,
                GeneratedAtUtc: FormatUtc(_utcNow())));
    }

    // ── CSV builders ─────────────────────────────────────────────────

    private static byte[] BuildDecisionsCsv(IReadOnlyList<WorkbenchCommitDecisionLink> decisions)
    {
        var sb = new StringBuilder();
        sb.Append("LinkId,TriageId,UnprovenRowId,DecisionType,RoutedToUniverse,RoutedToIAttrValCd,DismissalReason,CreatedAt\n");

        foreach (var d in decisions)
        {
            sb.Append(CsvEscape(d.LinkId.ToString())).Append(',');
            sb.Append(CsvEscape(d.TriageId.ToString())).Append(',');
            sb.Append(CsvEscape(d.UnprovenRowId.ToString())).Append(',');
            sb.Append(CsvEscape(d.DecisionType)).Append(',');
            sb.Append(CsvEscape(d.RoutedToUniverse ?? string.Empty)).Append(',');
            sb.Append(CsvEscape(d.RoutedToIAttrValCd ?? string.Empty)).Append(',');
            sb.Append(CsvEscape(d.DismissalReason ?? string.Empty)).Append(',');
            sb.Append(CsvEscape(FormatUtc(d.CreatedAt)));
            sb.Append('\n');
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static byte[] BuildUniverseCsv(string universeJson)
    {
        var distribution = ParseDistributionJson(universeJson);

        var sb = new StringBuilder();
        sb.Append("UniverseCode,Count\n");
        foreach (var cell in UniverseOrder)
        {
            distribution.TryGetValue(cell, out var count);
            sb.Append(CsvEscape(cell)).Append(',');
            sb.Append(count.ToString(CultureInfo.InvariantCulture));
            sb.Append('\n');
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static byte[] BuildRatioCsv(string ratioJson)
    {
        var distribution = ParseDistributionJson(ratioJson);

        var sb = new StringBuilder();
        sb.Append("DorRatioQualified,CountyRatioQualified,Count\n");
        foreach (var (dorQ, countyQ) in RatioOrder)
        {
            var key = (dorQ, countyQ) switch
            {
                (true, true) => RatioDistributionCells.DorQ_CountyQ,
                (true, false) => RatioDistributionCells.DorQ_CountyN,
                (false, true) => RatioDistributionCells.DorN_CountyQ,
                (false, false) => RatioDistributionCells.DorN_CountyN,
            };
            distribution.TryGetValue(key, out var count);
            sb.Append(dorQ ? "true" : "false").Append(',');
            sb.Append(countyQ ? "true" : "false").Append(',');
            sb.Append(count.ToString(CultureInfo.InvariantCulture));
            sb.Append('\n');
        }
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static byte[] BuildAuditTrailCsv(WorkbenchCommit commit)
    {
        var sb = new StringBuilder();
        sb.Append("CommitId,CreatedAt,UpdatedAt,CreatedBy,UpdatedBy\n");
        sb.Append(CsvEscape(commit.CommitId.ToString())).Append(',');
        sb.Append(CsvEscape(FormatUtc(commit.CreatedAt))).Append(',');
        sb.Append(CsvEscape(FormatUtc(commit.UpdatedAt))).Append(',');
        sb.Append(CsvEscape(commit.CreatedBy ?? string.Empty)).Append(',');
        sb.Append(CsvEscape(commit.UpdatedBy ?? string.Empty));
        sb.Append('\n');
        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    /// <summary>
    /// Parse a closed-vocabulary distribution JSON object of the
    /// form <c>{"key": int, ...}</c>. Treats malformed input as an
    /// empty distribution rather than throwing — the CSV still
    /// emits the canonical row set with zero-fill.
    /// </summary>
    private static Dictionary<string, int> ParseDistributionJson(string json)
    {
        var result = new Dictionary<string, int>(StringComparer.Ordinal);
        if (string.IsNullOrWhiteSpace(json))
            return result;

        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return result;
            foreach (var prop in doc.RootElement.EnumerateObject())
            {
                if (prop.Value.ValueKind == JsonValueKind.Number &&
                    prop.Value.TryGetInt32(out var i))
                {
                    result[prop.Name] = i;
                }
            }
        }
        catch (JsonException)
        {
            // Treat as empty.
        }

        return result;
    }

    // ── Encoding utilities ───────────────────────────────────────────

    /// <summary>RFC4180 CSV escape: quote only when needed.</summary>
    private static string CsvEscape(string field)
    {
        if (string.IsNullOrEmpty(field))
            return string.Empty;

        var needsQuoting = false;
        for (var i = 0; i < field.Length; i++)
        {
            var c = field[i];
            if (c == ',' || c == '"' || c == '\n' || c == '\r')
            {
                needsQuoting = true;
                break;
            }
        }

        if (!needsQuoting)
            return field;

        var escaped = field.Replace("\"", "\"\"", StringComparison.Ordinal);
        return $"\"{escaped}\"";
    }

    private static string FormatUtc(DateTime dt)
    {
        var utc = dt.Kind == DateTimeKind.Utc
            ? dt
            : DateTime.SpecifyKind(dt, DateTimeKind.Utc);
        return utc.ToString("yyyy-MM-ddTHH:mm:ss.fffZ", CultureInfo.InvariantCulture);
    }

    private static string ComputeSha256Hex(byte[] content)
    {
        var hash = SHA256.HashData(content);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static string BuildFileName(WorkbenchCommit commit)
    {
        var stamp = (commit.CommittedAt.Kind == DateTimeKind.Utc
                ? commit.CommittedAt
                : DateTime.SpecifyKind(commit.CommittedAt, DateTimeKind.Utc))
            .ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
        return $"terrafusion-evidence-{commit.CommitId}-{stamp}.zip";
    }

    private static void WriteZipEntry(ZipArchive archive, string name, byte[] content)
    {
        // Pin entry timestamp so re-builds produce byte-identical
        // ZIPs. ZipArchive uses CompressionLevel.Optimal default.
        var entry = archive.CreateEntry(name, CompressionLevel.NoCompression);
        entry.LastWriteTime = DeterministicZipTimestamp;
        using var stream = entry.Open();
        stream.Write(content, 0, content.Length);
    }

    // ── Internal records ─────────────────────────────────────────────

    private sealed record EvidenceEntry(string Name, byte[] Content);

    private sealed record PreparedPacket(
        EvidencePacketOutcome Outcome,
        string? ErrorMessage,
        WorkbenchCommit? Commit,
        IReadOnlyList<WorkbenchCommitDecisionLink>? Decisions,
        byte[]? HmacKey,
        string? KeyId)
    {
        public static PreparedPacket Failure(EvidencePacketOutcome outcome, string error) =>
            new(outcome, error, null, null, null, null);
    }

    // ── Manifest DTOs (PascalCase via property-name policy) ──────────
    //
    // System.Text.Json honors record property names verbatim; these
    // emit lowerCamel keys so we explicitly tag them with
    // [JsonPropertyName] for stable shape regardless of CLR-side
    // refactors.

    private sealed record ManifestRoot(
        [property: System.Text.Json.Serialization.JsonPropertyName("schemaVersion")] string SchemaVersion,
        [property: System.Text.Json.Serialization.JsonPropertyName("commitId")] Guid CommitId,
        [property: System.Text.Json.Serialization.JsonPropertyName("committedAtUtc")] string CommittedAtUtc,
        [property: System.Text.Json.Serialization.JsonPropertyName("operatorId")] string OperatorId,
        [property: System.Text.Json.Serialization.JsonPropertyName("idempotencyKey")] string IdempotencyKey,
        [property: System.Text.Json.Serialization.JsonPropertyName("commitNote")] string? CommitNote,
        [property: System.Text.Json.Serialization.JsonPropertyName("routedDecisionsApplied")] int RoutedDecisionsApplied,
        [property: System.Text.Json.Serialization.JsonPropertyName("dismissedDecisionsApplied")] int DismissedDecisionsApplied,
        [property: System.Text.Json.Serialization.JsonPropertyName("decisionCount")] int DecisionCount,
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
