// Slice C48-E live-endpoint-proof smoke runner.
//
// Exercises the C48-C / C48-D code path (LivePacsSchemaSource over
// SqlInformationSchemaIntrospector) against the operator's local Harris PACS
// database. Produces the same SchemaCatalogSummaryDto shape the production
// admin endpoint returns, written as a JSON artifact next to this file.
//
// Per the C48-E Execution Card:
//  - Reads metadata only (HG1 PII-free; the introspector queries
//    INFORMATION_SCHEMA only and never SELECT * against user tables).
//  - No mutation of PACS or TerraFusion DB.
//  - No workbook touching.
//  - Connection string supplied via env var; never written to artifact.

using System.Text.Json;
using TerraFusion.Sync.Workbench.Schema;

const string EnvConnString  = "C48E_HARRIS_PACS_CONN";
const string EnvPacsRelease = "C48E_PACS_RELEASE";
const string EnvSourceLabel = "C48E_SOURCE_LABEL";
const string EnvSchemaName  = "C48E_SCHEMA_NAME";

var connString = Environment.GetEnvironmentVariable(EnvConnString);
if (string.IsNullOrWhiteSpace(connString))
{
    Console.Error.WriteLine($"[c48e-smoke] {EnvConnString} env var not set. Aborting.");
    Console.Error.WriteLine($"[c48e-smoke] Expected pattern: 'Server=localhost,1433;Database=pacs_oltp;User Id=sa;Password=<pwd>;TrustServerCertificate=True;Encrypt=True;Application Name=TerraFusion-OS-C48E-smoke;'");
    return 2;
}

var sourceLabel = Environment.GetEnvironmentVariable(EnvSourceLabel) ?? "harris-pacs-prod-c48e";
var schemaName  = Environment.GetEnvironmentVariable(EnvSchemaName)  ?? "dbo";
var pacsRelease = Environment.GetEnvironmentVariable(EnvPacsRelease);

Console.Out.WriteLine($"[c48e-smoke] source={sourceLabel} schema={schemaName} release={pacsRelease ?? "(unset)"}");
Console.Out.WriteLine($"[c48e-smoke] introspecting Harris PACS via INFORMATION_SCHEMA …");

var introspector = new SqlInformationSchemaIntrospector(connString!, schemaName);
var liveSource = new LivePacsSchemaSource(
    introspector,
    new LivePacsSchemaSourceOptions(sourceLabel, schemaName, pacsRelease));

var startedUtc = DateTime.UtcNow;
IPacsSchemaCatalog catalog;
try
{
    catalog = await PacsSchemaCatalog.BuildAsync(liveSource, CancellationToken.None);
}
catch (Exception ex)
{
    Console.Error.WriteLine($"[c48e-smoke] FAILED to build catalog: {ex.GetType().Name}: {ex.Message}");
    return 1;
}
var elapsed = DateTime.UtcNow - startedUtc;

// Produce the same wire shape SchemaCatalogSummaryDto exposes (C48-D).
// Fields are intentionally named to match the DTO (camelCase via
// JsonNamingPolicy below) so artifact diffs against future endpoint runs
// are mechanical.
// Slice C49-FK-B: aggregate FK counts by confidence level for the
// summary artifact. Walking every PacsTable.ForeignKeys is cheap
// (already resident in memory).
int declaredFkCount = 0;
int exportedFkCount = 0;
int inferredFkCount = 0;
foreach (var t in catalog.Tables)
{
    foreach (var fk in t.ForeignKeys)
    {
        switch (fk.Confidence)
        {
            case PacsForeignKeyConfidence.Declared:       declaredFkCount++; break;
            case PacsForeignKeyConfidence.Exported:       exportedFkCount++; break;
            case PacsForeignKeyConfidence.InferredByName: inferredFkCount++; break;
        }
    }
}
int totalFkCount = declaredFkCount + exportedFkCount + inferredFkCount;

var summary = new
{
    configured       = true,
    tableCount       = catalog.Coverage.TableCount,
    columnCount      = catalog.Coverage.ColumnCount,
    dictionaryCount  = catalog.Coverage.DictionaryCount,
    foreignKeyCount  = new
    {
        total          = totalFkCount,
        declared       = declaredFkCount,
        exported       = exportedFkCount,
        inferredByName = inferredFkCount,
    },
    pacsRelease      = catalog.Version.PacsRelease,
    ingestedAtUtc    = catalog.Version.IngestedAt.ToString("O"),
    proof = new
    {
        slice          = "C49-FK-B",
        sourceLabel,
        schemaName,
        elapsedMs      = (long)elapsed.TotalMilliseconds,
        identityProof  = "live-introspection-via-information-schema",
        piiFreeProof   = "introspector-queries-information-schema-only",
        mutationProof  = "no-writes-zero-side-effects",
        fkPolicyRef    = "docs/sync/pacs-schema-foreign-key-inference-policy.md",
    }
};

var json = JsonSerializer.Serialize(summary, new JsonSerializerOptions
{
    WriteIndented = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
});

Console.Out.WriteLine();
Console.Out.WriteLine(json);

var stamp = startedUtc.ToString("yyyyMMddTHHmmssZ");
var artifactPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..",
    $"c48e-live-summary.{stamp}.json");
artifactPath = Path.GetFullPath(artifactPath);
File.WriteAllText(artifactPath, json);
Console.Out.WriteLine();
Console.Out.WriteLine($"[c48e-smoke] artifact: {artifactPath}");
Console.Out.WriteLine($"[c48e-smoke] coverage: tables={catalog.Coverage.TableCount} columns={catalog.Coverage.ColumnCount} dictionaries={catalog.Coverage.DictionaryCount}");
Console.Out.WriteLine($"[c48e-smoke] OK in {elapsed.TotalMilliseconds:F0} ms");

return 0;
