using System.Security.Cryptography;
using System.Text.Json;
using TerraFusion.Sync.Workbench.Schema;

namespace TerraFusion.API.Services.Sync;

/// <summary>
/// Offline PII gate for GET/HEAD sync/comps/eligible only. Configuration selects
/// reviewed, county-bound metadata; neither missing metadata nor a live PACS
/// catalog is an acceptable fallback. This service never reads canonical rows.
/// </summary>
public sealed class CanonicalLandingPiiBoundary(IConfiguration configuration)
{
    private const string Consumer = "sync.comps.eligible";
    private const int MaxArtifactBytes = 4 * 1024 * 1024;
    private static readonly string[] ProjectedFields =
    [
        "ChgOfOwnerId", "WacCdSourceValue", "WacCdCanonicalValue",
        "SlRatioTypeCdSourceValue", "SlRatioTypeCdCanonicalValue", "SaleDate",
        "SalePrice", "SourceWorkbookId", "SourceWorkbookLockedAt",
    ];
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<bool> IsVerifiedAsync(Guid countyId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        if (countyId == Guid.Empty) return false;
        var config = configuration.GetSection($"Sync:CanonicalLandingPii:Counties:{countyId:D}");
        var manifestPath = config["ManifestPath"];
        var schemaPath = config["SchemaPath"];
        var manifestHash = config["ManifestSha256"];
        var schemaHash = config["SchemaSha256"];
        if (!IsLocalPath(manifestPath) || !IsLocalPath(schemaPath)
            || !IsHash(manifestHash) || !IsHash(schemaHash)) return false;

        try
        {
            // Own immutable-for-this-request snapshots. Hash, shape validation
            // and parsing consume these bytes, never a second pathname lookup.
            var manifestBytes = await ReadSnapshotAsync(manifestPath!, ct);
            var bytes = await ReadSnapshotAsync(schemaPath!, ct);
            if (manifestBytes is null || bytes is null) return false;
            if (!HashMatches(manifestBytes, manifestHash!) || !HashMatches(bytes, schemaHash!)) return false;
            var snapshot = JsonSerializer.Deserialize<ReviewedSchema>(bytes, JsonOptions);
            if (snapshot is null || snapshot.CountyId != countyId || snapshot.Consumer != Consumer
                || !string.Equals(snapshot.ManifestSha256, manifestHash, StringComparison.OrdinalIgnoreCase)
                || snapshot.Schema is null || snapshot.Projection is null) return false;

            var data = snapshot.Schema;
            // Do not accept embedded classifications/manifests or disabled
            // schema checks as substitutes for the separately pinned manifest.
            if (data.Tables is null || data.Columns is null || data.Dictionaries is null || data.Version is null
                || data.PiiManifest is not null || data.SuppressInvariants is { Count: > 0 }
                || data.Version.SourceFileHashes is null || data.Version.SourceFileHashes.Count == 0
                || data.Tables.Any(t => t is null || t.IdentityTuple is null || t.ForeignKeys is null || t.DictionaryReferences is null
                    || t.ForeignKeys.Any(f => f is null || f.SourceColumns is null || f.TargetColumns is null)
                    || t.DictionaryReferences.Any(d => d is null))
                || data.Columns.Any(c => c is null) || data.Dictionaries.Any(d => d is null)) return false;

            if (!await HasNonNullManifestEntriesAsync(manifestBytes, ct)) return false;
            var manifest = await new JsonFilePacsPiiManifestSource(manifestPath).ReadAsync(manifestBytes, ct);
            if (manifest is null) return false;
            var tableNames = data.Tables.Select(t => t.TableName).ToHashSet(StringComparer.Ordinal);
            var columnNames = data.Columns.Select(c => (c.TableName, c.ColumnName)).ToHashSet();
            if (manifest.TableExhaustiveFlags.Any(t => !tableNames.Contains(t))
                || manifest.TableEntries.Any(t => !tableNames.Contains(t.TableName))
                || manifest.ColumnEntries.Any(c => !columnNames.Contains((c.TableName, c.ColumnName)))) return false;

            var tablePii = manifest.TableEntries.ToDictionary(t => t.TableName, t => t.Classification, StringComparer.Ordinal);
            var columnPii = manifest.ColumnEntries.ToDictionary(c => (c.TableName, c.ColumnName), c => c.Classification);
            var classified = data with
            {
                Tables = data.Tables.Select(t => t with { PiiClassification = tablePii.GetValueOrDefault(t.TableName) }).ToArray(),
                Columns = data.Columns.Select(c => c with
                {
                    PiiClassification = columnPii.GetValueOrDefault((c.TableName, c.ColumnName), tablePii.GetValueOrDefault(c.TableName)),
                }).ToArray(),
                PiiManifest = manifest,
            };
            var catalog = await PacsSchemaCatalog.BuildAsync(new InMemoryPacsSchemaSource(classified), ct);
            var preflight = new PiiClassificationPreflight();
            foreach (var field in ProjectedFields)
            {
                if (!snapshot.Projection.TryGetValue(field, out var sources) || sources is null || sources.Count == 0) return false;
                foreach (var source in sources)
                {
                    // The legacy preflight falls back to a table classification
                    // for an unknown column. Strict consumer provenance cannot.
                    if (source is null || string.IsNullOrWhiteSpace(source.Table) || string.IsNullOrWhiteSpace(source.Column)
                        || !catalog.TryGetColumn(source.Table, source.Column).HasValue) return false;
                    var result = await preflight.ValidateAsync(catalog, source.Table, new[] { source.Column },
                        PiiClassificationPreflightStance.RequirePiiFreeCanonicalLanding, ct);
                    if (result.Outcome != PiiClassificationPreflightOutcome.Pass) return false;
                }
            }
            return true;
        }
        catch (Exception ex) when (ex is IOException or InvalidDataException or UnauthorizedAccessException or JsonException
            or ArgumentException or InvalidOperationException or NotSupportedException)
        {
            // Return only the public UNKNOWN_DENY contract. Never expose a
            // configured filesystem path, parser excerpt, or schema metadata.
            return false;
        }
    }

