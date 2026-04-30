// Slice C49-FK-D live preflight smoke.
//
// Builds the catalog from live Harris PACS via the same C48-C/E
// LivePacsSchemaSource path the c48-e smoke uses, then runs
// DictionaryLoaderPreflight against the SyncAtlas property_use
// loader's expected FK shape:
//
//     property_val.property_use_cd → property_use.property_use_cd
//
// Verifies that the catalog returns this FK as Declared (engine-
// enforced) and the preflight produces a Pass outcome carrying the
// matched edge. Captures the result as a JSON artifact next to this
// file.

using System.Text.Json;
using TerraFusion.Sync.Workbench.Pacs;
using TerraFusion.Sync.Workbench.Schema;

const string EnvConnString  = "C48E_HARRIS_PACS_CONN";
const string EnvSourceLabel = "C48E_SOURCE_LABEL";
const string EnvSchemaName  = "C48E_SCHEMA_NAME";

var connString = Environment.GetEnvironmentVariable(EnvConnString);
if (string.IsNullOrWhiteSpace(connString))
{
    Console.Error.WriteLine($"[c49fkd-smoke] {EnvConnString} env var not set. Aborting.");
    return 2;
}

var sourceLabel = Environment.GetEnvironmentVariable(EnvSourceLabel) ?? "harris-pacs-prod-c49fkd";
var schemaName  = Environment.GetEnvironmentVariable(EnvSchemaName)  ?? "dbo";

Console.Out.WriteLine($"[c49fkd-smoke] source={sourceLabel} schema={schemaName}");
Console.Out.WriteLine($"[c49fkd-smoke] building catalog...");

var introspector = new SqlInformationSchemaIntrospector(connString!, schemaName);
var liveSource = new LivePacsSchemaSource(
    introspector,
    new LivePacsSchemaSourceOptions(sourceLabel, schemaName, PacsReleaseLabel: "Harris PACS 9.0", InferDictionaries: true));

var startedUtc = DateTime.UtcNow;
IPacsSchemaCatalog catalog;
try
{
    catalog = await PacsSchemaCatalog.BuildAsync(liveSource, CancellationToken.None);
}
catch (Exception ex)
{
    Console.Error.WriteLine($"[c49fkd-smoke] catalog build FAILED: {ex.GetType().Name}: {ex.Message}");
    return 1;
}
var catalogElapsed = DateTime.UtcNow - startedUtc;
Console.Out.WriteLine($"[c49fkd-smoke] catalog built in {catalogElapsed.TotalMilliseconds:F0} ms");

// SyncAtlas property_use config (per C22-B-live inspection + C48-H migration).
var target = new DictionaryLoaderTargetConfig(
    WorkbookSourceSchema:  "dbo",
    WorkbookSourceTable:   "property_val",
    WorkbookSourceColumn:  "property_use_cd",
    PacsDictionarySchema:  "dbo",
    PacsDictionaryTable:   "property_use",
    CanonicalTargetName:   "PropertyUse");
var columns = new DictionaryColumnConfig(
    CodeColumn:           "property_use_cd",
    DescriptionColumn:    "property_use_desc",
    ActiveFlagColumn:     null,
    ActiveFlagPredicate:  null,
    YearColumn:           null);

var preflight = new DictionaryLoaderPreflight();

Console.Out.WriteLine($"[c49fkd-smoke] running preflight (RequiredFk stance) against property_use shape...");
var preflightStartedUtc = DateTime.UtcNow;
var requiredResult = await preflight.ValidateAsync(
    catalog, target, columns,
    DictionaryLoaderPreflightStance.RequiredFk,
    CancellationToken.None);
var preflightElapsed = DateTime.UtcNow - preflightStartedUtc;

// Also run with AdvisoryFk for completeness (same shape, same outcome
// expected since the FK is declared on Benton's PACS).
var advisoryResult = await preflight.ValidateAsync(
    catalog, target, columns,
    DictionaryLoaderPreflightStance.AdvisoryFk,
    CancellationToken.None);

var summary = new
{
    catalog = new
    {
        tableCount       = catalog.Coverage.TableCount,
        columnCount      = catalog.Coverage.ColumnCount,
        dictionaryCount  = catalog.Coverage.DictionaryCount,
        ingestedAtUtc    = catalog.Version.IngestedAt.ToString("O"),
        elapsedMs        = (long)catalogElapsed.TotalMilliseconds,
    },
    preflight = new
    {
        target = new
        {
            sourceTable    = target.WorkbookSourceTable,
            sourceColumn   = target.WorkbookSourceColumn,
            targetTable    = target.PacsDictionaryTable,
            codeColumn     = columns.CodeColumn,
        },
        requiredStance = new
        {
            outcome      = requiredResult.Outcome.ToString(),
            message      = requiredResult.Message,
            matchedEdge  = requiredResult.MatchedEdge is null ? null : new
            {
                constraintName  = requiredResult.MatchedEdge.ConstraintName,
                confidence      = requiredResult.MatchedEdge.Confidence.ToString(),
                provenanceSource = requiredResult.MatchedEdge.ProvenanceSource.ToString(),
                sourceColumns   = requiredResult.MatchedEdge.SourceColumns.ToArray(),
                targetTable     = requiredResult.MatchedEdge.TargetTable,
                targetColumns   = requiredResult.MatchedEdge.TargetColumns.ToArray(),
            },
        },
        advisoryStance = new
        {
            outcome      = advisoryResult.Outcome.ToString(),
            message      = advisoryResult.Message,
        },
        elapsedMs = (long)preflightElapsed.TotalMilliseconds,
    },
    proof = new
    {
        slice            = "C49-FK-D",
        sourceLabel,
        schemaName,
        identityProof    = "live-introspection-via-information-schema",
        piiFreeProof     = "introspector-queries-information-schema-only",
        mutationProof    = "no-writes-zero-side-effects",
        policyRefs       = new[]
        {
            "docs/sync/pacs-schema-foreign-key-inference-policy.md",
            "docs/sync/pacs-schema-fk-consumer-migration-policy.md",
        },
    },
};

var json = JsonSerializer.Serialize(summary, new JsonSerializerOptions
{
    WriteIndented = true,
    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
});

Console.Out.WriteLine();
Console.Out.WriteLine(json);

var stamp = startedUtc.ToString("yyyyMMddTHHmmssZ");
var artifactPath = Path.Combine(AppContext.BaseDirectory, "..", "..", "..",
    $"c49fkd-preflight-summary.{stamp}.json");
artifactPath = Path.GetFullPath(artifactPath);
File.WriteAllText(artifactPath, json);
Console.Out.WriteLine();
Console.Out.WriteLine($"[c49fkd-smoke] artifact: {artifactPath}");
Console.Out.WriteLine($"[c49fkd-smoke] required: {requiredResult.Outcome}, advisory: {advisoryResult.Outcome}");

// Non-zero exit if Required stance did not Pass — the smoke's success
// criterion is that property_use's FK is engine-declared on Benton.
return requiredResult.Outcome == DictionaryLoaderPreflightOutcome.Pass ? 0 : 1;