    private static async Task<byte[]?> ReadSnapshotAsync(string path, CancellationToken ct)
    {
        using var file = File.Open(path, FileMode.Open, FileAccess.Read, FileShare.Read);
        if (file.Length > MaxArtifactBytes) return null;
        var bytes = new byte[checked((int)file.Length)];
        await file.ReadExactlyAsync(bytes, ct);
        return bytes;
    }

    private static async Task<bool> HasNonNullManifestEntriesAsync(byte[] snapshot, CancellationToken ct)
    {
        // The shared parser validates entry fields but dereferences null array
        // elements. Validate that input shape here, not via a programming-error
        // catch. Match its BOM, comments, trailing commas and property casing.
        using var stream = new MemoryStream(snapshot, writable: false);
        using var reader = new StreamReader(stream);
        using var document = JsonDocument.Parse(await reader.ReadToEndAsync(ct), new JsonDocumentOptions
        {
            CommentHandling = JsonCommentHandling.Skip,
            AllowTrailingCommas = true,
        });
        if (document.RootElement.ValueKind != JsonValueKind.Object) return false;
        foreach (var property in document.RootElement.EnumerateObject())
        {
            if ((string.Equals(property.Name, "tables", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(property.Name, "columns", StringComparison.OrdinalIgnoreCase))
                && property.Value.ValueKind == JsonValueKind.Array
                && property.Value.EnumerateArray().Any(entry => entry.ValueKind == JsonValueKind.Null)) return false;
        }
        return true;
    }

    private static bool IsLocalPath(string? path) => !string.IsNullOrWhiteSpace(path)
        && Path.IsPathFullyQualified(path) && !path.StartsWith(@"\\", StringComparison.Ordinal)
        && !path.StartsWith("//", StringComparison.Ordinal);

    private static bool IsHash(string? hash) => hash is { Length: 64 } && hash.All(Uri.IsHexDigit);

    private static bool HashMatches(ReadOnlySpan<byte> snapshot, string expected) =>
        string.Equals(Convert.ToHexString(SHA256.HashData(snapshot)), expected, StringComparison.OrdinalIgnoreCase);

    // County/consumer binding belongs to this consumer envelope, not the
    // existing county-agnostic PACS schema records. Projection is reviewed
    // provenance for every field in the eligible-comps response contract.
    private sealed record ReviewedSchema(Guid CountyId, string Consumer, string ManifestSha256,
        PacsSchemaSourceData Schema, IReadOnlyDictionary<string, IReadOnlyList<SourceColumn>> Projection);
    private sealed record SourceColumn(string Table, string Column);
}
